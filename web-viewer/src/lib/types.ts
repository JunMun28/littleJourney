/**
 * Shared types mirrored from the main Expo app
 * These should stay in sync with the mobile app's type definitions
 */

export type EntryType = "photo" | "video" | "text";

export interface Entry {
  id: string;
  type: EntryType;
  mediaUris?: string[];
  thumbnailUrl?: string;
  caption?: string;
  date: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
}

export interface Child {
  id: string;
  name: string;
  nickname?: string;
  dateOfBirth: string;
  photoUri?: string;
}
