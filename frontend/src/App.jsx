import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

// Import the top-level provider for authentication
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { Toaster } from 'react-hot-toast';

// Import all the page components
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ClinicianDashboardPage from './pages/clinician/ClinicianDashBoard.jsx';
import PatientDetailPage from './pages/clinician/PatientDetailPage.jsx';

// Import utility components
import ProtectedRoute from './routing/ProtectedRoute.jsx';
import BrandingWatermark from './components/layout/BrandingWatermark.jsx';

// Import global styles
import './App.css';


function App() {
  return (
    // The AuthProvider wraps the entire application, making authentication
    // state (like token, user, isLoading) available to all child components.
    <SocketProvider>
    <AuthProvider>
      <Router>
        <div className="App">
          {/* The Routes component is where you define all possible URL paths */}
          <Routes>
            {/* --- Public Routes --- */}
            {/* These routes are accessible to anyone, even if not logged in. */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* --- Protected Patient Route --- */}
            {/* This route is wrapped by ProtectedRoute. If the user is not authenticated,
                they will be redirected to /login. */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />

            {/* --- Protected Clinician Routes --- */}
            {/* These routes are also protected and only accessible to logged-in users.
                The components themselves might have further role checks. */}
            <Route 
              path="/clinician/dashboard" 
              element={
                <ProtectedRoute>
                  <ClinicianDashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clinician/patient/:patientId" 
              element={
                <ProtectedRoute>
                  <PatientDetailPage />
                </ProtectedRoute>
              } 
            />
            
            {/* --- Fallback Route --- */}
            {/* If a user tries to access any other URL, they are redirected to /login. */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
          
          {/* The BrandingWatermark is placed outside the Routes so it appears on every page */}
          <BrandingWatermark />
          <Toaster 
              position="top-right"
              toastOptions={{
                style: {
                  background: '#333',
                  color: '#fff',
                },
              }}
            />
        </div>
      </Router>
    </AuthProvider>
    </SocketProvider>
  );
}

export default App;