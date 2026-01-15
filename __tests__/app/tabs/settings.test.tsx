import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SettingsScreen from "@/app/(tabs)/settings";
import { AuthProvider } from "@/contexts/auth-context";
import { ChildProvider } from "@/contexts/child-context";
import { EntryProvider } from "@/contexts/entry-context";
import { ExportProvider } from "@/contexts/export-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { FamilyProvider } from "@/contexts/family-context";
import { MilestoneProvider } from "@/contexts/milestone-context";
import { UserPreferencesProvider } from "@/contexts/user-preferences-context";
import { StorageProvider } from "@/contexts/storage-context";
import { SubscriptionProvider } from "@/contexts/subscription-context";
import { clearAllMockData, childApi } from "@/services/api-client";

// Mock expo-image-picker
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: "file:///mock/photo.jpg" }],
  }),
  MediaTypeOptions: { Images: "Images" },
  requestMediaLibraryPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: "granted" }),
}));

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

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation(() => ({
    uri: "file:///mock/documents/export.json",
    write: jest.fn().mockResolvedValue(undefined),
  })),
  Paths: {
    document: { uri: "file:///mock/documents/" },
  },
}));

// Mock expo-sharing
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

// Create fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChildProvider>
          <EntryProvider>
            <MilestoneProvider>
              <NotificationProvider>
                <FamilyProvider>
                  <UserPreferencesProvider>
                    <StorageProvider>
                      <SubscriptionProvider>
                        <ExportProvider>{component}</ExportProvider>
                      </SubscriptionProvider>
                    </StorageProvider>
                  </UserPreferencesProvider>
                </FamilyProvider>
              </NotificationProvider>
            </MilestoneProvider>
          </EntryProvider>
        </ChildProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
};

describe("SettingsScreen", () => {
  beforeEach(() => {
    clearAllMockData();
  });

  it("renders section headers", async () => {
    renderWithProviders(<SettingsScreen />);

    // Wait for TanStack Query to settle
    await waitFor(() => {
      expect(screen.getByText("Notifications")).toBeTruthy();
    });

    expect(screen.getByText("Family")).toBeTruthy();
    expect(screen.getByText("Subscription")).toBeTruthy();
    expect(screen.getByText("Storage")).toBeTruthy();
    expect(screen.getByText("Data & Privacy")).toBeTruthy();
    expect(screen.getByText("Account")).toBeTruthy();
  });

  it("renders notification toggle switches", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Daily Prompts")).toBeTruthy();
    });
    expect(screen.getByText("On This Day Memories")).toBeTruthy();
    expect(screen.getByText("Milestone Reminders")).toBeTruthy();
    expect(screen.getByText("Family Activity")).toBeTruthy();
  });

  it("renders invite family button", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Invite Family Member")).toBeTruthy();
    });
  });

  it("renders sign out button", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Sign Out")).toBeTruthy();
    });
  });

  it("toggles notification setting when switch is pressed", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("switch-dailyPrompt")).toBeTruthy();
    });

    const dailyPromptSwitch = screen.getByTestId("switch-dailyPrompt");
    expect(dailyPromptSwitch.props.value).toBe(true);

    fireEvent(dailyPromptSwitch, "valueChange", false);

    // After toggle, value should be false
    expect(screen.getByTestId("switch-dailyPrompt").props.value).toBe(false);
  });

  it("displays daily prompt time setting row", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Reminder Time")).toBeTruthy();
    });
  });

  it("shows default time when no prompt time is set", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Not set")).toBeTruthy();
    });
  });

  it("renders storage section with tier and usage", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      // Free tier by default - multiple elements contain "Free" and "Plan"
      expect(screen.getAllByText(/Free/).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/Plan/).length).toBeGreaterThan(0);
    // 0 bytes used of 500MB limit
    expect(screen.getByText(/0 B/)).toBeTruthy();
    expect(screen.getByText(/500 MB/)).toBeTruthy();
    expect(screen.getByText(/0.*% used/)).toBeTruthy();
  });

  it("shows upgrade prompt on free tier", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(
        screen.getByText("Upgrade for more storage and video uploads"),
      ).toBeTruthy();
    });
  });

  it("renders export data button", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Download All Memories")).toBeTruthy();
    });
    expect(screen.getByTestId("export-data-button")).toBeTruthy();
  });

  it("shows export description", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Export all your entries, milestones, and child data as a JSON file.",
        ),
      ).toBeTruthy();
    });
  });

  it("renders delete account button", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("delete-account-button")).toBeTruthy();
    });
    expect(screen.getByText("Delete Account")).toBeTruthy();
  });

  it("opens delete account modal when delete button is pressed", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("delete-account-button")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("delete-account-button"));

    // Modal should show warning and confirmation input
    expect(screen.getByText("⚠️ Warning")).toBeTruthy();
    expect(screen.getByText(/permanently delete your account/)).toBeTruthy();
    expect(screen.getByText(/30 days to cancel/)).toBeTruthy();
    expect(screen.getByTestId("delete-confirm-input")).toBeTruthy();
    expect(screen.getByTestId("confirm-delete-button")).toBeTruthy();
  });

  it("renders child profile section", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Child Profile")).toBeTruthy();
    });
  });

  it("shows empty state when no child profile exists", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("No child profile added")).toBeTruthy();
    });
  });
});

describe("SettingsScreen - Child Profile with Data", () => {
  beforeEach(() => {
    clearAllMockData();
  });

  // Helper to set up test child data via API
  async function setupTestChild() {
    await childApi.createChild({
      name: "Emma",
      dateOfBirth: "2024-06-15",
      nickname: "Emmy",
      culturalTradition: "chinese",
    });
  }

  it("displays child name when child exists", async () => {
    await setupTestChild();
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Emma")).toBeTruthy();
    });
  });

  it("displays edit button when child exists", async () => {
    await setupTestChild();
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-child-button")).toBeTruthy();
    });
  });

  it("opens edit modal when edit button is pressed", async () => {
    await setupTestChild();
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-child-button")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("edit-child-button"));

    expect(screen.getByText("Edit Child Profile")).toBeTruthy();
  });

  it("displays child nickname when set", async () => {
    await setupTestChild();
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      // Nickname is rendered with curly quotes: "Emmy"
      expect(screen.getByText(/Emmy/)).toBeTruthy();
    });
  });

  it("displays Chinese tradition when set", async () => {
    await setupTestChild();
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Chinese tradition")).toBeTruthy();
    });
  });
});
