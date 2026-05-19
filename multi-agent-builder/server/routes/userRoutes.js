import express from "express";
import {
  upsertUser,
  registerUser,
  verifyUser,
  createResetToken,
  validateResetToken,
  consumeResetToken,
} from "../services/userStore.js";

const router = express.Router();

function isDbError(err) {
  return err?.code === "ECONNRESET" || err?.code === "ECONNREFUSED" ||
         err?.cause?.code === "ECONNRESET" || err?.cause?.code === "ECONNREFUSED" ||
         err?.message?.includes("ECONNRESET") || err?.message?.includes("ECONNREFUSED") ||
         err?.message?.includes("connect") || err?.constructor?.name === "DrizzleQueryError";
}

// Called by App.jsx after Google sign-in to persist the user in Postgres
router.post("/sync", async (req, res, next) => {
  try {
    const { id, email, name, picture } = req.body || {};
    if (!email) return res.status(400).json({ status: "error", message: "Missing email." });
    await upsertUser({ id: id || email, email, name, picture });
    res.json({ status: "ok" });
  } catch (error) {
    if (isDbError(error)) return res.json({ status: "ok" });
    next(error);
  }
});

// Register a new credentials user
router.post("/register", async (req, res, next) => {
  try {
    const { email, name, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ status: "error", message: "Email and password are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ status: "error", message: "Password must be at least 8 characters." });
    }
    const user = await registerUser({ email: email.toLowerCase().trim(), name, password });
    res.json({ status: "ok", user });
  } catch (error) {
    if (error.message?.includes("already exists")) {
      return res.status(409).json({ status: "error", message: error.message });
    }
    if (isDbError(error)) {
      return res.status(503).json({ status: "error", message: "Database unavailable." });
    }
    next(error);
  }
});

// Called by NextAuth CredentialsProvider.authorize to verify email/password
router.post("/verify", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ status: "error", message: "Missing credentials." });
    }
    const user = await verifyUser(email.toLowerCase().trim(), password);
    if (!user) return res.status(401).json({ status: "error", message: "Invalid email or password." });
    res.json({ status: "ok", user });
  } catch (error) {
    if (isDbError(error)) {
      return res.status(503).json({ status: "error", message: "Database unavailable." });
    }
    next(error);
  }
});

// Request a password-reset link
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ status: "error", message: "Email is required." });

    const result = await createResetToken(email.toLowerCase().trim());
    if (result) {
      const link = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${result.token}`;
      console.log(`[Password Reset] Link for ${result.email}: ${link}`);
    }
    res.json({ status: "ok", message: "If that email is registered, a reset link has been sent." });
  } catch (error) {
    if (isDbError(error)) return res.json({ status: "ok", message: "If that email is registered, a reset link has been sent." });
    next(error);
  }
});

// Validate token
router.get("/reset-password/:token", async (req, res, next) => {
  try {
    const record = await validateResetToken(req.params.token);
    if (!record) return res.status(400).json({ status: "error", message: "Invalid or expired reset link." });
    res.json({ status: "ok", email: record.email });
  } catch (error) {
    if (isDbError(error)) return res.status(503).json({ status: "error", message: "Database unavailable." });
    next(error);
  }
});

// Consume token and set new password
router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ status: "error", message: "Token and new password are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ status: "error", message: "Password must be at least 8 characters." });
    }
    await consumeResetToken(token, password);
    res.json({ status: "ok", message: "Password updated. You can now sign in." });
  } catch (error) {
    if (error.message?.includes("Invalid or has expired")) {
      return res.status(400).json({ status: "error", message: error.message });
    }
    if (isDbError(error)) return res.status(503).json({ status: "error", message: "Database unavailable." });
    next(error);
  }
});

export default router;
