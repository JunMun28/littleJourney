/**
 * Entry Card with Context Menu
 *
 * Entry card component with iOS-native context menu support
 * for share, edit, and delete actions.
 */

import { useCallback } from "react";
import { View, Pressable, StyleSheet, Alert, Share } from "react-native";
import Animated, {
  Layout,
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Calendar } from "lucide-react-native";
import { Link } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { PhotoCarousel } from "@/components/photo-carousel";
import { VideoPlayer } from "@/components/video-player";
import { Chip } from "@/components/ui/chip";
import { type Entry } from "@/contexts/entry-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { cardPressIn, cardPressOut, Entering } from "@/utils/animations";
import { Spacing, Radius, Shadows } from "@/constants/design-tokens";

interface EntryCardWithMenuProps {
  entry: Entry;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
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

export function EntryCardWithMenu({
  entry,
  onPress,
  onEdit,
  onDelete,
  index = 0,
}: EntryCardWithMenuProps) {
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: entry.caption
          ? `${entry.caption} - Shared from Little Journey`
          : "Check out this moment on Little Journey!",
        title: "Little Journey Memory",
      });
    } catch (error) {
      // Share cancelled or failed
    }
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this memory? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onDelete?.();
          },
        },
      ]
    );
  };

  const aiTags = entry.aiLabels?.slice(0, 3) || [];
  const hasMedia = entry.mediaUris && entry.mediaUris.length > 0;

  const CardContent = (
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
            colors={["transparent", "rgba(0,0,0,0.3)"]]}
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
  );

  return (
    <Animated.View
      entering={reduceMotion ? undefined : Entering.listItem(index + 3)}
      layout={Layout.springify()}
    >
      <Link
        href={`/entry/${entry.id}`}
        asChild
      >
        <Link.Trigger>
          {CardContent}
        </Link.Trigger>
        <Link.Menu>
          <Link.MenuAction
            title="Share"
            icon="square.and.arrow.up"
            onPress={handleShare}
          />
          {onEdit && (
            <Link.MenuAction
              title="Edit"
              icon="pencil"
              onPress={onEdit}
            />
          )}
          <Link.MenuAction
            title="Delete"
            icon="trash"
            destructive
            onPress={handleDelete}
          />
        </Link.Menu>
      </Link>
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
