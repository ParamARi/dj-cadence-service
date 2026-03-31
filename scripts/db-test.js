require("dotenv").config();
const { testDbConnection, pool } = require("../src/db");

async function run() {
    try {
        const result = await testDbConnection();
        console.log("DB_OK", result.rows[0].now);
        process.exitCode = 0;
    } catch (error) {
        console.error("DB_ERR", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

run();
