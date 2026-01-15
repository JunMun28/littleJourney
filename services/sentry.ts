import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

// Types
export type SentryLevel = "info" | "warning" | "error";

export interface SentryUserContext {
  id: string;
  email?: string;
  username?: string;
}

export interface BreadcrumbParams {
  category: string;
  message: string;
  level?: SentryLevel;
  data?: Record<string, unknown>;
}

export interface InitOptions {
  enableInDev?: boolean;
}

// Get DSN from Expo config (will be set via environment variable in production)
const getSentryDsn = (): string => {
  return (
    Constants.expoConfig?.extra?.sentryDsn ||
    process.env.EXPO_PUBLIC_SENTRY_DSN ||
    ""
  );
};

/**
 * Initialize Sentry for error tracking
 * Should be called as early as possible in app startup
 */
export function initSentry(options: InitOptions = {}): void {
  const { enableInDev = false } = options;
  const dsn = getSentryDsn();

  // Skip initialization if no DSN configured
  if (!dsn) {
    console.warn("Sentry DSN not configured. Error tracking will be disabled.");
    return;
  }

  // Skip in development unless explicitly enabled
  if (__DEV__ && !enableInDev) {
    console.log("Sentry disabled in development mode");
    return;
  }

  Sentry.init({
    dsn,
    // Enable auto session tracking for crash-free users metric
    enableAutoSessionTracking: true,
    // Disable native crash handling in Expo Go (not supported)
    enableNative: false,
    // Sample rate for performance monitoring (20%)
    tracesSampleRate: 0.2,
    // Environment tag
    environment: __DEV__ ? "development" : "production",
    // App version from Expo config
    release: `${Constants.expoConfig?.slug || "app"}@${Constants.expoConfig?.version || "1.0.0"}`,
  });
}

/**
 * Capture an error/exception
 * @param error The error to capture
 * @param context Optional additional context (extra data, tags, etc.)
 */
export function captureError(
  error: Error,
  context?: { extra?: Record<string, unknown>; tags?: Record<string, string> },
): void {
  Sentry.captureException(error, context);
}

/**
 * Set user context for error reports
 * @param user User information to associate with errors
 */
export function setUserContext(user: SentryUserContext): void {
  Sentry.setUser({
    id: user.id,
    ...(user.email && { email: user.email }),
    ...(user.username && { username: user.username }),
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb for debugging context
 * @param params Breadcrumb parameters
 */
export function addBreadcrumb(params: BreadcrumbParams): void {
  Sentry.addBreadcrumb({
    category: params.category,
    message: params.message,
    ...(params.level && { level: params.level }),
    ...(params.data && { data: params.data }),
  });
}

/**
 * Capture a message (non-error event)
 * @param message The message to capture
 * @param level Severity level (default: "info")
 */
export function captureMessage(
  message: string,
  level: SentryLevel = "info",
): void {
  Sentry.captureMessage(message, level);
}
