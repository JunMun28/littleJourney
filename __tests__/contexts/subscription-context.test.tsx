import { renderHook, act } from "@testing-library/react-native";
import {
  SubscriptionProvider,
  useSubscription,
  PLAN_DETAILS,
} from "@/contexts/subscription-context";
import type { ReactNode } from "react";

const wrapper = ({ children }: { children: ReactNode }) => (
  <SubscriptionProvider>{children}</SubscriptionProvider>
);

describe("SubscriptionContext", () => {
  it("provides default free tier state", () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });

    expect(result.current.currentPlan).toBe("free");
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.billingCycle).toBeNull();
  });

  it("throws error when used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() => {
      renderHook(() => useSubscription());
    }).toThrow("useSubscription must be used within a SubscriptionProvider");

    consoleSpy.mockRestore();
  });

  it("provides plan details with prices per PRD 12.1", () => {
    expect(PLAN_DETAILS.standard.monthlyPrice).toBe(4.99);
    expect(PLAN_DETAILS.standard.yearlyPrice).toBe(39.99);
    expect(PLAN_DETAILS.premium.monthlyPrice).toBe(9.99);
    expect(PLAN_DETAILS.premium.yearlyPrice).toBe(79.99);
  });

  it("subscribes to a plan with monthly billing", async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });

    await act(async () => {
      await result.current.subscribe("standard", "monthly");
    });

    expect(result.current.currentPlan).toBe("standard");
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.billingCycle).toBe("monthly");
  });

  it("subscribes to a plan with yearly billing", async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });

    await act(async () => {
      await result.current.subscribe("premium", "yearly");
    });

    expect(result.current.currentPlan).toBe("premium");
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.billingCycle).toBe("yearly");
  });

  it("cancels subscription and reverts to free tier", async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });

    // First subscribe
    await act(async () => {
      await result.current.subscribe("standard", "monthly");
    });

    expect(result.current.isSubscribed).toBe(true);

    // Then cancel
    await act(async () => {
      await result.current.cancelSubscription();
    });

    // Should be scheduled for cancellation but still active until period ends
    expect(result.current.cancelledAt).toBeTruthy();
    expect(result.current.currentPlan).toBe("standard"); // Still has access
  });

  it("restores cancelled subscription", async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });

    // Subscribe and cancel
    await act(async () => {
      await result.current.subscribe("standard", "monthly");
      await result.current.cancelSubscription();
    });

    expect(result.current.cancelledAt).toBeTruthy();

    // Restore
    await act(async () => {
      await result.current.restoreSubscription();
    });

    expect(result.current.cancelledAt).toBeNull();
    expect(result.current.currentPlan).toBe("standard");
  });

  it("upgrades from one plan to another", async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });

    // Subscribe to standard
    await act(async () => {
      await result.current.subscribe("standard", "monthly");
    });

    expect(result.current.currentPlan).toBe("standard");

    // Upgrade to premium
    await act(async () => {
      await result.current.subscribe("premium", "monthly");
    });

    expect(result.current.currentPlan).toBe("premium");
  });

  it("tracks subscription period dates", async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });

    await act(async () => {
      await result.current.subscribe("standard", "monthly");
    });

    expect(result.current.currentPeriodStart).toBeTruthy();
    expect(result.current.currentPeriodEnd).toBeTruthy();
  });
});
