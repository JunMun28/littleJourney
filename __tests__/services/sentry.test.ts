import * as Sentry from "@sentry/react-native";
import {
  initSentry,
  captureError,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
  captureMessage,
} from "@/services/sentry";

// Mock @sentry/react-native
jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  Severity: {
    Info: "info",
    Warning: "warning",
    Error: "error",
  },
}));

// Mock Constants - needs to match import structure
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      slug: "littleJourney",
      version: "1.0.0",
      extra: {
        sentryDsn: "https://test@sentry.io/test",
      },
    },
    manifest: null,
  },
}));

// Mock process.env for DSN lookup fallback
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    EXPO_PUBLIC_SENTRY_DSN: "https://test@sentry.io/test",
  };
});
afterEach(() => {
  process.env = originalEnv;
});

describe("Sentry Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initSentry", () => {
    it("initializes Sentry with correct config when enabled in dev", () => {
      // Test passes enableInDev: true to allow init in test environment
      initSentry({ enableInDev: true });

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: expect.any(String),
          enableAutoSessionTracking: true,
          enableNative: false,
          tracesSampleRate: 0.2,
        }),
      );
    });

    it("skips initialization in development mode when disabled", () => {
      const originalDev = (global as Record<string, unknown>).__DEV__;
      (global as Record<string, unknown>).__DEV__ = true;

      initSentry({ enableInDev: false });

      // Should NOT call init when enableInDev is false
      expect(Sentry.init).not.toHaveBeenCalled();

      (global as Record<string, unknown>).__DEV__ = originalDev;
    });
  });

  describe("captureError", () => {
    it("captures error with exception handler", () => {
      const error = new Error("Test error");
      captureError(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, undefined);
    });

    it("captures error with context", () => {
      const error = new Error("Test error");
      const context = { extra: { userId: "123" } };
      captureError(error, context);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, context);
    });
  });

  describe("setUserContext", () => {
    it("sets user context with id", () => {
      setUserContext({ id: "user-123" });

      expect(Sentry.setUser).toHaveBeenCalledWith({ id: "user-123" });
    });

    it("sets user context with email", () => {
      setUserContext({ id: "user-123", email: "test@example.com" });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: "user-123",
        email: "test@example.com",
      });
    });

    it("sets user context with username", () => {
      setUserContext({
        id: "user-123",
        email: "test@example.com",
        username: "testuser",
      });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: "user-123",
        email: "test@example.com",
        username: "testuser",
      });
    });
  });

  describe("clearUserContext", () => {
    it("clears user context", () => {
      clearUserContext();

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe("addBreadcrumb", () => {
    it("adds breadcrumb with required fields", () => {
      addBreadcrumb({
        category: "navigation",
        message: "Navigated to Feed",
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: "navigation",
        message: "Navigated to Feed",
      });
    });

    it("adds breadcrumb with all fields", () => {
      addBreadcrumb({
        category: "api",
        message: "API call failed",
        level: "error",
        data: { endpoint: "/entries", status: 500 },
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: "api",
        message: "API call failed",
        level: "error",
        data: { endpoint: "/entries", status: 500 },
      });
    });
  });

  describe("captureMessage", () => {
    it("captures message with default level", () => {
      captureMessage("Test message");

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Test message",
        "info",
      );
    });

    it("captures message with warning level", () => {
      captureMessage("Warning message", "warning");

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Warning message",
        "warning",
      );
    });

    it("captures message with error level", () => {
      captureMessage("Error message", "error");

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Error message",
        "error",
      );
    });
  });
});
