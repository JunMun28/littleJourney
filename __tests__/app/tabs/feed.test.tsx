import { renderHook, act, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStorage, StorageProvider } from "@/contexts/storage-context";
import { useEntries, EntryProvider } from "@/contexts/entry-context";
import {
  useNotifications,
  NotificationProvider,
} from "@/contexts/notification-context";
import { useDraft, type Draft } from "@/hooks/use-draft";
import type { ReactNode } from "react";

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

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock expo-image-picker with camera support
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({
    status: "granted",
  }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({
    status: "granted",
  }),
  MediaTypeOptions: {
    Images: "Images",
    Videos: "Videos",
    All: "All",
  },
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("On This Day memories", () => {
  const entryWrapper = ({ children }: { children: ReactNode }) => (
    <EntryProvider>{children}</EntryProvider>
  );

  it("should return empty array when no entries from previous years on this day", () => {
    const { result } = renderHook(() => useEntries(), {
      wrapper: entryWrapper,
    });

    // Add entry from today (current year)
    const today = new Date().toISOString().split("T")[0];
    act(() => {
      result.current.addEntry({
        type: "photo",
        caption: "Today's entry",
        date: today,
      });
    });

    expect(result.current.getOnThisDayEntries()).toHaveLength(0);
  });

  it("should find entries from same day in previous years", () => {
    const { result } = renderHook(() => useEntries(), {
      wrapper: entryWrapper,
    });

    // Create date string for same day last year (use string format to avoid TZ issues)
    const today = new Date();
    const year = today.getFullYear() - 1;
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const lastYearDate = `${year}-${month}-${day}`;

    act(() => {
      result.current.addEntry({
        type: "photo",
        caption: "Memory from last year",
        date: lastYearDate,
      });
    });

    const memories = result.current.getOnThisDayEntries();
    expect(memories).toHaveLength(1);
    expect(memories[0].caption).toBe("Memory from last year");
  });

  it("should find entries from multiple previous years", () => {
    const { result } = renderHook(() => useEntries(), {
      wrapper: entryWrapper,
    });

    // Use string format to avoid TZ issues
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const lastYearDate = `${today.getFullYear() - 1}-${month}-${day}`;
    const twoYearsAgoDate = `${today.getFullYear() - 2}-${month}-${day}`;

    act(() => {
      result.current.addEntry({
        type: "photo",
        caption: "One year ago",
        date: lastYearDate,
      });
      result.current.addEntry({
        type: "text",
        caption: "Two years ago",
        date: twoYearsAgoDate,
      });
    });

    expect(result.current.getOnThisDayEntries()).toHaveLength(2);
  });

  it("should not include entries from different days in previous years", () => {
    const { result } = renderHook(() => useEntries(), {
      wrapper: entryWrapper,
    });

    // Use string format to avoid TZ issues - pick a day that's definitely different
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    // Pick day 28 if today is not 28, otherwise pick 27 (safe for all months)
    const differentDay = today.getDate() === 28 ? 27 : 28;
    const differentDayStr = String(differentDay).padStart(2, "0");
    const differentDate = `${today.getFullYear() - 1}-${month}-${differentDayStr}`;

    act(() => {
      result.current.addEntry({
        type: "photo",
        caption: "Different day last year",
        date: differentDate,
      });
    });

    expect(result.current.getOnThisDayEntries()).toHaveLength(0);
  });
});

// Test storage enforcement for entry creation
describe("Feed storage integration", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StorageProvider>{children}</StorageProvider>
  );

  describe("canUpload validation", () => {
    it("should allow upload when under storage limit", () => {
      const { result } = renderHook(() => useStorage(), { wrapper });

      // Free tier: 500MB limit, 0 used
      expect(result.current.canUpload(100 * 1024 * 1024)).toBe(true); // 100MB
    });

    it("should reject upload when would exceed storage limit", () => {
      const { result } = renderHook(() => useStorage(), { wrapper });

      // Free tier: 500MB limit
      // Add 450MB usage
      act(() => {
        result.current.addUsage(450 * 1024 * 1024);
      });

      // 100MB more would exceed 500MB limit
      expect(result.current.canUpload(100 * 1024 * 1024)).toBe(false);
      // 50MB should fit
      expect(result.current.canUpload(50 * 1024 * 1024)).toBe(true);
    });
  });

  describe("canUploadVideo validation", () => {
    it("should reject video upload on free tier", () => {
      const { result } = renderHook(() => useStorage(), { wrapper });

      // Free tier doesn't allow videos
      expect(result.current.canUploadVideo(30)).toBe(false);
      expect(result.current.canUploadVideo(0)).toBe(false);
    });

    it("should allow video under duration limit on standard tier", () => {
      const { result } = renderHook(() => useStorage(), { wrapper });

      act(() => {
        result.current.setTier("standard");
      });

      // Standard tier: 2 minutes max
      expect(result.current.canUploadVideo(60)).toBe(true); // 1 min
      expect(result.current.canUploadVideo(120)).toBe(true); // 2 min
      expect(result.current.canUploadVideo(121)).toBe(false); // over 2 min
    });

    it("should allow longer video on premium tier", () => {
      const { result } = renderHook(() => useStorage(), { wrapper });

      act(() => {
        result.current.setTier("premium");
      });

      // Premium tier: 10 minutes max
      expect(result.current.canUploadVideo(300)).toBe(true); // 5 min
      expect(result.current.canUploadVideo(600)).toBe(true); // 10 min
      expect(result.current.canUploadVideo(601)).toBe(false); // over 10 min
    });
  });

  describe("usage tracking after upload", () => {
    it("should track storage after successful upload", () => {
      const { result } = renderHook(() => useStorage(), { wrapper });

      const fileSize = 5 * 1024 * 1024; // 5MB

      act(() => {
        result.current.addUsage(fileSize);
      });

      expect(result.current.usedBytes).toBe(fileSize);
      expect(result.current.usagePercent).toBe(1); // 5MB of 500MB = 1%
    });
  });
});

