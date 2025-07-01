import React from 'react';
import styled, { keyframes } from 'styled-components';

// --- Styled Components for the Watermark ---
const breatheAnimation = keyframes`
  0% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.02); }
  100% { opacity: 0.7; transform: scale(1); }
`;
const WatermarkContainer = styled.div`
   position: fixed;
  bottom: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 9999;
  pointer-events: none;
  user-select: none;
  animation: ${breatheAnimation} 5s ease-in-out infinite;

    background: rgba(17, 24, 39, 0.7); /* Dark semi-transparent background */
  padding: 8px 12px;
  border-radius: 8px;
  backdrop-filter: blur(5px);
  border: 1px solid #374151; /* Dark border color */
  
  /* Hide it on very small mobile screens where it might get in the way */
  @media (max-width: 768px) {
     gap: 0;
    padding: 8px;
  }
`;


const WatermarkLogo = styled.img`
  height: 28px; /* A small, clean size */
  width: auto;
  filter: grayscale(100%) brightness(1.5); /* A subtle, monochrome effect */
`;

const WatermarkText = styled.p`
  font-size: 0.85rem;
  color: #888; /* A light grey, non-distracting color */
  margin: 0;
  font-weight: 500;
`;


// --- The React Component ---

const BrandingWatermark = () => {
    return (
        <WatermarkContainer>
            <WatermarkLogo src="/myeasypharma-logo.jpg" alt="Myeasypharma Logo" />
            <WatermarkText>
                Powered by Myeasypharma Pvt Ltd
            </WatermarkText>
        </WatermarkContainer>
    );
};

export default BrandingWatermark;