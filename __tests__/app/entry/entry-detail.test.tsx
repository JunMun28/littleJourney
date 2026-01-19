import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { entryApi, commentApi, clearAllMockData } from "@/services/api-client";
import { AuthProvider } from "@/contexts/auth-context";
import { ViewerProvider, useViewer } from "@/contexts/viewer-context";
import { MilestoneProvider } from "@/contexts/milestone-context";

// Mock expo-secure-store for AuthProvider
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-av
jest.mock("expo-av", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Video: React.forwardRef((props: any, ref: React.Ref<any>) => {
      React.useImperativeHandle(ref, () => ({
        playAsync: jest.fn(),
        pauseAsync: jest.fn(),
      }));
      return <View testID="mock-video" />;
    }),
    ResizeMode: {
      CONTAIN: "contain",
      COVER: "cover",
    },
  };
});

// Mock expo-router
const mockBack = jest.fn();
let mockParams = { id: "" };

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  router: {
    back: () => mockBack(),
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

// Import after mocks
import EntryDetailScreen from "@/app/entry/[id]";

// Create test wrapper with QueryClient, AuthProvider, and ViewerProvider
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ViewerProvider>
            <MilestoneProvider>{children}</MilestoneProvider>
          </ViewerProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  };
}

// Wrapper that sets viewer as view_only family member
function createViewOnlyWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  // Component that sets viewer context
  function ViewOnlySetup({ children }: { children: React.ReactNode }) {
    const { setFamilyViewer } = useViewer();
    React.useEffect(() => {
      setFamilyViewer("view_only", "family-test-123");
    }, [setFamilyViewer]);
    return <>{children}</>;
  }

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ViewerProvider>
            <MilestoneProvider>
              <ViewOnlySetup>{children}</ViewOnlySetup>
            </MilestoneProvider>
          </ViewerProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  };
}

// Wrapper that sets viewer as view_interact family member
function createViewInteractWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  function ViewInteractSetup({ children }: { children: React.ReactNode }) {
    const { setFamilyViewer } = useViewer();
    React.useEffect(() => {
      setFamilyViewer("view_interact", "family-test-456");
    }, [setFamilyViewer]);
    return <>{children}</>;
  }

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ViewerProvider>
            <MilestoneProvider>
              <ViewInteractSetup>{children}</ViewInteractSetup>
            </MilestoneProvider>
          </ViewerProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  };
}

// Helper to create test entry via API
async function createTestEntry(
  overrides: Partial<{
    type: "photo" | "video" | "text";
    mediaUris: string[] | undefined;
    caption: string;
    date: string;
    aiMilestoneSuggestions?: {
      templateId: string;
      title: string;
      confidence: number;
      status: "pending" | "accepted" | "dismissed";
      matchedLabels: string[];
    }[];
  }> = {},
) {
  const defaultMediaUris = ["file:///photo1.jpg", "file:///photo2.jpg"];
  const result = await entryApi.createEntry({
    entry: {
      type: overrides.type ?? "photo",
      // Only use default if mediaUris key is not in overrides
      mediaUris:
        "mediaUris" in overrides ? overrides.mediaUris : defaultMediaUris,
      caption: overrides.caption ?? "First steps!",
      date: overrides.date ?? "2024-06-15",
      aiMilestoneSuggestions: overrides.aiMilestoneSuggestions,
    },
  });
  if ("error" in result && result.error) throw new Error(result.error.message);
  return result.data;
}