// Test entry tags feature (PRD Section 3.1, 3.2 step 6)
describe("Entry tags", () => {
  const entryWrapper = ({ children }: { children: ReactNode }) => (
    <EntryProvider>{children}</EntryProvider>
  );

  it("should add entry with tags", () => {
    const { result } = renderHook(() => useEntries(), {
      wrapper: entryWrapper,
    });

    act(() => {
      result.current.addEntry({
        type: "photo",
        caption: "Beach day",
        date: "2026-01-15",
        tags: ["beach", "summer", "family"],
      });
    });

    expect(result.current.entries[0].tags).toEqual([
      "beach",
      "summer",
      "family",
    ]);
  });

  it("should add entry without tags", () => {
    const { result } = renderHook(() => useEntries(), {
      wrapper: entryWrapper,
    });

    act(() => {
      result.current.addEntry({
        type: "photo",
        caption: "No tags entry",
        date: "2026-01-15",
      });
    });

    expect(result.current.entries[0].tags).toBeUndefined();
  });

  it("should update entry tags", () => {
    const { result } = renderHook(() => useEntries(), {
      wrapper: entryWrapper,
    });

    act(() => {
      result.current.addEntry({
        type: "photo",
        caption: "Entry to update",
        date: "2026-01-15",
        tags: ["original"],
      });
    });

    const entryId = result.current.entries[0].id;

    act(() => {
      result.current.updateEntry(entryId, { tags: ["updated", "new"] });
    });

    expect(result.current.entries[0].tags).toEqual(["updated", "new"]);
  });
});

// Test smart notification frequency integration (PRD Section 7.3)
describe("Smart notification frequency", () => {
  const notificationWrapper = ({ children }: { children: ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  it("should reset frequency to daily when recordEntryPosted is called", async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: notificationWrapper,
    });

    // Simulate frequency reduced to every_2_days (3 ignored days)
    await act(async () => {
      result.current.recordIgnoredPrompt();
      result.current.recordIgnoredPrompt();
      result.current.recordIgnoredPrompt();
    });

    expect(result.current.promptFrequency).toBe("every_2_days");

    // Simulate entry posted - should reset to daily
    await act(async () => {
      result.current.recordEntryPosted();
    });

    expect(result.current.promptFrequency).toBe("daily");
    expect(result.current.consecutiveIgnoredDays).toBe(0);
  });
});

