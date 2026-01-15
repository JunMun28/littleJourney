import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  validateMagicLinkToken,
  isMagicLinkExpired,
  type MagicLinkPayload,
} from "../../lib/magic-link";
import { fetchChild, fetchEntries } from "../../lib/api";
import type { Child, Entry } from "../../lib/types";

export const Route = createFileRoute("/view/$token")({
  component: ViewPage,
});

type ViewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "expired" }
  | {
      status: "ready";
      payload: MagicLinkPayload;
      child: Child;
      entries: Entry[];
    };

function ViewPage() {
  const { token } = Route.useParams();
  const [state, setState] = useState<ViewState>({ status: "loading" });

  useEffect(() => {
    async function loadData() {
      // Validate token
      const payload = validateMagicLinkToken(token);
      if (!payload) {
        setState({ status: "error", message: "Invalid link" });
        return;
      }

      // Check expiry (SHARE-004)
      if (isMagicLinkExpired(payload)) {
        setState({ status: "expired" });
        return;
      }

      try {
        // Fetch child and entries in parallel
        const [child, entries] = await Promise.all([
          fetchChild(token, payload.childId),
          fetchEntries(token, payload.childId),
        ]);

        setState({ status: "ready", payload, child, entries });
      } catch {
        setState({ status: "error", message: "Failed to load data" });
      }
    }

    loadData();
  }, [token]);

  if (state.status === "loading") {
    return <LoadingView />;
  }

  if (state.status === "error") {
    return <ErrorView message={state.message} />;
  }

  if (state.status === "expired") {
    return <ExpiredView />;
  }

  return <FeedView child={state.child} entries={state.entries} />;
}

function LoadingView() {
  return (
    <div style={styles.container}>
      <div style={styles.loadingSpinner} />
      <p style={styles.loadingText}>Loading memories...</p>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div style={styles.container}>
      <div style={styles.errorIcon}>!</div>
      <h1 style={styles.errorTitle}>Oops!</h1>
      <p style={styles.errorMessage}>{message}</p>
      <p style={styles.errorHint}>
        Please check the link you received or ask the parent to resend it.
      </p>
    </div>
  );
}

function ExpiredView() {
  return (
    <div style={styles.container}>
      <div style={styles.expiredIcon}>⏰</div>
      <h1 style={styles.expiredTitle}>Link Expired</h1>
      <p style={styles.expiredMessage}>
        This link has expired due to inactivity.
        <br />
        Please ask the parent to resend the magic link.
      </p>
    </div>
  );
}

interface FeedViewProps {
  child: Child;
  entries: Entry[];
}

function FeedView({ child, entries }: FeedViewProps) {
  const displayName = child.nickname || child.name;

  return (
    <div style={styles.feedContainer}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>{displayName}'s Journey</h1>
        <p style={styles.headerSubtitle}>Little Journey</p>
      </header>

      {/* Feed */}
      <main style={styles.feed}>
        {entries.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No memories yet. Check back soon!</p>
          </div>
        ) : (
          entries.map((entry) => <EntryCard key={entry.id} entry={entry} />)
        )}
      </main>
    </div>
  );
}

interface EntryCardProps {
  entry: Entry;
}

