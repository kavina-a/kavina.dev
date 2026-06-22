// Anatomical attention zones, positioned in UV space (origin BOTTOM-LEFT, to
// match GLSL uv). Coordinates tuned to the provided portrait framing where the
// subject sits center-left. Adjust freely once the final portrait is in.
//
// Each zone: the verb of the thesis it expresses, a color of light, and the
// fragments it surfaces.

export const ZONES = [
  {
    id: "know",
    word: "I KNOW",
    pos: [0.46, 0.74], // eyes / gaze
    color: [0.15, 0.85, 1.0], // electric cyan
    fragments: ["AI", "Design", "Business", "Systems"],
  },
  {
    id: "build",
    word: "I BUILD",
    pos: [0.45, 0.86], // mind / forehead
    color: [0.7, 0.6, 1.0], // cold violet-white
    fragments: ["Products", "Startups", "Future ideas"],
  },
  {
    id: "love",
    word: "I LOVE",
    pos: [0.48, 0.4], // chest
    color: [1.0, 0.62, 0.28], // warm amber
    fragments: ["Freedom", "Building", "Curiosity"],
  },
  {
    id: "chase",
    word: "I CHASE",
    pos: [0.62, 0.22], // hands / forward
    color: [0.5, 1.0, 0.55], // green-gold ignition
    fragments: ["Websites", "Projects", "Experiments"],
  },
];

// Distance (uv) under which the cursor "snaps" attention to a zone center.
export const ZONE_MAGNET = 0.16;
