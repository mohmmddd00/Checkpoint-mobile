import { Router, Response } from "express";
import { Vault } from "../models/vaults.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/vaults — get all vaults for the current user
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const vaults = await Vault.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(vaults);
  } catch {
    res.status(500).json({ message: "Failed to fetch vaults" });
  }
});

// GET /api/vaults/public — community feed (all users' vaults, user populated)
router.get("/public", async (_req: AuthRequest, res: Response) => {
  try {
    const vaults = await Vault.find()
      .populate("user", "firstName lastName middleName username profileImage")
      .sort({ createdAt: -1 });
    res.json(vaults);
  } catch {
    res.status(500).json({ message: "Failed to fetch community vaults" });
  }
});

// GET /api/vaults/public/:id — single vault without ownership check
router.get("/public/:id", async (req: AuthRequest, res: Response) => {
  try {
    const vault = await Vault.findById(req.params.id).populate(
      "user",
      "firstName lastName middleName username profileImage"
    );
    if (!vault) return res.status(404).json({ message: "Vault not found" });
    res.json(vault);
  } catch {
    res.status(500).json({ message: "Failed to fetch vault" });
  }
});

// GET /api/vaults/:id — get a single vault
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const vault = await Vault.findById(req.params.id);
    if (!vault) return res.status(404).json({ message: "Vault not found" });
    if (vault.user.toString() !== req.userId)
      return res.status(403).json({ message: "Not your vault" });
    res.json(vault);
  } catch {
    res.status(500).json({ message: "Failed to fetch vault" });
  }
});

// POST /api/vaults — create a new vault
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, games } = req.body;
    if (!title || !title.trim())
      return res.status(400).json({ message: "Vault title is required" });

    const vault = await Vault.create({
      user: req.userId,
      title: title.trim(),
      description: description?.trim() ?? "",
      games: games ?? [],
    });

    res.status(201).json(vault);
  } catch {
    res.status(500).json({ message: "Failed to create vault" });
  }
});

// PATCH /api/vaults/:id — edit title, description, or games list
router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const vault = await Vault.findById(req.params.id);
    if (!vault) return res.status(404).json({ message: "Vault not found" });
    if (vault.user.toString() !== req.userId)
      return res.status(403).json({ message: "Not your vault" });

    const { title, description, games } = req.body;
    if (title !== undefined) vault.title = title.trim();
    if (description !== undefined) vault.description = description.trim();
    if (games !== undefined) vault.games = games;
    (vault as any).editedAt = new Date();

    await vault.save();
    res.json(vault);
  } catch {
    res.status(500).json({ message: "Failed to update vault" });
  }
});

// DELETE /api/vaults/:id — delete a vault
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const vault = await Vault.findById(req.params.id);
    if (!vault) return res.status(404).json({ message: "Vault not found" });
    if (vault.user.toString() !== req.userId)
      return res.status(403).json({ message: "Not your vault" });

    await vault.deleteOne();
    res.json({ message: "Vault deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete vault" });
  }
});

export default router;