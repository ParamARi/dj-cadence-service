
select * from ytm_song.bpm_feedback;

select * from ytm_song.user_tap_bpm;

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'ytm_song'
  AND tablename = 'user_tap_bpm'


INSERT INTO ytm_song.user_tap_bpm
    (user_id, raw_title, video_id, calculated_bpm, reference_bpm,
     parsed_song, usr_provided_song, parsed_artist, usr_provided_artist, artist_name)
VALUES
    ('test-user-001', 'Mr. Prism', 'azrszWb3E8g', 178.0, 176.0,
     'Mr. Prism', NULL, 'Psychedelic Porn Crumpets', NULL, 'Psychedelic Porn Crumpets')
ON CONFLICT (user_id, video_id) DO UPDATE
SET
    calculated_bpm = EXCLUDED.calculated_bpm,
    reference_bpm = EXCLUDED.reference_bpm,
    raw_title = EXCLUDED.raw_title,
    parsed_song = EXCLUDED.parsed_song,
    usr_provided_song = EXCLUDED.usr_provided_song,
    parsed_artist = EXCLUDED.parsed_artist,
    usr_provided_artist = EXCLUDED.usr_provided_artist,
    artist_name = EXCLUDED.artist_name,
    created_at = NOW()
RETURNING id, user_id, video_id, calculated_bpm, reference_bpm, created_at;

CREATE USER cursor_connect WITH PASSWORD 'DontYouDareDelete24#!';
GRANT CONNECT ON DATABASE dj_cadence_db TO cursor_connect;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO "cursor_connect";

postgresql://cursor_connect:DontYouDareDelete24#!@cadence-postgress.postgres.database.azure.com:5432/dj_cadence_db?sslmode=require