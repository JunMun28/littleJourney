/**
 * Child Profile Card Component
 *
 * Displays child profile information with edit action.
 */

import { View, Text, Image, Pressable, StyleSheet, Alert } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemeColors, Primary, Spacing } from "@/constants/design-tokens";
import { type CulturalTradition } from "@/contexts/child-context";

export interface ChildProfile {
  id: string;
  name: string;
  nickname?: string;
  dateOfBirth: string;
  photoUri?: string;
  culturalTradition?: CulturalTradition;
}

interface ChildProfileCardProps {
  child: ChildProfile | null;
  onEdit: () => void;
  onAddChild: () => void;
}

function getCultureLabel(culture: CulturalTradition): string {
  switch (culture) {
    case "chinese":
      return "Chinese";
    case "malay":
      return "Malay";
    case "indian":
      return "Indian";
    default:
      return "None";
  }
}

export function ChildProfileCard({
  child,
  onEdit,
  onAddChild,
}: ChildProfileCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];

  const handleAddChild = () => {
    if (child) {
      Alert.alert(
        "MVP Limit",
        "Multiple children support is coming soon! The current version supports one child per account.",
        [{ text: "OK" }],
      );
    } else {
      onAddChild();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        Child Profile
      </Text>

      {child ? (
        <View style={styles.profileContainer}>
          <View style={styles.profileInfo}>
            {child.photoUri ? (
              <Image source={{ uri: child.photoUri }} style={styles.photo} />
            ) : (
              <View
                style={[
                  styles.photoPlaceholder,
                  { backgroundColor: colors.backgroundTertiary },
                ]}
              >
                <Text style={styles.photoPlaceholderText}>👶</Text>
              </View>
            )}
            <View style={styles.details}>
              <Text style={[styles.name, { color: colors.text }]}>
                {child.name}
              </Text>
              {child.nickname && (
                <Text
                  style={[styles.nickname, { color: colors.textSecondary }]}
                >
                  &ldquo;{child.nickname}&rdquo;
                </Text>
              )}
              <Text style={[styles.dob, { color: colors.textSecondary }]}>
                Born{" "}
                {new Date(child.dateOfBirth).toLocaleDateString("en-SG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              {child.culturalTradition &&
                child.culturalTradition !== "none" && (
                  <Text style={styles.culture}>
                    {getCultureLabel(child.culturalTradition)} tradition
                  </Text>
                )}
            </View>
          </View>
          <Pressable
            style={styles.editButton}
            onPress={onEdit}
            testID="edit-child-button"
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={[styles.noChildText, { color: colors.textMuted }]}>
          No child profile added
        </Text>
      )}

      <Pressable
        style={[
          styles.addButton,
          child && styles.addButtonDisabled,
          { borderColor: child ? colors.border : Primary[500] },
        ]}
        onPress={handleAddChild}
        testID="add-child-button"
        disabled={!!child}
        accessibilityState={{ disabled: !!child }}
      >
        <Text
          style={[styles.addButtonText, child && { color: colors.textMuted }]}
        >
          {child ? "Add Another Child (Coming Soon)" : "Add Child"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  photoPlaceholderText: {
    fontSize: 28,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
  },
  nickname: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 2,
  },
  dob: {
    fontSize: 14,
    marginTop: 2,
  },
  culture: {
    fontSize: 13,
    color: Primary[500],
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 16,
    color: Primary[500],
    fontWeight: "500",
  },
  noChildText: {
    fontSize: 15,
    textAlign: "center",
    paddingVertical: 16,
  },
  addButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: Primary[500],
  },
});
