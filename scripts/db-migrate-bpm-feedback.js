require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require("../src/db");

async function run() {
    const migrationPath = path.join(__dirname, "..", "migrations", "002_create_bpm_feedback_table.sql");
    const sql = fs.readFileSync(migrationPath, "utf8");

    try {
        await pool.query(sql);
        console.log("MIGRATION_OK ytm_song.bpm_feedback table is ready");
        process.exitCode = 0;
    } catch (error) {
        console.error("MIGRATION_ERR", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

run();
