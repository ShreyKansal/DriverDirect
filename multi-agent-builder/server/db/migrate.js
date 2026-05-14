import { query } from "./index.js";

export async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT        PRIMARY KEY,
      email       TEXT        NOT NULL UNIQUE,
      name        TEXT        NOT NULL DEFAULT '',
      picture     TEXT        NOT NULL DEFAULT '',
      password_hash TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Add password_hash to existing installs
  await query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT        PRIMARY KEY,
      user_id     TEXT,
      name        TEXT        NOT NULL,
      description TEXT        NOT NULL DEFAULT '',
      workflow_json JSONB     NOT NULL DEFAULT '{}',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id TEXT
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS saved_workflows (
      id          TEXT        PRIMARY KEY,
      name        TEXT        NOT NULL DEFAULT '',
      workflow_json JSONB     NOT NULL DEFAULT '{}',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         TEXT        PRIMARY KEY,
      user_id    TEXT        NOT NULL,
      token      TEXT        NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used       BOOLEAN     NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS project_api_keys (
      project_id    TEXT        NOT NULL,
      provider_id   TEXT        NOT NULL,
      encrypted_key TEXT        NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (project_id, provider_id)
    )
  `);
}
