// --- ADMIN SQL QUERIES ---

const COUNT_USERS = "SELECT COUNT(*) as count FROM users";

const COUNT_ARTIFACTS = "SELECT COUNT(*) as count FROM artifacts";

const COUNT_STOLEN = "SELECT COUNT(*) as count FROM artifact_status WHERE status = 'Stolen'";

const GET_ALL_USERS = "SELECT user_id, user_name, email, user_type FROM users ORDER BY user_id ASC";

const DELETE_USER = 'DELETE FROM users WHERE user_id = ?';

module.exports = {
    COUNT_USERS,
    COUNT_ARTIFACTS,
    COUNT_STOLEN,
    GET_ALL_USERS,
    DELETE_USER,
};
