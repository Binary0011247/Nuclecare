// frontend/src/components/layout/Spinner.jsx
import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerContainer = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #61dafb;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: ${spin} 1s linear infinite;
  margin: 40px auto;
`;

const Spinner = () => <SpinnerContainer />;
export default Spinner;