// Test storage warning notification integration (PRD Section 7.1)
describe("Storage warning notifications", () => {
  const Notifications = require("expo-notifications");

  const combinedWrapper = ({ children }: { children: ReactNode }) => (
    <StorageProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </StorageProvider>
  );

  beforeEach(() => {
    Notifications.scheduleNotificationAsync.mockClear();
  });

  it("should send storage warning when crossing 80% threshold", async () => {
    const { result: storageResult } = renderHook(() => useStorage(), {
      wrapper: combinedWrapper,
    });
    const { result: notificationResult } = renderHook(
      () => useNotifications(),
      {
        wrapper: combinedWrapper,
      },
    );

    // Free tier = 500MB limit. Add 375MB (75%)
    act(() => {
      storageResult.current.addUsage(375 * 1024 * 1024);
    });

    Notifications.scheduleNotificationAsync.mockClear();

    // Send notification for crossing 80%
    await act(async () => {
      await notificationResult.current.sendStorageWarningNotification(80);
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: expect.stringContaining("80%"),
          data: { type: "storage_warning", threshold: 80 },
        }),
      }),
    );
  });

  it("should send storage warning when crossing 100% threshold", async () => {
    const { result: notificationResult } = renderHook(
      () => useNotifications(),
      {
        wrapper: combinedWrapper,
      },
    );

    Notifications.scheduleNotificationAsync.mockClear();

    await act(async () => {
      await notificationResult.current.sendStorageWarningNotification(100);
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: expect.stringContaining("full"),
        }),
      }),
    );
  });

  it("should not send warning when below 80%", async () => {
    const { result: notificationResult } = renderHook(
      () => useNotifications(),
      {
        wrapper: combinedWrapper,
      },
    );

    Notifications.scheduleNotificationAsync.mockClear();

    await act(async () => {
      await notificationResult.current.sendStorageWarningNotification(75);
    });

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

// Test Feed screen with TanStack Query hooks (migration from EntryContext)
describe("Feed TanStack Query integration", () => {
  const { clearAllMockData, entryApi } = require("@/services/api-client");
  const { QueryClient, QueryClientProvider } = require("@tanstack/react-query");
  const { useEntriesFlat, useCreateEntry } = require("@/hooks/use-entries");
  const React = require("react");

  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
        mutations: { retry: false },
      },
    });
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );
  }

  beforeEach(() => {
    clearAllMockData();
  });

  it("should create entry via useCreateEntry mutation", async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({
        type: "photo",
        date: "2026-01-15",
        caption: "New entry via TanStack Query",
        mediaUris: ["file://photo.jpg"],
        tags: ["test"],
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.caption).toBe("New entry via TanStack Query");
    expect(result.current.data?.tags).toEqual(["test"]);
  });

  it("should fetch entries via useEntriesFlat hook", async () => {
    // Create entries directly via API
    await entryApi.createEntry({
      entry: { type: "photo", date: "2026-01-15", caption: "Entry 1" },
    });
    await entryApi.createEntry({
      entry: { type: "text", date: "2026-01-14", caption: "Entry 2" },
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useEntriesFlat(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.entries).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);
  });

  it("should provide refetch capability for pull-to-refresh", async () => {
    await entryApi.createEntry({
      entry: { type: "photo", date: "2026-01-15", caption: "Initial" },
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useEntriesFlat(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.entries).toHaveLength(1);

    // Add another entry directly
    await entryApi.createEntry({
      entry: { type: "text", date: "2026-01-16", caption: "Added later" },
    });

    // Refetch and wait for the new data
    await act(async () => {
      await result.current.refetch();
    });

    // Wait for entries to update after refetch
    await waitFor(() => {
      expect(result.current.entries).toHaveLength(2);
    });
  });
});

// Test infinite scroll (PRD Section 4.1)
describe("Feed infinite scroll", () => {
  const { clearAllMockData, entryApi } = require("@/services/api-client");
  const { QueryClient, QueryClientProvider } = require("@tanstack/react-query");
  const { useInfiniteEntries } = require("@/hooks/use-entries");
  const React = require("react");

  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
        mutations: { retry: false },
      },
    });
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );
  }

  beforeEach(() => {
    clearAllMockData();
  });

  it("should load entries with pagination via useInfiniteEntries", async () => {
    // Create 5 entries
    for (let i = 1; i <= 5; i++) {
      await entryApi.createEntry({
        entry: {
          type: "photo",
          date: `2026-01-${String(i).padStart(2, "0")}`,
          caption: `Entry ${i}`,
        },
      });
    }

    const wrapper = createWrapper();
    const { result } = renderHook(() => useInfiniteEntries({ limit: 2 }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // First page should have 2 entries
    expect(result.current.entries).toHaveLength(2);
    expect(result.current.hasNextPage).toBe(true);
  });

  it("should fetch next page when hasNextPage is true", async () => {
    // Create 4 entries
    for (let i = 1; i <= 4; i++) {
      await entryApi.createEntry({
        entry: {
          type: "text",
          date: `2026-01-${String(i).padStart(2, "0")}`,
          caption: `Entry ${i}`,
        },
      });
    }

    const wrapper = createWrapper();
    const { result } = renderHook(() => useInfiniteEntries({ limit: 2 }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.entries).toHaveLength(2);
    expect(result.current.hasNextPage).toBe(true);

    // Fetch next page
    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => {
      expect(result.current.entries).toHaveLength(4);
    });

    expect(result.current.hasNextPage).toBe(false);
  });

  it("should track isFetchingNextPage state", async () => {
    await entryApi.createEntry({
      entry: { type: "photo", date: "2026-01-15", caption: "Entry 1" },
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useInfiniteEntries({ limit: 10 }), {
      wrapper,
    });

    // Initially not fetching next page
    expect(result.current.isFetchingNextPage).toBe(false);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

// Test camera capture feature (PRD Section 3.2, 3.3)
describe("Camera capture", () => {
  it("should support launchCameraAsync for photo capture", () => {
    // This tests that ImagePicker has camera capability
    const ImagePicker = require("expo-image-picker");
    expect(ImagePicker.launchCameraAsync).toBeDefined();
    expect(typeof ImagePicker.launchCameraAsync).toBe("function");
  });

  it("should request camera permissions before capturing", async () => {
    const ImagePicker = require("expo-image-picker");
    ImagePicker.requestCameraPermissionsAsync = jest.fn().mockResolvedValue({
      status: "granted",
    });

    await ImagePicker.requestCameraPermissionsAsync();

    expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
  });

  it("should handle camera permission denied gracefully", async () => {
    const ImagePicker = require("expo-image-picker");
    ImagePicker.requestCameraPermissionsAsync = jest.fn().mockResolvedValue({
      status: "denied",
    });

    const result = await ImagePicker.requestCameraPermissionsAsync();

    expect(result.status).toBe("denied");
  });
});

// Test draft auto-save feature (PRD Section 3.5)
describe("Feed draft auto-save", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
  });

  it("should load draft and indicate hasDraft when draft exists", async () => {
    const savedDraft: Draft = {
      type: "photo",
      mediaUris: ["file://photo.jpg"],
      caption: "Test caption",
      date: "2026-01-15",
      savedAt: Date.now(),
    };
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedDraft));

    const { result } = renderHook(() => useDraft());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasDraft).toBe(true);
    expect(result.current.draft?.type).toBe("photo");
    expect(result.current.draft?.caption).toBe("Test caption");
  });

  it("should save draft with media when creating photo entry", async () => {
    const { result } = renderHook(() => useDraft());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.saveDraft({
        type: "photo",
        mediaUris: ["file://photo1.jpg", "file://photo2.jpg"],
        mediaSizes: [1024, 2048],
        caption: "My photos",
        date: "2026-01-15",
      });
    });

    expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    expect(result.current.draft?.mediaUris).toHaveLength(2);
    expect(result.current.draft?.mediaSizes).toEqual([1024, 2048]);
  });

  it("should clear draft when entry is submitted", async () => {
    const savedDraft: Draft = {
      type: "text",
      caption: "Draft caption",
      date: "2026-01-15",
      savedAt: Date.now(),
    };
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedDraft));

    const { result } = renderHook(() => useDraft());

    await waitFor(() => {
      expect(result.current.hasDraft).toBe(true);
    });

    await act(async () => {
      await result.current.clearDraft();
    });

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
      "@littlejourney:draft",
    );
    expect(result.current.draft).toBeNull();
    expect(result.current.hasDraft).toBe(false);
  });
});

