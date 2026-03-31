require("dotenv").config();
const { pool } = require("../src/db");

async function run() {
    try {
        const result = await pool.query(`
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'ytm_song'
                  AND table_name = 'user_feedback'
            ) AS table_exists
        `);
        const exists = result.rows[0].table_exists === true;
        console.log("TABLE_EXISTS", exists);
        process.exitCode = exists ? 0 : 1;
    } catch (error) {
        console.error("VERIFY_ERR", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

run();
