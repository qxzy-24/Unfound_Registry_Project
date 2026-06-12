const express = require('express');
const router = express.Router();

const { db } = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { COUNT_USERS, COUNT_ARTIFACTS, COUNT_STOLEN, GET_ALL_USERS, DELETE_USER } = require('../queries/adminQueries');

// --- ADMIN PANEL ENDPOINTS ---

/* @route   GET /stats */
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [userCount] = await db.query(COUNT_USERS);
        const [artifactCount] = await db.query(COUNT_ARTIFACTS);
        const [stolenCount] = await db.query(COUNT_STOLEN);

        res.json({
            users: userCount[0].count,
            artifacts: artifactCount[0].count,
            stolen: stolenCount[0].count
        });
    } catch (err) {
        console.error("Error in /api/admin/stats:", err);
        res.status(500).json({ error: 'Server error fetching stats' });
    }
});

/* @route   GET /users */
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [users] = await db.query(GET_ALL_USERS);
        res.json(users);
    } catch (err) {
        console.error("Error in /api/admin/users:", err);
        res.status(500).json({ error: 'Server error fetching users' });
    }
});

/* @route   DELETE /users/:id */
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const userIdToDelete = parseInt(req.params.id, 10);
    if (isNaN(userIdToDelete)) return res.status(400).json({ error: 'Invalid user ID.' });

    try {
        const adminId = req.user.id;

        if (userIdToDelete === adminId) {
            return res.status(400).json({ error: 'Admin cannot delete their own account.' });
        }
        
        await db.query(DELETE_USER, [userIdToDelete]);
        
        res.json({ message: 'User deleted successfully' });

    } catch (err) {
        console.error("Error in DELETE /api/admin/users/:id:", err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: 'Cannot delete user. Re-assign their artifacts first.' });
        }
        res.status(500).json({ error: 'Server error deleting user' });
    }
});

module.exports = router;
