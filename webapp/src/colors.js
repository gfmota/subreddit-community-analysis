const PALETTE = [
  "#6366f1", // indigo
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#84cc16", // lime
  "#f97316", // orange
  "#14b8a6", // teal
  "#a855f7", // purple
  "#eab308", // yellow
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f43f5e", // rose
];

export function getColor(communityId) {
  const numericId =
    typeof communityId === "string" ? parseInt(communityId, 10) : communityId;
  const index =
    ((numericId % PALETTE.length) + PALETTE.length) % PALETTE.length;
  return PALETTE[index];
}
