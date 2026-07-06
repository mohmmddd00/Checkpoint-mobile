import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = Router();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ─── INITIATE GOOGLE LOGIN ────────────────────────────────────────────────────
// When user clicks "Continue with Google", they hit this route.
// Passport redirects them to Google's login page.

router.get("/google", (req, res, next) => {
  const prompt = req.query.prompt as string | undefined;
  passport.authenticate("google", {
    scope: ["profile", "email"],
    ...(prompt ? { prompt } : {}),
  })(req, res, next);
});

// ─── GOOGLE CALLBACK ──────────────────────────────────────────────────────────
// Google redirects back here after the user authenticates.
// We issue our own JWT and redirect to the frontend.

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${CLIENT_URL}/login?error=google_failed` }),
  (req, res) => {
    try {
      const user = req.user as any;

      if (!process.env.JWT_SECRET) {
        return res.redirect(`${CLIENT_URL}/login?error=server_error`);
      }

      const token = jwt.sign(
        { id: user._id, email: user.email, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Check if this user still has a temporary username (new Google user)
      // If so, redirect to complete profile page with the token
      const isTemporaryUsername = user.username?.startsWith("user_");

      if (isTemporaryUsername) {
        return res.redirect(`${CLIENT_URL}/complete-profile?token=${token}`);
      }

      // Existing user — redirect straight to callback handler with token
      return res.redirect(`${CLIENT_URL}/auth/callback?token=${token}`);
    } catch {
      return res.redirect(`${CLIENT_URL}/login?error=server_error`);
    }
  }
);

export default router;