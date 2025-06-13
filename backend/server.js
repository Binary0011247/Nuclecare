// backend/server.js (Final Version)

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// --- START: NEW CORS CONFIGURATION ---
const corsOptions = {
  origin: '*', // Allow all origins for development
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
// --- END: NEW CORS CONFIGURATION ---

app.use(express.json());

// API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/patient', require('./src/routes/patientData'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));