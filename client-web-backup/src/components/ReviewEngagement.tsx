import { useState, useEffect, useRef } from "react";
import { cpToast } from "../utils/toast";
import { DeleteConfirmMenu } from "./DeleteConfirmMenu";

const API_URL = import.meta.env.VITE_API_URL;

interface CommentEntry {
  _id: string;
  text: string;
  createdAt: string;
  author: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  likes: string[];
}

interface ReactionState {
  likes: number;
  dislikes: number;
  userReaction: "like" | "dislike" | null;
  isOwnLog: boolean;
}

interface ReviewEngagementProps {
  gameLogId: string;
}

// ── Shared reply-box style helpers ──────────────────────────────────────────
const replyButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: "2px 6px",
  fontSize: "11px",
  fontWeight: 600,
  color: "#5A4048",
  cursor: "pointer",
  borderRadius: "4px",
  transition: "color 0.15s ease, background 0.15s ease",
};

const showRepliesButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: "4px 0 0 0",
  fontSize: "11px",
  fontWeight: 600,
  color: "#5A4048",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  transition: "color 0.15s ease",
};

// ── Recursive comment node ───────────────────────────────────────────────────
interface CommentNodeProps {
  comment: CommentEntry;
  gameLogId: string;
  authHeaders: Record<string, string>;
  currentUserId: string | null;
  depth: number;
  onDeleted: (id: string) => void;
}

