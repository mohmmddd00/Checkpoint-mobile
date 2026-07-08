import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BarChart } from "react-native-chart-kit";
import Svg, { Polygon, Line, Text as SvgText, Circle } from "react-native-svg";
import { DashboardLayout } from "../components/DashboardLayout";
import { useFadeUp } from "../hooks/useFadeUp";
import { RootStackParamList } from "../../App";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const SCREEN_WIDTH = Dimensions.get("window").width;

// ─── Types ────────────────────────────────────────────────────────────────────
interface RAWGGame {
  id: number;
  name: string;
  slug: string;
  metacritic: number | null;
  rating: number;
  ratings_count: number;
  added: number;
  released: string | null;
  background_image: string | null;
  genres: { id: number; name: string }[];
}
interface RAWGGenre { id: number; name: string; games_count: number; }
interface RAWGPlatform { id: number; name: string; games_count: number; }
interface HallData {
  topMeta: RAWGGame[];
  popular: RAWGGame[];
  thisYear: RAWGGame[];
  genres: RAWGGenre[];
  platforms: RAWGPlatform[];
  fanFaves: RAWGGame[];
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const MONO = ["#9E1B32", "#8A1729", "#761320", "#621018", "#4E0D12"];
function rankColor(i: number) { return MONO[Math.min(i, MONO.length - 1)]; }

const cut = (s: string, n: number) => s.length > n ? s.slice(0, n - 1) + "…" : s;
const toSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ─── API ──────────────────────────────────────────────────────────────────────
async function loadAll(): Promise<HallData> {
  const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API_URL}/hall-of-fame`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Server error: ${res.statusText}`);
  return res.json();
}

