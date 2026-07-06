import { Router, Response } from "express";
import mongoose from "mongoose";
import { SavedVault } from "../models/savedVaults.js";
import { Vault } from "../models/vaults.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { Notification } from "../models/notifications.js";
import { trimNotifications } from "./notificationRoutes.js";

const router = Router();
router.use(requireAuth);

// GET /api/saved-vaults/count/:vaultId — get total save count for a vault
router.get("/count/:vaultId", async (req: AuthRequest, res: Response) => {
  try {
    const count = await SavedVault.countDocuments({ vault: req.params.vaultId });
    res.json({ count });
  } catch {
    res.status(500).json({ message: "Failed to get save count" });
  }
});

// GET /api/saved-vaults/status/:vaultId — check if current user has saved a vault
router.get("/status/:vaultId", async (req: AuthRequest, res: Response) => {
  try {
    const existing = await SavedVault.findOne({
      user:  req.userId,
      vault: req.params.vaultId,
    });
    res.json({ saved: !!existing });
  } catch {
    res.status(500).json({ message: "Failed to check save status" });
  }
});

// POST /api/saved-vaults/:vaultId — save a vault
router.post("/:vaultId", async (req: AuthRequest, res: Response) => {
  try {
    const vault = await Vault.findById(req.params.vaultId);
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    // Prevent saving your own vault
    if (vault.user.toString() === req.userId)
      return res.status(400).json({ message: "Cannot save your own vault" });

    await SavedVault.create({
      user:  new mongoose.Types.ObjectId(req.userId!),
      vault: new mongoose.Types.ObjectId(req.params.vaultId as string),
    });

    // Notify the vault owner
    await Notification.create({
      recipient: vault.user,
      sender:    req.userId,
      type:      "vault_save",
      gameLog:   vault._id,
    });
    await trimNotifications(vault.user.toString());

    res.status(201).json({ message: "Vault saved" });
  } catch (err: any) {
    // Duplicate key = already saved
    if (err.code === 11000)
      return res.status(409).json({ message: "Already saved" });
    res.status(500).json({ message: "Failed to save vault" });
  }
});

// DELETE /api/saved-vaults/:vaultId — unsave a vault
router.delete("/:vaultId", async (req: AuthRequest, res: Response) => {
  try {
    await SavedVault.findOneAndDelete({
      user:  req.userId,
      vault: req.params.vaultId,
    });
    res.json({ message: "Vault unsaved" });
  } catch {
    res.status(500).json({ message: "Failed to unsave vault" });
  }
});

// GET /api/saved-vaults — get all vaults saved by current user (for future page)
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const saved = await SavedVault.find({ user: req.userId })
      .populate({
        path: "vault",
        populate: { path: "user", select: "firstName lastName middleName username profileImage" },
      })
      .sort({ savedAt: -1 });
    res.json(saved.map((s) => s.vault));
  } catch {
    res.status(500).json({ message: "Failed to fetch saved vaults" });
  }
});

export default router;