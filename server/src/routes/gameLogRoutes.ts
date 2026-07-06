import { Router, Response } from "express";
import { GameLog } from "../models/gameLog.js";
import { User } from "../models/user.js"; // Ensure your relative path to user model matches
// IMPORT YOUR NATIVE MIDDLEWARE AND TYPE WRAPPERS EXTENSIONS CLEANLY
import { requireAuth, AuthRequest } from "../middleware/auth.js"; 
import { Comment } from "../models/comments.js";
import mongoose from "mongoose";
import { Notification } from "../models/notifications.js";
import { trimNotifications } from "./notificationRoutes.js";

const router = Router();

router.use(requireAuth);

// GET /api/gamelogs
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId; // Extracted from JWT by requireAuth middleware
    const userDoc = await User.findById(userId).select("gamesLogged");

    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

     const logs = await GameLog.find({ _id: { $in: userDoc.gamesLogged } }).sort({ timestamp: -1 });
    res.json(logs);

  } catch {
    res.status(500).json({ message: "Failed to fetch game logs" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    // 1. Destructures core payload requirements parameter configurations safely
    const { title, platform = "PC", status = "Completed", rating = null, review = "", coverImage = null, releasedDate = null, genres = [] } = req.body;
    
    // 2. Safely captures the decoded account identification string matching your auth.ts file configuration rules
    const userId = req.userId; 

    if (!title) {
      return res.status(400).json({ message: "Game title is required" });
    }

    const existingLog = await GameLog.findOne({
      title: { $regex: new RegExp(`^${title.trim()}$`, "i") }, // Case-insensitive check (e.g., "Hades" matches "hades")
      _id: { $in: (await User.findById(userId).select("gamesLogged"))?.gamesLogged || [] }
    });

     if (existingLog) {
      // Stops operation immediately and provides a helpful user indicator message
      return res.status(400).json({ message: `"${title}" is already in your logged library!` });
    }

    // 3. Spawns the authentic fresh item entry record data row inside your mongo cluster collections
    const newLog = await GameLog.create({
      user: userId,
      title,
      platform,
      status,
      rating,
      review,
      coverImage,
      releasedDate,
      genres,
    });

    // 4. ATOMIC AGGREGATE UPDATE: Pushes the new Log ID reference token into your User table mapping structure fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { gamesLogged: newLog._id } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User account profile document record not found" });
    }

    // Delivers response package indicating full operations loop completion status code indicators
    res.status(201).json(newLog);
  } catch (error) {
    console.error("Mongoose background loop saving operation failure exception details:", error);
    res.status(400).json({ message: "Failed to create game log" });
  }
});

function buildReactionPayload(log: any, userId: string) {
  return {
    likes: log.likes.length,
    dislikes: log.dislikes.length,
    userReaction: log.likes.some((id: any) => id.toString() === userId)
      ? "like"
      : log.dislikes.some((id: any) => id.toString() === userId)
      ? "dislike"
      : null,
    isOwnLog: log.user.toString() === userId,
  };
}

async function toggleReaction(logId: string, userId: string, type: "like" | "dislike") {
  const log = await GameLog.findById(logId);
  if (!log) return { error: "not_found" as const };

  if (log.user.toString() === userId) {
    return { error: "self_reaction" as const };
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const isLiked = log.likes.some((id: any) => id.toString() === userId);
  const isDisliked = log.dislikes.some((id: any) => id.toString() === userId);

  if (type === "like") {
    if (isLiked) {
      log.likes = log.likes.filter((id: any) => id.toString() !== userId);
    } else {
      log.likes.push(userObjectId);
      if (isDisliked) log.dislikes = log.dislikes.filter((id: any) => id.toString() !== userId);
    }
  } else {
    if (isDisliked) {
      log.dislikes = log.dislikes.filter((id: any) => id.toString() !== userId);
    } else {
      log.dislikes.push(userObjectId);
      if (isLiked) log.likes = log.likes.filter((id: any) => id.toString() !== userId);
    }
  }

  await log.save();
  return { log };
}

// GET /api/gamelogs/public — all reviews from all users
router.get("/public", async (_req: AuthRequest, res: Response) => {
  try {
    const logs = await GameLog.find({ review: { $exists: true, $ne: "" } })
      .sort({ timestamp: -1 })
      .populate("user", "firstName lastName middleName username profileImage")
      .lean();

    // Drop any logs whose user was deleted (populate returns null for those)
    const valid = logs.filter((log: any) => log.user != null);
    res.json(valid);
  } catch {
    res.status(500).json({ message: "Failed to fetch community reviews" });
  }
});

// GET /api/gamelogs/check?title=... — lightweight logged check
router.get("/check", async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.query;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const user = await User.findById(req.userId).select("gamesLogged");
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await GameLog.findOne({
      _id: { $in: user.gamesLogged },
      title: { $regex: new RegExp(`^${(title as string).trim()}$`, "i") },
    }).select("_id");

    res.json({ logged: !!match });
  } catch {
    res.status(500).json({ message: "Failed to check log status" });
  }
});

