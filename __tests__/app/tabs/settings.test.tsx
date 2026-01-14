import { render, screen, fireEvent } from "@testing-library/react-native";
import SettingsScreen from "@/app/(tabs)/settings";
import { AuthProvider } from "@/contexts/auth-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { FamilyProvider } from "@/contexts/family-context";
import { UserPreferencesProvider } from "@/contexts/user-preferences-context";
import { StorageProvider } from "@/contexts/storage-context";

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: "mock-token" }),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  SchedulableTriggerInputTypes: { DAILY: "daily" },
  AndroidImportance: { MAX: 5 },
}));

// Mock expo-device
jest.mock("expo-device", () => ({
  isDevice: true,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      <NotificationProvider>
        <FamilyProvider>
          <UserPreferencesProvider>
            <StorageProvider>{component}</StorageProvider>
          </UserPreferencesProvider>
        </FamilyProvider>
      </NotificationProvider>
    </AuthProvider>,
  );
};

describe("SettingsScreen", () => {
  it("renders section headers", () => {
    renderWithProviders(<SettingsScreen />);

    expect(screen.getByText("Notifications")).toBeTruthy();
    expect(screen.getByText("Family")).toBeTruthy();
    expect(screen.getByText("Storage")).toBeTruthy();
    expect(screen.getByText("Account")).toBeTruthy();
  });

  it("renders notification toggle switches", () => {
    renderWithProviders(<SettingsScreen />);

    expect(screen.getByText("Daily Prompts")).toBeTruthy();
    expect(screen.getByText("On This Day Memories")).toBeTruthy();
    expect(screen.getByText("Milestone Reminders")).toBeTruthy();
    expect(screen.getByText("Family Activity")).toBeTruthy();
  });

  it("renders invite family button", () => {
    renderWithProviders(<SettingsScreen />);

    expect(screen.getByText("Invite Family Member")).toBeTruthy();
  });

  it("renders sign out button", () => {
    renderWithProviders(<SettingsScreen />);

    expect(screen.getByText("Sign Out")).toBeTruthy();
  });

  it("toggles notification setting when switch is pressed", () => {
    renderWithProviders(<SettingsScreen />);

    const dailyPromptSwitch = screen.getByTestId("switch-dailyPrompt");
    expect(dailyPromptSwitch.props.value).toBe(true);

    fireEvent(dailyPromptSwitch, "valueChange", false);

    // After toggle, value should be false
    expect(screen.getByTestId("switch-dailyPrompt").props.value).toBe(false);
  });

  it("displays daily prompt time setting row", () => {
    renderWithProviders(<SettingsScreen />);

    expect(screen.getByText("Reminder Time")).toBeTruthy();
  });

  it("shows default time when no prompt time is set", () => {
    renderWithProviders(<SettingsScreen />);

    expect(screen.getByText("Not set")).toBeTruthy();
  });

  it("renders storage section with tier and usage", () => {
    renderWithProviders(<SettingsScreen />);

    // Free tier by default - text may be split across elements
    expect(screen.getByText(/Free/)).toBeTruthy();
    expect(screen.getByText(/Plan/)).toBeTruthy();
    // 0 bytes used of 500MB limit
    expect(screen.getByText(/0 B/)).toBeTruthy();
    expect(screen.getByText(/500 MB/)).toBeTruthy();
    expect(screen.getByText(/0.*% used/)).toBeTruthy();
  });

  it("shows upgrade prompt on free tier", () => {
    renderWithProviders(<SettingsScreen />);

    expect(
      screen.getByText("Upgrade for more storage and video uploads"),
    ).toBeTruthy();
  });
});
