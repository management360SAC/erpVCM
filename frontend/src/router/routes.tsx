// src/router/routes.tsx
import { createBrowserRouter } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";

import LoginPage from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import ConfigPage from "../pages/config/ConfigPage";
import Cronogramas from "../pages/operaciones/Cronogramas";
import UsersList from "../pages/security/UsersList";
import UserEdit from "../pages/security/UserEdit";
import UserNew from "../pages/security/UserNew";

import RolesList from "../pages/security/RolesList";
import RoleEdit from "../pages/security/RolesEdit";
import RolePermissionsEdit from "../pages/security/RolePermissionsEdit";

import ClientsList from "../pages/gestion/ClientsList";
import ClientForm from "../pages/gestion/ClientForm";

import ServicesList from "../pages/gestion/ServicesList";
import ServiceForm from "../pages/gestion/ServiceForm";
import ServiceTrackingList from "../pages/operaciones/ServiceTrackingList";
import NpsDashboard from "../pages/operaciones/NpsDashboard";
import NpsFormPage from "../public/NpsFormPage";
import NpsSurveyPage from "../pages/operaciones/NpsSurveyPage";
import LeadSourcesDashboard from "../pages/marketing/LeadSourcesDashboard";
import Pagos from "../pages/gestion/Pagos";
import NuevaCotizacion from "../pages/cotizaciones/NuevaCotizacion";
import HistorialCotizaciones from "../pages/cotizaciones/HistorialCotizaciones";
import AlertasRecordatoriosPage from "../pages/pipeline/AlertasRecordatoriosPage";
import ServiciosContratados from "../pages/gestion/ServiciosContratados";
import Proyectos from "../pages/gestion/Proyectos";
import EmbudoVentas from "../pages/pipeline/EmbudoVentas";
import Leads from "../pages/pipeline/Leads";
import Rentabilidad from "../pages/reportes/Rentabilidad";
import KPIsTableros from "../pages/reportes/KPIsTableros";
import Proyecciones from "../pages/reportes/Proyecciones";
import ReportesDashboardPage from "../pages/reportes/ReportesDashboardPage";
import ReportePagosPage     from "../pages/reportes/ReportePagosPage";
import ReporteClientesPage  from "../pages/reportes/ReporteClientesPage";
import ReportePipelinePage  from "../pages/reportes/ReportePipelinePage";
import ReporteAuditoriaPage from "../pages/reportes/ReporteAuditoriaPage";

import CampanasEmail from "../pages/marketing/CampanasEmail";
import IntegracionAds from "../pages/marketing/IntegracionAds";
import LandingsForm from "../pages/marketing/LandingsForm";
import NuevaCampanaEmail from "../pages/marketing/NuevaCampanaEmail";
import AsistenteIA from "../pages/ai/AsistenteIA";

function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h2>404 • Página no encontrada</h2>
      <a href="/dashboard">Ir al Dashboard</a>
    </div>
  );
}

