import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

print("--- AI Training: Step 3 - Combining Datasets & Retraining ---")

# --- Load and Prepare Datasets ---
try:
    original_df = pd.read_csv('synthetic_patient_data.csv')
    diabetes_df = pd.read_csv('cleaned_diabetes_data.csv')
    print(f"Loaded {len(original_df)} original rows and {len(diabetes_df)} diabetes rows.")
except Exception as e:
    print(f"ERROR: Could not load data files. {e}")
    exit()

original_df['blood_glucose'] = 100
diabetes_df['systolic'] = 140
diabetes_df['diastolic'] = 90
diabetes_df['heart_rate'] = 85
diabetes_df['has_symptoms'] = 1

combined_df = pd.concat([original_df, diabetes_df], ignore_index=True)
print(f"Combined datasets. Total rows: {len(combined_df)}")

# --- Feature Engineering ---
print("Engineering new trend features...")

# Convert to datetime and handle errors
combined_df['timestamp'] = pd.to_datetime(combined_df['timestamp'], errors='coerce')
combined_df.dropna(subset=['timestamp'], inplace=True)

# --- THIS IS THE CRITICAL FIX ---
# 1. Set the 'timestamp' column as the DataFrame's index.
combined_df = combined_df.set_index('timestamp')

# 2. Now perform the time-aware rolling calculations.
#    The 'on' parameter is no longer needed because we are rolling on the index itself.
combined_df['bp_mean_3d'] = combined_df.groupby('patient_id')['systolic'].transform(lambda x: x.rolling('3D').mean())
combined_df['hr_mean_3d'] = combined_df.groupby('patient_id')['heart_rate'].transform(lambda x: x.rolling('3D').mean())

# Fill missing glucose values before calculating the rolling mean
combined_df['blood_glucose'] = combined_df['blood_glucose'].fillna(100)
combined_df['glucose_mean_3d'] = combined_df.groupby('patient_id')['blood_glucose'].transform(lambda x: x.rolling('3D').mean())

# 3. Reset the index to turn 'timestamp' back into a regular column if needed later.
combined_df = combined_df.reset_index()
# --- END OF FIX ---

# Drop any remaining rows with NaN values (from the rolling calculations)
combined_df.dropna(inplace=True)
print(f"Data cleaned. Remaining rows for training: {len(combined_df)}")

if len(combined_df) < 10: # Increased threshold for safety
    print("FATAL ERROR: The dataset has very few rows after cleaning. Check data merging and date formats.")
    exit()

# --- Define Features and Target ---
features_to_use_v2 = [
    'systolic', 'diastolic', 'heart_rate', 'has_symptoms', 
    'bp_mean_3d', 'hr_mean_3d', 
    'blood_glucose', 'glucose_mean_3d'
]
target_to_predict = 'label'

X = combined_df[features_to_use_v2]
y = combined_df[target_to_predict]

# --- Model Training ---
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
print(f"Training model with {len(X_train)} samples...")

model_v2 = RandomForestClassifier(n_estimators=100, random_state=42)
model_v2.fit(X_train, y_train)
print("Study complete!")

# --- Evaluate and Save Model ---
y_pred = model_v2.predict(X_test)
print("\n--- New Model (v2) Performance ---")
print(f"Model Accuracy on the 'final exam': {accuracy_score(y_test, y_pred):.2f}")
print(classification_report(y_test, y_pred))

# --- Save the NEW v2 model and its features ---
joblib.dump(model_v2, 'health_synopsis_model_v2.pkl')
joblib.dump(features_to_use_v2, 'model_features_v2.pkl')
print("\n--> Success! Trained and saved new v2 model files.")
# (The rest of the code is the same)