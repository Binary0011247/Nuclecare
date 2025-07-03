# ai/app.py
import os
import spacy
import numpy as np
import pandas as pd
import psycopg2
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.linear_model import LinearRegression

# --- INITIALIZATION ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5000"}})
nlp = spacy.load("en_core_web_sm")
DB_URL = os.environ.get("DB_URL", "postgresql://nuclecare_user:user%401234@localhost:5432/nuclecare_db")

def get_db_connection():
    conn = psycopg2.connect(DB_URL)
    return conn

# --- Symptom Analysis & Baseline Update Functions (No changes needed) ---
SYMPTOM_KEYWORDS = {
    "headache": "neurological", "dizzy": "neurological", "dizziness": "neurological",
    "nausea": "gastrointestinal", "sick": "gastrointestinal", "stomach ache": "gastrointestinal",
    "short of breath": "respiratory", "cough": "respiratory", "breathing difficulty": "respiratory",
    "chest pain": "cardiovascular", "palpitations": "cardiovascular", "swelling": "cardiovascular"
}

def analyze_symptoms_text(text):
    # ... This function is correct ...
    doc = nlp(text.lower())
    identified_symptoms = []
    for token in doc:
        if token.lemma_ in SYMPTOM_KEYWORDS:
            if token.lemma_ not in identified_symptoms:
                identified_symptoms.append(token.lemma_)
    return {"tags": identified_symptoms, "categories": [SYMPTOM_KEYWORDS.get(s) for s in identified_symptoms]}


 

@app.route('/api/update-baseline', methods=['POST'])
def update_baseline():
    user_id = request.json['userId']
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute(
        "SELECT systolic, diastolic, heart_rate FROM patients_vitals WHERE user_id = %s AND created_at >= NOW() - INTERVAL '30 days'",
        (user_id,)
    )
    vitals = cur.fetchall()
    
    if len(vitals) < 5:
        cur.close()
        conn.close()
        return jsonify({"status": "not enough data"}), 200

    df = pd.DataFrame(vitals, columns=['systolic', 'diastolic', 'heart_rate'])
    
    # Calculate stats, which might be NumPy types
    baseline_numpy = {
        "avg_systolic": df['systolic'].mean(), "stddev_systolic": df['systolic'].std(),
        "avg_diastolic": df['diastolic'].mean(), "stddev_diastolic": df['diastolic'].std(),
        "avg_heart_rate": df['heart_rate'].mean(), "stddev_heart_rate": df['heart_rate'].std(),
    }
    
    # --- THIS IS THE CRITICAL FIX ---
    # Convert all NumPy types to standard Python floats before sending to the database
    # The float() constructor handles this conversion perfectly.
    baseline_python = {key: float(value) if pd.notna(value) else None for key, value in baseline_numpy.items()}
    # --- END OF FIX ---

    cur.execute(
        """
        INSERT INTO patient_baselines (user_id, avg_systolic, stddev_systolic, avg_diastolic, stddev_diastolic, avg_heart_rate, stddev_heart_rate)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (user_id) DO UPDATE SET
            avg_systolic = EXCLUDED.avg_systolic, stddev_systolic = EXCLUDED.stddev_systolic,
            avg_diastolic = EXCLUDED.avg_diastolic, stddev_diastolic = EXCLUDED.stddev_diastolic,
            avg_heart_rate = EXCLUDED.avg_heart_rate, stddev_heart_rate = EXCLUDED.stddev_heart_rate,
            last_updated = NOW();
        """,
        (
            user_id, 
            baseline_python['avg_systolic'], baseline_python['stddev_systolic'],
            baseline_python['avg_diastolic'], baseline_python['stddev_diastolic'],
            baseline_python['avg_heart_rate'], baseline_python['stddev_heart_rate']
        )
    )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({"status": "success", "baseline": baseline_python}), 200       

