CREATE SCHEMA IF NOT EXISTS ytm_song;

CREATE TABLE IF NOT EXISTS ytm_song.user_feedback (
    id BIGSERIAL PRIMARY KEY,
    song_title TEXT NOT NULL,
    artist_name TEXT,
    source_name TEXT NOT NULL DEFAULT 'GetSongBPM.com',
    source_bpm NUMERIC(6, 2),
    detected_bpm NUMERIC(6, 2),
    user_expected_bpm NUMERIC(6, 2),
    feedback_type VARCHAR(32) NOT NULL CHECK (
        feedback_type IN (
            'correct',
            'too_slow',
            'too_fast',
            'source_mismatch',
            'unknown'
        )
    ),
    mismatch_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON ytm_song.user_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_song_artist ON ytm_song.user_feedback (song_title, artist_name);
