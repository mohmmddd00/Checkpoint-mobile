import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { User } from "../models/user.js";
import { GameLog } from "../models/gameLog.js";
import { Comment } from "../models/comments.js";
import { Notification } from "../models/notifications.js";
import { SavedVault } from "../models/savedVaults.js";
import { Vault } from "../models/vaults.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/emailService.js";
import { generateVerificationToken, getTokenExpiry } from "../services/emailVerification.js";
import googleAuthRoutes from "./googleAuthRoutes.js";

const router = Router();
router.use("/", googleAuthRoutes);

// ─── CHANGE USERNAME ─────────────────────────────────────────────────────────

router.patch("/me/username", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret missing" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };

    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username is required." });
    }
    if (!/^[A-Za-z0-9]/.test(username)) {
      return res.status(400).json({ message: "Username cannot start with a special character." });
    }
    if (!/^[A-Za-z0-9_.]+$/.test(username)) {
      return res.status(400).json({ message: "Username can only contain letters, numbers, periods, and underscores." });
    }
    if (username !== username.toLowerCase()) {
      return res.status(400).json({ message: "Username must be lowercase." });
    }
    if (username.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters." });
    }
    if (username.length > 30) {
      return res.status(400).json({ message: "Username cannot exceed 30 characters." });
    }

    const existing = await User.findOne({ username });
    if (existing && existing._id.toString() !== decoded.id) {
      return res.status(400).json({ message: "This username is already taken." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      { username },
      { new: true }
    );

    const newToken = jwt.sign(
      { id: updatedUser!._id, email: updatedUser!.email, username: updatedUser!.username },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

  return res.status(200).json({ message: "Username updated successfully.", token: newToken });

  } catch {
    return res.status(500).json({ message: "Failed to update username." });
  }
});

// ─── AVATAR UPLOAD CONFIG ───────────────────────────────────────────────────
const avatarDir = path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    // Best-effort: pull the user id from the token for a readable filename.
    // If this fails, the route handler below still rejects unauthenticated requests.
    let userId = "user";
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
      if (token && process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
        userId = decoded.id;
      }
    } catch {
      // fall through with the default "user" prefix
    }
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${Date.now()}${ext}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, middleName, username, email, password } = req.body;

    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const nameRegex = /^[A-Za-z]([A-Za-z\s\-]*[A-Za-z])?$/;
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      return res.status(400).json({ message: "First and last name must be at least 2 characters" });
    }
    if (/^-|-$/.test(firstName.trim()) || /^-|-$/.test(lastName.trim())) {
      return res.status(400).json({ message: "First and last name cannot start or end with a hyphen" });
    }
    if (!nameRegex.test(firstName.trim()) || !nameRegex.test(lastName.trim())) {
      return res.status(400).json({ message: "First and last name can only contain letters, spaces, or hyphens" });
    }
    if (middleName?.trim() && middleName.trim().length < 2) {
      return res.status(400).json({ message: "Middle name must be at least 2 characters" });
    }
    if (middleName?.trim() && /^-|-$/.test(middleName.trim())) {
      return res.status(400).json({ message: "Middle name cannot start or end with a hyphen" });
    }
    if (middleName?.trim() && !nameRegex.test(middleName.trim())) {
      return res.status(400).json({ message: "Middle name can only contain letters, spaces, or hyphens" });
    }

    if (!/^[A-Za-z0-9]/.test(username)) {
      return res.status(400).json({ message: "Username cannot start with a special character" });
    }

    if (!/^[A-Za-z0-9_.]+$/.test(username)) {
      return res.status(400).json({ message: "Username can only contain letters, periods, numbers, and underscores" });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters." });
    }

    if (username.trim().length > 30) {
      return res.status(400).json({ message: "Username cannot exceed 30 characters." });
    }

    if (username !== username.toLowerCase()) {
      return res.status(400).json({ message: "Username must be lowercase" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    // ── Email validation ──────────────────────────────────────────────────
    const adminEmail = process.env.ADMIN_EMAIL || "";
    const isAdminEmail = email.toLowerCase() === adminEmail.toLowerCase();

    if (!isAdminEmail) {
      const emailRegex = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ message: "Please use a valid email address." });
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.authProvider === "google") {
        return res.status(400).json({ message: "This email is linked to a Google account. Please sign in with Google." });
      }
      return res.status(400).json({ message: "User already exists" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "This username is already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = getTokenExpiry();

    // Admin email is auto-verified; everyone else must verify via email
    const newUser = await User.create({
      firstName,
      lastName,
      middleName: middleName?.trim() || "",
      username,
      email,
      password: hashedPassword,
      isVerified: isAdminEmail,
      verificationToken: isAdminEmail ? null : verificationToken,
      verificationTokenExpiry: isAdminEmail ? null : verificationTokenExpiry,
    });

    if (!isAdminEmail) {
      await sendVerificationEmail(email, verificationToken);
    }

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err: any) {
    console.error("[REGISTER ERROR]", err);
    if (err?.code === 11000) {
      if (err?.keyPattern?.username) {
        return res.status(409).json({ message: "This username is already taken." });
      }
      if (err?.keyPattern?.email) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }
    }
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.authProvider === "google" && !user.password) {
      return res.status(400).json({ message: "This account uses Google sign-in. Please use the 'Continue with Google' button." });
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Block login if email is not verified
    if (!user.isVerified) {
      return res.status(403).json({ message: "Cannot log in using an unverified email." });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret is missing" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch {
    res.status(500).json({ message: "Login failed" });
  }
});

