import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./studio.css";

// Start a new visit at the opening instead of restoring a previous scene.
window.history.scrollRestoration = "manual";
window.scrollTo({ top: 0, left: 0, behavior: "instant" });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
