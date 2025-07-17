import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// The base URL for all routes specific to patient data
const API_URL_PATIENT = `${API_BASE_URL}/api/patient`;

// The base URL for authentication-related routes
const API_URL_AUTH =  `${API_BASE_URL}/api/auth`;

// The base URL for patient-facing medication routes
const API_URL_MEDS =  `${API_BASE_URL}/api/medications`;

/**
 * Fetches the most recent vital sign record for the logged-in patient.
 * Used to display the current Health Aura status.
 */
export const getLatestVitals = () => {
    return axios.get(`${API_URL_PATIENT}/latest-vitals`);
};

/**
 * Fetches the last 30 days of vital sign history for the logged-in patient.
 * Used to power the trend charts on the dashboard.
 */
export const getVitalsHistory = () => {
    return axios.get(`${API_URL_PATIENT}/vitals-history`);
};

/**
 * Submits a new set of vital signs for the logged-in patient.
 * @param {object} data - The form data containing all vital readings.
 */
export const submitPulseCheck = (data) => {
    return axios.post(`${API_URL_PATIENT}/pulse-check`, data);
};

/**
 * Fetches the list of medications prescribed to the logged-in patient.
 */
export const getMedications = () => {
    return axios.get(API_URL_MEDS);
};

/**
 * Logs a specific medication as taken for the logged-in patient.
 * @param {string|number} medicationId - The ID of the medication being logged.
 */
export const logMedicationTaken = (medicationId) => {
    return axios.post(`${API_URL_MEDS}/log/${medicationId}`);
};

/**
 * Fetches the logged-in user's own profile information (name, email, role).
 * Used for personalization like the "Welcome" message.
 */
export const getMyProfile = () => {
    return axios.get(`${API_URL_AUTH}/me`);
};

export const verifyUserIdentity = (data) => {
    return axios.post(`${API_URL_AUTH}/verify-identity`, data);
};

export const resetPasswordWithPass = (data) => {
    return axios.post(`${API_URL_AUTH}/reset-password-with-pass`, data);
};