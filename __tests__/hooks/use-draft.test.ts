import { renderHook, act, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDraft, type Draft } from "@/hooks/use-draft";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("useDraft", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
  });

  it("should return null draft initially when no saved draft exists", async () => {
    const { result } = renderHook(() => useDraft());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.draft).toBeNull();
  });

  it("should load existing draft from storage on mount", async () => {
    const savedDraft: Draft = {
      type: "photo",
      mediaUris: ["file://photo1.jpg"],
      caption: "Test caption",
      date: "2026-01-15",
      savedAt: Date.now(),
    };
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedDraft));

    const { result } = renderHook(() => useDraft());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.draft).toEqual(savedDraft);
    expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
      "@littlejourney:draft",
    );
  });

  it("should save draft to storage", async () => {
    const { result } = renderHook(() => useDraft());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const draftData: Omit<Draft, "savedAt"> = {
      type: "photo",
      mediaUris: ["file://photo.jpg"],
      caption: "My caption",
      date: "2026-01-15",
    };

    await act(async () => {
      await result.current.saveDraft(draftData);
    });

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      "@littlejourney:draft",
      expect.stringContaining('"type":"photo"'),
    );
    expect(result.current.draft?.type).toBe("photo");
    expect(result.current.draft?.savedAt).toBeDefined();
  });

  it("should clear draft from storage", async () => {
    const savedDraft: Draft = {
      type: "text",
      caption: "Test",
      date: "2026-01-15",
      savedAt: Date.now(),
    };
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedDraft));

    const { result } = renderHook(() => useDraft());

    await waitFor(() => {
      expect(result.current.draft).toEqual(savedDraft);
    });

    await act(async () => {
      await result.current.clearDraft();
    });

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
      "@littlejourney:draft",
    );
    expect(result.current.draft).toBeNull();
  });

  it("should not save empty drafts (no type selected)", async () => {
    const { result } = renderHook(() => useDraft());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.saveDraft({
        type: null,
        caption: "",
        date: "2026-01-15",
      });
    });

    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it("should handle storage errors gracefully", async () => {
    mockAsyncStorage.getItem.mockRejectedValue(new Error("Storage error"));

    const { result } = renderHook(() => useDraft());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should not crash, draft remains null
    expect(result.current.draft).toBeNull();
  });

  it("should return hasDraft true when draft exists", async () => {
    const savedDraft: Draft = {
      type: "video",
      mediaUris: ["file://video.mp4"],
      caption: "",
      date: "2026-01-15",
      savedAt: Date.now(),
    };
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedDraft));

    const { result } = renderHook(() => useDraft());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasDraft).toBe(true);
  });

  it("should save draft with media sizes", async () => {
    const { result } = renderHook(() => useDraft());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const draftData: Omit<Draft, "savedAt"> = {
      type: "photo",
      mediaUris: ["file://photo.jpg"],
      mediaSizes: [1024000],
      caption: "",
      date: "2026-01-15",
    };

    await act(async () => {
      await result.current.saveDraft(draftData);
    });

    expect(result.current.draft?.mediaSizes).toEqual([1024000]);
  });
});
