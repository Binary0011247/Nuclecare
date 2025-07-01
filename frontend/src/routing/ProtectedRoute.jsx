import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import Spinner from '../components/layout/Spinner.jsx';

const ProtectedRoute = ({ children }) => {
    // We now check both isLoading and isAuthenticated
    const { isAuthenticated, isLoading } = useContext(AuthContext);

    // If the context is still loading the token state, show a spinner
    if (isLoading) {
        return <Spinner />;
    }

    // If loading is finished AND the user is not authenticated, redirect
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Otherwise, show the requested page
    return children;
};

export default ProtectedRoute;