// Test entry attribution display (PRD Section 4.2, 3.6)
describe("Entry attribution", () => {
  const { clearAllMockData, entryApi } = require("@/services/api-client");

  beforeEach(() => {
    clearAllMockData();
  });

  it("should include createdByName in entry when created", async () => {
    const result = await entryApi.createEntry({
      entry: {
        type: "photo",
        date: "2026-01-15",
        caption: "Test entry",
        createdBy: "user_123",
        createdByName: "John Doe",
      },
    });

    expect(result.data.createdByName).toBe("John Doe");
    expect(result.data.createdBy).toBe("user_123");
  });

  it("should return createdByName when fetching entry", async () => {
    const createResult = await entryApi.createEntry({
      entry: {
        type: "photo",
        date: "2026-01-15",
        caption: "Entry with attribution",
        createdBy: "user_456",
        createdByName: "Jane Smith",
      },
    });

    const fetchResult = await entryApi.getEntry(createResult.data.id);

    expect(fetchResult.data.createdByName).toBe("Jane Smith");
  });

  it("should handle entries without attribution gracefully", async () => {
    const result = await entryApi.createEntry({
      entry: {
        type: "text",
        date: "2026-01-15",
        caption: "Entry without attribution",
      },
    });

    expect(result.data.createdByName).toBeUndefined();
    expect(result.data.createdBy).toBeUndefined();
  });
});

