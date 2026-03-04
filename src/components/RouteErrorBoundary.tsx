import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches lazy-import failures and render errors so the app
 * never shows a blank white screen.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#08120D",
            color: "#e2e8f0",
            fontFamily: "system-ui, sans-serif",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#94a3b8", maxWidth: 420, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
            A module failed to load. This is usually temporary — try refreshing.
          </p>
          {this.state.error && (
            <pre
              style={{
                background: "#0f1a14",
                padding: "1rem",
                borderRadius: 8,
                fontSize: "0.8rem",
                color: "#f87171",
                maxWidth: 600,
                overflow: "auto",
                marginBottom: "1.5rem",
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleRetry}
            style={{
              padding: "0.625rem 1.5rem",
              borderRadius: 8,
              border: "none",
              background: "#22c55e",
              color: "#000",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.95rem",
              marginBottom: "0.5rem",
            }}
          >
            Reload Page
          </button>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = window.location.href;
            }}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "transparent",
              color: "#94a3b8",
              fontWeight: 500,
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            Try again without full reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