// GET /api/gamelogs/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const log = await GameLog.findById(id);
    if (!log) return res.status(404).json({ message: "Game log not found" });
    res.json(log);
  } catch {
    res.status(500).json({ message: "Failed to fetch game log" });
  }
});

// GET /api/gamelogs/:id/reactions
router.get("/:id/reactions", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const log = await GameLog.findById(id).select("likes dislikes user");
    if (!log) return res.status(404).json({ message: "Game log not found" });
    res.json(buildReactionPayload(log, req.userId!));
  } catch {
    res.status(500).json({ message: "Failed to fetch reactions" });
  }
});

// POST /api/gamelogs/:id/like
router.post("/:id/like", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await toggleReaction(id, req.userId!, "like");
    if (result.error === "not_found") return res.status(404).json({ message: "Game log not found" });
    if (result.error === "self_reaction") return res.status(403).json({ message: "You can't like your own review" });
    const payload = buildReactionPayload(result.log, req.userId!);
    // Fire notification only when adding a like (not removing)
    if (payload.userReaction === "like") {
      const alreadyNotified = await Notification.findOne({
        recipient: result.log!.user,
        sender: req.userId,
        type: "review_like",
        gameLog: id,
      });
      if (!alreadyNotified) {
        await Notification.create({
          recipient: result.log!.user,
          sender: req.userId,
          type: "review_like",
          gameLog: id,
        });
        await trimNotifications(result.log!.user.toString());
      }
    } else {
      // User unliked — remove the notification
      await Notification.findOneAndDelete({
        recipient: result.log!.user,
        sender: req.userId,
        type: "review_like",
        gameLog: id,
      });
    }
    res.json(payload);
  } catch {
    res.status(500).json({ message: "Failed to update like" });
  }
});

// POST /api/gamelogs/:id/dislike
router.post("/:id/dislike", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await toggleReaction(id, req.userId!, "dislike");
    if (result.error === "not_found") return res.status(404).json({ message: "Game log not found" });
    if (result.error === "self_reaction") return res.status(403).json({ message: "You can't dislike your own review" });
    res.json(buildReactionPayload(result.log, req.userId!));
  } catch {
    res.status(500).json({ message: "Failed to update dislike" });
  }
});

// GET /api/gamelogs/:id/comments — top-level only
router.get("/:id/comments", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const comments = await Comment.find({ gameLog: id, parentComment: null })
      .sort({ createdAt: -1 })
      .populate("author", "username firstName lastName");
    res.json(comments);
  } catch {
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

// GET /api/gamelogs/:id/comments/:commentId/replies
router.get("/:id/comments/:commentId/replies", async (req: AuthRequest, res: Response) => {
  try {
    const replies = await Comment.find({ parentComment: req.params.commentId })
      .sort({ createdAt: 1 })
      .populate("author", "username firstName lastName");
    res.json(replies);
  } catch {
    res.status(500).json({ message: "Failed to fetch replies" });
  }
});

// POST /api/gamelogs/:id/comments/:commentId/like
router.post("/:id/comments/:commentId/like", async (req: AuthRequest, res: Response) => {
  try {
    const comment = await Comment.findById(req.params.commentId as string);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Can't like a tombstoned comment
    if (!comment.author) return res.status(400).json({ message: "Cannot like a deleted comment" });

    // Can't like your own comment
    if (comment.author.toString() === req.userId) {
      return res.status(403).json({ message: "You can't like your own comment" });
    }

    const userObjectId = new mongoose.Types.ObjectId(req.userId);
    const alreadyLiked = comment.likes.some((id: any) => id.toString() === req.userId);

    if (alreadyLiked) {
      comment.likes = comment.likes.filter((id: any) => id.toString() !== req.userId);
    } else {
      comment.likes.push(userObjectId);
    }

    await comment.save();

    if (!alreadyLiked) {
      // Adding a like — notify comment author if it's not yourself
      const alreadyNotified = await Notification.findOne({
        recipient: comment.author,
        sender: req.userId,
        type: "comment_like",
        gameLog: req.params.id,
      });
      if (!alreadyNotified) {
        await Notification.create({
          recipient: comment.author,
          sender: req.userId,
          type: "comment_like",
          gameLog: req.params.id as string,
        });
      }
    } else {
      // Removing a like — clean up the notification
      await Notification.findOneAndDelete({
        recipient: comment.author,
        sender: req.userId,
        type: "comment_like",
        gameLog: req.params.id,
      });
    }

    res.json({ likes: comment.likes.length, userLiked: !alreadyLiked });
  } catch {
    res.status(500).json({ message: "Failed to toggle comment like" });
  }
});

// POST /api/gamelogs/:id/comments
router.post("/:id/comments", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { text, parentCommentId } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const log = await GameLog.findById(id).select("_id");
    if (!log) return res.status(404).json({ message: "Game log not found" });

    // Validate parent comment exists and belongs to this game log
    if (parentCommentId) {
      const parent = await Comment.findById(parentCommentId).select("gameLog");
      if (!parent || parent.gameLog.toString() !== id) {
        return res.status(400).json({ message: "Invalid parent comment" });
      }
    }

    const comment = await Comment.create({
      gameLog: id,
      author: req.userId,
      text: text.trim(),
      parentComment: parentCommentId ?? null,
    });

    const populated = await comment.populate("author", "username firstName lastName");

    // Notify the review owner — but not if they're commenting on their own review
    const gameLogDoc = await GameLog.findById(id).select("user");
    if (gameLogDoc && gameLogDoc.user.toString() !== req.userId) {
      await Notification.create({
        recipient: gameLogDoc.user,
        sender: req.userId,
        type: parentCommentId ? "reply" : "comment",
        gameLog: id,
      });
    }

    res.status(201).json(populated);
  } catch {
    res.status(500).json({ message: "Failed to post comment" });
  }
});

