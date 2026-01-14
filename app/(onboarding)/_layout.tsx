import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackVisible: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen
        name="add-child"
        options={{
          title: "Add Your Child",
        }}
      />
      <Stack.Screen
        name="select-culture"
        options={{
          title: "Cultural Traditions",
        }}
      />
      <Stack.Screen
        name="set-prompt-time"
        options={{
          title: "Daily Reminder",
        }}
      />
      <Stack.Screen
        name="invite-family"
        options={{
          title: "Invite Family",
        }}
      />
      <Stack.Screen
        name="first-entry"
        options={{
          title: "First Moment",
        }}
      />
    </Stack>
  );
}
