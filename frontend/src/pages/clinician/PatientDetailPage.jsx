import React, { useState, useEffect, useContext,useRef,useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { getPatientDetails, addMedicationForPatient } from '../../api/clinician.js';
import HealthHub from '../../components/HealthHub.jsx';
import AddMedicationForm from '../../components/clinician/AddMedicationForm.jsx';
import Spinner from '../../components/layout/Spinner.jsx';
import { generateSynopsis, getSynopsisHistory } from '../../api/clinician.js';
import HealthSynopsisReport from '../../components/clinician/Health-Synopsis-Report.jsx';
import styled, { keyframes } from 'styled-components';
import { FaArrowLeft, FaSignOutAlt, FaBrain } from 'react-icons/fa';
import Modal from '../../components/layout/Modal.jsx';
import { dischargePatient,discontinueMedication } from '../../api/clinician.js';
import { FaExclamationTriangle } from 'react-icons/fa';


// --- Styled Components for the new layout ---

const PageLayout = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #1a1d23;
`;

const Sidebar = styled.div`
  width: 350px;
  background-color: #111827; /* A very dark blue/grey */
  padding: 30px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #374151;

  @media (max-width: 1200px) {
    display: none; /* Hide sidebar on smaller screens for a future mobile view */
  }
`;

const PatientInfo = styled.div`
  margin-bottom: 40px;
  h2 {
    font-size: 1.8rem;
    color: white;
    margin: 0;
  }
  p {
    font-size: 1rem;
    color: #9ca3af;
    margin: 5px 0 0 0;
  }
`;

const SidebarActions = styled.div`
  margin-top: auto; /* Pushes this block to the bottom */
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const NavButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #1f2937;
  color: #d1d5db;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #61dafb;
    color: #111827;
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #1f2937;
  color: #e74c3c; /* Red for logout */
  text-decoration: none;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #e74c3c;
    color: white;
  }
`;

const MainContent = styled.div`
  flex-grow: 1;
  padding: 40px;
  overflow-y: auto; /* Allow scrolling of the HealthHub if needed */
  
  @media (max-width: 1200px) {
    padding: 20px; /* Adjust padding for smaller screens */
  }
`;
const spin = keyframes` to { transform: rotate(360deg); } `;
const ButtonSpinner = styled.div`
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: ${spin} 0.8s linear infinite;
`;
const GenerateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 15px;
  font-size: 1.1rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(90deg, #8e44ad, #3498db);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 20px;

  &:hover:not(:disabled) {
    box-shadow: 0 0 15px #8e44ad;
    transform: translateY(-2px);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const DischargeButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px;
  width: 100%;
  
  background-color: transparent;
  color: #f87171; /* A warning red color */
  border: 1px solid #7f1d1d; /* A dark red border */
  
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover:not(:disabled) {
    background-color: #e74c3c;
    border-color: #e74c3c;
    color: white;
    box-shadow: 0 0 10px rgba(231, 76, 60, 0.5);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ModalTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 15px;
  color: #f87171; /* Red title for emphasis */
  margin-top: 0;
  margin-bottom: 20px;
`;

export const ModalText = styled.p`
  color: #d1d5db;
  line-height: 1.6;
  margin-bottom: 20px;
  
  strong {
    color: white;
    font-weight: bold;
  }
`;

export const ModalInput = styled.input`
  width: 100%;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #34495e;
  background: #2c3e50;
  color: white;
  font-size: 1rem;
  text-align: center;
  letter-spacing: 2px;
  box-sizing: border-box;
  margin-bottom: 20px;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #f87171;
  }
`;

