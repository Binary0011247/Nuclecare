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

app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/patient', require('./src/routes/patientData'));
app.use('/api/medications', require('./src/routes/medications'));
app.use('/api/clinician', require('./src/routes/clinician'));
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));