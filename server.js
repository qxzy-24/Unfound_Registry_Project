require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios'); // For Gemini
const multer = require('multer'); // For File Uploads
const path = require('path');   // For serving files
const fs = require('fs');       // To read files for Gemini

// --- 1. SET UP THE EXPRESS APP ---
const app = express();
const port = process.env.PORT || 3000;

// --- 2. CONFIGURE MIDDLEWARE ---
app.use(cors());
app.use(express.json()); // Allows the server to understand JSON data

// --- 3. CONFIGURE DATABASE CONNECTION ---
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'unfound_registry'
};
const pool = mysql.createPool(dbConfig);
const db = pool.promise(); // Reusable promise-based pool

// --- 4. JWT & AUTH MIDDLEWARE ---
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

// --- 5. CONFIGURE MULTER (FILE UPLOAD) ---
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save files to the 'uploads/' directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
    }
};
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});

// --- 6. SERVE STATIC ASSETS ---
// This serves all the files in your 'public' folder (like index.html)
// This MUST come before the API routes
app.use(express.static(path.join(__dirname, 'public')));
// This serves your uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- 7. RATE LIMITING (Auth endpoints) ---
const authLimiter = (() => {
    // Simple in-memory rate limiter (no extra dependency needed)
    const attempts = new Map();
    const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    const MAX_ATTEMPTS = 20;
    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();
        const record = attempts.get(key);
        if (!record || now - record.start > WINDOW_MS) {
            attempts.set(key, { start: now, count: 1 });
            return next();
        }
        record.count++;
        if (record.count > MAX_ATTEMPTS) {
            return res.status(429).json({ error: 'Too many requests. Please try again later.' });
        }
        next();
    };
})();

// --- 8. DEFINE ALL API ENDPOINTS (under '/api') ---

/* @route   GET /api/health */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* @route   GET /api/artifacts (Search/Filter) */
app.get('/api/artifacts', async (req, res) => {
    try {
        const { search, status, period } = req.query;
        let baseQuery = `
            SELECT 
                a.artifact_id, a.title, a.artist, a.period,
                s.status,
                img.image_url AS primary_image_url
            FROM 
                artifacts AS a
            LEFT JOIN 
                artifact_status AS s ON a.artifact_id = s.artifact_id
            LEFT JOIN 
                artifact_images AS img ON a.artifact_id = img.artifact_id AND img.is_primary_image = 1
        `;
        const whereClauses = [];
        const queryParams = [];
        if (search) {
            whereClauses.push('MATCH(a.title, a.description, a.artist, a.period) AGAINST(? IN NATURAL LANGUAGE MODE)');
            queryParams.push(search);
        }
        if (status) { whereClauses.push('s.status = ?'); queryParams.push(status); }
        if (period) { whereClauses.push('a.period = ?'); queryParams.push(period); }
        if (whereClauses.length > 0) {
            baseQuery += ' WHERE ' + whereClauses.join(' AND ');
        }
        baseQuery += ' ORDER BY a.artifact_id DESC;';
        const [rows] = await db.query(baseQuery, queryParams);
        res.json(rows);
    } catch (err) {
        console.error("Error in /api/artifacts:", err);
        res.status(500).json({ error: 'Server error fetching artifacts' });
    }
});

/* @route   GET /api/artifacts/:id (Details) */
app.get('/api/artifacts/:id', async (req, res) => {
    try {
        const artifactId = req.params.id;
        const artifactQuery = `
            SELECT 
                a.*, 
                s.status, s.last_seen_date, s.last_seen_location,
                u.user_name AS owner_name,
                u.user_id AS owner_id_for_check 
            FROM artifacts AS a
            LEFT JOIN artifact_status AS s ON a.artifact_id = s.artifact_id
            LEFT JOIN users AS u ON a.owner_id = u.user_id
            WHERE a.artifact_id = ?
        `;
        const imagesQuery = `SELECT image_id, image_url, is_primary_image FROM artifact_images WHERE artifact_id = ?`;
        const [artifactRows] = await db.query(artifactQuery, [artifactId]);
        const [imageRows] = await db.query(imagesQuery, [artifactId]);
        if (artifactRows.length === 0) {
            return res.status(404).json({ error: 'Artifact not found' });
        }
        const artifact = artifactRows[0];
        artifact.images = imageRows; 
        res.json(artifact);
    } catch (err) {
        console.error("Error in /api/artifacts/:id:", err);
        res.status(500).json({ error: 'Server error fetching artifact details' });
    }
});

