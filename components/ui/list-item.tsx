/**
 * ListItem Component
 *
 * Consistent list rows with press animation and swipe actions.
 */

import { useCallback, type ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  type ViewStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedGestureHandler,
} from "react-native-reanimated";
import {
  PanGestureHandler,
  type PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { ChevronRight, Trash2, Edit3 } from "lucide-react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ThemeColors,
  Primary,
  Semantic,
  Spacing,
  FontWeight,
} from "@/constants/design-tokens";
import { cardPressIn, cardPressOut, SPRING_GENTLE } from "@/utils/animations";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ListItemProps {
  /** Main title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Left content (icon, avatar) */
  left?: ReactNode;
  /** Right content (value, badge) */
  right?: ReactNode;
  /** Show chevron indicator */
  showChevron?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Show divider below */
  showDivider?: boolean;
  /** Swipe to delete */
  onDelete?: () => void;
  /** Swipe to edit */
  onEdit?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Additional styles */
  style?: ViewStyle;
  /** Test ID */
  testID?: string;
}

const SWIPE_THRESHOLD = 80;

export function ListItem({
  title,
  subtitle,
  left,
  right,
  showChevron = false,
  onPress,
  showDivider = true,
  onDelete,
  onEdit,
  disabled = false,
  style,
  testID,
}: ListItemProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);

  const hasSwipeActions = !!onDelete || !!onEdit;

  const handlePressIn = useCallback(() => {
    if (onPress && !disabled) {
      scale.value = cardPressIn();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [disabled, onPress, scale]);

  const handlePressOut = useCallback(() => {
    if (onPress) {
      scale.value = cardPressOut();
    }
  }, [onPress, scale]);

  const executeDelete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete?.();
  }, [onDelete]);

  const executeEdit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEdit?.();
  }, [onEdit]);

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number }
  >({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      const newX = ctx.startX + event.translationX;
      // Only allow left swipe (negative values)
      translateX.value = Math.min(0, Math.max(newX, -SWIPE_THRESHOLD * 2));
    },
    onEnd: (event) => {
      if (translateX.value < -SWIPE_THRESHOLD && onDelete) {
        translateX.value = withSpring(-SWIPE_THRESHOLD, SPRING_GENTLE);
      } else {
        translateX.value = withSpring(0, SPRING_GENTLE);
      }
    },
  });

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
  }));

  const animatedActionsStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -20 ? 1 : 0,
    transform: [{ translateX: translateX.value + SWIPE_THRESHOLD }],
  }));

  const content = (
    <>
      {left && <View style={styles.left}>{left}</View>}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: disabled ? colors.textMuted : colors.text },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {right && <View style={styles.right}>{right}</View>}
      {showChevron && (
        <ChevronRight
          size={20}
          color={colors.iconMuted}
          style={styles.chevron}
        />
      )}
    </>
  );

  const itemContent = onPress ? (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.container,
        { backgroundColor: colors.background },
        animatedContentStyle,
        style,
      ]}
      testID={testID}
    >
      {content}
      {showDivider && (
        <View
          style={[styles.divider, { backgroundColor: colors.borderLight }]}
        />
      )}
    </AnimatedPressable>
  ) : (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.background },
        animatedContentStyle,
        style,
      ]}
      testID={testID}
    >
      {content}
      {showDivider && (
        <View
          style={[styles.divider, { backgroundColor: colors.borderLight }]}
        />
      )}
    </Animated.View>
  );

  if (hasSwipeActions) {
    return (
      <View style={styles.swipeContainer}>
        <Animated.View style={[styles.actions, animatedActionsStyle]}>
          {onEdit && (
            <Pressable
              onPress={executeEdit}
              style={[styles.actionButton, { backgroundColor: Primary[500] }]}
            >
              <Edit3 size={20} color="#FFFFFF" />
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              onPress={executeDelete}
              style={[styles.actionButton, { backgroundColor: Semantic.error }]}
            >
              <Trash2 size={20} color="#FFFFFF" />
            </Pressable>
          )}
        </Animated.View>
        <PanGestureHandler onGestureEvent={gestureHandler}>
          {itemContent}
        </PanGestureHandler>
      </View>
    );
  }

  return itemContent;
}

const styles = StyleSheet.create({
  swipeContainer: {
    position: "relative",
    overflow: "hidden",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 56,
  },
  left: {
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: FontWeight.medium,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  right: {
    marginLeft: Spacing.md,
  },
  chevron: {
    marginLeft: Spacing.sm,
  },
  divider: {
    position: "absolute",
    bottom: 0,
    left: Spacing.lg,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  actions: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: SWIPE_THRESHOLD,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
