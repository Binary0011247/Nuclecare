import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


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
    const [user, setUser] = useState(null); // New state to hold user object
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const bootstrapAuth = () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                setAuthToken(storedToken);
                try {
                    const decoded = jwtDecode(storedToken);
                    if (decoded.exp * 1000 < Date.now()) {
                        // Token is expired, so log out
                        localStorage.removeItem('token');
                        setAuthToken(null);
                    } else {
                        setUser(decoded.user);
                        setToken(storedToken);
                    }
                } catch (error) {
                    // Malformed token
                    localStorage.removeItem('token');
                    setAuthToken(null);
                }
            }
            setIsLoading(false);
        };
        bootstrapAuth();
    }, []);
        
    const login = async (email, password) => {
        const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
        localStorage.setItem('token', res.data.token);
        
        setToken(res.data.token);

         const decoded = jwtDecode(token);
        setUser(decoded.user);
        
        // Set the token state last to ensure other states are ready.
        setToken(token);
        
        // Return the decoded user so the login page knows the role.
        return decoded.user;// Return the response for the page to use
    };

    const register = async (formData) => {
        const res = await axios.post(`${API_BASE_URL}/api/auth/register`, formData);
        localStorage.setItem('token', res.data.token);
        
        setToken(res.data.token);
        return res; // Return the response
    };

    const logout = () => {
        localStorage.removeItem('token');
        
        setToken(null);
        setUser(null);
    };

    const contextValue = {
        token,
        user,
        isAuthenticated: !!user, // isAuthenticated is now derived from the user object
        isLoading,
        login,
        logout,
        register
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};