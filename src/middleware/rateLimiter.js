// --- RATE LIMITING (Auth endpoints) ---
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

module.exports = authLimiter;
