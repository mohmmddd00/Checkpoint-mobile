import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { DashboardLayout } from "../components/DashboardLayout";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../App";
import { AllUserReviewsSkeleton } from "../LoadingScreens/AllUserReviewsSkeleton";
import { useFadeUp } from "../hooks/useFadeUp";
import { EditedTag } from "../components/EditedTag";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface GameLog {
  _id: string;
  title: string;
  platform: string;
  status: string;
  rating: number;
  review: string;
  timestamp: string;
  editedAt?: string | null;
  coverImage?: string | null;
  releasedDate?: string | null;
}

// ─── REVIEW CARD ──────────────────────────────────────────────────────────────

function ReviewCard({ log }: { log: GameLog }) {
  const navigation = useNavigation<Nav>();
  const [pressed, setPressed] = useState(false);

  const formattedDate = log.releasedDate
    ? new Date(log.releasedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Release date unknown";

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => navigation.navigate("Review", { id: log._id, log })}
      style={[s.card, pressed && s.cardPressed]}
    >
      {/* Cover image */}
      <View style={s.coverWrap}>
        {log.coverImage ? (
          <Image
            source={{ uri: log.coverImage }}
            style={s.coverImg}
            resizeMode="cover"
          />
        ) : (
          <View style={s.coverFallback}>
            <Text style={s.coverEmoji}>🎮</Text>
          </View>
        )}
      </View>

      {/* Text content */}
      <View style={s.cardBody}>
        {/* Top row: title + rating */}
        <View style={s.cardTopRow}>
          <View style={s.cardTitleWrap}>
            <Text style={[s.cardTitle, pressed && s.cardTitlePressed]} numberOfLines={1}>
              {log.title}
            </Text>
            <View style={s.cardMeta}>
              <Text style={s.cardDate}>{formattedDate}</Text>
              <EditedTag editedAt={log.editedAt} />
            </View>
          </View>
          <Text style={s.cardRating}>★ {log.rating}/10</Text>
        </View>

        {/* Review excerpt */}
        <Text style={s.cardReview} numberOfLines={4}>
          {log.review.length > 150
            ? log.review.slice(0, 150).trimEnd() + "…"
            : log.review}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── SCREEN ───────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 10;

function ReviewsContent({
  reviews,
  totalReviews,
  loadingMore,
  hasMore,
  spinAnim,
  onEndReached,
}: {
  reviews: GameLog[];
  totalReviews: number;
  loadingMore: boolean;
  hasMore: boolean;
  spinAnim: Animated.Value;
  onEndReached: () => void;
}) {
  const navigation = useNavigation<Nav>();
  const { opacity, translateY } = useFadeUp();

  return (
    <View style={s.root}>
      <Animated.View style={[{ opacity, transform: [{ translateY }] }, { flex: 1 }]}>
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          contentContainerStyle={s.listContent}
          ListHeaderComponent={
            <>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={s.backBtn}
              >
                <Text style={s.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <Text style={s.heading}>All your reviews</Text>
              <Text style={s.subheading}>
                {totalReviews === 0
                  ? "You haven't written any reviews yet."
                  : `${totalReviews} review${totalReviews === 1 ? "" : "s"}`}
              </Text>
              <View style={s.divider} />
            </>
          }
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={s.emptyText}>
                Head over to your logs and add a review to a game.
              </Text>
            </View>
          }
          renderItem={({ item }) => <ReviewCard log={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={s.spinnerWrap}>
                <Animated.View
                  style={[s.spinner, {
                    transform: [{
                      rotate: spinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    }],
                  }]}
                />
              </View>
            ) : !hasMore && reviews.length > 0 ? (
              <Text style={s.endText}>All {totalReviews} reviews loaded</Text>
            ) : null
          }
        />
      </Animated.View>
    </View>
  );
}

export function AllUserReviewsScreen() {
  const [reviews, setReviews] = useState<GameLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);
  const isFetchingRef = useRef(false);
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 750, useNativeDriver: true })
    );
    if (loadingMore) loop.start();
    else { loop.stop(); spinAnim.setValue(0); }
    return () => loop.stop();
  }, [loadingMore]);

  const fetchPage = async (pageNum: number, isFirst: boolean) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (isFirst) setLoading(true); else setLoadingMore(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/gamelogs/my-reviews/paginated?page=${pageNum}&limit=${PAGE_LIMIT}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const data = await res.json();
      const formatted = data.reviews.map((log: any) => ({
        ...log,
        coverImage: log.coverImage || null,
        releasedDate: log.releasedDate || null,
      }));
      setReviews((prev) => isFirst ? formatted : [...prev, ...formatted]);
      setHasMore(data.hasMore);
      setTotalReviews(data.total);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      if (isFirst) setLoading(false); else setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchPage(1, true);
  }, []);

  const handleEndReached = () => {
    if (hasMore && !loadingMore && !loading) fetchPage(page + 1, false);
  };

  return (
    <DashboardLayout>
      {loading ? (
        <AllUserReviewsSkeleton />
      ) : (
        <ReviewsContent
          reviews={reviews}
          totalReviews={totalReviews}
          loadingMore={loadingMore}
          hasMore={hasMore}
          spinAnim={spinAnim}
          onEndReached={handleEndReached}
        />
      )}
    </DashboardLayout>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D0204",
  },
  listContent: {
    maxWidth: 750,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 60,
  },

  // Back button
  backBtn: {
    paddingBottom: 24,
  },
  backBtnText: {
    color: "#8A6D73",
    fontSize: 13,
  },

  // Header
  heading: {
    color: "#F7F4F5",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  subheading: {
    color: "#8A6D73",
    fontSize: 13,
    marginBottom: 28,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
    marginBottom: 24,
  },

  // Empty state
  emptyWrap: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    color: "#8A6D73",
    fontSize: 13,
    textAlign: "center",
  },

  // Card
  card: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    gap: 20,
  },
  cardPressed: {
    borderColor: "#9E1B32",
    shadowColor: "#9E1B32",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },

  // Cover
  coverWrap: {
    width: 90,
    height: 135,
    flexShrink: 0,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "#160408",
  },
  coverImg: {
    width: "100%",
    height: "100%",
  },
  coverFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  coverEmoji: {
    fontSize: 24,
  },

  // Card body
  cardBody: {
    flex: 1,
    flexDirection: "column",
    minWidth: 0,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  cardTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: "#F7F4F5",
    fontSize: 15,
    fontWeight: "700",
  },
  cardTitlePressed: {
    color: "#E6A1B0",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
  },
  cardDate: {
    color: "#8A6D73",
    fontSize: 12,
  },
  editedTag: {
    color: "#8A6D73",
    fontSize: 11,
    fontStyle: "italic",
  },
  cardRating: {
    color: "#9E1B32",
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 0,
  },
  cardReview: {
    color: "#C2A8AE",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  spinnerWrap: {
    alignItems: "center",
    paddingVertical: 32,
  },
  spinner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "rgba(158,27,50,0.2)",
    borderTopColor: "#9E1B32",
  },
  endText: {
    textAlign: "center",
    color: "#8A6D73",
    fontSize: 12,
    paddingVertical: 24,
  },
});