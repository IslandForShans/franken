// HS positions for each player count, ordered by table position 1, 2, 3, ...
export const HS_POSITIONS = {
  3: ["301", "307", "313"],
  4: ["304", "307", "313", "316"],
  5: ["304", "307", "310", "313", "316"],
  6: ["301", "304", "307", "310", "313", "316"],
};

// For each HS label, 5 slice positions in strict placement order:
// [R1, R3-first, R2-spoke, R3-second, R2-left]
export const SLICE_ORDER = {
  "301": ["101", "201", "202", "318", "302"],
  "304": ["102", "203", "204", "303", "305"],
  "307": ["103", "205", "206", "306", "308"],
  "310": ["104", "207", "208", "309", "311"],
  "313": ["105", "209", "210", "312", "314"],
  "316": ["106", "211", "212", "315", "317"],
};

// All slice labels (flat set for fast lookup)
export const ALL_SLICE_LABELS = new Set(Object.values(SLICE_ORDER).flat());