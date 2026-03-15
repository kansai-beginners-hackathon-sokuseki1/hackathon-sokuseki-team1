PRAGMA foreign_keys = OFF;

CREATE TABLE users_guest_auth (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT NOT NULL,
  auth_provider TEXT NOT NULL DEFAULT 'local'
    CHECK (auth_provider IN ('local', 'google', 'guest')),
  provider_user_id TEXT
);

INSERT INTO users_guest_auth (
  id,
  email,
  username,
  password_hash,
  password_salt,
  created_at,
  auth_provider,
  provider_user_id
)
SELECT
  id,
  email,
  username,
  password_hash,
  password_salt,
  created_at,
  auth_provider,
  provider_user_id
FROM users;

DROP TABLE users;
ALTER TABLE users_guest_auth RENAME TO users;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_identity
  ON users(auth_provider, provider_user_id);

PRAGMA foreign_keys = ON;
