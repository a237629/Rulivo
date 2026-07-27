export const tokens = {
  color: {
    brand: {
      midnight: "#07111D",
      surface: "#0F1B29",
      card: "#152333",
      disciplineTeal: "#2ED7A2",
      evidenceBlue: "#47B7E8",
      cautionAmber: "#F5B942",
      lossCoral: "#FF6B6B",
      textPrimary: "#F7F8FA",
      textSecondary: "#9BAABC"
    }
  },
  font: {
    sans: 'Inter, "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    ios: '"SF Pro Display", "SF Pro Text", "PingFang SC", -apple-system, sans-serif',
    numeric: "tabular-nums"
  },
  space: {
    0: "0",
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px"
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "18px",
    xl: "24px",
    pill: "999px"
  },
  shadow: {
    sm: "0 2px 8px rgb(0 0 0 / 14%)",
    md: "0 12px 32px rgb(0 0 0 / 22%)",
    focus: "0 0 0 3px rgb(71 183 232 / 32%)"
  }
} as const;

export type ThemeName = "dark" | "light";
export const DEFAULT_THEME: ThemeName = "dark";
