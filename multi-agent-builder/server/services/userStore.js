import bcrypt from "bcryptjs";
import { and, eq, gt, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../db/index.js";
import { users, passwordResetTokens } from "../db/schema.js";

export async function upsertUser(user) {
  const now = new Date();
  await db
    .insert(users)
    .values({
      id:        user.id,
      email:     user.email,
      name:      user.name    || "",
      picture:   user.picture || "",
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email:     user.email,
        name:      user.name    || "",
        picture:   user.picture || "",
        updatedAt: now
      }
    });
  return user;
}

export async function getUserByEmail(email) {
  const [row] = await db
    .select({
      id:           users.id,
      email:        users.email,
      name:         users.name,
      picture:      users.picture,
      passwordHash: users.passwordHash
    })
    .from(users)
    .where(eq(users.email, email));
  return row || null;
}

export async function registerUser({ email, name, password }) {
  const existing = await getUserByEmail(email);
  if (existing) throw new Error("An account with this email already exists.");

  const hash = await bcrypt.hash(password, 12);
  const id   = nanoid();
  const now  = new Date();

  await db.insert(users).values({
    id,
    email,
    name:         name || "",
    passwordHash: hash,
    createdAt:    now,
    updatedAt:    now
  });
  return { id, email, name: name || "" };
}

export async function verifyUser(email, password) {
  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash) return null;
  const match = await bcrypt.compare(password, user.passwordHash);
  return match ? { id: user.id, email: user.email, name: user.name } : null;
}

export async function createResetToken(email) {
  const user = await getUserByEmail(email);
  if (!user) return null; // silently succeed — don't leak whether email exists

  const token     = nanoid(48);
  const id        = nanoid();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(passwordResetTokens).values({
    id,
    userId:    user.id,
    token,
    expiresAt
  });
  return { token, email: user.email };
}

export async function validateResetToken(token) {
  const [row] = await db
    .select({
      id:     passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      email:  users.email
    })
    .from(passwordResetTokens)
    .innerJoin(users, eq(users.id, passwordResetTokens.userId))
    .where(
      and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expiresAt, sql`NOW()`)
      )
    );
  return row || null;
}

export async function consumeResetToken(token, newPassword) {
  const record = await validateResetToken(token);
  if (!record) throw new Error("Reset link is invalid or has expired.");

  const hash = await bcrypt.hash(newPassword, 12);

  await db
    .update(users)
    .set({ passwordHash: hash, updatedAt: new Date() })
    .where(eq(users.id, record.userId));

  await db
    .update(passwordResetTokens)
    .set({ used: true })
    .where(eq(passwordResetTokens.token, token));
}
