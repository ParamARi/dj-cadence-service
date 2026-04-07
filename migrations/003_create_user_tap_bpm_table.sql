CREATE SCHEMA IF NOT EXISTS ytm_song;

CREATE TABLE IF NOT EXISTS ytm_song.user_tap_bpm (
    id BIGSERIAL PRIMARY KEY,
    calculated_bpm NUMERIC(8, 3) NOT NULL
        CHECK (calculated_bpm > 0 AND calculated_bpm <= 400),
    reference_bpm NUMERIC(8, 3) NULL,
    tap_count INTEGER NULL CHECK (tap_count IS NULL OR tap_count >= 0),
    duration_ms INTEGER NULL CHECK (duration_ms IS NULL OR duration_ms >= 0),
    raw_title TEXT NULL,
    video_id TEXT NULL,
    playlist_id TEXT NULL,
    parsed_song TEXT NULL,
    parsed_artist TEXT NULL,
    artist_name TEXT NULL,
    client_sent_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_tap_bpm_has_song_hint CHECK (
        raw_title IS NOT NULL OR video_id IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_user_tap_bpm_created_at ON ytm_song.user_tap_bpm (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_tap_bpm_video_id ON ytm_song.user_tap_bpm (video_id);
