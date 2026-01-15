import { useState } from "react";
import {
  StyleSheet,
  Pressable,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useChild, type CulturalTradition } from "@/contexts/child-context";
import { PRIMARY_COLOR, Colors, Spacing } from "@/constants/theme";

interface CultureOption {
  value: CulturalTradition;
  label: string;
  description: string;
}

const CULTURE_OPTIONS: CultureOption[] = [
  {
    value: "chinese",
    label: "Chinese",
    description: "Full Month, 100 Days, Zhua Zhou",
  },
  {
    value: "malay",
    label: "Malay",
    description: "Aqiqah, Cukur Jambul, Hari Raya",
  },
  {
    value: "indian",
    label: "Indian",
    description: "Naming Ceremony, Annaprashan, Deepavali",
  },
  {
    value: "none",
    label: "None / Other",
    description: "Universal milestones only",
  },
];

export default function SelectCultureScreen() {
  const { updateChild } = useChild();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [selectedCulture, setSelectedCulture] =
    useState<CulturalTradition | null>(null);

  const handleContinue = () => {
    if (!selectedCulture) return;

    updateChild({ culturalTradition: selectedCulture });
    router.push("/(onboarding)/set-prompt-time");
  };

  const isFormValid = selectedCulture !== null;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Cultural Traditions
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Select your family&apos;s cultural tradition to get personalized
        milestone suggestions
      </ThemedText>

      <View style={styles.optionsContainer}>
        {CULTURE_OPTIONS.map((option) => {
          const isSelected = selectedCulture === option.value;
          return (
            <Pressable
              key={option.value}
              style={[
                styles.option,
                {
                  borderColor: isSelected ? PRIMARY_COLOR : colors.border,
                  backgroundColor: isSelected
                    ? `${PRIMARY_COLOR}10`
                    : colors.background,
                },
              ]}
              onPress={() => setSelectedCulture(option.value)}
              testID={`culture-${option.value}`}
            >
              <View style={styles.radioOuter}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
              <View style={styles.optionContent}>
                <ThemedText style={styles.optionLabel}>
                  {option.label}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.optionDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {option.description}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.button, !isFormValid && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!isFormValid}
          testID="continue-button"
        >
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: 48,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.xxl,
    opacity: 0.7,
  },
  optionsContainer: {
    flex: 1,
    gap: Spacing.md,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderWidth: 2,
    borderRadius: Spacing.md,
    gap: Spacing.md,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PRIMARY_COLOR,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  optionDescription: {
    fontSize: 14,
  },
  footer: {
    paddingTop: Spacing.lg,
  },
  button: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderRadius: Spacing.md,
    alignItems: "center",
    backgroundColor: PRIMARY_COLOR,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#fff",
  },
});
