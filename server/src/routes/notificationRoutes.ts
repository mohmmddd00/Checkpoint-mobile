import { Router, Response } from "express";
import { Notification } from "../models/notifications.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/notifications — fetch latest 12 for the logged-in user
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate("sender", "username")
      .lean();
    res.json(notifications);
  } catch {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// Called internally after creating a notification — trims oldest beyond 12
async function trimNotifications(userId: string) {
  const all = await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .select("_id");
  if (all.length > 12) {
    const toDelete = all.slice(12).map((n) => n._id);
    await Notification.deleteMany({ _id: { $in: toDelete } });
  }
}

// DELETE /api/notifications/clear-all — wipes all notifications for this user
router.delete("/clear-all", async (req: AuthRequest, res: Response) => {
  try {
    await Notification.deleteMany({ recipient: req.userId });
    res.json({ message: "All notifications cleared" });
  } catch {
    res.status(500).json({ message: "Failed to clear notifications" });
  }
});

// DELETE /api/notifications/:id — dismiss a single notification (user clicked it)
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id as string,
      recipient: req.userId,
    });
    res.json({ message: "Notification dismissed" });
  } catch {
    res.status(500).json({ message: "Failed to dismiss notification" });
  }
});

// PATCH /api/notifications/mark-seen — marks all as read (called when user opens panel)
router.patch("/mark-seen", async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany({ recipient: req.userId, read: false }, { read: true });
    res.json({ message: "Marked as seen" });
  } catch {
    res.status(500).json({ message: "Failed to mark notifications as seen" });
  }
});

export { trimNotifications };
export default router;