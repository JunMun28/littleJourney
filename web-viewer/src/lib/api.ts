/**
 * API client for fetching shared data
 *
 * This uses mock data for development. In production, this would
 * call the backend API with the magic link token for authentication.
 */

import type { Entry, Child } from "./types";

// Mock data for development/testing
const MOCK_CHILD: Child = {
  id: "child-1",
  name: "Baby Emma",
  nickname: "Em",
  dateOfBirth: "2025-01-15",
};

const MOCK_ENTRIES: Entry[] = [
  {
    id: "entry-1",
    type: "photo",
    mediaUris: [
      "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800",
    ],
    caption: "First smile captured! Such a precious moment.",
    date: "2025-02-15",
    tags: ["milestone", "smile"],
    createdAt: "2025-02-15T10:30:00Z",
    updatedAt: "2025-02-15T10:30:00Z",
    createdByName: "Mum",
  },
  {
    id: "entry-2",
    type: "photo",
    mediaUris: [
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800",
      "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800",
    ],
    caption: "满月 celebration with grandparents!",
    date: "2025-02-14",
    tags: ["满月", "family"],
    createdAt: "2025-02-14T14:00:00Z",
    updatedAt: "2025-02-14T14:00:00Z",
    createdByName: "Dad",
  },
  {
    id: "entry-3",
    type: "text",
    caption:
      "Emma slept through the night for the first time! We are so happy and relieved. She's growing so fast.",
    date: "2025-02-10",
    createdAt: "2025-02-10T08:00:00Z",
    updatedAt: "2025-02-10T08:00:00Z",
    createdByName: "Mum",
  },
  {
    id: "entry-4",
    type: "video",
    mediaUris: ["https://example.com/video.mp4"],
    thumbnailUrl:
      "https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=800",
    caption: "Tummy time practice - getting stronger every day!",
    date: "2025-02-08",
    tags: ["development"],
    createdAt: "2025-02-08T16:30:00Z",
    updatedAt: "2025-02-08T16:30:00Z",
    createdByName: "Dad",
  },
];

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://api.littlejourney.app";
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

/**
 * Fetch child profile for a magic link session
 */
export async function fetchChild(
  token: string,
  childId: string,
): Promise<Child> {
  if (USE_MOCK) {
    await delay(300);
    return MOCK_CHILD;
  }

  const response = await fetch(`${API_BASE}/v1/shared/child/${childId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch child data");
  }

  return response.json();
}

/**
 * Fetch entries for a magic link session
 */
export async function fetchEntries(
  token: string,
  childId: string,
): Promise<Entry[]> {
  if (USE_MOCK) {
    await delay(500);
    return MOCK_ENTRIES;
  }

  const response = await fetch(`${API_BASE}/v1/shared/entries/${childId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch entries");
  }

  return response.json();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
