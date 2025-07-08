// backend/server.js (Final Version)

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

const allowedOrigins = [
  'http://localhost:5173', // Your local development frontend
  'https://nuclecare-frontend.vercel.app/' // Your deployed production frontend
];

// --- START: NEW CORS CONFIGURATION ---
const corsOptions = {
  origin:  function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }, // Allow all origins for development
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
app.use('/api/medications', require('./src/routes/medications'));
app.use('/api/clinician', require('./src/routes/clinician'));
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));