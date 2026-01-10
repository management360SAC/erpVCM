// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router/routes"; // 👈 único router
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
// Log de errores JS “clásicos”
window.addEventListener('error', (e) => {
  console.error('🔥 window error:', e.error || e.message, e);
});

// Promesas rechazadas sin catch (fetch, async/await, etc.)
window.addEventListener('unhandledrejection', (e) => {
  console.error('🔥 unhandledrejection:', e.reason || e);
});
