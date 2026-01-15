import React from "react";
import { render, screen } from "@testing-library/react-native";
import { OfflineBanner } from "@/components/offline-banner";

// Mock useNetworkStatus hook
jest.mock("@/hooks/use-network-status", () => ({
  useNetworkStatus: jest.fn(),
}));

import { useNetworkStatus } from "@/hooks/use-network-status";

const mockUseNetworkStatus = useNetworkStatus as jest.MockedFunction<
  typeof useNetworkStatus
>;

describe("OfflineBanner component (MOBILE-006)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when online", () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
      isOffline: false,
    });

    render(<OfflineBanner />);

    expect(screen.queryByText(/offline/i)).toBeNull();
  });

  it("should render offline message when offline", () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true,
    });

    render(<OfflineBanner />);

    expect(screen.getByText(/you are offline/i)).toBeTruthy();
  });

  it("should show cached data info when offline", () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true,
    });

    render(<OfflineBanner />);

    expect(screen.getByText(/viewing cached data/i)).toBeTruthy();
  });

  it("should have accessible text for screen readers", () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true,
    });

    render(<OfflineBanner />);

    const banner = screen.getByTestId("offline-banner");
    expect(banner).toBeTruthy();
    expect(banner.props.accessibilityLabel).toMatch(/offline/i);
  });
});
