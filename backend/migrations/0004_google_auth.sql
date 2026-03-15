ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'local'
  CHECK (auth_provider IN ('local', 'google'));

ALTER TABLE users ADD COLUMN provider_user_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_identity
  ON users(auth_provider, provider_user_id);
