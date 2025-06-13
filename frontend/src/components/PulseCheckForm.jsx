// frontend/src/components/PulseCheckForm.jsx
import React, { useState } from 'react';
import styled from 'styled-components';

const FormContainer = styled.form`
    display: flex;
    flex-direction: column;
    gap: 15px;
    max-width: 400px;
    margin: 20px auto;
    padding: 20px;
    background: #282c34;
    border-radius: 8px;
`;

const Input = styled.input`
    padding: 10px;
    border-radius: 4px;
    border: 1px solid #555;
    background: #333;
    color: white;
    font-size: 16px;
`;

const Button = styled.button`
    padding: 12px;
    border-radius: 4px;
    border: none;
    background: #61dafb;
    color: black;
    font-size: 16px;
    cursor: pointer;
    font-weight: bold;
`;

const PulseCheckForm = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
        mood: '4', systolic: '120', diastolic: '80', symptoms: ''
    });

    const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = e => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <FormContainer onSubmit={handleSubmit}>
            <label htmlFor="moodInput">How are you feeling? (1=Poor, 5=Great)</label>
            <Input id="moodInput" type="number" name="mood" value={formData.mood} onChange={handleChange} min="1" max="5" />

            <label htmlFor="systolicInput">Blood Pressure (Systolic)</label>
            <Input id="systolicInput" type="number" name="systolic" value={formData.systolic} onChange={handleChange} />

            <label htmlFor="diastolicInput">Blood Pressure (Diastolic)</label>
            <Input id="diastolicInput" type="number" name="diastolic" value={formData.diastolic} onChange={handleChange} />
            
            <label htmlFor="symptomsInput">Any symptoms to report?</label>
            <Input id="symptomsInput" type="text" name="symptoms" value={formData.symptoms} onChange={handleChange} placeholder="e.g., mild headache" />

            <Button type="submit">Submit Pulse Check</Button>
        </FormContainer>
    );
};
export default PulseCheckForm;