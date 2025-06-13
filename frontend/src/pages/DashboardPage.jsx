// File: frontend/src/pages/DashboardPage.jsx

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
// --- THIS IS THE ONLY LINE THAT CHANGED ---
import { getLatestVitals, submitPulseCheck } from '../api/patient.js'; 
// --- END OF CHANGE ---

// Component Imports
import HealthAura from '../components/HealthAura.jsx';
import PulseCheckForm from '../components/PulseCheckForm.jsx';
import Spinner from '../components/layout/Spinner.jsx';

// Styled-components for this page's layout
import styled from 'styled-components';

const DashboardContainer = styled.div`
  text-align: center;
`;

const Header = styled.header`
  padding: 20px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  h1 {
    color: #61dafb;
    margin: 0;
  }
`;

const LogoutButton = styled.button`
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #61dafb;
  color: #61dafb;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: rgba(97, 218, 251, 0.1);
    box-shadow: 0 0 5px #61dafb;
  }
`;

const MainContent = styled.main`
  padding: 20px;
`;

const ErrorMessage = styled.p`
    color: #ff6b6b;
    font-size: 1.1em;
`;

const DashboardPage = () => {
    const { logout } = useContext(AuthContext);
    const [patientData, setPatientData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const response = await getLatestVitals();
                setPatientData(response.data);
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
                setError("Could not load your health data. Please try refreshing the page.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleFormSubmit = async (formData) => {
    try {
        // Send the data to the backend
        const response = await submitPulseCheck(formData);

        // *** THIS IS THE KEY LINE ***
        // Use the new data from the server's response to update the UI instantly
        setPatientData(response.data);

    } catch (err) {
        console.error("Failed to submit form:", err);
        setError("There was an error submitting your data. Please try again.");
    }
};

    const renderContent = () => {
        if (isLoading) return <Spinner />;
        if (error) return <ErrorMessage>{error}</ErrorMessage>;
        if (patientData) {
            return (
                <>
                    <HealthAura
                        healthScore={patientData.health_score}
                        insight={patientData.insight_text}
                    />
                    <PulseCheckForm onSubmit={handleFormSubmit} />
                </>
            );
        }
        return <p>No health data found.</p>;
    };

    return (
        <DashboardContainer>
            <Header>
                <h1>Nuclecare</h1>
                <LogoutButton onClick={logout}>Logout</LogoutButton>
            </Header>
            <MainContent>
                {renderContent()}
            </MainContent>
        </DashboardContainer>
    );
};

export default DashboardPage;