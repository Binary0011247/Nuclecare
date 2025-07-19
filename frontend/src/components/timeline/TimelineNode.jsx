// frontend/src/components/timeline/TimelineNode.jsx
import React from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
  70% { transform: scale(1); box-shadow: 0 0 10px 10px rgba(255, 255, 255, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
`;

const NodeWrapper = styled.div`
  position: absolute;
  top: 50%;
  left: ${props => props.position}%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  z-index: 10;
`;

const NodeOrb = styled.div`
  width: ${props => props.size || '25px'};
  height: ${props => props.size || '25px'};
  border-radius: 50%;
  background-color: ${props => props.color || '#3498db'};
  border: 2px solid rgba(255,255,255,0.7);
  box-shadow: 0 0 15px ${props => props.color || '#3498db'};
  animation: ${pulse} 2s infinite;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;

  /* Style for the glowing "completed" ring */
  &::after {
    content: '';
    display: ${props => props.isComplete ? 'block' : 'none'};
    position: absolute;
    width: calc(100% + 10px);
    height: calc(100% + 10px);
    border: 2px solid #2ecc71;
    border-radius: 50%;
    box-shadow: 0 0 10px #2ecc71;
  }
`;

const NodeLabel = styled.span`
  color: #bdc3c7;
  font-size: 0.8rem;
  margin-top: 15px;
  white-space: nowrap;
`;

const TimelineNode = ({ event, onClick }) => {
    return (
        <NodeWrapper position={event.position} onClick={() => onClick(event)}>
            <NodeOrb color={event.color} size={event.size} isComplete={event.isComplete}>
                {event.icon}
            </NodeOrb>
            <NodeLabel>{event.label}</NodeLabel>
        </NodeWrapper>
    );
};
export default TimelineNode;