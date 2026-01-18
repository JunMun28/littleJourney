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
import { clearAllMockData, childApi, familyApi } from "@/services/api-client";
import { CommunityProvider } from "@/contexts/community-context";

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

// Mock expo-linking
jest.mock("expo-linking", () => ({
  openURL: jest.fn().mockResolvedValue(undefined),
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
                        <CommunityProvider>
                          <ExportProvider>{component}</ExportProvider>
                        </CommunityProvider>
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

describe("SettingsScreen - Family Member Management", () => {
  beforeEach(() => {
    clearAllMockData();
  });

  // Helper to set up test family member via API
  async function setupPendingFamilyMember() {
    await familyApi.inviteFamilyMember({
      email: "grandma@example.com",
      relationship: "Grandmother",
      permissionLevel: "view_interact",
      childId: "child-test-123",
    });
  }

  it("displays resend link button for pending family members", async () => {
    await setupPendingFamilyMember();
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("grandma@example.com")).toBeTruthy();
    });

    // Should show Resend button for pending invites
    expect(screen.getByText("Resend")).toBeTruthy();
  });

  it("shows pending status for invited family members", async () => {
    await setupPendingFamilyMember();
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Pending/)).toBeTruthy();
    });
  });

  it("shows relationship and status for family members", async () => {
    await setupPendingFamilyMember();
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Grandmother/)).toBeTruthy();
    });
  });

  // PRD SHARE-007: Last viewed timestamp
  it("displays last viewed timestamp when family member has viewed entries", async () => {
    // First create a family member
    const result = await familyApi.inviteFamilyMember({
      email: "grandpa@example.com",
      relationship: "Grandfather",
      permissionLevel: "view_interact",
      childId: "child-test-123",
    });

    // Then record a view (simulates family member opening the app)
    if ("data" in result && result.data) {
      await familyApi.recordFamilyView(result.data.id);
    }

    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("grandpa@example.com")).toBeTruthy();
    });

    // Should show "Last viewed:" label
    expect(screen.getByText(/Last viewed:/)).toBeTruthy();
  });

  it("does not show last viewed when family member has never viewed", async () => {
    await setupPendingFamilyMember();
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("grandma@example.com")).toBeTruthy();
    });

    // Should NOT show "Last viewed:" for members who haven't viewed yet
    expect(screen.queryByText(/Last viewed:/)).toBeNull();
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

describe("SettingsScreen - Legal Section", () => {
  beforeEach(async () => {
    clearAllMockData();
    jest.clearAllMocks();
  });

  it("renders Legal section header", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Legal")).toBeTruthy();
    });
  });

  it("renders Privacy Policy link", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Privacy Policy")).toBeTruthy();
    });
  });

  it("renders Terms of Service link", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Terms of Service")).toBeTruthy();
    });
  });

  it("opens Privacy Policy URL when tapped", async () => {
    const mockOpenURL = jest.fn();
    jest
      .spyOn(require("expo-linking"), "openURL")
      .mockImplementation(mockOpenURL);

    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Privacy Policy")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Privacy Policy"));

    expect(mockOpenURL).toHaveBeenCalledWith(
      expect.stringContaining("privacy"),
    );
  });

  it("opens Terms of Service URL when tapped", async () => {
    const mockOpenURL = jest.fn();
    jest
      .spyOn(require("expo-linking"), "openURL")
      .mockImplementation(mockOpenURL);

    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Terms of Service")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Terms of Service"));

    expect(mockOpenURL).toHaveBeenCalledWith(expect.stringContaining("terms"));
  });
});

describe("SettingsScreen - CHILD-004 Single Child Limit", () => {
  beforeEach(() => {
    clearAllMockData();
    jest.clearAllMocks();
  });

  it("shows 'Add Child' button in child profile section when no child exists", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Child Profile")).toBeTruthy();
    });

    // Should show disabled Add Child button with MVP limit message
    expect(screen.getByTestId("add-child-button")).toBeTruthy();
  });

  it("shows MVP upgrade prompt when 'Add Child' is pressed with existing child", async () => {
    // Create a child first
    await childApi.createChild({
      name: "Emma",
      dateOfBirth: "2024-06-15",
    });

    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Emma")).toBeTruthy();
    });

    // Should show disabled "Add Another Child" button
    const addChildButton = screen.getByTestId("add-child-button");
    expect(addChildButton).toBeTruthy();

    // Button should show MVP limit text
    expect(screen.getByText(/MVP Limit|Coming Soon/)).toBeTruthy();
  });

  it("Add Child button is disabled when child already exists", async () => {
    // Create a child first
    await childApi.createChild({
      name: "Emma",
      dateOfBirth: "2024-06-15",
    });

    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Emma")).toBeTruthy();
    });

    const addChildButton = screen.getByTestId("add-child-button");

    // Press should show alert, not navigate
    fireEvent.press(addChildButton);

    // Should see upgrade/limit message (Alert mocked by react-native)
    // The visual state should indicate disabled
    expect(addChildButton.props.accessibilityState?.disabled).toBe(true);
  });
});

