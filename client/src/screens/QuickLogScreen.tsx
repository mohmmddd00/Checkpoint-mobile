import React, { useState, useEffect, useRef, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { DashboardLayout } from "../components/DashboardLayout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle, Line } from "react-native-svg";
import { GameSearchResults } from "../components/GameSearchResults";
import type { Game } from "../components/GameSearchResults";
import { cpToast } from "../utils/toast";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const ALL_PLATFORMS = [
  "PC", "PlayStation 5", "PlayStation 4", "Xbox Series S/X",
  "Xbox One", "Xbox 360", "Nintendo Switch", "iOS", "Android",
  "Linux", "macOS", "Other",
];

function extractPlatforms(game: Game): string[] {
  if (!game.platforms || game.platforms.length === 0) return ALL_PLATFORMS;
  const mapped = game.platforms
    .map((p) => p.platform.name)
    .filter((name) => ALL_PLATFORMS.includes(name));
  return mapped.length > 0 ? [...mapped, "Other"] : ALL_PLATFORMS;
}

// ─── STEP 1: GAME SEARCH ─────────────────────────────────────────────────────

function QuickLogSearch({ onSelect }: { onSelect: (game: Game) => void }) {
  const [query, setQuery] = useState("");
  const [resultsVisible, setResultsVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScrollView
      style={styles.searchContainer}
      contentContainerStyle={styles.searchContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>What game would you like to quick log?</Text>
      <Text style={styles.subheading}>Search for a title to get started.</Text>

      <View style={styles.searchBox}>
        {/* Icon + input pinned together so the icon never drifts */}
        <View style={styles.searchInputRow}>
          <View style={styles.searchIconWrapper} pointerEvents="none">
            <Svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Circle cx={11} cy={11} r={8} />
              <Line x1={21} y1={21} x2={16.65} y2={16.65} />
            </Svg>
          </View>

          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="e.g. The Last of Us, Elden Ring..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={[
              styles.searchInput,
              resultsVisible && styles.searchInputOpen,
            ]}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        <GameSearchResults
          query={query}
          onSelect={onSelect}
          onVisibilityChange={setResultsVisible}
        />
      </View>
    </ScrollView>
  );
}

// ─── STEP 2: LOG MODAL ───────────────────────────────────────────────────────

