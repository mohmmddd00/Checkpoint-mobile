import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  StyleSheet, ScrollView, ActivityIndicator, Pressable,
} from "react-native";
import { storage } from "../utils/storage";
import { cpToast } from "../utils/toast";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface Game {
  id: number;
  name: string;
  released: string;
  background_image: string;
  platforms?: { platform: { name: string } }[];
  genres?: { name: string }[];
}

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

interface LogModalProps {
  game: Game;
  onClose: () => void;
}

export function LogModal({ game, onClose }: LogModalProps) {
  const [platform, setPlatform] = useState("");
  const [platformOpen, setPlatformOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [rating, setRating] = useState("");
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmitLog = async () => {
    if (!platform.trim()) { cpToast.error("Please select a platform."); return; }
    if (!status) { cpToast.error("Please select a status."); return; }
    if (rating.trim() === "") { cpToast.error("Please enter a rating."); return; }
    if (!/^\d+(\.\d+)?$/.test(rating.trim())) { cpToast.error("Ratings can only be numeric."); return; }
    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 0 || numericRating > 10) {
      cpToast.error("Rating must be between 0 and 10."); return;
    }
    if (!/^\d+(\.\d)?$/.test(rating.trim())) {
      cpToast.error("Rating can only have 1 decimal place (e.g. 7, 7.5, 9.1)."); return;
    }

    setSubmitting(true);
    try {
      const token = await storage.getToken();
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
    } catch (error) {
      cpToast.error("Could not reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const STATUS_OPTIONS = [
    { value: "Playing", label: "Playing" },
    { value: "Completed", label: "Completed" },
    { value: "Dropped", label: "Dropped" },
  ];

  return (
    <Modal visible animationType="fade" transparent onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always" keyboardDismissMode="none">

            {/* HEADER */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Log Game</Text>
                <Text style={styles.subtitle}>{game.name}</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* RATING */}
            <View style={styles.field}>
              <Text style={styles.label}>Rating (0–10)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 8"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={rating}
                onChangeText={setRating}
                keyboardType="decimal-pad"
              />
            </View>

            {/* PLATFORM DROPDOWN */}
            <View style={styles.field}>
              <Text style={styles.label}>Platform</Text>
              <TouchableOpacity
                style={[styles.dropdown, platformOpen && styles.dropdownOpen]}
                onPress={() => { setPlatformOpen(!platformOpen); setStatusOpen(false); }}
              >
                <Text style={platform ? styles.dropdownSelected : styles.dropdownPlaceholder}>
                  {platform || "Select platform"}
                </Text>
                <Text style={styles.dropdownArrow}>{platformOpen ? "▲" : "▼"}</Text>
              </TouchableOpacity>
              {platformOpen && (
                <View style={styles.dropdownList}>
                  {extractPlatforms(game).map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.dropdownOption, platform === opt && styles.dropdownOptionActive]}
                      onPress={() => { setPlatform(opt); setPlatformOpen(false); }}
                    >
                      <Text style={[styles.dropdownOptionText, platform === opt && styles.dropdownOptionTextActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* STATUS DROPDOWN */}
            <View style={styles.field}>
              <Text style={styles.label}>Status</Text>
              <TouchableOpacity
                style={[styles.dropdown, statusOpen && styles.dropdownOpen]}
                onPress={() => { setStatusOpen(!statusOpen); setPlatformOpen(false); }}
              >
                <Text style={status ? styles.dropdownSelected : styles.dropdownPlaceholder}>
                  {status || "Select status"}
                </Text>
                <Text style={styles.dropdownArrow}>{statusOpen ? "▲" : "▼"}</Text>
              </TouchableOpacity>
              {statusOpen && (
                <View style={styles.dropdownList}>
                  {STATUS_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.dropdownOption, status === opt.value && styles.dropdownOptionActive]}
                      onPress={() => { setStatus(opt.value); setStatusOpen(false); }}
                    >
                      <Text style={[styles.dropdownOptionText, status === opt.value && styles.dropdownOptionTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* REVIEW */}
            <View style={styles.field}>
              <Text style={styles.label}>Review</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="What did you think?"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={review}
                onChangeText={setReview}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* SUBMIT */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmitLog}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitBtnText}>Log</Text>
              }
            </TouchableOpacity>
            <View style={{ height: 150 }} />

          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "62.5%",
    // maxHeight: "100%",
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#380B14",
    borderRadius: 12,
    padding: 26,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    color: "#A28389",
    fontSize: 14,
    marginTop: 4,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: "#A28389",
    fontSize: 20,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: "#C2A8AE",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    padding: 10,
    paddingHorizontal: 12,
    color: "#fff",
    fontSize: 14,
  },
  textarea: {
    height: 100,
    paddingTop: 10,
  },
  dropdown: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownOpen: {
    borderColor: "rgba(158,27,50,0.6)",
  },
  dropdownPlaceholder: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 14,
  },
  dropdownSelected: {
    color: "#fff",
    fontSize: 14,
  },
  dropdownArrow: {
    color: "#8A6D73",
    fontSize: 10,
  },
  dropdownList: {
    backgroundColor: "#1a0508",
    borderWidth: 1,
    borderColor: "#380B14",
    borderRadius: 8,
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
  },
  dropdownOptionActive: {
    backgroundColor: "rgba(158,27,50,0.2)",
  },
  dropdownOptionText: {
    color: "#C2A8AE",
    fontSize: 14,
  },
  dropdownOptionTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: "#9E1B32",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});