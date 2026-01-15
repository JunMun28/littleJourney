/**
 * Magic Link Token Validation
 * Mirrors the logic from the main app's services/magic-link.ts
 *
 * PRD References:
 * - SHARE-002: Magic link access (no account required)
 * - SHARE-003: Multi-device magic link support
 * - SHARE-004: Magic link expiry (90 days inactivity)
 */

export type PermissionLevel = "view_only" | "view_interact";

export interface MagicLinkPayload {
  familyMemberId: string;
  permissionLevel: PermissionLevel;
  childId: string;
  createdAt: number;
  expiresAt: number;
  version: number;
}

/**
 * Validate and decode a magic link token
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
 * @param payload - Validated magic link payload
 * @returns true if expired, false if still valid
 */
export function isMagicLinkExpired(payload: MagicLinkPayload): boolean {
  return Date.now() > payload.expiresAt;
}
