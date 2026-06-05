-- BayTremor D1 Schema — Sprint 2
-- Replaces MongoDB collections with D1 (SQLite) tables

-- ── Comments ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          TEXT    PRIMARY KEY,
  earthquake_id TEXT  NOT NULL,
  parent_id   TEXT,
  author      TEXT    NOT NULL,
  content     TEXT    NOT NULL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER,
  likes       INTEGER NOT NULL DEFAULT 0,
  location    TEXT,
  felt_it     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_comments_earthquake_id ON comments (earthquake_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at    ON comments (created_at DESC);

-- ── Forum Threads ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_threads (
  id               TEXT    PRIMARY KEY,
  title            TEXT    NOT NULL,
  slug             TEXT    NOT NULL UNIQUE,
  category         TEXT    NOT NULL,
  author           TEXT    NOT NULL,
  author_location  TEXT,
  content          TEXT    NOT NULL,
  earthquake_id    TEXT,
  earthquake_data  TEXT,                -- JSON blob
  is_pinned        INTEGER NOT NULL DEFAULT 0,
  is_locked        INTEGER NOT NULL DEFAULT 0,
  view_count       INTEGER NOT NULL DEFAULT 0,
  post_count       INTEGER NOT NULL DEFAULT 1,
  last_post_at     INTEGER NOT NULL,
  last_post_author TEXT,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL,
  tags             TEXT                 -- JSON array
);
CREATE INDEX IF NOT EXISTS idx_forum_threads_category     ON forum_threads (category);
CREATE INDEX IF NOT EXISTS idx_forum_threads_earthquake   ON forum_threads (earthquake_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_last_post_at ON forum_threads (last_post_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_slug         ON forum_threads (slug);

-- ── Forum Posts ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_posts (
  id               TEXT    PRIMARY KEY,
  thread_id        TEXT    NOT NULL,
  parent_post_id   TEXT,
  author           TEXT    NOT NULL,
  author_location  TEXT,
  content          TEXT    NOT NULL,
  felt_it          INTEGER,
  intensity        INTEGER,
  likes            INTEGER NOT NULL DEFAULT 0,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER,
  is_original_post INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (thread_id) REFERENCES forum_threads(id)
);
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread_id  ON forum_posts (thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts (created_at ASC);

-- ── Community Reactions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_reactions (
  id            TEXT    PRIMARY KEY,
  earthquake_id TEXT    NOT NULL,
  author        TEXT    NOT NULL,
  reaction_type TEXT    NOT NULL,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reactions_earthquake_id ON community_reactions (earthquake_id);

-- ── Push Notification Devices ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devices (
  token         TEXT    PRIMARY KEY,
  city          TEXT,
  min_magnitude REAL    NOT NULL DEFAULT 2.5,
  lat           REAL,
  lon           REAL,
  radius_miles  REAL    NOT NULL DEFAULT 25,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_devices_city ON devices (city);

-- ── iOS Waitlist ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ios_waitlist (
  email         TEXT    PRIMARY KEY,
  source        TEXT    NOT NULL DEFAULT 'website',
  referral_code TEXT,
  created_at    INTEGER NOT NULL,
  user_agent    TEXT,
  ip_hash       TEXT,
  notified      INTEGER NOT NULL DEFAULT 0,
  unsubscribed  INTEGER NOT NULL DEFAULT 0
);

-- ── Feedback ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id         TEXT    PRIMARY KEY,
  type       TEXT    NOT NULL,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  message    TEXT    NOT NULL,
  page       TEXT    NOT NULL,
  created_at INTEGER NOT NULL,
  user_agent TEXT,
  ip_hash    TEXT,
  status     TEXT    NOT NULL DEFAULT 'new',
  notes      TEXT
);
CREATE INDEX IF NOT EXISTS idx_feedback_status     ON feedback (status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback (created_at DESC);

-- ── User Addresses ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_addresses (
  id             TEXT    PRIMARY KEY,
  visitor_id     TEXT    NOT NULL,
  address        TEXT    NOT NULL,
  lat            REAL    NOT NULL,
  lon            REAL    NOT NULL,
  city           TEXT,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL,
  search_count   INTEGER NOT NULL DEFAULT 1,
  last_search_at INTEGER NOT NULL,
  user_agent     TEXT,
  ip_hash        TEXT
);
CREATE INDEX IF NOT EXISTS idx_user_addresses_visitor_id ON user_addresses (visitor_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_address    ON user_addresses (visitor_id, address);