function EntryCard({ entry }: EntryCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasMultipleImages = entry.mediaUris && entry.mediaUris.length > 1;

  const formattedDate = new Date(entry.date).toLocaleDateString("en-SG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article style={styles.card}>
      {/* Media */}
      {entry.type === "photo" &&
        entry.mediaUris &&
        entry.mediaUris.length > 0 && (
          <div style={styles.mediaContainer}>
            <img
              src={entry.mediaUris[currentImageIndex]}
              alt={entry.caption || "Photo"}
              style={styles.media}
            />
            {hasMultipleImages && (
              <div style={styles.carouselControls}>
                <button
                  onClick={() =>
                    setCurrentImageIndex((i) =>
                      i > 0 ? i - 1 : entry.mediaUris!.length - 1,
                    )
                  }
                  style={styles.carouselButton}
                  aria-label="Previous photo"
                >
                  ‹
                </button>
                <span style={styles.carouselIndicator}>
                  {currentImageIndex + 1} / {entry.mediaUris.length}
                </span>
                <button
                  onClick={() =>
                    setCurrentImageIndex((i) =>
                      i < entry.mediaUris!.length - 1 ? i + 1 : 0,
                    )
                  }
                  style={styles.carouselButton}
                  aria-label="Next photo"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}

      {entry.type === "video" && (
        <div style={styles.mediaContainer}>
          {entry.thumbnailUrl ? (
            <div style={styles.videoThumbnail}>
              <img
                src={entry.thumbnailUrl}
                alt="Video thumbnail"
                style={styles.media}
              />
              <div style={styles.playIcon}>▶</div>
            </div>
          ) : (
            <div style={styles.videoPlaceholder}>🎬 Video</div>
          )}
        </div>
      )}

      {/* Content */}
      <div style={styles.cardContent}>
        {entry.caption && <p style={styles.caption}>{entry.caption}</p>}

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div style={styles.tags}>
            {entry.tags.map((tag) => (
              <span key={tag} style={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div style={styles.meta}>
          <span style={styles.date}>{formattedDate}</span>
          {entry.createdByName && (
            <span style={styles.author}>Posted by {entry.createdByName}</span>
          )}
        </div>
      </div>
    </article>
  );
}

const styles: Record<string, React.CSSProperties> = {
  // Layout
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f7fa",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: "2rem",
    textAlign: "center",
  },
  feedContainer: {
    minHeight: "100vh",
    background: "#f5f7fa",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  // Loading
  loadingSpinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #e9ecef",
    borderTopColor: "#0a7ea4",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "1rem",
  },
  loadingText: {
    color: "#6c757d",
    fontSize: "1rem",
  },

  // Error
  errorIcon: {
    width: "64px",
    height: "64px",
    background: "#dc3545",
    color: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "1rem",
  },
  errorTitle: {
    fontSize: "1.5rem",
    color: "#1a1a2e",
    margin: "0 0 0.5rem 0",
  },
  errorMessage: {
    color: "#495057",
    margin: "0 0 1rem 0",
  },
  errorHint: {
    color: "#6c757d",
    fontSize: "0.875rem",
  },

  // Expired
  expiredIcon: {
    fontSize: "4rem",
    marginBottom: "1rem",
  },
  expiredTitle: {
    fontSize: "1.5rem",
    color: "#1a1a2e",
    margin: "0 0 1rem 0",
  },
  expiredMessage: {
    color: "#495057",
    lineHeight: 1.6,
  },

  // Header
  header: {
    background: "#0a7ea4",
    color: "white",
    padding: "1.5rem 1rem",
    textAlign: "center",
    position: "sticky" as const,
    top: 0,
    zIndex: 100,
  },
  headerTitle: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 600,
  },
  headerSubtitle: {
    margin: "0.25rem 0 0 0",
    fontSize: "0.875rem",
    opacity: 0.8,
  },

  // Feed
  feed: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "1rem",
  },
  emptyState: {
    padding: "3rem 1rem",
    textAlign: "center",
    color: "#6c757d",
  },

  // Card
  card: {
    background: "white",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "1rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  mediaContainer: {
    position: "relative" as const,
    width: "100%",
    aspectRatio: "1",
    background: "#f0f0f0",
  },
  media: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  carouselControls: {
    position: "absolute" as const,
    bottom: "1rem",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(0,0,0,0.6)",
    borderRadius: "20px",
    padding: "0.25rem 0.75rem",
  },
  carouselButton: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: "0 0.25rem",
  },
  carouselIndicator: {
    color: "white",
    fontSize: "0.875rem",
  },
  videoThumbnail: {
    position: "relative" as const,
    width: "100%",
    height: "100%",
  },
  playIcon: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "60px",
    height: "60px",
    background: "rgba(0,0,0,0.6)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "1.5rem",
  },
  videoPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#e9ecef",
    fontSize: "1.5rem",
  },
  cardContent: {
    padding: "1rem",
  },
  caption: {
    margin: "0 0 0.75rem 0",
    fontSize: "1rem",
    lineHeight: 1.5,
    color: "#1a1a2e",
  },
  tags: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0.5rem",
    marginBottom: "0.75rem",
  },
  tag: {
    background: "#e9ecef",
    color: "#495057",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
  },
  meta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.875rem",
    color: "#6c757d",
  },
  date: {},
  author: {},
};
