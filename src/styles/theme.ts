export const theme = {
  colors: {
    background: "#0B1020",
    surface: "#151B2D",

    primary: "#6D5DF6",

    success: "#3DDC97",
    danger: "#FF5C5C",
    warning: "#FFB020",

    text: "#FFFFFF",
    textMuted: "#8F9CAE",

    onPrimary: "#FFFFFF",
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  radius: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 999,
  },

  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 24,
      xxl: 32,
    },

    weights: {
      regular: "400",
      medium: "500",
      bold: "700",
    },
  },
} as const;

export type Theme = typeof theme;