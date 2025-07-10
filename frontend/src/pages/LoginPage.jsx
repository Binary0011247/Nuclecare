import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { jwtDecode } from 'jwt-decode';
import styled, { keyframes } from 'styled-components';
import { FaEnvelope, FaLock } from 'react-icons/fa';

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

const Spinner = styled.div`
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: black;
  border-radius: 50%;
  width: 16px;
  height: 16px;
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

// --- The React Component ---

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

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

    return (
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
                          {isLoading ? <Spinner /> : 'Login'}
                        </SubmitButton>
                    </Form>
                    <SubText>
                        Don't have an account? <Link to="/register">Sign Up</Link>
                    </SubText>
                </FormBox>
            </FormPanel>
        </PageContainer>
    );
};

export default LoginPage;