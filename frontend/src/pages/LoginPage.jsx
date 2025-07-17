import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { verifyUserIdentity, resetPasswordWithPass } from '../api/patient.js'; 
import { jwtDecode } from 'jwt-decode';
import styled, { keyframes } from 'styled-components';
import { FaEnvelope, FaLock, FaUserMd, FaUserInjured } from 'react-icons/fa';
import Modal from '../components/layout/Modal.jsx';
import Spinner from '../components/layout/Spinner.jsx'; // Import your Spinner component


// --- Styled Components for the UI ---

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: #1a1d23;
  color: white;
`;

const VisualPanel = styled.div`
  width: 50%;
  background: radial-gradient(circle, #2c3e50, #1a1d23);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  text-align: center;

  h1 {
    font-size: 3.5rem;
    margin-bottom: 20px;
    letter-spacing: 2px;
    font-weight: 300;
  }
  
  p {
    font-size: 1.2rem;
    color: #bdc3c7;
    max-width: 450px;
    line-height: 1.6;
  }

  /* Responsive: Hide this panel on smaller screens */
  @media (max-width: 900px) {
    display: none;
  }
`;

const FormPanel = styled.div`
  width: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  
  /* Responsive: Make this panel take up the full width on smaller screens */
  @media (max-width: 900px) {
    width: 100%;
  }
`;

const FormBox = styled.div`
  max-width: 400px;
  width: 100%;

  h2 {
    font-size: 2.5rem;
    text-align: center;
    margin-bottom: 10px;
    font-weight: 600;
  }

  p {
    color: #7f8c8d;
    text-align: center;
    margin-bottom: 30px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const Icon = styled.div`
  position: absolute;
  top: 50%;
  left: 15px;
  transform: translateY(-50%);
  color: #7f8c8d;
  z-index: 1;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 15px 15px 15px 50px;
  border-radius: 8px;
  border: 1px solid #34495e;
  background: #2c3e50;
  color: white;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #61dafb;
  }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const ButtonSpinner = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: black;
  border-radius: 50%;
  width: 20px; /* Slightly larger spinner for better visibility */
  height: 20px;
  animation: ${spin} 0.8s linear infinite;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 15px;
  border-radius: 8px;
  border: none;
  background: #61dafb;
  color: #1a1d23;
  font-size: 1.1rem;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s ease;

  min-height: 53px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;

  &:hover {
    background: #52b8d8;
  }
  
  &:disabled {
    background: #7f8c8d;
    cursor: not-allowed;
  }
`;

const SubText = styled.p`
  margin-top: 20px !important;
  text-align: center;
  color: #7f8c8d !important;

  a {
    color: #61dafb;
    text-decoration: none;
    font-weight: bold;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
  padding: 12px;
  border-radius: 6px;
  text-align: center;
`;

const ModalTitle = styled.h2`
  color: white;
  margin-top: 0;
  margin-bottom: 15px;
  text-align: center;
`;
const ModalDescription = styled.p`
  color: #bdc3c7;
  text-align: center;
  margin-bottom: 25px;
`;
const RoleSelector = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
`;
const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border: 1px solid #34495e;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: ${props => props.checked ? '#3498db' : 'transparent'};
  color: ${props => props.checked ? 'white' : '#bdc3c7'};
  
  input {
    display: none;
  }
`;
const ModalMessage = styled.p`
  text-align: center;
  font-weight: bold;
  margin-top: 15px;
  color: ${props => props.type === 'error' ? '#e74c3c' : '#2ecc71'};
`;

// --- The React Component ---

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [modalStage, setModalStage] = useState('verify');
    const [resetRole, setResetRole] = useState('patient');
    const [resetEmail, setResetEmail] = useState('');
    const [uniqueId, setUniqueId] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [tempResetPass, setTempResetPass] = useState(null);
    const [userIdToReset, setUserIdToReset] = useState(null);
    const [modalMessage, setModalMessage] = useState({ type: '', text: '' });
    const [isModalLoading, setIsModalLoading] = useState(false);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const user = await login(formData.email, formData.password);
            
            // The token is now in localStorage. Decode it to find the user's role for navigation.
            //const token = localStorage.getItem('token');
            //const decoded = jwtDecode(token);
            
            if (user.role === 'clinician') {
              navigate('/clinician/dashboard');
            } else {
              navigate('/dashboard');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Login failed. Please check your credentials.';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };
const handleVerifyIdentity = async () => {
        setIsModalLoading(true);
        setModalMessage({ type: '', text: '' });
        try {
            const res = await verifyUserIdentity({ email: resetEmail, role: resetRole, uniqueId });
            setTempResetPass(res.data.resetPass);
            setUserIdToReset(res.data.userId);
            setModalStage('reset');
        } catch (err) {
            setModalMessage({ type: 'error', text: err.response?.data?.msg || 'Verification failed.' });
        } finally {
            setIsModalLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (newPassword !== confirmPassword) {
            setModalMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }
        setIsModalLoading(true);
        setModalMessage({ type: '', text: '' });
        try {
            const res = await resetPasswordWithPass({ userId: userIdToReset, resetPass: tempResetPass, password: newPassword });
            setModalMessage({ type: 'success', text: res.data.msg });
            setModalStage('success');
            setTimeout(() => {
                setIsForgotModalOpen(false);
                setModalStage('verify'); // Reset for next time
            }, 3000);
        } catch (err) {
            setModalMessage({ type: 'error', text: err.response?.data?.msg || 'Reset failed.' });
        } finally {
            setIsModalLoading(false);
        }
    };
    return (
      <>
        <PageContainer>
            <VisualPanel>
                <h1>Welcome Back</h1>
                <p>Your health data is a story. Let's see today's chapter.</p>
            </VisualPanel>
            <FormPanel>
                <FormBox>
                    <h2>Sign In</h2>
                    <p>Enter your credentials to continue</p>
                    <Form onSubmit={onSubmit}>
                        {error && <ErrorMessage>{error}</ErrorMessage>}
                        <InputWrapper>
                          <Icon><FaEnvelope /></Icon>
                          <StyledInput type="email" name="email" placeholder="Email" value={formData.email} onChange={onChange} required disabled={isLoading} />
                        </InputWrapper>
                        
                        <InputWrapper>
                          <Icon><FaLock /></Icon>
                          <StyledInput type="password" name="password" placeholder="Password" value={formData.password} onChange={onChange} required disabled={isLoading} />
                        </InputWrapper>
                        
                        <SubmitButton type="submit" disabled={isLoading}>
                          {isLoading ? <ButtonSpinner /> : 'Login'}
                        </SubmitButton>
                    </Form>
                    <SubText>
                            <a href="#" onClick={(e) => { e.preventDefault(); setIsForgotModalOpen(true); }}>Forgot Password?</a>
                        </SubText>
                    <SubText>
                        Don't have an account? <Link to="/register">Sign Up</Link>
                    </SubText>
                </FormBox>
            </FormPanel>
        </PageContainer>
        <Modal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)}>
                {modalStage === 'verify' && (
                    <>
                        <ModalTitle>Identity Verification</ModalTitle>
                        <ModalDescription>To reset your password, please verify your identity.</ModalDescription>
                        <RoleSelector>
                            <RadioLabel checked={resetRole === 'patient'}>
                                <input type="radio" value="patient" checked={resetRole === 'patient'} onChange={(e) => setResetRole(e.target.value)} />
                                <FaUserInjured /> Patient
                            </RadioLabel>
                            <RadioLabel checked={resetRole === 'clinician'}>
                                <input type="radio" value="clinician" checked={resetRole === 'clinician'} onChange={(e) => setResetRole(e.target.value)} />
                                <FaUserMd /> Clinician
                            </RadioLabel>
                        </RoleSelector>
                        <StyledInput type="email" placeholder="Your Email Address" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                        <StyledInput style={{marginTop: '15px'}} type="text" placeholder={resetRole === 'patient' ? "Your Patient MRN" : "Your Clinician Code"} value={uniqueId} onChange={(e) => setUniqueId(e.target.value.toUpperCase())} />
                        <SubmitButton style={{marginTop: '20px'}} onClick={handleVerifyIdentity} disabled={isModalLoading}>
                            {isModalLoading ? <ButtonSpinner /> : 'Verify Identity'}
                        </SubmitButton>
                    </>
                )}
                {modalStage === 'reset' && (
                    <>
                        <ModalTitle>Set New Password</ModalTitle>
                        <ModalDescription>Verification successful. Please set a new password.</ModalDescription>
                        <StyledInput type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        <StyledInput style={{marginTop: '15px'}} type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        <SubmitButton style={{marginTop: '20px'}} onClick={handleResetPassword} disabled={isModalLoading}>
                            {isModalLoading ? <ButtonSpinner /> : 'Update Password'}
                        </SubmitButton>
                    </>
                )}
                {modalStage === 'success' && (
                    <>
                        <ModalTitle>Success!</ModalTitle>
                        <ModalDescription>{modalMessage.text}</ModalDescription>
                    </>
                )}
                {modalMessage.text && modalStage !== 'success' && <ModalMessage type={modalMessage.type}>{modalMessage.text}</ModalMessage>}
            </Modal>
        </>
    );
};

export default LoginPage;