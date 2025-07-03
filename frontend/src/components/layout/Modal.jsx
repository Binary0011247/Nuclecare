// frontend/src/components/layout/Modal.jsx
import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FaTimes } from 'react-icons/fa';

// --- Animations ---
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const scaleUp = keyframes`from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; }`;

// --- Styled Components ---
const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
  background: #1f2937; /* A dark, card-like background */
  padding: 30px;
  border-radius: 12px;
  border: 1px solid #374151;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 700px; /* Max width for the report */
  position: relative;
  animation: ${scaleUp} 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    color: white;
    transform: rotate(90deg);
  }
`;

// --- The Component ---
const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <ModalBackdrop onClick={onClose}>
            {/* Stop propagation so clicking inside the modal doesn't close it */}
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <CloseButton onClick={onClose}>
                    <FaTimes />
                </CloseButton>
                {children}
            </ModalContent>
        </ModalBackdrop>
    );
};

export default Modal;