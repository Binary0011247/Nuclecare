// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const crypto = require('crypto');
// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
// In backend/src/routes/auth.js

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
// In backend/src/routes/auth.js

// @route   POST api/auth/register
// @desc    Register a user with a specific role
// @access  Public
router.post(
    '/register',
    [
        // Existing validators
        check('fullName', 'Full name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
        // --- NEW VALIDATOR ---
        // Ensures the role is one of the two allowed values.
        check('role', 'A valid role is required').isIn(['patient', 'clinician']),
        check('clinicianCode').optional({ checkFalsy: true }).isString().trim()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // --- NEW: Get role from the request body ---
        const { fullName, email, password, role,clinicianCode } = req.body;

        try {
            let userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (userResult.rows.length > 0) {
                return res.status(400).json({ msg: 'User already exists' });

            }
             let generatedCode = null;
              let generatedMrn = null;
            if (role === 'clinician') {
                const namePart = fullName.substring(0, 4).toUpperCase().replace(/\s/g, '');
                const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
                generatedCode = `${namePart}-${randomPart}`;
            }
            if (role === 'patient') {
                const randomPart1 = Math.floor(1000 + Math.random() * 9000);
                const randomPart2 = Math.floor(1000 + Math.random() * 9000);
                generatedMrn = `NUC-${randomPart1}-${randomPart2}`;
            }

            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync(password, salt);

            // --- UPDATED INSERT QUERY ---
            // We now explicitly insert the role provided by the user.
            const newUserResult = await db.query(
                'INSERT INTO users (full_name, email, password_hash, role,clinician_code,mrn) VALUES ($1, $2, $3, $4, $5,$6) RETURNING *',
                [fullName, email, passwordHash, role, generatedCode,generatedMrn] // Add 'role' to the values array
            );

            const user = newUserResult.rows[0];
             if (role === 'patient') {
                if (!clinicianCode) {
                    return res.status(400).json({ msg: 'A valid clinician code is required for patient registration.' });
                }
                const clinicianResult = await db.query(
                    "SELECT id FROM users WHERE clinician_code = $1 AND role = 'clinician'", 
                    [clinicianCode.trim().toUpperCase()]
                );
                
                if (clinicianResult.rows.length === 0) {
                    return res.status(400).json({ msg: 'Invalid Clinician Code provided.' });
                }
                const clinicianId = clinicianResult.rows[0].id;

                await db.query(
                    'INSERT INTO patient_clinician_assignments (patient_id, clinician_id) VALUES ($1, $2)',
                    [user.id, clinicianId]
                );
            }

            // This part is already correct and doesn't need to change
            const payload = { user: { id: user.id, role: user.role } };
            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '5h' },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);
// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // Check if user exists
            let userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (userResult.rows.length === 0) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            const user = userResult.rows[0];

            // Compare password
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            // Return jsonwebtoken
            const payload = { user: { id: user.id, role: user.role } }
            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '5h' },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await db.query(
            "SELECT id, full_name, email, role, clinician_code,mrn FROM users WHERE id = $1", 
            [req.user.id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/verify-identity', [
    check('email', 'Please include a valid email').isEmail(),
    check('role', 'A valid role is required').isIn(['patient', 'clinician']),
    check('uniqueId', 'A unique identifier is required').not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, role, uniqueId } = req.body;
    
    try {
        let userResult;
        // Build the query based on the selected role
        if (role === 'patient') {
            userResult = await db.query('SELECT * FROM users WHERE email = $1 AND mrn = $2 AND role = $3', [email, uniqueId.toUpperCase(), role]);
        } else { // role === 'clinician'
            userResult = await db.query('SELECT * FROM users WHERE email = $1 AND clinician_code = $2 AND role = $3', [email, uniqueId.toUpperCase(), role]);
        }

        if (userResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Verification failed. Please check the details and try again.' });
        }

        const user = userResult.rows[0];

        // Identity is verified. Now, generate a secure, one-time token for the reset.
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // Token expires in 10 minutes

        const salt = bcrypt.genSaltSync(10);
        const hashedToken = bcrypt.hashSync(resetToken, salt);
        
        await db.query(
            'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
            [hashedToken, resetExpires, user.id]
        );

        // Send the un-hashed, one-time token back to the frontend.
        // The frontend will need to include this in the next step.
        res.json({ resetPass: resetToken, userId: user.id });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- NEW: RESET PASSWORD WITH TEMPORARY PASS ---
router.post('/reset-password-with-pass', [
    check('userId', 'User ID is required').isInt(),
    check('resetPass', 'Reset pass is required').isString(),
    check('password', 'New password is required').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { userId, resetPass, password } = req.body;

    try {
        const userResult = await db.query(
            'SELECT * FROM users WHERE id = $1 AND password_reset_expires > NOW()',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Reset pass is invalid or has expired.' });
        }
        const user = userResult.rows[0];

        const isMatch = bcrypt.compareSync(resetPass, user.password_reset_token);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Reset pass is invalid or has expired.' });
        }

        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(password, salt);

        await db.query(
            'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
            [passwordHash, userId]
        );

        res.json({ msg: 'Password has been successfully reset.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;