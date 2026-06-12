const jwt = require('jsonwebtoken');

// --- JWT & AUTH MIDDLEWARE ---
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-env';

const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ error: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user; // Add user payload to the request
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.user.user_type !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Must be an admin.' });
    }
    next();
};

module.exports = { JWT_SECRET, authMiddleware, adminMiddleware };
