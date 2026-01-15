/**
 * Cloudflare Stream Video Service
 *
 * Handles video upload to Cloudflare Stream and retrieval of:
 * - Stream URLs for HLS playback
 * - Auto-generated thumbnails
 *
 * Uses direct upload with presigned URLs for secure client-side uploads.
 * Supports both mock mode (for development) and real Cloudflare integration.
 */

import * as FileSystem from "expo-file-system";

// Configuration
const CLOUDFLARE_CONFIG = {
  accountId: process.env.EXPO_PUBLIC_CLOUDFLARE_ACCOUNT_ID || "",
  apiToken: process.env.EXPO_PUBLIC_CLOUDFLARE_STREAM_TOKEN || "",
  // In production, presigned URLs should come from backend
  useMock: process.env.EXPO_PUBLIC_USE_MOCK_API !== "false",
};

// Types
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface VideoMetadata {
  uid: string;
  thumbnail: string;
  preview: string;
  playback: {
    hls: string;
    dash: string;
  };
  duration: number;
  size: number;
  status: {
    state:
      | "pendingupload"
      | "downloading"
      | "queued"
      | "inprogress"
      | "ready"
      | "error";
    pctComplete?: number;
    errorReasonCode?: string;
    errorReasonText?: string;
  };
}

export interface DirectUploadUrl {
  uploadUrl: string;
  uid: string;
}

export interface CloudflareStreamResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Mock data storage
const mockVideos = new Map<string, VideoMetadata>();
let mockVideoIdCounter = 1;

/**
 * Request a direct upload URL from the backend
 * In production, this would call your backend which has the API token
 */
export async function getDirectUploadUrl(
  maxDurationSeconds: number,
  metadata?: Record<string, string>,
): Promise<CloudflareStreamResult<DirectUploadUrl>> {
  if (CLOUDFLARE_CONFIG.useMock) {
    // Mock: generate fake upload URL
    const uid = `mock-video-${mockVideoIdCounter++}`;
    return {
      success: true,
      data: {
        uploadUrl: `https://mock-upload.cloudflarestream.com/${uid}`,
        uid,
      },
    };
  }

  try {
    // In production, call your backend to get presigned URL
    // Backend creates: POST https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/direct_upload
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL || "https://api.littlejourney.sg"}/api/video/upload-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maxDurationSeconds,
          meta: metadata,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        uid: result.uid,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get upload URL",
    };
  }
}

/**
 * Upload a video file to Cloudflare Stream
 * Uses TUS protocol for resumable uploads
 */