// PATCH /api/gamelogs/:id — edit platform, status, rating, review
router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const log = await GameLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Game log not found" });
    if (log.user.toString() !== req.userId)
      return res.status(403).json({ message: "Not your log" });

    const { platform, status, rating, review } = req.body;
    if (platform !== undefined) log.platform = platform;
    if (status !== undefined) log.status = status;
    if (rating !== undefined) log.rating = rating;
    if (review !== undefined) {
      if (review !== log.review) (log as any).editedAt = new Date();
      log.review = review;
    }

    await log.save();
    res.json(log);
  } catch {
    res.status(500).json({ message: "Failed to update log" });
  }
});

// PATCH /api/gamelogs/:id/review — clears just the review text
router.patch("/:id/review", async (req: AuthRequest, res: Response) => {
  try {
    const log = await GameLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Game log not found" });
    if (log.user.toString() !== req.userId)
      return res.status(403).json({ message: "Not your log" });
    log.review = "";
    await log.save();
    await Comment.deleteMany({ gameLog: log._id }); 
    res.json({ message: "Review deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete review" });
  }
});

// Recursively deletes a comment and all its descendants
async function deleteCommentCascade(commentId: string) {
  const children = await Comment.find({ parentComment: commentId }).select("_id");
  if (children.length > 0) {
    // Has replies — tombstone instead of delete to preserve the thread
    await Comment.findByIdAndUpdate(commentId, {
      text: "[deleted]",
      author: null,
    });
  } else {
    // No replies — safe to hard delete
    await Comment.findByIdAndDelete(commentId);
    // Now check if the parent was itself a tombstone with no remaining children
    const comment = await Comment.findById(commentId); // won't exist, so fetch parent separately
  }
}

// DELETE /api/gamelogs/:id/comments/:commentId
router.delete("/:id/comments/:commentId", async (req: AuthRequest, res: Response) => {
  try {
    const comment = await Comment.findById(req.params.commentId as string);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    // Tombstoned comments have no author — treat as already deleted
    if (!comment.author || comment.author.toString() !== req.userId)
      return res.status(403).json({ message: "Not your comment" });

    const children = await Comment.find({ parentComment: comment._id }).select("_id");

    if (children.length > 0) {
      // Preserve thread — tombstone only
      await Comment.findByIdAndUpdate(comment._id, { text: "[deleted]", author: null });
      res.json({ message: "Comment deleted", tombstoned: true });
    } else {
      // Hard delete, then bubble up and clean any tombstoned ancestors that are now childless
      await Comment.findByIdAndDelete(comment._id);
      if (comment.parentComment) {
        await pruneAncestors(comment.parentComment.toString());
      }
      res.json({ message: "Comment deleted", tombstoned: false });
    }
  } catch {
    res.status(500).json({ message: "Failed to delete comment" });
  }
});

// Walk up the ancestor chain and hard-delete tombstones that no longer have children
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

// DELETE /api/gamelogs/:id
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const log = await GameLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Game log not found" });
    if (log.user.toString() !== req.userId)
      return res.status(403).json({ message: "Not your review" });
    await log.deleteOne();
    await User.findByIdAndUpdate(req.userId, { $pull: { gamesLogged: log._id } });
    await Comment.deleteMany({ gameLog: log._id });
    res.json({ message: "Review deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete review" });
  }
});

export default router;
