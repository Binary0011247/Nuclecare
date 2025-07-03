import os
import spacy
import numpy as np
import pandas as pd
import psycopg2
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.linear_model import LinearRegression

# --- INITIALIZATION ---
app = Flask(__name__)
CORS(app) # Allow all routes from all origins

# Database Connection
DB_URL = os.environ.get("DB_URL", "postgresql://nuclecare_user:user%401234@localhost:5432/nuclecare_db")

def get_db_connection():
    return psycopg2.connect(DB_URL)

# --- MODEL AND NLP LOADING ---
# Load the ML model for synopsis generation
try:
    model = joblib.load('health_synopsis_model.pkl')
    model_features = joblib.load('model_features.pkl')
    print("✅ AI Synopsis model loaded successfully.")
except Exception as e:
    print(f"⚠️ WARNING: Could not load AI synopsis model. The /generate-synopsis endpoint will be disabled. Error: {e}")
    model = None

# Load the NLP model for symptom analysis
try:
    nlp = spacy.load("en_core_web_sm")
    print("✅ NLP model loaded successfully.")
except Exception as e:
    print(f"⚠️ WARNING: Could not load NLP model. Symptom analysis will be basic. Error: {e}")
    nlp = None

# --- AI HELPER FUNCTIONS ---

def analyze_symptoms_text(text):
    if not nlp or not text:
        return {"tags": [], "categories": []}
    doc = nlp(text.lower())
    # Define keywords inside the function for clarity
    SYMPTOM_KEYWORDS = { "headache": "neurological", "dizzy": "neurological", "nausea": "gastrointestinal", "chest pain": "cardiovascular" }
    identified_symptoms = list(set([token.lemma_ for token in doc if token.lemma_ in SYMPTOM_KEYWORDS]))
    return {"tags": identified_symptoms, "categories": [SYMPTOM_KEYWORDS.get(s) for s in identified_symptoms]}

def predict_future_risk(history_df):
    if len(history_df) < 3: return 0
    # Simple trend prediction on systolic pressure
    history_df['time'] = (history_df['created_at'] - history_df['created_at'].min()).dt.total_seconds() / 3600
    model_lr = LinearRegression()
    model_lr.fit(history_df[['time']], history_df['systolic'])
    future_time = history_df['time'].max() + 24
    predicted_systolic = model_lr.predict([[future_time]])[0]
    if predicted_systolic > 145: return 75
    if predicted_systolic > 135: return 40
    return 10

# --- API ENDPOINTS ---

@app.route('/api/calculate', methods=['POST'])
def calculate():
    """Calculates the real-time Health Score for the patient dashboard."""
    data = request.json
    user_id = data.get('userId')
    
    risk_score = 0
    insights = []

    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT avg_systolic, stddev_systolic FROM patient_baselines WHERE user_id = %s", (user_id,))
    baseline_row = cur.fetchone()
    
    baseline = {'avg_systolic': 120, 'stddev_systolic': 8} # Default
    if baseline_row and baseline_row[0] is not None and baseline_row[1] is not None:
        baseline = {'avg_systolic': baseline_row[0], 'stddev_systolic': baseline_row[1]}

    systolic = data.get('systolic')
    if systolic and baseline.get('stddev_systolic', 0) > 0:
        z_score = abs(systolic - baseline['avg_systolic']) / baseline['stddev_systolic']
        if z_score > 2.5:
            risk_score += 50
            insights.append(f"Systolic BP ({systolic}) is significantly higher than your personal average.")
        elif z_score > 1.5:
            risk_score += 25
            insights.append(f"Systolic BP ({systolic}) is elevated for you.")
    
    mood = data.get('mood')
    if mood and mood <= 2:
        risk_score += 15
        insights.append("Patient reported a low mood.")
    
    symptoms_text = data.get('symptoms', '')
    symptom_data = analyze_symptoms_text(symptoms_text)
    if symptom_data and symptom_data['tags']:
        risk_score += 20
        insights.append(f"Noted symptoms including: {', '.join(symptom_data['tags'])}.")
    
    cur.close()
    conn.close()

    final_risk_score = min(risk_score, 100)
    health_score = 100 - final_risk_score
    insight_summary = " ".join(insights) if insights else "Readings are within your normal range. Keep up the great work!"

    return jsonify({
        "healthScore": int(health_score),
        "insight": insight_summary,
        "symptomTags": symptom_data
    })