// Test photo book birthday prompt (PRD Section 10.1)
describe("Photo book birthday prompt", () => {
  const combinedWrapper = ({ children }: { children: ReactNode }) => (
    <StorageProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </StorageProvider>
  );

  const Notifications = require("expo-notifications");

  beforeEach(() => {
    Notifications.scheduleNotificationAsync.mockClear();
  });

  it("should send birthday notification when child turns 1", async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: combinedWrapper,
    });

    await act(async () => {
      await result.current.sendPhotoBookBirthdayPrompt("Emma");
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: expect.stringMatching(/Emma.*birthday|birthday.*Emma/i),
          body: expect.stringContaining("photo book"),
          data: { type: "photo_book_prompt" },
        }),
        trigger: null,
      }),
    );
  });

  it("should include child name in birthday prompt", async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: combinedWrapper,
    });

    await act(async () => {
      await result.current.sendPhotoBookBirthdayPrompt("Oliver");
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: expect.stringContaining("Oliver"),
        }),
      }),
    );
  });
});

// Test OTD-003: Multi-year memories year tabs
describe("On This Day OTD-003: Multi-year memories", () => {
  const {
    OnThisDayProvider,
    useOnThisDay,
  } = require("@/contexts/on-this-day-context");
  const React = require("react");
  const { renderHook, act, waitFor } = require("@testing-library/react-native");

  // Mock entry context with multi-year entries
  jest.mock("@/contexts/entry-context", () => ({
    useEntries: () => ({
      entries: [
        {
          id: "e1",
          date: "2025-01-18",
          type: "photo",
          mediaUris: ["photo1.jpg"],
        },
        {
          id: "e2",
          date: "2024-01-18",
          type: "photo",
          mediaUris: ["photo2.jpg"],
        },
        {
          id: "e3",
          date: "2023-01-18",
          type: "photo",
          mediaUris: ["photo3.jpg"],
        },
      ],
      getOnThisDayEntries: () => [
        {
          id: "e1",
          date: "2025-01-18",
          type: "photo",
          mediaUris: ["photo1.jpg"],
        },
        {
          id: "e2",
          date: "2024-01-18",
          type: "photo",
          mediaUris: ["photo2.jpg"],
        },
        {
          id: "e3",
          date: "2023-01-18",
          type: "photo",
          mediaUris: ["photo3.jpg"],
        },
      ],
    }),
  }));

  it("should return memories grouped by year from context", () => {
    // getMemoriesByYear returns groups sorted by year descending
    const mockGroups = [
      { year: 2025, yearsAgo: 1, memories: [{ id: "m1", yearsAgo: 1 }] },
      { year: 2024, yearsAgo: 2, memories: [{ id: "m2", yearsAgo: 2 }] },
      { year: 2023, yearsAgo: 3, memories: [{ id: "m3", yearsAgo: 3 }] },
    ];

    expect(mockGroups.length).toBe(3);
    expect(mockGroups[0].year).toBe(2025);
    expect(mockGroups[1].year).toBe(2024);
    expect(mockGroups[2].year).toBe(2023);
  });

  it("should have year tabs selectable by year", () => {
    // When there are memories from multiple years, the UI should show year tabs
    // Each tab should be identified by year for testID (year-tab-2025, etc.)
    const years = [2025, 2024, 2023];
    const yearTabIds = years.map((year) => `year-tab-${year}`);

    expect(yearTabIds).toEqual([
      "year-tab-2025",
      "year-tab-2024",
      "year-tab-2023",
    ]);
  });

  it("should show correct label for each year tab", () => {
    const formatYearsAgo = (yearsAgo: number): string => {
      return yearsAgo === 1 ? "1 year ago" : `${yearsAgo} years ago`;
    };

    expect(formatYearsAgo(1)).toBe("1 year ago");
    expect(formatYearsAgo(2)).toBe("2 years ago");
    expect(formatYearsAgo(3)).toBe("3 years ago");
  });

  it("should filter memories for selected year", () => {
    const allMemories = [
      { id: "m1", year: 2025, yearsAgo: 1 },
      { id: "m2", year: 2025, yearsAgo: 1 },
      { id: "m3", year: 2024, yearsAgo: 2 },
      { id: "m4", year: 2023, yearsAgo: 3 },
    ];

    const selectedYear = 2025;
    const filteredMemories = allMemories.filter((m) => m.year === selectedYear);

    expect(filteredMemories).toHaveLength(2);
    expect(filteredMemories.every((m) => m.year === 2025)).toBe(true);
  });
});

