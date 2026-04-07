require("dotenv").config();
const { pool } = require("../src/db");

async function run() {
    try {
        const existsResult = await pool.query(`
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'ytm_song'
                  AND table_name = 'user_tap_bpm'
            ) AS table_exists
        `);
        const exists = existsResult.rows[0].table_exists === true;

        if (!exists) {
            console.log("TABLE_EXISTS false");
            console.log("ROW_COUNT n/a — run npm run db:migrate:user-tap-bpm");
            process.exitCode = 1;
            return;
        }

        const countResult = await pool.query("SELECT COUNT(*)::bigint AS n FROM ytm_song.user_tap_bpm");
        const n = countResult.rows[0].n;
        console.log("TABLE_EXISTS true");
        console.log("ROW_COUNT", n.toString());
        process.exitCode = 0;
    } catch (error) {
        console.error("VERIFY_ERR", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

run();
