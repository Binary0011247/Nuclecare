// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

const setAuthToken = token => {
    if (token) {
        axios.defaults.headers.common['x-auth-token'] = token;
    } else {
        delete axios.defaults.headers.common['x-auth-token'];
    }
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            setAuthToken(token);
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setIsAuthenticated(true);
    };
    
    const register = async ({ fullName, email, password }) => {
        const res = await axios.post('http://localhost:5000/api/auth/register', { fullName, email, password });
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ token, isAuthenticated, loading, login, logout, register }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};