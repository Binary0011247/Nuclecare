import React, { useState, useEffect, useContext,useRef } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { getLatestVitals, getVitalsHistory, getMedications, logMedicationTaken, submitPulseCheck, getMyProfile } from '../api/patient.js';
import styled, { keyframes } from 'styled-components';
import HealthHub from '../components/HealthHub.jsx';
import Spinner from '../components/layout/Spinner.jsx';
import { FaSignOutAlt } from 'react-icons/fa';

// --- Keyframes for Animations (for the new menu and pulsar) ---
const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 10px 2px #e67e22; } /* Using the 'healthy' orange/gold color */
  50% { box-shadow: 0 0 15px 5px #e67e22; }
`;
const slideIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- Styled Components for the Redesigned UI ---

const PageContainer = styled.div`
  background-color: #1a1d23;
  min-height: 100vh;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: rgba(31, 41, 55, 0.7); /* Glassy background */
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #374151;
  position: sticky; /* Makes the header stick to the top on scroll */
  top: 0;
  z-index: 100;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const Brand = styled.h1`
  font-size: 1.8rem;
  color: #3498db; /* The requested blue color for the brand */
  margin: 0;
  font-weight: 600;
`;

const WelcomeMessage = styled.p`
  font-size: 1.1rem;
  color: #d1d5db;
  margin: 0;
  span {
    font-weight: bold;
    color: #f1c40f; /* A warm gold for the name */
  }
`;

const ProfilePulsar = styled.div`
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #2c3e50;
  border: 2px solid #e67e22;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  cursor: pointer;
  z-index: 20;
  animation: ${pulseGlow} 4s infinite;
  transition: transform 0.3s ease;
  &:hover { transform: scale(1.1); }
`;

const OrbitalMenu = styled.div`
  position: absolute;
  top: 65px;
  right: 0;
  width: 180px;
  background: rgba(26, 29, 35, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid #34495e;
  border-radius: 8px;
  z-index: 19;
  padding: 10px;
  animation: ${slideIn} 0.3s ease-out;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  background: none;
  border: none;
  color: #e74c3c;
  padding: 12px 15px;
  text-align: left;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  &:hover { background-color: #e74c3c; color: white; }
`;
const MrnBadge = styled.div`
  display: flex;
  align-items: center;
  background-color: rgba(0,0,0,0.2);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #34495e;
  gap: 10px;
  margin-left: 10px;
`;
const MrnLabel = styled.span`
  color: #9ca3af;
  font-size: 0.9rem;
`;
const MrnText = styled.span`
  color: #f1c40f;
  font-weight: bold;
  font-family: 'Courier New', Courier, monospace;
`;
// --- The React Component ---

const DashboardPage = () => {
    const { logout } = useContext(AuthContext);
    const [hubData, setHubData] = useState({ latestVitals: null, history: [], medications: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [userInitials, setUserInitials] = useState('');
    const [userName, setUserName] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
     const menuRef = useRef(null);
     const [patientMrn, setPatientMrn] = useState('');

    // This function generates initials from a full name
    const getInitials = (name) => {
        if (!name) return '...';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return parts[0][0] + parts[parts.length - 1][0];
        }
        return name.substring(0, 2);
    };

    // This useEffect handles all data fetching on initial load
    const fetchDashboardData = async () => {
        // Don't show the main spinner for a simple refresh
        // Only the parent useEffect will set the initial loading state
        try {
            const [profileRes, vitalsRes, historyRes, medsRes] = await Promise.all([
                getMyProfile(),
                getLatestVitals(),
                getVitalsHistory(),
                getMedications()
            ]);
            const fullName = profileRes.data.full_name;
            setUserName(profileRes.data.full_name);
            setUserInitials(getInitials(profileRes.data.full_name).toUpperCase());
            setPatientMrn(profileRes.data.mrn);
            
            // Set the complete, correct state object
            setHubData({
                latestVitals: vitalsRes.data,
                history: historyRes.data,
                medications: medsRes.data
            });
            } catch (err) {
            console.error("Failed to fetch dashboard data:", err);
        } finally {
            // This is only for the initial page load
            if (isLoading) {
                setIsLoading(false);
            }
        }
    };

    // This useEffect hook runs only ONCE when the component first loads
    useEffect(() => {
        fetchDashboardData();
    }, []);



     const handleLogMedication = async (medId) => {
        try {
            await logMedicationTaken(medId);
            fetchDashboardData(); // Refetch ALL data to update the UI
        } catch (err) {
            console.error("Failed to log medication:", err);
            alert("Could not log medication. Please try again.");
        }
    };
     const handleFormSubmit = async (formData) => {
        try {
            await submitPulseCheck(formData);
            fetchDashboardData(); // Refetch ALL data to update the UI
        } catch(err) {
            console.error("Failed to submit vitals:", err);
            alert("Could not submit vitals. Please try again.");
        }
    };
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    if (isLoading) {
        return <Spinner />;
    }

    return (
        <PageContainer>
            <Header>
                <HeaderLeft>
                    <Brand>Nuclecare</Brand>
                    <WelcomeMessage>Welcome back, <span>{userName}!</span></WelcomeMessage>
                     {patientMrn && (
                        <MrnBadge>
                            <MrnLabel>MRN:</MrnLabel>
                            <MrnText>{patientMrn}</MrnText>
                        </MrnBadge>
                    )}
                </HeaderLeft>

                <div style={{ position: 'relative' }}>
                    <ProfilePulsar onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {userInitials}
                    </ProfilePulsar>
                    {isMenuOpen && (
                        <OrbitalMenu>
                            <MenuItem onClick={logout}>
                                <FaSignOutAlt />
                                Logout
                            </MenuItem>
                        </OrbitalMenu>
                    )}
                </div>
            </Header>

            <HealthHub 
                data={hubData}
                isLoading={false} // Loading is handled by this page, not the hub
                onLogMedication={handleLogMedication}
                onLogVitals={handleFormSubmit}
                showVitalsForm={true}
            />
        </PageContainer>
    );
};

export default DashboardPage;