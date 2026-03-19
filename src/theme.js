// ─── Color Palettes ───────────────────────────────────────────────────────────

const darkColors = {
  bg: "#080A0F",
  bgCard: "#0E1117",
  bgElevated: "#161B26",
  accent: "#A8FF3E",
  accentDim: "rgba(168, 255, 62, 0.12)",
  accentGlow: "rgba(168, 255, 62, 0.06)",
  text: "#EEF0F5",
  textMuted: "#8892A4",
  textDim: "#3D4659",
  border: "#1C2235",
  borderLight: "#252F45",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
};

const lightColors = {
  bg: "#F2F5F9",
  bgCard: "#FFFFFF",
  bgElevated: "#E8ECF2",
  accent: "#4E8E05",
  accentDim: "rgba(78, 142, 5, 0.12)",
  accentGlow: "rgba(78, 142, 5, 0.06)",
  text: "#0D1117",
  textMuted: "#5A6478",
  textDim: "#A8B4C4",
  border: "#DDE3EE",
  borderLight: "#C8D0E0",
  success: "#16A34A",
  warning: "#D97706",
  error: "#DC2626",
};

// ─── Font Scale ───────────────────────────────────────────────────────────────

const fontScaleMap = {
  sm: 0.875,
  md: 1,
  lg: 1.2,
};

// ─── Shared tokens ────────────────────────────────────────────────────────────

const fonts = {
  heading: "'Sora', sans-serif",
  body: "'DM Sans', sans-serif",
};

const radii = {
  sm: "8px",
  md: "14px",
  lg: "20px",
  xl: "28px",
  full: "9999px",
};

// ─── Dynamic theme factory ────────────────────────────────────────────────────

export function getTheme(isDark = true, scale = "md") {
  return {
    colors: isDark ? darkColors : lightColors,
    fonts,
    radii,
    fontScale: fontScaleMap[scale] || 1,
    isDark,
  };
}

// Backward-compat: existing screens that import { theme } still work
export const theme = {
  colors: darkColors,
  fonts,
  radii,
  fontScale: 1,
  isDark: true,
};

// ─── Topic Config ─────────────────────────────────────────────────────────────

export const topicConfig = {
  Productivity: {
    icon: "⚡",
    color: "#818CF8",
    bg: "rgba(129, 140, 248, 0.1)",
    border: "rgba(129, 140, 248, 0.2)",
    description: "Deep work, habits & focus",
  },
  "Soft Skills": {
    icon: "🤝",
    color: "#F472B6",
    bg: "rgba(244, 114, 182, 0.1)",
    border: "rgba(244, 114, 182, 0.2)",
    description: "Leadership & communication",
  },
  Tech: {
    icon: "💻",
    color: "#38BDF8",
    bg: "rgba(56, 189, 248, 0.1)",
    border: "rgba(56, 189, 248, 0.2)",
    description: "Software & tools",
  },
  Health: {
    icon: "💪",
    color: "#4ADE80",
    bg: "rgba(74, 222, 128, 0.1)",
    border: "rgba(74, 222, 128, 0.2)",
    description: "Fitness & nutrition",
  },
  Mindfulness: {
    icon: "🧘",
    color: "#C4B5FD",
    bg: "rgba(196, 181, 253, 0.1)",
    border: "rgba(196, 181, 253, 0.2)",
    description: "Stress relief & mental health",
  },
  STEM: {
    icon: "🔬",
    color: "#FB923C",
    bg: "rgba(251, 146, 60, 0.1)",
    border: "rgba(251, 146, 60, 0.2)",
    description: "Science, math & logic",
  },
};

// ─── Levels ───────────────────────────────────────────────────────────────────

export const LEVELS = [
  { level: 1, title: "Curious",   minXP: 0,    maxXP: 100  },
  { level: 2, title: "Explorer",  minXP: 100,  maxXP: 300  },
  { level: 3, title: "Learner",   minXP: 300,  maxXP: 600  },
  { level: 4, title: "Thinker",   minXP: 600,  maxXP: 1000 },
  { level: 5, title: "Scholar",   minXP: 1000, maxXP: 1500 },
  { level: 6, title: "Expert",    minXP: 1500, maxXP: 2200 },
  { level: 7, title: "Sage",      minXP: 2200, maxXP: 3000 },
  { level: 8, title: "Master",    minXP: 3000, maxXP: 4000 },
  { level: 9, title: "Visionary", minXP: 4000, maxXP: 9999 },
];
