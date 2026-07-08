import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useFadeUp } from "../hooks/useFadeUp";
import { DashboardLayout } from "../components/DashboardLayout";
import Svg, { Rect, Line, Circle, Polygon, Path, Polyline } from "react-native-svg";

// ── SVG Icons ────────────────────────────────────────────────────────────────

function IconLogs() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={5} y={2} width={14} height={20} rx={2} />
      <Line x1={9} y1={7} x2={15} y2={7} />
      <Line x1={9} y1={11} x2={15} y2={11} />
      <Line x1={9} y1={15} x2={12} y2={15} />
    </Svg>
  );
}

function IconStar() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </Svg>
  );
}

function IconSearch() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={11} cy={11} r={8} />
      <Line x1={21} y1={21} x2={16.65} y2={16.65} />
    </Svg>
  );
}

function IconCommunity() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={9} cy={7} r={4} />
      <Path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <Path d="M21 21v-2a4 4 0 0 0-3-3.85" />
    </Svg>
  );
}

function IconQuickLog() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </Svg>
  );
}

function IconProfile() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </Svg>
  );
}

function IconStats() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={18} y1={20} x2={18} y2={10} />
      <Line x1={12} y1={20} x2={12} y2={4} />
      <Line x1={6} y1={20} x2={6} y2={14} />
    </Svg>
  );
}

function IconVaults() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={2} y={4} width={20} height={16} rx={2} />
      <Circle cx={12} cy={12} r={3} />
      <Path d="M12 9v-2" />
      <Line x1={19} y1={8} x2={19} y2={8.5} />
      <Line x1={19} y1={11} x2={19} y2={16} />
    </Svg>
  );
}

function IconHallOfFame() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 9 C9 9 6 7 7 4.5 C8 2 11 3 12 5" />
      <Path d="M12 9 C15 9 18 7 17 4.5 C16 2 13 3 12 5" />
      <Circle cx={12} cy={9} r={1.2} />
      <Path d="M11 10 L7 16 L9 15 L8 19" />
      <Path d="M13 10 L17 16 L15 15 L16 19" />
    </Svg>
  );
}

function IconUpcoming() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={4} width={18} height={18} rx={2} />
      <Line x1={16} y1={2} x2={16} y2={6} />
      <Line x1={8} y1={2} x2={8} y2={6} />
      <Line x1={3} y1={10} x2={21} y2={10} />
      <Path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </Svg>
  );
}

// ── Feature data ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: IconLogs,
    title: "Game Logging",
    desc: "Log games as Playing, Completed, Dropped, or Want to Play. Your collection, your way.",
  },
  {
    Icon: IconStar,
    title: "Reviews & Ratings",
    desc: "Write personal reviews and rate games. Revisit your opinions as your tastes evolve.",
  },
  {
    Icon: IconSearch,
    title: "Discover Games",
    desc: "Browse trending titles and search a massive database of games across all platforms and eras.",
  },
  {
    Icon: IconCommunity,
    title: "Community Reviews",
    desc: "See what other players are saying. Read community reviews and find your next obsession.",
  },
  {
    Icon: IconQuickLog,
    title: "Quick Log",
    desc: "Log a game in seconds without breaking your flow. Fast, minimal, no friction.",
  },
  {
    Icon: IconProfile,
    title: "Your Profile",
    desc: "A clean profile page that showcases your gaming history, stats, and reviews at a glance.",
  },
  {
    Icon: IconStats,
    title: "Your Stats",
    desc: "Dive into your personal gaming data — activity charts, rating distributions, genre breakdowns, platform stats, and more.",
  },
  {
    Icon: IconVaults,
    title: "Vaults",
    desc: "Curate themed game collections called Vaults. Share them with the community, save others' Vaults, and discover new favourites.",
  },
  {
    Icon: IconHallOfFame,
    title: "Hall of Fame",
    desc: "Explore the greatest games ever made — ranked by Metacritic score, community rating, and popularity worldwide.",
  },
  {
    Icon: IconUpcoming,
    title: "Upcoming Games",
    desc: "Browse the most anticipated upcoming releases. See countdowns, genres, and platforms — and jump straight to any game's page.",
  },
];

