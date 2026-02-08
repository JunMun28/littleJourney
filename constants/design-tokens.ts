/**
 * Design Tokens for Little Journey
 *
 * A warm, nurturing design system for a premium baby milestone journal app.
 * Designed for Singapore families with a focus on trust, delight, and calm.
 */

import { Platform, TextStyle, ViewStyle } from "react-native";

// ============================================================================
// COLOR PALETTE
// ============================================================================

/**
 * Primary Colors - Warm rose tones that feel nurturing and trustworthy
 */
export const Primary = {
  50: "#FFF5F5", // Lightest blush - backgrounds
  100: "#FFE4E6", // Light rose - hover states
  200: "#FECDD3", // Soft rose - pressed states
  300: "#FDA4AF", // Medium rose - borders
  400: "#FB7185", // Vibrant rose - secondary actions
  500: "#F43F5E", // Main rose - primary actions
  600: "#E11D48", // Deep rose - active states
  700: "#BE123C", // Dark rose - text on light
} as const;

/**
 * Secondary Colors - Calming sage/mint for balance
 */
export const Secondary = {
  50: "#F0FDF4", // Lightest mint
  100: "#DCFCE7", // Light mint
  200: "#BBF7D0", // Soft mint
  300: "#86EFAC", // Medium mint
  400: "#4ADE80", // Vibrant mint
  500: "#22C55E", // Main green - success states
} as const;

/**
 * Neutral Colors - Warm grays (stone-based, not pure gray)
 */
export const Neutral = {
  50: "#FAFAF9", // Off-white backgrounds
  100: "#F5F5F4", // Light backgrounds
  200: "#E7E5E4", // Borders, dividers
  300: "#D6D3D1", // Disabled states
  400: "#A8A29E", // Placeholder text
  500: "#78716C", // Secondary text
  600: "#57534E", // Body text
  700: "#44403C", // Headings (light mode)
  800: "#292524", // Primary text (light mode)
  900: "#1C1917", // Darkest text
} as const;

/**
 * Accent Colors - For special moments and highlights
 */
export const Accent = {
  gold: "#F59E0B", // Achievements, celebrations
  goldLight: "rgba(245, 158, 11, 0.15)", // Gold backgrounds
  lavender: "#A78BFA", // Special moments, memories
  lavenderLight: "rgba(167, 139, 250, 0.15)",
  sky: "#38BDF8", // Info, tips
  skyLight: "rgba(56, 189, 248, 0.15)",
  peach: "#FDBA74", // Warmth, comfort
  peachLight: "rgba(253, 186, 116, 0.15)",
} as const;

/**
 * Semantic Colors
 */
export const Semantic = {
  success: "#22C55E",
  successLight: "#DCFCE7",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  info: "#3B82F6",
  infoLight: "#DBEAFE",
} as const;

/**
 * Theme Colors - Light and Dark mode variants
 */
