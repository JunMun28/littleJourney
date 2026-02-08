/**
 * Animation utilities for Little Journey
 *
 * Pre-configured animation presets using react-native-reanimated
 * for delightful micro-interactions.
 */

import {
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  ReduceMotion,
  type WithSpringConfig,
  type WithTimingConfig,
} from "react-native-reanimated";
import { Animation } from "@/constants/design-tokens";

// ============================================================================
// SPRING CONFIGS
// ============================================================================

/**
 * Snappy spring for quick interactions (buttons, toggles)
 */
export const SPRING_SNAPPY: WithSpringConfig = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
  reduceMotion: ReduceMotion.System,
};

/**
 * Bouncy spring for celebratory moments (achievements, milestones)
 */
export const SPRING_BOUNCY: WithSpringConfig = {
  damping: 12,
  stiffness: 180,
  mass: 1,
  reduceMotion: ReduceMotion.System,
};

/**
 * Gentle spring for cards and modals
 */
export const SPRING_GENTLE: WithSpringConfig = {
  damping: 18,
  stiffness: 120,
  mass: 1,
  reduceMotion: ReduceMotion.System,
};

/**
 * Default spring (gentle)
 */
export const SPRING_DEFAULT = SPRING_GENTLE;

// ============================================================================
// TIMING CONFIGS
// ============================================================================

/**
 * Fast timing for micro-interactions
 */
export const TIMING_FAST: WithTimingConfig = {
  duration: Animation.fast,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
};

/**
 * Normal timing for transitions
 */
export const TIMING_NORMAL: WithTimingConfig = {
  duration: Animation.normal,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
};

/**
 * Slow timing for modal transitions
 */
export const TIMING_SLOW: WithTimingConfig = {
  duration: Animation.slow,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
};

/**
 * Entrance timing for content appearing
 */
export const TIMING_ENTRANCE: WithTimingConfig = {
  duration: Animation.entrance,
  easing: Easing.out(Easing.exp),
  reduceMotion: ReduceMotion.System,
};

// ============================================================================
// ANIMATION HELPERS
// ============================================================================

/**
 * Animate a value with snappy spring
 */
export function animateSnappy(toValue: number) {
  "worklet";
  return withSpring(toValue, SPRING_SNAPPY);
}

/**
 * Animate a value with bouncy spring (for celebrations)
 */
export function animateBouncy(toValue: number) {
  "worklet";
  return withSpring(toValue, SPRING_BOUNCY);
}

/**
 * Animate a value with gentle spring
 */
export function animateGentle(toValue: number) {
  "worklet";
  return withSpring(toValue, SPRING_GENTLE);
}

/**
 * Quick timing animation
 */
export function animateFast(toValue: number) {
  "worklet";
  return withTiming(toValue, TIMING_FAST);
}

/**
 * Normal timing animation
 */
export function animateNormal(toValue: number) {
  "worklet";
  return withTiming(toValue, TIMING_NORMAL);
}

// ============================================================================
// BUTTON PRESS ANIMATION
// ============================================================================

/**
 * Scale values for button press animation
 */
export const BUTTON_SCALE = {
  pressed: 0.96,
  normal: 1,
} as const;

/**
 * Get scale animation for button press (on press in)
 */
export function buttonPressIn() {
  "worklet";
  return withSpring(BUTTON_SCALE.pressed, SPRING_SNAPPY);
}

/**
 * Get scale animation for button release (on press out)
 */
export function buttonPressOut() {
  "worklet";
  return withSpring(BUTTON_SCALE.normal, SPRING_SNAPPY);
}

// ============================================================================
// CARD ANIMATIONS
// ============================================================================

/**
 * Card press animation (subtle scale)
 */
export const CARD_SCALE = {
  pressed: 0.98,
  normal: 1,
} as const;

export function cardPressIn() {
  "worklet";
  return withSpring(CARD_SCALE.pressed, SPRING_GENTLE);
}

export function cardPressOut() {
  "worklet";
  return withSpring(CARD_SCALE.normal, SPRING_GENTLE);
}

// ============================================================================
// STAGGERED LIST ANIMATIONS
// ============================================================================

/**
 * Calculate delay for staggered list item entrance
 * @param index - Item index in list
 * @param baseDelay - Base delay before first item (default: 0)
 * @param staggerDelay - Delay between each item (default: 50ms)
 */
