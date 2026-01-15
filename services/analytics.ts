import { PostHog } from "posthog-react-native";
import type { PostHogEventProperties } from "@posthog/core";
import Constants from "expo-constants";

// Analytics event names as enum for type safety
export enum AnalyticsEvent {
  // Authentication
  SIGNUP_COMPLETED = "signup_completed",
  LOGIN_COMPLETED = "login_completed",
  LOGOUT = "logout",

  // Onboarding
  ONBOARDING_STARTED = "onboarding_started",
  ONBOARDING_COMPLETED = "onboarding_completed",
  ONBOARDING_SKIPPED = "onboarding_skipped",

  // Entries
  ENTRY_CREATED = "entry_created",
  ENTRY_UPDATED = "entry_updated",
  ENTRY_DELETED = "entry_deleted",
  ENTRY_VIEWED = "entry_viewed",

  // Milestones
  MILESTONE_CREATED = "milestone_created",
  MILESTONE_COMPLETED = "milestone_completed",
  MILESTONE_DELETED = "milestone_deleted",

  // Family
  FAMILY_INVITED = "family_invited",
  FAMILY_REMOVED = "family_removed",

  // Subscriptions
  SUBSCRIPTION_STARTED = "subscription_started",
  SUBSCRIPTION_CANCELLED = "subscription_cancelled",
  SUBSCRIPTION_UPGRADED = "subscription_upgraded",

  // Photo Book
  PHOTO_BOOK_GENERATED = "photo_book_generated",
  PHOTO_BOOK_EXPORTED = "photo_book_exported",

  // Search
  SEARCH_PERFORMED = "search_performed",

  // Data Export
  DATA_EXPORTED = "data_exported",
}

// Event properties type - uses PostHog-compatible type
export type EventProperties = PostHogEventProperties;

// User properties type - uses PostHog-compatible type
export type UserProperties = PostHogEventProperties;

export interface InitOptions {
  enableInDev?: boolean;
}

// PostHog instance (singleton)
let posthogClient: PostHog | null = null;

// Get API key from Expo config
const getPostHogApiKey = (): string => {
  return (
    Constants.expoConfig?.extra?.posthogApiKey ||
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY ||
    ""
  );
};

// Get host URL from Expo config
const getPostHogHost = (): string => {
  return (
    Constants.expoConfig?.extra?.posthogHost ||
    process.env.EXPO_PUBLIC_POSTHOG_HOST ||
    "https://app.posthog.com"
  );
};

/**
 * Initialize PostHog analytics
 * Should be called early in app startup
 */
export async function initAnalytics(options: InitOptions = {}): Promise<void> {
  const { enableInDev = false } = options;
  const apiKey = getPostHogApiKey();

  // Skip initialization if no API key configured
  if (!apiKey) {
    console.warn("PostHog API key not configured. Analytics will be disabled.");
    return;
  }

  // Skip in development unless explicitly enabled
  if (__DEV__ && !enableInDev) {
    console.log("PostHog analytics disabled in development mode");
    return;
  }

  try {
    posthogClient = new PostHog(apiKey, {
      host: getPostHogHost(),
      // Enable lifecycle event tracking
      captureAppLifecycleEvents: true,
      // Flush events immediately in production
      flushAt: __DEV__ ? 1 : 20,
      flushInterval: __DEV__ ? 1000 : 30000,
    });
  } catch (error) {
    console.error("Failed to initialize PostHog:", error);
  }
}

/**
 * Track an analytics event
 * @param event Event name from AnalyticsEvent enum
 * @param properties Optional event properties
 */
export function trackEvent(
  event: AnalyticsEvent,
  properties?: EventProperties,
): void {
  if (!posthogClient) return;

  try {
    posthogClient.capture(event, properties);
  } catch (error) {
    console.error("Failed to track event:", error);
  }
}

/**
 * Identify user for analytics
 * Call this after authentication
 * @param userId Unique user identifier
 * @param properties Optional user properties
 */
export function identifyUser(
  userId: string,
  properties?: UserProperties,
): void {
  if (!posthogClient) return;

  try {
    posthogClient.identify(userId, properties);
  } catch (error) {
    console.error("Failed to identify user:", error);
  }
}

/**
 * Reset user identity (call on logout)
 */
export function resetUser(): void {
  if (!posthogClient) return;

  try {
    posthogClient.reset();
  } catch (error) {
    console.error("Failed to reset user:", error);
  }
}

/**
 * Track a screen view
 * @param screenName Name of the screen
 * @param properties Optional screen properties
 */
export function trackScreenView(
  screenName: string,
  properties?: EventProperties,
): void {
  if (!posthogClient) return;

  try {
    posthogClient.screen(screenName, properties);
  } catch (error) {
    console.error("Failed to track screen view:", error);
  }
}

/**
 * Set user properties that persist across sessions
 * @param properties User properties to set
 */
export function setUserProperties(properties: UserProperties): void {
  if (!posthogClient) return;

  try {
    // PostHog uses $set event for updating user properties
    posthogClient.capture("$set", {
      $set: properties,
    } as PostHogEventProperties);
  } catch (error) {
    console.error("Failed to set user properties:", error);
  }
}

/**
 * Get PostHog client instance (for advanced usage)
 */
export function getPostHogClient(): PostHog | null {
  return posthogClient;
}
