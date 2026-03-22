import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

const MAX_AUTO_RETRY = 1;

function isChunkError(error: Error | null): boolean {
  if (!error) return false;
  const msg = error.message || "";
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("Loading chunk") ||
    msg.includes("Loading CSS chunk")
  );
}

/**
 * Catches lazy-import failures and render errors.
 * For chunk-load errors it auto-retries once before showing UI.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, retryCount: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidUpdate(_: Props, prevState: State) {
    // Auto-retry chunk errors once without user interaction
    if (
      this.state.hasError &&
      isChunkError(this.state.error) &&
      this.state.retryCount < MAX_AUTO_RETRY &&
      prevState.retryCount === this.state.retryCount
    ) {
      setTimeout(() => {
        this.setState((s) => ({ hasError: false, error: null, retryCount: s.retryCount + 1 }));
      }, 1000);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleSoftRetry = () => {
    this.setState({ hasError: false, error: null, retryCount: 0 });
  };

  render() {
    if (this.state.hasError) {
      const isChunk = isChunkError(this.state.error);

      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",

            color: "#e2e8f0",
            fontFamily: "system-ui, sans-serif",
            padding: "2rem",
            textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
            {isChunk ? "New version available" : "Something went wrong"}
          </h1>
          <p style={{ color: "#94a3b8", maxWidth: 420, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
            {isChunk
              ? "A newer version of the app was deployed. Please reload to continue."
              : "An unexpected error occurred. Try refreshing the page."}
          </p>
          {this.state.error && !isChunk && (
            <pre
              style={{
                background: "#0f1a14",
                padding: "1rem",
                borderRadius: 8,
                fontSize: "0.8rem",
                color: "#f87171",
                maxWidth: 600,
                overflow: "auto",
                marginBottom: "1.5rem" }}>
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            style={{
              padding: "0.625rem 1.5rem",
              borderRadius: 8,
              border: "none",
              background: "#22c55e",
              color: "#000",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.95rem",
              marginBottom: "0.5rem" }}>
            Reload Page
          </button>
          {!isChunk && (
            <button
              onClick={this.handleSoftRetry}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: 8,
                border: "1px solid #334155",
                background: "transparent",
                color: "#94a3b8",
                fontWeight: 500,
                cursor: "pointer",
                fontSize: "0.85rem" }}>
              Try again without reload
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
