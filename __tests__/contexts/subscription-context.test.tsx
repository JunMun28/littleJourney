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

  // PAY-006: Upgrade tier with proration tests
  describe("upgradePlan with proration", () => {
    it("provides upgradePlan method", () => {
      const { result } = renderHook(() => useSubscription(), { wrapper });
      expect(result.current.upgradePlan).toBeDefined();
    });

    it("upgrades plan immediately and increases limits", async () => {
      const { result } = renderHook(() => useSubscription(), { wrapper });

      // Subscribe to standard first
      await act(async () => {
        await result.current.subscribe("standard", "monthly");
      });

      expect(result.current.currentPlan).toBe("standard");

      // Upgrade to premium
      await act(async () => {
        await result.current.upgradePlan("premium");
      });

      expect(result.current.currentPlan).toBe("premium");
      // Billing cycle should remain the same
      expect(result.current.billingCycle).toBe("monthly");
    });

    it("calculates prorated amount correctly", async () => {
      const { result } = renderHook(() => useSubscription(), { wrapper });

      // Subscribe to standard monthly
      await act(async () => {
        await result.current.subscribe("standard", "monthly");
      });

      // Calculate proration (should return difference between plans, prorated for remaining days)
      const proratedAmount = result.current.calculateProratedAmount("premium");

      // Prorated amount should be positive (upgrading to higher tier)
      expect(proratedAmount).toBeGreaterThanOrEqual(0);
    });

    it("returns 0 proration for same tier upgrade", async () => {
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await act(async () => {
        await result.current.subscribe("standard", "monthly");
      });

      const proratedAmount = result.current.calculateProratedAmount("standard");
      expect(proratedAmount).toBe(0);
    });

    it("throws error when trying to upgrade as free user", async () => {
      const { result } = renderHook(() => useSubscription(), { wrapper });

      // Should throw because no active subscription to upgrade
      await expect(
        act(async () => {
          await result.current.upgradePlan("premium");
        }),
      ).rejects.toThrow("Cannot upgrade without an active subscription");
    });

    it("throws error when downgrading", async () => {
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await act(async () => {
        await result.current.subscribe("premium", "monthly");
      });

      // Should throw because downgrade is not allowed via upgradePlan
      await expect(
        act(async () => {
          await result.current.upgradePlan("standard");
        }),
      ).rejects.toThrow("Cannot downgrade using upgradePlan");
    });
  });

  // PAY-008: Failed payment grace period tests
  describe("failed payment grace period", () => {
    it("provides paymentStatus field defaulting to active", () => {
      const { result } = renderHook(() => useSubscription(), { wrapper });
      expect(result.current.paymentStatus).toBe("active");
    });

    it("simulates payment failure and enters grace period", async () => {
      const { result } = renderHook(() => useSubscription(), { wrapper });

      // Subscribe first
      await act(async () => {
        await result.current.subscribe("standard", "monthly");
      });

      // Simulate payment failure
      await act(async () => {
        await result.current.simulatePaymentFailure();
      });

      expect(result.current.paymentStatus).toBe("past_due");
      expect(result.current.paymentFailedAt).toBeTruthy();
      expect(result.current.isInGracePeriod).toBe(true);
    });

    it("calculates 7-day grace period end date from payment failure", async () => {
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await act(async () => {
        await result.current.subscribe("standard", "monthly");
      });

      await act(async () => {
        await result.current.simulatePaymentFailure();
      });

      // Grace period should be 7 days from failure
      expect(result.current.gracePeriodEndsAt).toBeTruthy();
      const failedDate = new Date(result.current.paymentFailedAt!);
      const graceEndDate = new Date(result.current.gracePeriodEndsAt!);
      const daysDiff = Math.round(
        (graceEndDate.getTime() - failedDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(daysDiff).toBe(7);
    });

    it("maintains access during grace period", async () => {
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await act(async () => {
        await result.current.subscribe("standard", "monthly");
      });

      await act(async () => {
        await result.current.simulatePaymentFailure();
      });

      // User should still have access during grace period
      expect(result.current.currentPlan).toBe("standard");
      expect(result.current.isSubscribed).toBe(true);
    });

    it("downgrades to free tier after grace period expires", async () => {
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await act(async () => {
        await result.current.subscribe("standard", "monthly");
      });

      await act(async () => {
        await result.current.simulatePaymentFailure();
      });

      // Manually trigger grace period expiry
      await act(async () => {
        await result.current.handleGracePeriodExpiry();
      });

      expect(result.current.currentPlan).toBe("free");
      expect(result.current.isSubscribed).toBe(false);
      expect(result.current.paymentStatus).toBe("failed");
    });

    it("resets payment status when successful payment made", async () => {
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await act(async () => {
        await result.current.subscribe("standard", "monthly");
      });

      await act(async () => {
        await result.current.simulatePaymentFailure();
      });

      expect(result.current.paymentStatus).toBe("past_due");

      // Simulate successful payment retry
      await act(async () => {
        await result.current.retryPayment();
      });

      expect(result.current.paymentStatus).toBe("active");
      expect(result.current.paymentFailedAt).toBeNull();
      expect(result.current.isInGracePeriod).toBe(false);
    });
  });
});
