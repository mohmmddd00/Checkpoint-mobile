import { useState, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  Image, StyleSheet, useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DashboardLayout } from "../components/DashboardLayout";
import { WelcomePageSkeleton } from "../LoadingScreens/WelcomePageSkeleton";
import { useSearchQuery } from "../context/SearchContext";
import type { RootStackParamList } from "../../App";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface Game {
  id: number;
  name: string;
  released: string;
  background_image: string;
}

function WelcomeContent() {
  const searchQuery = useSearchQuery();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const numColumns = width <= 480 ? 2 : 3;

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        if (searchQuery.trim().length > 0) {
          const res = await fetch(`${API_URL}/games/search?q=${encodeURIComponent(searchQuery)}`);
          if (!res.ok) throw new Error("Search failed");
          const data = await res.json();
          setGames(data.results || []);
        } else {
          setLoading(true);
          const res = await fetch(`${API_URL}/games/trending`);
          const data = await res.json();
          setGames(data.results || []);
        }
      } catch (err) {
        console.error("Failed fetching games:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchGames, searchQuery.trim().length > 0 ? 500 : 0);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCardClick = (game: Game) => {
    const slug = game.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    navigation.navigate("Game", { slug, game });
  };

  const cardWidth = (width - 40 - (numColumns - 1) * 16) / numColumns;

  if (loading) return <WelcomePageSkeleton />;

  return (
    <FlatList
      data={games}
      keyExtractor={(item) => item.id.toString()}
      numColumns={numColumns}
      key={numColumns}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `Search Results for "${searchQuery}"` : "Popular titles"}
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>No games found matching your search.</Text>
      }
      columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
      renderItem={({ item: game }) => {
        const releaseYear = game.released ? game.released.split("-")[0] : "TBA";
        return (
          <TouchableOpacity
            onPress={() => handleCardClick(game)}
            style={[styles.card, { width: cardWidth }]}
            activeOpacity={0.75}
          >
            <Image
              source={{ uri: game.background_image || "https://placeholder.com" }}
              style={[styles.poster, { height: cardWidth * 1.5 }]}
              resizeMode="cover"
            />
            <Text style={styles.gameName} numberOfLines={2}>{game.name}</Text>
            <Text style={styles.gameYear}>{releaseYear}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

export function HomeScreen() {
  return (
    <DashboardLayout>
      <WelcomeContent />
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 20,
    paddingTop: 16,
  },
  sectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
    paddingBottom: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#A28389",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "400",
  },
  columnWrapper: {
    gap: 16,
    marginBottom: 16,
  },
  card: {
    flexDirection: "column",
  },
  poster: {
    width: "100%",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  gameName: {
    color: "#F7F4F5",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 10,
  },
  gameYear: {
    fontSize: 12,
    color: "#8A6D73",
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    padding: 40,
    color: "#8A6D73",
  },
});