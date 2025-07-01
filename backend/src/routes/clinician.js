// backend/src/routes/clinician.js

const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/checkRole');

// @route   GET /api/clinician/constellation-data
// @desc    Get data for all patients to display in the Care Constellation.
// @access  Private (Clinician role required)
router.get(
    '/constellation-data',
    [authMiddleware, checkRole('clinician')], // Security: Must be logged in AND be a clinician
    async (req, res) => {
        try {
            const clinicianId = req.user.id;
            const query = `
                SELECT DISTINCT ON (u.id)
                    u.id,
                    u.full_name,
                    u.mrn,
                    pv.health_score,
                    pv.created_at AS last_checkin
                FROM users u
                JOIN patient_clinician_assignments pca ON u.id = pca.patient_id
                LEFT JOIN patients_vitals pv ON u.id = pv.user_id
                 WHERE pca.clinician_id = $1 AND u.role = 'patient'
                ORDER BY u.id, pv.created_at DESC;
            `;
             const { rows } = await db.query(query, [clinicianId]);
            res.json(rows);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   GET /api/clinician/patient/:id
// @desc    Get a specific patient's complete health hub data.
// @access  Private (Clinician role required)
router.get(
    '/patient/:id',
    [authMiddleware, checkRole('clinician')],
    async (req, res) => {
        const patientId = req.params.id;
        try {
            // Use Promise.all to fetch all data concurrently for better performance
            const [profileRes, vitalsHistoryRes, medicationsRes] = await Promise.all([
                db.query('SELECT id, full_name, email,mrn FROM users WHERE id = $1 AND role = \'patient\'', [patientId]),
                db.query('SELECT * FROM patients_vitals WHERE user_id = $1 ORDER BY created_at DESC', [patientId]),
                db.query('SELECT m.id, m.name, m.dosage, m.frequency, (SELECT taken_at FROM medication_adherence_log mal WHERE mal.medication_id = m.id ORDER BY taken_at DESC LIMIT 1) as last_taken FROM medications m WHERE m.user_id = $1 ORDER BY m.name', [patientId])
            ]);

            if (profileRes.rows.length === 0) {
                return res.status(404).json({ msg: 'Patient not found' });
            }

            res.json({
                profile: profileRes.rows[0],
                vitalsHistory: vitalsHistoryRes.rows,
                medications: medicationsRes.rows
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   POST /api/clinician/patient/:id/medications
// @desc    Add (prescribe) a new medication for a patient.
// @access  Private (Clinician role required)
router.post(
    '/patient/:id/medications',
    [authMiddleware, checkRole('clinician')],
    async (req, res) => {
        const patientId = req.params.id;
        const { name, dosage, frequency } = req.body;

        if (!name || !dosage || !frequency) {
            return res.status(400).json({ msg: 'Please provide name, dosage, and frequency' });
        }

        try {
            const newMed = await db.query(
                'INSERT INTO medications (user_id, name, dosage, frequency) VALUES ($1, $2, $3, $4) RETURNING *',
                [patientId, name, dosage, frequency]
            );
            res.status(201).json(newMed.rows[0]);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

module.exports = router;