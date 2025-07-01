import React, { useState, useEffect, useContext,useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { getPatientDetails, addMedicationForPatient } from '../../api/clinician.js';
import HealthHub from '../../components/HealthHub.jsx';
import AddMedicationForm from '../../components/clinician/AddMedicationForm.jsx';
import Spinner from '../../components/layout/Spinner.jsx';
import styled from 'styled-components';
import { FaArrowLeft, FaSignOutAlt } from 'react-icons/fa';

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


// --- The React Component ---

const PatientDetailPage = () => {
    const { patientId } = useParams();
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [patientData, setPatientData] = useState({ profile: {}, history: [], medications: [] });
    const [isLoading, setIsLoading] = useState(true);

     const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await getPatientDetails(patientId);
            
          setPatientData({
               profile: res.data.profile,
            history: res.data.vitalsHistory || [],
            medications: res.data.medications || []
            });

        } catch (err) {
            console.error("Failed to fetch patient details:", err);
            setPatientData({ profile: { full_name: "Patient Not Found" }, history: [], medications: [] });
        } finally {
            setIsLoading(false);
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

    if (isLoading) return <Spinner />;
   if (!patientData.profile.id) {
        return <div>Patient not found. <Link to="/clinician/dashboard">Go Back</Link></div>;
    }

    return (
        <PageLayout>
            <Sidebar>
                <PatientInfo>
                    <h2>{patientData.full_name}</h2>
                    <p style={{ color: '#f1c40f' }}>MRN: {patientData.profile.mrn}</p>
                    <p>{patientData.profile.email}</p>
                </PatientInfo>

                <AddMedicationForm patientId={patientId} onMedicationAdded={handleAddMedication} />

                <SidebarActions>
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
                <HealthHub data={patientData} isLoading={isLoading} />
            </MainContent>
        </PageLayout>
    );
};

export default PatientDetailPage;