export const ThemeColors = {
  light: {
    // Text
    text: Neutral[800],
    textSecondary: Neutral[500],
    textMuted: Neutral[400],
    textInverse: "#FFFFFF",

    // Backgrounds
    background: "#FFFFFF",
    backgroundSecondary: Neutral[50],
    backgroundTertiary: Neutral[100],

    // Primary brand
    tint: Primary[500],
    tintLight: Primary[50],

    // Icons
    icon: Neutral[500],
    iconMuted: Neutral[400],

    // Borders
    border: Neutral[200],
    borderLight: Neutral[100],
    borderFocus: Primary[300],

    // Cards
    card: "#FFFFFF",
    cardBorder: Neutral[200],

    // Inputs
    inputBackground: "#FFFFFF",
    inputBorder: Neutral[300],
    inputBorderFocus: Primary[400],
    placeholder: Neutral[400],

    // Overlays
    overlay: "rgba(28, 25, 23, 0.5)", // Warm overlay
    overlayLight: "rgba(28, 25, 23, 0.3)",

    // Tab bar
    tabIconDefault: Neutral[400],
    tabIconSelected: Primary[500],
  },
  dark: {
    // Text
    text: "#ECEDEE",
    textSecondary: "#A8A29E",
    textMuted: "#78716C",
    textInverse: Neutral[900],

    // Backgrounds
    background: "#1C1917",
    backgroundSecondary: "#292524",
    backgroundTertiary: "#44403C",

    // Primary brand
    tint: Primary[400],
    tintLight: "rgba(251, 113, 133, 0.15)",

    // Icons
    icon: "#A8A29E",
    iconMuted: "#78716C",

    // Borders
    border: "#44403C",
    borderLight: "#292524",
    borderFocus: Primary[400],

    // Cards
    card: "#292524",
    cardBorder: "#44403C",

    // Inputs
    inputBackground: "#292524",
    inputBorder: "#57534E",
    inputBorderFocus: Primary[400],
    placeholder: "#78716C",

    // Overlays
    overlay: "rgba(0, 0, 0, 0.7)",
    overlayLight: "rgba(0, 0, 0, 0.5)",

    // Tab bar
    tabIconDefault: "#78716C",
    tabIconSelected: "#FFFFFF",
  },
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const Spacing = {
  /** 4px - Tiny gaps */
  xs: 4,
  /** 8px - Small gaps */
  sm: 8,
  /** 12px - Medium-small gaps */
  md: 12,
  /** 16px - Standard gaps */
  lg: 16,
  /** 20px - Medium-large gaps */
  xl: 20,
  /** 24px - Large gaps */
  "2xl": 24,
  /** 32px - Extra large gaps */
  "3xl": 32,
  /** 48px - Huge gaps */
  "4xl": 48,
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const Radius = {
  /** 4px - Subtle rounding */
  xs: 4,
  /** 8px - Small rounding */
  sm: 8,
  /** 12px - Medium rounding (cards) */
  md: 12,
  /** 16px - Large rounding (modals) */
  lg: 16,
  /** 24px - Extra large (pills, tags) */
  xl: 24,
  /** Full circle */
  full: 9999,
} as const;

// ============================================================================
// SHADOWS (Warm-toned)
// ============================================================================

type ShadowStyle = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

export const Shadows: Record<"none" | "sm" | "md" | "lg" | "xl", ShadowStyle> =
  {
    none: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    /** Subtle shadow for cards */
    sm: {
      shadowColor: Neutral[500], // Warm gray instead of black
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    /** Medium shadow for elevated elements */
    md: {
      shadowColor: Neutral[500],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    /** Large shadow for modals, FABs */
    lg: {
      shadowColor: Neutral[500],
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
    /** Extra large shadow for prominent elements */
    xl: {
      shadowColor: Neutral[500],
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 12,
    },
  };

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const FontFamily = Platform.select({
  ios: {
    sans: "System",
    rounded: "ui-rounded", // iOS rounded system font - friendly feel
    serif: "ui-serif",
    mono: "ui-monospace",
  },
  default: {
    sans: "System",
    rounded: "System",
    serif: "serif",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    rounded: "'SF Pro Rounded', 'Nunito', 'Quicksand', system-ui, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});

export const FontSize = {
  /** 11px - Tiny labels */
  xs: 11,
  /** 13px - Captions, hints */
  sm: 13,
  /** 15px - Secondary text */
  md: 15,
  /** 17px - Body text (iOS standard) */
  base: 17,
  /** 19px - Large body */
  lg: 19,
  /** 22px - Small headings */
  xl: 22,
  /** 26px - Section headings */
  "2xl": 26,
  /** 32px - Page titles */
  "3xl": 32,
  /** 40px - Hero text */
  "4xl": 40,
} as const;

export const LineHeight = {
  tight: 1.2, // Headings
  snug: 1.35, // Subheadings
  normal: 1.5, // Body text
  relaxed: 1.65, // Long-form text
} as const;

export const FontWeight = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

/**
 * Pre-defined text styles for consistency
 */
export const Typography: Record<string, TextStyle> = {
  // Display styles
  hero: {
    fontSize: FontSize["4xl"],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize["4xl"] * LineHeight.tight,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: FontSize["3xl"],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize["3xl"] * LineHeight.tight,
    letterSpacing: -0.3,
  },
  heading: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize["2xl"] * LineHeight.snug,
  },
  subheading: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.xl * LineHeight.snug,
  },

  // Body styles
  bodyLarge: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.normal,
    lineHeight: FontSize.lg * LineHeight.normal,
  },
  body: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.normal,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  bodyMedium: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  bodySemibold: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  bodySmall: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.normal,
    lineHeight: FontSize.md * LineHeight.normal,
  },

  // Caption styles
  caption: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.normal,
    lineHeight: FontSize.sm * LineHeight.normal,
  },
  captionMedium: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.sm * LineHeight.normal,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.xs * LineHeight.normal,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  // Special styles
  link: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  button: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.base * LineHeight.tight,
  },
  buttonSmall: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.md * LineHeight.tight,
  },
};

// ============================================================================
// ANIMATION CONSTANTS
// ============================================================================

export const Animation = {
  /** Quick interactions (button press) */
  fast: 150,
  /** Normal transitions */
  normal: 250,
  /** Smooth transitions (modals) */
  slow: 350,
  /** Entrance animations */
  entrance: 500,

  /** Spring configs */
  spring: {
    /** Snappy - buttons, toggles */
    snappy: {
      damping: 20,
      stiffness: 300,
      mass: 0.8,
    },
    /** Bouncy - celebratory moments */
    bouncy: {
      damping: 12,
      stiffness: 180,
      mass: 1,
    },
    /** Gentle - cards, modals */
    gentle: {
      damping: 18,
      stiffness: 120,
      mass: 1,
    },
  },

  /** Easing curves */
  easing: {
    easeOut: [0.16, 1, 0.3, 1], // Decelerate
    easeIn: [0.4, 0, 1, 1], // Accelerate
    easeInOut: [0.4, 0, 0.2, 1], // Standard
  },
} as const;

// ============================================================================
// ICON SIZES
// ============================================================================

export const IconSize = {
  /** 16px - Extra small icons */
  xs: 16,
  /** 20px - Small icons */
  sm: 20,
  /** 24px - Default icon size */
  md: 24,
  /** 28px - Large icons */
  lg: 28,
  /** 32px - Extra large icons */
  xl: 32,
} as const;

// ============================================================================
// COMPONENT TOKENS
// ============================================================================

/**
 * Button sizes and styles
 */
export const ButtonTokens = {
  sizes: {
    sm: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      borderRadius: Radius.sm,
      minHeight: 36,
    },
    md: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: Radius.md,
      minHeight: 44, // iOS minimum touch target
    },
    lg: {
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing["2xl"],
      borderRadius: Radius.md,
      minHeight: 52,
    },
  },
  variants: {
    primary: {
      light: {
        background: Primary[500],
        text: "#FFFFFF",
        pressedBackground: Primary[600],
      },
      dark: {
        background: Primary[400],
        text: "#FFFFFF",
        pressedBackground: Primary[500],
      },
    },
    secondary: {
      light: {
        background: Neutral[100],
        text: Neutral[700],
        pressedBackground: Neutral[200],
      },
      dark: {
        background: Neutral[700],
        text: Neutral[100],
        pressedBackground: Neutral[600],
      },
    },
    ghost: {
      light: {
        background: "transparent",
        text: Primary[500],
        pressedBackground: Primary[50],
      },
      dark: {
        background: "transparent",
        text: Primary[400],
        pressedBackground: "rgba(251, 113, 133, 0.15)",
      },
    },
  },
} as const;

/**
 * Card styles
 */
export const CardTokens = {
  padding: Spacing.lg,
  borderRadius: Radius.md,
  borderWidth: 1,
} as const;

/**
 * Input styles
 */
export const InputTokens = {
  padding: Spacing.md,
  borderRadius: Radius.sm,
  borderWidth: 1,
  minHeight: 44,
} as const;

// ============================================================================
// DEPRECATED - Backward compatibility
// ============================================================================

/** @deprecated Use Primary[500] instead */
export const PRIMARY_COLOR = Primary[500];

/** @deprecated Use ThemeColors instead */
export const Colors = ThemeColors;
