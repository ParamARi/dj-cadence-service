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

function mapUserTapBpmRow(row) {
    return {
        id: row.id,
        userId: row.user_id,
        rawTitle: row.raw_title,
        videoId: row.video_id,
        calculatedBpm: row.calculated_bpm != null ? Number(row.calculated_bpm) : null,
        referenceBpm: row.reference_bpm != null ? Number(row.reference_bpm) : null,
        parsedSong: row.parsed_song,
        usrProvidedSong: row.usr_provided_song,
        parsedArtist: row.parsed_artist,
        usrProvidedArtist: row.usr_provided_artist,
        artistName: row.artist_name,
        createdAt: row.created_at,
    };
}

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

    console.log(body);

    const rawTitle = body.rawTitle;
    const reportedTempo = body.reportedTempo;
    const userId = body.userId;
    const videoId = body.videoId;

    console.log(rawTitle, reportedTempo, userId, videoId);


    if (typeof rawTitle !== "string" || rawTitle.length === 0) {
        return reject("rawTitle is required");
    }

    if (typeof reportedTempo !== "number" || reportedTempo.length === 0) {
        return reject("reportedTempo is required");
    }

    if (typeof userId !== "string" || userId.length === 0) {
        return reject("userId is required");
    }

    if (typeof videoId !== "string" || videoId.length === 0) {
        return reject("videoId is required");
    }

    if (!Number.isFinite(reportedTempo) || reportedTempo <= 0 || reportedTempo > 400) {
        return reject("reportedTempo must be a numeric BPM between 0 exclusive and 400 inclusive");
    }

    let referenceBpm = null;
    const referenceBpmRaw = body.referenceBpm;
    if (referenceBpmRaw !== undefined && referenceBpmRaw !== null && referenceBpmRaw !== "") {
        const ref =
            typeof referenceBpmRaw === "string" ? Number.parseFloat(referenceBpmRaw) : referenceBpmRaw;
        if (typeof ref !== "number" || !Number.isFinite(ref) || ref <= 0 || ref > 400) {
            return reject("referenceBpm must be a finite number between 0 and 400 when provided");
        }
        referenceBpm = ref;
    }

    if (typeof body.clientSentAt === "string" && body.clientSentAt.length > 0) {
        const parsed = new Date(body.clientSentAt);
        if (Number.isNaN(parsed.getTime())) {
            return reject("clientSentAt must be an ISO timestamp string");
        }
    }

    try {
        const insertQuery = `
            INSERT INTO ytm_song.user_tap_bpm
                (user_id, raw_title, video_id, calculated_bpm, reference_bpm,
                 parsed_song, usr_provided_song, parsed_artist, usr_provided_artist, artist_name)
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (user_id, video_id) DO UPDATE
            SET calculated_bpm = EXCLUDED.calculated_bpm,
                raw_title = EXCLUDED.raw_title,
                usr_provided_song = EXCLUDED.usr_provided_song,
                usr_provided_artist = EXCLUDED.usr_provided_artist,
                created_at = NOW()
            RETURNING id, created_at
        `;

        const values = [
            userId,
            rawTitle,
            videoId,
            reportedTempo,
            referenceBpm,
            body.matchedSong ?? body.parsedSong ?? null,
            body.suggestedSong ?? null,
            body.matchedArtist ?? body.parsedArtist ?? null,
            body.suggestedArtist ?? null,
            body.artistName ?? null,
        ];

        const result = await pool.query(insertQuery, values);
        const saved = result.rows[0];
        console.log(
            `${logLabel} success id=${saved.id} videoId=${videoId}`
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

/** User BPM from tap-to-beat UI (POST body uses camelCase). Matches ytm_song.user_tap_bpm. */
app.post("/api/bpm/tap", async (req, res) => {
    const logLabel = "[POST /api/bpm/tap]";
    const reject = (message) => {
        console.warn(`${logLabel} rejected: ${message}`);
        return res.status(400).json({ ok: false, error: message });
    };

    const body = req.body || {};
    const userId = body.userId;
    const rawTitle = body.rawTitle;
    const videoId = body.videoId;
    const calculatedBpmRaw = body.calculatedBpm;
    const referenceBpmRaw = body.referenceBpm;

    if (typeof userId !== "string" || userId.length === 0) {
        return reject("userId is required");
    }
    if (typeof rawTitle !== "string" || rawTitle.length === 0) {
        return reject("rawTitle is required");
    }
    if (typeof videoId !== "string" || videoId.length === 0) {
        return reject("videoId is required");
    }

    const calculatedBpm =
        typeof calculatedBpmRaw === "string" ? Number(calculatedBpmRaw) : calculatedBpmRaw;
    if (typeof calculatedBpm !== "number" || !Number.isFinite(calculatedBpm)) {
        return reject("calculatedBpm must be a finite number");
    }
    if (calculatedBpm <= 0 || calculatedBpm > 400) {
        return reject("calculatedBpm must be between 0 exclusive and 400 inclusive");
    }

    let referenceBpm = null;
    if (referenceBpmRaw !== undefined && referenceBpmRaw !== null && referenceBpmRaw !== "") {
        const ref =
            typeof referenceBpmRaw === "string" ? Number(referenceBpmRaw) : referenceBpmRaw;
        if (typeof ref !== "number" || !Number.isFinite(ref) || ref <= 0 || ref > 400) {
            return reject("referenceBpm must be a finite number between 0 and 400 when provided");
        }
        referenceBpm = ref;
    }

    try {
        const insertQuery = `
            INSERT INTO ytm_song.user_tap_bpm
                (user_id, raw_title, video_id, calculated_bpm, reference_bpm,
                 parsed_song, usr_provided_song, parsed_artist, usr_provided_artist, artist_name)
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, created_at
        `;
        const values = [
            userId,
            rawTitle,
            videoId,
            calculatedBpm,
            referenceBpm,
            body.parsedSong ?? null,
            body.usrProvidedSong ?? null,
            body.parsedArtist ?? null,
            body.usrProvidedArtist ?? null,
            body.artistName ?? null,
        ];

        const result = await pool.query(insertQuery, values);
        const row = result.rows[0];
        console.log(`${logLabel} success id=${row.id} calculatedBpm=${calculatedBpm}`);
        return res.status(201).json({
            ok: true,
            id: row.id,
            createdAt: row.created_at,
        });
    } catch (error) {
        console.error(`${logLabel} failed: ${error.message}`);
        return res.status(500).json({ ok: false, error: "Failed to save tap BPM measurement" });
    }
});

/** Latest tap BPM row for a YouTube (or other) video id. */
app.get("/api/bpm/tap/latest", async (req, res) => {
    const logLabel = "[GET /api/bpm/tap/latest]";
    const videoId = req.query.videoId;

    if (typeof videoId !== "string" || videoId.length === 0) {
        console.warn(`${logLabel} rejected: videoId query param is required`);
        return res.status(400).json({ ok: false, error: "videoId query parameter is required" });
    }

    try {
        const result = await pool.query(
            `
            SELECT id, user_id, raw_title, video_id, calculated_bpm, reference_bpm,
                   parsed_song, usr_provided_song, parsed_artist, usr_provided_artist, artist_name,
                   created_at
            FROM ytm_song.user_tap_bpm
            WHERE video_id = $1
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [videoId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                ok: false,
                error: "No tap BPM record found for this video",
            });
        }

        return res.status(200).json({
            ok: true,
            record: mapUserTapBpmRow(result.rows[0]),
        });
    } catch (error) {
        console.error(`${logLabel} failed: ${error.message}`);
        return res.status(500).json({ ok: false, error: "Failed to load tap BPM record" });
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
