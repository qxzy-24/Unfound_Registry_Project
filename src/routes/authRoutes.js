const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

const { db } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
const authLimiter = require('../middleware/rateLimiter');
const { CHECK_EMAIL_EXISTS, INSERT_USER, GET_USER_BY_EMAIL } = require('../queries/userQueries');

/* @route   POST /register */
router.post('/register', authLimiter, async (req, res) => {
    try {
        const { email, password, user_name } = req.body;

        // --- Input validation ---
        if (!email || !password || !user_name) {
            return res.status(400).json({ error: 'Email, password, and name are required.' });
        }
        const trimmedEmail = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            return res.status(400).json({ error: 'Please provide a valid email address.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }
        if (user_name.trim().length < 2) {
            return res.status(400).json({ error: 'Name must be at least 2 characters.' });
        }

        const [existingUsers] = await db.query(CHECK_EMAIL_EXISTS, [trimmedEmail]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        await db.query(INSERT_USER, [trimmedEmail, password_hash, user_name.trim(), 'collector']);
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        console.error("Error in /api/register:", err);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

/* @route   POST /login */
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // --- Input validation ---
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const [users] = await db.query(GET_USER_BY_EMAIL, [email.trim().toLowerCase()]);
        if (users.length === 0) return res.status(400).json({ error: 'Invalid credentials' });
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
        
        const payload = { 
            user: { 
                id: user.user_id, 
                name: user.user_name, 
                email: user.email,
                user_type: user.user_type
            } 
        };
        
        jwt.sign(payload, JWT_SECRET, { expiresIn: '3h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: payload.user }); 
        });
    } catch (err) {
        console.error("Error in /api/login:", err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

module.exports = router;
