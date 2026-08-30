const PALETTE = [
  '#6366f1', // indigo
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#84cc16', // lime
  '#f97316', // orange
  '#14b8a6', // teal
  '#a855f7', // purple
  '#eab308', // yellow
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f43f5e', // rose
];

// Accepts numbers (raw community ids) or arbitrary strings (e.g. trajectory
// ids like "traj_7") and maps them to a stable palette entry.
export function getColor(key) {
  const index = hashToInt(key) % PALETTE.length;
  return PALETTE[(index + PALETTE.length) % PALETTE.length];
}

function hashToInt(key) {
  if (typeof key === 'number') return key;

  const str = String(key);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return hash;
}
