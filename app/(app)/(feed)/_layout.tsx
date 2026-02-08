import { Stack } from "expo-router/stack";
import { PlatformColor } from "react-native";

export default function FeedLayout() {
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
          title: "Feed",
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="entry/[id]"
        options={{
          title: "Memory",
          headerLargeTitle: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="create-entry"
        options={{
          title: "New Entry",
          headerLargeTitle: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.5, 0.85],
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          title: "Search",
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: "Profile",
          headerLargeTitle: true,
        }}
      />
    </Stack>
  );
}
