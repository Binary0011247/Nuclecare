// frontend/src/pages/LoginPage.jsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx'; // Note .jsx extension
import styled from 'styled-components';

const AuthContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;
const AuthBox = styled.div`
  background: #282c34; padding: 40px; border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2); width: 400px; text-align: center;
  h1 { color: #61dafb; }
`;
const Input = styled.input`
  width: 100%; padding: 12px; margin-bottom: 15px; border-radius: 6px;
  border: 1px solid #555; background: #333; color: white; font-size: 16px;
  box-sizing: border-box;
`;
const Button = styled.button`
  width: 100%; padding: 12px; border-radius: 6px; border: none;
  background: #61dafb; color: black; font-size: 16px; cursor: pointer;
  font-weight: bold; transition: background 0.2s;
  &:hover { background: #52b8d8; }
`;
const SubText = styled.p`
  margin-top: 20px;
  a { color: #61dafb; text-decoration: none; }
`;
const ErrorMsg = styled.div`
  color: #ff6b6b; background: rgba(255, 107, 107, 0.1);
  padding: 10px; border-radius: 6px; margin-bottom: 15px; text-align: left;
`;

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

 // In LoginPage.jsx

const onSubmit = async e => {
    e.preventDefault();
    setError(''); // Clear previous errors
    console.log("1. Form submitted. Attempting to log in with:", formData.email); // Log #1

    try {
        // This is where the call to the context/backend happens
        await login(formData.email, formData.password);

        console.log("2. Login API call was successful. Preparing to navigate."); // Log #2

        // This is the navigation command
        navigate('/dashboard');

    } catch (err) {
        // This block runs if the API call fails (e.g., status 400 or 500)
        console.error("3. Login API call failed. Error response:", err.response); // Log #3
        
        // This is a more robust way to get the error message
        const errorMsg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || 'Login failed. Please check your credentials.';
        setError(errorMsg);
    }
};

    return (
        <AuthContainer>
            <AuthBox>
                <h1>Welcome Back</h1>
                <p>Sign in to view your Health Aura</p>
                <form onSubmit={onSubmit}>
                    {error && <ErrorMsg>{error}</ErrorMsg>}
                    <Input type="email" name="email" placeholder="Email" value={formData.email} onChange={onChange} required />
                    <Input type="password" name="password" placeholder="Password" value={formData.password} onChange={onChange} required />
                    <Button type="submit">Login</Button>
                </form>
                <SubText>
                    Don't have an account? <Link to="/register">Sign Up</Link>
                </SubText>
            </AuthBox>
        </AuthContainer>
    );
};
export default LoginPage;