/* @route   POST /api/register */
app.post('/api/register', authLimiter, async (req, res) => {
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

        const [existingUsers] = await db.query('SELECT user_id FROM users WHERE email = ?', [trimmedEmail]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        await db.query('INSERT INTO users (email, password_hash, user_name, user_type) VALUES (?, ?, ?, ?)', [trimmedEmail, password_hash, user_name.trim(), 'collector']);
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        console.error("Error in /api/register:", err);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

/* @route   POST /api/login */
app.post('/api/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // --- Input validation ---
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
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

/* @route   POST /api/artifacts (Create) */
app.post('/api/artifacts', authMiddleware, upload.single('artifact_image'), async (req, res) => {
    let connection;
    try {
        const { title, description, artist, period, status, last_seen_location } = req.body;
        const owner_id = req.user.id; 
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required.' });
        }
        const image_url = `/uploads/${req.file.filename}`;
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [artifactResult] = await connection.query(
            'INSERT INTO artifacts (title, description, artist, period, owner_id) VALUES (?, ?, ?, ?, ?)',
            [title, description, artist, period, owner_id]
        );
        const newArtifactId = artifactResult.insertId;
        await connection.query(
            'INSERT INTO artifact_status (artifact_id, status, last_seen_location) VALUES (?, ?, ?)',
            [newArtifactId, status, last_seen_location]
        );
        await connection.query(
            'INSERT INTO artifact_images (artifact_id, image_url, is_primary_image) VALUES (?, ?, ?)',
            [newArtifactId, image_url, true]
        );
        await connection.commit();
        res.status(201).json({ message: 'Artifact created successfully', artifactId: newArtifactId });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error in POST /api/artifacts:", err);
        res.status(500).json({ error: 'Server error creating artifact' });
    } finally {
        if (connection) connection.release();
    }
});

/* @route   PUT /api/artifacts/:id (Update) */
app.put('/api/artifacts/:id', authMiddleware, upload.single('artifact_image'), async (req, res) => {
    const artifactId = parseInt(req.params.id, 10);
    if (isNaN(artifactId)) return res.status(400).json({ error: 'Invalid artifact ID.' });

    let connection;
    try {
        const userId = req.user.id;
        const { title, description, artist, period, status, last_seen_location, existing_image_url } = req.body;
        connection = await db.getConnection();
        const [artifacts] = await connection.query('SELECT owner_id FROM artifacts WHERE artifact_id = ?', [artifactId]);
        if (artifacts.length === 0) {
            return res.status(404).json({ error: 'Artifact not found' });
        }
        // --- Admin Edit Fix ---
        // Allow update if user is the owner OR is an admin
        if (artifacts[0].owner_id !== userId && req.user.user_type !== 'admin') {
            return res.status(403).json({ error: 'User not authorized to edit this artifact' });
        }
        let newImageUrl = existing_image_url; 
        if (req.file) {
            newImageUrl = `/uploads/${req.file.filename}`;
        }
        await connection.beginTransaction();
        await connection.query(
            'UPDATE artifacts SET title = ?, description = ?, artist = ?, period = ? WHERE artifact_id = ?',
            [title, description, artist, period, artifactId]
        );
        await connection.query(
            'UPDATE artifact_status SET status = ?, last_seen_location = ? WHERE artifact_id = ?',
            [status, last_seen_location, artifactId]
        );
        if(req.file) { 
             await connection.query(
                'UPDATE artifact_images SET image_url = ? WHERE artifact_id = ? AND is_primary_image = 1',
                [newImageUrl, artifactId]
            );
        }
        await connection.commit();
        res.json({ message: 'Artifact updated successfully' });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error in PUT /api/artifacts/:id:", err);
        res.status(500).json({ error: 'Server error updating artifact' });
    } finally {
        if (connection) connection.release();
    }
});

/* @route   DELETE /api/artifacts/:id (Delete) */
app.delete('/api/artifacts/:id', authMiddleware, async (req, res) => {
    const artifactId = parseInt(req.params.id, 10);
    if (isNaN(artifactId)) return res.status(400).json({ error: 'Invalid artifact ID.' });

    try {
        const userId = req.user.id;
        const [artifacts] = await db.query('SELECT owner_id FROM artifacts WHERE artifact_id = ?', [artifactId]);
        if (artifacts.length === 0) {
            return res.status(404).json({ error: 'Artifact not found' });
        }
        const artifact = artifacts[0];
        if (artifact.owner_id !== userId && req.user.user_type !== 'admin') { 
            return res.status(403).json({ error: 'User not authorized to delete this artifact' });
        }
        await db.query('DELETE FROM artifacts WHERE artifact_id = ?', [artifactId]);
        res.json({ message: 'Artifact deleted successfully' });
    } catch (err) {
        console.error("Error in DELETE /api/artifacts/:id:", err);
        res.status(500).json({ error: 'Server error deleting artifact' });
    }
});


/* @route   POST /api/analyze-image */
app.post('/api/analyze-image', authMiddleware, upload.single('image_to_analyze'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided.' });
        }
        
        const imagePath = path.join(__dirname, req.file.path);
        const imageBuffer = fs.readFileSync(imagePath);
        const imageBase64 = imageBuffer.toString('base64');
        const mimeType = req.file.mimetype;

        fs.unlinkSync(imagePath); // Delete the temp file

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is not set on the server.' });
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: "Analyze this image of an art piece. In 50 words or less, describe what it is, its likely style or period, and its materials. Example: 'A Baroque-style oil on canvas painting of a woman, 17th century.'" },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: imageBase64
                            }
                        }
                    ]
                }
            ],
        };
        
        const response = await axios.post(apiUrl, payload);
        
        const candidate = response.data.candidates?.[0];
        if (candidate && candidate.content?.parts?.[0]?.text) {
            res.json({ description: candidate.content.parts[0].text });
        } else {
            throw new Error('Invalid response structure from Gemini API.');
        }

    } catch (err) {
        console.error("Error in /api/analyze-image:", err.response ? err.response.data : err.message);
        res.status(500).json({ error: 'Error analyzing image with AI.' });
    }
});


