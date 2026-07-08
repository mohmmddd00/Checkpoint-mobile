import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { DashboardLayout } from "../components/DashboardLayout";
import { GameSearchResults, type Game } from "../components/GameSearchResults";
import { storage } from "../utils/storage";
import { useFadeUp } from "../hooks/useFadeUp";
import { cpToast } from "../utils/toast";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface VaultGame {
  gameId: number;
  title: string;
  coverImage: string | null;
  releasedDate: string | null;
}

// ─── ADDED GAME ROW ──────────────────────────────────────────────────────────

function AddedGameRow({ game, onRemove }: { game: VaultGame; onRemove: () => void }) {
  const year = game.releasedDate ? game.releasedDate.split("-")[0] : "TBA";

  return (
    <View style={s.gameRow}>
      <View style={s.gameThumbnail}>
        {game.coverImage ? (
          <Image source={{ uri: game.coverImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Text style={s.gameRowEmoji}>🎮</Text>
        )}
      </View>

      <View style={s.gameRowInfo}>
        <Text style={s.gameRowTitle} numberOfLines={1}>{game.title}</Text>
        <Text style={s.gameRowYear}>{year}</Text>
      </View>

      <TouchableOpacity onPress={onRemove} style={s.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={s.removeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── PAGE CONTENT ────────────────────────────────────────────────────────────

function VaultCreationContent() {
  const navigation = useNavigation<Nav>();
  const { opacity, translateY } = useFadeUp();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [games, setGames] = useState<VaultGame[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [titleFocused, setTitleFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSelectGame = (game: Game) => {
    if (games.some((g) => g.gameId === game.id)) {
      cpToast.error(`"${game.name}" is already in this vault.`);
      setSearchQuery("");
      return;
    }
    setGames((prev) => [
      ...prev,
      {
        gameId: game.id,
        title: game.name,
        coverImage: game.background_image ?? null,
        releasedDate: game.released ?? null,
      },
    ]);
    setSearchQuery("");
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      cpToast.error("Please give your vault a title.");
      return;
    }
    setSaving(true);
    try {
      const token = await storage.getToken();
      const res = await fetch(`${API_URL}/vaults`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), games }),
      });
      if (res.ok) {
        cpToast.success("Vault Created!");
        navigation.navigate("MyVaults");
      } else {
        const err = await res.json();
        cpToast.error(err.message ?? "Failed to create vault.");
      }
    } catch {
      cpToast.error("Failed to create vault.");
    } finally {
      setSaving(false);
    }
  };

  const canCreate = !saving && title.trim().length > 0;

  return (
    <Animated.View style={[{ flex: 1 }, { opacity, transform: [{ translateY }] }]}>
      <KeyboardAwareScrollView
        style={s.container}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={-100}
      >
        {/* ── BACK ── */}
        <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={s.backBtn}>
          <Text style={s.backText}>← Back to profile</Text>
        </TouchableOpacity>

        {/* ── HEADER ── */}
        <Text style={s.pageTitle}>Create a Vault</Text>
        <Text style={s.pageSubtitle}>Curate a collection of games around any theme you like.</Text>

        <View style={s.divider} />

        {/* ── FORM CARD ── */}
        <View style={s.formCard}>

          {/* Title */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Vault Title</Text>
            <TextInput
              style={[s.input, titleFocused && s.inputFocused]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Greatest RPGs of all time"
              placeholderTextColor="#8A6D73"
              onFocus={() => setTitleFocused(true)}
              onBlur={() => setTitleFocused(false)}
            />
          </View>

          {/* Description */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Description</Text>
            <TextInput
              style={[s.input, s.textarea, descFocused && s.inputFocused]}
              value={description}
              onChangeText={setDescription}
              placeholder="What's this vault about?"
              placeholderTextColor="#8A6D73"
              multiline
              numberOfLines={3}
              onFocus={() => setDescFocused(true)}
              onBlur={() => setDescFocused(false)}
              textAlignVertical="top"
            />
          </View>

          {/* Add Games */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Add Games</Text>
            <TextInput
              style={[s.input, s.searchInput, searchFocused && s.inputFocused]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search for a game to add…"
              placeholderTextColor="#8A6D73"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <GameSearchResults
              query={searchQuery}
              onSelect={handleSelectGame}
              onVisibilityChange={(v) => { if (!v) setSearchQuery(""); }}
              addIcon
            />

            {/* Added games list */}
            {games.length > 0 && (
              <View style={s.gamesList}>
                {games.map((g) => (
                  <AddedGameRow
                    key={g.gameId}
                    game={g}
                    onRemove={() => setGames((prev) => prev.filter((x) => x.gameId !== g.gameId))}
                  />
                ))}
              </View>
            )}

            {games.length === 0 && (
              <Text style={s.noGamesText}>No games added yet.</Text>
            )}
          </View>
        </View>

        {/* ── ACTION BUTTONS ── */}
        <TouchableOpacity
          style={[s.createBtn, !canCreate && s.createBtnDisabled]}
          onPress={handleCreate}
          disabled={!canCreate}
          activeOpacity={0.8}
        >
          <Text style={s.createBtnText}>{saving ? "Creating…" : "Create Vault"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.discardBtn}
          onPress={() => navigation.goBack()}
          disabled={saving}
          activeOpacity={0.7}
        >
          <Text style={s.discardBtnText}>Discard</Text>
        </TouchableOpacity>

      </KeyboardAwareScrollView>
    </Animated.View>
  );
}

// ─── SCREEN EXPORT ────────────────────────────────────────────────────────────

export function VaultCreationScreen() {
  return (
    <DashboardLayout>
      <VaultCreationContent />
    </DashboardLayout>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0204" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 28, paddingBottom: 80 },

  backBtn: { paddingBottom: 24 },
  backText: { color: "#8A6D73", fontSize: 13 },

  pageTitle: {
    color: "#F7F4F5",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  pageSubtitle: { color: "#8A6D73", fontSize: 13, marginBottom: 24 },

  divider: { borderBottomWidth: 1, borderBottomColor: "#28070F", marginBottom: 24 },

  formCard: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 16,
    padding: 20,
    gap: 24,
  },

  fieldGroup: { gap: 8 },

  label: {
    color: "#A28389",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#F7F4F5",
    fontSize: 14,
  },
  inputFocused: { borderColor: "#9E1B32" },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  searchInput: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },

  gamesList: { gap: 8, marginTop: 12 },

  gameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 10,
  },
  gameThumbnail: {
    width: 36,
    height: 48,
    borderRadius: 4,
    overflow: "hidden",
    flexShrink: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#32050F",
    alignItems: "center",
    justifyContent: "center",
  },
  gameRowEmoji: { fontSize: 16, color: "#5C1222" },
  gameRowInfo: { flex: 1, minWidth: 0 },
  gameRowTitle: { color: "#F7F4F5", fontSize: 14, fontWeight: "600" },
  gameRowYear: { color: "#8A6D73", fontSize: 12, marginTop: 2 },

  removeBtn: { padding: 4, flexShrink: 0 },
  removeBtnText: { color: "#5C1222", fontSize: 18, lineHeight: 20 },

  noGamesText: {
    color: "#5C1222",
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 8,
  },

  createBtn: {
    marginTop: 20,
    backgroundColor: "#9E1B32",
    borderWidth: 1,
    borderColor: "#9E1B32",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  createBtnDisabled: { backgroundColor: "rgba(158,27,50,0.35)" },
  createBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  discardBtn: {
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  discardBtnText: {
    color: "#C2A8AE",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});