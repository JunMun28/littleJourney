/**
 * TDD tests for magic-link.ts service
 * PRD: SHARE-002, SHARE-003, SHARE-004
 */

import {
  generateMagicLinkToken,
  validateMagicLinkToken,
  getMagicLinkUrl,
  refreshMagicLinkExpiry,
  isMagicLinkExpired,
  MAGIC_LINK_CONFIG,
  type MagicLinkPayload,
} from "@/services/magic-link";
import type { PermissionLevel } from "@/contexts/family-context";

describe("magic-link service", () => {
  const mockFamilyMemberId = "family-123";
  const mockPermission: PermissionLevel = "view_interact";
  const mockChildId = "child-456";

  describe("MAGIC_LINK_CONFIG", () => {
    it("should have 90 day expiry duration", () => {
      // PRD SHARE-004: Links expire after 90 days of inactivity
      expect(MAGIC_LINK_CONFIG.expiryDays).toBe(90);
    });

    it("should have configurable base URL", () => {
      expect(typeof MAGIC_LINK_CONFIG.baseUrl).toBe("string");
    });
  });

  describe("generateMagicLinkToken", () => {
    it("should generate a token string", () => {
      const token = generateMagicLinkToken({
        familyMemberId: mockFamilyMemberId,
        permissionLevel: mockPermission,
        childId: mockChildId,
      });

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should generate different tokens for different family members", () => {
      const token1 = generateMagicLinkToken({
        familyMemberId: "family-1",
        permissionLevel: mockPermission,
        childId: mockChildId,
      });

      const token2 = generateMagicLinkToken({
        familyMemberId: "family-2",
        permissionLevel: mockPermission,
        childId: mockChildId,
      });

      expect(token1).not.toBe(token2);
    });

    it("should include permission level in token payload", () => {
      const token = generateMagicLinkToken({
        familyMemberId: mockFamilyMemberId,
        permissionLevel: "view_only",
        childId: mockChildId,
      });

      const payload = validateMagicLinkToken(token);
      expect(payload?.permissionLevel).toBe("view_only");
    });

    it("should set expiry based on config", () => {
      const beforeGen = Date.now();
      const token = generateMagicLinkToken({
        familyMemberId: mockFamilyMemberId,
        permissionLevel: mockPermission,
        childId: mockChildId,
      });
      const afterGen = Date.now();

      const payload = validateMagicLinkToken(token);
      expect(payload).not.toBeNull();

      const expectedMinExpiry =
        beforeGen + MAGIC_LINK_CONFIG.expiryDays * 24 * 60 * 60 * 1000;
      const expectedMaxExpiry =
        afterGen + MAGIC_LINK_CONFIG.expiryDays * 24 * 60 * 60 * 1000;

      expect(payload!.expiresAt).toBeGreaterThanOrEqual(expectedMinExpiry);
      expect(payload!.expiresAt).toBeLessThanOrEqual(expectedMaxExpiry);
    });
  });

  describe("validateMagicLinkToken", () => {
    it("should return payload for valid token", () => {
      const token = generateMagicLinkToken({
        familyMemberId: mockFamilyMemberId,
        permissionLevel: mockPermission,
        childId: mockChildId,
      });

      const payload = validateMagicLinkToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.familyMemberId).toBe(mockFamilyMemberId);
      expect(payload?.permissionLevel).toBe(mockPermission);
      expect(payload?.childId).toBe(mockChildId);
    });

    it("should return null for invalid token format", () => {
      const payload = validateMagicLinkToken("invalid-token");
      expect(payload).toBeNull();
    });

    it("should return null for empty token", () => {
      const payload = validateMagicLinkToken("");
      expect(payload).toBeNull();
    });

    it("should return null for malformed base64", () => {
      const payload = validateMagicLinkToken("not-valid-base64!!!");
      expect(payload).toBeNull();
    });

    it("should return payload even if expired (validation separate from expiry check)", () => {
      // Generate token, then manually create expired one
      const expiredPayload: MagicLinkPayload = {
        familyMemberId: mockFamilyMemberId,
        permissionLevel: mockPermission,
        childId: mockChildId,
        createdAt: Date.now() - 100 * 24 * 60 * 60 * 1000, // 100 days ago
        expiresAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago (expired)
        version: 1,
      };

      // Encode as token
      const expiredToken = btoa(JSON.stringify(expiredPayload));
      const payload = validateMagicLinkToken(expiredToken);

      // Should still parse - expiry check is separate
      expect(payload).not.toBeNull();
      expect(payload?.familyMemberId).toBe(mockFamilyMemberId);
    });
  });

  describe("isMagicLinkExpired", () => {
    it("should return false for non-expired token", () => {
      const token = generateMagicLinkToken({
        familyMemberId: mockFamilyMemberId,
        permissionLevel: mockPermission,
        childId: mockChildId,
      });

      expect(isMagicLinkExpired(token)).toBe(false);
    });

    it("should return true for expired token", () => {
      const expiredPayload: MagicLinkPayload = {
        familyMemberId: mockFamilyMemberId,
        permissionLevel: mockPermission,
        childId: mockChildId,
        createdAt: Date.now() - 100 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        version: 1,
      };

      const expiredToken = btoa(JSON.stringify(expiredPayload));
      expect(isMagicLinkExpired(expiredToken)).toBe(true);
    });

    it("should return true for invalid token", () => {
      expect(isMagicLinkExpired("invalid")).toBe(true);
    });
  });

  describe("getMagicLinkUrl", () => {
    it("should return full URL with token", () => {
      const token = generateMagicLinkToken({
        familyMemberId: mockFamilyMemberId,
        permissionLevel: mockPermission,
        childId: mockChildId,
      });

      const url = getMagicLinkUrl(token);

      expect(url).toContain(MAGIC_LINK_CONFIG.baseUrl);
      expect(url).toContain(token);
    });

    it("should have proper URL format", () => {
      const token = generateMagicLinkToken({
        familyMemberId: mockFamilyMemberId,
        permissionLevel: mockPermission,
        childId: mockChildId,
      });

      const url = getMagicLinkUrl(token);

      // URL should be parseable
      expect(() => new URL(url)).not.toThrow();

      // Token should be in path
      const parsed = new URL(url);
      expect(parsed.pathname).toContain("/view/");
    });
  });

  describe("refreshMagicLinkExpiry (PRD SHARE-003 multi-device support)", () => {
    it("should return new token with extended expiry", () => {
      // Create a token that was generated 30 days ago
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const originalPayload: MagicLinkPayload = {
        familyMemberId: mockFamilyMemberId,
        permissionLevel: mockPermission,
        childId: mockChildId,
        createdAt: thirtyDaysAgo,
        expiresAt: thirtyDaysAgo + 90 * 24 * 60 * 60 * 1000, // 60 days from now
        version: 1,
      };
      const originalToken = btoa(
        JSON.stringify({ ...originalPayload, nonce: "test123" }),
      );

      // Refresh the token
      const refreshedToken = refreshMagicLinkExpiry(originalToken);

      expect(refreshedToken).not.toBeNull();
      expect(refreshedToken).not.toBe(originalToken);

      const refreshedPayload = validateMagicLinkToken(refreshedToken!);

      // Same identity but new expiry (90 days from now, not 60)
      expect(refreshedPayload?.familyMemberId).toBe(
        originalPayload.familyMemberId,
      );
      expect(refreshedPayload?.permissionLevel).toBe(
        originalPayload.permissionLevel,
      );
      expect(refreshedPayload?.childId).toBe(originalPayload.childId);
      expect(refreshedPayload?.expiresAt).toBeGreaterThan(
        originalPayload.expiresAt,
      );
    });

    it("should return null for invalid token", () => {
      const result = refreshMagicLinkExpiry("invalid-token");
      expect(result).toBeNull();
    });

    it("should work even for expired tokens (re-activation)", () => {
      const expiredPayload: MagicLinkPayload = {
        familyMemberId: mockFamilyMemberId,
        permissionLevel: mockPermission,
        childId: mockChildId,
        createdAt: Date.now() - 100 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() - 1000,
        version: 1,
      };

      const expiredToken = btoa(JSON.stringify(expiredPayload));
      const refreshedToken = refreshMagicLinkExpiry(expiredToken);

      expect(refreshedToken).not.toBeNull();
      expect(isMagicLinkExpired(refreshedToken!)).toBe(false);
    });
  });

  describe("MagicLinkPayload structure", () => {
    it("should include all required fields", () => {
      const token = generateMagicLinkToken({
        familyMemberId: mockFamilyMemberId,
        permissionLevel: mockPermission,
        childId: mockChildId,
      });

      const payload = validateMagicLinkToken(token);

      expect(payload).toHaveProperty("familyMemberId");
      expect(payload).toHaveProperty("permissionLevel");
      expect(payload).toHaveProperty("childId");
      expect(payload).toHaveProperty("createdAt");
      expect(payload).toHaveProperty("expiresAt");
      expect(payload).toHaveProperty("version");
    });

    it("should have version 1 for current implementation", () => {
      const token = generateMagicLinkToken({
        familyMemberId: mockFamilyMemberId,
        permissionLevel: mockPermission,
        childId: mockChildId,
      });

      const payload = validateMagicLinkToken(token);
      expect(payload?.version).toBe(1);
    });
  });
});