function CommentNode({ comment, gameLogId, authHeaders, currentUserId, depth, onDeleted }: CommentNodeProps) {
  const [localComment, setLocalComment] = useState<CommentEntry>(comment);
  const [replies, setReplies] = useState<CommentEntry[]>([]);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyCount, setReplyCount] = useState<number | null>(null);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);
  const [hoverReply, setHoverReply] = useState(false);
  const [hoverShowReplies, setHoverShowReplies] = useState(false);
  const [hoverLike, setHoverLike] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const isOwnComment = !!currentUserId && localComment.author?._id === currentUserId;
  const userLiked = !!currentUserId && (localComment.likes ?? []).includes(currentUserId);
  const likeCount = (localComment.likes ?? []).length;

  const handleLike = async () => {
    if (isOwnComment || localComment.text === "[deleted]") return;
    // optimistic update
    const wasLiked = userLiked;
    setLocalComment((c) => ({
      ...c,
      likes: wasLiked
        ? (c.likes ?? []).filter((id) => id !== currentUserId)
        : [...(c.likes ?? []), currentUserId!],
    }));
    try {
      const res = await fetch(`${API_URL}/gamelogs/${gameLogId}/comments/${localComment._id}/like`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!res.ok) {
        // revert on failure
        setLocalComment((c) => ({
          ...c,
          likes: wasLiked
            ? [...(c.likes ?? []), currentUserId!]
            : (c.likes ?? []).filter((id) => id !== currentUserId),
        }));
      }
    } catch {
      setLocalComment((c) => ({
        ...c,
        likes: wasLiked
          ? [...(c.likes ?? []), currentUserId!]
          : (c.likes ?? []).filter((id) => id !== currentUserId),
      }));
    }
  };

  // Fetch reply count on mount (lightweight — just to show the "Show replies" label)
  useEffect(() => {
    fetch(`${API_URL}/gamelogs/${gameLogId}/comments/${comment._id}/replies`, { headers: authHeaders })
      .then((r) => r.json())
      .then((data: CommentEntry[]) => {
        setReplyCount(data.length);
        if (repliesLoaded) setReplies(data);
      })
      .catch(() => {});
  }, [comment._id]);

  const handleToggleReplies = () => {
    // Show/hide immediately — no waiting
    setShowReplies((v) => !v);
    // Only fetch if we haven't loaded yet
    if (!repliesLoaded) {
      fetch(`${API_URL}/gamelogs/${gameLogId}/comments/${comment._id}/replies`, { headers: authHeaders })
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then((data: CommentEntry[]) => {
          setReplies(data);
          setReplyCount(data.length);
          setRepliesLoaded(true);
        })
        .catch(() => {});
    }
  };

  const handlePostReply = async () => {
    if (!replyText.trim()) return;

    // Grab username from token for the optimistic reply
    let username = "you";
    let firstName = "";
    let lastName = "";
    try {
      const token = localStorage.getItem("token");
      const payload = JSON.parse(atob(token!.split(".")[1]));
      username = payload.username ?? "you";
      firstName = payload.firstName ?? "";
      lastName = payload.lastName ?? "";
    } catch {}

    const tempId = `temp-${Date.now()}`;
    const optimisticReply: CommentEntry = {
      _id: tempId,
      text: replyText.trim(),
      createdAt: new Date().toISOString(),
      author: {
        _id: currentUserId ?? "",
        username,
        firstName,
        lastName,
      },
      likes: [],
    };

    // Show immediately
    setReplies((r) => [...r, optimisticReply]);
    setReplyCount((c) => (c ?? 0) + 1);
    setRepliesLoaded(true);
    setShowReplies(true);
    setReplyText("");
    setShowReplyBox(false);
    setPosting(true);

    try {
      const res = await fetch(`${API_URL}/gamelogs/${gameLogId}/comments`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ text: optimisticReply.text, parentCommentId: comment._id }),
      });
      if (res.ok) {
        const created: CommentEntry = await res.json();
        // Swap temp reply for real one
        setReplies((r) => r.map((rep) => rep._id === tempId ? created : rep));
      } else {
        // Roll back
        setReplies((r) => r.filter((rep) => rep._id !== tempId));
        setReplyCount((c) => Math.max(0, (c ?? 1) - 1));
      }
    } catch {
      setReplies((r) => r.filter((rep) => rep._id !== tempId));
      setReplyCount((c) => Math.max(0, (c ?? 1) - 1));
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteReply = (id: string) => {
    setReplies((r) => r.filter((c) => c._id !== id));
    setReplyCount((c) => Math.max(0, (c ?? 1) - 1));
  };

  const indentLeft = depth > 0 ? 16 : 0;

  return (
    <div style={{ marginLeft: `${indentLeft}px`, borderLeft: depth > 0 ? "2px solid #1E060A" : "none", paddingLeft: depth > 0 ? "12px" : "0" }}>
      <div
        style={{
          background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
          border: "1px solid #28070F",
          borderRadius: "10px",
          padding: "14px 16px",
          marginBottom: "8px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
          <span style={{ color: "#F7F4F5", fontSize: "13px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, maxWidth: "300px", display: "block" }}>
            @{localComment.author?.username || "unknown"}
          </span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0, marginLeft: "12px" }}>

            {/* Heart like button */}
            {localComment.text !== "[deleted]" && (
              <button
                onClick={handleLike}
                onMouseEnter={() => !isOwnComment && setHoverLike(true)}
                onMouseLeave={() => setHoverLike(false)}
                title={isOwnComment ? "You can't like your own comment" : userLiked ? "Unlike" : "Like"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "none",
                  border: "none",
                  padding: "2px 4px",
                  cursor: isOwnComment ? "default" : "pointer",
                  color: userLiked ? "#9E1B32" : hoverLike ? "#E6A1B0" : "#5A4048",
                  fontSize: "11px",
                  fontWeight: 600,
                  transition: "color 0.15s ease",
                  opacity: 1,
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill={userLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transition: "fill 0.15s ease, transform 0.15s ease", transform: userLiked ? "scale(1.15)" : "scale(1)" }}
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {likeCount > 0 && likeCount}
              </button>
            )}

            <span style={{ color: "#8A6D73", fontSize: "11px" }}>
              {new Date(localComment.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </span>
            {currentUserId && localComment.author?._id === currentUserId && (
              <DeleteConfirmMenu
                onDelete={async () => {
                  const res = await fetch(`${API_URL}/gamelogs/${gameLogId}/comments/${comment._id}`, {
                    method: "DELETE",
                    headers: authHeaders,
                  });
                  if (res.ok) {
                    const data = await res.json();
                    if (data.tombstoned) {
                      // Has replies — show as [deleted] in place
                      setLocalComment((c) => ({ ...c, text: "[deleted]", author: { ...c.author, _id: "", username: "deleted", firstName: "", lastName: "" } }));
                    } else {
                      // Leaf comment — remove it entirely
                      onDeleted(comment._id);
                    }
                    cpToast.success("Comment deleted.");
                  } else {
                    cpToast.error("Failed to delete comment.");
                  }
                }}
                cancelMessage="Comment not deleted."
              />
            )}
          </div>
        </div>

        {/* Text */}
        <p style={{
          color: localComment.text === "[deleted]" ? "#5A4048" : "#C2A8AE",
          fontSize: "13px", lineHeight: 1.5, margin: 0, wordBreak: "break-word",
          fontStyle: localComment.text === "[deleted]" ? "italic" : "normal",
        }}>
          {localComment.text}
        </p>

        {/* Action row */}
          <div style={{ display: "flex", gap: "8px", marginTop: "10px", alignItems: "center" }}>
            {/* Reply button — hidden on tombstoned comments */}
            {localComment.text !== "[deleted]" && <button
            style={{
              ...replyButtonStyle,
              color: hoverReply ? "#E6A1B0" : "#5A4048",
              background: hoverReply ? "rgba(158, 27, 50, 0.12)" : "none",
            }}
            onMouseEnter={() => setHoverReply(true)}
            onMouseLeave={() => setHoverReply(false)}
            onClick={() => {
              setShowReplyBox((v) => !v);
              setTimeout(() => replyTextareaRef.current?.focus(), 50);
            }}
          >
            ↩ Reply
          </button>}

          {/* Show/hide replies */}
          {(replyCount !== null && replyCount > 0) && (
            <button
              style={{
                ...showRepliesButtonStyle,
                color: hoverShowReplies ? "#E6A1B0" : "#5A4048",
              }}
              onMouseEnter={() => setHoverShowReplies(true)}
              onMouseLeave={() => setHoverShowReplies(false)}
              onClick={handleToggleReplies}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: showReplies ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
              {showReplies ? "Hide" : "Show"} {replyCount} {replyCount === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>

        {/* Inline reply box */}
        {showReplyBox && (
          <div style={{ display: "flex", gap: "10px", marginTop: "12px", alignItems: "flex-start" }}>
            <textarea
              ref={replyTextareaRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePostReply(); }
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
              placeholder={`Reply to @${(localComment.author?.username ?? "").length > 20 ? (localComment.author.username.slice(0, 20) + "…") : (localComment.author?.username ?? "")}...`}
              rows={1}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid #28070F",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "#F7F4F5",
                fontSize: "12px",
                outline: "none",
                resize: "none",
                fontFamily: "inherit",
                lineHeight: "1.5",
                overflow: "hidden",
              }}
            />
            <button
              onClick={handlePostReply}
              disabled={posting || !replyText.trim()}
              style={{
                background: "rgba(158, 27, 50, 0.15)",
                border: "1px solid rgba(158, 27, 50, 0.4)",
                borderRadius: "8px",
                padding: "8px 14px",
                color: "#E6A1B0",
                fontSize: "12px",
                fontWeight: 700,
                cursor: posting || !replyText.trim() ? "default" : "pointer",
                opacity: posting || !replyText.trim() ? 0.5 : 1,
                whiteSpace: "nowrap",
              }}
            >
              Post
            </button>
          </div>
        )}
      </div>

      {/* Nested replies */}
      {showReplies && repliesLoaded && (
        <div style={{ marginBottom: "8px" }}>
          {replies.map((reply) => (
            <CommentNode
              key={reply._id}
              comment={reply}
              gameLogId={gameLogId}
              authHeaders={authHeaders}
              currentUserId={currentUserId}
              depth={depth + 1}
              onDeleted={(deletedId) => handleDeleteReply(deletedId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ReviewEngagement({ gameLogId }: ReviewEngagementProps) {
  const [reactions, setReactions] = useState<ReactionState>({ likes: 0, dislikes: 0, userReaction: null, isOwnLog: false });
  const [comments, setComments] = useState<CommentEntry[]>([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const token = localStorage.getItem("token");
  const authHeaders = { Authorization: `Bearer ${token}` };

  const currentUserId: string | null = (() => {
    try {
      if (!token) return null;
      return JSON.parse(atob(token.split(".")[1])).id ?? null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    const load = async () => {
      try {
        const [reactionsRes, commentsRes] = await Promise.all([
          fetch(`${API_URL}/gamelogs/${gameLogId}/reactions`, { headers: authHeaders }),
          fetch(`${API_URL}/gamelogs/${gameLogId}/comments`, { headers: authHeaders }),
        ]);
        if (reactionsRes.ok) setReactions(await reactionsRes.json());
        if (commentsRes.ok) setComments(await commentsRes.json());
      } catch (err) {
        console.error("Failed to load engagement data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [gameLogId]);

  const handleReaction = async (type: "like" | "dislike") => {
    if (reactions.isOwnLog) return;
    const prev = reactions;
    const wasActive = reactions.userReaction === type;
    setReactions((r) => {
      let { likes, dislikes, userReaction } = r;
      if (userReaction === "like") likes -= 1;
      if (userReaction === "dislike") dislikes -= 1;
      if (wasActive) { userReaction = null; }
      else {
        if (type === "like") likes += 1;
        if (type === "dislike") dislikes += 1;
        userReaction = type;
      }
      return { likes, dislikes, userReaction, isOwnLog: r.isOwnLog };
    });
    try {
      const res = await fetch(`${API_URL}/gamelogs/${gameLogId}/${type}`, { method: "POST", headers: authHeaders });
      if (res.ok) setReactions(await res.json());
      else setReactions(prev);
    } catch { setReactions(prev); }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    // Grab username from token for the optimistic comment
    let username = "you";
    let firstName = "";
    let lastName = "";
    try {
      const payload = JSON.parse(atob(token!.split(".")[1]));
      username = payload.username ?? "you";
      firstName = payload.firstName ?? "";
      lastName = payload.lastName ?? "";
    } catch {}

    const tempId = `temp-${Date.now()}`;
    const optimisticComment: CommentEntry = {
      _id: tempId,
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
      author: {
        _id: currentUserId ?? "",
        username,
        firstName,
        lastName,
      },
      likes: [],
    };

    // Show immediately
    setComments((c) => [optimisticComment, ...c]);
    setNewComment("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setPosting(true);

    try {
      const res = await fetch(`${API_URL}/gamelogs/${gameLogId}/comments`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ text: optimisticComment.text }),
      });
      if (res.ok) {
        const created = await res.json();
        // Swap the temp comment out for the real one from the server
        setComments((c) => c.map((cm) => cm._id === tempId ? created : cm));
      } else {
        // Roll back on failure
        setComments((c) => c.filter((cm) => cm._id !== tempId));
        cpToast.error("Failed to post comment.");
      }
    } catch {
      setComments((c) => c.filter((cm) => cm._id !== tempId));
      cpToast.error("Failed to post comment.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div>
      {/* ── LIKE / DISLIKE / COMMENT BAR ── */}
      <div style={{ display: "flex", justifyContent: "flex-start", gap: "12px", marginBottom: showComments ? "32px" : "0" }}>
        <button
          onClick={() => handleReaction("like")}
          disabled={reactions.isOwnLog}
          title={reactions.isOwnLog ? "You can't react to your own review" : undefined}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: reactions.userReaction === "like" ? "#9E1B32" : "rgba(158, 27, 50, 0.12)",
            border: "1px solid rgba(158, 27, 50, 0.4)", borderRadius: "20px", padding: "8px 16px",
            color: reactions.userReaction === "like" ? "#FFFFFF" : "#E6A1B0",
            fontSize: "13px", fontWeight: 700,
            cursor: reactions.isOwnLog ? "default" : "pointer", transition: "all 0.15s ease",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
          {reactions.likes}
        </button>

        <button
          onClick={() => handleReaction("dislike")}
          disabled={reactions.isOwnLog}
          title={reactions.isOwnLog ? "You can't react to your own review" : undefined}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: reactions.userReaction === "dislike" ? "#380B14" : "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "8px 16px",
            color: reactions.userReaction === "dislike" ? "#FFFFFF" : "#8A6D73",
            fontSize: "13px", fontWeight: 700,
            cursor: reactions.isOwnLog ? "default" : "pointer", transition: "all 0.15s ease",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
          </svg>
          {reactions.dislikes}
        </button>

        <button
          onClick={() => setShowComments((v) => !v)}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: showComments ? "rgba(158, 27, 50, 0.12)" : "rgba(255,255,255,0.04)",
            border: showComments ? "1px solid rgba(158, 27, 50, 0.4)" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: "20px", padding: "8px 16px",
            color: showComments ? "#E6A1B0" : "#8A6D73",
            fontSize: "13px", fontWeight: 700, cursor: "pointer", transition: "all 0.15s ease",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {comments.length}
        </button>
      </div>

      {/* ── COMMENTS ── */}
      {showComments && (
        <div>
          <h2 style={{ fontSize: "11px", color: "#A28389", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #28070F", paddingBottom: "10px", marginBottom: "20px", fontWeight: 600 }}>
            Comments
          </h2>

          {/* New top-level comment box */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px", alignItems: "flex-start" }}>
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
              placeholder="Add a comment..."
              rows={1}
              style={{
                flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid #28070F",
                borderRadius: "8px", padding: "10px 14px", color: "#F7F4F5", fontSize: "13px",
                outline: "none", resize: "none", fontFamily: "inherit", lineHeight: "1.5",
                overflow: "hidden", wordBreak: "break-word",
              }}
              onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }}
            />
            <button
              onClick={handlePostComment}
              disabled={posting || !newComment.trim()}
              style={{
                background: "rgba(158, 27, 50, 0.15)", border: "1px solid rgba(158, 27, 50, 0.4)",
                borderRadius: "8px", padding: "10px 18px", color: "#E6A1B0", fontSize: "13px", fontWeight: 700,
                cursor: posting || !newComment.trim() ? "default" : "pointer",
                opacity: posting || !newComment.trim() ? 0.5 : 1,
              }}
            >
              Post
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#8A6D73" }}>Loading comments...</div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#8A6D73" }}>
              No comments yet. Be the first to say something.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {comments.map((c) => (
                <CommentNode
                  key={c._id}
                  comment={c}
                  gameLogId={gameLogId}
                  authHeaders={authHeaders}
                  currentUserId={currentUserId}
                  depth={0}
                  onDeleted={(deletedId) => setComments((prev) => prev.filter((cm) => cm._id !== deletedId))}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}