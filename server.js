const { app } = require("./app");
const { testDbConnection } = require("./src/db");
const PORT = process.env.PORT || 3005;

process.on("uncaughtException", (err) => {
    console.error("[server] uncaughtException:", err);
});
process.on("unhandledRejection", (reason) => {
    console.error("[server] unhandledRejection:", reason);
});
process.on("beforeExit", (code) => {
    console.warn(
        `[server] beforeExit code=${code} — Node is about to exit because the event loop has no more work. If you expected the HTTP server to keep running, something closed it or unref'd its handles.`
    );
});

console.log("Starting server...");

// Do not pass a listen() callback: Express wires that same function to server.once("error"),
// so on EADDRINUSE it still runs and falsely logs "started" even though bind failed.
const server = app.listen(PORT);

server.on("error", (err) => {
    console.error("[server] HTTP listen error:", err.message);
});

server.on("listening", async () => {
    console.log(`Server started on port ${PORT}`);
    try {
        await testDbConnection();
        console.log("PostgreSQL connected");
    } catch (error) {
        console.error("PostgreSQL connection failed:", error.message);
    }
});

server.on("close", () => {
    console.warn("[server] HTTP server closed (server.close() was called or process is shutting down).");
});

