/**
 * Tests for Stripe payment service
 * PRD ref: PAY-002, PAY-003, PAY-004
 */

import {
  createPaymentSheet,
  presentPaymentSheet,
  setStripeHooks,
  isStripeError,
  getPlanAmountInCents,
  getStripePriceId,
  type StripeHooks,
  type StripeError,
} from "@/services/stripe";

// Create mock functions for Stripe hooks
const mockInitPaymentSheet = jest.fn();
const mockPresentPaymentSheet = jest.fn();

describe("Stripe service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up mock stripe hooks for tests
    setStripeHooks({
      initPaymentSheet: mockInitPaymentSheet,
      presentPaymentSheet: mockPresentPaymentSheet,
    } as unknown as StripeHooks);
  });

  afterEach(() => {
    // Clear hooks after each test
    setStripeHooks(null);
  });

  describe("createPaymentSheet", () => {
    it("returns error when amount is invalid", async () => {
      const result = await createPaymentSheet({
        amount: 0,
        currency: "sgd",
      });
      expect(result).toEqual({
        error: {
          code: "invalid_amount",
          message: "Amount must be greater than 0",
        },
      });
    });

    it("returns error when currency is invalid", async () => {
      const result = await createPaymentSheet({
        amount: 499,
        currency: "" as "sgd",
      });
      expect(result).toEqual({
        error: {
          code: "invalid_currency",
          message: "Currency is required",
        },
      });
    });

    it("creates payment intent for valid request", async () => {
      mockInitPaymentSheet.mockResolvedValueOnce({ error: null });

      const result = await createPaymentSheet({
        amount: 499,
        currency: "sgd",
        description: "Standard Monthly Subscription",
        paymentIntentClientSecret: "pi_test_secret",
      });

      expect(result).toEqual({ data: { ready: true } });
      expect(mockInitPaymentSheet).toHaveBeenCalled();
    });

    it("returns error when payment sheet initialization fails", async () => {
      mockInitPaymentSheet.mockResolvedValueOnce({
        error: {
          code: "Failed",
          message: "Network error",
        },
      });

      const result = await createPaymentSheet({
        amount: 499,
        currency: "sgd",
        paymentIntentClientSecret: "pi_test_secret",
      });

      expect(result).toEqual({
        error: {
          code: "Failed",
          message: "Network error",
        },
      });
    });

    it("returns not_initialized error when hooks not set", async () => {
      setStripeHooks(null);

      const result = await createPaymentSheet({
        amount: 499,
        currency: "sgd",
      });

      expect(result).toEqual({
        error: {
          code: "not_initialized",
          message:
            "Stripe hooks not initialized. Ensure StripeProvider is mounted.",
        },
      });
    });
  });

  describe("presentPaymentSheet", () => {
    it("returns success when payment completed", async () => {
      mockPresentPaymentSheet.mockResolvedValueOnce({ error: null });

      const result = await presentPaymentSheet();

      expect(result).toEqual({ data: { success: true } });
    });

    it("returns cancelled error when user cancels", async () => {
      mockPresentPaymentSheet.mockResolvedValueOnce({
        error: {
          code: "Canceled",
          message: "The payment was canceled",
        },
      });

      const result = await presentPaymentSheet();

      expect(result).toEqual({
        error: {
          code: "Canceled",
          message: "The payment was canceled",
        },
      });
    });

    it("returns error when payment fails", async () => {
      mockPresentPaymentSheet.mockResolvedValueOnce({
        error: {
          code: "Failed",
          message: "Payment declined",
        },
      });

      const result = await presentPaymentSheet();

      expect(result).toEqual({
        error: {
          code: "Failed",
          message: "Payment declined",
        },
      });
    });

    it("returns not_initialized error when hooks not set", async () => {
      setStripeHooks(null);

      const result = await presentPaymentSheet();

      expect(result).toEqual({
        error: {
          code: "not_initialized",
          message:
            "Stripe hooks not initialized. Ensure StripeProvider is mounted.",
        },
      });
    });
  });

  describe("isStripeError", () => {
    it("returns true for error response", () => {
      const error: StripeError = {
        error: {
          code: "test",
          message: "test message",
        },
      };
      expect(isStripeError(error)).toBe(true);
    });

    it("returns false for success response", () => {
      const success = { data: { ready: true } };
      expect(isStripeError(success)).toBe(false);
    });
  });

  describe("getPlanAmountInCents", () => {
    it("returns correct amount for standard monthly", () => {
      expect(getPlanAmountInCents("standard", "monthly")).toBe(499);
    });

    it("returns correct amount for standard yearly", () => {
      expect(getPlanAmountInCents("standard", "yearly")).toBe(3999);
    });

    it("returns correct amount for premium monthly", () => {
      expect(getPlanAmountInCents("premium", "monthly")).toBe(999);
    });

    it("returns correct amount for premium yearly", () => {
      expect(getPlanAmountInCents("premium", "yearly")).toBe(7999);
    });
  });

  describe("getStripePriceId", () => {
    it("returns price ID for standard monthly", () => {
      expect(getStripePriceId("standard", "monthly")).toBe(
        "price_standard_monthly",
      );
    });

    it("returns price ID for premium yearly", () => {
      expect(getStripePriceId("premium", "yearly")).toBe(
        "price_premium_yearly",
      );
    });
  });

  describe("Singapore payment methods (PAY-003, PAY-004)", () => {
    it("configures payment sheet with SGD currency for Singapore payments", async () => {
      mockInitPaymentSheet.mockResolvedValueOnce({ error: null });

      const result = await createPaymentSheet({
        amount: 499,
        currency: "sgd",
        description: "Standard Monthly Subscription",
        paymentIntentClientSecret: "pi_test_secret",
      });

      expect(result).toEqual({ data: { ready: true } });
      // Payment Sheet will auto-discover PayNow/GrabPay based on currency and backend config
      expect(mockInitPaymentSheet).toHaveBeenCalledWith(
        expect.objectContaining({
          merchantDisplayName: "Little Journey",
          paymentIntentClientSecret: "pi_test_secret",
        }),
      );
    });

    it("uses Singapore merchant country code for regional payments", async () => {
      mockInitPaymentSheet.mockResolvedValueOnce({ error: null });

      await createPaymentSheet({
        amount: 999,
        currency: "sgd",
        paymentIntentClientSecret: "pi_test_secret",
      });

      // Verify Apple Pay and Google Pay use Singapore country code
      expect(mockInitPaymentSheet).toHaveBeenCalledWith(
        expect.objectContaining({
          applePay: expect.objectContaining({
            merchantCountryCode: "SG",
          }),
          googlePay: expect.objectContaining({
            merchantCountryCode: "SG",
          }),
        }),
      );
    });
  });
});
