// backend/src/db.js
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DB_URL,
    connection: {
        family: 4,
    }

});

module.exports = {
    query: (text, params) => pool.query(text, params),
};