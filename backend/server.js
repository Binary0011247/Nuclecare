// backend/server.js (Final Version)

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
const server = http.createServer(app);



// --- START: NEW CORS CONFIGURATION ---
const corsOptions = {
  origin: '*', // Allow all origins for development
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
// --- END: NEW CORS CONFIGURATION ---
const io = new Server(server, {
  cors: {
    origin: "*", // Must also allow connections from your frontend domain
    methods: ["GET", "POST"]
  }
});

app.use((req, _res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] A user connected: ${socket.id}`);
  
  socket.on('join_patient_room', (patientId) => {
    socket.join(patientId.toString());
    console.log(`[Socket.IO] Socket ${socket.id} joined room for patient ${patientId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] User disconnected: ${socket.id}`);
  });
});

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use((req, _res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] Received a ${req.method} request for ${req.originalUrl}`);
  next(); // This is crucial - it passes control to the next handler (your API routes)
});

app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/patient', require('./src/routes/patientData'));
app.use('/api/medications', require('./src/routes/medications'));
app.use('/api/clinician', require('./src/routes/clinician'));
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Backend server with WebSockets running on port ${PORT}`));

module.exports.io = io;