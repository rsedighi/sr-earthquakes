-- Browser push alert subscriptions ("Monitor my area").
-- Location is city-level only: lat/lon are the selected city's centroid.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id                TEXT    PRIMARY KEY,           -- SHA-256 of endpoint (hex)
  endpoint          TEXT    NOT NULL UNIQUE,
  p256dh            TEXT    NOT NULL,
  auth              TEXT    NOT NULL,
  city              TEXT    NOT NULL,
  lat               REAL    NOT NULL,
  lon               REAL    NOT NULL,
  radius_miles      REAL    NOT NULL DEFAULT 25,
  min_magnitude     REAL    NOT NULL DEFAULT 3.0,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL,
  last_notified_at  INTEGER,
  failure_count     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_min_magnitude ON push_subscriptions (min_magnitude);

-- One row per (subscription, earthquake) so an alert is never delivered twice.
CREATE TABLE IF NOT EXISTS push_deliveries (
  subscription_id   TEXT    NOT NULL,
  earthquake_id     TEXT    NOT NULL,
  created_at        INTEGER NOT NULL,
  PRIMARY KEY (subscription_id, earthquake_id)
);
CREATE INDEX IF NOT EXISTS idx_push_deliveries_created_at ON push_deliveries (created_at);
