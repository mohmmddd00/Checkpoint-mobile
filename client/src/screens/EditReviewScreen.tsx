import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { DashboardLayout } from "../components/DashboardLayout";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../App";
import { ReviewCoverCard } from "../components/ReviewCoverCard";
import { cpToast } from "../utils/toast";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type Nav = NativeStackNavigationProp<RootStackParamList>;
type EditReviewRoute = RouteProp<RootStackParamList, "EditReview">;

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
}

export function EditReviewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<EditReviewRoute>();
  const { id, log: passedLog } = route.params;

  const [log, setLog] = useState<ReviewLog | null>(passedLog ?? null);
  const [reviewText, setReviewText] = useState(passedLog?.review ?? "");
  const originalReviewRef = useRef(passedLog?.review ?? "");
  const [loading, setLoading] = useState(!passedLog);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (passedLog) return;
    const loadLog = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(`${API_URL}/gamelogs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const baseLog = await res.json();
        setLog({
          ...baseLog,
          coverImage: baseLog.coverImage || null,
          releasedDate: baseLog.releasedDate || null,
        });
        setReviewText(baseLog.review ?? "");
        originalReviewRef.current = baseLog.review ?? "";
      } catch (err) {
        console.error("Failed to load review:", err);
      } finally {
        setLoading(false);
      }
    };
    loadLog();
  }, [id]);

  const handleSave = async () => {
    if (!log || !reviewText.trim()) return;
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/gamelogs/${log._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ review: reviewText.trim() }),
      });
      if (res.ok) {
        cpToast.success("Changes saved.");
        navigation.goBack();
      } else {
        cpToast.error("Failed to save changes.");
      }
    } catch {
      cpToast.error("Failed to save changes.");
    } finally {
      setSaving(false);
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

  const hasChanges = reviewText.trim() !== originalReviewRef.current.trim();

  return (
    <DashboardLayout>
      <KeyboardAwareScrollView
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={80}
      >
        {/* ── TOP BAR ── */}
        <View style={s.topRow}>
          <Text style={s.editingLabel}>Editing review</Text>
          <View style={s.topActions}>
            <TouchableOpacity
              style={[s.btn, s.btnPrimary, (!hasChanges || saving || !reviewText.trim()) && s.btnDisabled]}
              onPress={handleSave}
              disabled={saving || !hasChanges || !reviewText.trim()}
            >
              <Text style={s.btnPrimaryText}>{saving ? "Saving..." : "Save"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, s.btnSecondary, saving && s.btnDisabled]}
              onPress={() => navigation.goBack()}
              disabled={saving}
            >
              <Text style={s.btnSecondaryText}>Discard</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── REVIEW CARD (editable) ── */}
        <ReviewCoverCard
          coverImage={log.coverImage}
          title={log.title}
          formattedDate={formattedDate}
          rating={log.rating}
          editedAt={log.editedAt}
        >
          <TextInput
            value={reviewText}
            onChangeText={setReviewText}
            multiline
            autoFocus
            style={s.reviewInput}
            placeholderTextColor="rgba(194,168,174,0.4)"
            placeholder="Write your review..."
            textAlignVertical="top"
            scrollEnabled={false}
          />
        </ReviewCoverCard>
      </KeyboardAwareScrollView>
    </DashboardLayout>
  );
}

const s = StyleSheet.create({
  scrollContent: {
    maxWidth: 750,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 80,
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

  // Top bar
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  editingLabel: {
    color: "#8A6D73",
    fontSize: 13,
  },
  topActions: {
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: "#9E1B32",
    borderColor: "#9E1B32",
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  btnSecondary: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  btnSecondaryText: {
    color: "#C2A8AE",
    fontSize: 13,
    fontWeight: "600",
  },
  btnDisabled: {
    opacity: 0.45,
  },

  // Editable review text — visually identical to the read view
  reviewInput: {
    marginTop: 20,
    color: "#C2A8AE",
    fontSize: 14,
    lineHeight: 24,
    backgroundColor: "transparent",
    padding: 0,
    borderWidth: 0,
  },
});