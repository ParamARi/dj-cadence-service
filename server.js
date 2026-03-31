const { app } = require("./app");
const { testDbConnection } = require("./src/db");
const PORT = process.env.PORT || 3005;

console.log("Starting server...");

app.listen(PORT, async () => {
    console.log(`Server started on port ${PORT}`);
    try {
        await testDbConnection();
        console.log("PostgreSQL connected");
    } catch (error) {
        console.error("PostgreSQL connection failed:", error.message);
    }
});

