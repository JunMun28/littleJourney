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
});
