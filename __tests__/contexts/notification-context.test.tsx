import { renderHook, act } from "@testing-library/react-native";
import {
  NotificationProvider,
  useNotifications,
  type NotificationSettings,
} from "@/contexts/notification-context";

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "undetermined" }),
  ),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" }),
  ),
  getExpoPushTokenAsync: jest.fn(() =>
    Promise.resolve({ data: "ExponentPushToken[mock-token]" }),
  ),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve("notification-id")),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  SchedulableTriggerInputTypes: {
    DAILY: "daily",
  },
}));

// Mock expo-device
jest.mock("expo-device", () => ({
  isDevice: true,
}));

describe("NotificationContext", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  it("throws error when useNotifications used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() => {
      renderHook(() => useNotifications());
    }).toThrow("useNotifications must be used within a NotificationProvider");

    consoleSpy.mockRestore();
  });

  it("provides default notification settings", () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    expect(result.current.settings).toEqual({
      dailyPrompt: true,
      memories: true,
      milestoneReminder: true,
      familyActivity: true,
      storageWarning: true,
    });
  });

  it("allows updating notification settings", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      result.current.updateSettings({ dailyPrompt: false });
    });

    expect(result.current.settings.dailyPrompt).toBe(false);
    expect(result.current.settings.memories).toBe(true); // Other settings unchanged
  });

  it("provides permission status", () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Initial state before checking permissions
    expect(result.current.permissionStatus).toBe("undetermined");
  });

  it("can request permissions", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      const status = await result.current.requestPermissions();
      expect(status).toBe("granted");
    });

    expect(result.current.permissionStatus).toBe("granted");
  });

  it("provides expoPushToken after requesting permissions", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      await result.current.requestPermissions();
    });

    expect(result.current.expoPushToken).toBe("ExponentPushToken[mock-token]");
  });

  it("can schedule daily prompt notification", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      await result.current.scheduleDailyPrompt("20:00");
    });

    const Notifications = require("expo-notifications");
    expect(
      Notifications.cancelAllScheduledNotificationsAsync,
    ).toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });

  // Smart Frequency tests (PRD Section 7.3)
  describe("Smart Frequency", () => {
    it("provides default frequency state as daily", () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      expect(result.current.promptFrequency).toBe("daily");
      expect(result.current.consecutiveIgnoredDays).toBe(0);
    });

    it("resets to daily frequency when user posts entry", async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      // Simulate frequency was reduced to weekly
      await act(async () => {
        result.current.recordIgnoredPrompt(); // Day 1
        result.current.recordIgnoredPrompt(); // Day 2
        result.current.recordIgnoredPrompt(); // Day 3 -> every 2 days
        result.current.recordIgnoredPrompt(); // Day 4
        result.current.recordIgnoredPrompt(); // Day 5
        result.current.recordIgnoredPrompt(); // Day 6
        result.current.recordIgnoredPrompt(); // Day 7 -> weekly
      });

      expect(result.current.promptFrequency).toBe("weekly");

      // User posts an entry
      await act(async () => {
        result.current.recordEntryPosted();
      });

      expect(result.current.promptFrequency).toBe("daily");
      expect(result.current.consecutiveIgnoredDays).toBe(0);
    });

    it("reduces to every 2 days after 3+ ignored days", async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await act(async () => {
        result.current.recordIgnoredPrompt(); // Day 1
        result.current.recordIgnoredPrompt(); // Day 2
        result.current.recordIgnoredPrompt(); // Day 3
      });

      expect(result.current.promptFrequency).toBe("every_2_days");
      expect(result.current.consecutiveIgnoredDays).toBe(3);
    });

    it("reduces to weekly after 7+ ignored days", async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await act(async () => {
        for (let i = 0; i < 7; i++) {
          result.current.recordIgnoredPrompt();
        }
      });

      expect(result.current.promptFrequency).toBe("weekly");
      expect(result.current.consecutiveIgnoredDays).toBe(7);
    });

    it("getScheduleInterval returns correct repeat interval", () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      // Daily = 1
      expect(result.current.getScheduleInterval()).toBe(1);

      act(() => {
        result.current.recordIgnoredPrompt();
        result.current.recordIgnoredPrompt();
        result.current.recordIgnoredPrompt();
      });

      // Every 2 days = 2
      expect(result.current.getScheduleInterval()).toBe(2);

      act(() => {
        result.current.recordIgnoredPrompt();
        result.current.recordIgnoredPrompt();
        result.current.recordIgnoredPrompt();
        result.current.recordIgnoredPrompt();
      });

      // Weekly = 7
      expect(result.current.getScheduleInterval()).toBe(7);
    });
  });
});
