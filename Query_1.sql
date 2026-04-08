Use dj_cadence_db;


CREATE SCHEMA IF NOT EXISTS ytm_song;

drop table if exists ytm_song.user_tap_bpm;

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

-- DROP INDEX IF EXISTS user_tap_bpm_user_video_uidx;

select * from ytm_song.user_tap_bpm;

SELECT c.conname AS constraint_name,
       pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class t ON t.oid = c.conrelid
WHERE n.nspname = 'ytm_song'
  AND t.relname = 'user_tap_bpm'
  AND c.contype IN ('u', 'p');  -- unique or primary

DROP INDEX IF EXISTS ytm_song.user_tap_bpm_user_video_uidx;
CREATE UNIQUE INDEX user_tap_bpm_user_video_uidx
  ON ytm_song.user_tap_bpm (user_id, video_id);

ALTER TABLE ytm_song.user_tap_bpm
  ADD CONSTRAINT user_tap_bpm_user_video_uk
  UNIQUE USING INDEX user_tap_bpm_user_video_uidx;

SELECT
  c.conname AS constraint_name,
  c.contype AS type,              -- p=primary, u=unique, x=exclusion, f=foreign key, etc.
  pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'ytm_song'
  AND t.relname = 'user_tap_bpm'
ORDER BY c.conname;

SELECT
  i.indexname,
  i.indexdef
FROM pg_indexes i
WHERE i.schemaname = 'ytm_song'
  AND i.tablename = 'user_tap_bpm'
ORDER BY i.indexname;

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'ytm_song'
  AND tablename = 'user_tap_bpm';