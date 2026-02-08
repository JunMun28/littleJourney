/**
 * Category Filter Component
 *
 * Horizontal scrolling category filter for milestones.
 */

import { ScrollView, Text, Pressable, StyleSheet } from "react-native";
import {
  Baby,
  Brain,
  MessageCircle,
  Users,
  Sparkles,
  Heart,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors, Spacing } from "@/constants/theme";
import { Primary } from "@/constants/design-tokens";

export type MilestoneCategory =
  | "all"
  | "motor"
  | "cognitive"
  | "language"
  | "social"
  | "cultural";

const CATEGORY_CONFIG: {
  id: MilestoneCategory;
  label: string;
  icon: typeof Baby;
}[] = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "motor", label: "Motor", icon: Baby },
  { id: "cognitive", label: "Cognitive", icon: Brain },
  { id: "language", label: "Language", icon: MessageCircle },
  { id: "social", label: "Social", icon: Users },
  { id: "cultural", label: "Cultural", icon: Heart },
];

interface CategoryFilterProps {
  selectedCategory: MilestoneCategory;
  onCategoryChange: (category: MilestoneCategory) => void;
}

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryFilter}
      contentContainerStyle={styles.categoryFilterContent}
    >
      {CATEGORY_CONFIG.map((category) => {
        const IconComponent = category.icon;
        const isSelected = selectedCategory === category.id;
        return (
          <Pressable
            key={category.id}
            onPress={() => {
              onCategoryChange(category.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[
              styles.categoryChip,
              {
                backgroundColor: isSelected
                  ? Primary[500]
                  : colors.backgroundSecondary,
                borderColor: isSelected ? Primary[500] : colors.border,
              },
            ]}
          >
            <IconComponent
              size={16}
              color={isSelected ? "#FFFFFF" : colors.textSecondary}
            />
            <Text
              style={[
                styles.categoryChipText,
                { color: isSelected ? "#FFFFFF" : colors.text },
              ]}
            >
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  categoryFilter: {
    maxHeight: 50,
    marginTop: Spacing.sm,
  },
  categoryFilterContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
