import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { DashboardLayout } from "../components/DashboardLayout";
import { storage } from "../utils/storage";
import { DeleteConfirmMenu } from "../components/DeleteConfirmMenu";
import Toast from "react-native-toast-message";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "Vault">;

// ─── TYPES ───────────────────────────────────────────────────────────────────

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
  editedAt?: string | null;
}

// ─── GAME CARD ───────────────────────────────────────────────────────────────

function VaultGameCard({ game }: { game: VaultGame }) {
  const navigation = useNavigation<Nav>();
  const [pressed, setPressed] = useState(false);
  const year = game.releasedDate ? game.releasedDate.split("-")[0] : "TBA";

  return (
    <TouchableOpacity
      style={s.gameCardWrapper}
      activeOpacity={0.85}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => navigation.navigate("Game", {
        slug: game.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        game,
      })}
    >
      <View style={[s.gameCard, pressed && s.gameCardPressed]}>
        {game.coverImage ? (
          <Image source={{ uri: game.coverImage }} style={s.gameCover} resizeMode="cover" />
        ) : (
          <View style={s.gameCoverPlaceholder}>
            <Text style={{ fontSize: 28 }}>🎮</Text>
          </View>
        )}
      </View>
      <Text style={[s.gameTitle, pressed && s.gameTitlePressed]} numberOfLines={2}>
        {game.title}
      </Text>
      <Text style={s.gameYear}>{year}</Text>
    </TouchableOpacity>
  );
}

// ─── PAGE CONTENT ────────────────────────────────────────────────────────────

function VaultContent() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const { id, vault: passedVault } = route.params;

  const [vault, setVault] = useState<Vault | null>(passedVault ?? null);
  const [loading, setLoading] = useState(!passedVault);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const token = await storage.getToken();
          const res = await fetch(`${API_URL}/vaults/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) setVault(await res.json());
        } catch (err) {
          console.error("Failed to load vault:", err);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [id])
  );

  const handleDelete = async () => {
    if (!vault) return;
    const token = await storage.getToken();
    const res = await fetch(`${API_URL}/vaults/${vault._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      Toast.show({ type: "success", text1: "Vault deleted." });
      navigation.navigate("MyVaults");
    } else {
      Toast.show({ type: "error", text1: "Failed to delete vault." });
    }
  };

  if (loading) {
    return (
      <View style={s.centered}>
        <Text style={s.loadingText}>Loading vault...</Text>
      </View>
    );
  }

  if (!vault) {
    return (
      <View style={s.centered}>
        <Text style={s.loadingText}>Vault not found.</Text>
      </View>
    );
  }

  const createdDate = new Date(vault.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const editedDate = vault.editedAt
    ? new Date(vault.editedAt).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      })
    : null;

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── TOP BAR ── */}
      <View style={s.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <DeleteConfirmMenu
          onEdit={() => navigation.navigate("EditVault", { id: vault._id })}
          onDelete={handleDelete}
          confirmMessage="Are you sure you want to delete this vault?"
        />
      </View>

      {/* ── VAULT HEADER CARD ── */}
      <View style={s.headerCard}>
        <Text style={s.vaultTitle}>{vault.title}</Text>

        {vault.description ? (
          <Text style={s.vaultDescription}>{vault.description}</Text>
        ) : null}

        <View style={s.metaRow}>
          <Text style={s.gameCount}>
            {vault.games.length} game{vault.games.length !== 1 ? "s" : ""}
          </Text>
          <Text style={s.metaDot}>•</Text>
          <Text style={s.createdDate}>Created {createdDate}</Text>
          {editedDate && (
            <>
              <Text style={s.metaDot}>•</Text>
              <Text style={s.editedDate}>(edited {editedDate})</Text>
            </>
          )}
        </View>
      </View>

      {/* ── DIVIDER ── */}
      <View style={s.divider} />

      {/* ── GAMES GRID ── */}
      {vault.games.length === 0 ? (
        <View style={s.emptyGames}>
          <Text style={s.emptyGamesText}>
            No games in this vault yet. Edit the vault to add some.
          </Text>
        </View>
      ) : (
        <View style={s.gamesGrid}>
          {vault.games.map((game) => (
            <VaultGameCard key={game.gameId} game={game} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── SCREEN EXPORT ────────────────────────────────────────────────────────────

export function VaultScreen() {
  return (
    <DashboardLayout>
      <VaultContent />
    </DashboardLayout>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0204" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 28, paddingBottom: 80 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  loadingText: { color: "#A28389", fontSize: 16 },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  backText: { color: "#8A6D73", fontSize: 13 },
  deleteBtn: {
    backgroundColor: "rgba(158,27,50,0.1)",
    borderWidth: 1,
    borderColor: "#380B14",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteBtnText: { color: "#9E1B32", fontSize: 12, fontWeight: "700" },

  headerCard: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },
  vaultTitle: {
    color: "#F7F4F5",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  vaultDescription: {
    color: "#C2A8AE",
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  gameCount: { color: "#9E1B32", fontSize: 13, fontWeight: "700" },
  metaDot: { color: "#380B14", fontSize: 12 },
  createdDate: { color: "#8A6D73", fontSize: 12 },
  editedDate: { color: "#5C1222", fontSize: 11, fontStyle: "italic", letterSpacing: 0.2 },

  divider: { borderBottomWidth: 1, borderBottomColor: "#28070F", marginBottom: 24 },

  gamesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gameCardWrapper: { width: "30%" },
  gameCard: {
    aspectRatio: 2 / 3,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "#160408",
  },
  gameCardPressed: {
    borderColor: "#9E1B32",
    shadowColor: "#9E1B32",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  gameCover: { width: "100%", height: "100%" },
  gameCoverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gameTitle: {
    color: "#F7F4F5",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    lineHeight: 16,
  },
  gameTitlePressed: { color: "#E6A1B0" },
  gameYear: { color: "#8A6D73", fontSize: 11, marginTop: 3 },

  emptyGames: { alignItems: "center", paddingVertical: 60 },
  emptyGamesText: { color: "#8A6D73", fontSize: 14, textAlign: "center" },
});