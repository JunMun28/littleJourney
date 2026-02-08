import { Stack } from "expo-router/stack";
import { PlatformColor } from "react-native";

export default function CapsuleLayout() {
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
          title: "Time Capsule",
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Capsule",
          headerLargeTitle: false,
        }}
      />
    </Stack>
  );
}
