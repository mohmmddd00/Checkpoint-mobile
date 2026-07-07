import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet,
} from "react-native";
import Svg, { Circle, Text as SvgText, Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { DashboardLayout } from "../components/DashboardLayout";
import { FloppyDiskIcon } from "../components/FloppyDiskIcon";
import { StatsPageSkeleton } from "../LoadingScreens/StatsPageSkeleton";
import { useStats, type UserStats, type MonthEntry, type YearEntry, type MostLikedReview, type MostSavedVault } from "../hooks/useStats";
import { useFadeUp } from "../hooks/useFadeUp";
import { Animated } from "react-native";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────

const C = {
  bg:          "#0D0204",
  border:      "#28070F",
  crimson:     "#9E1B32",
  crimsonMid:  "#C2566A",
  crimsonSoft: "#E6A1B0",
  text:        "#F7F4F5",
  textMuted:   "#C2A8AE",
  textDim:     "#A28389",
  textFaint:   "#8A6D73",
  textGhost:   "#5C1222",
  overlay:     "rgba(158,27,50,0.12)",
};

// ─── SECTION LABEL ────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <Text style={s.sectionLabel}>{text}</Text>
  );
}

function SectionHeading({ text }: { text: string }) {
  return (
    <View style={s.sectionHeadingRow}>
      <Text style={s.sectionHeadingText}>{text}</Text>
    </View>
  );
}

// ─── CARD ─────────────────────────────────────────────────────────────────────

function Card({ children, style = {} }: { children: React.ReactNode; style?: object }) {
  return <View style={[s.card, style]}>{children}</View>;
}

// ─── STAT PILL ────────────────────────────────────────────────────────────────

function StatPill({ value, label, accent = false }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <View style={[s.pill, accent && s.pillAccent]}>
      <Text style={[s.pillValue, accent && s.pillValueAccent]}>{value}</Text>
      <Text style={s.pillLabel}>{label}</Text>
    </View>
  );
}

// ─── HORIZONTAL BAR ───────────────────────────────────────────────────────────

function HBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = (count / Math.max(max, 1)) * 100;
  return (
    <View>
      <View style={s.hbarLabelRow}>
        <Text style={s.hbarLabel}>{label}</Text>
        <Text style={s.hbarCount}>{count}</Text>
      </View>
      <View style={s.hbarTrack}>
        <View style={[s.hbarFill, { width: `${pct}%` as any }]} />
      </View>
    </View>
  );
}

// ─── GAME HIGHLIGHT CARD ──────────────────────────────────────────────────────

