import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { DashboardLayout } from "../components/DashboardLayout";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../App";
import { ReviewCoverCard } from "../components/ReviewCoverCard";
import { ReviewEngagement } from "../components/ReviewEngagement";
import { DeleteConfirmMenu } from "../components/DeleteConfirmMenu";
import { cpToast } from "../utils/toast";
import { useFadeUp } from "../hooks/useFadeUp";
import { Animated } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ReviewRoute = RouteProp<RootStackParamList, "Review">;

interface ReviewLog {
  _id: string;
  title: string;
  platform: string;
  status: string;
  rating: number;
  review: string;
  timestamp: string;
  coverImage: string | null;
  releasedDate: string | null;
  editedAt?: string | null;
  user?: any;
}

export function ReviewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ReviewRoute>();
  const { id } = route.params;

  const [log, setLog] = useState<ReviewLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const { opacity, translateY } = useFadeUp();

  useEffect(() => {
    const init = async () => {
      const t = await AsyncStorage.getItem("token");
      setToken(t);
      if (t) {
        try {
          setCurrentUserId(JSON.parse(atob(t.split(".")[1])).id ?? null);
        } catch {}
      }

      try {
        const res = await fetch(`${API_URL}/gamelogs/${id}`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (!res.ok) return;
        const baseLog = await res.json();
        setLog({
          ...baseLog,
          coverImage: baseLog.coverImage || null,
          releasedDate: baseLog.releasedDate || null,
        });
      } catch (err) {
        console.error("Failed to load review:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  const handleDeleteReview = async () => {
    if (!log || !token) return;
    const res = await fetch(`${API_URL}/gamelogs/${log._id}/review`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      cpToast.success("Review deleted.");
      navigation.goBack();
    } else {
      cpToast.error("Failed to delete review.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <View style={s.loadingWrap}>
          <ActivityIndicator color="#9E1B32" />
        </View>
      </DashboardLayout>
    );
  }

  if (!log) {
    return (
      <DashboardLayout>
        <View style={s.loadingWrap}>
          <Text style={s.notFoundText}>Review not found.</Text>
        </View>
      </DashboardLayout>
    );
  }

  const formattedDate = log.releasedDate
    ? new Date(log.releasedDate).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      })
    : "Release date unknown";

  const editedLabel = log.editedAt
    ? `edited ${new Date(log.editedAt).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      })}`
    : null;

  const logUserId =
    typeof log.user === "object" ? log.user?._id?.toString() : log.user?.toString();
  const isOwnReview = !!(currentUserId && logUserId === currentUserId);

  return (
    <DashboardLayout>
      <Animated.View style={[{ flex: 1 }, { opacity, transform: [{ translateY }] }]}>
        <ScrollView contentContainerStyle={s.scrollContent}>
          {/* Back + delete row */}
          <View style={s.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={s.backBtn}>← Back</Text>
            </TouchableOpacity>

            {isOwnReview && (
              <DeleteConfirmMenu
                onEdit={() =>
                  navigation.navigate("Review", { id: log._id })
                }
                onDelete={handleDeleteReview}
                // cancelMessage="Review not deleted."
                confirmMessage="Are you sure you want to delete this review?"
              />
            )}
          </View>

          {/* Cover card */}
          <View style={{ marginBottom: 28 }}>
            <ReviewCoverCard
              coverImage={log.coverImage}
              title={log.title}
              formattedDate={formattedDate}
              rating={log.rating}
              editedLabel={editedLabel}
            >
              <Text style={s.reviewText}>{log.review}</Text>
            </ReviewCoverCard>
          </View>

          {/* Engagement */}
          <ReviewEngagement gameLogId={log._id} />
        </ScrollView>
      </Animated.View>
    </DashboardLayout>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D0204",
  },
  scrollContent: {
    maxWidth: 750,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 60,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    color: "#A28389",
    fontSize: 18,
    textAlign: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backBtn: {
    color: "#8A6D73",
    fontSize: 13,
  },
  reviewText: {
    color: "#C2A8AE",
    fontSize: 14,
    lineHeight: 24,
    marginTop: 20,
  },
});