function LogModal({
  game,
  onClose,
  onBack,
}: {
  game: Game;
  onClose: () => void;
  onBack: () => void;
}) {
  const [platform, setPlatform] = useState("");
  const [platformOpen, setPlatformOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [rating, setRating] = useState("");
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!platform.trim()) { cpToast.error("Please select a platform."); return; }
    if (!status) { cpToast.error("Please select a status."); return; }
    if (rating.trim() === "") { cpToast.error("Please enter a rating."); return; }
    if (!/^\d+(\.\d+)?$/.test(rating.trim())) {
      cpToast.error("Ratings can only be numeric.");
      return;
    }
    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 0 || numericRating > 10) {
      cpToast.error("Rating must be between 0 and 10.");
      return;
    }
    if (!/^\d+(\.\d)?$/.test(rating.trim())) {
      cpToast.error("Rating can only have 1 decimal place (e.g. 7, 7.5, 9.1).");
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_URL}/gamelogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: game.name,
          platform: platform.trim(),
          status,
          rating: numericRating,
          review: review.trim(),
          coverImage: game.background_image ?? null,
          releasedDate: game.released ?? null,
          genres: game.genres?.map((g) => g.name) ?? [],
        }),
      });

      const data = await response.json();
      if (response.ok) {
        cpToast.success(`${game.name} logged!`);
        onClose();
      } else {
        cpToast.error(data.message || "Failed to log game.");
      }
    } catch {
      cpToast.error("Could not reach the server. Try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  const platformOptions = extractPlatforms(game);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop — tapping it closes the modal */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalKAV}>
          {/* Inner card — stops backdrop tap from closing when tapping inside */}
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalContent}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>← Change game</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Log Game</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    {game.name}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  disabled={submitting}
                  style={styles.closeBtn}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Rating */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Rating (0–10)</Text>
                <TextInput
                  value={rating}
                  onChangeText={setRating}
                  placeholder="e.g. 8"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="decimal-pad"
                  style={styles.textInput}
                />
              </View>

              {/* Platform dropdown */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Platform</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    platformOpen && styles.dropdownTriggerOpen,
                    !!platform && styles.dropdownTriggerSelected,
                  ]}
                  onPress={() => { setPlatformOpen(!platformOpen); setStatusOpen(false); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropdownTriggerText, !platform && styles.dropdownPlaceholder]}>
                    {platform || "Select platform"}
                  </Text>
                  <Text style={[styles.dropdownArrow, platformOpen && styles.dropdownArrowOpen]}>▼</Text>
                </TouchableOpacity>
                {platformOpen && (
                  <View style={styles.dropdownList}>
                    {platformOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.dropdownOption,
                          platform === opt && styles.dropdownOptionActive,
                        ]}
                        onPress={() => { setPlatform(opt); setPlatformOpen(false); }}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.dropdownOptionText,
                          platform === opt && styles.dropdownOptionTextActive,
                        ]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Status dropdown */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Status</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    statusOpen && styles.dropdownTriggerOpen,
                    !!status && styles.dropdownTriggerSelected,
                  ]}
                  onPress={() => { setStatusOpen(!statusOpen); setPlatformOpen(false); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropdownTriggerText, !status && styles.dropdownPlaceholder]}>
                    {status || "Select status"}
                  </Text>
                  <Text style={[styles.dropdownArrow, statusOpen && styles.dropdownArrowOpen]}>▼</Text>
                </TouchableOpacity>
                {statusOpen && (
                  <View style={styles.dropdownList}>
                    {["Playing", "Completed", "Dropped"].map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.dropdownOption,
                          status === opt && styles.dropdownOptionActive,
                        ]}
                        onPress={() => { setStatus(opt); setStatusOpen(false); }}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.dropdownOptionText,
                          status === opt && styles.dropdownOptionTextActive,
                        ]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Review */}
              <View style={[styles.fieldGroup, { marginBottom: 24 }]}>
                <Text style={styles.fieldLabel}>Review</Text>
                <TextInput
                  value={review}
                  onChangeText={setReview}
                  placeholder="What did you think?"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                  numberOfLines={4}
                  style={[styles.textInput, styles.textArea]}
                  textAlignVertical="top"
                />
              </View>

              {/* Submit */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Log</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── SCREEN SHELL ─────────────────────────────────────────────────────────────

export function QuickLogScreen() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [searchKey, setSearchKey] = useState(0);

  // Reset search every time the screen comes into focus (e.g. user navigated away and back)
  useFocusEffect(
    useCallback(() => {
      setSelectedGame(null);
      setSearchKey((k) => k + 1);
    }, [])
  );

  const handleLogClose = () => {
    setSelectedGame(null);
    setSearchKey((k) => k + 1); // remounts QuickLogSearch → clears search input
  };

  const handleBack = () => {
    setSelectedGame(null); // back to search, keeps query as-is
  };

  return (
    <DashboardLayout>
      <QuickLogSearch key={searchKey} onSelect={setSelectedGame} />
      {selectedGame && (
        <LogModal
          game={selectedGame}
          onClose={handleLogClose}
          onBack={handleBack}
        />
      )}
    </DashboardLayout>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0D0204",
  },
  // (kept for reference, layout now handled by DashboardLayout)

  // ── Search ──
  searchContainer: {
    flex: 1,
    backgroundColor: "#0D0204",
  },
  searchContent: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
  heading: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  subheading: {
    color: "#8A6D73",
    fontSize: 14,
    marginBottom: 36,
    textAlign: "center",
  },
  searchBox: {
    width: "100%",
  },
  searchInputRow: {
    width: "100%",
    position: "relative",
  },
  searchIconWrapper: {
    position: "absolute",
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingVertical: 14,
    paddingLeft: 46,
    paddingRight: 16,
    color: "#fff",
    fontSize: 15,
  },
  searchInputOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderColor: "rgba(158,27,50,0.7)",
  },

  // ── Modal ──
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalKAV: {
    width: "100%",
  },
  modalCard: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#380B14",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.7,
    shadowRadius: 50,
    elevation: 20,
    overflow: "hidden",
  },
  modalContent: {
    padding: 28,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 12,
  },
  backBtn: {
    paddingBottom: 6,
  },
  backBtnText: {
    color: "#8A6D73",
    fontSize: 12,
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  modalSubtitle: {
    color: "#A28389",
    fontSize: 14,
    marginTop: 4,
  },
  closeBtn: {
    padding: 4,
    marginTop: 2,
  },
  closeBtnText: {
    color: "#A28389",
    fontSize: 20,
    lineHeight: 22,
  },

  // ── Form fields ──
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: "#C2A8AE",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: "#fff",
    fontSize: 14,
  },
  textArea: {
    minHeight: 96,
    paddingTop: 10,
  },

  // ── Dropdowns ──
  dropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownTriggerOpen: {
    borderColor: "rgba(158,27,50,0.7)",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownTriggerSelected: {
    borderColor: "rgba(158,27,50,0.5)",
  },
  dropdownTriggerText: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: "rgba(255,255,255,0.35)",
  },
  dropdownArrow: {
    color: "#8A6D73",
    fontSize: 10,
  },
  dropdownArrowOpen: {
    color: "#9E1B32",
  },
  dropdownList: {
    backgroundColor: "#1a0508",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "rgba(158,27,50,0.7)",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: "hidden",
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  dropdownOptionActive: {
    backgroundColor: "rgba(158,27,50,0.15)",
  },
  dropdownOptionText: {
    color: "#C2A8AE",
    fontSize: 14,
  },
  dropdownOptionTextActive: {
    color: "#E6A1B0",
    fontWeight: "600",
  },

  // ── Submit ──
  submitBtn: {
    backgroundColor: "#9E1B32",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
});