export function getStaggerDelay(
  index: number,
  baseDelay = 0,
  staggerDelay = 50,
): number {
  return baseDelay + index * staggerDelay;
}

/**
 * Fade in with optional delay (for list items)
 */
export function fadeInWithDelay(delay: number) {
  "worklet";
  return withDelay(delay, withTiming(1, TIMING_ENTRANCE));
}

/**
 * Slide up with fade (for list items)
 */
export function slideUpWithDelay(delay: number, distance = 20) {
  "worklet";
  return {
    opacity: withDelay(delay, withTiming(1, TIMING_ENTRANCE)),
    translateY: withDelay(delay, withSpring(0, SPRING_GENTLE)),
  };
}

// ============================================================================
// CELEBRATION ANIMATIONS
// ============================================================================

/**
 * Bounce animation for achievements/milestones
 * Use with a scale transform
 */
export function celebrationBounce() {
  "worklet";
  return withSequence(
    withSpring(1.2, SPRING_BOUNCY),
    withSpring(0.9, SPRING_BOUNCY),
    withSpring(1.05, SPRING_BOUNCY),
    withSpring(1, SPRING_BOUNCY),
  );
}

/**
 * Shake animation (for errors or attention)
 * Use with translateX transform
 */
export function shakeAnimation() {
  "worklet";
  return withSequence(
    withTiming(-8, { duration: 50 }),
    withTiming(8, { duration: 50 }),
    withTiming(-6, { duration: 50 }),
    withTiming(6, { duration: 50 }),
    withTiming(-4, { duration: 50 }),
    withTiming(0, { duration: 50 }),
  );
}

// ============================================================================
// ENTERING/EXITING ANIMATIONS (for Animated.View entering prop)
// ============================================================================

import {
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeInUp,
  FadeOutDown,
  FadeOutUp,
  SlideInRight,
  SlideOutRight,
  SlideInLeft,
  SlideOutLeft,
  ZoomIn,
  ZoomOut,
  Layout,
} from "react-native-reanimated";

/**
 * Pre-configured entering animations
 */
export const Entering = {
  // Fade animations
  fade: FadeIn.duration(Animation.normal),
  fadeDown: FadeInDown.duration(Animation.normal).springify(),
  fadeUp: FadeInUp.duration(Animation.normal).springify(),

  // Slide animations
  slideRight: SlideInRight.duration(Animation.normal).springify(),
  slideLeft: SlideInLeft.duration(Animation.normal).springify(),

  // Zoom animations
  zoom: ZoomIn.duration(Animation.normal).springify(),

  // Staggered list item (call with index)
  listItem: (index: number) =>
    FadeInDown.delay(index * 50)
      .duration(Animation.normal)
      .springify(),
} as const;

/**
 * Pre-configured exiting animations
 */
export const Exiting = {
  // Fade animations
  fade: FadeOut.duration(Animation.fast),
  fadeDown: FadeOutDown.duration(Animation.fast),
  fadeUp: FadeOutUp.duration(Animation.fast),

  // Slide animations
  slideRight: SlideOutRight.duration(Animation.fast),
  slideLeft: SlideOutLeft.duration(Animation.fast),

  // Zoom animations
  zoom: ZoomOut.duration(Animation.fast),
} as const;

/**
 * Layout animation for list reordering
 */
export const LayoutAnimation = Layout.springify();

// ============================================================================
// PROGRESS ANIMATION
// ============================================================================

/**
 * Animate progress bar fill
 * @param toValue - Target width percentage (0-100)
 */
export function animateProgress(toValue: number) {
  "worklet";
  return withSpring(toValue, {
    ...SPRING_GENTLE,
    stiffness: 80, // Slower for progress bars
  });
}

// ============================================================================
// FAB (Floating Action Button) ANIMATIONS
// ============================================================================

export const FAB_SCALE = {
  pressed: 0.9,
  normal: 1,
} as const;

export function fabPressIn() {
  "worklet";
  return withSpring(FAB_SCALE.pressed, SPRING_SNAPPY);
}

export function fabPressOut() {
  "worklet";
  return withSpring(FAB_SCALE.normal, SPRING_BOUNCY);
}

/**
 * FAB entrance animation (scale from 0)
 */
export const fabEntering = ZoomIn.delay(300).springify().damping(12);

/**
 * FAB exit animation
 */
export const fabExiting = ZoomOut.duration(150);