router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Invalid or missing verification token." });
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Invalid verification token." });
    }

    if (!user.verificationTokenExpiry || new Date() > user.verificationTokenExpiry) {
      return res.status(400).json({ message: "Verification link has expired. Please register again." });
    }

    await User.findByIdAndUpdate(user._id, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    });

    return res.status(200).json({ message: "Email verified successfully." });
  } catch {
    res.status(500).json({ message: "Email verification failed." });
  }
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: (user as any).middleName || "",
      username: user.username,
      email: user.email,
      profileImage: user.profileImage || "",
      authProvider: (user as any).authProvider || "local",
      hasPassword: !!(user.password && user.password.length > 0),
    });
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
});

router.post("/me/avatar", uploadAvatar.single("avatar"), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret missing" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const profileImage = `/uploads/avatars/${req.file.filename}`;
    await User.findByIdAndUpdate(decoded.id, { profileImage });

    res.json({ message: "Profile picture updated", profileImage });
  } catch {
    res.status(500).json({ message: "Failed to upload profile picture" });
  }
});

router.delete("/me/avatar", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret missing" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.profileImage) {
      const filePath = path.join(process.cwd(), user.profileImage.replace(/^\//, ""));
      fs.unlink(filePath, () => {}); // best-effort cleanup, ignore errors
    }

    await User.findByIdAndUpdate(decoded.id, { profileImage: "" });

    res.json({ message: "Profile picture removed" });
  } catch {
    res.status(500).json({ message: "Failed to remove profile picture" });
  }
});

