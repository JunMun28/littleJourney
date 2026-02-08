/**
 * Toast Notification Component
 *
 * Slide-in notifications with auto-dismiss and action support.
 * Replaces Alert.alert throughout the app.
 */

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  FadeInDown,
  FadeOutUp,
  useReducedMotion,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
} from "lucide-react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ThemeColors,
  Spacing,
  Radius,
  Shadows,
  Typography,
  Primary,
  Semantic,
  Accent,
} from "@/constants/design-tokens";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
  action?: ToastAction;
}

interface ToastContextValue {
  show: (
    message: string,
    options?: {
      variant?: ToastVariant;
      duration?: number;
      action?: ToastAction;
    },
  ) => void;
  success: (message: string, action?: ToastAction) => void;
  error: (message: string, action?: ToastAction) => void;
  info: (message: string, action?: ToastAction) => void;
  warning: (message: string, action?: ToastAction) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const DEFAULT_DURATION = 3000;

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (
      message: string,
      options?: {
        variant?: ToastVariant;
        duration?: number;
        action?: ToastAction;
      },
    ) => {
      const id = `toast-${++toastIdRef.current}`;
      const variant = options?.variant ?? "info";
      const duration = options?.duration ?? DEFAULT_DURATION;

      setToasts((prev) => [
        ...prev,
        { id, message, variant, duration, action: options?.action },
      ]);

      // Haptic feedback based on variant
      if (variant === "success") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (variant === "error") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (variant === "warning") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [],
  );

  const success = useCallback(
    (message: string, action?: ToastAction) => {
      show(message, { variant: "success", action });
    },
    [show],
  );

  const error = useCallback(
    (message: string, action?: ToastAction) => {
      show(message, { variant: "error", action });
    },
    [show],
  );

  const info = useCallback(
    (message: string, action?: ToastAction) => {
      show(message, { variant: "info", action });
    },
    [show],
  );

  const warning = useCallback(
    (message: string, action?: ToastAction) => {
      show(message, { variant: "warning", action });
    },
    [show],
  );

  return (
    <ToastContext.Provider
      value={{ show, success, error, info, warning, dismiss }}
    >
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(100);

  const handleDismiss = useCallback(() => {
    onDismiss(toast.id);
  }, [onDismiss, toast.id]);

  // Auto-dismiss timer
  useState(() => {
    if (toast.duration && toast.duration > 0) {
      progress.value = withDelay(
        100,
        withTiming(0, { duration: toast.duration }, (finished) => {
          if (finished) {
            runOnJS(handleDismiss)();
          }
        }),
      );
    }
  });

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const variantConfig = getVariantConfig(toast.variant, colorScheme);
  const IconComponent = variantConfig.icon;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.springify().damping(15)}
      exiting={reduceMotion ? undefined : FadeOutUp.duration(200)}
      style={[
        styles.toast,
        Shadows.md,
        {
          backgroundColor: colors.card,
          borderColor: variantConfig.borderColor,
        },
      ]}
    >
      <View style={styles.toastContent}>
        <IconComponent size={20} color={variantConfig.iconColor} />
        <Text
          style={[Typography.bodySmall, styles.message, { color: colors.text }]}
        >
          {toast.message}
        </Text>
        {toast.action && (
          <Pressable
            onPress={() => {
              toast.action?.onPress();
              handleDismiss();
            }}
            style={styles.actionButton}
          >
            <Text style={[Typography.captionMedium, { color: Primary[500] }]}>
              {toast.action.label}
            </Text>
          </Pressable>
        )}
        <Pressable onPress={handleDismiss} hitSlop={12}>
          <X size={18} color={colors.iconMuted} />
        </Pressable>
      </View>
      {toast.duration && toast.duration > 0 && (
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              { backgroundColor: variantConfig.progressColor },
              progressStyle,
            ]}
          />
        </View>
      )}
    </Animated.View>
  );
}

function getVariantConfig(
  variant: ToastVariant,
  colorScheme: "light" | "dark",
) {
  const configs = {
    success: {
      icon: CheckCircle,
      iconColor: Semantic.success,
      borderColor:
        colorScheme === "light" ? Semantic.successLight : Semantic.success,
      progressColor: Semantic.success,
    },
    error: {
      icon: AlertCircle,
      iconColor: Semantic.error,
      borderColor:
        colorScheme === "light" ? Semantic.errorLight : Semantic.error,
      progressColor: Semantic.error,
    },
    warning: {
      icon: AlertTriangle,
      iconColor: Semantic.warning,
      borderColor:
        colorScheme === "light" ? Semantic.warningLight : Semantic.warning,
      progressColor: Semantic.warning,
    },
    info: {
      icon: Info,
      iconColor: Accent.sky,
      borderColor: colorScheme === "light" ? Accent.skyLight : Accent.sky,
      progressColor: Accent.sky,
    },
  };

  return configs[variant];
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 9999,
    gap: Spacing.sm,
  },
  toast: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  message: {
    flex: 1,
  },
  actionButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  progressContainer: {
    height: 3,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  progressBar: {
    height: "100%",
  },
});
