/**
 * TextInput Component
 *
 * Themed input with focus animations, icon support, and validation states.
 */

import { useState, useCallback, useRef } from "react";
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  Pressable,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { type LucideIcon } from "lucide-react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ThemeColors,
  Primary,
  Semantic,
  Spacing,
  Radius,
  FontWeight,
  InputTokens,
} from "@/constants/design-tokens";
import { TIMING_FAST } from "@/utils/animations";

const AnimatedView = Animated.View;

interface TextInputProps extends Omit<RNTextInputProps, "style"> {
  /** Input label */
  label?: string;
  /** Left icon */
  leftIcon?: LucideIcon;
  /** Right icon */
  rightIcon?: LucideIcon;
  /** Right icon press handler */
  onRightIconPress?: () => void;
  /** Error state message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Show character count */
  showCharCount?: boolean;
  /** Use floating label animation */
  floatingLabel?: boolean;
  /** Container style */
  containerStyle?: ViewStyle;
}

export function TextInput({
  label,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onRightIconPress,
  error,
  helperText,
  showCharCount = false,
  maxLength,
  floatingLabel = false,
  value,
  onFocus,
  onBlur,
  containerStyle,
  ...rest
}: TextInputProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];
  const inputRef = useRef<RNTextInput>(null);

  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);
  const labelAnim = useSharedValue(value ? 1 : 0);

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<RNTextInputProps["onFocus"]>>[0]) => {
      setIsFocused(true);
      focusAnim.value = withTiming(1, TIMING_FAST);
      if (floatingLabel) {
        labelAnim.value = withTiming(1, TIMING_FAST);
      }
      onFocus?.(e);
    },
    [focusAnim, floatingLabel, labelAnim, onFocus],
  );

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<RNTextInputProps["onBlur"]>>[0]) => {
      setIsFocused(false);
      focusAnim.value = withTiming(0, TIMING_FAST);
      if (floatingLabel && !value) {
        labelAnim.value = withTiming(0, TIMING_FAST);
      }
      onBlur?.(e);
    },
    [focusAnim, floatingLabel, labelAnim, onBlur, value],
  );

  const borderStyle = useAnimatedStyle(() => {
    const borderColor = error
      ? Semantic.error
      : interpolateColor(
          focusAnim.value,
          [0, 1],
          [colors.inputBorder, Primary[500]],
        );

    return {
      borderColor,
      borderWidth: focusAnim.value > 0.5 ? 2 : 1,
    };
  });

  const floatingLabelStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(labelAnim.value > 0.5 ? -24 : 0, TIMING_FAST),
        },
        {
          scale: withTiming(labelAnim.value > 0.5 ? 0.85 : 1, TIMING_FAST),
        },
      ],
      color: error
        ? Semantic.error
        : labelAnim.value > 0.5
          ? Primary[500]
          : colors.placeholder,
    };
  });

  const hasValue = value && value.length > 0;
  const charCount = value?.length ?? 0;
  const iconColor = error
    ? Semantic.error
    : isFocused
      ? Primary[500]
      : colors.icon;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && !floatingLabel && (
        <Text
          style={[
            styles.label,
            { color: error ? Semantic.error : colors.text },
          ]}
        >
          {label}
        </Text>
      )}

      <AnimatedView
        style={[
          styles.inputContainer,
          { backgroundColor: colors.inputBackground },
          borderStyle,
        ]}
      >
        {LeftIcon && (
          <LeftIcon size={20} color={iconColor} style={styles.leftIcon} />
        )}

        {floatingLabel && label && (
          <Animated.Text
            style={[styles.floatingLabel, floatingLabelStyle]}
            pointerEvents="none"
          >
            {label}
          </Animated.Text>
        )}

        <RNTextInput
          ref={inputRef}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
          placeholderTextColor={colors.placeholder}
          style={[
            styles.input,
            { color: colors.text },
            LeftIcon && styles.inputWithLeftIcon,
            RightIcon && styles.inputWithRightIcon,
            floatingLabel && hasValue && styles.inputWithFloatingLabel,
          ]}
          {...rest}
        />

        {RightIcon && (
          <Pressable
            onPress={onRightIconPress}
            hitSlop={12}
            disabled={!onRightIconPress}
          >
            <RightIcon size={20} color={iconColor} style={styles.rightIcon} />
          </Pressable>
        )}
      </AnimatedView>

      <View style={styles.footer}>
        {(error || helperText) && (
          <Text
            style={[
              styles.helperText,
              { color: error ? Semantic.error : colors.textMuted },
            ]}
          >
            {error || helperText}
          </Text>
        )}
        {showCharCount && maxLength && (
          <Text
            style={[
              styles.charCount,
              {
                color:
                  charCount >= maxLength ? Semantic.error : colors.textMuted,
              },
            ]}
          >
            {charCount}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.sm,
    minHeight: InputTokens.minHeight,
    paddingHorizontal: Spacing.md,
    position: "relative",
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.md,
  },
  inputWithLeftIcon: {
    marginLeft: Spacing.sm,
  },
  inputWithRightIcon: {
    marginRight: Spacing.sm,
  },
  inputWithFloatingLabel: {
    paddingTop: Spacing.lg,
  },
  leftIcon: {
    // Positioned by flex
  },
  rightIcon: {
    // Positioned by flex
  },
  floatingLabel: {
    position: "absolute",
    left: Spacing.md,
    fontSize: 16,
    transformOrigin: "left top",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
    minHeight: 18,
  },
  helperText: {
    fontSize: 12,
    flex: 1,
  },
  charCount: {
    fontSize: 12,
    marginLeft: Spacing.sm,
  },
});
