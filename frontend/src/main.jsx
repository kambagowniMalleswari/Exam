// Import React
import { StrictMode } from "react";

// Import React DOM
import { createRoot } from "react-dom/client";

// Import React Router
import { BrowserRouter } from "react-router-dom";

// Import authentication provider
import { AuthProvider } from "./context/AuthContext.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";

// Import main application
import App from "./App.jsx";

// Import global CSS
import "./index.css";

// Render application
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);