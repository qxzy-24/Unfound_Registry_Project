// --- USER SQL QUERIES ---

const CHECK_EMAIL_EXISTS = 'SELECT user_id FROM users WHERE email = ?';

const INSERT_USER = 'INSERT INTO users (email, password_hash, user_name, user_type) VALUES (?, ?, ?, ?)';

const GET_USER_BY_EMAIL = 'SELECT * FROM users WHERE email = ?';

module.exports = {
    CHECK_EMAIL_EXISTS,
    INSERT_USER,
    GET_USER_BY_EMAIL,
};
