/**
 * Magic Link Service
 * Handles generation and validation of magic link tokens for family sharing
 *
 * PRD References:
 * - SHARE-002: Magic link access (no account required)
 * - SHARE-003: Multi-device magic link support
 * - SHARE-004: Magic link expiry (90 days inactivity)
 */

import type { PermissionLevel } from "@/contexts/family-context";

// Configuration for magic links
export const MAGIC_LINK_CONFIG = {
  // PRD SHARE-004: Links expire after 90 days of inactivity
  expiryDays: 90,
  // Base URL for the web viewer (TanStack Start app)
  baseUrl:
    process.env.EXPO_PUBLIC_WEB_VIEWER_URL || "https://view.littlejourney.app",
  // Current payload version for future compatibility
  version: 1,
};

/**
 * Payload structure embedded in magic link tokens
 */
export interface MagicLinkPayload {
  /** Family member ID this link belongs to */
  familyMemberId: string;
  /** Permission level: view_only or view_interact */
  permissionLevel: PermissionLevel;
  /** Child ID that family member has access to */
  childId: string;
  /** Timestamp when token was created */
  createdAt: number;
  /** Timestamp when token expires (90 days from creation or last refresh) */
  expiresAt: number;
  /** Payload version for future compatibility */
  version: number;
}

/**
 * Parameters for generating a new magic link token
 */
interface GenerateMagicLinkParams {
  familyMemberId: string;
  permissionLevel: PermissionLevel;
  childId: string;
}

/**
 * Generate a magic link token for a family member
 *
 * The token encodes:
 * - Family member identity
 * - Permission level (view_only or view_interact)
 * - Child ID for access scoping
 * - Creation and expiry timestamps
 *
 * @param params - Family member details
 * @returns Base64-encoded token string
 */
export function generateMagicLinkToken(
  params: GenerateMagicLinkParams,
): string {
  const now = Date.now();
  const expiryMs = MAGIC_LINK_CONFIG.expiryDays * 24 * 60 * 60 * 1000;

  const payload: MagicLinkPayload = {
    familyMemberId: params.familyMemberId,
    permissionLevel: params.permissionLevel,
    childId: params.childId,
    createdAt: now,
    expiresAt: now + expiryMs,
    version: MAGIC_LINK_CONFIG.version,
  };

  // Add some randomness to make tokens unique even with same params
  const tokenData = {
    ...payload,
    nonce: Math.random().toString(36).slice(2, 10),
  };

  return btoa(JSON.stringify(tokenData));
}

/**
 * Validate and decode a magic link token
 *
 * Note: This only validates the token structure, not expiry.
 * Use isMagicLinkExpired() to check if the token has expired.
 *
 * @param token - Base64-encoded token string
 * @returns Decoded payload or null if invalid
 */
export function validateMagicLinkToken(token: string): MagicLinkPayload | null {
  if (!token || token.length === 0) {
    return null;
  }

  try {
    const decoded = atob(token);
    const data = JSON.parse(decoded);

    // Validate required fields exist
    if (
      typeof data.familyMemberId !== "string" ||
      typeof data.permissionLevel !== "string" ||
      typeof data.childId !== "string" ||
      typeof data.createdAt !== "number" ||
      typeof data.expiresAt !== "number" ||
      typeof data.version !== "number"
    ) {
      return null;
    }

    // Validate permission level
    if (
      data.permissionLevel !== "view_only" &&
      data.permissionLevel !== "view_interact"
    ) {
      return null;
    }

    return {
      familyMemberId: data.familyMemberId,
      permissionLevel: data.permissionLevel,
      childId: data.childId,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      version: data.version,
    };
  } catch {
    return null;
  }
}

/**
 * Check if a magic link token has expired
 *
 * PRD SHARE-004: Links expire after inactivity period
 *
 * @param token - Magic link token to check
 * @returns true if expired or invalid, false if still valid
 */
export function isMagicLinkExpired(token: string): boolean {
  const payload = validateMagicLinkToken(token);

  if (!payload) {
    return true;
  }

  return Date.now() > payload.expiresAt;
}

/**
 * Generate the full magic link URL for a token
 *
 * PRD SHARE-002: Family members access via magic link URL
 *
 * @param token - Magic link token
 * @returns Full URL for the web viewer
 */
export function getMagicLinkUrl(token: string): string {
  return `${MAGIC_LINK_CONFIG.baseUrl}/view/${token}`;
}

/**
 * Refresh a magic link token's expiry
 *
 * PRD SHARE-003: Multi-device support - refreshing extends the session
 * PRD SHARE-004: 90 days from last access, not from creation
 *
 * This is called when a family member accesses the link to extend
 * the expiry period. The same link works on multiple devices.
 *
 * @param token - Existing magic link token
 * @returns New token with extended expiry, or null if invalid
 */
export function refreshMagicLinkExpiry(token: string): string | null {
  const payload = validateMagicLinkToken(token);

  if (!payload) {
    return null;
  }

  // Generate new token with same identity but refreshed expiry
  return generateMagicLinkToken({
    familyMemberId: payload.familyMemberId,
    permissionLevel: payload.permissionLevel,
    childId: payload.childId,
  });
}
