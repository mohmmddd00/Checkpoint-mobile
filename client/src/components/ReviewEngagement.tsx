import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { Svg, Path, Polyline } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cpToast } from "../utils/toast";
import { DeleteConfirmMenu } from "./DeleteConfirmMenu";

import type { InitialEngagement } from "../utils/engagementTypes";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

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

// ── SVG Icons ────────────────────────────────────────────────────────────────

function ThumbUpIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </Svg>
  );
}

function ThumbDownIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </Svg>
  );
}

function CommentIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

function HeartIcon({ color, filled }: { color: string; filled: boolean }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Svg>
  );
}

function ChevronIcon({ rotated }: { rotated: boolean }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#5A4048" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: [{ rotate: rotated ? "180deg" : "0deg" }] }}>
      <Polyline points="6 9 12 15 18 9" />
    </Svg>
  );
}

// ── CommentNode ──────────────────────────────────────────────────────────────

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

  const isOwnComment = !!currentUserId && localComment.author?._id === currentUserId;
  const userLiked = !!currentUserId && (localComment.likes ?? []).includes(currentUserId);
  const likeCount = (localComment.likes ?? []).length;

  const handleLike = async () => {
    if (isOwnComment || localComment.text === "[deleted]") return;
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
    setShowReplies((v) => !v);
    if (!repliesLoaded) {
      fetch(`${API_URL}/gamelogs/${gameLogId}/comments/${comment._id}/replies`, { headers: authHeaders })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
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
    let username = "you", firstName = "", lastName = "";
    try {
      const token = await AsyncStorage.getItem("token");
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
      author: { _id: currentUserId ?? "", username, firstName, lastName },
      likes: [],
    };

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
        setReplies((r) => r.map((rep) => (rep._id === tempId ? created : rep)));
      } else {
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

  const isDeleted = localComment.text === "[deleted]";

  return (
    <View style={[s.nodeWrap, depth > 0 && s.nodeIndent]}>
      <View style={s.commentCard}>
        {/* Header */}
        <View style={s.commentHeader}>
          <Text style={s.commentAuthor} numberOfLines={1}>
            @{localComment.author?.username || "unknown"}
          </Text>
          <View style={s.commentHeaderRight}>
            {/* Heart like */}
            {!isDeleted && (
              <TouchableOpacity
                onPress={handleLike}
                disabled={isOwnComment}
                style={s.likeBtn}
              >
                <HeartIcon
                  color={userLiked ? "#9E1B32" : "#5A4048"}
                  filled={userLiked}
                />
                {likeCount > 0 && (
                  <Text style={[s.likeBtnText, userLiked && s.likeBtnTextActive]}>
                    {likeCount}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <Text style={s.commentDate}>
              {new Date(localComment.createdAt).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric",
              })}
            </Text>

            {currentUserId && localComment.author?._id === currentUserId && (
              <DeleteConfirmMenu
                onDelete={async () => {
                  const res = await fetch(
                    `${API_URL}/gamelogs/${gameLogId}/comments/${comment._id}`,
                    { method: "DELETE", headers: authHeaders }
                  );
                  if (res.ok) {
                    const data = await res.json();
                    if (data.tombstoned) {
                      setLocalComment((c) => ({
                        ...c,
                        text: "[deleted]",
                        author: { ...c.author, _id: "", username: "deleted", firstName: "", lastName: "" },
                      }));
                    } else {
                      onDeleted(comment._id);
                    }
                    cpToast.success("Comment deleted.");
                  } else {
                    cpToast.error("Failed to delete comment.");
                  }
                }}
                // cancelMessage="Comment not deleted."
              />
            )}
          </View>
        </View>

        {/* Text */}
        <Text style={[s.commentText, isDeleted && s.commentTextDeleted]}>
          {localComment.text}
        </Text>

        {/* Action row */}
        <View style={s.actionRow}>
          {!isDeleted && (
            <TouchableOpacity
              onPress={() => setShowReplyBox((v) => !v)}
              style={s.actionBtn}
            >
              <Text style={s.actionBtnText}>↩ Reply</Text>
            </TouchableOpacity>
          )}

          {replyCount !== null && replyCount > 0 && (
            <TouchableOpacity onPress={handleToggleReplies} style={s.actionBtn}>
              <ChevronIcon rotated={showReplies} />
              <Text style={s.actionBtnText}>
                {showReplies ? "Hide" : "Show"} {replyCount}{" "}
                {replyCount === 1 ? "reply" : "replies"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reply box */}
        {showReplyBox && (
          <View style={s.replyBox}>
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder={`Reply to @${
                (localComment.author?.username ?? "").length > 20
                  ? localComment.author.username.slice(0, 20) + "…"
                  : (localComment.author?.username ?? "")
              }...`}
              placeholderTextColor="#5A4048"
              style={s.replyInput}
              multiline
              autoFocus
            />
            <TouchableOpacity
              onPress={handlePostReply}
              disabled={posting || !replyText.trim()}
              style={[s.replyPostBtn, (posting || !replyText.trim()) && s.btnDisabled]}
            >
              <Text style={s.replyPostBtnText}>Post</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Nested replies */}
      {showReplies && repliesLoaded && (
        <View style={{ marginBottom: 8 }}>
          {replies.map((reply) => (
            <CommentNode
              key={reply._id}
              comment={reply}
              gameLogId={gameLogId}
              authHeaders={authHeaders}
              currentUserId={currentUserId}
              depth={depth + 1}
              onDeleted={(deletedId) => {
                setReplies((r) => r.filter((c) => c._id !== deletedId));
                setReplyCount((c) => Math.max(0, (c ?? 1) - 1));
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ── ReviewEngagement ─────────────────────────────────────────────────────────

interface ReviewEngagementProps {
  gameLogId: string;
  initialEngagement?: InitialEngagement;
}

export function ReviewEngagement({ gameLogId, initialEngagement }: ReviewEngagementProps) {
  const [reactions, setReactions] = useState<ReactionState>({
    likes: initialEngagement?.likes ?? 0,
    dislikes: initialEngagement?.dislikes ?? 0,
    userReaction: initialEngagement?.userReaction ?? null,
    isOwnLog: initialEngagement?.isOwnLog ?? false,
  });
  const [commentCount, setCommentCount] = useState(initialEngagement?.commentCount ?? 0);
  const [comments, setComments] = useState<CommentEntry[]>([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);

  const [token, setToken] = useState<string | null>(null);
  const [authHeaders, setAuthHeaders] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("token").then((t) => {
      if (!t) return;
      setToken(t);
      setAuthHeaders({ Authorization: `Bearer ${t}` });
      try {
        setCurrentUserId(JSON.parse(atob(t.split(".")[1])).id ?? null);
      } catch {}
    });
  }, []);

  useEffect(() => {
    if (!authHeaders.Authorization) return;
    const load = async () => {
      try {
        const [reactionsRes, commentsRes] = await Promise.all([
          fetch(`${API_URL}/gamelogs/${gameLogId}/reactions`, { headers: authHeaders }),
          fetch(`${API_URL}/gamelogs/${gameLogId}/comments`, { headers: authHeaders }),
        ]);
        if (reactionsRes.ok && !initialEngagement) setReactions(await reactionsRes.json());
        if (commentsRes.ok) {
          const fetched: CommentEntry[] = await commentsRes.json();
          setComments(fetched);
          setCommentCount(fetched.length);
        }
      } catch (err) {
        console.error("Failed to load engagement data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [gameLogId, authHeaders.Authorization]);

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
      const res = await fetch(`${API_URL}/gamelogs/${gameLogId}/${type}`, {
        method: "POST", headers: authHeaders,
      });
      if (res.ok) setReactions(await res.json());
      else setReactions(prev);
    } catch { setReactions(prev); }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    let username = "you", firstName = "", lastName = "";
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
      author: { _id: currentUserId ?? "", username, firstName, lastName },
      likes: [],
    };

    setComments((c) => [optimisticComment, ...c]);
    setCommentCount((n) => n + 1);
    setNewComment("");
    Keyboard.dismiss();
    setPosting(true);

    try {
      const res = await fetch(`${API_URL}/gamelogs/${gameLogId}/comments`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ text: optimisticComment.text }),
      });
      if (res.ok) {
        const created = await res.json();
        setComments((c) => c.map((cm) => (cm._id === tempId ? created : cm)));
      } else {
        setComments((c) => c.filter((cm) => cm._id !== tempId));
        setCommentCount((n) => Math.max(0, n - 1));
        cpToast.error("Failed to post comment.");
      }
    } catch {
      setComments((c) => c.filter((cm) => cm._id !== tempId));
      setCommentCount((n) => Math.max(0, n - 1));
      cpToast.error("Failed to post comment.");
    } finally {
      setPosting(false);
    }
  };

  const likeColor = reactions.userReaction === "like" ? "#FFFFFF" : "#E6A1B0";
  const dislikeColor = reactions.userReaction === "dislike" ? "#FFFFFF" : "#8A6D73";
  const commentColor = showComments ? "#E6A1B0" : "#8A6D73";

  return (
    <View>
      {/* ── Reaction bar ── */}
      <View style={[s.reactionBar, showComments && { marginBottom: 32 }]}>
        <TouchableOpacity
          onPress={() => handleReaction("like")}
          disabled={reactions.isOwnLog}
          style={[s.reactionBtn, s.reactionBtnLike, reactions.userReaction === "like" && s.reactionBtnLikeActive]}
        >
          <ThumbUpIcon color={likeColor} />
          <Text style={[s.reactionBtnText, { color: likeColor }]}>{reactions.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleReaction("dislike")}
          disabled={reactions.isOwnLog}
          style={[s.reactionBtn, s.reactionBtnDislike, reactions.userReaction === "dislike" && s.reactionBtnDislikeActive]}
        >
          <ThumbDownIcon color={dislikeColor} />
          <Text style={[s.reactionBtnText, { color: dislikeColor }]}>{reactions.dislikes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowComments((v) => !v)}
          style={[s.reactionBtn, s.reactionBtnComment, showComments && s.reactionBtnCommentActive]}
        >
          <CommentIcon color={commentColor} />
          <Text style={[s.reactionBtnText, { color: commentColor }]}>{commentCount}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Comments ── */}
      {showComments && (
        <View>
          <Text style={s.commentsHeading}>Comments</Text>

          {/* New comment box */}
          <View style={s.newCommentRow}>
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              placeholderTextColor="#5A4048"
              style={s.commentInput}
              multiline
            />
            <TouchableOpacity
              onPress={handlePostComment}
              disabled={posting || !newComment.trim()}
              style={[s.postBtn, (posting || !newComment.trim()) && s.btnDisabled]}
            >
              <Text style={s.postBtnText}>Post</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={s.centeredMsg}>
              <ActivityIndicator color="#8A6D73" />
            </View>
          ) : comments.length === 0 ? (
            <View style={s.centeredMsg}>
              <Text style={s.centeredMsgText}>
                No comments yet. Be the first to say something.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              {comments.map((c) => (
                <CommentNode
                  key={c._id}
                  comment={c}
                  gameLogId={gameLogId}
                  authHeaders={authHeaders}
                  currentUserId={currentUserId}
                  depth={0}
                  onDeleted={(deletedId) =>
                    setComments((prev) => prev.filter((cm) => cm._id !== deletedId))
                  }
                />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Reaction bar
  reactionBar: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 12,
  },
  reactionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  reactionBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  reactionBtnLike: {
    backgroundColor: "rgba(158,27,50,0.12)",
    borderColor: "rgba(158,27,50,0.4)",
  },
  reactionBtnLikeActive: {
    backgroundColor: "#9E1B32",
  },
  reactionBtnDislike: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  reactionBtnDislikeActive: {
    backgroundColor: "#380B14",
  },
  reactionBtnComment: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  reactionBtnCommentActive: {
    backgroundColor: "rgba(158,27,50,0.12)",
    borderColor: "rgba(158,27,50,0.4)",
  },

  // Comments section
  commentsHeading: {
    fontSize: 11,
    color: "#A28389",
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
    paddingBottom: 10,
    marginBottom: 20,
    fontWeight: "600",
  },
  newCommentRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    color: "#F7F4F5",
    fontSize: 13,
    lineHeight: 20,
    minHeight: 42,
  },
  postBtn: {
    backgroundColor: "rgba(158,27,50,0.15)",
    borderWidth: 1,
    borderColor: "rgba(158,27,50,0.4)",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  postBtnText: {
    color: "#E6A1B0",
    fontSize: 13,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  centeredMsg: {
    paddingVertical: 30,
    alignItems: "center",
  },
  centeredMsgText: {
    color: "#8A6D73",
    fontSize: 13,
    textAlign: "center",
  },

  // Comment node
  nodeWrap: {
    marginBottom: 0,
  },
  nodeIndent: {
    marginLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: "#1E060A",
    paddingLeft: 12,
  },
  commentCard: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  commentAuthor: {
    color: "#F7F4F5",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    minWidth: 0,
  },
  commentHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
    marginLeft: 12,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 2,
  },
  likeBtnText: {
    color: "#5A4048",
    fontSize: 11,
    fontWeight: "600",
  },
  likeBtnTextActive: {
    color: "#9E1B32",
  },
  commentDate: {
    color: "#8A6D73",
    fontSize: 11,
  },
  commentText: {
    color: "#C2A8AE",
    fontSize: 13,
    lineHeight: 20,
  },
  commentTextDeleted: {
    color: "#5A4048",
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    alignItems: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  actionBtnText: {
    color: "#5A4048",
    fontSize: 11,
    fontWeight: "600",
  },
  replyBox: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    alignItems: "flex-start",
  },
  replyInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: "#F7F4F5",
    fontSize: 12,
    lineHeight: 18,
    minHeight: 36,
  },
  replyPostBtn: {
    backgroundColor: "rgba(158,27,50,0.15)",
    borderWidth: 1,
    borderColor: "rgba(158,27,50,0.4)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  replyPostBtnText: {
    color: "#E6A1B0",
    fontSize: 12,
    fontWeight: "700",
  },
});