import bcrypt from "bcryptjs";
import { query } from "../db/index.js";
import { nanoid } from "nanoid";

export async function upsertUser(user) {
  const now = new Date().toISOString();
  await query(
    `INSERT INTO users (id, email, name, picture, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       email      = EXCLUDED.email,
       name       = EXCLUDED.name,
       picture    = EXCLUDED.picture,
       updated_at = EXCLUDED.updated_at`,
    [user.id, user.email, user.name || "", user.picture || "", now, now]
  );
  return user;
}

export async function getUserByEmail(email) {
  const { rows } = await query(
    `SELECT id, email, name, picture, password_hash FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

export async function registerUser({ email, name, password }) {
  const existing = await getUserByEmail(email);
  if (existing) throw new Error("An account with this email already exists.");

  const hash = await bcrypt.hash(password, 12);
  const id   = nanoid();
  const now  = new Date().toISOString();

  await query(
    `INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, email, name || "", hash, now, now]
  );
  return { id, email, name: name || "" };
}

export async function verifyUser(email, password) {
  const user = await getUserByEmail(email);
  if (!user || !user.password_hash) return null;
  const match = await bcrypt.compare(password, user.password_hash);
  return match ? { id: user.id, email: user.email, name: user.name } : null;
}

export async function createResetToken(email) {
  const user = await getUserByEmail(email);
  if (!user) return null; // silently succeed so we don't leak whether email exists

  const token     = nanoid(48);
  const id        = nanoid();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  await query(
    `INSERT INTO password_reset_tokens (id, user_id, token, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [id, user.id, token, expiresAt]
  );
  return { token, email: user.email };
}

export async function validateResetToken(token) {
  const { rows } = await query(
    `SELECT t.id, t.user_id, u.email
     FROM password_reset_tokens t
     JOIN users u ON u.id = t.user_id
     WHERE t.token = $1 AND t.used = FALSE AND t.expires_at > NOW()`,
    [token]
  );
  return rows[0] || null;
}

export async function consumeResetToken(token, newPassword) {
  const record = await validateResetToken(token);
  if (!record) throw new Error("Reset link is invalid or has expired.");

  const hash = await bcrypt.hash(newPassword, 12);
  await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [hash, record.user_id]);
  await query(`UPDATE password_reset_tokens SET used = TRUE WHERE token = $1`, [token]);
}
