import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

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
            padding: "24px",
            background: "#f8fafc",
            color: "#0f172a",
            fontFamily: "system-ui, sans-serif"
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              width: "100%",
              background: "#ffffff",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
              border: "1px solid #e2e8f0"
            }}
          >
            <h2 style={{ color: "#ef4444", marginBottom: "12px", fontSize: "1.4rem" }}>
              Something went wrong loading this page
            </h2>
            <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "0.95rem", lineHeight: 1.5 }}>
              {this.state.error?.message || "An unexpected error occurred while rendering the application."}
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: "#0284c7",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Reload Page
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                style={{
                  background: "#ffffff",
                  color: "#0f172a",
                  border: "1px solid #cbd5e1",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Go to Home
              </button>
            </div>
            {this.state.error?.stack && (
              <details style={{ marginTop: "24px", fontSize: "0.8rem", color: "#94a3b8" }}>
                <summary style={{ cursor: "pointer", marginBottom: "8px" }}>View Technical Details</summary>
                <pre
                  style={{
                    background: "#f1f5f9",
                    padding: "12px",
                    borderRadius: "8px",
                    overflowX: "auto",
                    color: "#334155",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all"
                  }}
                >
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
