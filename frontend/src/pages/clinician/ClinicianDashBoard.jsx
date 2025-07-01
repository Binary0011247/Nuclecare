import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import styled, { keyframes } from 'styled-components';
import { FaSignOutAlt, FaCopy } from 'react-icons/fa';
import CareConstellation from '../../components/clinician/CareConstellation.jsx';
import { getMyClinicianProfile } from '../../api/clinician.js';

// --- Keyframes for Animations ---
const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 10px 2px #61dafb; }
  50% { box-shadow: 0 0 15px 5px #61dafb; }
`;
const slideIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- Styled Components (with corrected layout logic) ---

const PageWrapper = styled.div`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #090a0f;
  display: flex;
  flex-direction: column;
`;

const HeaderBar = styled.header`
  width: 100%;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between; /* Pushes children to opposite ends */
  align-items: center;
  z-index: 100;
  background: rgba(27, 39, 53, 0.5);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(52, 73, 94, 0.5);
  box-sizing: border-box; /* Ensures padding is included in the width */

  @media (max-width: 768px) {
    padding: 15px 20px;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const BrandName = styled.h1`
  font-size: 1.8rem;
  color: #61dafb;
  margin: 0;
  font-weight: 600;
  letter-spacing: 1px;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const PageTitle = styled.h2`
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-weight: 300;
  padding-left: 20px;
  border-left: 1px solid #34495e;

  @media (max-width: 768px) {
    display: none;
  }
`;

// --- THIS IS THE CORRECTED SECTION ---
const ProfileWrapper = styled.div`
  position: relative; /* This is the anchor for the menu */
`;

const ProfilePulsar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #2c3e50;
  border: 2px solid #61dafb;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  cursor: pointer;
  animation: ${pulseGlow} 4s infinite;
  transition: transform 0.3s ease;
  &:hover { transform: scale(1.1); }

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
`;

const OrbitalMenu = styled.div`
  position: absolute;
  top: 75px; /* Position below the pulsar */
  right: 0;  /* Align to the right of the wrapper */
  width: 220px;
  background: rgba(26, 29, 35, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid #34495e;
  border-radius: 8px;
  z-index: 101; /* Ensure menu is on top of the header */
  padding: 10px;
  animation: ${slideIn} 0.3s ease-out;
  transform-origin: top right;

  @media (max-width: 768px) {
    top: 60px;
    width: 250px;
  }
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  background: none;
  border: none;
  color: #bdc3c7;
  padding: 12px 15px;
  text-align: left;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  svg { margin-right: 15px; }
  &:hover {
    background-color: #61dafb;
    color: #1a1d23;
  }
`;

const ConstellationWrapper = styled.div`
  flex-grow: 1;
  position: relative;
  z-index: 1;
`;
const ClinicianCodeWrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: rgba(0,0,0,0.2);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #34495e;
  gap: 10px;
  margin-left: 20px;
`;

const CodeLabel = styled.span`
  color: #9ca3af;
  font-size: 0.9rem;
`;

const CodeText = styled.span`
  color: #f1c40f; /* A prominent gold color */
  font-weight: bold;
  font-family: 'Courier New', Courier, monospace;
  letter-spacing: 1px;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    color: white;
    background-color: #34495e;
  }
`;
// --- The React Component ---
const ClinicianDashboardPage = () => {
    const { logout } = useContext(AuthContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
     const [clinicianProfile, setClinicianProfile] = useState(null);
    const [copySuccess, setCopySuccess] = useState('');
    const menuRef = useRef(null);
    
    

   useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getMyClinicianProfile();
                setClinicianProfile(res.data); // Store the entire profile object
            } catch (err) {
                console.error("Could not fetch clinician profile:", err);
            }
        };
        fetchProfile();
    }, []);
    

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
    const handleCopyCode = () => {
        if (!clinicianProfile?.clinician_code) return;
        navigator.clipboard.writeText(clinicianProfile.clinician_code);
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000); // Reset message after 2 seconds
    };
     const getInitials = (name) => {
        if (!name) return '...';
        const parts = name.split(' ');
        return parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.substring(0, 2);
    };
    

    return (
        <PageWrapper>
            <HeaderBar>
                {/* Header Item 1: Left Group */}
                <HeaderLeft>
                    <BrandName>Nuclecare</BrandName>
                    <PageTitle>Care Constellation</PageTitle>
                      {clinicianProfile && clinicianProfile.clinician_code && (
                        <ClinicianCodeWrapper>
                            <CodeLabel>Your Code:</CodeLabel>
                            <CodeText>{clinicianProfile.clinician_code}</CodeText>
                            <CopyButton onClick={handleCopyCode} title="Copy to clipboard">
                                {copySuccess ? <span style={{color: '#2ecc71', fontSize: '0.8rem'}}>Copied!</span> : <FaCopy />}
                            </CopyButton>
                        </ClinicianCodeWrapper>
                    )}
                </HeaderLeft>

                {/* Header Item 2: Right Group (with ref for click-away) */}
                <ProfileWrapper ref={menuRef}>
                    <ProfilePulsar onClick={() => setIsMenuOpen(!isMenuOpen)}>
                      {getInitials(clinicianProfile?.full_name).toUpperCase()}
                    </ProfilePulsar>

                    {isMenuOpen && (
                        <OrbitalMenu>
                            <MenuItem onClick={logout}>
                                <FaSignOutAlt />
                                Logout
                            </MenuItem>
                        </OrbitalMenu>
                    )}
                </ProfileWrapper>
            </HeaderBar>
            
            <ConstellationWrapper>
                <CareConstellation />
            </ConstellationWrapper>
        </PageWrapper>
    );
};

export default ClinicianDashboardPage;