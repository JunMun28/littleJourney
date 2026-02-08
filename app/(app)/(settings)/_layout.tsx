import { Stack } from "expo-router/stack";
import { PlatformColor } from "react-native";

export default function SettingsLayout() {
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
          title: "Settings",
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="photo-book"
        options={{
          title: "Photo Book",
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen
        name="community"
        options={{
          title: "Community",
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen
        name="red-packet"
        options={{
          title: "Red Packet",
          headerLargeTitle: false,
        }}
      />
    </Stack>
  );
}