/* @route   POST /api/generate-report (Server-side Gemini proxy for report generation) */
app.post('/api/generate-report', authMiddleware, async (req, res) => {
    try {
        const { artifactId, userNote } = req.body;
        if (!artifactId || !userNote) {
            return res.status(400).json({ error: 'Artifact ID and user note are required.' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is not set on the server.' });
        }

        // Fetch artifact details
        const [rows] = await db.query(
            `SELECT a.*, s.status, s.last_seen_location FROM artifacts a 
             LEFT JOIN artifact_status s ON a.artifact_id = s.artifact_id 
             WHERE a.artifact_id = ?`, [parseInt(artifactId, 10)]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Artifact not found.' });
        }
        const artifact = rows[0];

        const systemInstruction = "You are an art recovery specialist and professional report writer. Your tone is formal, clear, and urgent. You are drafting a communication about a lost or stolen piece of art. Start with a clear subject line. Do not include any pre-amble like 'Here is the draft'.";
        const userQuery = `
            Please draft a formal sighting report email based on the following information.
            
            Artifact Details:
            - Title: ${artifact.title}
            - Artist: ${artifact.artist || 'Unknown'}
            - Period: ${artifact.period || 'Unknown'}
            - Status: ${artifact.status}
            - Last Known Location: ${artifact.last_seen_location}
            - Description: ${artifact.description}

            New Sighting Information (from user):
            - ${userNote}

            Draft a professional email that clearly states the artifact's identity and the new information. The email should be suitable for sending to a museum, insurance company, or law enforcement.
        `;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
        };

        const response = await axios.post(apiUrl, payload);
        const candidate = response.data.candidates?.[0];
        if (candidate && candidate.content?.parts?.[0]?.text) {
            res.json({ report: candidate.content.parts[0].text });
        } else {
            throw new Error('Invalid response structure from Gemini API.');
        }
    } catch (err) {
        console.error("Error in /api/generate-report:", err.response ? err.response.data : err.message);
        res.status(500).json({ error: 'Error generating report with AI.' });
    }
});


// --- ADMIN PANEL ENDPOINTS ---

/* @route   GET /api/admin/stats */
app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [userCount] = await db.query("SELECT COUNT(*) as count FROM users");
        const [artifactCount] = await db.query("SELECT COUNT(*) as count FROM artifacts");
        const [stolenCount] = await db.query("SELECT COUNT(*) as count FROM artifact_status WHERE status = 'Stolen'");

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

/* @route   GET /api/admin/users */
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [users] = await db.query("SELECT user_id, user_name, email, user_type FROM users ORDER BY user_id ASC");
        res.json(users);
    } catch (err) {
        console.error("Error in /api/admin/users:", err);
        res.status(500).json({ error: 'Server error fetching users' });
    }
});

/* @route   DELETE /api/admin/users/:id */
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const userIdToDelete = parseInt(req.params.id, 10);
    if (isNaN(userIdToDelete)) return res.status(400).json({ error: 'Invalid user ID.' });

    try {
        const adminId = req.user.id;

        if (userIdToDelete === adminId) {
            return res.status(400).json({ error: 'Admin cannot delete their own account.' });
        }
        
        await db.query('DELETE FROM users WHERE user_id = ?', [userIdToDelete]);
        
        res.json({ message: 'User deleted successfully' });

    } catch (err) {
        console.error("Error in DELETE /api/admin/users/:id:", err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: 'Cannot delete user. Re-assign their artifacts first.' });
        }
        res.status(500).json({ error: 'Server error deleting user' });
    }
});


// --- CENTRALIZED ERROR HANDLER ---
// Catches multer errors (file type/size) and any unhandled route errors
app.use((err, req, res, next) => {
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
});

// --- START THE SERVER ---
const server = app.listen(port, () => {
    console.log(`Unfound Registry server running on http://localhost:${port}`);
});

// --- GRACEFUL SHUTDOWN ---
const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
        pool.end(() => {
            console.log('Database pool closed. Goodbye!');
            process.exit(0);
        });
    });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
