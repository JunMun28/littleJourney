/**
 * Avatar Component
 *
 * Displays user/child photos with initials fallback and activity indicators.
 */

import { useState, useMemo } from "react";
import { View, Text, StyleSheet, type ViewStyle } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { Image } from "expo-image";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ThemeColors,
  Primary,
  Neutral,
  FontWeight,
} from "@/constants/design-tokens";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const AVATAR_SIZES: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const FONT_SIZES: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 20,
  xl: 28,
};

const ACTIVITY_DOT_SIZES: Record<AvatarSize, number> = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
};

interface AvatarProps {
  /** Image source URL */
  source?: string | null;
  /** Name for initials fallback */
  name?: string;
  /** Size preset */
  size?: AvatarSize;
  /** Show online/activity indicator */
  showActivity?: boolean;
  /** Activity indicator color */
  activityColor?: string;
  /** Additional styles */
  style?: ViewStyle;
  /** Test ID */
  testID?: string;
}

export function Avatar({
  source,
  name,
  size = "md",
  showActivity = false,
  activityColor,
  style,
  testID,
}: AvatarProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];
  const reduceMotion = useReducedMotion();
  const [imageError, setImageError] = useState(false);

  const avatarSize = AVATAR_SIZES[size];
  const fontSize = FONT_SIZES[size];
  const activityDotSize = ACTIVITY_DOT_SIZES[size];

  // Generate initials from name
  const initials = useMemo(() => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }, [name]);

  // Generate consistent background color based on name
  const backgroundColor = useMemo(() => {
    if (!name) return Neutral[300];

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Warm color palette for backgrounds
    const warmColors = [
      Primary[100],
      Primary[200],
      "#FFE4E1", // Misty rose
      "#FFDAB9", // Peach puff
      "#FFE4B5", // Moccasin
      "#E6E6FA", // Lavender
      "#D4F1F4", // Light cyan
      "#D5F5E3", // Honeydew
    ];

    return warmColors[Math.abs(hash) % warmColors.length];
  }, [name]);

  const showImage = source && !imageError;

  return (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor,
        },
        style,
      ]}
      testID={testID}
    >
      {showImage ? (
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(300)}
          style={styles.imageContainer}
        >
          <Image
            source={{ uri: source }}
            style={[
              styles.image,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
              },
            ]}
            contentFit="cover"
            onError={() => setImageError(true)}
          />
        </Animated.View>
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize,
              color: Neutral[700],
            },
          ]}
        >
          {initials}
        </Text>
      )}

      {showActivity && (
        <View
          style={[
            styles.activityDot,
            {
              width: activityDotSize,
              height: activityDotSize,
              borderRadius: activityDotSize / 2,
              backgroundColor: activityColor ?? "#22C55E",
              borderColor: colors.background,
              borderWidth: activityDotSize > 10 ? 3 : 2,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

/**
 * Avatar Group for displaying multiple avatars
 */
interface AvatarGroupProps {
  /** Array of avatar data */
  avatars: { source?: string | null; name?: string }[];
  /** Size preset */
  size?: AvatarSize;
  /** Maximum avatars to show */
  max?: number;
  /** Additional styles */
  style?: ViewStyle;
}

export function AvatarGroup({
  avatars,
  size = "sm",
  max = 4,
  style,
}: AvatarGroupProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];
  const avatarSize = AVATAR_SIZES[size];
  const overlap = avatarSize * 0.3;

  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <View style={[styles.groupContainer, style]}>
      {visibleAvatars.map((avatar, index) => (
        <View
          key={index}
          style={[
            styles.groupItem,
            {
              marginLeft: index === 0 ? 0 : -overlap,
              zIndex: visibleAvatars.length - index,
              borderWidth: 2,
              borderColor: colors.background,
              borderRadius: avatarSize / 2 + 2,
            },
          ]}
        >
          <Avatar source={avatar.source} name={avatar.name} size={size} />
        </View>
      ))}
      {remainingCount > 0 && (
        <View
          style={[
            styles.groupItem,
            styles.remainingBadge,
            {
              marginLeft: -overlap,
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              backgroundColor: Neutral[200],
              borderWidth: 2,
              borderColor: colors.background,
            },
          ]}
        >
          <Text
            style={[
              styles.remainingText,
              { fontSize: FONT_SIZES[size] - 2, color: Neutral[600] },
            ]}
          >
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    // Size set dynamically
  },
  initials: {
    fontWeight: FontWeight.semibold,
  },
  activityDot: {
    position: "absolute",
  },
  groupContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  groupItem: {
    // Overlap handled dynamically
  },
  remainingBadge: {
    justifyContent: "center",
    alignItems: "center",
  },
  remainingText: {
    fontWeight: FontWeight.medium,
  },
});