export async function uploadVideo(
  localUri: string,
  uploadUrl: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<CloudflareStreamResult<{ uid: string }>> {
  if (CLOUDFLARE_CONFIG.useMock) {
    // Mock: simulate upload progress
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    const totalSize =
      fileInfo.exists && "size" in fileInfo ? fileInfo.size : 1000000;

    // Simulate upload progress over 2 seconds
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      onProgress?.({
        loaded: (totalSize * i) / steps,
        total: totalSize,
        percentage: (i / steps) * 100,
      });
    }

    // Extract uid from mock URL
    const uid = uploadUrl.split("/").pop() || `mock-video-${Date.now()}`;

    // Store mock video metadata
    mockVideos.set(uid, {
      uid,
      thumbnail: `https://mock-cdn.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg`,
      preview: `https://mock-cdn.cloudflarestream.com/${uid}/preview.gif`,
      playback: {
        hls: `https://mock-cdn.cloudflarestream.com/${uid}/manifest/video.m3u8`,
        dash: `https://mock-cdn.cloudflarestream.com/${uid}/manifest/video.mpd`,
      },
      duration: 60,
      size: totalSize,
      status: {
        state: "ready",
        pctComplete: 100,
      },
    });

    return {
      success: true,
      data: { uid },
    };
  }

  try {
    // Real upload using expo-file-system uploadAsync
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (!fileInfo.exists) {
      throw new Error("Video file not found");
    }

    const totalSize = "size" in fileInfo ? fileInfo.size : 0;

    // Report initial progress
    onProgress?.({ loaded: 0, total: totalSize, percentage: 0 });

    // Use uploadAsync for file upload to Cloudflare Stream
    // Cloudflare Stream accepts direct PUT to the upload URL
    const result = await FileSystem.uploadAsync(uploadUrl, localUri, {
      httpMethod: "PUT",
      headers: {
        "Tus-Resumable": "1.0.0",
        "Content-Type": "video/mp4",
      },
    });

    // Report completion
    onProgress?.({ loaded: totalSize, total: totalSize, percentage: 100 });

    if (result.status !== 200 && result.status !== 201) {
      throw new Error(`Upload failed with status ${result.status}`);
    }

    // Extract uid from response or URL
    const uid = uploadUrl.split("/").pop() || "";

    return {
      success: true,
      data: { uid },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Get video metadata including playback URLs and thumbnail
 */
export async function getVideoMetadata(
  videoId: string,
): Promise<CloudflareStreamResult<VideoMetadata>> {
  if (CLOUDFLARE_CONFIG.useMock) {
    // Return mock data
    const mockData = mockVideos.get(videoId);
    if (mockData) {
      return { success: true, data: mockData };
    }

    // Generate mock metadata for any videoId
    return {
      success: true,
      data: {
        uid: videoId,
        thumbnail: `https://mock-cdn.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`,
        preview: `https://mock-cdn.cloudflarestream.com/${videoId}/preview.gif`,
        playback: {
          hls: `https://mock-cdn.cloudflarestream.com/${videoId}/manifest/video.m3u8`,
          dash: `https://mock-cdn.cloudflarestream.com/${videoId}/manifest/video.mpd`,
        },
        duration: 60,
        size: 10000000,
        status: {
          state: "ready",
          pctComplete: 100,
        },
      },
    };
  }

  try {
    // Call backend to get video metadata
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL || "https://api.littlejourney.sg"}/api/video/${videoId}`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get video metadata: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get video metadata",
    };
  }
}

/**
 * Get video thumbnail URL
 * Cloudflare Stream auto-generates thumbnails at various timestamps
 */
export function getVideoThumbnailUrl(
  videoId: string,
  timestamp?: number,
): string {
  if (CLOUDFLARE_CONFIG.useMock) {
    return `https://mock-cdn.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`;
  }

  // Cloudflare Stream thumbnail URL format
  // You can specify time=Xs for thumbnail at specific timestamp
  const baseUrl = `https://customer-${CLOUDFLARE_CONFIG.accountId}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`;
  return timestamp !== undefined ? `${baseUrl}?time=${timestamp}s` : baseUrl;
}

/**
 * Get video HLS playback URL
 */
export function getVideoPlaybackUrl(videoId: string): string {
  if (CLOUDFLARE_CONFIG.useMock) {
    return `https://mock-cdn.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
  }

  return `https://customer-${CLOUDFLARE_CONFIG.accountId}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
}

/**
 * Delete a video from Cloudflare Stream
 */
export async function deleteVideo(
  videoId: string,
): Promise<CloudflareStreamResult<void>> {
  if (CLOUDFLARE_CONFIG.useMock) {
    mockVideos.delete(videoId);
    return { success: true };
  }

  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL || "https://api.littlejourney.sg"}/api/video/${videoId}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to delete video: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete video",
    };
  }
}

/**
 * Helper to check if a URI is a Cloudflare Stream URL
 */
export function isCloudflareStreamUrl(uri: string): boolean {
  return (
    uri.includes("cloudflarestream.com") ||
    uri.includes("mock-cdn.cloudflarestream.com")
  );
}

/**
 * Extract video ID from Cloudflare Stream URL
 */
export function extractVideoIdFromUrl(url: string): string | null {
  // Pattern: https://customer-{account}.cloudflarestream.com/{videoId}/...
  const match = url.match(/cloudflarestream\.com\/([^/]+)/);
  return match ? match[1] : null;
}

// Test utilities
export function clearMockVideos(): void {
  mockVideos.clear();
  mockVideoIdCounter = 1;
}