export const router = createBrowserRouter([
  // ================================
  //  RUTAS PÚBLICAS
  // ================================
  { path: "/login", element: <LoginPage /> },

  // 🔓 Formulario NPS accesible desde el correo
  { path: "/nps", element: <NpsFormPage /> },
  { path: "/nps/:token", element: <NpsFormPage /> },

  // ================================
  //  RUTAS PRIVADAS (requieren login)
  // ================================
  {
    element: <PrivateRoute />,
    children: [
      { path: "/", element: <Dashboard />, errorElement: <NotFound /> },
      { path: "/dashboard", element: <Dashboard />, errorElement: <NotFound /> },

      // Seguridad > Usuarios
      { path: "/seguridad/usuarios", element: <UsersList />, errorElement: <NotFound /> },
      { path: "/seguridad/usuarios/nuevo", element: <UserNew />, errorElement: <NotFound /> },
      { path: "/seguridad/usuarios/:id", element: <UserEdit />, errorElement: <NotFound /> },

      // Seguridad > Roles
      { path: "/seguridad/roles", element: <RolesList />, errorElement: <NotFound /> },
      { path: "/seguridad/roles/nuevo", element: <RoleEdit />, errorElement: <NotFound /> },
      { path: "/seguridad/roles/:id", element: <RoleEdit />, errorElement: <NotFound /> },
      { path: "/seguridad/roles/:id/permisos", element: <RolePermissionsEdit />, errorElement: <NotFound /> },

      // Configuración
      { path: "/configuracion", element: <ConfigPage />, errorElement: <NotFound /> },

      // Gestión > Clientes
      { path: "/clientes", element: <ClientsList />, errorElement: <NotFound /> },
      { path: "/clientes/nuevo", element: <ClientForm />, errorElement: <NotFound /> },
      { path: "/clientes/:id", element: <ClientForm />, errorElement: <NotFound /> },

      // Gestión > Servicios (ruta oficial)
      { path: "/servicios", element: <ServicesList />, errorElement: <NotFound /> },
      { path: "/servicios/nuevo", element: <ServiceForm />, errorElement: <NotFound /> },
      { path: "/servicios/:id", element: <ServiceForm />, errorElement: <NotFound /> },
      { path: "/servicios/contratados", element: <ServiciosContratados />, errorElement: <NotFound /> },
      { path: "/servicios/pagos", element: <Pagos />, errorElement: <NotFound /> },
      { path: "/servicios/pagos/:id", element: <Pagos />, errorElement: <NotFound /> },
      { path: "/servicios/pagos/cliente/:clientId", element: <Pagos />, errorElement: <NotFound /> },
      { path: "/servicios/pagos/servicio/:serviceId", element: <Pagos />, errorElement: <NotFound /> },
      { path: "/servicios/pagos/cliente/:clientId/servicio/:serviceId", element: <Pagos />, errorElement: <NotFound /> },
      { path: "/servicios/pagos/servicio/:serviceId/cliente/:clientId", element: <Pagos />, errorElement: <NotFound /> },
      { path: "/servicios/contratados/cliente/:clientId", element: <ServiciosContratados />, errorElement: <NotFound /> },
      { path: "/servicios/contratados/servicio/:serviceId", element: <ServiciosContratados />, errorElement: <NotFound /> },
      { path: "/servicios/contratados/cliente/:clientId/servicio/:serviceId", element: <ServiciosContratados />, errorElement: <NotFound /> },
      { path: "/servicios/proyectos", element: <Proyectos />, errorElement: <NotFound /> },

      // ALIAS para compatibilidad con /catalogo/servicios/...
      { path: "/catalogo/servicios", element: <ServicesList />, errorElement: <NotFound /> },
      { path: "/catalogo/servicios/nuevo", element: <ServiceForm />, errorElement: <NotFound /> },
      { path: "/catalogo/servicios/:id", element: <ServiceForm />, errorElement: <NotFound /> },

      // OPS > Seguimiento de servicios
      { path: "/operaciones/seguimiento", element: <ServiceTrackingList />, errorElement: <NotFound /> },
      { path: "/operaciones/nps", element: <NpsDashboard />, errorElement: <NotFound /> },
      { path: "/operaciones/nps/formulario/:token", element: <NpsFormPage />, errorElement: <NotFound /> },

      { path: "/operaciones/cronogramas", element: <Cronogramas />, errorElement: <NotFound /> },
      { path: "/operaciones/npsSurvey", element: <NpsSurveyPage />, errorElement: <NotFound /> },

      { path: "/marketing/fuentes", element: <LeadSourcesDashboard />, errorElement: <NotFound /> },

      // COTIZACIONES
      { path: "/cotizaciones", element: <HistorialCotizaciones />, errorElement: <NotFound /> },
      { path: "/cotizaciones/nueva", element: <NuevaCotizacion />, errorElement: <NotFound /> },

      // Pipeline > Alertas y Recordatorios
      { path: "/pipeline/alertas-recordatorios", element: <AlertasRecordatoriosPage />, errorElement: <NotFound /> },
      { path: "/pipeline/alertas-recordatorios/:filter", element: <AlertasRecordatoriosPage />, errorElement: <NotFound /> },
      { path: "/pipeline/alertas-recordatorios/:filter/:subfilter", element: <AlertasRecordatoriosPage />, errorElement: <NotFound /> },
      { path: "/pipeline/alertas/recordatorios", element: <AlertasRecordatoriosPage />, errorElement: <NotFound /> },
      { path: "/pipeline/recordatorios/alertas", element: <AlertasRecordatoriosPage />, errorElement: <NotFound /> },
      { path: "/pipeline/recordatorios", element: <AlertasRecordatoriosPage />, errorElement: <NotFound /> },
      { path: "/pipeline/embudoVentas", element: <EmbudoVentas />, errorElement: <NotFound /> },
      { path: "/pipeline/alertas", element: <AlertasRecordatoriosPage />, errorElement: <NotFound /> },
      { path: "/pipeline/leads", element: <Leads />, errorElement: <NotFound /> },

      // REPORTES & ANALÍTICA — nuevas rutas
      { path: "/reportes/dashboard",  element: <ReportesDashboardPage />, errorElement: <NotFound /> },
      { path: "/reportes/pagos",      element: <ReportePagosPage />,      errorElement: <NotFound /> },
      { path: "/reportes/clientes",   element: <ReporteClientesPage />,   errorElement: <NotFound /> },
      { path: "/reportes/pipeline",   element: <ReportePipelinePage />,   errorElement: <NotFound /> },
      { path: "/reportes/auditoria",  element: <ReporteAuditoriaPage />,  errorElement: <NotFound /> },

      // REPORTES & ANALÍTICA — existentes
      { path: "/reportes/kpis", element: <KPIsTableros />, errorElement: <NotFound /> },
      { path: "/reportes/kpis/:filter", element: <KPIsTableros />, errorElement: <NotFound /> },
      { path: "/reportes/kpis/:filter/:subfilter", element: <KPIsTableros />, errorElement: <NotFound /> },

      { path: "/reportes/proyecciones", element: <Proyecciones />, errorElement: <NotFound /> },
      { path: "/reportes/proyecciones/:filter", element: <Proyecciones />, errorElement: <NotFound /> },
      { path: "/reportes/proyecciones/:filter/:subfilter", element: <Proyecciones />, errorElement: <NotFound /> },

      { path: "/reportes/rentabilidad", element: <Rentabilidad />, errorElement: <NotFound /> },
      { path: "/reportes/rentabilidad/:filter", element: <Rentabilidad />, errorElement: <NotFound /> },
      { path: "/reportes/rentabilidad/:filter/:subfilter", element: <Rentabilidad />, errorElement: <NotFound /> },

      // aliases para compatibilidad
      { path: "/rentabilidad", element: <Rentabilidad />, errorElement: <NotFound /> },
      { path: "/rentabilidad/:filter", element: <Rentabilidad />, errorElement: <NotFound /> },
      { path: "/rentabilidad/:filter/:subfilter", element: <Rentabilidad />, errorElement: <NotFound /> },

      { path: "/reportes/analitica/rentabilidad", element: <Rentabilidad />, errorElement: <NotFound /> },
      { path: "/reportes/analitica/kpis", element: <KPIsTableros />, errorElement: <NotFound /> },
      { path: "/reportes/analitica/proyecciones", element: <Proyecciones />, errorElement: <NotFound /> },

      // MARKETING & ESCALABILIDAD
      { path: "/marketing/campanas", element: <CampanasEmail />, errorElement: <NotFound /> },
      { path: "/marketing/campanas/:filter", element: <CampanasEmail />, errorElement: <NotFound /> },
      { path: "/marketing/campanas/:filter/:subfilter", element: <CampanasEmail />, errorElement: <NotFound /> },

      { path: "/marketing/integraciones", element: <IntegracionAds />, errorElement: <NotFound /> },
      { path: "/marketing/integraciones/:filter", element: <IntegracionAds />, errorElement: <NotFound /> },
      { path: "/marketing/integraciones/:filter/:subfilter", element: <IntegracionAds />, errorElement: <NotFound /> },

      { path: "/marketing/landings", element: <LandingsForm />, errorElement: <NotFound /> },
      { path: "/marketing/landings/:filter", element: <LandingsForm />, errorElement: <NotFound /> },
      { path: "/marketing/landings/:filter/:subfilter", element: <LandingsForm />, errorElement: <NotFound /> },

      { path: "/marketing/email", element: <CampanasEmail />, errorElement: <NotFound /> },
      { path: "/marketing/email/:filter", element: <CampanasEmail />, errorElement: <NotFound /> },
      { path: "/marketing/email/:filter/:subfilter", element: <CampanasEmail />, errorElement: <NotFound /> },

      { path: "/marketing/ads", element: <IntegracionAds />, errorElement: <NotFound /> },
      { path: "/marketing/ads/:filter", element: <IntegracionAds />, errorElement: <NotFound /> },
      { path: "/marketing/ads/:filter/:subfilter", element: <IntegracionAds />, errorElement: <NotFound /> },

      { path: "/marketing/landing", element: <LandingsForm />, errorElement: <NotFound /> },
      { path: "/marketing/landing/:filter", element: <LandingsForm />, errorElement: <NotFound /> },
      { path: "/marketing/landing/:filter/:subfilter", element: <LandingsForm />, errorElement: <NotFound /> },

      { path: "/marketing/email/nueva", element: <NuevaCampanaEmail />, errorElement: <NotFound /> },

      // ASISTENTE IA
      { path: "/asistente-ia", element: <AsistenteIA />, errorElement: <NotFound /> },
    ],
  },

  { path: "*", element: <NotFound /> },
]);
