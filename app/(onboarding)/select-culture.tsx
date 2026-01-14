import { useState } from "react";
import { StyleSheet, Pressable, Text, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/auth-context";
import { useChild, type CulturalTradition } from "@/contexts/child-context";
import { useThemeColor } from "@/hooks/use-theme-color";

const PRIMARY_COLOR = "#0a7ea4";

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
  const { completeOnboarding } = useAuth();
  const { updateChild } = useChild();
  const borderColor = useThemeColor({}, "icon");

  const [selectedCulture, setSelectedCulture] =
    useState<CulturalTradition | null>(null);

  const handleContinue = async () => {
    if (!selectedCulture) return;

    updateChild({ culturalTradition: selectedCulture });
    await completeOnboarding();
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
                  borderColor: isSelected ? PRIMARY_COLOR : borderColor,
                  backgroundColor: isSelected
                    ? `${PRIMARY_COLOR}10`
                    : "transparent",
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
                <ThemedText style={styles.optionDescription}>
                  {option.description}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.button,
            {
              backgroundColor: isFormValid ? PRIMARY_COLOR : "#ccc",
            },
          ]}
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
    padding: 24,
    paddingTop: 48,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
    opacity: 0.7,
  },
  optionsContainer: {
    flex: 1,
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
    gap: 12,
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
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  footer: {
    paddingTop: 16,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#fff",
  },
});
