// backend/src/db.js
const { Pool } = require('pg');
//require('dotenv').config({ path: '../.env' });
const connectionString = process.env.DB_URL;
if (!connectionString) {
    throw new Error('DB_URL environment variable is not set');
}

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      // This setting is necessary for cloud platforms like Render.
      rejectUnauthorized: false
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};