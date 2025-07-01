import React, { useMemo } from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = (color) => keyframes`
  0% { box-shadow: 0 0 8px 0px ${color}; }
  50% { box-shadow: 0 0 16px 6px ${color}; }
  100% { box-shadow: 0 0 8px 0px ${color}; }
`;

const StarContainer = styled.div`
  position: absolute;
 
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
   transform: translate(${props => props.x}px, ${props => props.y}px);
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
   will-change: transform;
 
  &:hover {
    transform: translate(${props => props.x}px, ${props => props.y}px) scale(1.2);
    z-index: 10;
  }
`;

const StarGlow = styled.div`
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background-color: ${props => props.color};
  border-radius: 50%;
  animation: ${props => pulse(props.color)} ${props => props.speed}s infinite;
  filter: blur(2px);
`;

const StarName = styled.span`
  color: white;
  font-size: 12px;
  margin-top: 8px;
  opacity: 0.7;
  text-shadow: 0 0 5px black;
  white-space: nowrap;
`;
const StarMrn = styled.span`
  color: #9ca3af;
  font-size: 10px;
  opacity: 0.8;
`;

const PatientStar = ({ patient, onClick }) => {
    const riskScore = 100 - (patient.health_score ?? 80); // Default to a low-risk score if no data

    const styleProps = useMemo(() => {
        if (riskScore > 50) return { color: '#e74c3c', speed: 1.5, size: 20 }; // High Risk - Red
        if (riskScore > 25) return { color: '#f1c40f', speed: 2.5, size: 15 }; // Medium Risk - Yellow
        return { color: '#3498db', speed: 4, size: 12 }; // Low Risk - Blue
    }, [riskScore]);

    return (
         <StarContainer x={patient.x} y={patient.y} onClick={onClick}>
            <StarGlow {...styleProps} />
            <StarName>{patient.full_name}</StarName>
            <StarMrn>MRN: {patient.mrn}</StarMrn>
        </StarContainer>
    );
};

export default PatientStar;