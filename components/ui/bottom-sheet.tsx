/**
 * BottomSheet Component
 *
 * Gesture-enabled bottom sheet with drag-to-dismiss and snap points.
 */

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
  type ReactNode,
} from "react";
import {
  View,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedGestureHandler,
} from "react-native-reanimated";
import {
  PanGestureHandler,
  type PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ThemeColors,
  Spacing,
  Radius,
  Shadows,
  Neutral,
} from "@/constants/design-tokens";
import { SPRING_GENTLE, TIMING_FAST } from "@/utils/animations";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface BottomSheetRef {
  open: () => void;
  close: () => void;
  snapTo: (index: number) => void;
}

interface BottomSheetProps {
  /** Sheet content */
  children: ReactNode;
  /** Initial visibility */
  visible?: boolean;
  /** Close handler */
  onClose?: () => void;
  /** Snap points as percentages (e.g., [0.5, 0.9]) */
  snapPoints?: number[];
  /** Initial snap point index */
  initialSnapIndex?: number;
  /** Show backdrop overlay */
  showBackdrop?: boolean;
  /** Close on backdrop press */
  closeOnBackdropPress?: boolean;
  /** Close on drag down */
  enableDragToClose?: boolean;
  /** Custom handle component */
  customHandle?: ReactNode;
  /** Additional styles */
  style?: ViewStyle;
  /** Test ID */
  testID?: string;
}

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  function BottomSheet(
    {
      children,
      visible = false,
      onClose,
      snapPoints = [0.5, 0.9],
      initialSnapIndex = 0,
      showBackdrop = true,
      closeOnBackdropPress = true,
      enableDragToClose = true,
      customHandle,
      style,
      testID,
    },
    ref,
  ) {
    const { height: windowHeight } = useWindowDimensions();
    const colorScheme = useColorScheme() ?? "light";
    const colors = ThemeColors[colorScheme];

    const translateY = useSharedValue(windowHeight);
    const backdropOpacity = useSharedValue(0);
    const currentSnapIndex = useSharedValue(initialSnapIndex);

    const getSnapPosition = useCallback(
      (index: number) => {
        const snapPoint = snapPoints[index] ?? snapPoints[0];
        return windowHeight * (1 - snapPoint);
      },
      [snapPoints, windowHeight],
    );

    const handleClose = useCallback(() => {
      translateY.value = withTiming(windowHeight, TIMING_FAST);
      backdropOpacity.value = withTiming(0, TIMING_FAST);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose?.();
    }, [backdropOpacity, onClose, translateY, windowHeight]);

    const handleOpen = useCallback(() => {
      const targetPosition = getSnapPosition(initialSnapIndex);
      translateY.value = withSpring(targetPosition, SPRING_GENTLE);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      currentSnapIndex.value = initialSnapIndex;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [
      backdropOpacity,
      currentSnapIndex,
      getSnapPosition,
      initialSnapIndex,
      translateY,
    ]);

    const snapTo = useCallback(
      (index: number) => {
        const clampedIndex = Math.max(
          0,
          Math.min(index, snapPoints.length - 1),
        );
        const targetPosition = getSnapPosition(clampedIndex);
        translateY.value = withSpring(targetPosition, SPRING_GENTLE);
        currentSnapIndex.value = clampedIndex;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      [currentSnapIndex, getSnapPosition, snapPoints.length, translateY],
    );

    useImperativeHandle(ref, () => ({
      open: handleOpen,
      close: handleClose,
      snapTo,
    }));

    useEffect(() => {
      if (visible) {
        handleOpen();
      } else {
        translateY.value = windowHeight;
        backdropOpacity.value = 0;
      }
    }, [visible, handleOpen, translateY, backdropOpacity, windowHeight]);

    const gestureHandler = useAnimatedGestureHandler<
      PanGestureHandlerGestureEvent,
      { startY: number }
    >({
      onStart: (_, ctx) => {
        ctx.startY = translateY.value;
      },
      onActive: (event, ctx) => {
        translateY.value = Math.max(
          getSnapPosition(snapPoints.length - 1),
          ctx.startY + event.translationY,
        );
      },
      onEnd: (event) => {
        const velocity = event.velocityY;

        // Check if we should close
        if (
          enableDragToClose &&
          (velocity > 500 || translateY.value > windowHeight * 0.7)
        ) {
          runOnJS(handleClose)();
          return;
        }

        // Find the nearest snap point
        let nearestIndex = 0;
        let nearestDistance = Infinity;

        for (let i = 0; i < snapPoints.length; i++) {
          const snapPosition = getSnapPosition(i);
          const distance = Math.abs(translateY.value - snapPosition);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = i;
          }
        }

        // Account for velocity
        if (velocity > 200 && nearestIndex > 0) {
          nearestIndex -= 1;
        } else if (velocity < -200 && nearestIndex < snapPoints.length - 1) {
          nearestIndex += 1;
        }

        translateY.value = withSpring(
          getSnapPosition(nearestIndex),
          SPRING_GENTLE,
        );
        currentSnapIndex.value = nearestIndex;
      },
    });

    const sheetStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
      opacity: backdropOpacity.value,
      pointerEvents: backdropOpacity.value > 0.1 ? "auto" : "none",
    }));

    return (
      <>
        {showBackdrop && (
          <AnimatedPressable
            style={[
              styles.backdrop,
              { backgroundColor: colors.overlay },
              backdropStyle,
            ]}
            onPress={closeOnBackdropPress ? handleClose : undefined}
          />
        )}

        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                height: windowHeight,
              },
              Shadows.xl,
              sheetStyle,
              style,
            ]}
            testID={testID}
          >
            {customHandle ?? (
              <View style={styles.handleContainer}>
                <View
                  style={[styles.handle, { backgroundColor: Neutral[300] }]}
                />
              </View>
            )}

            <View style={styles.content}>{children}</View>
          </Animated.View>
        </PanGestureHandler>
      </>
    );
  },
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    zIndex: 101,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
});
