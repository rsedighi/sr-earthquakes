-- BayTremor D1 Schema — Leads
-- Qualified lead capture from the "My Area" Home Seismic Risk Report.
-- Stores contact + property qualifiers + explicit consent so leads are
-- sellable to insurance / retrofit / preparedness partners in compliance
-- with TCPA / CCPA. Consent is REQUIRED at the application layer.

CREATE TABLE IF NOT EXISTS leads (
  id                TEXT    PRIMARY KEY,
  -- Link back to the anonymous visitor + saved address (nullable).
  visitor_id        TEXT,
  address_id        TEXT,

  -- Contact
  name              TEXT,
  email             TEXT    NOT NULL,
  phone             TEXT,

  -- Location snapshot at time of capture
  address           TEXT,
  city              TEXT,
  lat               REAL,
  lon               REAL,

  -- Lead routing category: 'insurance' | 'retrofit' | 'preparedness' | 'general'
  category          TEXT    NOT NULL DEFAULT 'general',

  -- Risk snapshot at time of capture
  risk_score        INTEGER,
  risk_band         TEXT,
  nearest_fault     TEXT,

  -- Property qualifiers (what makes a lead sellable)
  ownership         TEXT,               -- 'own' | 'rent' | null
  home_age          TEXT,               -- e.g. 'pre-1980' | '1980-2000' | 'post-2000'
  foundation_type   TEXT,               -- 'raised' | 'slab' | 'unknown'
  has_insurance     INTEGER,            -- 1 = yes, 0 = no, null = unknown

  -- Consent & provenance (compliance-critical)
  consent           INTEGER NOT NULL DEFAULT 0,   -- 1 = explicit opt-in
  consent_text      TEXT,                          -- exact copy shown at opt-in
  consent_at        INTEGER,                        -- ms epoch of opt-in
  source            TEXT    NOT NULL DEFAULT 'my-area',
  user_agent        TEXT,
  ip_hash           TEXT,

  -- Lifecycle
  status            TEXT    NOT NULL DEFAULT 'new', -- new | contacted | sold | invalid | unsubscribed
  sold_to           TEXT,                            -- partner id/name once sold
  notes             TEXT,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_email       ON leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_category    ON leads (category);
CREATE INDEX IF NOT EXISTS idx_leads_status      ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at  ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_visitor_id  ON leads (visitor_id);