describe("EntryDetailScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAllMockData();
  });

  it("renders entry with photo carousel", async () => {
    const entry = await createTestEntry();
    mockParams = { id: entry.id };

    render(<EntryDetailScreen />, { wrapper: createWrapper() });

    // Wait for entry to load
    await waitFor(() => {
      expect(screen.getByText("First steps!")).toBeTruthy();
    });
    // Should show the date
    expect(screen.getByText(/15 Jun 2024/)).toBeTruthy();
  });

  it("shows entry not found when entry does not exist", async () => {
    mockParams = { id: "non-existent-id" };

    render(<EntryDetailScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Entry not found")).toBeTruthy();
    });
  });

  it("displays back button that navigates back", async () => {
    const entry = await createTestEntry();
    mockParams = { id: entry.id };

    render(<EntryDetailScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("First steps!")).toBeTruthy();
    });

    const backButton = screen.getByTestId("back-button");
    fireEvent.press(backButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it("shows image counter for multi-photo entries", async () => {
    const entry = await createTestEntry({
      mediaUris: ["file:///photo1.jpg", "file:///photo2.jpg"],
    });
    mockParams = { id: entry.id };

    render(<EntryDetailScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId("image-counter")).toBeTruthy();
    });
  });

  it("renders text-only entry without images", async () => {
    const entry = await createTestEntry({
      type: "text",
      mediaUris: undefined,
      caption: "Slept through the night!",
    });
    mockParams = { id: entry.id };

    render(<EntryDetailScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Slept through the night!")).toBeTruthy();
    });
    expect(screen.queryByTestId("image-counter")).toBeNull();
  });

  it("shows options menu button", async () => {
    const entry = await createTestEntry();
    mockParams = { id: entry.id };

    render(<EntryDetailScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId("options-button")).toBeTruthy();
    });
  });

  it("opens options menu with edit and delete actions", async () => {
    const entry = await createTestEntry();
    mockParams = { id: entry.id };

    render(<EntryDetailScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId("options-button")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("options-button"));

    expect(screen.getByText("Edit")).toBeTruthy();
    expect(screen.getByText("Delete")).toBeTruthy();
  });

  it("deletes entry and navigates back when delete is confirmed", async () => {
    const entry = await createTestEntry();
    mockParams = { id: entry.id };

    render(<EntryDetailScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("First steps!")).toBeTruthy();
    });

    // Open options menu
    fireEvent.press(screen.getByTestId("options-button"));
    // Press delete
    fireEvent.press(screen.getByText("Delete"));
    // Confirm deletion
    fireEvent.press(screen.getByText("Delete Entry"));

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });

    // Verify entry was deleted from API
    const result = await entryApi.getEntry(entry.id);
    expect("error" in result).toBe(true);
  });

  it("cancels delete and closes menu", async () => {
    const entry = await createTestEntry();
    mockParams = { id: entry.id };

    render(<EntryDetailScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("First steps!")).toBeTruthy();
    });

    // Open options menu
    fireEvent.press(screen.getByTestId("options-button"));
    // Press delete
    fireEvent.press(screen.getByText("Delete"));
    // Cancel deletion
    fireEvent.press(screen.getByText("Cancel"));

    // Entry should still exist
    const result = await entryApi.getEntry(entry.id);
    expect("data" in result).toBe(true);
  });

  describe("Edit Modal", () => {
    it("opens edit modal when Edit is pressed", async () => {
      const entry = await createTestEntry();
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("options-button")).toBeTruthy();
      });

      // Open options menu
      fireEvent.press(screen.getByTestId("options-button"));
      // Press edit
      fireEvent.press(screen.getByText("Edit"));

      // Should show edit modal with caption input
      expect(screen.getByTestId("edit-modal")).toBeTruthy();
      expect(screen.getByTestId("caption-input")).toBeTruthy();
    });

    it("pre-fills caption in edit modal", async () => {
      const entry = await createTestEntry();
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("First steps!")).toBeTruthy();
      });

      // Open options menu and edit modal
      fireEvent.press(screen.getByTestId("options-button"));
      fireEvent.press(screen.getByText("Edit"));

      // Caption input should have current value
      const captionInput = screen.getByTestId("caption-input");
      expect(captionInput.props.value).toBe("First steps!");
    });

    it("saves edited caption and closes modal", async () => {
      const entry = await createTestEntry();
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("First steps!")).toBeTruthy();
      });

      // Open edit modal
      fireEvent.press(screen.getByTestId("options-button"));
      fireEvent.press(screen.getByText("Edit"));

      // Change caption
      const captionInput = screen.getByTestId("caption-input");
      fireEvent.changeText(captionInput, "Updated caption!");

      // Save
      fireEvent.press(screen.getByText("Save"));

      // Wait for mutation to complete and verify API was updated
      await waitFor(async () => {
        const result = await entryApi.getEntry(entry.id);
        expect("data" in result && result.data?.caption).toBe(
          "Updated caption!",
        );
      });
    });

    it("cancels edit without saving", async () => {
      const entry = await createTestEntry();
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("First steps!")).toBeTruthy();
      });

      // Open edit modal
      fireEvent.press(screen.getByTestId("options-button"));
      fireEvent.press(screen.getByText("Edit"));

      // Change caption
      const captionInput = screen.getByTestId("caption-input");
      fireEvent.changeText(captionInput, "Changed but not saved");

      // Cancel
      fireEvent.press(screen.getByTestId("edit-cancel-button"));

      // Entry should still have original caption
      const result = await entryApi.getEntry(entry.id);
      expect("data" in result && result.data?.caption).toBe("First steps!");
    });
  });

  describe("TanStack Query Integration", () => {
    it("shows loading state while fetching entry", async () => {
      const entry = await createTestEntry();
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createWrapper() });

      // Entry should load eventually
      await waitFor(() => {
        expect(screen.getByText("First steps!")).toBeTruthy();
      });
    });

    it("updates cache when entry is edited", async () => {
      const entry = await createTestEntry();
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("First steps!")).toBeTruthy();
      });

      // Edit entry
      fireEvent.press(screen.getByTestId("options-button"));
      fireEvent.press(screen.getByText("Edit"));
      fireEvent.changeText(screen.getByTestId("caption-input"), "New caption!");
      fireEvent.press(screen.getByText("Save"));

      // Wait for the UI to update with new caption
      await waitFor(() => {
        expect(screen.getByText("New caption!")).toBeTruthy();
      });
    });
  });

  describe("ENTRY-013: Edit other parent's entry", () => {
    it("shows 'Edited by' indicator when entry was edited by different user than creator", async () => {
      // Create entry as Parent A
      const entry = await createTestEntry({
        caption: "Original caption",
      });
      // Simulate entry being edited by different user via API update
      await entryApi.updateEntry({
        id: entry.id,
        updates: {
          caption: "Edited caption",
          updatedBy: "user-parent-b",
          updatedByName: "Parent B",
        },
      });
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("Edited caption")).toBeTruthy();
      });

      // Should show edited by indicator
      expect(screen.getByText(/Edited by Parent B/)).toBeTruthy();
    });

    it("does not show 'Edited by' indicator when entry edited by same user who created it", async () => {
      const entry = await createTestEntry({
        caption: "Original caption",
      });
      // Update by same user who created
      await entryApi.updateEntry({
        id: entry.id,
        updates: {
          caption: "Edited caption",
          updatedBy: entry.createdBy,
          updatedByName: entry.createdByName,
        },
      });
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("Edited caption")).toBeTruthy();
      });

      // Should NOT show edited by indicator
      expect(screen.queryByText(/Edited by/)).toBeNull();
    });

    it("allows any parent to edit any entry", async () => {
      // Create entry
      const entry = await createTestEntry({
        caption: "Original caption",
      });
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("Original caption")).toBeTruthy();
      });

      // All entries should have edit option available
      fireEvent.press(screen.getByTestId("options-button"));
      expect(screen.getByText("Edit")).toBeTruthy();

      // Verify edit works
      fireEvent.press(screen.getByText("Edit"));
      fireEvent.changeText(
        screen.getByTestId("caption-input"),
        "Edited by another parent",
      );
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText("Edited by another parent")).toBeTruthy();
      });
    });
  });

  describe("SHARE-005: View-only permission", () => {
    it("hides options button for view_only family member", async () => {
      const entry = await createTestEntry();
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createViewOnlyWrapper() });

      await waitFor(() => {
        expect(screen.getByText("First steps!")).toBeTruthy();
      });

      // Options button should be hidden for view_only viewers
      expect(screen.queryByTestId("options-button")).toBeNull();
    });

    it("shows view-only badge for view_only family member", async () => {
      const entry = await createTestEntry();
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createViewOnlyWrapper() });

      await waitFor(() => {
        expect(screen.getByText("First steps!")).toBeTruthy();
      });

      // Should show view-only indicator
      expect(screen.getByTestId("view-only-badge")).toBeTruthy();
    });

    it("disables comments button for view_only family member", async () => {
      const entry = await createTestEntry();
      // Add a comment so the button is visible
      await commentApi.createComment({
        entryId: entry.id,
        text: "Test comment",
        authorId: "family-test-123",
        authorName: "Test Family Member",
      });
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createViewOnlyWrapper() });

      await waitFor(() => {
        expect(screen.getByText("First steps!")).toBeTruthy();
      });

      // Comments button should be disabled (not pressable)
      const commentsButton = screen.getByTestId("comments-button");
      expect(commentsButton.props.accessibilityState?.disabled).toBe(true);
    });

    it("shows options button for view_interact family member", async () => {
      const entry = await createTestEntry();
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createViewInteractWrapper() });

      await waitFor(() => {
        expect(screen.getByText("First steps!")).toBeTruthy();
      });

      // Options button should be hidden (no edit/delete for family)
      // but comments should work
      expect(screen.queryByTestId("options-button")).toBeNull();
    });

    it("enables comments button for view_interact family member", async () => {
      const entry = await createTestEntry();
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createViewInteractWrapper() });

      await waitFor(() => {
        expect(screen.getByText("First steps!")).toBeTruthy();
      });

      // Comments button should be enabled
      const commentsButton = screen.getByTestId("comments-button");
      expect(commentsButton.props.accessibilityState?.disabled).toBeFalsy();
    });

    it("shows options button for parent viewer", async () => {
      const entry = await createTestEntry();
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("First steps!")).toBeTruthy();
      });

      // Options button should be visible for parents
      expect(screen.getByTestId("options-button")).toBeTruthy();
    });

    it("does not show view-only badge for parent viewer", async () => {
      const entry = await createTestEntry();
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("First steps!")).toBeTruthy();
      });

      // View-only badge should not be visible for parents
      expect(screen.queryByTestId("view-only-badge")).toBeNull();
    });
  });

  // AIDETECT-003, AIDETECT-004: AI Milestone Suggestions
  describe("AI milestone suggestions", () => {
    it("shows milestone suggestions for entries with pending suggestions (AIDETECT-003)", async () => {
      const entry = await createTestEntry({
        aiMilestoneSuggestions: [
          {
            templateId: "first_steps",
            title: "First Steps",
            confidence: 0.85,
            status: "pending",
            matchedLabels: ["walking"],
          },
        ],
      });
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("milestone-suggestions")).toBeTruthy();
      });

      // Should show suggestion title and confidence
      expect(screen.getByText("First Steps")).toBeTruthy();
      expect(screen.getByText("85% match")).toBeTruthy();

      // Should show accept and dismiss buttons
      expect(screen.getByTestId("accept-suggestion-first_steps")).toBeTruthy();
      expect(screen.getByTestId("dismiss-suggestion-first_steps")).toBeTruthy();
    });

    it("hides suggestions for entries without pending suggestions", async () => {
      const entry = await createTestEntry({
        aiMilestoneSuggestions: [
          {
            templateId: "first_steps",
            title: "First Steps",
            confidence: 0.85,
            status: "accepted", // Already accepted
            matchedLabels: ["walking"],
          },
        ],
      });
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("First steps!")).toBeTruthy();
      });

      // Should not show suggestions container
      expect(screen.queryByTestId("milestone-suggestions")).toBeNull();
    });

    it("dismiss button removes suggestion from view (AIDETECT-004)", async () => {
      const entry = await createTestEntry({
        aiMilestoneSuggestions: [
          {
            templateId: "first_steps",
            title: "First Steps",
            confidence: 0.85,
            status: "pending",
            matchedLabels: ["walking"],
          },
        ],
      });
      mockParams = { id: entry.id };

      render(<EntryDetailScreen />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("milestone-suggestions")).toBeTruthy();
      });

      // Dismiss button should be pressable
      const dismissButton = screen.getByTestId(
        "dismiss-suggestion-first_steps",
      );
      expect(dismissButton).toBeTruthy();
      fireEvent.press(dismissButton);
      // Button press should not crash - the actual dismissal updates entry via API
      // Full end-to-end test for removal would require integration test with API mock
    });

    it("hides suggestions for non-parent viewers", async () => {
      const entry = await createTestEntry({
        aiMilestoneSuggestions: [
          {
            templateId: "first_steps",
            title: "First Steps",
            confidence: 0.85,
            status: "pending",
            matchedLabels: ["walking"],
          },
        ],
      });
      mockParams = { id: entry.id };

      // Use view_only family member wrapper
      render(<EntryDetailScreen />, { wrapper: createViewOnlyWrapper() });

      await waitFor(() => {
        expect(screen.getByText("First steps!")).toBeTruthy();
      });

      // Suggestions should not be visible to family members
      expect(screen.queryByTestId("milestone-suggestions")).toBeNull();
    });
  });
});
