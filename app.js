require("dotenv").config();
const express = require("express");
const { pool, testDbConnection } = require("./src/db");

const app = express();
app.use(express.json());

const FEEDBACK_TYPES = new Set([
    "correct",
    "too_slow",
    "too_fast",
    "source_mismatch",
    "unknown",
]);

app.put("/api/v1/songTempo", (req, res) => {
    console.log("Song tempo updated");
    res.send("Song tempo updated");
});

app.get("/api/v1/songTempo", (req, res) => {
    console.log("Song tempo fetched");
    res.send("Song tempo fetched");
});

app.put("/api/v1/user-feedback", async (req, res) => {
    const {
        songTitle,
        artistName = null,
        sourceName = "GetSongBPM.com",
        sourceBpm = null,
        detectedBpm = null,
        userExpectedBpm = null,
        feedbackType,
        mismatchNotes = null,
    } = req.body || {};

    if (!songTitle || !feedbackType) {
        return res.status(400).json({
            ok: false,
            error: "songTitle and feedbackType are required",
        });
    }

    if (!FEEDBACK_TYPES.has(feedbackType)) {
        return res.status(400).json({
            ok: false,
            error: "feedbackType must be one of: correct, too_slow, too_fast, source_mismatch, unknown",
        });
    }

    try {
        const insertQuery = `
            INSERT INTO ytm_song.user_feedback
                (song_title, artist_name, source_name, source_bpm, detected_bpm, user_expected_bpm, feedback_type, mismatch_notes)
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, created_at
        `;

        const values = [
            songTitle,
            artistName,
            sourceName,
            sourceBpm,
            detectedBpm,
            userExpectedBpm,
            feedbackType,
            mismatchNotes,
        ];

        const result = await pool.query(insertQuery, values);
        const savedFeedback = result.rows[0];

        return res.status(201).json({
            ok: true,
            id: savedFeedback.id,
            createdAt: savedFeedback.created_at,
        });
    } catch (error) {
        console.error("Failed to save feedback:", error.message);
        return res.status(500).json({
            ok: false,
            error: "Failed to save user feedback",
        });
    }
});

app.get("/api/v1/health/db", async (req, res) => {
    try {
        const result = await testDbConnection();
        res.status(200).json({ ok: true, dbTime: result.rows[0].now });
    } catch (error) {
        console.error("Database health check failed:", error.message);
        res.status(500).json({ ok: false, error: "Database connection failed" });
    }
});

module.exports = { app };
