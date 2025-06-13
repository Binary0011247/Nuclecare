// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../../.env' }); // Adjust path to find .env

module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Add user from payload to the request object
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};