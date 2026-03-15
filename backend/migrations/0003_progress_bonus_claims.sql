CREATE TABLE IF NOT EXISTS progress_bonus_claims (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  bonus_type TEXT NOT NULL,
  claim_key TEXT NOT NULL,
  xp_award INTEGER NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  UNIQUE(user_id, claim_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_progress_bonus_claims_user_id
  ON progress_bonus_claims(user_id);

CREATE INDEX IF NOT EXISTS idx_progress_bonus_claims_type
  ON progress_bonus_claims(user_id, bonus_type);
