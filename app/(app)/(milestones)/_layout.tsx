import { Stack } from "expo-router/stack";
import { PlatformColor } from "react-native";

export default function MilestonesLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: "transparent" },
        headerTitleStyle: { color: PlatformColor("label") },
        headerLargeTitle: true,
        headerBlurEffect: "none",
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Milestones",
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="complete/[id]"
        options={{
          title: "Complete Milestone",
          headerLargeTitle: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.5, 0.85],
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen
        name="first-words"
        options={{
          title: "First Words",
          headerLargeTitle: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.5, 0.85],
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen
        name="create-custom"
        options={{
          title: "Custom Milestone",
          headerLargeTitle: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.5, 0.85],
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen
        name="development-timeline"
        options={{
          title: "Development Timeline",
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen
        name="badges"
        options={{
          title: "Badges",
          headerLargeTitle: false,
        }}
      />
    </Stack>
  );
}
