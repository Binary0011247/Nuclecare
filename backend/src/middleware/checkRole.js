// backend/src/middleware/checkRole.js

/**
 * Middleware factory to check for a specific user role.
 * @param {string} role - The role to check for (e.g., 'clinician').
 * @returns {function} An Express middleware function.
 */
module.exports = function(role) {
  return function(req, res, next) {
    // req.user is attached by the preceding authMiddleware
    if (req.user && req.user.role === role) {
      // If the role matches, proceed to the next middleware or route handler
      next();
    } else {
      // If the role does not match, send a 403 Forbidden error
      res.status(403).json({ msg: 'Forbidden: Access is denied for this role.' });
    }
  }
}