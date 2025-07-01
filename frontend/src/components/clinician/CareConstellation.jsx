import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConstellationData } from '../../api/clinician.js';
import styled from 'styled-components';
import PatientStar from './PatientStar.jsx';
import Spinner from '../layout/Spinner.jsx';

// --- Styled Components for the layout ---

const ConstellationContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%; /* Take up all available space from the parent wrapper */
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  overflow: hidden;
`;

const ZoneTitle = styled.h3`
  position: absolute;
  top: 20px;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 300;
  letter-spacing: 2px;
  font-size: 1.2rem;
  z-index: 1;
  pointer-events: none; /* Make sure titles don't block clicks on stars */
`;

const LowRiskTitle = styled(ZoneTitle)` left: 10%; `;
const MediumRiskTitle = styled(ZoneTitle)` left: 50%; transform: translateX(-50%); `;
const HighRiskTitle = styled(ZoneTitle)` right: 10%; `;


// --- The Intelligent Layout Component ---

const CareConstellation = () => {
    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const containerRef = useRef(null); // Ref to get the container's dimensions
    const animationFrameId = useRef(null); // Ref to manage the animation loop

    // The main physics simulation function
    const runLayoutSimulation = useCallback((currentPatients) => {
        const container = containerRef.current;
        if (!container) return currentPatients; // Return original if container not ready

        const { width, height } = container.getBoundingClientRect();
        
        // Define the gravitational "well" centers for each risk zone
        const centers = {
            low: { x: width * 0.25, y: height * 0.5 },
            medium: { x: width * 0.5, y: height * 0.5 },
            high: { x: width * 0.75, y: height * 0.5 },
        };

        // Create a mutable copy to work with
        let updatedPatients = JSON.parse(JSON.stringify(currentPatients));

        // Run the simulation for a few iterations to let the layout stabilize
        for (let i = 0; i < 5; i++) {
            updatedPatients.forEach((p1) => {
                let riskGroup = 'low';
                const riskScore = 100 - (p1.health_score ?? 80);
                if (riskScore > 50) riskGroup = 'high';
                else if (riskScore > 25) riskGroup = 'medium';

                // 1. Gravitational pull towards the zone center
                let forceX = (centers[riskGroup].x - p1.x) * 0.01;
                let forceY = (centers[riskGroup].y - p1.y) * 0.01;
                
                // 2. Repulsion force from other stars to prevent overlap
                updatedPatients.forEach((p2) => {
                    if (p1.id === p2.id) return;

                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const minDistance = 90; // The minimum pixel distance between star centers

                    if (distance < minDistance) {
                        const repulsionForce = (minDistance - distance) / distance * 0.1;
                        forceX += dx * repulsionForce;
                        forceY += dy * repulsionForce;
                    }
                });

                // Apply the calculated forces to the star's position
                p1.x += forceX;
                p1.y += forceY;
                
                // 3. Constrain stars within the container bounds to prevent them from flying off-screen
                p1.x = Math.max(50, Math.min(width - 50, p1.x));
                p1.y = Math.max(50, Math.min(height - 50, p1.y));
            });
        }
        
        return updatedPatients;
    }, []);

    // Effect to fetch the initial patient data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const res = await getConstellationData();
                // Initialize patients with random positions to start the simulation
                const initialPatients = res.data.map(p => ({
                    ...p,
                    x: Math.random() * (window.innerWidth * 0.8),
                    y: Math.random() * (window.innerHeight * 0.8)
                }));
                setPatients(initialPatients);
            } catch (err) {
                console.error("Failed to fetch constellation data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Effect to run the animation loop
    useEffect(() => {
        // Don't run the animation if loading, no patients, or container isn't ready
        if (isLoading || patients.length === 0 || !containerRef.current) return;

        const step = () => {
            setPatients(prevPatients => runLayoutSimulation(prevPatients));
            animationFrameId.current = requestAnimationFrame(step);
        };
        
        animationFrameId.current = requestAnimationFrame(step);

        // Cleanup function to stop the animation when the component unmounts
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isLoading, patients.length, runLayoutSimulation]);


    const handleStarClick = (patientId) => {
        // Stop the animation when navigating away to save resources
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        navigate(`/clinician/patient/${patientId}`);
    };

    if (isLoading) return <Spinner />;

    return (
        <ConstellationContainer ref={containerRef}>
            {/* Render the titles for the risk zones */}
            <LowRiskTitle>STABLE ORBIT</LowRiskTitle>
            <MediumRiskTitle>WARNING NEBULA</MediumRiskTitle>
            <HighRiskTitle>CRITICAL</HighRiskTitle>

            {/* Render the stars using the continuously updated positions */}
            {patients.map(patient => (
                <PatientStar 
                    key={patient.id} 
                    patient={patient} 
                    onClick={() => handleStarClick(patient.id)}
                />
            ))}
        </ConstellationContainer>
    );
};

export default CareConstellation;