// frontend/src/api/patientApi.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/patient';

export const getLatestVitals = () => {
    return axios.get(`${API_URL}/latest-vitals`);
};

export const submitPulseCheck = (data) => {
    return axios.post(`${API_URL}/pulse-check`, data);
};