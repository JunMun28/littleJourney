import { Slot, useSegments, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import "react-native-reanimated";

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
import { useAuth } from "@/contexts/auth-context";
import { CoreProviders } from "@/providers/core-providers";
import { AuthProviders } from "@/providers/auth-providers";
import { DataProviders } from "@/providers/data-providers";
import { FeatureProviders } from "@/providers/feature-providers";
import { AggregateProviders } from "@/providers/aggregate-providers";

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
        router.replace("/(app)/(feed)");
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
    <CoreProviders>
      <AuthProviders>
        <DataProviders>
          <FeatureProviders>
            <AggregateProviders>
              <RootLayoutNav />
              <StatusBar style="auto" />
            </AggregateProviders>
          </FeatureProviders>
        </DataProviders>
      </AuthProviders>
    </CoreProviders>
  );
}
