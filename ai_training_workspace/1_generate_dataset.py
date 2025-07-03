# ai_training_workspace/1_generate_dataset.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

print("--- AI Training: Step 1 - Generating Synthetic Dataset ---")

# Configuration
NUM_PATIENTS = 50
DAYS_OF_DATA = 60
OUTPUT_FILE = 'synthetic_patient_data.csv'

# Patient Profiles to simulate
profiles = {
    'healthy': {'bp_avg': 115, 'bp_std': 5, 'hr_avg': 70, 'hr_std': 5, 'risk_event_chance': 0.01},
    'hypertensive': {'bp_avg': 145, 'bp_std': 10, 'hr_avg': 80, 'hr_std': 7, 'risk_event_chance': 0.1},
    'heart_failure': {'bp_avg': 110, 'bp_std': 8, 'hr_avg': 90, 'hr_std': 10, 'risk_event_chance': 0.2}
}

data = []
for i in range(NUM_PATIENTS):
    profile_name = np.random.choice(list(profiles.keys()))
    profile = profiles[profile_name]
    
    risk_event_day = np.random.randint(10, DAYS_OF_DATA - 5) if np.random.rand() < profile['risk_event_chance'] else -1

    for day in range(DAYS_OF_DATA):
        date = datetime.now() - timedelta(days=DAYS_OF_DATA - day)
        
        systolic = np.random.normal(profile['bp_avg'], profile['bp_std'])
        diastolic = systolic - np.random.normal(35, 5)
        hr = np.random.normal(profile['hr_avg'], profile['hr_std'])
        has_symptoms = 1 if risk_event_day != -1 and risk_event_day <= day < risk_event_day + 3 else 0
        
        label = 'Stable'
        if risk_event_day != -1 and risk_event_day <= day < risk_event_day + 3:
            systolic *= 1.15
            hr *= 1.10
            if profile_name == 'hypertensive':
                label = 'Hypertensive_Risk'
            elif profile_name == 'heart_failure':
                label = 'CHF_Risk'

        data.append({
            'patient_id': i, 'timestamp': date, 'systolic': int(systolic),
            'diastolic': int(diastolic), 'heart_rate': int(hr),
            'has_symptoms': has_symptoms, 'label': label
        })

df = pd.DataFrame(data)
df.to_csv(OUTPUT_FILE, index=False)
print(f"--> Success! Generated {len(df)} records into '{OUTPUT_FILE}'")