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

// POST /api/patient/pulse-check
router.post('/pulse-check', async (req, res) => {
    // --- THIS IS THE ROBUST DATA CLEANING AND TYPE CONVERSION LOGIC ---
    
    // Helper function to safely convert a value to an integer, defaulting to null if empty/invalid
    const toInt = (val) => {
        if (val === null || val === undefined || val === '') return null;
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? null : parsed;
    };
    // Helper function to safely convert a value to a float (for weight)
    const toFloat = (val) => {
        if (val === null || val === undefined || val === '') return null;
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
    };

    const formData = req.body;
    const userId = req.user.id;

    // Create a clean, correctly-typed data object before sending to AI or DB
    const cleanedData = {
        mood: toInt(formData.mood),
        systolic: toInt(formData.systolic),
        diastolic: toInt(formData.diastolic),
        symptoms: formData.symptoms || null, // Default to null if empty
        heart_rate: toInt(formData.heart_rate),
        sp_o2: toInt(formData.sp_o2),
        weight: toFloat(formData.weight)
    };
    
    try {
        const dataForAI = { ...cleanedData, userId: userId };
        
        // This log will now show the cleaned data with nulls instead of empty strings
        console.log("Sending cleaned data to AI:", dataForAI);

        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5001'; // Fallback for local dev
        const aiResponse = await axios.post(`${aiServiceUrl}/api/calculate`, dataForAI,{ timeout: 30000 });
        
        const { healthScore, insight, symptomTags } = aiResponse.data;

        const query = `
            INSERT INTO patients_vitals (user_id, mood, systolic, diastolic, symptoms_text, health_score, insight_text, heart_rate, sp_o2, weight, symptom_tags)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *;
        `;
        // Pass the cleaned data to the database. PostgreSQL will correctly handle 'null'.
        const values = [
            userId, cleanedData.mood, cleanedData.systolic, cleanedData.diastolic, 
            cleanedData.symptoms, healthScore, insight, cleanedData.heart_rate, 
            cleanedData.sp_o2, cleanedData.weight, JSON.stringify(symptomTags)
        ];
        
        const { rows } = await db.query(query, values);

        // Trigger baseline update in the background (fire-and-forget)

        axios.post(`${aiServiceUrl}/api/update-baseline`, { userId: userId },{ timeout: 30000 })
             .catch(err => console.error("Non-blocking error during baseline update:", err.message));
        
        res.status(201).json(rows[0]);

    } catch (err) {
        // More descriptive logging
        console.error('Error in /pulse-check route. This might be from the AI service.');
        if (err.response) {
            // This will log the detailed HTML error page from the AI service if it crashes
            console.error('AI Service Response Data:', err.response.data);
            console.error('AI Service Response Status:', err.response.status);
        } else {
            console.error('Error:', err.message);
        }
        res.status(500).send('Server Error');
    }
});    
        


module.exports = router;