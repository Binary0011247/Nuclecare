import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

// --- Styled Components for the new, sleek form ---
const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormTitle = styled.h3`
  font-size: 1.2rem;
  color: #61dafb;
  margin: 0 0 10px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #34495e;
  font-weight: 400;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #34495e;
  background: #2c3e50;
  color: white;
  font-size: 0.9rem;
  box-sizing: border-box;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #61dafb;
  }
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

const PrescribeButton = styled.button`
  width: 100%;
  padding: 12px;
  border-radius: 6px;
  border: none;
  background: #61dafb;
  color: #1a1d23;
  font-size: 1rem;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 10px;

  &:hover { background: #52b8d8; }
  &:disabled { background: #7f8c8d; cursor: not-allowed; }
`;


// --- The React Component ---
const AddMedicationForm = ({ patientId, onMedicationAdded }) => {
    const [formData, setFormData] = useState({ name: '', dosage: '', frequency: '' });
    const [isLoading, setIsLoading] = useState(false);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onMedicationAdded(patientId, formData);
            setFormData({ name: '', dosage: '', frequency: '' });
        } catch (err) {
            console.error("Failed to add medication:", err);
            alert("Could not add medication. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FormContainer onSubmit={onSubmit}>
            <FormTitle>Prescribe New Medication</FormTitle>
            <FormInput name="name" value={formData.name} onChange={onChange} placeholder="Medication Name (e.g., Lisinopril)" required />
            <FormInput name="dosage" value={formData.dosage} onChange={onChange} placeholder="Dosage (e.g., 10mg)" required />
            <FormInput name="frequency" value={formData.frequency} onChange={onChange} placeholder="Frequency (e.g., Once daily)" required />
            <PrescribeButton type="submit" disabled={isLoading}>{isLoading ? <Spinner /> : 'Prescribe'}</PrescribeButton>
        </FormContainer>
    );
};

export default AddMedicationForm;