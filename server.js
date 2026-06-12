require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const { pool } = require('./src/config/db');
const routes = require('./src/routes');
const errorHandler = require('./src/errors/errorHandler');

// --- 1. SET UP THE EXPRESS APP ---
const app = express();
const port = process.env.PORT || 3000;

// --- 2. CONFIGURE MIDDLEWARE ---
app.use(cors());
app.use(express.json()); // Allows the server to understand JSON data

// --- 3. SERVE STATIC ASSETS ---
// This serves all the files in your 'public' folder (like index.html)
// This MUST come before the API routes
app.use(express.static(path.join(__dirname, 'public')));
// This serves your uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 4. MOUNT ALL API ROUTES ---
app.use(routes);

// --- 5. CENTRALIZED ERROR HANDLER ---
// Catches multer errors (file type/size) and any unhandled route errors
app.use(errorHandler);

// --- 6. START THE SERVER ---
const server = app.listen(port, () => {
    console.log(`Unfound Registry server running on http://localhost:${port}`);
});

// --- 7. GRACEFUL SHUTDOWN ---
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
