# ai/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
# Allow requests from our backend on port 5000
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5000"}})

def calculate_health_score(data):
    """
    Calculates a health score based on input data.
    In a real app, this would use a pre-trained ML model.
    """
    risk_score = 0
    insights = []

    # Baseline values (in a real app, these would be per-patient)
    baseline = {'avg_systolic': 120, 'std_systolic': 8}

    # 1. Vital Sign Deviation Analysis
    systolic = int(data.get('systolic', baseline['avg_systolic']))
    bp_deviation = abs(systolic - baseline['avg_systolic']) / baseline['std_systolic']
    
    if bp_deviation > 2.5:
        risk_score += 50
        insights.append("Blood pressure is significantly different from baseline.")
    elif bp_deviation > 1.5:
        risk_score += 25
        insights.append("Blood pressure is moderately elevated.")

    # 2. Mood and Symptom Analysis
    mood = int(data.get('mood', 3))
    if mood <= 2:
        risk_score += 25
        insights.append("Patient reported a low mood.")
    
    symptoms = data.get('symptoms', '')
    if 'dizzy' in symptoms.lower() or 'headache' in symptoms.lower():
        risk_score += 15
        insights.append("Reported symptoms require attention.")

    # Normalize score
    final_risk_score = min(risk_score, 100)
    health_score = 100 - final_risk_score
    insight_summary = " ".join(insights) if insights else "Patient appears stable."

    return {
        "healthScore": int(health_score),
        "insight": insight_summary
    }


@app.route('/api/calculate', methods=['POST'])
def calculate():
    if not request.json:
        return jsonify({"error": "Invalid input, JSON required"}), 400
    
    data = request.json
    print(f"AI Service received data: {data}")
    
    result = calculate_health_score(data)
    
    print(f"AI Service returning result: {result}")
    return jsonify(result)

if __name__ == '__main__':
    # Running on port 5001 to avoid conflict with backend/frontend
    app.run(debug=True, port=5001)