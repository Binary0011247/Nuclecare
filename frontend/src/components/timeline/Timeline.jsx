// frontend/src/components/timeline/Timeline.jsx
import React from 'react';
import styled from 'styled-components';

const TimelineWrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  height: 2px;
  background: linear-gradient(90deg, rgba(52,152,219,0), rgba(52,152,219,0.5), rgba(52,152,219,0));
`;

const TimeMarkerContainer = styled.div`
  position: absolute;
  top: 20px;
  left: ${props => props.position}%;
  color: #7f8c8d;
  font-size: 0.8rem;
  transform: translateX(-50%);
`;

const Timeline = () => {
    const timeMarkers = [
        { label: '12 AM', position: 0 },
        { label: '6 AM', position: 25 },
        { label: '12 PM', position: 50 },
        { label: '6 PM', position: 75 },
    ];
    return (
        <TimelineWrapper>
            {timeMarkers.map(marker => (
                <TimeMarkerContainer key={marker.label} position={marker.position}>
                    {marker.label}
                </TimeMarkerContainer>
            ))}
        </TimelineWrapper>
    );
};
export default Timeline;