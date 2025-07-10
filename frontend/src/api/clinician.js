import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const API_URL = `${API_BASE_URL}/api/clinician`;
const API_URL_AUTH = `${API_BASE_URL}/api/auth`;

// Fetches the data needed to draw the constellation of all patients
export const getConstellationData = () => {
    return axios.get(`${API_URL}/constellation-data`);
};

// Fetches the complete profile and health data for a single patient
export const getPatientDetails = (patientId) => {
    return axios.get(`${API_URL}/patient/${patientId}`);
};

// Adds a new medication to a specific patient's profile
export const addMedicationForPatient = (patientId, medicationData) => {
    return axios.post(`${API_URL}/patient/${patientId}/medications`, medicationData);
};
export const getMyClinicianProfile = () => {
    return axios.get(`${API_URL_AUTH}/me`);
};
export const generateSynopsis = (patientId) => {
    return axios.post(`${API_URL}/patient/${patientId}/generate-synopsis`);
};

export const getSynopsisHistory = (patientId) => {
    return axios.get(`${API_URL}/patient/${patientId}/synopsis-history`);
};

export const dischargePatient = (patientId) => {
    return axios.delete(`${API_URL}/patient/${patientId}/assignment`);
};