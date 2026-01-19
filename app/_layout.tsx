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
import {
  initSentry,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
} from "@/services/sentry";
import {
  initAnalytics,
  identifyUser,
  resetUser,
  trackScreenView,
} from "@/services/analytics";
import { OfflineBanner } from "@/components/offline-banner";
import { QueryProvider } from "@/providers/query-provider";
import { AppStateProvider } from "@/providers/app-state-provider";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { ExportProvider } from "@/contexts/export-context";
import { PhotoBookProvider } from "@/contexts/photo-book-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { StorageProvider } from "@/contexts/storage-context";
import { SubscriptionProvider } from "@/contexts/subscription-context";
import { UserPreferencesProvider } from "@/contexts/user-preferences-context";
import { StripeProvider } from "@/providers/stripe-provider";
import { ViewerProvider } from "@/contexts/viewer-context";
import { ChildProvider } from "@/contexts/child-context";
import { EntryProvider } from "@/contexts/entry-context";
import { FamilyProvider } from "@/contexts/family-context";
import { MilestoneProvider } from "@/contexts/milestone-context";
import { GrowthTrackingProvider } from "@/contexts/growth-tracking-context";
import { TimeCapsuleProvider } from "@/contexts/time-capsule-context";
import { OnThisDayProvider } from "@/contexts/on-this-day-context";
import { VoiceJournalProvider } from "@/contexts/voice-journal-context";
import { GamificationProvider } from "@/contexts/gamification-context";
import { CommunityProvider } from "@/contexts/community-context";
import { RedPacketProvider } from "@/contexts/red-packet-context";
import { FamilyDigestProvider } from "@/contexts/family-digest-context";

function RootLayoutNav() {
  const { isAuthenticated, isLoading, hasCompletedOnboarding, user } =
    useAuth();
  const segments = useSegments();

  // Set/clear Sentry and PostHog user context when auth state changes
  useEffect(() => {
    if (user) {
      setUserContext({
        id: user.id,
        email: user.email,
        username: user.name,
      });
      identifyUser(user.id, {
        email: user.email ?? null,
        name: user.name ?? null,
      });
    } else {
      clearUserContext();
      resetUser();
    }
  }, [user]);

  // Add navigation breadcrumbs and track screen views
  useEffect(() => {
    if (segments.length > 0) {
      const screenName = segments.join("/");
      addBreadcrumb({
        category: "navigation",
        message: `Navigated to ${screenName}`,
        level: "info",
      });
      trackScreenView(screenName);
    }
  }, [segments]);

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

  // Initialize Sentry and PostHog after first render to avoid blocking app launch
  useEffect(() => {
    // Use requestAnimationFrame to defer initialization to next frame
    // This ensures the initial UI renders before analytics setup
    const frame = requestAnimationFrame(() => {
      initSentry();
      initAnalytics();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <QueryProvider>
      <AppStateProvider>
        <AuthProvider>
          <UserPreferencesProvider>
            <NotificationProvider>
              <StorageProvider>
                <SubscriptionProvider>
                  <StripeProvider>
                    <ViewerProvider>
                      <ChildProvider>
                        <EntryProvider>
                          <FamilyProvider>
                            <MilestoneProvider>
                              <GrowthTrackingProvider>
                                <TimeCapsuleProvider>
                                  <OnThisDayProvider>
                                    <VoiceJournalProvider>
                                      <GamificationProvider>
                                        <CommunityProvider>
                                          <RedPacketProvider>
                                            <FamilyDigestProvider>
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
                                            </FamilyDigestProvider>
                                          </RedPacketProvider>
                                        </CommunityProvider>
                                      </GamificationProvider>
                                    </VoiceJournalProvider>
                                  </OnThisDayProvider>
                                </TimeCapsuleProvider>
                              </GrowthTrackingProvider>
                            </MilestoneProvider>
                          </FamilyProvider>
                        </EntryProvider>
                      </ChildProvider>
                    </ViewerProvider>
                  </StripeProvider>
                </SubscriptionProvider>
              </StorageProvider>
            </NotificationProvider>
          </UserPreferencesProvider>
        </AuthProvider>
      </AppStateProvider>
    </QueryProvider>
  );
}
