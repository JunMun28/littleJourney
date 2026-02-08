/**
 * Confetti Celebration Effect
 *
 * Particle-based confetti animation for celebrations.
 */

import { useEffect, useCallback, useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { Primary, Secondary, Accent } from "@/constants/design-tokens";

const DEFAULT_COLORS = [
  Primary[400],
  Primary[500],
  Secondary[400],
  Accent.gold,
  Accent.lavender,
  "#FF69B4", // Hot pink
  "#FFD700", // Gold
];

const PARTICLE_COUNT = 50;

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
}

interface ConfettiProps {
  /** Whether confetti is active */
  active?: boolean;
  /** Number of particles */
  particleCount?: number;
  /** Colors to use */
  colors?: string[];
  /** Duration in milliseconds */
  duration?: number;
  /** Origin point (0-1) */
  origin?: { x: number; y: number };
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Enable haptic feedback */
  haptic?: boolean;
}

export function Confetti({
  active = false,
  particleCount = PARTICLE_COUNT,
  colors = DEFAULT_COLORS,
  duration = 3000,
  origin = { x: 0.5, y: 0.3 },
  onComplete,
  haptic = true,
}: ConfettiProps) {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  const generateParticles = useCallback(() => {
    const newParticles: ConfettiParticle[] = [];
    const startX = width * origin.x;
    const startY = height * origin.y;

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: startX + (Math.random() - 0.5) * 50,
        y: startY + (Math.random() - 0.5) * 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
        velocityX: (Math.random() - 0.5) * 15,
        velocityY: -8 - Math.random() * 8,
      });
    }

    return newParticles;
  }, [colors, height, origin.x, origin.y, particleCount, width]);

  useEffect(() => {
    if (active && !reduceMotion) {
      setParticles(generateParticles());

      if (haptic) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const timeout = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timeout);
    } else if (!active) {
      setParticles([]);
    }
  }, [active, duration, generateParticles, haptic, onComplete, reduceMotion]);

  if (reduceMotion || particles.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <ConfettiParticleView
          key={particle.id}
          particle={particle}
          duration={duration}
          screenHeight={height}
        />
      ))}
    </View>
  );
}

interface ConfettiParticleViewProps {
  particle: ConfettiParticle;
  duration: number;
  screenHeight: number;
}

function ConfettiParticleView({
  particle,
  duration,
  screenHeight,
}: ConfettiParticleViewProps) {
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    scale.value = withSequence(
      withTiming(1.2, { duration: 100 }),
      withTiming(1, { duration: 100 }),
    );

    // Physics-based motion
    const finalY = screenHeight + 100;
    const travelDistance = finalY - particle.y;
    const fallDuration = duration * 0.8;

    // Horizontal motion with air resistance
    translateX.value = withTiming(particle.velocityX * 50, {
      duration: fallDuration,
      easing: Easing.out(Easing.cubic),
    });

    // Vertical motion with gravity (quadratic ease for gravity effect)
    translateY.value = withTiming(travelDistance, {
      duration: fallDuration,
      easing: Easing.in(Easing.quad),
    });

    // Rotation
    rotate.value = withTiming(particle.rotation + 720 + Math.random() * 360, {
      duration: fallDuration,
      easing: Easing.out(Easing.cubic),
    });

    // Fade out towards the end
    opacity.value = withDelay(
      fallDuration * 0.6,
      withTiming(0, { duration: fallDuration * 0.4 }),
    );
  }, [
    duration,
    opacity,
    particle.rotation,
    particle.velocityX,
    particle.y,
    rotate,
    scale,
    screenHeight,
    translateX,
    translateY,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  // Randomly choose between rectangle and circle shape
  const isCircle = particle.id % 3 === 0;
  const isSquare = particle.id % 3 === 1;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: particle.x,
          top: particle.y,
          width: particle.size,
          height: isSquare ? particle.size : particle.size * 1.5,
          backgroundColor: particle.color,
          borderRadius: isCircle ? particle.size / 2 : isSquare ? 2 : 1,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * Hook to trigger confetti
 */
export function useConfetti() {
  const [active, setActive] = useState(false);

  const fire = useCallback((options?: { onComplete?: () => void }) => {
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    setActive(false);
  }, []);

  const handleComplete = useCallback(() => {
    setActive(false);
  }, []);

  return {
    active,
    fire,
    stop,
    handleComplete,
  };
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    overflow: "hidden",
  },
  particle: {
    position: "absolute",
  },
});
