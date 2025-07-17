// backend/src/routes/medications.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware); // Apply auth to all medication routes

// @route   GET /api/medications
// @desc    Get all of a user's medications and their last taken time
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                m.id, m.name, m.dosage, m.frequency,
                (SELECT taken_at FROM medication_adherence_log mal 
                 WHERE mal.medication_id = m.id 
                 ORDER BY mal.taken_at DESC LIMIT 1) as last_taken
            FROM medications m
            WHERE m.user_id = $1
            ORDER BY m.created_at DESC;
        `;
        const { rows } = await db.query(query, [req.user.id]);
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/medications/log/:id
// @desc    Log a medication as taken
router.post('/log/:id', async (req, res) => {
    try {
        const medicationId = req.params.id;
        // Ensure this medication belongs to the logged-in user (for security)
        const medCheck = await db.query('SELECT user_id FROM medications WHERE id = $1', [medicationId]);
        if (medCheck.rows.length === 0 || medCheck.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ msg: 'Forbidden' });
        }

        const { rows } = await db.query(
            'INSERT INTO medication_adherence_log (medication_id) VALUES ($1) RETURNING *',
            [medicationId]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// In a full app, you would also add POST, PUT, DELETE routes for managing medications.

module.exports = router;