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
CORS(app)
DB_URL = os.environ.get("DB_URL", "postgresql://postgres.qvohdszcnqeobrntkdbv:Database%401234%24@aws-0-ap-south-1.pooler.supabase.com:6543/postgres") + "?sslmode=require"

# --- LAZY LOADING SETUP ---
# Initialize models to None. They will be loaded on first use.
ml_model, model_features, nlp_model = None, None, None

def get_db_connection():
    """Establishes a new database connection."""
    return psycopg2.connect(DB_URL)

# --- MODEL AND NLP LOADING HELPER FUNCTIONS ---
def get_ml_model():
    """Loads the ML model into the global variable if it hasn't been loaded yet."""
    global ml_model, model_features
    if ml_model is None:
        try:
            print("--- LAZY LOADING: AI Synopsis model ---")
            ml_model = joblib.load('health_synopsis_model_v2.pkl')
            model_features = joblib.load('model_features_v2.pkl')
            print("✅ AI Synopsis model loaded successfully.")
        except Exception as e:
            print(f"FATAL: Could not load AI synopsis model. Error: {e}")
            ml_model, model_features = None, None
    return ml_model, model_features

def get_nlp_model():
    """Loads the NLP model into the global variable if it hasn't been loaded yet."""
    global nlp_model
    if nlp_model is None:
        try:
            print("--- LAZY LOADING: NLP model ---")
            nlp_model = spacy.load("en_core_web_sm")
            print("✅ NLP model loaded successfully.")
        except Exception as e:
            print(f"⚠️ WARNING: Could not load NLP model. Symptom analysis will be basic. Error: {e}")
            nlp_model = None
    return nlp_model


# --- AI HELPER FUNCTIONS ---
def analyze_symptoms_text(text):
    nlp = get_nlp_model() # Trigger lazy loading
    if not nlp or not text:
        return {"tags": [], "categories": []}
    doc = nlp(text.lower())
    SYMPTOM_KEYWORDS = { "headache": "neurological", "dizzy": "neurological", "nausea": "gastrointestinal", "chest pain": "cardiovascular" }
    identified_symptoms = list(set([token.lemma_ for token in doc if token.lemma_ in SYMPTOM_KEYWORDS]))
    return {"tags": identified_symptoms, "categories": [SYMPTOM_KEYWORDS.get(s) for s in identified_symptoms]}

def predict_future_risk(history_data):
    if len(history_data) < 3: return 0
    
    history_df = pd.DataFrame(history_data, columns=['systolic', 'diastolic', 'heart_rate', 'created_at'])
    
    # Correctly convert timestamp strings to datetime objects
    history_df['created_at'] = pd.to_datetime(history_df['created_at'])
    
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
    
    baseline = {'avg_systolic': 120, 'stddev_systolic': 8}
    if baseline_row and baseline_row[0] is not None and baseline_row[1] is not None:
        baseline = {'avg_systolic': baseline_row[0], 'stddev_systolic': baseline_row[1]}

    glucose = data.get('blood_glucose')
    if glucose:
        if glucose > 180: # Hyperglycemia risk
            risk_score += 30
            insights.append(f"Blood glucose ({glucose} mg/dL) is high.")
        elif glucose < 70: # Hypoglycemia risk
            risk_score += 40
            insights.append(f"WARNING: Blood glucose ({glucose} mg/dL) is low.")
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
    
    cur.execute("SELECT systolic, diastolic, heart_rate, created_at FROM patients_vitals WHERE user_id = %s ORDER BY created_at DESC LIMIT 7", (user_id,))
    history = cur.fetchall()
    predicted_risk = predict_future_risk(history)
    if predicted_risk > 50:
        risk_score += 25
        insights.append("Recent trends indicate a potential future risk.")

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
    cur.execute("SELECT systolic, diastolic, heart_rate,blood_glucose FROM patients_vitals WHERE user_id = %s AND created_at >= NOW() - INTERVAL '30 days'", (user_id,))
    vitals = cur.fetchall()
    
    if len(vitals) < 5:
        cur.close(), conn.close()
        return jsonify({"status": "not enough data"}), 200

    df = pd.DataFrame(vitals, columns=['systolic', 'diastolic', 'heart_rate'])
    baseline_numpy = {"avg_systolic": df['systolic'].mean(), "stddev_systolic": df['systolic'].std(), "avg_diastolic": df['diastolic'].mean(), "stddev_diastolic": df['diastolic'].std(), "avg_heart_rate": df['heart_rate'].mean(), "stddev_heart_rate": df['heart_rate'].std(),"avg_blood_glucose": df['blood_glucose'].mean(), "stddev_blood_glucose": df['blood_glucose'].std()}
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
    model, features = get_ml_model() # Trigger lazy loading
    if not model:
        return jsonify({"headline": "AI Synopsis feature is currently unavailable.", "key_findings": ["The prediction model could not be loaded."], "recommendation": "Please proceed with manual review."}), 503

    patient_id = request.json['patientId']
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT systolic, diastolic, heart_rate, symptoms_text, created_at , blood_glucose FROM patients_vitals WHERE user_id = %s ORDER BY created_at DESC LIMIT 7", (patient_id,))
    history = cur.fetchall()
    cur.close(), conn.close()

    if len(history) < 3:
        return jsonify({"headline": "Not enough recent data for a full synopsis.", "key_findings": ["Patient has logged vitals less than 3 times in the last week."], "recommendation": "Encourage more frequent logging to enable AI analysis."})

    df = pd.DataFrame(history, columns=['systolic', 'diastolic', 'heart_rate', 'symptoms_text', 'created_at','blood_glucose'])
    df = df.sort_values(by='created_at', ascending=True).reset_index(drop=True)

    df['has_symptoms'] = df['symptoms_text'].notna().astype(int)
    df['bp_mean_3d'] = df['systolic'].rolling(3, min_periods=1).mean()
    df['hr_mean_3d'] = df['heart_rate'].rolling(3, min_periods=1).mean()
    df['blood_glucose'] = df['blood_glucose'].fillna(100)
    df['glucose_mean_3d'] = df['blood_glucose'].rolling(3, min_periods=1).mean()
    
    latest_data_for_prediction = df.iloc[-1:][features]
    prediction = model.predict(latest_data_for_prediction)[0]
    probabilities = model.predict_proba(latest_data_for_prediction)[0]
    confidence = np.max(probabilities)

    synopsis = {
        "headline": f"AI analysis suggests patient's current state aligns with '{prediction}'.",
        "conclusion_class": prediction, "confidence_score": float(confidence),
        "key_findings": [ f"Most recent Systolic BP: {int(df.iloc[-1]['systolic'])} mmHg.", f"3-Day Average BP is approx. {int(df.iloc[-1]['bp_mean_3d'])} mmHg.",f"Most recent Blood Glucose: {int(df.iloc[-1]['blood_glucose'])} mg/dL.", "Recent symptoms were reported." if int(df.iloc[-1]['has_symptoms']) else "No recent symptoms reported." ],
        "recommendation": "Clinician to review patient data and trends for appropriate action."
    }
    return jsonify(synopsis)
@app.route('/api/health', methods=['GET'])
def health_check():
    """A simple endpoint for uptime monitors to hit."""
    return jsonify({"status": "ok"}), 200

if __name__ == '__main__':
     port = int(os.environ.get('PORT', 5001))
     app.run(debug=False, host='0.0.0.0', port=port)