router.patch("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret missing" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
    const { firstName, lastName, middleName, username, oldPassword, newPassword } = req.body;

    const nameRegex = /^[A-Za-z]([A-Za-z\s\-]*[A-Za-z])?$/;
    if (firstName?.trim()) {
      if (firstName.trim().length < 2) {
        return res.status(400).json({ message: "First name must be at least 2 characters." });
      }
      if (/^-|-$/.test(firstName.trim()) || !nameRegex.test(firstName.trim())) {
        return res.status(400).json({ message: "First name can only contain letters, spaces, or hyphens, and cannot start or end with a hyphen." });
      }
    }
    if (lastName?.trim()) {
      if (lastName.trim().length < 2) {
        return res.status(400).json({ message: "Last name must be at least 2 characters." });
      }
      if (/^-|-$/.test(lastName.trim()) || !nameRegex.test(lastName.trim())) {
        return res.status(400).json({ message: "Last name can only contain letters, spaces, or hyphens, and cannot start or end with a hyphen." });
      }
    }
    if (middleName?.trim()) {
      if (middleName.trim().length < 2) {
        return res.status(400).json({ message: "Middle name must be at least 2 characters." });
      }
      if (/^-|-$/.test(middleName.trim()) || !nameRegex.test(middleName.trim())) {
        return res.status(400).json({ message: "Middle name can only contain letters, spaces, or hyphens, and cannot start or end with a hyphen." });
      }
    }

    if (username !== undefined && username.trim() !== "") {
      const trimmedUsername = username.trim().toLowerCase();
      if (trimmedUsername.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters." });
      }
      if (trimmedUsername.length > 30) {
        return res.status(400).json({ message: "Username cannot exceed 30 characters." });
      }
      if (!/^[A-Za-z0-9]/.test(trimmedUsername)) {
        return res.status(400).json({ message: "Username cannot start with a special character." });
      }
      if (!/^[A-Za-z0-9_.]+$/.test(trimmedUsername)) {
        return res.status(400).json({ message: "Username can only contain letters, numbers, periods, and underscores." });
      }
      const existingUser = await User.findOne({ username: trimmedUsername, _id: { $ne: decoded.id } });
      if (existingUser) {
        return res.status(409).json({ message: "This username is already taken." });
      }
    }

    const updateFields: Record<string, string> = {};
    if (firstName?.trim()) updateFields.firstName = firstName.trim();
    if (lastName?.trim()) updateFields.lastName = lastName.trim();
    if (middleName !== undefined) updateFields.middleName = middleName.trim();
    if (username !== undefined && username.trim() !== "") updateFields.username = username.trim().toLowerCase();

    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({ message: "Current password is required to set a new password" });
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password!);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      updateFields.password = await bcrypt.hash(newPassword, 10);
    }

    await User.findByIdAndUpdate(decoded.id, updateFields);

    // If the username changed, issue a fresh JWT so the client token stays accurate
    const updatedUser = await User.findById(decoded.id).select("username email");
    const newToken = jwt.sign(
      { id: decoded.id, email: updatedUser!.email, username: updatedUser!.username },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.json({ message: "Profile updated", token: newToken });
  } catch (err: any) {
    if (err?.code === 11000 && err?.keyPattern?.username) {
      return res.status(409).json({ message: "This username is already taken." });
    }
    res.status(500).json({ message: "Failed to update profile" });
  }
});

async function pruneAncestors(commentId: string) {
  const ancestor = await Comment.findById(commentId);
  if (!ancestor) return;
  const isTombstoned = !ancestor.author && ancestor.text === "[deleted]";
  if (!isTombstoned) return;
  const remainingChildren = await Comment.find({ parentComment: commentId }).select("_id");
  if (remainingChildren.length === 0) {
    await Comment.findByIdAndDelete(commentId);
    if (ancestor.parentComment) {
      await pruneAncestors(ancestor.parentComment.toString());
    }
  }
}