// ── Screen ────────────────────────────────────────────────────────────────────

export function AboutScreen() {
  const { opacity, translateY } = useFadeUp();

  return (
    <DashboardLayout>
      <Animated.ScrollView
        style={[styles.scroll, { opacity, transform: [{ translateY }] }]}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>About</Text>
          <Text style={styles.title}>Checkpoint</Text>
          <Text style={styles.subtitle}>Your personal video game journal.</Text>
        </View>

        {/* ── DIVIDER ── */}
        <View style={styles.gradientDivider} />

        {/* ── WHAT IS CHECKPOINT ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>What is Checkpoint?</Text>
          <Text style={styles.bodyText}>
            Checkpoint is a video game logging application built for people who take their gaming seriously.
            Keep a living record of every game you've played, every game you're playing right now, and every
            title sitting on your backlog. Think of it as your personal gaming diary — organised, searchable,
            and always with you.
          </Text>
        </View>

        {/* ── FEATURES ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Features</Text>
          <View style={styles.grid}>
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} Icon={f.Icon} title={f.title} desc={f.desc} />
            ))}
          </View>
        </View>

        {/* ── BUILT FOR GAMERS ── */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionLabel}>Built for Gamers</Text>
          <Text style={styles.bodyText}>
            Whether you finish every side quest or speedrun to the credits, Checkpoint fits your style.
            No bloat, no noise — just a clean space to track the games that matter to you.
          </Text>
        </View>

        {/* ── BOTTOM DIVIDER ── */}
        <View style={styles.simpleDivider} />

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Game data, metadata, and cover art are sourced from the{" "}
            <Text
              style={styles.footerLink}
              onPress={() => Linking.openURL("https://rawg.io")}
            >
              RAWG Video Games Database
            </Text>
            . All game information and images are the property of their respective owners.
          </Text>

          <Text style={[styles.footerText, { marginTop: 8 }]}>
            Facing a problem or have a suggestion? Email us at{" "}
            <Text
              style={styles.footerLink}
              onPress={() => Linking.openURL("mailto:thecheckpointapp@gmail.com")}
            >
              thecheckpointapp@gmail.com
            </Text>
          </Text>

          <Text style={[styles.footerText, { marginTop: 12 }]}>
            © {new Date().getFullYear()} Checkpoint
          </Text>
        </View>
      </Animated.ScrollView>
    </DashboardLayout>
  );
}

// ── Feature Card ──────────────────────────────────────────────────────────────

function FeatureCard({
  Icon,
  title,
  desc,
}: {
  Icon: React.FC;
  title: string;
  desc: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Icon />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc}>{desc}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#0D0204",
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },

  // Header
  headerBlock: {
    marginBottom: 32,
  },
  eyebrow: {
    fontSize: 11,
    color: "#9E1B32",
    textTransform: "uppercase",
    letterSpacing: 3,
    fontWeight: "600",
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#F7F4F5",
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#A28389",
    letterSpacing: 0.3,
  },

  // Dividers
  gradientDivider: {
    height: 1,
    backgroundColor: "#9E1B32",
    opacity: 0.5,
    marginBottom: 32,
  },
  simpleDivider: {
    height: 1,
    backgroundColor: "#28070F",
    marginBottom: 24,
  },

  // Section
  section: {
    marginBottom: 36,
  },
  sectionLabel: {
    fontSize: 11,
    color: "#9E1B32",
    textTransform: "uppercase",
    letterSpacing: 3,
    fontWeight: "600",
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 15,
    color: "#C9B8BB",
    lineHeight: 26,
  },

  // Feature grid — single column on mobile, two columns if wide enough
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    // ~half width on phone minus gap/padding
    width: "47.5%",
    backgroundColor: "rgba(22,4,8,0.8)",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 10,
    padding: 16,
  },
  cardIcon: {
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F7F4F5",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  cardDesc: {
    fontSize: 12,
    color: "#8A6D73",
    lineHeight: 18,
  },

  // Footer
  footer: {
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#5C3D42",
    lineHeight: 20,
  },
  footerLink: {
    color: "#9E1B32",
    fontWeight: "600",
  },
});