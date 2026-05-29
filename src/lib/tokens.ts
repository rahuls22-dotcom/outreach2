export const colors = {
  surface: {
    primary: "#FFFFFF",
    page: "#FAFAFA",
    secondary: "#F5F5F5",
  },
  text: {
    primary: "#0A0A0A",
    secondary: "#6B6B6B",
    tertiary: "#9B9B9B",
  },
  border: {
    default: "#E5E5E5",
    hover: "#D4D4D4",
    subtle: "#F0F0F0",
  },
  accent: {
    default: "#1A1A1A",
    hover: "#333333",
    light: "#F0F0F0",
  },
  silver: {
    default: "#A0A0A0",
    light: "#C8C8C8",
    dark: "#6B6B6B",
  },
  charcoal: {
    default: "#1A1A1A",
    light: "#2D2D2D",
  },
  status: {
    success: "#22C55E",
    warning: "#F5A623",
    error: "#E53E3E",
    info: "#3B82F6",
  },
} as const;

export const typography = {
  pageTitle: { size: "24px", weight: 600, lineHeight: "32px" },
  sectionHeader: { size: "16px", weight: 600, lineHeight: "24px" },
  cardTitle: { size: "14px", weight: 600, lineHeight: "20px" },
  body: { size: "14px", weight: 400, lineHeight: "20px" },
  meta: { size: "13px", weight: 400, lineHeight: "18px", color: colors.text.secondary },
  smallLabel: {
    size: "12px",
    weight: 500,
    color: colors.text.tertiary,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  sectionLabel: {
    size: "11px",
    weight: 500,
    color: colors.text.tertiary,
    textTransform: "uppercase" as const,
    letterSpacing: "0.6px",
  },
  statLarge: { size: "28px", weight: 600, lineHeight: "36px" },
  statMedium: { size: "20px", weight: 600, lineHeight: "28px" },
} as const;

export const spacing = {
  sidebar: "240px",
  contentMaxWidth: "1200px",
  contentPadding: "32px",
  cardPadding: "20px",
  cardPaddingLg: "24px",
} as const;

export const radii = {
  card: "8px",
  button: "6px",
  badge: "6px",
  input: "8px",
  metric: "12px",
} as const;

export const shadows = {
  cardHover: "0 1px 3px rgba(0,0,0,0.04)",
} as const;

export const animation = {
  fast: "150ms",
  normal: "200ms",
  easing: "ease-out",
} as const;
