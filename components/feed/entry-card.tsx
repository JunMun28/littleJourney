import { useCallback } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Animated, {
  Layout,
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Calendar } from "lucide-react-native";

import { ThemedText } from "@/components/themed-text";
import { PhotoCarousel } from "@/components/photo-carousel";
import { VideoPlayer } from "@/components/video-player";
import { Chip } from "@/components/ui/chip";
import { type Entry } from "@/contexts/entry-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { cardPressIn, cardPressOut, Entering } from "@/utils/animations";
import { Spacing, Radius, Shadows } from "@/constants/design-tokens";

interface EntryCardProps {
  entry: Entry;
  onPress: () => void;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRelativeDate(date: string): string {
  const now = new Date();
  const entryDate = new Date(date);
  const diffTime = Math.abs(now.getTime() - entryDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  return formatDate(date);
}

export function EntryCard({ entry, onPress, index = 0 }: EntryCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = cardPressIn();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = cardPressOut();
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const aiTags = entry.aiLabels?.slice(0, 3) || [];
  const hasMedia = entry.mediaUris && entry.mediaUris.length > 0;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : Entering.listItem(index + 3)}
      layout={Layout.springify()}
    >
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          { backgroundColor: colors.backgroundSecondary },
          Shadows.sm,
          animatedStyle,
        ]}
      >
        {entry.type === "photo" && hasMedia && (
          <View style={styles.mediaContainer}>
            <PhotoCarousel images={entry.mediaUris!} onImagePress={onPress} />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.3)"]}
              style={styles.gradientOverlay}
              pointerEvents="none"
            />
          </View>
        )}
        {entry.type === "video" && hasMedia && (
          <VideoPlayer
            uri={entry.mediaUris![0]}
            onPress={onPress}
            showControls={true}
          />
        )}

        {aiTags.length > 0 && (
          <View style={styles.aiTags}>
            {aiTags.map((tag) => (
              <Chip key={tag} label={tag} />
            ))}
          </View>
        )}

        {entry.caption && (
          <ThemedText style={styles.caption}>{entry.caption}</ThemedText>
        )}

        <View style={styles.meta}>
          {entry.createdByName && (
            <ThemedText
              style={[styles.attribution, { color: colors.textSecondary }]}
            >
              Posted by {entry.createdByName}
            </ThemedText>
          )}
          <View style={styles.dateContainer}>
            <Calendar
              size={12}
              color={colors.textMuted}
              style={styles.dateIcon}
            />
            <ThemedText style={[styles.date, { color: colors.textSecondary }]}>
              {getRelativeDate(entry.date)}
            </ThemedText>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  mediaContainer: {
    position: "relative",
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  aiTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: Spacing.md,
    paddingBottom: 0,
  },
  caption: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
    fontSize: 15,
    lineHeight: 22,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  attribution: {
    fontSize: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateIcon: {
    marginRight: 4,
  },
  date: {
    fontSize: 12,
  },
});
