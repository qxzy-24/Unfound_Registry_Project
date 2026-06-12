const express = require('express');
const axios = require('axios'); // For Gemini
const path = require('path');   // For serving files
const fs = require('fs');       // To read files for Gemini
const router = express.Router();

const { db } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { GET_ARTIFACT_FOR_REPORT } = require('../queries/artifactQueries');

/* @route   POST /analyze-image */
router.post('/analyze-image', authMiddleware, upload.single('image_to_analyze'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided.' });
        }
        
        const imagePath = path.join(__dirname, '../../', req.file.path);
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


/* @route   POST /generate-report (Server-side Gemini proxy for report generation) */
router.post('/generate-report', authMiddleware, async (req, res) => {
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
        const [rows] = await db.query(GET_ARTIFACT_FOR_REPORT, [parseInt(artifactId, 10)]);
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

module.exports = router;
