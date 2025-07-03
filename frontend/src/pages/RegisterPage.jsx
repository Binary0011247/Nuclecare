import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { jwtDecode } from 'jwt-decode';
import styled, { keyframes } from 'styled-components';
import { FaUser, FaEnvelope, FaLock, FaUserMd,FaStethoscope } from 'react-icons/fa';

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
  @media (max-width: 900px) {
    display: none;
  }
`;

const LogoImage = styled.img`
  width: 150px;
  height: auto;
  margin-bottom: 40px;
`;

const BrandTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 15px;
  letter-spacing: 1px;
  color: white;
`;

const BrandSlogan = styled.p`
  font-size: 1.1rem;
  color: #bdc3c7;
  max-width: 400px;
  line-height: 1.6;
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

const StyledSelect = styled.select`
  width: 100%;
  padding: 15px 15px 15px 50px;
  border-radius: 8px;
  border: 1px solid #34495e;
  background: #2c3e50;
  color: white;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;

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
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'patient' ,clinicianCode: ''});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData);
      const token = localStorage.getItem('token');
      if (!token) {
            throw new Error("Registration succeeded but no token was found.");
        }
      const decoded = jwtDecode(token);
      
      if (decoded.user.role === 'clinician') {
        navigate('/clinician/dashboard');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      const errorMsg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || 'Registration failed. Please try again.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <VisualPanel>
        <LogoImage src="Nuclecare\frontend\public\freepik__the-style-is-candid-image-photography-with-natural__44544.jpeg" alt="Nuclecare Logo" />
        <BrandTitle>NucleCare</BrandTitle>
        <BrandSlogan>Your journey to proactive, intelligent healthcare starts with a trusted partner.</BrandSlogan>
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
            
            <InputWrapper>
              <Icon><FaUserMd /></Icon>
              <StyledSelect name="role" value={formData.role} onChange={onChange} disabled={isLoading}>
                <option value="patient">I am a Patient</option>
                <option value="clinician">I am a Clinician</option>
              </StyledSelect>
            </InputWrapper>
            {/* This field only appears if the selected role is 'patient' */}
                        {formData.role === 'patient' && (
                            <InputWrapper>
                                <Icon><FaStethoscope /></Icon>
                                <StyledInput 
                                    type="text" 
                                    name="clinicianCode"
                                    placeholder="Enter Your Clinician's Code"
                                    value={formData.clinicianCode}
                                    onChange={onChange}
                                    required 
                                    disabled={isLoading} 
                                />
                            </InputWrapper>
                        )}

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