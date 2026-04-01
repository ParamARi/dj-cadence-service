require("dotenv").config();
const cors = require("cors");
const express = require("express");
const { pool, testDbConnection } = require("./src/db");

const app = express();
app.use(cors());
app.use(express.json());

const FEEDBACK_TYPES = new Set([
    "correct",
    "too_slow",
    "too_fast",
    "source_mismatch",
    "unknown",
]);

const BPM_VOTES = new Set(["up", "down", null]);

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

app.post("/api/feedback/bpm", async (req, res) => {
    const logLabel = "[POST /api/feedback/bpm]";
    const reject = (message) => {
        console.warn(`${logLabel} rejected: ${message}`);
        return res.status(400).json({ ok: false, error: message });
    };

    const body = req.body || {};

    const vote = body.vote ?? null;
    const source = body.source;
    const rowIndexRaw = body.rowIndex;
    const rawTitle = body.rawTitle;
    const reportedTempo = body.reportedTempo;
    const usedParsedFallback =
        body.usedParsedFallback === undefined ? false : body.usedParsedFallback;

    if (!BPM_VOTES.has(vote)) {
        return reject("vote must be 'up', 'down', or null");
    }

    if (typeof source !== "string" || source.length === 0) {
        return reject("source is required");
    }

    const rowIndex =
        typeof rowIndexRaw === "string" ? Number.parseInt(rowIndexRaw, 10) : rowIndexRaw;
    if (!Number.isInteger(rowIndex) || rowIndex < 0) {
        return reject("rowIndex must be a non-negative integer");
    }

    if (typeof rawTitle !== "string" || rawTitle.length === 0) {
        return reject("rawTitle is required");
    }

    if (typeof reportedTempo !== "string" || reportedTempo.length === 0) {
        return reject("reportedTempo is required");
    }

    if (typeof usedParsedFallback !== "boolean") {
        return reject("usedParsedFallback must be boolean");
    }

    let clientSentAt = null;
    if (typeof body.clientSentAt === "string" && body.clientSentAt.length > 0) {
        const parsed = new Date(body.clientSentAt);
        if (Number.isNaN(parsed.getTime())) {
            return reject("clientSentAt must be an ISO timestamp string");
        }
        clientSentAt = parsed.toISOString();
    }

    try {
        const insertQuery = `
            INSERT INTO ytm_song.bpm_feedback
                (vote, source, row_index, raw_title, reported_tempo, used_parsed_fallback,
                 video_id, parsed_song, parsed_artist, matched_song, matched_artist,
                 suggested_song, suggested_artist, playlist_id, artist_name, client_sent_at)
            VALUES
                ($1, $2, $3, $4, $5, $6,
                 $7, $8, $9, $10, $11,
                 $12, $13, $14, $15, $16)
            RETURNING id, created_at
        `;

        const values = [
            vote,
            source,
            rowIndex,
            rawTitle,
            reportedTempo,
            usedParsedFallback,
            body.videoId ?? null,
            body.parsedSong ?? null,
            body.parsedArtist ?? null,
            body.matchedSong ?? null,
            body.matchedArtist ?? null,
            body.suggestedSong ?? null,
            body.suggestedArtist ?? null,
            body.playlistId ?? null,
            body.artistName ?? null,
            clientSentAt,
        ];

        const result = await pool.query(insertQuery, values);
        const saved = result.rows[0];
        console.log(
            `${logLabel} success id=${saved.id} rowIndex=${rowIndex} vote=${vote ?? "null"} source=${source}`
        );
        return res.status(201).json({
            ok: true,
            id: saved.id,
            createdAt: saved.created_at,
        });
    } catch (error) {
        console.error(`${logLabel} failed: ${error.message}`);
        return res.status(500).json({ ok: false, error: "Failed to save BPM feedback" });
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