router.delete("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret missing" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Clean up the avatar file on disk, if one exists
    if (user.profileImage) {
      const filePath = path.join(process.cwd(), user.profileImage.replace(/^\//, ""));
      fs.unlink(filePath, () => {}); // best-effort, ignore errors
    }

    // Find every game log this user owns (their reviews live inside these)
    const logs = await GameLog.find({ user: decoded.id }).select("_id");
    const logIds = logs.map((log) => log._id);

    // Delete comments other people left on this user's logs
    if (logIds.length > 0) {
      await Comment.deleteMany({ gameLog: { $in: logIds } });
    }

    // Delete comments this user left on other people's logs.
    // Mirrors manual comment deletion: tombstone if replies exist (to preserve
    // the thread), hard-delete only if no replies, then prune orphaned ancestors.
    const userComments = await Comment.find({ author: decoded.id }).select("_id parentComment");
    for (const comment of userComments) {
      const children = await Comment.find({ parentComment: comment._id }).select("_id");
      if (children.length > 0) {
        await Comment.findByIdAndUpdate(comment._id, { text: "[deleted]", author: null });
      } else {
        await Comment.findByIdAndDelete(comment._id);
        if (comment.parentComment) {
          await pruneAncestors(comment.parentComment.toString());
        }
      }
    }

    // Remove this user's likes from everyone else's comments
    await Comment.updateMany(
      {},
      { $pull: { likes: decoded.id } }
    );

    // Remove this user's likes/dislikes from everyone else's logs
    await GameLog.updateMany(
      {},
      { $pull: { likes: decoded.id, dislikes: decoded.id } }
    );

    // Delete all notifications this user sent to others
    await Notification.deleteMany({ sender: decoded.id });

    // Delete all notifications this user received
    await Notification.deleteMany({ recipient: decoded.id });

    // Delete this user's own game logs/reviews
    await GameLog.deleteMany({ user: decoded.id });

    // Delete saved vault records created by this user
    await SavedVault.deleteMany({ user: decoded.id });

    // Delete saved vault records where others saved this user's vaults
    const userVaultIds = await Vault.find({ user: decoded.id }).distinct("_id");
    await SavedVault.deleteMany({ vault: { $in: userVaultIds } });

    // Delete this user's own vaults
    await Vault.deleteMany({ user: decoded.id });

    await User.findByIdAndDelete(decoded.id);

    res.json({ message: "Account deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete account" });
  }
});

router.post("/resend-verification", async (req, res) => {
  try {
    const { email, expiredToken } = req.body;

    let user;

    if (expiredToken) {
      // Came from an expired/invalid link — look up by the old token
      user = await User.findOne({ verificationToken: expiredToken });
    } else if (email) {
      // Came from the normal verify-account page after registration
      user = await User.findOne({ email });
    } else {
      return res.status(400).json({ message: "Email is required." });
    }

    if (!user || user.isVerified) {
      return res.status(200).json({ message: "If this email is registered and unverified, a new link has been sent." });
    }

    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = getTokenExpiry();

    await User.findByIdAndUpdate(user._id, {
      verificationToken,
      verificationTokenExpiry,
    });

    await sendVerificationEmail(user.email, verificationToken);

    return res.status(200).json({ message: "Verification email resent." });
  } catch {
    res.status(500).json({ message: "Failed to resend verification email." });
  }
});

router.get("/validate-reset-token", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Invalid or missing reset token." });
    }

    const user = await User.findOne({ passwordResetToken: token });

    if (!user) {
      return res.status(400).json({ message: "This reset link is invalid." });
    }

    if (user.authProvider === "google" && !user.password) {
      return res.status(403).json({
        code: "GOOGLE_ACCOUNT",
        message: "This account was created with Google. Your password is managed by Google and cannot be changed here.",
      });
    }

    if (!user.passwordResetTokenExpiry || new Date() > user.passwordResetTokenExpiry) {
      return res.status(400).json({ message: "This reset link has expired. Please request a new one." });
    }

    return res.status(200).json({ message: "Token is valid." });
  } catch {
    res.status(500).json({ message: "Token validation failed." });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });

    // Always return 200 to avoid revealing whether an account exists
    if (!user || !user.isVerified) {
      return res.status(200).json({ message: "If an account with that email exists, a reset link has been sent." });
    }

    const resetToken = generateVerificationToken();
    const resetTokenExpiry = getTokenExpiry();

    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: resetToken,
      passwordResetTokenExpiry: resetTokenExpiry,
    });

    await sendPasswordResetEmail(email, resetToken);

    return res.status(200).json({ message: "If an account with that email exists, a reset link has been sent." });
  } catch {
    res.status(500).json({ message: "Failed to send password reset email." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const user = await User.findOne({ passwordResetToken: token });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link." });
    }

    if (!user.passwordResetTokenExpiry || new Date() > user.passwordResetTokenExpiry) {
      return res.status(400).json({ message: "This reset link has expired. Please request a new one." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
    });

    return res.status(200).json({ message: "Password reset successfully." });
  } catch {
    res.status(500).json({ message: "Failed to reset password." });
  }
});

export default router;