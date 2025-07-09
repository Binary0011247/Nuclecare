import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

// --- Styled Components for the form ---
const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px; /* A bit more spacing */
  width: 100%;
`;

const FormRow = styled.div`
  display: flex;
  gap: 15px;
  
  /* On smaller screens, stack the inputs */
  @media (max-width: 500px) {
    flex-direction: column;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1; /* Allows inputs in a row to share space equally */
  gap: 5px;
`;

const Label = styled.label`
  font-size: 0.9rem;
  color: #bdc3c7;
`;

const Input = styled.input`
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #34495e;
  background: #1f2937;
  color: white;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #61dafb;
  }
`;
const FocusInput = styled(Input)`
  border-color: #3498db;
  box-shadow: 0 0 8px rgba(52, 152, 219, 0.5);
`;


const spin = keyframes` to { transform: rotate(360deg); } `;
const Spinner = styled.div`
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: black;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: ${spin} 0.8s linear infinite;
`;

const SubmitButton = styled.button`
  padding: 12px;
  border-radius: 8px;
  border: none;
  background: #3498db;
  color: white;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;

  &:hover {
    background: #2980b9;
  }
  &:disabled {
    background: #7f8c8d;
    cursor: not-allowed;
  }
`;

// --- The React Component ---
const LogVitalsForm = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
        mood: '4',
        systolic: '',
        diastolic: '',
        heart_rate: '',
        sp_o2: '',
        weight: '',
        symptoms: '',
        blood_glucose: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = e => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSubmit(formData);
            // Clear the form after a successful submission
            setFormData({
                mood: '4', systolic: '', diastolic: '', heart_rate: '', 
                sp_o2: '', weight: '', symptoms: ''
            });
        } catch (err) {
            console.error("Submission failed in form:", err);
            // The parent component will handle showing an alert
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FormContainer onSubmit={handleSubmit}>
            <FormGroup>
                <Label htmlFor="mood">How are you feeling? (1=Poor, 5=Great)</Label>
                <Input id="mood" type="number" name="mood" value={formData.mood} onChange={handleChange} min="1" max="5" required />
            </FormGroup>
            
            <FormRow>
                <FormGroup>
                    <Label htmlFor="systolic">Systolic BP</Label>
                    <Input id="systolic" type="number" name="systolic" value={formData.systolic} onChange={handleChange} placeholder="e.g., 120" required />
                </FormGroup>
                <FormGroup>
                    <Label htmlFor="diastolic">Diastolic BP</Label>
                    <Input id="diastolic" type="number" name="diastolic" value={formData.diastolic} onChange={handleChange} placeholder="e.g., 80" required />
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup>
                    <Label htmlFor="heart_rate">Heart Rate (BPM)</Label>
                    <Input id="heart_rate" type="number" name="heart_rate" value={formData.heart_rate} onChange={handleChange} placeholder="e.g., 70" />
                </FormGroup>
                <FormGroup>
                    <Label htmlFor="sp_o2">SpO2 (%)</Label>
                    <Input id="sp_o2" type="number" name="sp_o2" value={formData.sp_o2} onChange={handleChange} placeholder="e.g., 98" />
                </FormGroup>
            </FormRow>

            <FormGroup>
                <Label htmlFor="weight">Weight</Label>
                <Input id="weight" type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange} placeholder="e.g., 150.5" />
            </FormGroup>
            
            <FormGroup>
                <Label htmlFor="blood_glucose">Blood Glucose (mg/dL)</Label>
                <FocusInput id="blood_glucose" type="number" name="blood_glucose" value={formData.blood_glucose} onChange={handleChange} placeholder="e.g., 110" />
            </FormGroup>

            <FormGroup>
                <Label htmlFor="symptoms">Any symptoms to report?</Label>
                <Input id="symptoms" type="text" name="symptoms" value={formData.symptoms} onChange={handleChange} placeholder="e.g., mild headache" />
            </FormGroup>


            <SubmitButton type="submit" disabled={isLoading}>
                {isLoading ? <Spinner /> : "Submit Today's Vitals"}
            </SubmitButton>
        </FormContainer>
    );
};

export default LogVitalsForm;