import { renderHook, act } from "@testing-library/react-native";
import { useNetworkStatus } from "@/hooks/use-network-status";
import NetInfo from "@react-native-community/netinfo";

// Mock NetInfo
jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(),
}));

describe("useNetworkStatus hook (MOBILE-006)", () => {
  let netInfoCallback:
    | ((state: { isConnected: boolean | null }) => void)
    | null = null;
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    netInfoCallback = null;
    mockUnsubscribe = jest.fn();

    // Capture the listener callback
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      netInfoCallback = callback;
      return mockUnsubscribe;
    });

    // Default fetch returns connected
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
  });

  it("should return isOnline true when connected", async () => {
    const { result } = renderHook(() => useNetworkStatus());

    // Simulate initial fetch callback
    await act(async () => {
      netInfoCallback?.({ isConnected: true });
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it("should return isOnline false when disconnected", async () => {
    const { result } = renderHook(() => useNetworkStatus());

    await act(async () => {
      netInfoCallback?.({ isConnected: false });
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });

  it("should track network state changes", async () => {
    const { result } = renderHook(() => useNetworkStatus());

    // Start connected
    await act(async () => {
      netInfoCallback?.({ isConnected: true });
    });
    expect(result.current.isOnline).toBe(true);

    // Go offline
    await act(async () => {
      netInfoCallback?.({ isConnected: false });
    });
    expect(result.current.isOnline).toBe(false);

    // Come back online
    await act(async () => {
      netInfoCallback?.({ isConnected: true });
    });
    expect(result.current.isOnline).toBe(true);
  });

  it("should handle null connection status as offline", async () => {
    const { result } = renderHook(() => useNetworkStatus());

    await act(async () => {
      netInfoCallback?.({ isConnected: null });
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });

  it("should call onOffline callback when going offline", async () => {
    const onOffline = jest.fn();
    renderHook(() => useNetworkStatus({ onOffline }));

    // Start connected
    await act(async () => {
      netInfoCallback?.({ isConnected: true });
    });

    // Go offline
    await act(async () => {
      netInfoCallback?.({ isConnected: false });
    });

    expect(onOffline).toHaveBeenCalledTimes(1);
  });

  it("should call onOnline callback when coming back online", async () => {
    const onOnline = jest.fn();
    renderHook(() => useNetworkStatus({ onOnline }));

    // Start offline
    await act(async () => {
      netInfoCallback?.({ isConnected: false });
    });

    // Come back online
    await act(async () => {
      netInfoCallback?.({ isConnected: true });
    });

    expect(onOnline).toHaveBeenCalledTimes(1);
  });

  it("should cleanup listener on unmount", () => {
    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
