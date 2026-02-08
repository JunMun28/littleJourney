/**
 * Haptics Utility
 *
 * Centralized haptic feedback management for the app.
 * Respects user preferences and reduces motion settings.
 */

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// Enable/disable haptics globally (could be linked to user settings)
let hapticsEnabled = true;

/**
 * Enable or disable haptics globally
 */
export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
}

/**
 * Check if haptics are enabled
 */
export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

/**
 * Trigger light impact feedback
 * Use for: Button presses, tab switches, minor interactions
 */
export function lightImpact() {
  if (!hapticsEnabled || Platform.OS !== "ios") return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Trigger medium impact feedback
 * Use for: Important button presses, pull-to-refresh, long press menus
 */
export function mediumImpact() {
  if (!hapticsEnabled || Platform.OS !== "ios") return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Trigger heavy impact feedback
 * Use for: Major actions, destructive operations, errors
 */
export function heavyImpact() {
  if (!hapticsEnabled || Platform.OS !== "ios") return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Trigger success notification
 * Use for: Successful operations, completions, achievements
 */
export function success() {
  if (!hapticsEnabled || Platform.OS !== "ios") return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/**
 * Trigger warning notification
 * Use for: Caution actions, validation warnings, important alerts
 */
export function warning() {
  if (!hapticsEnabled || Platform.OS !== "ios") return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/**
 * Trigger error notification
 * Use for: Errors, failures, destructive actions
 */
export function error() {
  if (!hapticsEnabled || Platform.OS !== "ios") return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/**
 * Trigger selection feedback
 * Use for: Pickers, segment controls, value changes
 */
export function selection() {
  if (!hapticsEnabled || Platform.OS !== "ios") return;
  Haptics.selectionAsync();
}

// Predefined haptic patterns for common interactions
export const HapticPatterns = {
  /**
   * Button press feedback
   */
  buttonPress: lightImpact,

  /**
   * Primary action button feedback
   */
  primaryAction: mediumImpact,

  /**
   * Success feedback for completed actions
   */
  actionSuccess: success,

  /**
   * Error feedback for failed actions
   */
  actionError: error,

  /**
   * Warning feedback for destructive/caution actions
   */
  actionWarning: warning,

  /**
   * Tab switch feedback
   */
  tabSwitch: selection,

  /**
   * Pull to refresh feedback
   */
  pullToRefresh: mediumImpact,

  /**
   * Long press menu feedback
   */
  longPressMenu: mediumImpact,

  /**
   * Scroll to top feedback
   */
  scrollToTop: lightImpact,

  /**
   * Delete action feedback
   */
  delete: () => {
    warning();
  },

  /**
   * Save action feedback
   */
  save: success,

  /**
   * Toggle switch feedback
   */
  toggle: selection,

  /**
   * Stepper/value change feedback
   */
  stepperChange: selection,

  /**
   * Achievement/unlock feedback
   */
  achievement: () => {
    success();
    setTimeout(() => success(), 100);
  },

  /**
   * Error shake feedback (multiple pulses)
   */
  errorShake: () => {
    error();
    setTimeout(() => mediumImpact(), 50);
    setTimeout(() => error(), 100);
  },
} as const;

// Default export for convenience
export default {
  setEnabled: setHapticsEnabled,
  isEnabled: isHapticsEnabled,
  light: lightImpact,
  medium: mediumImpact,
  heavy: heavyImpact,
  success,
  warning,
  error,
  selection,
  patterns: HapticPatterns,
};
