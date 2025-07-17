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

const ActionWrapper = styled.div`
  position: relative;
`;

const MoreOptionsButton = styled.button`
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;

  &:hover {
    background-color: #374151;
  }
`;

const ActionMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: #2c3e50;
  border-radius: 6px;
  border: 1px solid #34495e;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 10;
  width: 180px;
  overflow: hidden;
`;

const ActionMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 15px;
  background: none;
  border: none;
  text-align: left;
  font-size: 0.9rem;
  color: ${props => props.isDestructive ? '#e74c3c' : '#ecf0f1'};
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.isDestructive ? '#c0392b' : '#3498db'};
    color: white;
  }
`;


// --- The React Component ---
const ClinicianActions = ({ medication, onDiscontinue }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Click-away to close logic
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDiscontinueClick = () => {
        onDiscontinue(medication);
        setIsOpen(false);
    };

    return (
        <ActionWrapper ref={menuRef}>
            <MoreOptionsButton onClick={() => setIsOpen(!isOpen)}>
                <FaEllipsisV />
            </MoreOptionsButton>
            {isOpen && (
                <ActionMenu>
                    <ActionMenuItem $isDestructive onClick={handleDiscontinueClick}>
                        <FaTrashAlt />
                        Discontinue
                    </ActionMenuItem>
                    {/* Future actions like "Edit Dosage" can be added here */}
                </ActionMenu>
            )}
        </ActionWrapper>
    );
};
const MedicationTracker = ({ medications, onLogTaken,onDiscontinue, isClinicianView = false }) => {

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
                    <MedItem key={med.id} isTaken={isTakenToday(med.last_taken)}>
                      
                        <MedInfo>
                            <MedName>{med.name} ({med.dosage})</MedName>
                            <MedDetails>{med.frequency}</MedDetails>
                        </MedInfo>
                        {isClinicianView ? (
                        // Clinician sees a "Discontinue" button
                         <ClinicianActions medication={med} onDiscontinue={onDiscontinue} />
                    ) : (
                        <LogButton onClick={() => onLogTaken(med.id)} disabled={taken}>
                            {taken ? <FaCheckCircle /> : <FaClock />}
                            {taken ? 'Taken Today' : 'Log as Taken'}
                        </LogButton>
                    )}
                    </MedItem>
                );
            })}
        </TrackerContainer>
    );
};

export default MedicationTracker;