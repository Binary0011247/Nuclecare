# ai_training_workspace/1a_process_diabetes_data.py
import pandas as pd
import numpy as np

print("--- Data Processing: Step 1a - Extracting and Cleaning Diabetes Data ---")

INPUT_FILE = 'DrRajeevChawla_data.xlsx'
OUTPUT_FILE = 'cleaned_diabetes_data.csv'

try:
    # Load the Excel file
    df = pd.read_excel(INPUT_FILE)
    print(f"Successfully loaded {len(df)} rows from '{INPUT_FILE}'.")
except FileNotFoundError:
    print(f"ERROR: Could not find '{INPUT_FILE}'. Please make sure it's in the same folder.")
    exit()

# --- Identify the relevant columns for blood glucose ---
# We will check multiple possible column names for fasting and post-prandial sugar
glucose_cols = [
    'BLOOD GLUCOSE ESTIMATION-FASTING BLOOD SUGAR',
    'BLOOD GLUCOSE ESTIMATION-POST PRANDIAL BLOOD SUGAR',
    'B.GLUCOSE(mg/dl)-FASTING',
    'GLYCOSYLATED HAEMOGLOBIN (HbA1C)-MEAN BLOOD GLUCOSE'
]

# Find which of these columns actually exist in the dataframe
existing_glucose_cols = [col for col in glucose_cols if col in df.columns]
print(f"Found glucose columns: {existing_glucose_cols}")

# --- Create a single 'blood_glucose' column ---
# We will prioritize the columns in order and take the first non-empty value for each row.
df['blood_glucose'] = np.nan
for col in existing_glucose_cols:
    # Clean the column: convert to numeric, forcing errors to become NaN (Not a Number)
    numeric_col = pd.to_numeric(df[col], errors='coerce')
    # Fill NaN values in our target column with values from the current column
    df['blood_glucose'].fillna(numeric_col, inplace=True)

# --- Create the 'label' column based on glucose levels ---
# This is our simplified "diagnosis" for the model to learn
def assign_label(glucose):
    if pd.isna(glucose):
        return 'Unknown'
    if glucose > 125:  # High fasting glucose is a strong indicator
        return 'Diabetes_Risk'
    if glucose < 70:
        return 'Hypoglycemia_Risk'
    return 'Stable'

df['label'] = df['blood_glucose'].apply(assign_label)

# --- Final Data Cleaning ---
# Rename columns to match our main synthetic dataset for easier merging later
df.rename(columns={'Patient ID': 'patient_id', 'Date': 'timestamp'}, inplace=True)

# Keep only the columns we need
final_df = df[['patient_id', 'timestamp', 'blood_glucose', 'label']].copy()

# Drop rows where we couldn't find any glucose reading at all
final_df.dropna(subset=['blood_glucose'], inplace=True)

# Ensure patient_id is an integer
final_df['patient_id'] = final_df['patient_id'].astype(int)

# --- Save the Cleaned Data ---
final_df.to_csv(OUTPUT_FILE, index=False)
print(f"--> Success! Extracted and cleaned {len(final_df)} records into '{OUTPUT_FILE}'.")