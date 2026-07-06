import { Text } from "react-native";

export function EditedTag({ editedAt, label }: { editedAt?: string | null; label?: string | null }) {
  if (!editedAt && !label) return null;
  const text = label ?? `edited ${new Date(editedAt!).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  })}`;
  return (
    <Text style={{ color: "#5C1222", fontSize: 11, fontStyle: "italic" }}>({text})</Text>
  );
}