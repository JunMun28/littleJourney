import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Slot, useSegments, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { ChildProvider } from "@/contexts/child-context";
import { UserPreferencesProvider } from "@/contexts/user-preferences-context";

function RootLayoutNav() {
  const { isAuthenticated, isLoading, hasCompletedOnboarding } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "(onboarding)";

    if (!isAuthenticated) {
      // Not authenticated - go to sign-in
      if (!inAuthGroup) {
        router.replace("/(auth)/sign-in");
      }
    } else if (!hasCompletedOnboarding) {
      // Authenticated but not onboarded - go to onboarding
      if (!inOnboardingGroup) {
        router.replace("/(onboarding)/add-child");
      }
    } else {
      // Authenticated and onboarded - go to main app
      if (inAuthGroup || inOnboardingGroup) {
        router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, isLoading, hasCompletedOnboarding, segments]);

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ChildProvider>
        <UserPreferencesProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <RootLayoutNav />
            <StatusBar style="auto" />
          </ThemeProvider>
        </UserPreferencesProvider>
      </ChildProvider>
    </AuthProvider>
  );
}
