import {
  initAnalytics,
  trackEvent,
  identifyUser,
  resetUser,
  trackScreenView,
  setUserProperties,
  AnalyticsEvent,
} from "@/services/analytics";

// Mock posthog-react-native
const mockPostHog = {
  identify: jest.fn(),
  capture: jest.fn(),
  reset: jest.fn(),
  screen: jest.fn(),
};

jest.mock("posthog-react-native", () => ({
  PostHog: jest.fn(() => mockPostHog),
}));

// Mock Constants
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      slug: "littleJourney",
      version: "1.0.0",
      extra: {
        posthogApiKey: "test-posthog-key",
        posthogHost: "https://app.posthog.com",
      },
    },
  },
}));

describe("Analytics Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initAnalytics", () => {
    it("initializes PostHog with API key", async () => {
      await initAnalytics({ enableInDev: true });

      const { PostHog } = require("posthog-react-native");
      expect(PostHog).toHaveBeenCalledWith(
        "test-posthog-key",
        expect.objectContaining({
          host: "https://app.posthog.com",
        }),
      );
    });

    it("skips initialization when no API key configured", async () => {
      // Override mock to return empty key
      jest.doMock("expo-constants", () => ({
        __esModule: true,
        default: {
          expoConfig: {
            extra: {},
          },
        },
      }));

      // This test verifies graceful handling - no crash
      await expect(initAnalytics({ enableInDev: true })).resolves.not.toThrow();
    });
  });

  describe("trackEvent", () => {
    it("tracks signup_completed event", async () => {
      await initAnalytics({ enableInDev: true });
      trackEvent(AnalyticsEvent.SIGNUP_COMPLETED);

      expect(mockPostHog.capture).toHaveBeenCalledWith(
        "signup_completed",
        undefined,
      );
    });

    it("tracks entry_created event with properties", async () => {
      await initAnalytics({ enableInDev: true });
      trackEvent(AnalyticsEvent.ENTRY_CREATED, {
        type: "photo",
        hasCaption: true,
      });

      expect(mockPostHog.capture).toHaveBeenCalledWith("entry_created", {
        type: "photo",
        hasCaption: true,
      });
    });

    it("tracks onboarding_completed event", async () => {
      await initAnalytics({ enableInDev: true });
      trackEvent(AnalyticsEvent.ONBOARDING_COMPLETED, { tradition: "chinese" });

      expect(mockPostHog.capture).toHaveBeenCalledWith("onboarding_completed", {
        tradition: "chinese",
      });
    });

    it("tracks milestone_created event", async () => {
      await initAnalytics({ enableInDev: true });
      trackEvent(AnalyticsEvent.MILESTONE_CREATED, {
        templateId: "full_month",
        isCustom: false,
      });

      expect(mockPostHog.capture).toHaveBeenCalledWith("milestone_created", {
        templateId: "full_month",
        isCustom: false,
      });
    });

    it("tracks family_invited event", async () => {
      await initAnalytics({ enableInDev: true });
      trackEvent(AnalyticsEvent.FAMILY_INVITED, {
        permission: "view_interact",
      });

      expect(mockPostHog.capture).toHaveBeenCalledWith("family_invited", {
        permission: "view_interact",
      });
    });
  });

  describe("identifyUser", () => {
    it("identifies user with id", async () => {
      await initAnalytics({ enableInDev: true });
      identifyUser("user-123");

      expect(mockPostHog.identify).toHaveBeenCalledWith("user-123", undefined);
    });

    it("identifies user with properties", async () => {
      await initAnalytics({ enableInDev: true });
      identifyUser("user-123", { email: "test@example.com", tier: "free" });

      expect(mockPostHog.identify).toHaveBeenCalledWith("user-123", {
        email: "test@example.com",
        tier: "free",
      });
    });
  });

  describe("resetUser", () => {
    it("resets user session on logout", async () => {
      await initAnalytics({ enableInDev: true });
      resetUser();

      expect(mockPostHog.reset).toHaveBeenCalled();
    });
  });

  describe("trackScreenView", () => {
    it("tracks screen view", async () => {
      await initAnalytics({ enableInDev: true });
      trackScreenView("Feed");

      expect(mockPostHog.screen).toHaveBeenCalledWith("Feed", undefined);
    });

    it("tracks screen view with properties", async () => {
      await initAnalytics({ enableInDev: true });
      trackScreenView("Entry Detail", { entryId: "entry-123" });

      expect(mockPostHog.screen).toHaveBeenCalledWith("Entry Detail", {
        entryId: "entry-123",
      });
    });
  });

  describe("setUserProperties", () => {
    it("sets super properties for all future events", async () => {
      await initAnalytics({ enableInDev: true });
      setUserProperties({ tier: "premium", childCount: 1 });

      // PostHog uses identify with $set for user properties
      expect(mockPostHog.capture).toHaveBeenCalledWith("$set", {
        $set: { tier: "premium", childCount: 1 },
      });
    });
  });
});
