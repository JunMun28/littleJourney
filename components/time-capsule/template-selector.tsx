/**
 * Template Selector Component
 *
 * Horizontal scroll of time capsule templates for quick letter creation.
 */

import { ScrollView, Text, Pressable, StyleSheet } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors, Spacing } from "@/constants/theme";

// CAPSULE-008: Time capsule templates
export interface CapsuleTemplate {
  id: string;
  title: string;
  icon: string;
  content: string;
  suggestedAge?: number; // Auto-select this unlock age
}

export const CAPSULE_TEMPLATES: CapsuleTemplate[] = [
  {
    id: "start-blank",
    title: "Start Blank",
    icon: "📝",
    content: "",
  },
  {
    id: "18-year-old",
    title: "Letter to 18-year-old",
    icon: "🎓",
    suggestedAge: 18,
    content: `Dear [Child's Name],

Today you turn 18, and you're officially an adult! I'm writing this letter when you were still so young, and I want you to know how much you mean to me.

When you were little, your favorite thing to do was [favorite activity]. Your smile could light up any room, and watching you discover the world has been the greatest joy of my life.

There are a few things I hope you always remember:

1. You are capable of achieving anything you set your mind to.

2. It's okay to make mistakes - that's how we learn and grow.

3. Always be kind to others and to yourself.

4. Your family will always be here for you, no matter what.

As you step into adulthood, I want you to know that I am incredibly proud of the person you've become. Follow your dreams, be brave, and never stop learning.

With all my love,
[Your Name]`,
  },
  {
    id: "first-day-school",
    title: "First Day of School",
    icon: "🏫",
    suggestedAge: 5,
    content: `Dear [Child's Name],

Today was your very first day of school! I can barely believe how fast you've grown.

You woke up this morning feeling [nervous/excited/curious], and watching you walk through those school gates was such a special moment for me.

You looked so [description] in your uniform/clothes, carrying your new backpack that was almost bigger than you!

Some things I want you to remember about today:
- Your teacher's name was [teacher name]
- You made friends with [if applicable]
- The first thing you told me when you came home was [blank]

I hope school becomes a place where you discover amazing things, make wonderful friends, and grow into the incredible person I know you'll be.

Love always,
[Your Name]`,
  },
  {
    id: "graduation",
    title: "For Graduation Day",
    icon: "🎉",
    suggestedAge: 21,
    content: `Dear [Child's Name],

Congratulations on your graduation! This is such a momentous achievement, and I am bursting with pride.

When I wrote this letter, you were just [age] years old. I remember looking at you and dreaming of all the wonderful things you would accomplish. Now, seeing you graduate, I know those dreams were just the beginning.

The world is full of possibilities waiting for you. As you step into this new chapter:

- Remember where you came from, but don't let it limit where you can go.

- Stay curious - learning doesn't end with graduation.

- Build meaningful relationships - success means nothing without people to share it with.

- Take care of your health - it's your greatest asset.

- Call home sometimes - we miss you!

Whatever path you choose, know that your family is cheering you on every step of the way.

With immense pride and love,
[Your Name]`,
  },
];

interface TemplateSelectorProps {
  onSelectTemplate: (template: CapsuleTemplate) => void;
}

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <ScrollView
      testID="template-selector"
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.templateScroll}
      contentContainerStyle={styles.templateScrollContent}
    >
      {CAPSULE_TEMPLATES.map((template) => (
        <Pressable
          key={template.id}
          testID={`template-option-${template.id}`}
          style={[styles.templateOption, { borderColor: colors.border }]}
          onPress={() => onSelectTemplate(template)}
        >
          <Text style={styles.templateIcon}>{template.icon}</Text>
          <Text
            style={[styles.templateTitle, { color: colors.text }]}
            numberOfLines={2}
          >
            {template.title}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  templateScroll: {
    marginBottom: Spacing.lg,
  },
  templateScrollContent: {
    gap: Spacing.sm,
  },
  templateOption: {
    width: 100,
    height: 80,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.sm,
  },
  templateIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  templateTitle: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
  },
});
