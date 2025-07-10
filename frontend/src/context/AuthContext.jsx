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
                        logout(); // Token expired
                    } else {
                        setUser(decoded.user);
                        setToken(storedToken); // Set the token state *after* validation
                    }
                } catch (error) {
                    logout(); // Malformed token
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        };
        

        bootstrapAuth();
    }, []);

    const login = async (email, password) => {
        const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        return res; // Return the response for the page to use
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