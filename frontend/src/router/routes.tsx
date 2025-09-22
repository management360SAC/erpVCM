// src/router/routes.tsx
import { createBrowserRouter } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";

// Páginas
import LoginPage from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import UsersList from "../pages/security/UsersList";
import ConfigPage from "../pages/config/ConfigPage";

// (Opcional) página de error amigable
function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h2>404 • Página no encontrada</h2>
      <a href="/dashboard">Ir al Dashboard</a>
    </div>
  );
}

export const router = createBrowserRouter([
  // Públicas
  { path: "/login", element: <LoginPage /> },

  // Protegidas bajo PrivateRoute
  {
    element: <PrivateRoute />, // debe renderizar <Outlet />
    children: [
      { path: "/", element: <Dashboard />, errorElement: <NotFound /> },
      { path: "/dashboard", element: <Dashboard />, errorElement: <NotFound /> },

      // Seguridad
      { path: "/seguridad/usuarios", element: <UsersList />, errorElement: <NotFound /> },

      // Configuración
      { path: "/configuracion", element: <ConfigPage />, errorElement: <NotFound /> },
    ],
  },

  // Catch-all
  { path: "*", element: <NotFound /> },
]);
