import React from 'react';
import styled from 'styled-components';
import { FaCheckCircle, FaClock } from 'react-icons/fa';

// --- Styled Components for the tracker ---

const TrackerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MedItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #1f2937;
  padding: 15px;
  border-radius: 8px;
  border-left: 5px solid ${props => (props.isTaken ? '#2ecc71' : '#3498db')};
  transition: border-color 0.3s ease;
`;

const MedInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MedName = styled.strong`
  font-size: 1.1rem;
  color: #fff;
`;

const MedDetails = styled.small`
  font-size: 0.9rem;
  color: #9ca3af;
`;

const LogButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border-radius: 6px;
  border: none;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  
  /* Style based on whether the medication has been taken */
  background-color: ${props => (props.disabled ? '#27ae60' : '#3498db')};
  color: white;

  &:hover:not(:disabled) {
    background-color: #2980b9;
  }
  
  &:disabled {
    cursor: not-allowed;
  }
`;

const NoMedsMessage = styled.p`
    text-align: center;
    color: #9ca3af;
    margin-top: 20px;
`;

// --- The React Component ---

const MedicationTracker = ({ medications, onLogTaken }) => {

    // Helper function to check if a medication was taken today
    const isTakenToday = (lastTakenTimestamp) => {
        if (!lastTakenTimestamp) return false;
        const today = new Date().setHours(0, 0, 0, 0);
        const takenDate = new Date(lastTakenTimestamp).setHours(0, 0, 0, 0);
        return today === takenDate;
    };

    if (!medications || medications.length === 0) {
        return <NoMedsMessage>No medications have been prescribed yet.</NoMedsMessage>
    }

    return (
        <TrackerContainer>
            {medications.map(med => {
                const taken = isTakenToday(med.last_taken);
                return (
                    <MedItem key={med.id} isTaken={taken}>
                        <MedInfo>
                            <MedName>{med.name} ({med.dosage})</MedName>
                            <MedDetails>{med.frequency}</MedDetails>
                        </MedInfo>
                        <LogButton onClick={() => onLogTaken(med.id)} disabled={taken}>
                            {taken ? <FaCheckCircle /> : <FaClock />}
                            {taken ? 'Taken Today' : 'Log as Taken'}
                        </LogButton>
                    </MedItem>
                );
            })}
        </TrackerContainer>
    );
};

export default MedicationTracker;