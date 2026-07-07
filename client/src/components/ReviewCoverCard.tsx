import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

interface ReviewCoverCardProps {
  coverImage: string | null;
  title: string;
  formattedDate: string;
  rating: number;
  editedLabel?: string | null;
  children: React.ReactNode;
}

export function ReviewCoverCard({
  coverImage,
  title,
  formattedDate,
  rating,
  editedLabel,
  children,
}: ReviewCoverCardProps) {
  return (
    <View style={s.card}>
      {/* Cover image */}
      <View style={s.coverWrap}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={s.coverImg} resizeMode="cover" />
        ) : (
          <View style={s.coverFallback}>
            <Text style={s.coverEmoji}>🎮</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={s.content}>
        <View style={s.topRow}>
          <View style={s.titleBlock}>
            <Text style={s.title}>{title}</Text>
            <View style={s.metaRow}>
              <Text style={s.date}>{formattedDate}</Text>
              {editedLabel ? <Text style={s.editedTag}>{editedLabel}</Text> : null}
            </View>
          </View>
          <Text style={s.rating}>★ {rating}/10</Text>
        </View>

        {children}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    gap: 16,
  },
  coverWrap: {
    width: 90,
    flexShrink: 0,
    aspectRatio: 2 / 3,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "#160408",
    alignSelf: "flex-start",
  },
  coverImg: {
    width: "100%",
    height: "100%",
  },
  coverFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  coverEmoji: {
    fontSize: 36,
  },
  content: {
    flex: 1,
    flexDirection: "column",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: "#F7F4F5",
    fontSize: 17,
    fontWeight: "800",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    flexWrap: "wrap",
  },
  date: {
    color: "#8A6D73",
    fontSize: 11,
  },
  editedTag: {
    color: "#8A6D73",
    fontSize: 11,
    fontStyle: "italic",
  },
  rating: {
    color: "#9E1B32",
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 0,
  },
});