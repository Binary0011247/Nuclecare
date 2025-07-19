import React, { useState, useEffect, useContext,useRef,useMemo } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { SocketContext } from '../context/SocketContext.jsx';
import { getLatestVitals, getVitalsHistory, getMedications, logMedicationTaken, submitPulseCheck, getMyProfile } from '../api/patient.js';
import toast from 'react-hot-toast'; // Import the toast function
import { jwtDecode } from 'jwt-decode';
import styled, { keyframes } from 'styled-components';
import HealthHub from '../components/HealthHub.jsx';
import Spinner from '../components/layout/Spinner.jsx';
import HealthAura from '../components/HealthAura.jsx'; // Import the background Aura
import LogVitalsForm from '../components/LogVitalsForm.jsx'; // For the modal
import Modal from '../components/layout/Modal.jsx'; // For the modal
import { FaSignOutAlt,FaPlus } from 'react-icons/fa';
import { BsFillHeartPulseFill } from 'react-icons/bs';

//const getTimeOfDay = () => {
  //  const hour = new Date().getHours();
    //if (hour >= 5 && hour < 11) return 'morning';
    //if (hour >= 11 && hour < 17) return 'daytime';
    //if (hour >= 17 && hour < 23) return 'evening';
    //return 'night';
//};/

/*const backgroundThemes = {
    morning: 'linear-gradient(180deg, #89f7fe 0%, #66a6ff 100%)',
    daytime: 'linear-gradient(180deg, #3498db 0%, #2980b9 100%)',
    evening: 'linear-gradient(180deg, #f39c12 0%, #8e44ad 100%)',
    night: 'linear-gradient(180deg, #111827 0%, #090a0f 100%)',
};*/

