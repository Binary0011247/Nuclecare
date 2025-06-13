// frontend/src/routing/ProtectedRoute.jsx (Corrected Version)

import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import Spinner from '../components/layout/Spinner.jsx';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useContext(AuthContext);

    if (loading) {
        // While the auth state is being determined, show a spinner
        return <Spinner />;
    }

    if (!isAuthenticated) {
        // If not authenticated, redirect to the login page
        return <Navigate to="/login" replace />;
    }

    // If authenticated, render the child component that was passed in
    return children;
};

export default ProtectedRoute;