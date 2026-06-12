// --- ARTIFACT SQL QUERIES ---

const GET_ARTIFACTS_BASE = `
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

const FULLTEXT_SEARCH_CLAUSE = 'MATCH(a.title, a.description, a.artist, a.period) AGAINST(? IN NATURAL LANGUAGE MODE)';

const GET_ARTIFACT_DETAIL = `
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

const GET_ARTIFACT_IMAGES = `SELECT image_id, image_url, is_primary_image FROM artifact_images WHERE artifact_id = ?`;

const INSERT_ARTIFACT = 'INSERT INTO artifacts (title, description, artist, period, owner_id) VALUES (?, ?, ?, ?, ?)';

const INSERT_ARTIFACT_STATUS = 'INSERT INTO artifact_status (artifact_id, status, last_seen_location) VALUES (?, ?, ?)';

const INSERT_ARTIFACT_IMAGE = 'INSERT INTO artifact_images (artifact_id, image_url, is_primary_image) VALUES (?, ?, ?)';

const GET_ARTIFACT_OWNER = 'SELECT owner_id FROM artifacts WHERE artifact_id = ?';

const UPDATE_ARTIFACT = 'UPDATE artifacts SET title = ?, description = ?, artist = ?, period = ? WHERE artifact_id = ?';

const UPDATE_ARTIFACT_STATUS = 'UPDATE artifact_status SET status = ?, last_seen_location = ? WHERE artifact_id = ?';

const UPDATE_ARTIFACT_IMAGE = 'UPDATE artifact_images SET image_url = ? WHERE artifact_id = ? AND is_primary_image = 1';

const DELETE_ARTIFACT = 'DELETE FROM artifacts WHERE artifact_id = ?';

const GET_ARTIFACT_FOR_REPORT = `
    SELECT a.*, s.status, s.last_seen_location FROM artifacts a 
    LEFT JOIN artifact_status s ON a.artifact_id = s.artifact_id 
    WHERE a.artifact_id = ?
`;

module.exports = {
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
    GET_ARTIFACT_FOR_REPORT,
};
