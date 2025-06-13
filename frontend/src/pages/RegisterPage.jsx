import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import styled, { keyframes } from 'styled-components';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa'; // Import icons

// --- Styled Components ---

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: #1a1d23;
`;

const VisualPanel = styled.div`
  width: 50%;
  background: radial-gradient(circle, #2c3e50, #1a1d23);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  padding: 40px;
  text-align: center;
  h1 {
    font-size: 3rem;
    margin-bottom: 20px;
    letter-spacing: 2px;
  }
  p {
    font-size: 1.2rem;
    color: #bdc3c7;
  }
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
  @media (max-width: 900px) {
    width: 100%;
  }
`;

const FormBox = styled.div`
  max-width: 400px;
  width: 100%;
  h2 {
    color: white;
    font-size: 2.5rem;
    text-align: center;
    margin-bottom: 10px;
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
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 15px 15px 15px 50px; /* Make space for the icon */
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

const RegisterPage = () => {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // New state for loading
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setError(''); // Clear previous errors

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true); // Start loading

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || 'Registration failed. Please try again.';
      setError(errorMsg);
    } finally {
      setIsLoading(false); // Stop loading regardless of outcome
    }
  };

  return (
    <PageContainer>
      <VisualPanel>
        <h1>Join Nuclecare.</h1>
        <p>Your journey to proactive, intelligent healthcare starts here.</p>
      </VisualPanel>
      <FormPanel>
        <FormBox>
          <h2>Create Your Account</h2>
          <p>Begin your wellness journey with Nuclecare</p>
          <Form onSubmit={onSubmit}>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            
            <InputWrapper>
              <Icon><FaUser /></Icon>
              <StyledInput type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={onChange} required disabled={isLoading} />
            </InputWrapper>
            
            <InputWrapper>
              <Icon><FaEnvelope /></Icon>
              <StyledInput type="email" name="email" placeholder="Email" value={formData.email} onChange={onChange} required disabled={isLoading} />
            </InputWrapper>
            
            <InputWrapper>
              <Icon><FaLock /></Icon>
              <StyledInput type="password" name="password" placeholder="Password" value={formData.password} onChange={onChange} required disabled={isLoading} />
            </InputWrapper>
            
            <SubmitButton type="submit" disabled={isLoading}>
              {isLoading ? <Spinner /> : 'Register'}
            </SubmitButton>
          </Form>
          <SubText>
            Already have an account? <Link to="/login">Sign In</Link>
          </SubText>
        </FormBox>
      </FormPanel>
    </PageContainer>
  );
};

export default RegisterPage;