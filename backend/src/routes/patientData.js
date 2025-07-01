// backend/src/routes/patientData.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');
const authMiddleware = require('../middleware/authMiddleware'); // <-- IMPORT MIDDLEWARE

// Apply the middleware to all routes in this file
router.use(authMiddleware);

// GET /api/patient/latest-vitals
// Now gets vitals for the LOGGED-IN user
router.get('/latest-vitals', async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM patients_vitals WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.user.id] // <-- Use ID from the authenticated token
        );
        if (rows.length === 0) {
            return res.json({ health_score: 95, insight_text: "Welcome! Submit your first pulse check to generate your Health Aura." });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
router.get('/vitals-history', async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT systolic, diastolic, heart_rate, sp_o2, weight, created_at 
             FROM patients_vitals 
             WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
             ORDER BY created_at ASC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/patient/pulse-check
// Now saves vitals for the LOGGED-IN user
router.post('/pulse-check', async (req, res) => {
    const { mood, systolic, diastolic, symptoms, heart_rate, sp_o2, weight } = req.body;
    const userId = req.user.id; // <-- Use ID from the authenticated token

    try {
        const aiResponse = await axios.post('http://localhost:5001/api/calculate', {
            mood, systolic, diastolic, symptoms
        });
        const { healthScore, insight } = aiResponse.data;

       const query = `
    INSERT INTO patients_vitals (user_id, mood, systolic, diastolic, symptoms_text, health_score, insight_text, heart_rate, sp_o2, weight)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
        `;
        const values = [userId, mood, systolic, diastolic, symptoms, healthScore, insight, heart_rate, sp_o2, weight];
        
        const { rows } = await db.query(query, values);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error in pulse-check:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;