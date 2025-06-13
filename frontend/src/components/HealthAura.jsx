// frontend/src/components/HealthAura.jsx
import React, { useMemo } from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 10px 20px rgba(0, 0, 0, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
`;

const AuraContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 20px auto;
`;

const AuraOrb = styled.div`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, ${props => props.color1}, ${props => props.color2});
  animation: ${pulse} ${props => props.speed}s infinite;
  box-shadow: 0 0 50px ${props => props.color1};
  transition: all 1.5s ease;
  cursor: pointer;
`;

const InsightText = styled.p`
    margin-top: 20px;
    font-style: italic;
    color: #eee;
    max-width: 300px;
    text-align: center;
`;

const HealthAura = ({ healthScore = 95, insight = "Loading..." }) => {
  const auraStyle = useMemo(() => {
    if (healthScore > 85) {
      return { color1: '#FFD700', color2: '#FFA500', speed: 4 };
    } else if (healthScore > 60) {
      return { color1: '#87CEEB', color2: '#4682B4', speed: 2.5 };
    } else {
      return { color1: '#DDA0DD', color2: '#BA55D3', speed: 1.5 };
    }
  }, [healthScore]);

  return (
    <AuraContainer>
      <AuraOrb {...auraStyle} />
      <InsightText>{insight}</InsightText>
    </AuraContainer>
  );
};

export default HealthAura;