# --- Predictive Modeling Function (No changes needed) ---
def predict_future_risk(vitals_history):
    # ... This function is correct ...
    if len(vitals_history) < 3: return 0
    df = pd.DataFrame(vitals_history, columns=['systolic', 'diastolic', 'heart_rate', 'created_at'])
    df['time'] = (df['created_at'] - df['created_at'].min()).dt.total_seconds() / 3600
    model = LinearRegression()
    X = df[['time']]
    y = df['systolic']
    model.fit(X, y)
    future_time = df['time'].max() + 24
    predicted_systolic = model.predict([[future_time]])[0]
    if predicted_systolic > 140: return 75
    if predicted_systolic > 130: return 40
    return 10

# --- CORE FUNCTION: Health Score Calculation (Corrected Version) ---

@app.route('/api/calculate', methods=['POST'])
def calculate():
    data = request.json
    user_id = data.get('userId')
    
    risk_score = 0
    insights = []

    conn = get_db_connection()
    cur = conn.cursor()

    # --- THIS IS THE CORRECTED LOGIC BLOCK ---
    # 1. Fetch personalized baseline
    cur.execute(
        "SELECT avg_systolic, stddev_systolic, avg_heart_rate, stddev_heart_rate FROM patient_baselines WHERE user_id = %s",
        (user_id,)
    )
    baseline_row = cur.fetchone()
    
    # 2. Check if a baseline was found and construct the baseline dictionary
    if baseline_row:
        baseline = {
            'avg_systolic': baseline_row[0],
            'stddev_systolic': baseline_row[1],
            'avg_heart_rate': baseline_row[2],
            'stddev_heart_rate': baseline_row[3]
        }
    else:
        # Fallback to a generic baseline if no personal one exists
        baseline = {'avg_systolic': 120, 'stddev_systolic': 8, 'avg_heart_rate': 75, 'stddev_heart_rate': 10}
    # --- END OF CORRECTION ---

    # 3. Personalized Vital Sign Deviation Analysis
    systolic = int(data.get('systolic', 0))
    # Check for NaN or None values before calculation
    if systolic > 0 and baseline.get('avg_systolic') is not None and baseline.get('stddev_systolic') is not None and baseline['stddev_systolic'] > 0:
        z_score = abs(systolic - baseline['avg_systolic']) / baseline['stddev_systolic']
        if z_score > 2.5:
            risk_score += 50
            insights.append(f"Systolic BP ({systolic}) is significantly higher than your personal average.")
        elif z_score > 1.5:
            risk_score += 25
            insights.append(f"Systolic BP ({systolic}) is elevated for you.")
    
    # 4. Mood Analysis (remains the same)
    mood = int(data.get('mood', 3))
    if mood <= 2:
        risk_score += 15
        insights.append("Patient reported a low mood.")
    
    # 5. Symptom Analysis using NLP
    symptoms_text = data.get('symptoms', '')
    symptom_data = analyze_symptoms_text(symptoms_text) if symptoms_text else None
    if symptom_data and symptom_data['tags']:
        risk_score += 20
        insights.append(f"Noted symptoms including: {', '.join(symptom_data['tags'])}.")
        
    # 6. Predictive Risk Analysis
    cur.execute(
        "SELECT systolic, diastolic, heart_rate, created_at FROM patients_vitals WHERE user_id = %s ORDER BY created_at DESC LIMIT 7",
        (user_id,)
    )
    history = cur.fetchall()
    predicted_risk = predict_future_risk(history)
    if predicted_risk > 50:
        risk_score += 25
        insights.append("Recent trends indicate a potential future risk.")

    cur.close()
    conn.close()

    # Final score calculation
    final_risk_score = min(risk_score, 100)
    health_score = 100 - final_risk_score
    insight_summary = " ".join(insights) if insights else "Readings are within your normal range. Keep up the great work!"

    return jsonify({
        "healthScore": int(health_score),
        "insight": insight_summary,
        "symptomTags": symptom_data
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)