export const ConfirmButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 15px;
  width: 100%;
  
  background-color: #e74c3c; /* A strong red */
  color: white;
  border: none;
  
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover:not(:disabled) {
    background-color: #c0392b; /* A darker red on hover */
  }

  &:disabled {
    background-color: #7f8c8d;
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
const insightTicker = keyframes`
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
`;
const InsightTickerWrapper = styled.div`
  background-color: ${props => props.bgColor};
  color: white;
  padding: 10px 0;
  overflow: hidden;
  white-space: nowrap;
  transition: background-color 1.5s ease;
  z-index: 50; /* Ensure it's above the main content */
`;
const InsightText = styled.p`
  display: inline-block;
  padding-left: 100%;
  animation: ${insightTicker} 20s linear infinite;
  font-weight: 500;
`;

// --- The React Component ---

const PatientDetailPage = () => {
    const { patientId } = useParams();
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [patientData, setPatientData] = useState({ profile: {}, history: [], medications: [] });
    const [isLoading, setIsLoading] = useState(true);
     const [synopsisHistory, setSynopsisHistory] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); // State to control the modal
    const [activeReport, setActiveReport] = useState(null); // State to hold the newly generated report
    const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
    const [confirmationMrn, setConfirmationMrn] = useState('');
    const [isDischarging, setIsDischarging] = useState(false);
    const [medicationToDiscontinue, setMedicationToDiscontinue] = useState(null);
    const [isDiscontinueModalOpen, setIsDiscontinueModalOpen] = useState(false);
    const [isDiscontinuing, setIsDiscontinuing] = useState(false);
    

     const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await getPatientDetails(patientId);
            const [detailsRes, synopsisRes] = await Promise.all([
            getPatientDetails(patientId),
            getSynopsisHistory(patientId)
        ]);
            
          setPatientData({
               profile: res.data.profile,
            history: res.data.vitalsHistory || [],
            medications: res.data.medications || []
            });
            setSynopsisHistory(synopsisRes.data);

        } catch (err) {
            console.error("Failed to fetch patient details:", err);
            setPatientData({ profile: { full_name: "Patient Not Found" }, history: [], medications: [] });
        } finally {
            setIsLoading(false);
        }
    };
    const handleGenerateSynopsis = async () => {
        setIsGenerating(true);
        setActiveReport(null); // Clear any old report
        try {
            // Call the API to generate and save the report
            const res = await generateSynopsis(patientId);
            // Set the response data to state so the modal can display it
            setActiveReport(res.data);
            // Open the modal
            setIsModalOpen(true);
        } catch (err) {
            console.error("Failed to generate AI report:", err);
            alert("Could not generate AI report. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, [patientId]);

    const handleAddMedication = async (id, medData) => {
        await addMedicationForPatient(id, medData);
        fetchData(); // Refetch data to show the new medication in the HealthHub
    };
    
    const handleLogout = () => {
        logout();
        navigate('/login'); // Ensure redirection after logout
    };
    const insightStyle = useMemo(() => {
        // The latest vital is the first item in the history array
        const latestHealthScore = patientData.history?.[0]?.health_score ?? 95;
        if (latestHealthScore > 85) return { color: 'rgba(46, 204, 113, 0.8)' }; // Green
        if (latestHealthScore > 60) return { color: 'rgba(241, 196, 15, 0.8)' }; // Yellow
        return { color: 'rgba(231, 76, 60, 0.8)' }; // Red
    }, [patientData.history]);

    if (isLoading) return <Spinner />;
   if (!patientData.profile.id) {
        return <div>Patient not found. <Link to="/clinician/dashboard">Go Back</Link></div>;
    }

    const handleDischargePatient = async () => {
        // Double-check that the entered MRN matches the patient's MRN
        if (confirmationMrn !== patientData.profile.mrn) {
            alert("The MRN you entered does not match. Please check and try again.");
            return;
        }

        setIsDischarging(true);
        try {
            await dischargePatient(patientId);
            alert("Patient has been successfully discharged.");
            navigate('/clinician/dashboard'); // Navigate back to the constellation
        } catch (err) {
            console.error("Failed to discharge patient:", err);
            alert("An error occurred. Could not discharge the patient.");
        } finally {
            setIsDischarging(false);
            setIsDischargeModalOpen(false);
        }
    };
    const openDiscontinueModal = (medication) => {
        setMedicationToDiscontinue(medication);
        setIsDiscontinueModalOpen(true);
    };

    const handleDiscontinueConfirm = async () => {
        if (!medicationToDiscontinue) return;
        
        setIsDiscontinuing(true);
        try {
            await discontinueMedication(medicationToDiscontinue.id);
            alert(`${medicationToDiscontinue.name} has been discontinued.`);
            fetchData(); // Refetch all data to update the list
        } catch (err) {
            console.error("Failed to discontinue medication:", err);
            alert("An error occurred. Could not discontinue medication.");
        } finally {
            setIsDiscontinuing(false);
            setIsDiscontinueModalOpen(false);
            setMedicationToDiscontinue(null);
        }
      };

    return (
      <>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <PageLayout>
            <Sidebar>
              
               
                <PatientInfo>
                    <h2>{patientData.full_name}</h2>
                    <p style={{ color: '#f1c40f' }}>MRN: {patientData.profile.mrn}</p>
                    <p>{patientData.profile.email}</p>
                </PatientInfo>

                <AddMedicationForm patientId={patientId} onMedicationAdded={handleAddMedication} />
                <GenerateButton onClick={handleGenerateSynopsis} disabled={isGenerating}>
                        {isGenerating ? <ButtonSpinner /> : <FaBrain />}
                        {isGenerating ? 'Analyzing...' : 'Generate AI Synopsis'}
                    </GenerateButton>

                <SidebarActions>
                   <DischargeButton onClick={() => setIsDischargeModalOpen(true)}>
                            <FaExclamationTriangle />
                            Discharge Patient
                        </DischargeButton>
                    <NavButton to="/clinician/dashboard">
                        <FaArrowLeft />
                        Back to Constellation
                    </NavButton>
                    <LogoutButton onClick={handleLogout}>
                        <FaSignOutAlt />
                        Logout
                    </LogoutButton>
                </SidebarActions>
            </Sidebar>

            <MainContent>
               {patientData.history?.[0]?.insight_text && (
                        <InsightTickerWrapper bgColor={insightStyle.color}>
                            <InsightText>{patientData.history[0].insight_text}</InsightText>
                        </InsightTickerWrapper>
                    )}
                <HealthHub 
                data={patientData} 
                isLoading={isLoading} 
                onDiscontinue={openDiscontinueModal} // Pass the handler
                isClinicianView={true}
                />
                
            </MainContent>
        </PageLayout>
        </div>
         <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {activeReport ? (
                    <HealthSynopsisReport report={activeReport} />
                ) : (
                    // Show a spinner inside the modal while waiting for the report
                    <Spinner /> 
                )}
            </Modal>

             <Modal isOpen={isDischargeModalOpen} onClose={() => setIsDischargeModalOpen(false)}>
            <ModalTitle><FaExclamationTriangle /> Confirm Discharge</ModalTitle>
            <ModalText>
                This will remove <strong>{patientData.profile.full_name}</strong> from your Care Constellation. You will no longer be responsible for their care through this platform. This action cannot be undone.
            </ModalText>
            <ModalText>
                To confirm, please type the patient's MRN: <strong>{patientData.profile.mrn}</strong>
            </ModalText>
            <ModalInput 
                type="text"
                value={confirmationMrn}
                onChange={(e) => setConfirmationMrn(e.target.value)}
                placeholder="Type MRN to confirm"
            />
            <ConfirmButton 
                onClick={handleDischargePatient} 
                disabled={isDischarging || confirmationMrn !== patientData.profile.mrn}
            >
                {isDischarging ? 'Discharging...' : 'I understand, discharge this patient'}
            </ConfirmButton>
        </Modal>
        <Modal isOpen={isDiscontinueModalOpen} onClose={() => setIsDiscontinueModalOpen(false)}>
                <ModalTitle><FaExclamationTriangle /> Confirm Discontinuation</ModalTitle>
                <ModalText>
                    Are you sure you want to discontinue <strong>{medicationToDiscontinue?.name} ({medicationToDiscontinue?.dosage})</strong> for this patient?
                </ModalText>
                <ModalText>This will remove it from their active medication list.</ModalText>
                <ConfirmButton 
                    onClick={handleDiscontinueConfirm} 
                    disabled={isDiscontinuing}
                >
                    {isDiscontinuing ? 'Processing...' : 'Yes, Discontinue Medication'}
                </ConfirmButton>
            </Modal>

      </>   
    );

};

export default PatientDetailPage;