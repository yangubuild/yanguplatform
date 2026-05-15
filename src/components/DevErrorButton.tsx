/**
 * Dev-only floating button to trigger a test error for Sentry.
 * Only renders when import.meta.env.DEV is true.
 */
export function DevErrorButton() {
  if (!import.meta.env.DEV) return null;
  return (
    <button
      onClick={() => {
        throw new Error("This is your first error!");
      }}
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 99999,
        padding: "10px 14px",
        background: "#b3261e",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
      }}
      aria-label="Trigger test error"
    >
      Break the world
    </button>
  );
}
