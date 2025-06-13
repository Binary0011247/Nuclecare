// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const db = require('../db');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post(
    '/register',
    [
        check('fullName', 'Full name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { fullName, email, password } = req.body;

        try {
            // Check if user exists
            let userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (userResult.rows.length > 0) {
                return res.status(400).json({ msg: 'User already exists' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Save user to database
            const newUserResult = await db.query(
                'INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
                [fullName, email, passwordHash]
            );
            const userId = newUserResult.rows[0].id;

            // Return jsonwebtoken
            const payload = { user: { id: userId } };
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
            const payload = { user: { id: user.id } };
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

module.exports = router;