CREATE SCHEMA IF NOT EXISTS ytm_song;

CREATE TABLE IF NOT EXISTS ytm_song.bpm_feedback (
    id BIGSERIAL PRIMARY KEY,
    vote VARCHAR(8) NULL CHECK (vote IN ('up', 'down') OR vote IS NULL),
    source TEXT NOT NULL,
    row_index INTEGER NOT NULL CHECK (row_index >= 0),
    raw_title TEXT NOT NULL,
    reported_tempo TEXT NOT NULL,
    used_parsed_fallback BOOLEAN NOT NULL DEFAULT FALSE,
    video_id TEXT NULL,
    parsed_song TEXT NULL,
    parsed_artist TEXT NULL,
    matched_song TEXT NULL,
    matched_artist TEXT NULL,
    suggested_song TEXT NULL,
    suggested_artist TEXT NULL,
    playlist_id TEXT NULL,
    artist_name TEXT NULL,
    client_sent_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bpm_feedback_created_at ON ytm_song.bpm_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bpm_feedback_video_id ON ytm_song.bpm_feedback (video_id);
