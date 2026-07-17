import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DashboardLayout } from "../components/DashboardLayout";
import { LogCardMenu } from "../components/LogCardMenu";
import { LogsScreenSkeleton } from "../LoadingScreens/LogsPageSkeleton";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface LoggedGame {
  id: string;
  name: string;
  released: string;
  background_image: string | null;
  rating: number | null;
  platform: string;
  status: string;
  review: string;
}

interface MonthGroup {
  label: string;
  sortValue: number;
  entries: { day: string; game: LoggedGame }[];
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function ordinal(n: string): string {
  const num = parseInt(n, 10);
  if (isNaN(num)) return n;
  const s = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return num + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function buildMonthGroups(logs: LoggedGame[]): MonthGroup[] {
  const map: Record<string, MonthGroup> = {};
  logs.forEach((game) => {
    const parts = game.released !== "TBA" ? game.released.split(" ") : null;
    const key = parts ? `${parts[2]}-${parts[1]}` : "unknown";
    const label = parts ? `${parts[1]} ${parts[2]}` : "Unknown Date";
    const sortValue = parts ? new Date(`${parts[1]} 1, ${parts[2]}`).getTime() : 0;
    const day = parts ? parts[0] : "?";
    if (!map[key]) map[key] = { label, sortValue, entries: [] };
    map[key].entries.push({ day, game });
  });
  return Object.values(map).sort((a, b) => b.sortValue - a.sortValue);
}

// ─── GAME CARD ────────────────────────────────────────────────────────────────

function GameCard({
  day,
  game,
  onDeleted,
  onEdited,
}: {
  day: string;
  game: LoggedGame;
  onDeleted: (id: string) => void;
  onEdited: (id: string, updated: Partial<LoggedGame>) => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <View style={s.cardWrap}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          s.posterWrap,
          pressed && s.posterWrapPressed,
        ]}
      >
        {game.background_image ? (
          <Image
            source={{ uri: game.background_image }}
            style={[s.posterImg, pressed && s.posterImgPressed]}
            resizeMode="cover"
          />
        ) : (
          <View style={s.posterFallback}>
            <Text style={s.posterEmoji}>🎮</Text>
          </View>
        )}

        {/* Rating overlay on press */}
        {pressed && (
          <View style={s.ratingOverlay}>
            <Text style={s.ratingOverlayStar}>★</Text>
            <Text style={s.ratingOverlayValue}>{game.rating}/10</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={s.cardMeta}>
        <Text
          style={[s.cardTitle, pressed && s.cardTitlePressed]}
          numberOfLines={2}
        >
          {game.name}
        </Text>
        <View style={s.cardDateRow}>
          <Text style={s.cardDate}>
            {day === "?" ? "Unknown date" : `Logged: ${ordinal(day)}`}
          </Text>
          <LogCardMenu
            log={{ id: game.id, name: game.name, platform: game.platform, status: game.status, rating: game.rating, review: game.review }}
            onDeleted={onDeleted}
            onEdited={onEdited}
          />
        </View>
      </View>
    </View>
  );
}

// ─── MONTH GROUP ROW ─────────────────────────────────────────────────────────

function MonthGroupRow({
  group,
  onDeleted,
  onEdited,
}: {
  group: MonthGroup;
  onDeleted: (id: string) => void;
  onEdited: (id: string, updated: Partial<LoggedGame>) => void;
}) {
  const [month, year] = group.label.split(" ");

  return (
    <View style={s.groupRow}>
      {/* Month label */}
      <View style={s.monthCol}>
        <Text style={s.monthName}>{month}</Text>
        <Text style={s.monthYear}>{year}</Text>
      </View>

      {/* Vertical divider */}
      <View style={s.vDivider} />

      {/* Games grid */}
      <View style={s.grid}>
        {group.entries.map(({ day, game }) => (
          <GameCard
            key={game.id}
            day={day}
            game={game}
            onDeleted={onDeleted}
            onEdited={onEdited}
          />
        ))}
      </View>
    </View>
  );
}

// ─── CONTENT ─────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 24;

function LogsContent() {
  const [logs, setLogs] = useState<LoggedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logSearch, setLogSearch] = useState("");
  const isFetchingRef = useRef(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  const formatLog = (log: any, index: number): LoggedGame => {
    const displayDate = log.timestamp
      ? new Date(log.timestamp).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "TBA";
    return {
      id: log._id || `log-${index}`,
      name: log.title,
      released: displayDate,
      background_image: log.coverImage || null,
      rating: log.rating ?? null,
      platform: log.platform || "",
      status: log.status || "",
      review: log.review || "",
    };
  };

  const fetchPage = async (pageNum: number, isFirst: boolean) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (isFirst) setLoading(true); else setLoadingMore(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/gamelogs/paginated?page=${pageNum}&limit=${PAGE_LIMIT}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed fetching logs");
      const data = await res.json();
      const formatted = data.logs.map((log: any, i: number) => formatLog(log, i));
      setLogs((prev) => isFirst ? formatted : [...prev, ...formatted]);
      setHasMore(data.hasMore);
      setTotalLogs(data.total);
      setPage(pageNum);
    } catch (err) {
      console.error("Error loading logs:", err);
    } finally {
      if (isFirst) {
        setLoading(false);
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]).start();
      } else {
        setLoadingMore(false);
      }
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchPage(1, true);
  }, []);

  const handleDeleted = (id: string) => {
    setLogs((prev) => prev.filter((g) => g.id !== id));
    setTotalLogs((prev) => prev - 1);
  };

  const handleEdited = (id: string, updated: Partial<LoggedGame>) => {
    setLogs((prev) => prev.map((g) => g.id === id ? { ...g, ...updated } : g));
  };

  const [searchResults, setSearchResults] = useState<LoggedGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!logSearch.trim()) { setSearchResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(
          `${API_URL}/gamelogs/search?q=${encodeURIComponent(logSearch.trim())}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        const formatted = data.map((log: any, i: number) => formatLog(log, i));
        setSearchResults(formatted);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [logSearch]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 750, useNativeDriver: true })
    );
    if (loadingMore || isSearching) loop.start();
    else { loop.stop(); spinAnim.setValue(0); }
    return () => loop.stop();
  }, [loadingMore, isSearching]);

  const filteredLogs = logSearch.trim() ? searchResults : logs;
  const monthGroups = buildMonthGroups(filteredLogs);

  if (loading) {
    return <LogsScreenSkeleton />;
  }

  return (
    <Animated.View style={[{ flex: 1 }, { opacity, transform: [{ translateY }] }]}>
      <FlatList
        data={monthGroups}
        keyExtractor={(item) => item.label}
        contentContainerStyle={s.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            {/* Heading */}
            <Text style={s.heading}>
              {logSearch ? `Results for "${logSearch}"` : "My Logs"}
            </Text>
            <Text style={s.subheading}>
              {logSearch
                ? isSearching
                  ? "Searching..."
                  : `${searchResults.length} result${searchResults.length === 1 ? "" : "s"} for "${logSearch}"`
                : `${totalLogs} game${totalLogs === 1 ? "" : "s"} logged`}
            </Text>
            <View style={s.divider} />

            {/* Local search */}
            <View style={s.searchWrap}>
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
              <TextInput
                value={logSearch}
                onChangeText={setLogSearch}
                placeholder="Search your logs..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={s.searchInput}
                returnKeyType="search"
              />
              {logSearch.length > 0 && (
                <TouchableOpacity onPress={() => setLogSearch("")}>
                  <Text style={s.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          isSearching || loadingMore ? (
            <View style={s.spinnerWrap}>
              <Animated.View
                style={[
                  s.spinner,
                  {
                    transform: [{
                      rotate: spinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    }],
                  },
                ]}
              />
            </View>
          ) : (
            <View style={s.emptyWrap}>
              <Text style={s.emptyText}>
                {logSearch
                  ? `No logged games match "${logSearch}".`
                  : "You haven't logged any games yet! Use the + button to add some."}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <MonthGroupRow
            group={item}
            onDeleted={handleDeleted}
            onEdited={handleEdited}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 48 }} />}
        onEndReached={() => {
          if (hasMore && !loadingMore && !loading && !logSearch) {
            fetchPage(page + 1, false);
          }
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={s.spinnerWrap}>
              <Animated.View
                style={[
                  s.spinner,
                  {
                    transform: [{
                      rotate: spinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    }],
                  },
                ]}
              />
            </View>
          ) : !hasMore && logs.length > 0 && !logSearch ? (
            <Text style={s.endText}>All {totalLogs} logs loaded</Text>
          ) : null
        }
      />
    </Animated.View>
  );
}

// ─── SCREEN ───────────────────────────────────────────────────────────────────

export function LogsScreen() {
  return (
    <DashboardLayout>
      <LogsContent />
    </DashboardLayout>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  listContent: {
    maxWidth: 750,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 60,
  },

  // Header
  heading: {
    color: "#F7F4F5",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  subheading: {
    color: "#8A6D73",
    fontSize: 13,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#28070F",
    marginBottom: 28,
  },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 28,
    maxWidth: 420,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    paddingVertical: 12,
  },
  searchClear: {
    color: "#6B3A44",
    fontSize: 14,
    padding: 2,
  },

  // Empty
  emptyWrap: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#8A6D73",
    fontSize: 13,
    textAlign: "center",
  },

  // Month group
  groupRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  monthCol: {
    width: 52,
    flexShrink: 0,
    paddingTop: 4,
  },
  monthName: {
    color: "#F7F4F5",
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 21,
  },
  monthYear: {
    color: "#8A6D73",
    fontSize: 12,
    marginTop: 4,
  },
  vDivider: {
    width: 1,
    backgroundColor: "#28070F",
    alignSelf: "stretch",
    flexShrink: 0,
  },

  // Grid
  grid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  cardWrap: {
    width: "46%",
  },

  // Poster
  posterWrap: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "#160408",
    position: "relative",
  },
  posterWrapPressed: {
    borderWidth: 3,
    borderColor: "#9E1B32",
    shadowColor: "#9E1B32",
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  posterImg: {
    width: "100%",
    height: "100%",
  },
  posterImgPressed: {
    opacity: 0.35,
  },
  posterFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  posterEmoji: {
    fontSize: 32,
    color: "#5C1222",
  },
  ratingOverlay: {
    position: "absolute",
    inset: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  ratingOverlayStar: {
    color: "#9E1B32",
    fontSize: 22,
    lineHeight: 24,
  },
  ratingOverlayValue: {
    color: "#9E1B32",
    fontSize: 13,
    fontWeight: "700",
  },

  // Card meta
  cardMeta: {
    marginTop: 6,
  },
  cardTitle: {
    color: "#F7F4F5",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginBottom: 2,
  },
  cardTitlePressed: {
    color: "#E6A1B0",
  },
  cardDateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  cardDate: {
    color: "#8A6D73",
    fontSize: 11,
  },

  // Pagination footer
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