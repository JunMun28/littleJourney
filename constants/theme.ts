/**
 * Theme Configuration for Little Journey
 *
 * This file maintains backward compatibility while using the new design tokens.
 * New code should import directly from '@/constants/design-tokens' for the full API.
 *
 * @see ./design-tokens.ts for the complete design system
 */

import { Platform } from "react-native";
import {
  Primary,
  Neutral,
  ThemeColors,
  Semantic,
  Accent,
  Shadows as NewShadows,
  Spacing as NewSpacing,
  FontFamily,
} from "./design-tokens";

// ============================================================================
// PRIMARY BRAND COLOR
// ============================================================================

/**
 * Primary brand color - warm rose for Little Journey
 * @deprecated Use `Primary[500]` from design-tokens for full color scale
 */
export const PRIMARY_COLOR = Primary[500];

// ============================================================================
// THEME COLORS
// ============================================================================

/**
 * Light and dark mode color schemes
 * Now using warm, nurturing colors from design-tokens
 */
export const Colors = {
  light: {
    // Text colors
    text: ThemeColors.light.text,
    textSecondary: ThemeColors.light.textSecondary,
    textMuted: ThemeColors.light.textMuted,

    // Backgrounds
    background: ThemeColors.light.background,
    backgroundSecondary: ThemeColors.light.backgroundSecondary,
    backgroundTertiary: ThemeColors.light.backgroundTertiary,

    // Brand/tint
    tint: ThemeColors.light.tint,
    tintLight: ThemeColors.light.tintLight,

    // Icons
    icon: ThemeColors.light.icon,
    tabIconDefault: ThemeColors.light.tabIconDefault,
    tabIconSelected: ThemeColors.light.tabIconSelected,

    // Borders
    border: ThemeColors.light.border,
    borderLight: ThemeColors.light.borderLight,
    inputBorder: ThemeColors.light.inputBorder,

    // Inputs
    placeholder: ThemeColors.light.placeholder,

    // Cards
    card: ThemeColors.light.card,
    cardBorder: ThemeColors.light.cardBorder,

    // Overlays
    overlay: ThemeColors.light.overlay,
    overlayLight: ThemeColors.light.overlayLight,
  },
  dark: {
    // Text colors
    text: ThemeColors.dark.text,
    textSecondary: ThemeColors.dark.textSecondary,
    textMuted: ThemeColors.dark.textMuted,

    // Backgrounds
    background: ThemeColors.dark.background,
    backgroundSecondary: ThemeColors.dark.backgroundSecondary,
    backgroundTertiary: ThemeColors.dark.backgroundTertiary,

    // Brand/tint
    tint: ThemeColors.dark.tint,
    tintLight: ThemeColors.dark.tintLight,

    // Icons
    icon: ThemeColors.dark.icon,
    tabIconDefault: ThemeColors.dark.tabIconDefault,
    tabIconSelected: ThemeColors.dark.tabIconSelected,

    // Borders
    border: ThemeColors.dark.border,
    borderLight: ThemeColors.dark.borderLight,
    inputBorder: ThemeColors.dark.inputBorder,

    // Inputs
    placeholder: ThemeColors.dark.placeholder,

    // Cards
    card: ThemeColors.dark.card,
    cardBorder: ThemeColors.dark.cardBorder,

    // Overlays
    overlay: ThemeColors.dark.overlay,
    overlayLight: ThemeColors.dark.overlayLight,
  },
};

// ============================================================================
// SEMANTIC COLORS
// ============================================================================

/**
 * Semantic colors for feedback states
 */
export const SemanticColors = {
  success: Semantic.success,
  successLight: Semantic.successLight,
  warning: Semantic.warning,
  warningLight: Semantic.warningLight,
  warningText: "#92400E", // Amber-800 for warning text
  error: Semantic.error,
  errorLight: Semantic.errorLight,
  info: Semantic.info,
  infoLight: Semantic.infoLight,
  // Accent colors for special features
  gold: Accent.gold,
  goldLight: Accent.goldLight,
};

// ============================================================================
// VIEWER COLORS (for full-screen media viewing)
// ============================================================================

/**
 * Dark theme colors for media viewing contexts
 */
export const ViewerColors = {
  background: "#000000",
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayStrong: "rgba(0, 0, 0, 0.6)",
  text: "#ffffff",
  textMuted: "rgba(255, 255, 255, 0.7)",
  textSubtle: "rgba(255, 255, 255, 0.6)",
  textPlaceholder: "rgba(255, 255, 255, 0.4)",
  // Modal styling for dark context
  modalBackground: "#1c1c1e",
  modalBorder: "rgba(255, 255, 255, 0.1)",
  inputBackground: "rgba(255, 255, 255, 0.1)",
  buttonBackground: "rgba(255, 255, 255, 0.2)",
};

// ============================================================================
// SPACING
// ============================================================================

/**
 * Spacing scale for consistent layouts
 */
export const Spacing = {
  xs: NewSpacing.xs,
  sm: NewSpacing.sm,
  md: NewSpacing.md,
  lg: NewSpacing.lg,
  xl: NewSpacing["2xl"],
  xxl: NewSpacing["3xl"],
} as const;

// ============================================================================
// SHADOWS (now with warm gray instead of pure black)
// ============================================================================

/**
 * Shadow presets for elevation
 * Using warm gray (#78716C) for a softer, more nurturing feel
 */
export const Shadows = {
  small: NewShadows.sm,
  medium: NewShadows.md,
  large: NewShadows.lg,
} as const;

// ============================================================================
// FONTS
// ============================================================================

/**
 * Font family configuration
 */
export const Fonts = FontFamily;

// ============================================================================
// RE-EXPORTS FROM DESIGN TOKENS
// ============================================================================

// Export new design system for gradual migration
export {
  Primary,
  Neutral,
  Accent,
  ThemeColors,
  Semantic,
  Radius,
  Typography,
  Animation,
  ButtonTokens,
  CardTokens,
  InputTokens,
} from "./design-tokens";