// --- Keyframes for Animations (for the new menu and pulsar) ---
const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 10px 2px #e67e22; } /* Using the 'healthy' orange/gold color */
  50% { box-shadow: 0 0 15px 5px #e67e22; }
`;

const pump = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;
const glow = (color) => keyframes`
  0% { filter: drop-shadow(0 0 5px ${color}); }
  50% { filter: drop-shadow(0 0 15px ${color}); }
  100% { filter: drop-shadow(0 0 5px ${color}); }
`;
const slideIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- Styled Components for the Redesigned UI ---

const PageContainer = styled.div`
   background:  #1a1d23;
  min-height: 100vh;
  position: relative; /* Anchor for background elements */
  overflow-x: hidden;
  

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

const HealthPulsar = styled.div`
  position: relative;
  cursor: pointer;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* The heart icon's styling is now controlled by props */
  color: ${props => props.color};
  animation: 
    ${props => pump} ${props => props.speed}s ease-in-out infinite,
    ${props => glow(props.color)} ${props => props.speed * 2}s linear infinite;
  transition: all 0.5s ease;

  &:hover {
    transform: scale(1.1);
  }
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
const MainContentWrapper = styled.div`
  position: relative; /* This will contain the HealthHub and the background Aura */
  z-index: 2;
`;

// --- NEW: The AI Insight Ticker ---
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
`;
const InsightText = styled.p`
  display: inline-block;
  padding-left: 100%;
  animation: ${insightTicker} 20s linear infinite;
  font-weight: 500;
`;

// --- NEW: The Floating Action Button (FAB) ---
const FloatingActionButton = styled.button`
  position: fixed;
  bottom: 40px;
  right: 40px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(45deg, #3498db, #8e44ad);
  border: none;
  color: white;
  font-size: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  cursor: pointer;
  z-index: 50;
  transition: transform 0.2s ease-in-out;
  &:hover {
    transform: scale(1.1);
  }
`;

// --- The React Component ---

const DashboardPage = () => {
    const { logout,token } = useContext(AuthContext);
    const socket = useContext(SocketContext);
    const [hubData, setHubData] = useState({ latestVitals: null, history: [], medications: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
    const [userInitials, setUserInitials] = useState('');
    const [userName, setUserName] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
     const menuRef = useRef(null);
     const [patientMrn, setPatientMrn] = useState('');
      //const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());


      /*useEffect(() => {
        // Set an interval to check the time every 5 minutes
        const intervalId = setInterval(() => {
            setTimeOfDay(getTimeOfDay());
        }, 300000); // 300000ms = 5 minutes

        // Clean up the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, []);*/

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
             setIsVitalsModalOpen(false);
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


    useEffect(() => {
        // Ensure we have a socket connection and a user token before proceeding
        if (socket && token) {
            // Decode the token to get the current user's ID
            const decoded = jwtDecode(token);
            const userId = decoded.user.id;

            // Step 1: Tell the server to add this client to the patient's private room
            socket.emit('join_patient_room', userId);
            console.log(`Socket joining room for patient ID: ${userId}`);

            // Step 2: Define the function that will run when a notification arrives
            const handleNewNotification = (notification) => {
                console.log("New notification received:", notification);
                // Use react-hot-toast to display a success-style notification
                toast.success(notification.message, {
                    duration: 6000, // Keep it on screen a bit longer
                });
                // Refetch all dashboard data to show the new medication in the list
                fetchDashboardData();
            };

            // Step 3: Attach the listener for the 'new_notification' event
            socket.on('new_notification', handleNewNotification);

            // Step 4: IMPORTANT - Cleanup function
            // This runs when the component unmounts (e.g., user logs out or closes page)
            // It removes the event listener to prevent memory leaks.
            return () => {
                console.log(`Socket leaving room for patient ID: ${userId}`);
                socket.off('new_notification', handleNewNotification);
            };
        }
    }, [socket, token]); // This effect will re-run if the socket connection or token changes

    const insightStyle = useMemo(() => {
        const score = hubData.latestVitals?.health_score ?? 95;
        if (score > 85) return { color: 'rgba(46, 204, 113, 0.8)' }; // Green
        if (score > 60) return { color: 'rgba(241, 196, 15, 0.8)' }; // Yellow
        return { color: 'rgba(231, 76, 60, 0.8)' }; // Red
    }, [hubData.latestVitals]);

    const auraStyle = useMemo(() => {
        const score = hubData.latestVitals?.health_score ?? 95;
        if (score > 85) return { color: '#2ecc71', speed: 1.8 };
        if (score > 60) return { color: '#f1c40f', speed: 1.2 };
        return { color: '#e74c3c', speed: 0.8 };
    }, [hubData.latestVitals]);

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

                <div style={{ position: 'relative' }} ref={menuRef}>
                    <HealthPulsar 
                        color={auraStyle.color} 
                        speed={auraStyle.speed}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <BsFillHeartPulseFill size={40} />
                    </HealthPulsar>

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
            {hubData.latestVitals?.insight_text && (
                <InsightTickerWrapper bgColor={insightStyle.color}>
                    <InsightText>{hubData.latestVitals.insight_text}</InsightText>
                </InsightTickerWrapper>
            )}
             <MainContentWrapper>
                {/* The HealthAura now lives in the background */}
                {/*<HealthAura healthScore={hubData.latestVitals?.health_score} />*/}

            <HealthHub 
                data={hubData}
                isLoading={false} // Loading is handled by this page, not the hub
                onLogMedication={handleLogMedication}
                
            />
            </MainContentWrapper>
            <FloatingActionButton onClick={() => setIsVitalsModalOpen(true)} title="Log Today's Vitals">
                <FaPlus />
            </FloatingActionButton>
            <Modal isOpen={isVitalsModalOpen} onClose={() => setIsVitalsModalOpen(false)}>
                <h2>Log Today's Readings</h2>
                <LogVitalsForm onSubmit={handleFormSubmit} />
            </Modal>
        </PageContainer>
    );
};

export default DashboardPage;