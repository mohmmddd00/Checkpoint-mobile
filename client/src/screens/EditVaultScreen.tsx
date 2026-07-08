import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cpToast } from "../utils/toast";
import { RootStackParamList } from "../../App";
import { GameSearchResults, type Game } from "../components/GameSearchResults";
import { EditVaultScreenSkeleton } from "../LoadingScreens/EditVaultPageSkeleton";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface VaultGame {
  gameId: number;
  title: string;
  coverImage: string | null;
  releasedDate: string | null;
}

interface Vault {
  _id: string;
  title: string;
  description: string;
  games: VaultGame[];
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
}

type EditVaultRouteProp = RouteProp<RootStackParamList, "EditVault">;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function EditVaultScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<EditVaultRouteProp>();
  const { id } = route.params;

  const [vault, setVault] = useState<Vault | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [games, setGames] = useState<VaultGame[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [resultsVisible, setResultsVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const originalTitleRef = useRef("");
  const originalDescriptionRef = useRef("");
  const originalGamesRef = useRef<VaultGame[]>([]);

  useEffect(() => {
    const load = async () => {
      const token = await AsyncStorage.getItem("token");
      try {
        const res = await fetch(`${API_URL}/vaults/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: Vault = await res.json();
          setVault(data);
          setTitle(data.title);
          setDescription(data.description);
          setGames(data.games);
          originalTitleRef.current = data.title;
          originalDescriptionRef.current = data.description;
          originalGamesRef.current = data.games;
        } else {
          cpToast.error("Could not load vault.");
          navigation.goBack();
        }
      } catch {
        cpToast.error("Could not load vault.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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

  const handleSave = async () => {
    if (!title.trim()) {
      cpToast.error("Title cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/vaults/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          games,
        }),
      });
      if (res.ok) {
        cpToast.success("Vault updated.");
        navigation.goBack();
      } else {
        cpToast.error("Failed to update vault.");
      }
    } catch {
      cpToast.error("Failed to update vault.");
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    title !== originalTitleRef.current ||
    description !== originalDescriptionRef.current ||
    JSON.stringify(games) !== JSON.stringify(originalGamesRef.current);

  const saveDisabled = saving || !title.trim() || !isDirty;

  if (loading) return <EditVaultScreenSkeleton />;
  if (!vault) return null;

  return (
    <SafeAreaView style={styles.flex}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back to Vault</Text>
        </TouchableOpacity>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.heading}>Edit Vault</Text>

          {/* Title */}
          <View>
            <Text style={styles.label}>VAULT TITLE</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              placeholderTextColor="#4A2530"
              selectionColor="#9E1B32"
            />
          </View>

          {/* Description */}
          <View>
            <Text style={styles.label}>DESCRIPTION</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={[styles.input, styles.textarea]}
              placeholderTextColor="#4A2530"
              selectionColor="#9E1B32"
            />
          </View>

          {/* Game Search */}
          <View>
            <Text style={styles.label}>ADD GAMES</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search for a game…"
              style={[
                styles.input,
                resultsVisible && searchQuery.trim().length > 0 && styles.inputOpen,
              ]}
              placeholderTextColor="#4A2530"
              selectionColor="#9E1B32"
            />
            <GameSearchResults
              query={searchQuery}
              onSelect={(game) => {
                handleSelectGame(game);
                setSearchQuery("");
              }}
              onVisibilityChange={setResultsVisible}
              addIcon
            />
          </View>

          {/* Games List */}
          {games.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={styles.label}>GAMES IN THIS VAULT ({games.length})</Text>
              {games.map((game) => (
                <View key={game.gameId} style={styles.gameRow}>
                  {game.coverImage ? (
                    <Image
                      source={{ uri: game.coverImage }}
                      style={styles.gameCover}
                    />
                  ) : (
                    <View style={[styles.gameCover, styles.gameCoverPlaceholder]}>
                      <Text style={{ fontSize: 16 }}>🎮</Text>
                    </View>
                  )}
                  <View style={styles.gameInfo}>
                    <Text style={styles.gameTitle} numberOfLines={1}>
                      {game.title}
                    </Text>
                    {game.releasedDate && (
                      <Text style={styles.gameYear}>
                        {game.releasedDate.split("-")[0]}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      setGames((prev) => prev.filter((g) => g.gameId !== game.gameId))
                    }
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.removeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saveDisabled}
              style={[styles.btn, styles.btnPrimary, saveDisabled && styles.btnDisabled]}
              activeOpacity={saveDisabled ? 1 : 0.75}
            >
              <Text style={styles.btnPrimaryText}>
                {saving ? "Saving…" : "Save Changes"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={saving}
              style={[styles.btn, styles.btnSecondary]}
              activeOpacity={saving ? 1 : 0.75}
            >
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0D0204" },
  scroll: { flex: 1, backgroundColor: "#0D0204" },
  container: {
    maxWidth: 620,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 60,
  },
  backBtn: { marginBottom: 28 },
  backText: { color: "#8A6D73", fontSize: 13 },
  card: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#380B14",
    borderRadius: 16,
    padding: 20,
    gap: 20,
  },
  heading: {
    color: "#F7F4F5",
    fontSize: 17,
    fontWeight: "800",
  },
  label: {
    color: "#A28389",
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: "#F7F4F5",
    fontSize: 14,
  },
  inputOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  textarea: {
    height: 78,
    textAlignVertical: "top",
  },
  gameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 8,
    padding: 8,
  },
  gameCover: {
    width: 32,
    height: 44,
    borderRadius: 4,
    resizeMode: "cover",
  },
  gameCoverPlaceholder: {
    backgroundColor: "#160408",
    alignItems: "center",
    justifyContent: "center",
  },
  gameInfo: { flex: 1, overflow: "hidden" },
  gameTitle: {
    color: "#F7F4F5",
    fontSize: 13,
    fontWeight: "600",
  },
  gameYear: { color: "#8A6D73", fontSize: 11, marginTop: 2 },
  removeBtn: { color: "#5C1222", fontSize: 16, paddingHorizontal: 4 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  btn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnPrimary: {
    backgroundColor: "#9E1B32",
    borderWidth: 1,
    borderColor: "#9E1B32",
  },
  btnDisabled: {
    backgroundColor: "rgba(158,27,50,0.35)",
  },
  btnPrimaryText: {
    color: "#F7F4F5",
    fontSize: 13,
    fontWeight: "700",
  },
  btnSecondary: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  btnSecondaryText: {
    color: "#C2A8AE",
    fontSize: 13,
    fontWeight: "700",
  },
});