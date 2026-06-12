const express = require('express');
const router = express.Router();

const { db } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
    GET_ARTIFACTS_BASE,
    FULLTEXT_SEARCH_CLAUSE,
    GET_ARTIFACT_DETAIL,
    GET_ARTIFACT_IMAGES,
    INSERT_ARTIFACT,
    INSERT_ARTIFACT_STATUS,
    INSERT_ARTIFACT_IMAGE,
    GET_ARTIFACT_OWNER,
    UPDATE_ARTIFACT,
    UPDATE_ARTIFACT_STATUS,
    UPDATE_ARTIFACT_IMAGE,
    DELETE_ARTIFACT,
} = require('../queries/artifactQueries');

/* @route   GET /artifacts (Search/Filter) */
router.get('/artifacts', async (req, res) => {
    try {
        const { search, status, period } = req.query;
        let baseQuery = GET_ARTIFACTS_BASE;
        const whereClauses = [];
        const queryParams = [];
        if (search) {
            whereClauses.push(FULLTEXT_SEARCH_CLAUSE);
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

/* @route   GET /artifacts/:id (Details) */
router.get('/artifacts/:id', async (req, res) => {
    try {
        const artifactId = req.params.id;
        const [artifactRows] = await db.query(GET_ARTIFACT_DETAIL, [artifactId]);
        const [imageRows] = await db.query(GET_ARTIFACT_IMAGES, [artifactId]);
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

/* @route   POST /artifacts (Create) */
router.post('/artifacts', authMiddleware, upload.single('artifact_image'), async (req, res) => {
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
            INSERT_ARTIFACT,
            [title, description, artist, period, owner_id]
        );
        const newArtifactId = artifactResult.insertId;
        await connection.query(
            INSERT_ARTIFACT_STATUS,
            [newArtifactId, status, last_seen_location]
        );
        await connection.query(
            INSERT_ARTIFACT_IMAGE,
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

/* @route   PUT /artifacts/:id (Update) */
router.put('/artifacts/:id', authMiddleware, upload.single('artifact_image'), async (req, res) => {
    const artifactId = parseInt(req.params.id, 10);
    if (isNaN(artifactId)) return res.status(400).json({ error: 'Invalid artifact ID.' });

    let connection;
    try {
        const userId = req.user.id;
        const { title, description, artist, period, status, last_seen_location, existing_image_url } = req.body;
        connection = await db.getConnection();
        const [artifacts] = await connection.query(GET_ARTIFACT_OWNER, [artifactId]);
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
            UPDATE_ARTIFACT,
            [title, description, artist, period, artifactId]
        );
        await connection.query(
            UPDATE_ARTIFACT_STATUS,
            [status, last_seen_location, artifactId]
        );
        if(req.file) { 
             await connection.query(
                UPDATE_ARTIFACT_IMAGE,
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

/* @route   DELETE /artifacts/:id (Delete) */
router.delete('/artifacts/:id', authMiddleware, async (req, res) => {
    const artifactId = parseInt(req.params.id, 10);
    if (isNaN(artifactId)) return res.status(400).json({ error: 'Invalid artifact ID.' });

    try {
        const userId = req.user.id;
        const [artifacts] = await db.query(GET_ARTIFACT_OWNER, [artifactId]);
        if (artifacts.length === 0) {
            return res.status(404).json({ error: 'Artifact not found' });
        }
        const artifact = artifacts[0];
        if (artifact.owner_id !== userId && req.user.user_type !== 'admin') { 
            return res.status(403).json({ error: 'User not authorized to delete this artifact' });
        }
        await db.query(DELETE_ARTIFACT, [artifactId]);
        res.json({ message: 'Artifact deleted successfully' });
    } catch (err) {
        console.error("Error in DELETE /api/artifacts/:id:", err);
        res.status(500).json({ error: 'Server error deleting artifact' });
    }
});

module.exports = router;
