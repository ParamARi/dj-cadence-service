CREATE SCHEMA IF NOT EXISTS ytm_song;

CREATE TABLE IF NOT EXISTS ytm_song.user_tap_bpm (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    raw_title TEXT NOT NULL,
    video_id TEXT NOT NULL,
    calculated_bpm NUMERIC(8, 3) NOT NULL
    CHECK (calculated_bpm > 0 AND calculated_bpm <= 400),
    reference_bpm NUMERIC(8, 3) NULL,
    parsed_song TEXT NULL,
    usr_provided_song TEXT NULL,
    parsed_artist TEXT NULL,
    usr_provided_artist TEXT NULL,
    artist_name TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_tap_bpm_has_song_hint CHECK (
        raw_title IS NOT NULL OR video_id IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_user_tap_bpm_video_id ON ytm_song.user_tap_bpm (video_id);
CREATE INDEX IF NOT EXISTS idx_user_tap_bpm_user_id ON ytm_song.user_tap_bpm (user_id);

CREATE UNIQUE INDEX user_tap_bpm_user_video_uidx
  ON ytm_song.user_tap_bpm (user_id, video_id);

DROP INDEX IF EXISTS user_tap_bpm_user_video_uidx;