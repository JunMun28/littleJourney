import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Slot, useSegments, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { OfflineBanner } from "@/components/offline-banner";
import { QueryProvider } from "@/providers/query-provider";
import { AppStateProvider } from "@/providers/app-state-provider";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { ChildProvider } from "@/contexts/child-context";
import { EntryProvider } from "@/contexts/entry-context";
import { ExportProvider } from "@/contexts/export-context";
import { FamilyProvider } from "@/contexts/family-context";
import { PhotoBookProvider } from "@/contexts/photo-book-context";
import { MilestoneProvider } from "@/contexts/milestone-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { StorageProvider } from "@/contexts/storage-context";
import { SubscriptionProvider } from "@/contexts/subscription-context";
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

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryProvider>
      <AppStateProvider>
        <AuthProvider>
          <ChildProvider>
            <EntryProvider>
              <FamilyProvider>
                <MilestoneProvider>
                  <UserPreferencesProvider>
                    <NotificationProvider>
                      <StorageProvider>
                        <SubscriptionProvider>
                          <ExportProvider>
                            <PhotoBookProvider>
                              <ThemeProvider
                                value={
                                  colorScheme === "dark"
                                    ? DarkTheme
                                    : DefaultTheme
                                }
                              >
                                <RootLayoutNav />
                                <StatusBar style="auto" />
                              </ThemeProvider>
                            </PhotoBookProvider>
                          </ExportProvider>
                        </SubscriptionProvider>
                      </StorageProvider>
                    </NotificationProvider>
                  </UserPreferencesProvider>
                </MilestoneProvider>
              </FamilyProvider>
            </EntryProvider>
          </ChildProvider>
        </AuthProvider>
      </AppStateProvider>
    </QueryProvider>
  );
}
