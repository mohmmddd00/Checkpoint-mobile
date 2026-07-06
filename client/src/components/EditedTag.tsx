export function EditedTag({ editedAt, label }: { editedAt?: string | null; label?: string | null }) {
  if (!editedAt && !label) return null;
  const text = label ?? `edited ${new Date(editedAt!).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`;
  return (
    <span style={{ color: "#5C1222", fontSize: "11px", fontStyle: "italic" }}>({text})</span>
  );
}