function GameHighlightCard({ game, label }: {
  game: { title: string; rating: number; coverImage: string | null };
  label: string;
}) {
  return (
    <View style={s.highlightCard}>
      <View style={s.highlightCover}>
        {game.coverImage
          ? <Image source={{ uri: game.coverImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <Text style={{ fontSize: 18 }}>🎮</Text>}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.highlightLabel}>{label.toUpperCase()}</Text>
        <Text style={s.highlightTitle} numberOfLines={1}>{game.title}</Text>
        <Text style={s.highlightRating}>★ {game.rating}/10</Text>
      </View>
    </View>
  );
}

// ─── ACTIVITY SPARKLINE ───────────────────────────────────────────────────────

function ActivitySparkline({ data }: { data: MonthEntry[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <Card>
      <SectionLabel text="Games Logged — Last 12 Months" />
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, height: 100 }}>
        {data.map((d, i) => {
          const pct = (d.count / max) * 100;
          const isActive = activeIdx === i;
          return (
            <TouchableOpacity
              key={d.key}
              style={{ flex: 1, height: "100%", alignItems: "center", justifyContent: "flex-end" }}
              activeOpacity={1}
              onPressIn={() => setActiveIdx(i)}
              onPressOut={() => setActiveIdx(null)}
            >
              {isActive && d.count > 0 && (
                <Text style={s.barTooltip}>{d.count}</Text>
              )}
              <View style={[
                s.sparkBar,
                {
                  height: `${Math.max(pct, d.count > 0 ? 3 : 1)}%` as any,
                  backgroundColor: isActive ? C.crimsonSoft : d.count > 0 ? C.crimsonMid : "rgba(255,255,255,0.03)",
                },
              ]} />
              <Text style={[s.barAxisLabel, isActive && { color: C.crimsonSoft }]}>
                {d.label.split(" ")[0].slice(0, 3)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
  );
}

// ─── YEARLY CHART ─────────────────────────────────────────────────────────────

function YearlyChart({ data }: { data: YearEntry[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  if (data.length === 0) return null;

  return (
    <Card style={{ marginBottom: 12 }}>
      <SectionLabel text="All-Time Activity by Year" />
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, height: 100 }}>
        {data.map((d, i) => {
          const pct = (d.count / max) * 100;
          const isActive = activeIdx === i;
          return (
            <TouchableOpacity
              key={d.year}
              style={{ flex: 1, height: "100%", alignItems: "center", justifyContent: "flex-end" }}
              activeOpacity={1}
              onPressIn={() => setActiveIdx(i)}
              onPressOut={() => setActiveIdx(null)}
            >
              {isActive && (
                <Text style={s.barTooltip}>{d.count}</Text>
              )}
              <View style={[
                s.sparkBar,
                {
                  height: `${Math.max(pct, 3)}%` as any,
                  backgroundColor: isActive ? C.crimsonSoft : C.crimsonMid,
                },
              ]} />
              <Text style={[s.barAxisLabel, isActive && { color: C.crimsonSoft }]}>
                {d.year}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
  );
}

// ─── RATING DISTRIBUTION ──────────────────────────────────────────────────────

function RatingDistributionChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <Card>
      <SectionLabel text="Rating Distribution" />
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 120 }}>
        {data.map((d, i) => {
          const pct = (d.count / max) * 100;
          const opacity = 0.3 + (i / (data.length - 1)) * 0.7;
          return (
            <View key={d.label} style={{ flex: 1, height: "100%", alignItems: "center", justifyContent: "flex-end" }}>
              {d.count > 0 && (
                <Text style={[s.barAxisLabel, { marginBottom: 4 }]}>{d.count}</Text>
              )}
              <View style={[
                s.sparkBar,
                {
                  height: `${Math.max(pct, d.count > 0 ? 4 : 1)}%` as any,
                  backgroundColor: d.count > 0
                    ? `rgba(158,27,50,${opacity})`
                    : "rgba(255,255,255,0.03)",
                },
              ]} />
              <Text style={s.barAxisLabel}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

// ─── STATUS RING ──────────────────────────────────────────────────────────────

function StatusRing({ completed, playing, dropped }: { completed: number; playing: number; dropped: number }) {
  const total = completed + playing + dropped || 1;
  const r = 44;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;

  const segments = [
    { label: "Completed", count: completed, color: C.crimson },
    { label: "Playing",   count: playing,   color: C.crimsonMid },
    { label: "Dropped",   count: dropped,   color: "#380B14" },
  ];

  let offset = 0;
  const arcs = segments.map((seg) => {
    const frac = seg.count / total;
    const dash = frac * circumference;
    const gap  = circumference - dash;
    const arc  = { ...seg, dash, gap, offset };
    offset += dash;
    return arc;
  });

  return (
    <Card style={{ marginBottom: 12 }}>
      <SectionLabel text="Status Breakdown" />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
        <Svg width={120} height={120} style={{ flexShrink: 0 }}>
          <Circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={12} />
          {arcs.map((arc) =>
            arc.count > 0 ? (
              <Circle
                key={arc.label}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={arc.color}
                strokeWidth={12}
                strokeDasharray={`${arc.dash} ${arc.gap}`}
                strokeDashoffset={-arc.offset}
                rotation={-90}
                origin={`${cx}, ${cy}`}
              />
            ) : null
          )}
          <SvgText x={cx} y={cy - 4} textAnchor="middle" fill={C.text} fontSize={18} fontWeight="800">
            {total}
          </SvgText>
          <SvgText x={cx} y={cy + 12} textAnchor="middle" fill={C.textFaint} fontSize={9} fontWeight="600">
            GAMES
          </SvgText>
        </Svg>
        <View style={{ flex: 1, gap: 12 }}>
          {segments.map((seg) => (
            <View key={seg.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: seg.color, flexShrink: 0 }} />
              <Text style={[s.hbarLabel, { flex: 1 }]}>{seg.label}</Text>
              <Text style={s.hbarCount}>{seg.count}</Text>
              <Text style={[s.hbarCount, { minWidth: 36, textAlign: "right", fontSize: 11, color: C.textGhost }]}>
                {Math.round((seg.count / total) * 100)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

// ─── RECENT ACTIVITY ──────────────────────────────────────────────────────────

function RecentActivityList({ entries }: { entries: UserStats["recentActivity"] }) {
  const STATUS_DOT: Record<string, string> = {
    Completed: C.crimson,
    Playing:   C.crimsonMid,
    Dropped:   "#4A0F1A",
  };

  return (
    <Card>
      <SectionLabel text="Logs" />
      <View style={{ gap: 10 }}>
        {entries.map((e, i) => (
          <View key={e._id} style={[
            s.recentRow,
            i % 2 === 0 && s.recentRowAlt,
          ]}>
            <View style={s.recentCover}>
              {e.coverImage
                ? <Image source={{ uri: e.coverImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                : <Text style={{ fontSize: 12 }}>🎮</Text>}
            </View>
            <View style={{ flex: 1, minWidth: 0, marginLeft: 14 }}>
              <Text style={s.recentTitle} numberOfLines={1}>{e.title}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: STATUS_DOT[e.status] || C.textFaint }} />
                <Text style={s.recentMeta}>{e.status}</Text>
                <Text style={{ color: "#28070F", fontSize: 11 }}>·</Text>
                <Text style={s.recentMeta}>{e.platform}</Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
              <Text style={s.recentRating}>★ {e.rating}</Text>
              <Text style={s.recentDate}>
                {new Date(e.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

// ─── MOST LIKED REVIEW CARD ───────────────────────────────────────────────────

function MostLikedReviewCard({ data }: { data: MostLikedReview }) {
  return (
    <Card style={{ flex: 1, marginBottom: 12 }}>
      <SectionLabel text="Most Liked Review" />
      <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
        <View style={s.popularityCover}>
          {data.coverImage
            ? <Image source={{ uri: data.coverImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            : <Text style={{ fontSize: 14 }}>🎮</Text>}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.popularityTitle} numberOfLines={1}>{data.title}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 3 }}>
            <Text style={s.recentRating}>★ {data.rating}/10</Text>
            <View style={s.badge}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#E6A1B0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </Svg>
              <Text style={s.badgeText}> {data.likeCount} {data.likeCount === 1 ? "like" : "likes"}</Text>
            </View>
          </View>
        </View>
      </View>
      <Text style={s.popularityReview} numberOfLines={2}>"{data.review}"</Text>
    </Card>
  );
}

// ─── MOST SAVED VAULT CARD ────────────────────────────────────────────────────

function MostSavedVaultCard({ data }: { data: MostSavedVault }) {
  return (
    <Card style={{ flex: 1 }}>
      <SectionLabel text="Most Saved Vault" />
      <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
        <View style={s.popularityCover}>
          {data.games[0]?.coverImage
            ? <Image source={{ uri: data.games[0].coverImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            : <View style={{ flex: 1, backgroundColor: "#160408" }} />}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.popularityTitle} numberOfLines={1}>{data.title}</Text>
          <View style={[s.badge, { marginTop: 4, alignSelf: "flex-start" }]}>
            <FloppyDiskIcon filled size={12} />
            <Text style={s.badgeText}> {data.saveCount} {data.saveCount === 1 ? "save" : "saves"}</Text>
          </View>
        </View>
      </View>
      <Text style={s.popularityDesc}>
        You have great taste — {data.saveCount} {data.saveCount === 1 ? "other player agrees" : "other players agree"}!
      </Text>
    </Card>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={s.emptyState}>
      <Text style={s.emptyIcon}>📊</Text>
      <Text style={s.emptyTitle}>No stats yet</Text>
      <Text style={s.emptySubtitle}>Log some games to see your stats come to life.</Text>
    </View>
  );
}

// ─── STATS CONTENT ────────────────────────────────────────────────────────────

function StatsContent() {
  const navigation = useNavigation<Nav>();
  const { stats, loading, error } = useStats();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={s.backBtn}>
        <Text style={s.backText}>← Back to profile</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={{ marginBottom: 28 }}>
        <Text style={s.pageTitle}>Your Stats</Text>
        <Text style={s.pageSubtitle}>Everything you've played, logged, and rated — in one place.</Text>
      </View>

      {loading ? (
        <StatsPageSkeleton />
      ) : error || !stats ? (
        <View style={s.emptyState}>
          <Text style={s.emptySubtitle}>{error ?? "Something went wrong."}</Text>
        </View>
      ) : stats.totalLogged === 0 ? (
        <EmptyState />
      ) : (
        <StatsData stats={stats} />
      )}
    </ScrollView>
  );
}

function StatsData({ stats }: { stats: UserStats }) {
  const { opacity, translateY } = useFadeUp();

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {/* ── OVERVIEW PILLS ── */}
      <View style={s.section}>
        <SectionHeading text="Overview" />
        <View style={s.pillsGrid}>
          <StatPill value={stats.totalLogged}             label="Games Logged" accent />
          <StatPill value={stats.completed}               label="Completed" />
          <StatPill value={stats.playing}                 label="Playing" />
          <StatPill value={stats.dropped}                 label="Dropped" />
          <StatPill value={stats.averageRating ?? "—"}   label="Avg Rating" />
          <StatPill value={stats.totalReviews}            label="Reviews Written" />
          <StatPill value={stats.mostActiveMonth ?? "—"} label="Best Month" />
          <StatPill value={stats.mostActiveYear ?? "—"}  label="Best Year" />
          <StatPill value={stats.favoriteGenre ?? "—"}   label="Fav Genre" accent />
        </View>
      </View>

      {/* ── HIGHLIGHTS ── */}
      {(stats.highestRated || stats.lowestRated) && (
        <View style={s.section}>
          <SectionHeading text="Highlights" />
          <Card>
            {stats.highestRated && <GameHighlightCard game={stats.highestRated} label="Highest Rated" />}
            {stats.lowestRated && stats.lowestRated.title !== stats.highestRated?.title && (
              <View style={{ marginTop: 12 }}>
                <GameHighlightCard game={stats.lowestRated} label="Lowest Rated" />
              </View>
            )}
          </Card>
        </View>
      )}

      {/* ── ACTIVITY ── */}
      <View style={s.section}>
        <SectionHeading text="Activity" />
        <ActivitySparkline data={stats.activityByMonth} />
      </View>

      {/* ── YEARLY + RATING ── */}
      <View style={s.section}>
        {stats.activityByYear.length > 1 && <YearlyChart data={stats.activityByYear} />}
        <RatingDistributionChart data={stats.ratingDistribution} />
      </View>

      {/* ── BREAKDOWN ── */}
      <View style={s.section}>
        <SectionHeading text="Breakdown" />
        <StatusRing
          completed={stats.statusBreakdown.Completed}
          playing={stats.statusBreakdown.Playing}
          dropped={stats.statusBreakdown.Dropped}
        />
        <Card style={{ marginBottom: 12 }}>
          <SectionLabel text="Platform Breakdown" />
          {stats.platformBreakdown.length === 0 ? (
            <Text style={{ color: C.textGhost, fontSize: 13 }}>No platform data.</Text>
          ) : (
            <View style={{ gap: 16 }}>
              {stats.platformBreakdown.slice(0, 6).map((p) => (
                <HBar key={p.platform} label={p.platform} count={p.count} max={stats.platformBreakdown[0].count} />
              ))}
            </View>
          )}
        </Card>
        {stats.genreBreakdown.length > 0 && (
          <Card>
            <SectionLabel text="Genre Breakdown" />
            <View style={{ gap: 16 }}>
              {stats.genreBreakdown.slice(0, 8).map((g) => (
                <HBar key={g.genre} label={g.genre} count={g.count} max={stats.genreBreakdown[0].count} />
              ))}
            </View>
          </Card>
        )}
      </View>

      {/* ── RECENT ACTIVITY ── */}
      {stats.recentActivity.length > 0 && (
        <View style={s.section}>
          <SectionHeading text="Recent Activity" />
          <RecentActivityList entries={stats.recentActivity} />
        </View>
      )}

      {/* ── POPULARITY ── */}
      {(stats.mostLikedReview || stats.mostSavedVault) && (
        <View style={s.section}>
          <SectionHeading text="Popularity" />
          {stats.mostLikedReview && <MostLikedReviewCard data={stats.mostLikedReview} />}
          {stats.mostSavedVault  && <MostSavedVaultCard  data={stats.mostSavedVault} />}
        </View>
      )}
    </Animated.View>
  );
}

// ─── SCREEN EXPORT ────────────────────────────────────────────────────────────

export function StatsScreen() {
  return (
    <DashboardLayout>
      <StatsContent />
    </DashboardLayout>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 28, paddingBottom: 80 },
  backBtn: { paddingBottom: 24 },
  backText: { color: C.textFaint, fontSize: 13 },
  pageTitle: { color: C.text, fontSize: 22, fontWeight: "800", letterSpacing: 0.2, marginBottom: 6 },
  pageSubtitle: { color: C.textGhost, fontSize: 14 },
  section: { marginBottom: 24 },

  sectionHeadingRow: { borderBottomWidth: 1, borderBottomColor: "#28070F", paddingBottom: 10, marginBottom: 16 },
  sectionHeadingText: { color: C.textDim, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: "600" },
  sectionLabel: { color: C.textDim, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: "700", marginBottom: 16 },

  card: { backgroundColor: "#160408", borderWidth: 1, borderColor: "#28070F", borderRadius: 14, padding: 20 },

  pillsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pill: { backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1, borderColor: "#28070F", borderRadius: 12, padding: 16, flex: 1, minWidth: 110 },
  pillAccent: { backgroundColor: C.overlay, borderColor: "rgba(158,27,50,0.35)" },
  pillValue: { color: C.text, fontSize: 24, fontWeight: "800", lineHeight: 28 },
  pillValueAccent: { color: C.crimsonSoft },
  pillLabel: { color: C.textFaint, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.9, fontWeight: "600", marginTop: 6 },

  hbarLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  hbarLabel: { color: C.textMuted, fontSize: 13 },
  hbarCount: { color: C.textFaint, fontSize: 13, fontWeight: "600" },
  hbarTrack: { height: 5, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" },
  hbarFill: { height: "100%", backgroundColor: C.crimson, borderRadius: 3 },

  highlightCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.01)", borderWidth: 1, borderColor: "#28070F", borderRadius: 10, padding: 14, gap: 14 },
  highlightCover: { width: 44, height: 60, borderRadius: 6, overflow: "hidden", flexShrink: 0, backgroundColor: "#160408", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  highlightLabel: { color: C.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600", marginBottom: 4 },
  highlightTitle: { color: C.text, fontSize: 13, fontWeight: "700" },
  highlightRating: { color: C.crimson, fontSize: 12, fontWeight: "700", marginTop: 3 },

  sparkBar: { width: "100%", borderRadius: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  barTooltip: { color: C.crimsonSoft, fontSize: 10, fontWeight: "700", marginBottom: 3 },
  barAxisLabel: { color: C.textGhost, fontSize: 9, marginTop: 4, letterSpacing: 0.3 },

  recentRow: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "transparent" },
  recentRowAlt: { backgroundColor: "rgba(255,255,255,0.01)", borderColor: "#28070F" },
  recentCover: { width: 32, height: 44, borderRadius: 4, overflow: "hidden", backgroundColor: "#160408", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  recentTitle: { color: C.text, fontSize: 13, fontWeight: "700" },
  recentMeta: { color: C.textFaint, fontSize: 11 },
  recentRating: { color: C.crimson, fontSize: 13, fontWeight: "700" },
  recentDate: { color: C.textGhost, fontSize: 10 },

  popularityCover: { width: 32, height: 44, borderRadius: 4, overflow: "hidden", flexShrink: 0, backgroundColor: "#160408", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  popularityTitle: { color: C.text, fontSize: 13, fontWeight: "700" },
  popularityReview: { color: C.textMuted, fontSize: 12, lineHeight: 20, marginTop: 14, fontStyle: "italic" },
  popularityDesc: { color: C.textGhost, fontSize: 12, lineHeight: 20, marginTop: 14, fontStyle: "italic" },
  badge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(158,27,50,0.12)", borderWidth: 1, borderColor: "rgba(158,27,50,0.4)", borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },
  badgeText: { color: C.crimsonSoft, fontSize: 13, fontWeight: "700" },

  emptyState: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 40, opacity: 0.4, marginBottom: 16 },
  emptyTitle: { color: C.textDim, fontSize: 16, fontWeight: "600", marginBottom: 8 },
  emptySubtitle: { color: C.textGhost, fontSize: 14, textAlign: "center" },
});