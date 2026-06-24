-- Earthquakes table
-- Stores every Bay Area quake from USGS that the cron + backfill see so the
-- "history" surface can include events that happened *after* the static R2
-- dataset cutoff (2025-12-08). `id` is the USGS event id, so re-ingest is
-- idempotent via INSERT OR IGNORE / ON CONFLICT.

CREATE TABLE IF NOT EXISTS earthquakes (
  id           TEXT    PRIMARY KEY,
  magnitude    REAL    NOT NULL,
  place        TEXT,
  time_ms      INTEGER NOT NULL,            -- USGS event time (epoch ms)
  latitude     REAL    NOT NULL,
  longitude    REAL    NOT NULL,
  depth        REAL,
  felt         INTEGER,                     -- nullable; USGS "felt" reports
  significance INTEGER,
  url          TEXT,
  region       TEXT,                        -- our derived region id
  source       TEXT    NOT NULL DEFAULT 'usgs',
  created_at   INTEGER NOT NULL             -- when we ingested it
);

CREATE INDEX IF NOT EXISTS idx_earthquakes_time_ms   ON earthquakes (time_ms DESC);
CREATE INDEX IF NOT EXISTS idx_earthquakes_magnitude ON earthquakes (magnitude DESC);
CREATE INDEX IF NOT EXISTS idx_earthquakes_lat_lon   ON earthquakes (latitude, longitude);
