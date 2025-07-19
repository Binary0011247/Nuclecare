import React, { useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { BsFillHeartPulseFill } from 'react-icons/bs'; // Using the correct medical heart icon

// --- Keyframes for Animations ---

const pump = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); } /* A subtle pump effect */
  100% { transform: scale(1); }
`;

const glow = (color) => keyframes`
  0% { filter: drop-shadow(0 0 4px ${color}); }
  50% { filter: drop-shadow(0 0 16px ${color}); }
  100% { filter: drop-shadow(0 0 4px ${color}); }
`;


// --- Styled Components ---

const AuraContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const HeartIconWrapper = styled.div`
  color: ${props => props.color};
  animation: 
    ${props => pump} ${props => props.speed}s ease-in-out infinite,
    ${props => glow(props.color)} ${props => props.speed * 2}s linear infinite;
  transition: color 1.5s ease;
  
  /* We add a drop shadow to the icon itself to lift it off the background */
  filter: drop-shadow(0 4px 15px rgba(0,0,0,0.5));
`;

const InsightText = styled.p`
  margin-top: 25px;
  font-style: italic;
  font-size: 1.2rem; /* Slightly larger for better readability */
  color: #ecf0f1; /* Brighter text color */
  max-width: 450px;
  text-align: center;
  /* Add a subtle text shadow to make it pop */
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
`;


// --- The React Component ---

const HealthAura = ({ healthScore, insight }) => {
  // Memoize the style calculation to prevent re-calculating on every render
  const auraStyle = useMemo(() => {
    // Default to a healthy state if no score is provided yet
    const score = healthScore ?? 95;

    if (score > 85) {
      // Healthy State: A clinical, reassuring green
      return { color: '#2ecc71', speed: 1.8}
    } else if (score > 60) {
      // Watchful State: A standard warning yellow/amber
      return { color: '#f1c40f', speed: 1.2 }; 
    } else {
      // Concern State: An urgent, clinical red
      return { color: '#e74c3c', speed: 0.8 }; 
    }
  }, [healthScore]);

  return (
    <AuraContainer>
      <HeartIconWrapper color={auraStyle.color} speed={auraStyle.speed}>
        {/* Render the medical heart icon with a large size */}
        <BsFillHeartPulseFill size={140} />
      </HeartIconWrapper>
      <InsightText>
        {insight || "Submit your first pulse check to generate your Health Aura."}
      </InsightText>
    </AuraContainer>
  );
};

export default HealthAura;