// ─── Native Bar Chart ─────────────────────────────────────────────────────────
function NativeBar({ data, dataKey, compact = true }: {
  data: any[];
  dataKey: string;
  compact?: boolean;
}) {
  const rows = data.slice(0, 5);
  const chartWidth = SCREEN_WIDTH - 80;
  const barHeight = compact ? 160 : 280;

  const values = rows.map(r => r[dataKey] as number);
  const max = Math.max(...values);

  return (
    <View style={{ marginTop: 4 }}>
      {rows.map((row, i) => {
        const val = row[dataKey] as number;
        const pct = max > 0 ? val / max : 0;
        const barW = Math.max(pct * (chartWidth - 120), 4);
        return (
          <View key={i} style={nbStyles.row}>
            <Text style={nbStyles.label} numberOfLines={1}>
              {cut(row.label ?? row.name ?? "", 16)}
            </Text>
            <View style={nbStyles.barBg}>
              <View style={[nbStyles.bar, { width: barW, backgroundColor: rankColor(i) }]} />
            </View>
            <Text style={nbStyles.val}>
              {typeof val === "number" && val > 9999
                ? `${(val / 1000).toFixed(0)}k`
                : typeof val === "number"
                ? val.toFixed(dataKey === "rating" ? 2 : 0)
                : val}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const nbStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  label: { width: 100, color: "#D4C5C7", fontSize: 11, marginRight: 8 },
  barBg: { flex: 1, height: 10, backgroundColor: "rgba(158,27,50,0.1)", borderRadius: 5, overflow: "hidden" },
  bar: { height: 10, borderRadius: 5 },
  val: { width: 36, color: "#A28389", fontSize: 10, textAlign: "right", marginLeft: 6 },
});

// ─── Native Radar Chart ───────────────────────────────────────────────────────
function NativeRadar({ data }: { data: { name: string; value: number }[] }) {
  const rows = data.slice(0, 7);
  const size = Math.min(SCREEN_WIDTH - 80, 200);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const max = Math.max(...rows.map(d => d.value));
  const n = rows.length;

  const angleOf = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const gridPoints = (scale: number) =>
    rows.map((_, i) => {
      const a = angleOf(i);
      return `${cx + Math.cos(a) * r * scale},${cy + Math.sin(a) * r * scale}`;
    }).join(" ");

  const dataPoints = rows.map((d, i) => {
    const a = angleOf(i);
    const scale = max > 0 ? d.value / max : 0;
    return `${cx + Math.cos(a) * r * scale},${cy + Math.sin(a) * r * scale}`;
  }).join(" ");

  return (
    <View style={{ alignItems: "center", marginTop: 4 }}>
      <Svg width={size} height={size}>
        {/* Grid rings */}
        {[0.33, 0.66, 1].map((s, i) => (
          <Polygon key={i} points={gridPoints(s)} fill="none" stroke="#28070F" strokeWidth={1} />
        ))}
        {/* Spokes */}
        {rows.map((_, i) => {
          const a = angleOf(i);
          return (
            <Line key={i}
              x1={cx} y1={cy}
              x2={cx + Math.cos(a) * r}
              y2={cy + Math.sin(a) * r}
              stroke="#28070F" strokeWidth={1}
            />
          );
        })}
        {/* Data polygon */}
        <Polygon points={dataPoints} fill="#9E1B32" fillOpacity={0.35} stroke="#9E1B32" strokeWidth={1.5} />
        {/* Dots */}
        {rows.map((d, i) => {
          const a = angleOf(i);
          const scale = max > 0 ? d.value / max : 0;
          return (
            <Circle key={i}
              cx={cx + Math.cos(a) * r * scale}
              cy={cy + Math.sin(a) * r * scale}
              r={3} fill="#9E1B32"
            />
          );
        })}
        {/* Labels */}
        {rows.map((d, i) => {
          const a = angleOf(i);
          const lx = cx + Math.cos(a) * (r + 18);
          const ly = cy + Math.sin(a) * (r + 18);
          return (
            <SvgText key={i} x={lx} y={ly + 4}
              fill="#D4C5C7" fontSize={8} textAnchor="middle">
              {cut(d.name, 10)}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

// ─── Chart Card ───────────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, onPress, isLoading, children }: {
  title: string;
  subtitle: string;
  onPress: () => void;
  isLoading: boolean;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={ccStyles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={ccStyles.topBar} />
      <Text style={ccStyles.title}>{title}</Text>
      <Text style={ccStyles.subtitle}>{subtitle}</Text>
      <View style={ccStyles.divider} />
      {isLoading ? (
        <View style={ccStyles.loadingBox}>
          <Text style={ccStyles.loadingText}>LOADING…</Text>
        </View>
      ) : children}
      <Text style={ccStyles.expand}>EXPAND ↗</Text>
    </TouchableOpacity>
  );
}

const ccStyles = StyleSheet.create({
  card: {
    backgroundColor: "#180509",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#9E1B32",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    opacity: 0,
  },
  title: { color: "#FFFFFF", fontSize: 13, fontWeight: "700", letterSpacing: 0.3, marginBottom: 3 },
  subtitle: { color: "#A28389", fontSize: 11, marginBottom: 12 },
  divider: { height: 1, backgroundColor: "#9E1B32", opacity: 0.4, marginBottom: 14 },
  loadingBox: { height: 160, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#5C1222", fontSize: 12, letterSpacing: 1 },
  expand: { color: "#5C1222", fontSize: 11, fontWeight: "600", letterSpacing: 0.5, textAlign: "right", marginTop: 10 },
});

// ─── Rank Table (native) ──────────────────────────────────────────────────────
function RankTable({ rows, cols, onRowPress }: {
  rows: Record<string, any>[];
  cols: { key: string; label: string; fmt?: (v: any) => React.ReactNode }[];
  onRowPress?: (i: number) => void;
}) {
  return (
    <View style={rtStyles.table}>
      {/* Header */}
      <View style={rtStyles.headerRow}>
        <Text style={[rtStyles.headerCell, { width: 28 }]}>#</Text>
        {cols.map(c => (
          <Text key={c.key} style={[rtStyles.headerCell, c.key === "fullName" ? { flex: 1 } : { width: 72 }]}>
            {c.label}
          </Text>
        ))}
      </View>
      {/* Rows */}
      {rows.map((row, i) => (
        <TouchableOpacity
          key={i}
          style={rtStyles.row}
          onPress={() => onRowPress?.(i)}
          activeOpacity={onRowPress ? 0.7 : 1}
          disabled={!onRowPress}
        >
          <Text style={[rtStyles.rankCell, { color: i < 3 ? MONO[i] : "#A28389" }]}>{i + 1}</Text>
          {cols.map(c => (
            <View key={c.key} style={c.key === "fullName" ? { flex: 1 } : { width: 72 }}>
              {c.fmt ? (
                <>{c.fmt(row[c.key])}</>
              ) : (
                <Text style={rtStyles.cell} numberOfLines={2}>{row[c.key]}</Text>
              )}
            </View>
          ))}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const rtStyles = StyleSheet.create({
  table: { marginTop: 20 },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
    paddingBottom: 8,
    marginBottom: 4,
  },
  headerCell: { color: "#A28389", fontSize: 11, fontWeight: "600", paddingHorizontal: 4 },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#160408",
    paddingVertical: 10,
    alignItems: "center",
  },
  rankCell: { width: 28, fontSize: 12, fontWeight: "700", paddingHorizontal: 4 },
  cell: { color: "#D4C5C7", fontSize: 12, paddingHorizontal: 4 },
});

// ─── Expand Modal ─────────────────────────────────────────────────────────────
function ExpandModal({ visible, onClose, title, subtitle, children }: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={emStyles.overlay}>
        <View style={emStyles.sheet}>
          <View style={emStyles.handle} />
          <View style={emStyles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={emStyles.title}>{title}</Text>
              <Text style={emStyles.subtitle}>{subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={emStyles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={emStyles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={emStyles.divider} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const emStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#0D0204",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#28070F",
    padding: 20,
    maxHeight: "90%",
  },
  handle: { width: 40, height: 4, backgroundColor: "#380B14", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  title: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
  subtitle: { color: "#A28389", fontSize: 12, marginTop: 3 },
  closeBtn: { paddingLeft: 12 },
  closeText: { color: "#A28389", fontSize: 18 },
  divider: { height: 1, backgroundColor: "#28070F", marginBottom: 16 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
type Nav = NativeStackNavigationProp<RootStackParamList, "HallOfFame">;

export function HallOfFameScreen() {
  const navigation = useNavigation<Nav>();
  const [data, setData] = useState<HallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const { opacity, translateY } = useFadeUp();

  useEffect(() => {
    loadAll().then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  // ── derived rows ──
  const metaRows = (data?.topMeta ?? []).map(g => ({
    label: cut(g.name, 22), fullName: g.name, slug: g.slug,
    metacritic: g.metacritic ?? 0, rating: g.rating,
    year: g.released?.slice(0, 4) ?? "–",
  }));

  const popRows = (data?.popular ?? []).map(g => ({
    label: cut(g.name, 22), fullName: g.name, slug: g.slug,
    added: g.added, rating: g.rating, year: g.released?.slice(0, 4) ?? "–",
  }));

  const fanRows = (data?.fanFaves ?? []).map(g => ({
    label: cut(g.name, 22), fullName: g.name, slug: g.slug,
    rating: parseFloat(g.rating.toFixed(2)), year: g.released?.slice(0, 4) ?? "–",
  }));

  const genreRows = (data?.genres ?? []).map(g => ({ name: g.name, value: g.games_count }));

  const goToGame = (slug: string) =>
    navigation.navigate("Game", { slug: toSlug(slug), game: null });

  return (
    <DashboardLayout>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Animated.View style={{ opacity, transform: [{ translateY }] }}>
          <Text style={styles.title}>Hall Of Fame</Text>
          <Text style={styles.subtitle}>
            The greatest games ever made — ranked, charted, celebrated.
          </Text>
          <View style={styles.divider} />
        </Animated.View>

        {/* ── Error ── */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              Cannot load charts at the moment. Please try again later.
            </Text>
          </View>
        )}

        {/* ── Cards ── */}
        <Animated.View style={{ opacity, transform: [{ translateY }] }}>

          <ChartCard
            title="Critically Acclaimed"
            subtitle="Top 10 games by Metacritic score"
            onPress={() => setModal("meta")}
            isLoading={loading}
          >
            <NativeBar data={metaRows} dataKey="metacritic" />
          </ChartCard>

          <ChartCard
            title="Most Popular"
            subtitle="Games added to the most libraries worldwide"
            onPress={() => setModal("popular")}
            isLoading={loading}
          >
            <NativeBar data={popRows} dataKey="added" />
          </ChartCard>

          <ChartCard
            title="Fan Favorites"
            subtitle="Highest community-rated games of all time"
            onPress={() => setModal("fan")}
            isLoading={loading}
          >
            <NativeBar data={fanRows} dataKey="rating" />
          </ChartCard>

          <ChartCard
            title="Genre Landscape"
            subtitle="Games by category — radar view"
            onPress={() => setModal("genres")}
            isLoading={loading}
          >
            <NativeRadar data={genreRows} />
          </ChartCard>

        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ══ MODALS ══ */}

      {/* Critically Acclaimed */}
      <ExpandModal
        visible={modal === "meta"}
        onClose={() => setModal(null)}
        title="Critically Acclaimed"
        subtitle="Top 10 by Metacritic score — the industry's gold standard"
      >
        <NativeBar data={metaRows} dataKey="metacritic" compact={false} />
        <RankTable
          rows={metaRows}
          cols={[
            { key: "fullName", label: "Game" },
            { key: "metacritic", label: "Meta", fmt: v => <Text style={{ color: "#9E1B32", fontWeight: "700", fontSize: 12 }}>{v}</Text> },
            { key: "year", label: "Year" },
          ]}
          onRowPress={i => { setModal(null); setTimeout(() => goToGame(metaRows[i]?.slug), 300); }}
        />
      </ExpandModal>

      {/* Most Popular */}
      <ExpandModal
        visible={modal === "popular"}
        onClose={() => setModal(null)}
        title="Most Popular"
        subtitle="Games with the highest library adds worldwide"
      >
        <NativeBar data={popRows} dataKey="added" compact={false} />
        <RankTable
          rows={popRows}
          cols={[
            { key: "fullName", label: "Game" },
            { key: "added", label: "Adds", fmt: v => <Text style={{ color: "#9E1B32", fontWeight: "700", fontSize: 12 }}>{(v / 1000).toFixed(0)}k</Text> },
            { key: "year", label: "Year" },
          ]}
          onRowPress={i => { setModal(null); setTimeout(() => goToGame(popRows[i]?.slug), 300); }}
        />
      </ExpandModal>

      {/* Fan Favorites */}
      <ExpandModal
        visible={modal === "fan"}
        onClose={() => setModal(null)}
        title="Fan Favorites"
        subtitle="Highest community user ratings of all time"
      >
        <NativeBar data={fanRows} dataKey="rating" compact={false} />
        <RankTable
          rows={fanRows}
          cols={[
            { key: "fullName", label: "Game" },
            { key: "rating", label: "Rating", fmt: v => <Text style={{ color: "#F5C842", fontWeight: "700", fontSize: 12 }}>{v} / 5</Text> },
            { key: "year", label: "Year" },
          ]}
          onRowPress={i => { setModal(null); setTimeout(() => goToGame(fanRows[i]?.slug), 300); }}
        />
      </ExpandModal>

      {/* Genre Landscape */}
      <ExpandModal
        visible={modal === "genres"}
        onClose={() => setModal(null)}
        title="Genre Landscape"
        subtitle="Total games available in each top genre"
      >
        <NativeRadar data={genreRows.slice(0, 8)} />
        <RankTable
          rows={genreRows.slice(0, 8).map(g => ({ ...g, fullName: g.name }))}
          cols={[
            { key: "fullName", label: "Genre" },
            { key: "value", label: "Games", fmt: v => <Text style={{ color: "#9E1B32", fontWeight: "700", fontSize: 12 }}>{v.toLocaleString()}</Text> },
          ]}
        />
      </ExpandModal>

    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#0D0204" },
  content: { padding: 20, paddingTop: 32 },
  title: { fontSize: 26, fontWeight: "900", color: "#FFFFFF", letterSpacing: 0.3, marginBottom: 6 },
  subtitle: { color: "#A28389", fontSize: 13, marginBottom: 18 },
  divider: { height: 1, backgroundColor: "rgba(158,27,50,0.4)", marginBottom: 28 },
  errorBox: {
    backgroundColor: "rgba(158,27,50,0.12)",
    borderWidth: 1,
    borderColor: "rgba(158,27,50,0.35)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  errorText: { color: "#E6A1B0", fontSize: 14, textAlign: "center" },
});