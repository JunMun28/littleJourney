import { renderHook, act } from "@testing-library/react-native";
import { AppState, AppStateStatus } from "react-native";
import { useAppState } from "@/hooks/use-app-state";

describe("useAppState hook (MOBILE-005)", () => {
  let appStateCallback: ((state: AppStateStatus) => void) | null = null;
  let mockRemoveSubscription: jest.Mock;
  const originalAddEventListener = AppState.addEventListener;

  beforeEach(() => {
    jest.clearAllMocks();
    appStateCallback = null;
    mockRemoveSubscription = jest.fn();

    // Override addEventListener to capture callback
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation(
        (event: string, callback: (state: AppStateStatus) => void) => {
          if (event === "change") {
            appStateCallback = callback;
          }
          return { remove: mockRemoveSubscription };
        },
      );

    // Set initial state
    Object.defineProperty(AppState, "currentState", {
      value: "active",
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return current app state", () => {
    const { result } = renderHook(() => useAppState());

    expect(result.current.appState).toBe("active");
  });

  it("should track app state changes", () => {
    const { result } = renderHook(() => useAppState());

    // Simulate going to background
    act(() => {
      appStateCallback?.("background");
    });

    expect(result.current.appState).toBe("background");

    // Simulate returning to active
    act(() => {
      appStateCallback?.("active");
    });

    expect(result.current.appState).toBe("active");
  });

  it("should call onForeground callback when returning from background", () => {
    const onForeground = jest.fn();
    renderHook(() => useAppState({ onForeground }));

    // Go to background first
    act(() => {
      appStateCallback?.("background");
    });

    // Return to active
    act(() => {
      appStateCallback?.("active");
    });

    expect(onForeground).toHaveBeenCalledTimes(1);
  });

  it("should call onBackground callback when going to background", () => {
    const onBackground = jest.fn();
    renderHook(() => useAppState({ onBackground }));

    // Go to background
    act(() => {
      appStateCallback?.("background");
    });

    expect(onBackground).toHaveBeenCalledTimes(1);
  });

  it("should not call onForeground when going active from inactive (not background)", () => {
    const onForeground = jest.fn();
    renderHook(() => useAppState({ onForeground }));

    // Go to inactive (e.g., phone call overlay)
    act(() => {
      appStateCallback?.("inactive");
    });

    // Return to active from inactive
    act(() => {
      appStateCallback?.("active");
    });

    // Should not trigger onForeground since we didn't go to background
    expect(onForeground).not.toHaveBeenCalled();
  });

  it("should provide isInBackground helper", () => {
    const { result } = renderHook(() => useAppState());

    expect(result.current.isInBackground).toBe(false);

    act(() => {
      appStateCallback?.("background");
    });

    expect(result.current.isInBackground).toBe(true);

    act(() => {
      appStateCallback?.("active");
    });

    expect(result.current.isInBackground).toBe(false);
  });

  it("should cleanup listener on unmount", () => {
    const { unmount } = renderHook(() => useAppState());

    unmount();

    expect(mockRemoveSubscription).toHaveBeenCalled();
  });
});