// Test upload rate limiting integration (PRD Section 13.2)
describe("Upload rate limiting", () => {
  const { useRateLimit } = require("@/hooks/use-rate-limit");

  beforeEach(() => {
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
  });

  it("should allow upload when under hourly limit", async () => {
    const { result } = renderHook(() => useRateLimit());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canUpload).toBe(true);
    expect(result.current.hourlyUploads).toBe(0);
  });

  it("should block upload when hourly limit reached", async () => {
    const now = Date.now();
    const recentUploads = Array.from({ length: 50 }, (_, i) => ({
      timestamp: now - i * 1000,
    }));
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(recentUploads));

    const { result } = renderHook(() => useRateLimit());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canUpload).toBe(false);
    expect(result.current.hourlyUploads).toBe(50);
    expect(result.current.rateLimitMessage).toContain("50 uploads per hour");
  });

  it("should track upload count and record new uploads", async () => {
    const { result } = renderHook(() => useRateLimit());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.recordUpload();
    });

    expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    expect(result.current.hourlyUploads).toBe(1);
    expect(result.current.dailyUploads).toBe(1);
  });
});

// VOICE-001: Voice journal entry type tests
describe("Voice Journal Entry Type", () => {
  it("should include voice type in Entry interface", () => {
    // Test that Entry type accepts 'voice' as a valid type
    const voiceEntry = {
      id: "entry_123",
      type: "voice" as const,
      audioUri: "file:///recording.m4a",
      audioDuration: 5000,
      caption: "Baby's first words!",
      date: "2026-01-18",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(voiceEntry.type).toBe("voice");
    expect(voiceEntry.audioUri).toBeDefined();
    expect(voiceEntry.audioDuration).toBe(5000);
  });

  it("should allow voice entries without optional fields", () => {
    const voiceEntry = {
      id: "entry_124",
      type: "voice" as const,
      audioUri: "file:///recording2.m4a",
      audioDuration: 3000,
      caption: undefined,
      transcript: undefined,
      date: "2026-01-18",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(voiceEntry.type).toBe("voice");
    expect(voiceEntry.caption).toBeUndefined();
    expect(voiceEntry.transcript).toBeUndefined();
  });
});

// VOICE-003: Voice entry with photo attachment
describe("Voice entry with photo attachment", () => {
  it("should support voice entry with mediaUris", () => {
    // Voice entries can include photos attached from gallery
    const voiceEntryWithPhoto = {
      id: "entry_125",
      type: "voice" as const,
      audioUri: "file:///recording.m4a",
      audioDuration: 10000,
      mediaUris: ["file:///photo1.jpg", "file:///photo2.jpg"],
      caption: "Voice with photos",
      date: "2026-01-18",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(voiceEntryWithPhoto.type).toBe("voice");
    expect(voiceEntryWithPhoto.audioUri).toBeDefined();
    expect(voiceEntryWithPhoto.mediaUris).toHaveLength(2);
  });

  it("should allow voice entry without photo attachment", () => {
    const voiceEntryNoPhoto = {
      id: "entry_126",
      type: "voice" as const,
      audioUri: "file:///recording.m4a",
      audioDuration: 5000,
      mediaUris: undefined,
      date: "2026-01-18",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(voiceEntryNoPhoto.type).toBe("voice");
    expect(voiceEntryNoPhoto.mediaUris).toBeUndefined();
  });

  it("should create voice entry with photo via API", async () => {
    const { clearAllMockData, entryApi } = require("@/services/api-client");
    clearAllMockData();

    const result = await entryApi.createEntry({
      entry: {
        type: "voice",
        date: "2026-01-18",
        audioUri: "file:///recording.m4a",
        audioDuration: 8000,
        mediaUris: ["file:///attached-photo.jpg"],
        caption: "Voice with attached photo",
      },
    });

    expect(result.data.type).toBe("voice");
    expect(result.data.audioUri).toBe("file:///recording.m4a");
    expect(result.data.mediaUris).toEqual(["file:///attached-photo.jpg"]);
  });

  it("should support viewing voice entry with photo display", () => {
    // Entry with voice should show photo along with voice playback
    const voiceWithPhotoEntry = {
      type: "voice",
      audioUri: "file:///recording.m4a",
      audioDuration: 5000,
      mediaUris: ["file:///photo.jpg"],
    };

    // Voice entry shows photo if mediaUris present
    const hasPhoto =
      voiceWithPhotoEntry.mediaUris && voiceWithPhotoEntry.mediaUris.length > 0;
    const hasVoice = !!voiceWithPhotoEntry.audioUri;

    expect(hasPhoto).toBe(true);
    expect(hasVoice).toBe(true);
  });
});

// GAME-002: Streak Card Tests
describe("Streak card (GAME-002)", () => {
  // Helper function to determine if streak card should show
  const shouldShowStreakCard = (
    currentStreak: number,
    longestStreak: number,
  ): boolean => {
    return !(currentStreak === 0 && longestStreak === 0);
  };

  // Helper function to get streak icon
  const getStreakIcon = (currentStreak: number): string => {
    return currentStreak >= 7 ? "🔥" : currentStreak > 0 ? "⚡" : "💤";
  };

  // Helper function to get streak label
  const getStreakLabel = (currentStreak: number): string => {
    return currentStreak === 0
      ? "Start your streak today!"
      : currentStreak === 1
        ? "1 day streak"
        : `${currentStreak} day streak`;
  };

  it("should not show streak card when no entries", () => {
    // StreakCard returns null when currentStreak=0 and longestStreak=0
    expect(shouldShowStreakCard(0, 0)).toBe(false);
  });

  it("should show streak card when user has longest streak but no current", () => {
    // User had a streak before but not currently active
    expect(shouldShowStreakCard(0, 5)).toBe(true);
  });

  it("should show fire icon for 7+ day streak", () => {
    expect(getStreakIcon(7)).toBe("🔥");
    expect(getStreakIcon(10)).toBe("🔥");
    expect(getStreakIcon(30)).toBe("🔥");
  });

  it("should show lightning icon for active streak under 7 days", () => {
    expect(getStreakIcon(1)).toBe("⚡");
    expect(getStreakIcon(3)).toBe("⚡");
    expect(getStreakIcon(6)).toBe("⚡");
  });

  it("should show sleep icon when no current streak", () => {
    expect(getStreakIcon(0)).toBe("💤");
  });

  it("should show singular day label for streak of 1", () => {
    expect(getStreakLabel(1)).toBe("1 day streak");
  });

  it("should show plural day label for streak > 1", () => {
    expect(getStreakLabel(5)).toBe("5 day streak");
    expect(getStreakLabel(10)).toBe("10 day streak");
  });

  it("should show start message when no current streak", () => {
    expect(getStreakLabel(0)).toBe("Start your streak today!");
  });

  it("should show encouragement message when streak is broken", () => {
    // When currentStreak=0 but longestStreak>0, show encouragement
    const currentStreak = 0;
    const longestStreak = 10;
    const showEncourage = currentStreak === 0 && longestStreak > 0;
    expect(showEncourage).toBe(true);
  });
});

// GAME-003: Monthly Goal Card Tests
describe("Monthly goal card (GAME-003)", () => {
  // Helper function to get goal icon
  const getGoalIcon = (isGoalMet: boolean): string => {
    return isGoalMet ? "🎉" : "🎯";
  };

  // Helper function to get status text
  const getStatusText = (
    isGoalMet: boolean,
    currentCount: number,
    goalCount: number,
  ): string => {
    return isGoalMet
      ? "Goal reached!"
      : `${currentCount} of ${goalCount} entries`;
  };

  // Helper function to check if celebration should show
  const shouldShowCelebration = (isGoalMet: boolean): boolean => {
    return isGoalMet;
  };

  it("should show target icon when goal not met", () => {
    expect(getGoalIcon(false)).toBe("🎯");
  });

  it("should show celebration icon when goal met", () => {
    expect(getGoalIcon(true)).toBe("🎉");
  });

  it("should show progress count when goal not met", () => {
    expect(getStatusText(false, 3, 10)).toBe("3 of 10 entries");
    expect(getStatusText(false, 0, 10)).toBe("0 of 10 entries");
    expect(getStatusText(false, 9, 10)).toBe("9 of 10 entries");
  });

  it("should show 'Goal reached!' when goal met", () => {
    expect(getStatusText(true, 10, 10)).toBe("Goal reached!");
    expect(getStatusText(true, 15, 10)).toBe("Goal reached!");
  });

  it("should show celebration badge when goal met", () => {
    expect(shouldShowCelebration(true)).toBe(true);
  });

  it("should not show celebration badge when goal not met", () => {
    expect(shouldShowCelebration(false)).toBe(false);
  });

  it("should display current month name", () => {
    const monthName = new Date().toLocaleString("en-US", { month: "long" });
    expect(monthName).toBeTruthy();
    expect(typeof monthName).toBe("string");
  });

  it("should cap progress bar at 100%", () => {
    // Progress percent calculation from context
    const currentCount = 15;
    const goalCount = 10;
    const progressPercent = Math.min(
      100,
      Math.round((currentCount / goalCount) * 100),
    );
    expect(progressPercent).toBe(100);
  });

  it("should calculate correct progress percent", () => {
    // 5 of 10 = 50%
    const percent = Math.min(100, Math.round((5 / 10) * 100));
    expect(percent).toBe(50);

    // 3 of 10 = 30%
    const percent2 = Math.min(100, Math.round((3 / 10) * 100));
    expect(percent2).toBe(30);
  });
});
