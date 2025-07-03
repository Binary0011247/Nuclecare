# ai_training_workspace/2_train_model.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

print("\n--- AI Training: Step 2 - Training the Model ---")

# Load the textbook
df = pd.read_csv('synthetic_patient_data.csv')

# Feature Engineering: We create features for the model to learn from.
# For this example, we'll use a 3-day rolling average to spot trends.
df['bp_mean_3d'] = df.groupby('patient_id')['systolic'].transform(lambda x: x.rolling(3, min_periods=1).mean())
df['hr_mean_3d'] = df.groupby('patient_id')['heart_rate'].transform(lambda x: x.rolling(3, min_periods=1).mean())
df.dropna(inplace=True)

# Tell the model what to look at (features) and what to predict (target)
features_to_use = ['systolic', 'diastolic', 'heart_rate', 'has_symptoms', 'bp_mean_3d', 'hr_mean_3d']
target_to_predict = 'label'

X = df[features_to_use]
y = df[target_to_predict]

# Split the data: 80% for studying, 20% for a final exam
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# The AI Student: A RandomForestClassifier
model = RandomForestClassifier(n_estimators=100, random_state=42)

# The training process: The model studies the training data
print("Model is studying the data...")
model.fit(X_train, y_train)
print("Study complete!")

# The final exam: Test the model on data it has never seen before
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print("\n--- Model Performance ---")
print(f"Model Accuracy on the 'final exam': {accuracy:.2f}")
print(classification_report(y_test, y_pred))

# Save the "trained brain" (the model) and the list of features it needs
joblib.dump(model, 'health_synopsis_model.pkl')
joblib.dump(features_to_use, 'model_features.pkl')

print("\n--> Success! Trained AI model has been saved to 'health_synopsis_model.pkl'")