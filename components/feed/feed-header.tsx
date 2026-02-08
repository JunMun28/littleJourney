import { View, Pressable, StyleSheet } from "react-native";
import Animated, {
  FadeInDown,
  useReducedMotion,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { Spacing } from "@/constants/design-tokens";

interface FeedHeaderProps {
  childName?: string;
  childAge?: string;
  onAvatarPress?: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function FeedHeader({
  childName,
  childAge,
  onAvatarPress,
}: FeedHeaderProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const reduceMotion = useReducedMotion();

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(0).springify()}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <ThemedText
            style={[styles.greeting, { color: colors.textSecondary }]}
          >
            {getGreeting()}
          </ThemedText>
          {childName && (
            <ThemedText type="title" style={styles.childName}>
              {childName}
              {childAge && (
                <ThemedText
                  style={[styles.childAge, { color: colors.textSecondary }]}
                >
                  {" "}
                  • {childAge}
                </ThemedText>
              )}
            </ThemedText>
          )}
        </View>
        {childName && (
          <Pressable onPress={onAvatarPress} hitSlop={8}>
            <Avatar name={childName} size="lg" showActivity={false} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  childName: {
    fontSize: 24,
    fontWeight: "700",
  },
  childAge: {
    fontSize: 16,
    fontWeight: "400",
  },
});
