import React, { useState, useEffect, useContext,useRef,useMemo } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { SocketContext } from '../context/SocketContext.jsx';
import { getLatestVitals, getVitalsHistory, getMedications, logMedicationTaken, submitPulseCheck, getMyProfile } from '../api/patient.js';
import toast from 'react-hot-toast'; // Import the toast function
import { jwtDecode } from 'jwt-decode';
import styled, { keyframes } from 'styled-components';
import HealthHub from '../components/HealthHub.jsx';
import Spinner from '../components/layout/Spinner.jsx';
import { FaSignOutAlt,FaPlus, FaCapsules  } from 'react-icons/fa';
import Timeline from '../components/timeline/Timeline.jsx';
import TimelineNode from '../components/timeline/TimelineNode.jsx';
import HealthAura from '../components/HealthAura.jsx';
import LogVitalsForm from '../components/LogVitalsForm.jsx';
import Modal from '../components/layout/Modal.jsx';

const getInitials = (name) => {
    if (!name) return '..';
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
        return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2);
};


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
  background: linear-gradient(180deg, #111827 0%, #090a0f 50%, #111827 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

const TimelineContainer = styled.main`
  flex-grow: 1;
  position: relative; /* This is the canvas for our timeline */
  width: 100%;
  display: flex;
  align-items: center; /* Vertically center the timeline elements */
`;

const FixedHealthAura = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 5; /* Behind nodes but above timeline */
`;
// --- The React Component ---

const DashboardPage = () => {
    const { logout, token } = useContext(AuthContext);
    const socket = useContext(SocketContext);
    const [patientProfile, setPatientProfile] = useState(null);
    const [latestVitals, setLatestVitals] = useState(null);
    const [medications, setMedications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
    const [isMedsModalOpen, setIsMedsModalOpen] = useState({ open: false, medication: null });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    // This function generates initials from a full name
     const fetchAllData = async () => {
        try {
            const [profileRes, vitalsRes, medsRes] = await Promise.all([
                getMyProfile(), getLatestVitals(), getMedications()
            ]);
            setPatientProfile(profileRes.data);
            setLatestVitals(vitalsRes.data);
            setMedications(medsRes.data);
        } catch (err) { console.error("Failed to fetch data:", err); }
        finally { if (isLoading) setIsLoading(false); }
    };

    useEffect(() => { fetchAllData(); }, []);



     const handleLogMedication = async (medId) => {
        try {
            await logMedicationTaken(medId);
            setIsMedsModalOpen({ open: false, medication: null });
            fetchAllData(); // Refetch ALL data to update the UI
        } catch (err) {
            console.error("Failed to log medication:", err);
            alert("Could not log medication. Please try again.");
        }
    };
     const handleFormSubmit = async (formData) => {
        try {
            await submitPulseCheck(formData);
            setIsVitalsModalOpen(false);
            fetchAllData();  // Refetch ALL data to update the UI
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
                fetchAllData();
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

    const isTakenToday = (lastTaken) => {
        if (!lastTaken) return false;
        const today = new Date().setHours(0, 0, 0, 0);
        const takenDate = new Date(lastTaken).setHours(0, 0, 0, 0);
        return today === takenDate;
    };

    const timelineEvents = useMemo(() => {
        const events = [];
        // This is a simplified logic for placing nodes. A real app would be more complex.
        
        // Add a "Log Vitals" node. We'll render it separately.
        events.push({ id: 'log-vitals', label: "Log Today's Vitals", icon: <FaPlus />, color: '#3498db', size: '40px', type: 'vitals' });

        // Add nodes for medications
        medications.forEach((med, index) => {
            let position = 33 + (index * 20); // Stagger morning meds
            if (med.frequency.toLowerCase().includes('evening') || med.frequency.toLowerCase().includes('bedtime')) {
                position = 75 + (index * 5); // Stagger evening meds
            }
            events.push({
                id: med.id,
                label: med.name,
                position: position,
                icon: <FaCapsules />,
                color: '#8e44ad',
                isComplete: isTakenToday(med.last_taken),
                type: 'medication',
                data: med
            });
        });
        return events;
    }, [medications]);
    
    const handleNodeClick = (event) => {
        if (event.type === 'vitals') setIsVitalsModalOpen(true);
        if (event.type === 'medication') setIsMedsModalOpen({ open: true, medication: event.data });
    };

    if (isLoading) return <Spinner />;
    
   const userName = patientProfile?.full_name || '';
   const userInitials = getInitials(userName).toUpperCase();
   const patientMrn = patientProfile?.mrn || '';
    
    // getInitials function needs to be defined
    
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

            <TimelineContainer>
                <Timeline />
                
                <FixedHealthAura>
                    <HealthAura 
                        healthScore={latestVitals?.health_score} 
                        insight={latestVitals?.insight_text} 
                    />
                    {/* The "Log Vitals" node is attached to the central Aura */}
                    <TimelineNode 
                        event={timelineEvents.find(e => e.type === 'vitals')} 
                        onClick={handleNodeClick} 
                    />
                </FixedHealthAura>
                
                {/* Render all other event nodes along the timeline */}
                {timelineEvents.filter(e => e.type !== 'vitals').map(event => (
                    <TimelineNode key={event.id} event={event} onClick={handleNodeClick} />
                ))}
            </TimelineContainer>
            <Modal isOpen={isVitalsModalOpen} onClose={() => setIsVitalsModalOpen(false)}>
                <h2>Log Today's Readings</h2>
                <LogVitalsForm onSubmit={handleFormSubmit} />
            </Modal>
            
            <Modal isOpen={isMedsModalOpen.open} onClose={() => setIsMedsModalOpen({open: false, medication: null})}>
                {isMedsModalOpen.medication && (
                    <div style={{textAlign: 'center'}}>
                        <h2>Confirm Medication</h2>
                        <p style={{margin: '20px 0'}}>Did you take your dose of <strong>{isMedsModalOpen.medication.name}</strong>?</p>
                        <ModalButton onClick={() => handleLogMedication(isMedsModalOpen.medication.id)}>Yes, Log as Taken</ModalButton>
                    </div>
                )}
            </Modal>
        </PageContainer>
    );
};


export default DashboardPage;