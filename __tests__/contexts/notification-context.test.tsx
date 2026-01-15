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
    TIME_INTERVAL: "timeInterval",
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

  it("schedules notification using smart frequency interval", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    const Notifications = require("expo-notifications");

    // Simulate every_2_days frequency (3 ignored prompts)
    await act(async () => {
      result.current.recordIgnoredPrompt();
      result.current.recordIgnoredPrompt();
      result.current.recordIgnoredPrompt();
    });

    expect(result.current.promptFrequency).toBe("every_2_days");

    // Clear mock to check new schedule call
    Notifications.scheduleNotificationAsync.mockClear();

    await act(async () => {
      await result.current.scheduleDailyPrompt("20:00");
    });

    // Should schedule with interval trigger, not daily
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({
          type: expect.any(String),
          seconds: 2 * 24 * 60 * 60, // 2 days in seconds
          repeats: true,
        }),
      }),
    );
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

  // On This Day memories notification tests (PRD Section 4.5)
  describe("On This Day Memories Notification", () => {
    it("provides sendMemoriesNotification method", () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      expect(typeof result.current.sendMemoriesNotification).toBe("function");
    });

    it("sends notification when memories exist and setting is enabled", async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });
      const Notifications = require("expo-notifications");

      Notifications.scheduleNotificationAsync.mockClear();

      await act(async () => {
        await result.current.sendMemoriesNotification(2); // 2 memories
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: expect.stringContaining("memories"),
            data: { type: "memories" },
          }),
          trigger: null, // Immediate notification
        }),
      );
    });

    it("does not send notification when memories setting is disabled", async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });
      const Notifications = require("expo-notifications");

      // Disable memories notifications
      await act(async () => {
        result.current.updateSettings({ memories: false });
      });

      Notifications.scheduleNotificationAsync.mockClear();

      await act(async () => {
        await result.current.sendMemoriesNotification(2);
      });

      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("does not send notification when count is 0", async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });
      const Notifications = require("expo-notifications");

      Notifications.scheduleNotificationAsync.mockClear();

      await act(async () => {
        await result.current.sendMemoriesNotification(0);
      });

      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("uses singular form for single memory", async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });
      const Notifications = require("expo-notifications");

      Notifications.scheduleNotificationAsync.mockClear();

      await act(async () => {
        await result.current.sendMemoriesNotification(1);
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: expect.stringContaining("1 memory"),
          }),
        }),
      );
    });
  });
});
