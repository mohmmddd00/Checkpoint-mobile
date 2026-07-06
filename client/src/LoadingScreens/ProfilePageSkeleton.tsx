import { View, StyleSheet } from "react-native";

function Bone({ width = "100%" as any, height = 14, borderRadius = 6, style = {} as any }) {
  return (
    <View style={[{ width, height, borderRadius, backgroundColor: "rgba(255,255,255,0.06)" }, style]} />
  );
}

function HeroSkeleton() {
  return (
    <View style={s.heroBox}>
      <View style={s.heroTop}>
        <Bone width={72} height={72} borderRadius={36} />
        <View style={{ flex: 1, gap: 8 }}>
          <Bone width="55%" height={22} />
          <Bone width="30%" height={13} />
        </View>
      </View>
      <View style={s.statsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={s.statItem}>
            <Bone width={32} height={20} style={{ marginBottom: 6 }} />
            <Bone width={52} height={11} />
          </View>
        ))}
      </View>
    </View>
  );
}

function SectionHeaderSkeleton() {
  return (
    <View style={s.sectionHeader}>
      <Bone width={140} height={11} />
    </View>
  );
}

function GameCardsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={s.cardsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={s.cardItem}>
          <Bone width="100%" height={130} borderRadius={8} />
          <Bone width="80%" height={13} style={{ marginTop: 10, marginBottom: 6 }} />
          <Bone width={48} height={11} />
        </View>
      ))}
    </View>
  );
}

function StatsSkeleton() {
  return (
    <View style={s.statsBoxRow}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={s.statBox}>
          <Bone width={120} height={11} style={{ marginBottom: 20 }} />
          <View style={s.barRow}>
            {[60, 85, 40, 95, 55, 70].map((h, j) => (
              <Bone key={j} width="100%" height={h * 0.8} borderRadius={3} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function ReviewCardSkeleton() {
  return (
    <View style={s.reviewCard}>
      <Bone width={70} height={105} borderRadius={8} />
      <View style={{ flex: 1, gap: 10 }}>
        <Bone width="70%" height={15} />
        <Bone width="35%" height={12} />
        <Bone width="100%" height={13} />
        <Bone width="90%" height={13} />
        <Bone width="75%" height={13} />
      </View>
    </View>
  );
}

export function ProfilePageSkeleton() {
  return (
    <View style={s.container}>
      <HeroSkeleton />

      <View style={s.section}>
        <SectionHeaderSkeleton />
        <GameCardsSkeleton count={5} />
      </View>

      <View style={s.section}>
        <SectionHeaderSkeleton />
        <StatsSkeleton />
      </View>

      <View style={s.section}>
        <SectionHeaderSkeleton />
        <GameCardsSkeleton count={4} />
      </View>

      <View style={s.section}>
        <SectionHeaderSkeleton />
        <View style={{ gap: 16 }}>
          {[0, 1, 2].map((i) => <ReviewCardSkeleton key={i} />)}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 60,
  },
  heroBox: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 16,
    padding: 20,
    marginBottom: 36,
    gap: 20,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 20,
  },
  statItem: {
    flex: 1,
  },
  section: {
    marginBottom: 36,
  },
  sectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
    paddingBottom: 10,
    marginBottom: 20,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  cardItem: {
    width: "30%",
  },
  statsBoxRow: {
    gap: 12,
  },
  statBox: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 12,
    padding: 20,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: 80,
  },
  reviewCard: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    gap: 16,
  },
});