import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Little Journey</h1>
        <p style={styles.subtitle}>Family Memory Sharing</p>
        <p style={styles.message}>
          This viewer is for family members with a magic link.
          <br />
          Please use the link sent to your email to view memories.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: "1rem",
  },
  content: {
    textAlign: "center" as const,
    padding: "2rem",
    maxWidth: "500px",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 700,
    color: "#1a1a2e",
    margin: 0,
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "1.25rem",
    color: "#6c757d",
    margin: 0,
    marginBottom: "2rem",
  },
  message: {
    fontSize: "1rem",
    color: "#495057",
    lineHeight: 1.6,
  },
};
