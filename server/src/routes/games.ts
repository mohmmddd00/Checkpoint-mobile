import { Router, Response } from "express";
import { User } from "../models/user";
import { GameLog } from "../models/gameLog";
// 1. IMPORT YOUR NATIVE MIDDLEWARE AND REQUEST INTERFACE
import { requireAuth, AuthRequest } from "../middleware/auth"; 

const router = Router();

// POST /api/games/log
// 2. APPLY requireAuth AS THE ROUTE GUARDIAN
router.post("/log", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    
    // 3. TARGET THE EXACT req.userId STRING PARSED BY YOUR JWT VERIFIER
    const userId = req.userId; 

    if (!title) {
      return res.status(400).json({ error: "Game title is required" });
    }

    // Create the fresh log document using your gameLog schema
    const newLog = new GameLog({
      title: title,
      platform: "PC", // Default placeholder setup
      status: "Completed", 
    });

    const savedLog = await newLog.save();

    // Push the Log's _id cleanly into your User gamesLogged array
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { gamesLogged: savedLog._id } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User profile record not found" });
    }

    res.status(201).json({ 
      message: "Game successfully logged!", 
      logId: savedLog._id 
    });
  } catch (error) {
    console.error("Server logging route failure:", error);
    res.status(500).json({ error: "Internal server error logging game" });
  }
});

export default router;
