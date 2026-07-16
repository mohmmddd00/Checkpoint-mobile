import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { ReviewEngagement } from "../components/ReviewEngagement";
import { DeleteConfirmMenu } from "../components/DeleteConfirmMenu";
import { EditedTag } from "../components/EditedTag";
import { CommunityReviewsPageSkeleton } from "../LoadingScreens/CommunityReviewsPageSkeleton";
import { cpToast } from "../utils/toast";
import { storage } from "../utils/storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const STATIC_BASE_URL = API_URL!.replace(/\/api\/?$/, "");

function resolveAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${STATIC_BASE_URL}${path}`;
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface UserRef {
  _id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  username: string;
  profileImage: string;
}

interface CommunityReview {
  _id: string;
  user: UserRef;
  title: string;
  platform: string;
  status: string;
  rating: number;
  review: string;
  timestamp: string;
  editedAt?: string | null;
  coverImage: string | null;
  releasedDate: string | null;
}

// ─── USER AVATAR ──────────────────────────────────────────────────────────────

function UserAvatar({ user }: { user: UserRef }) {
  const avatarUrl = resolveAvatarUrl(user.profileImage);
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <View style={s.avatar}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={s.avatarImage} />
      ) : (
        <Text style={s.avatarInitials}>{initials}</Text>
      )}
    </View>
  );
}

// ─── COMMUNITY REVIEW CARD ────────────────────────────────────────────────────

function CommunityReviewCard({
  review,
  currentUserId,
  onDelete,
  onEdit,
}: {
  review: CommunityReview;
  currentUserId: string | null;
  onDelete: (id: string) => void;
  onEdit: (review: CommunityReview) => void;
}) {
  const isOwnReview = !!(currentUserId && review.user._id === currentUserId);
  const [expanded, setExpanded] = useState(false);
  const REVIEW_LIMIT = 300;
  const isLong = review.review.length > REVIEW_LIMIT;

  const formattedDate = review.releasedDate
    ? new Date(review.releasedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Release date unknown";

  const editedLabel = review.editedAt
    ? `edited ${new Date(review.editedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })}`
    : null;

  const handleDeleteReview = async () => {
    const token = await storage.getToken();
    const res = await fetch(`${API_URL}/gamelogs/${review._id}/review`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      cpToast.success("Review deleted.");
      onDelete(review._id);
    } else {
      cpToast.error("Failed to delete review.");
    }
  };

  return (
    <View style={s.card}>
      {/* ── USER HEADER ── */}
      <View style={s.cardHeader}>
        <View style={s.cardHeaderLeft}>
          <UserAvatar user={review.user} />
          <View style={s.cardHeaderText}>
            <Text style={s.cardHeaderName} numberOfLines={1}>
              {[review.user.firstName, review.user.middleName, review.user.lastName]
                .filter(Boolean)
                .join(" ")}
            </Text>
            <Text style={s.cardHeaderUsername} numberOfLines={1}>
              @{review.user.username}
            </Text>
          </View>
        </View>
        {isOwnReview && (
          <DeleteConfirmMenu
            onEdit={() => onEdit(review)}
            onDelete={handleDeleteReview}
            confirmMessage="Are you sure you want to delete this review?"
          />
        )}
      </View>

      {/* ── REVIEW BODY ── */}
      <View style={s.cardBody}>
        <View style={s.coverWrap}>
          {review.coverImage ? (
            <Image source={{ uri: review.coverImage }} style={s.coverImage} />
          ) : (
            <View style={s.coverFallback}>
              <Text style={{ fontSize: 36 }}>🎮</Text>
            </View>
          )}
        </View>

        <View style={s.textContent}>
          <View style={s.titleRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.gameTitle} numberOfLines={2}>
                {review.title}
              </Text>
              <View style={s.metaRow}>
                <Text style={s.metaDate}>{formattedDate}</Text>
                {editedLabel && <EditedTag label={editedLabel} />}
              </View>
            </View>
            <Text style={s.rating}>★ {review.rating}/10</Text>
          </View>

          <Text style={s.reviewText}>
            {isLong && !expanded
              ? review.review.slice(0, REVIEW_LIMIT).trimEnd() + "…"
              : review.review}
          </Text>

          {isLong && (
            <TouchableOpacity
              onPressIn={() => setExpanded((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={s.seeMoreBtn}>{expanded ? "See less" : "See more"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── ENGAGEMENT ── */}
      <View style={s.engagementWrap}>
        <ReviewEngagement gameLogId={review._id} />
      </View>
    </View>
  );
}

// ─── FEED (exported) ──────────────────────────────────────────────────────────

export function CommunityReviewsFeed() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const [reviews, setReviews] = useState<CommunityReview[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(16)).current;
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  const loadReviews = async () => {
    try {
      const token = await storage.getToken();
      const res = await fetch(`${API_URL}/gamelogs/public`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const logsData = await res.json();
      setReviews(logsData.filter((r: any) => r.user != null));
    } catch (err) {
      console.error("Failed to load community reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    if ((route.params as any)?.editedAt) {
      loadReviews();
    }
  }, [(route.params as any)?.editedAt]);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  useEffect(() => {
    storage.getToken().then((token) => {
      if (!token) return;
      try {
        const id = JSON.parse(atob(token.split(".")[1])).id ?? null;
        setResolvedUserId(id);
      } catch {}
    });
  }, []);

  const handleDelete = (id: string) => {
    setReviews((prev) => prev.filter((r) => r._id !== id));
  };

  const handleEdit = (review: CommunityReview) => {
    navigation.navigate("EditReview", {
      id: review._id,
      log: {
        _id: review._id,
        title: review.title,
        platform: review.platform,
        status: review.status,
        rating: review.rating,
        review: review.review,
        timestamp: review.timestamp,
        coverImage: review.coverImage,
        releasedDate: review.releasedDate,
      },
    });
  };

  if (loading) return <CommunityReviewsPageSkeleton />;

  if (reviews.length === 0) {
    return (
      <View style={s.emptyState}>
        <Text style={s.emptyText}>No community reviews yet.</Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: translateAnim }],
        gap: 24,
      }}
    >
      {reviews.map((review) => (
        <CommunityReviewCard
          key={review._id}
          review={review}
          currentUserId={resolvedUserId}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      ))}
    </Animated.View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    color: "#8A6D73",
    fontSize: 14,
  },

  // Card
  card: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 16,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1A050B",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  cardHeaderName: {
    color: "#F7F4F5",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cardHeaderUsername: {
    color: "#5C1222",
    fontSize: 13,
    fontStyle: "italic",
    letterSpacing: 0.3,
    marginTop: 1,
  },

  // Avatar
  avatar: {
    width: 42,
    height: 42,
    minWidth: 42,
    borderRadius: 21,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#380B14",
    backgroundColor: "#9E1B32",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitials: {
    color: "#F7F4F5",
    fontSize: 14,
    fontWeight: "800",
  },

  // Body
  cardBody: {
    padding: 16,
    flexDirection: "row",
    gap: 14,
  },
  coverWrap: {
    width: 90,
    aspectRatio: 2 / 3,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "#160408",
    flexShrink: 0,
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  coverFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textContent: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  gameTitle: {
    color: "#F7F4F5",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
  },
  metaDate: {
    color: "#8A6D73",
    fontSize: 11,
  },
  rating: {
    color: "#9E1B32",
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 0,
  },
  reviewText: {
    color: "#C2A8AE",
    fontSize: 13,
    lineHeight: 22,
    marginTop: 12,
  },
  seeMoreBtn: {
    color: "#9E1B32",
    fontSize: 13,
    fontWeight: "700",
    paddingTop: 6,
  },

  // Engagement
  engagementWrap: {
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#1A050B",
  },
});