@app.route('/api/update-baseline', methods=['POST'])
def update_baseline():
    """Recalculates and saves a patient's personalized vitals baseline."""
    user_id = request.json['userId']
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT systolic, diastolic, heart_rate FROM patients_vitals WHERE user_id = %s AND created_at >= NOW() - INTERVAL '30 days'", (user_id,))
    vitals = cur.fetchall()
    
    if len(vitals) < 5:
        cur.close(), conn.close()
        return jsonify({"status": "not enough data"}), 200

    df = pd.DataFrame(vitals, columns=['systolic', 'diastolic', 'heart_rate'])
    baseline_numpy = {"avg_systolic": df['systolic'].mean(), "stddev_systolic": df['systolic'].std(), "avg_diastolic": df['diastolic'].mean(), "stddev_diastolic": df['diastolic'].std(), "avg_heart_rate": df['heart_rate'].mean(), "stddev_heart_rate": df['heart_rate'].std()}
    baseline_python = {key: float(value) if pd.notna(value) else None for key, value in baseline_numpy.items()}
    
    cur.execute("""
        INSERT INTO patient_baselines (user_id, avg_systolic, stddev_systolic, avg_diastolic, stddev_diastolic, avg_heart_rate, stddev_heart_rate) VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (user_id) DO UPDATE SET
            avg_systolic = EXCLUDED.avg_systolic, stddev_systolic = EXCLUDED.stddev_systolic, avg_diastolic = EXCLUDED.avg_diastolic, 
            stddev_diastolic = EXCLUDED.stddev_diastolic, avg_heart_rate = EXCLUDED.avg_heart_rate, stddev_heart_rate = EXCLUDED.stddev_heart_rate, last_updated = NOW();
        """,(user_id, baseline_python['avg_systolic'], baseline_python['stddev_systolic'], baseline_python['avg_diastolic'], baseline_python['stddev_diastolic'], baseline_python['avg_heart_rate'], baseline_python['stddev_heart_rate']))
    
    conn.commit()
    cur.close(), conn.close()
    return jsonify({"status": "success"}), 200

@app.route('/api/generate-synopsis', methods=['POST'])
def generate_synopsis():
    """Generates a full diagnostic report using the trained ML model."""
    if not model:
        return jsonify({"headline": "AI Synopsis feature is currently unavailable.", "key_findings": ["The prediction model could not be loaded."], "recommendation": "Please proceed with manual review."}), 503

    patient_id = request.json['patientId']
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT systolic, diastolic, heart_rate, symptoms_text, created_at FROM patients_vitals WHERE user_id = %s ORDER BY created_at DESC LIMIT 7", (patient_id,))
    history = cur.fetchall()
    cur.close(), conn.close()

    if len(history) < 3:
        return jsonify({"headline": "Not enough recent data for a full synopsis.", "key_findings": ["Patient has logged vitals less than 3 times in the last week."], "recommendation": "Encourage more frequent logging to enable AI analysis."})

    df = pd.DataFrame(history, columns=['systolic', 'diastolic', 'heart_rate', 'symptoms_text', 'created_at'])
    df = df.sort_values(by='created_at', ascending=True).reset_index(drop=True)

    df['has_symptoms'] = df['symptoms_text'].notna().astype(int)
    df['bp_mean_3d'] = df['systolic'].rolling(3, min_periods=1).mean()
    df['hr_mean_3d'] = df['heart_rate'].rolling(3, min_periods=1).mean()
    
    latest_data_for_prediction = df.iloc[-1:][model_features]
    prediction = model.predict(latest_data_for_prediction)[0]
    probabilities = model.predict_proba(latest_data_for_prediction)[0]
    confidence = np.max(probabilities)

    synopsis = {
        "headline": f"AI analysis suggests patient's current state aligns with '{prediction}'.",
        "conclusion_class": prediction,
        "confidence_score": float(confidence),
        "key_findings": [ f"Most recent Systolic BP: {int(df.iloc[-1]['systolic'])} mmHg.", f"3-Day Average BP is approx. {int(df.iloc[-1]['bp_mean_3d'])} mmHg.", "Recent symptoms were reported." if int(df.iloc[-1]['has_symptoms']) else "No recent symptoms reported." ],
        "recommendation": "Clinician to review patient data and trends for appropriate action."
    }
    return jsonify(synopsis)

if __name__ == '__main__':
     port = int(os.environ.get('PORT', 5001)) # Get port from Render, default to 5001
    app.run(debug=False, host='0.0.0.0', port=port) # Use 0.0.0.0 to listen on all interfaces