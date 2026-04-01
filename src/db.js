const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const sslEnabled = process.env.PGSSL === "true" || isProduction;
const rejectUnauthorized = process.env.PGSSL_REJECT_UNAUTHORIZED !== "false";
const sslConfig = sslEnabled ? { rejectUnauthorized } : false;

const pool = new Pool(
    hasDatabaseUrl
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: sslConfig,
        }
        : {
            host: process.env.PGHOST || "localhost",
            port: Number(process.env.PGPORT) || 5432,
            database: process.env.PGDATABASE || "postgres",
            user: process.env.PGUSER || "postgres",
            password: process.env.PGPASSWORD || "",
            ssl: sslConfig,
        }
);

// Idle clients that hit network/SSL/server-side disconnects emit 'error'; without a listener Node exits.
pool.on("error", (err) => {
    console.error("PostgreSQL pool error (idle client):", err.message);
});

async function testDbConnection() {
    return pool.query("SELECT NOW() AS now");
}

module.exports = {
    pool,
    testDbConnection,
};