describe("SettingsScreen - FEEDBACK-001 In-app Feedback", () => {
  beforeEach(() => {
    clearAllMockData();
    jest.clearAllMocks();
  });

  it("renders Feedback section header", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Feedback")).toBeTruthy();
    });
  });

  it("renders Send Feedback button", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("send-feedback-button")).toBeTruthy();
    });
    expect(screen.getByText("Send Feedback")).toBeTruthy();
  });

  it("opens feedback modal when button is pressed", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("send-feedback-button")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("send-feedback-button"));

    // Modal should show with text input and submit button
    expect(screen.getByText(/We'd love to hear from you/)).toBeTruthy();
    expect(screen.getByTestId("feedback-input")).toBeTruthy();
    expect(screen.getByTestId("submit-feedback-button")).toBeTruthy();
  });

  it("disables submit button when feedback is empty", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("send-feedback-button")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("send-feedback-button"));

    // Submit button should be disabled when input is empty
    const submitButton = screen.getByTestId("submit-feedback-button");
    fireEvent.press(submitButton);

    // Modal should still be visible (not submitted)
    expect(screen.getByTestId("feedback-input")).toBeTruthy();
  });

  it("closes modal and shows confirmation after submitting feedback", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("send-feedback-button")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("send-feedback-button"));

    // Type feedback
    const input = screen.getByTestId("feedback-input");
    fireEvent.changeText(input, "Great app, love the milestone tracking!");

    // Submit feedback
    fireEvent.press(screen.getByTestId("submit-feedback-button"));

    // Modal should close - input should no longer be visible
    await waitFor(() => {
      expect(screen.queryByTestId("feedback-input")).toBeNull();
    });
  });
});

describe("SettingsScreen - COMMUNITY-003 Community Data Sharing", () => {
  beforeEach(() => {
    clearAllMockData();
    jest.clearAllMocks();
  });

  it("renders Community Data Sharing toggle in Data & Privacy section", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Community Data Sharing")).toBeTruthy();
    });
  });

  it("shows community data sharing toggle switch", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("switch-communityDataSharing")).toBeTruthy();
    });
  });

  it("toggle is OFF by default", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("switch-communityDataSharing")).toBeTruthy();
    });

    const toggle = screen.getByTestId("switch-communityDataSharing");
    expect(toggle.props.value).toBe(false);
  });

  it("shows explanation of what is shared", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(
        screen.getByText(/anonymized milestone timing data/i),
      ).toBeTruthy();
    });
  });

  it("toggles community sharing on when switch is pressed", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("switch-communityDataSharing")).toBeTruthy();
    });

    const toggle = screen.getByTestId("switch-communityDataSharing");
    fireEvent(toggle, "valueChange", true);

    await waitFor(() => {
      expect(
        screen.getByTestId("switch-communityDataSharing").props.value,
      ).toBe(true);
    });
  });

  it("toggles community sharing off after being enabled", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("switch-communityDataSharing")).toBeTruthy();
    });

    const toggle = screen.getByTestId("switch-communityDataSharing");

    // Enable first
    fireEvent(toggle, "valueChange", true);
    await waitFor(() => {
      expect(
        screen.getByTestId("switch-communityDataSharing").props.value,
      ).toBe(true);
    });

    // Then disable
    fireEvent(toggle, "valueChange", false);
    await waitFor(() => {
      expect(
        screen.getByTestId("switch-communityDataSharing").props.value,
      ).toBe(false);
    });
  });

  // PAY-006: Upgrade tier with proration tests
  describe("subscription upgrade", () => {
    it("shows upgrade button in settings when on free tier", async () => {
      renderWithProviders(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByTestId("upgrade-button")).toBeTruthy();
      });
      expect(screen.getByText("Upgrade Plan")).toBeTruthy();
    });

    it("opens subscription modal when upgrade button pressed", async () => {
      renderWithProviders(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByTestId("upgrade-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("upgrade-button"));

      await waitFor(() => {
        expect(screen.getByText("Choose Plan")).toBeTruthy();
      });

      // Should show both Standard and Premium plan options
      expect(screen.getByTestId("plan-standard")).toBeTruthy();
      expect(screen.getByTestId("plan-premium")).toBeTruthy();
    });

    it("shows subscribe button for new subscription", async () => {
      renderWithProviders(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByTestId("upgrade-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("upgrade-button"));

      await waitFor(() => {
        expect(screen.getByTestId("subscribe-button")).toBeTruthy();
      });
    });
  });
});

describe("SettingsScreen - SGLOCAL-001 Singapore Local", () => {
  beforeEach(() => {
    clearAllMockData();
  });

  it("renders Singapore Local section", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Singapore Local")).toBeTruthy();
    });
  });

  it("renders Ang Bao Tracker link", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Ang Bao Tracker/)).toBeTruthy();
    });
    expect(screen.getByText(/Track CNY red packet collections/)).toBeTruthy();
  });

  it("has testID for Ang Bao Tracker link", async () => {
    renderWithProviders(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("red-packet-link")).toBeTruthy();
    });
  });
});
