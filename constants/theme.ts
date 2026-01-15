/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

// Primary brand color
export const PRIMARY_COLOR = "#0a7ea4";

const tintColorLight = PRIMARY_COLOR;
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    textSecondary: "#666666",
    textMuted: "#999999",
    background: "#fff",
    backgroundSecondary: "#f5f5f5",
    backgroundTertiary: "#e8e8e8",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    border: "#e0e0e0",
    borderLight: "#f0f0f0",
    inputBorder: "#ddd",
    placeholder: "#999999",
    card: "#ffffff",
    cardBorder: "#e0e0e0",
    overlay: "rgba(0, 0, 0, 0.5)",
    overlayLight: "rgba(0, 0, 0, 0.3)",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    textMuted: "#687076",
    background: "#151718",
    backgroundSecondary: "#1e2022",
    backgroundTertiary: "#2a2d2f",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    border: "#333333",
    borderLight: "#222222",
    inputBorder: "#444444",
    placeholder: "#666666",
    card: "#1e2022",
    cardBorder: "#333333",
    overlay: "rgba(0, 0, 0, 0.7)",
    overlayLight: "rgba(0, 0, 0, 0.5)",
  },
};

// Semantic colors (same in light/dark for now - can be theme-specific if needed)
export const SemanticColors = {
  success: "#4CAF50",
  successLight: "#e8f5e9",
  warning: "#ff9800",
  warningLight: "#fff3cd",
  warningText: "#856404",
  error: "#ff3b30",
  errorLight: "#ffebee",
  info: PRIMARY_COLOR,
  infoLight: "#e3f2fd",
  gold: "#FFD700",
  goldLight: "rgba(255, 215, 0, 0.15)",
};

// Full-screen viewer colors (dark by design for media viewing)
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

// Spacing scale for consistency
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Shadow presets for elevation
export const Shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
