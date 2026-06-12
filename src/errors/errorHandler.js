const multer = require('multer');

// --- CENTRALIZED ERROR HANDLER ---
// Catches multer errors (file type/size) and any unhandled route errors
const errorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File is too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ error: err.message });
    }
    if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({ error: err.message });
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'An unexpected server error occurred.' });
};

module.exports = errorHandler;
