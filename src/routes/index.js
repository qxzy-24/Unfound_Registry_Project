const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const artifactRoutes = require('./artifactRoutes');
const aiRoutes = require('./aiRoutes');
const adminRoutes = require('./adminRoutes');

// Mount all sub-routers under /api
router.use('/api', healthRoutes);
router.use('/api', authRoutes);
router.use('/api', artifactRoutes);
router.use('/api', aiRoutes);
router.use('/api/admin', adminRoutes);

module.exports = router;
