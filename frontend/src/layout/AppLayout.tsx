// src/layout/AppLayout.tsx
import type { ReactNode, JSX } from "react";
import { useMemo, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Collapse,
  Container,
  Divider,
  Drawer as MuiDrawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  Select,
  Toolbar,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

// 🔔 Notificador global de alertas (nuevo)
import GlobalAlertNotifier from "../components/GlobalAlertNotifier";

// ====== Íconos ======
import MenuIcon from "@mui/icons-material/Menu";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";

// Gestión
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import HomeRepairServiceOutlinedIcon from "@mui/icons-material/HomeRepairServiceOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";

// Pipeline
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";

// Cotizaciones
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";

// Operaciones/Postventa
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import ChecklistRtlOutlinedIcon from "@mui/icons-material/ChecklistRtlOutlined";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import SentimentSatisfiedAltOutlinedIcon from "@mui/icons-material/SentimentSatisfiedAltOutlined";

// Reportes
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";

// Marketing
import MarkEmailUnreadOutlinedIcon from "@mui/icons-material/MarkEmailUnreadOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import WebAssetOutlinedIcon from "@mui/icons-material/WebAssetOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";

// Integraciones/Usuarios
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import PeopleIcon from "@mui/icons-material/People";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

// Menú de usuario (avatar superior derecha)
import UserMenu from "../components/UserMenu";

// ==== Layout tokens ====
const drawerWidthOpen = 280;
const drawerWidthClosed = 72;

// Colores basados en el logo VCM
const VCM_ORANGE = "#f57c00";
const VCM_ORANGE_SOFT = "#fff7ed";
const VCM_BG_SOFT = "#fff7ed";

const openedMixin = (theme: any) => ({
  width: drawerWidthOpen,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: any) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: drawerWidthClosed,
});

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: open ? drawerWidthOpen : drawerWidthClosed,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  "& .MuiDrawer-paper": {
    borderRight: "1px solid #eef2f7",
    backgroundColor: VCM_BG_SOFT,
    ...(open ? openedMixin(theme) : closedMixin(theme)),
  },
}));

const DrawerSpacer = styled("div")(({ theme }) => ({ ...theme.mixins.toolbar }));

type NavItem = { text: string; path: string; icon: JSX.Element };
type NavGroup = { key: string; title: string; icon: JSX.Element; items: NavItem[] };

function Group({
  title,
  icon,
  items,
  isOpen,
  onToggle,
  mini,
}: {
  title: string;
  icon: JSX.Element;
  items: NavItem[];
  isOpen: boolean;
  onToggle: () => void;
  mini: boolean;
}) {
  return (
    <>
      {/* Cabecera del grupo */}
      <ListItem disablePadding sx={{ display: "block" }}>
        <ListItemButton
          onClick={onToggle}
          sx={{
            px: 1.5,
            minHeight: 44,
            justifyContent: mini ? "center" : "flex-start",
            borderRadius: 2,
            transition: "0.2s ease",
            cursor: "pointer",
            "&:hover": {
              bgcolor: VCM_ORANGE_SOFT,
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 36,
              mr: mini ? 0 : 1,
              color: "#6b7280",
            }}
          >
            {icon}
          </ListItemIcon>
          {!mini && (
            <ListItemText
              primary={title}
              primaryTypographyProps={{ fontWeight: 700 }}
            />
          )}
        </ListItemButton>
      </ListItem>

      {/* Ítems del grupo */}
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <List disablePadding dense>
          {items.map((it) => (
            <ListItem key={it.text} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                component={NavLink}
                to={it.path}
                sx={{
                  pl: mini ? 1 : 4.5,
                  pr: 1.5,
                  minHeight: 40,
                  justifyContent: mini ? "center" : "flex-start",
                  borderRadius: 2,
                  transition: "0.2s ease",
                  cursor: "pointer",
                  color: "#374151",
                  "& .MuiListItemIcon-root": {
                    color: "#6b7280",
                  },
                  "&:hover": {
                    bgcolor: VCM_ORANGE_SOFT,
                  },
                  "&.active": {
                    bgcolor: VCM_ORANGE,
                    color: "#ffffff",
                    "& .MuiListItemIcon-root": {
                      color: "#ffffff",
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, mr: mini ? 0 : 1 }}>
                  {it.icon}
                </ListItemIcon>
                {!mini && <ListItemText primary={it.text} />}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>
    </>
  );
}

type Props = {
  children: ReactNode;
  title?: string;
  showFilters?: boolean;
};

export default function AppLayout({ children, title, showFilters }: Props) {
  const navigate = useNavigate();
  const username = useMemo(
    () => (localStorage.getItem("username") ?? "usuario").toUpperCase(),
    []
  );
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);

  const [sideOpen, setSideOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mini = !sideOpen;

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login", { replace: true });
  };

  const grupos: NavGroup[] = [
    {
      key: "inicio",
      title: "Inicio",
      icon: <SpaceDashboardOutlinedIcon />,
      items: [
        {
          text: "Dashboard",
          icon: <SpaceDashboardOutlinedIcon />,
          path: "/dashboard",
        },
      ],
    },
    {
      key: "gestion",
      title: "Gestión",
      icon: <WorkOutlineIcon />,
      items: [
        { text: "Clientes", icon: <PeopleAltOutlinedIcon />, path: "/clientes" },
        {
          text: "Servicios",
          icon: <HomeRepairServiceOutlinedIcon />,
          path: "/servicios",
        },
        {
          text: "Servicios Contratados",
          icon: <HomeRepairServiceOutlinedIcon />,
          path: "/servicios/contratados",
        },
        {
          text: "Pagos",
          icon: <LocalShippingOutlinedIcon />,
          path: "/servicios/pagos",
        },
      ],
    },
    {
      key: "pipeline",
      title: "Pipeline Comercial",
      icon: <TimelineOutlinedIcon />,
      items: [
        {
          text: "Embudo de Ventas",
          icon: <TimelineOutlinedIcon />,
          path: "/pipeline/embudoVentas",
        },
        {
          text: "Leads",
          icon: <TrendingUpOutlinedIcon />,
          path: "/pipeline/leads",
        },
        {
          text: "Alertas y Recordatorios",
          icon: <NotificationsNoneOutlinedIcon />,
          path: "/pipeline/alertas",
        },
      ],
    },
    {
      key: "cotizaciones",
      title: "Cotizaciones",
      icon: <RequestQuoteOutlinedIcon />,
      items: [
        {
          text: "Nueva Cotización",
          icon: <NoteAddOutlinedIcon />,
          path: "/cotizaciones/nueva",
        },
        {
          text: "Historial",
          icon: <RequestQuoteOutlinedIcon />,
          path: "/cotizaciones",
        },
      ],
    },
    {
      key: "operaciones",
      title: "Operaciones & Postventa",
      icon: <FolderOpenOutlinedIcon />,
      items: [
        {
          text: "Seguimiento de Servicio",
          icon: <TrackChangesOutlinedIcon />,
          path: "/operaciones/seguimiento",
        },
        {
          text: "Encuestas / NPS",
          icon: <SentimentSatisfiedAltOutlinedIcon />,
          path: "/operaciones/nps",
        },
      ],
    },
    {
      key: "reportes",
      title: "Reportes & Analítica",
      icon: <AssessmentOutlinedIcon />,
      items: [
        {
          text: "KPIs y Tableros",
          icon: <AssessmentOutlinedIcon />,
          path: "/reportes/kpis",
        },
        {
          text: "Proyecciones",
          icon: <ShowChartOutlinedIcon />,
          path: "/reportes/proyecciones",
        },
        {
          text: "Rentabilidad",
          icon: <MonetizationOnOutlinedIcon />,
          path: "/reportes/rentabilidad",
        },
      ],
    },
    {
      key: "marketing",
      title: "Marketing & Escalabilidad",
      icon: <CampaignOutlinedIcon />,
      items: [
        {
          text: "Campañas Email",
          icon: <MarkEmailUnreadOutlinedIcon />,
          path: "/marketing/email",
        },
        {
          text: "Integración Ads/Redes",
          icon: <CampaignOutlinedIcon />,
          path: "/marketing/ads",
        },
        {
          text: "Landing / Formularios",
          icon: <WebAssetOutlinedIcon />,
          path: "/marketing/landing",
        },
        {
          text: "Fuentes de Lead",
          icon: <LocalOfferOutlinedIcon />,
          path: "/marketing/fuentes",
        },
      ],
    },
    {
      key: "seguridad",
      title: "Integraciones & Usuarios",
      icon: <AdminPanelSettingsOutlinedIcon />,
      items: [
        {
          text: "Usuarios",
          icon: <PeopleIcon />,
          path: "/seguridad/usuarios",
        },
        {
          text: "Roles",
          icon: <AdminPanelSettingsOutlinedIcon />,
          path: "/seguridad/roles",
        },
      ],
    },
  ];

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(grupos.map((g) => [g.key, false]))
  );
  const toggleGroup = (key: string) =>
    setOpenGroups((s) => ({ ...s, [key]: !s[key] }));

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo / Marca */}
      <Box
        sx={{
          width: "100%",
          height: 110,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          pb: 1,
        }}
      >
        <img
          src="/images/logo_sinFondo.png"
          alt="GRUPO VCM"
          onError={(e) =>
            ((e.target as HTMLImageElement).style.display = "none")
          }
          style={{
            height: mini ? 50 : 220,
            width: "auto",
            objectFit: "contain",
            transition: "0.25s ease",
          }}
        />
      </Box>

      <Divider />

      {/* Menú */}
      <List
        sx={{ flex: 1, py: 0 }}
        subheader={
          !mini ? (
            <ListSubheader
              component="div"
              sx={{ bgcolor: "transparent", fontWeight: 800 }}
            >
              Navegación
            </ListSubheader>
          ) : undefined
        }
      >
        {grupos.map((g) => (
          <Box key={g.key}>
            <Group
              title={g.title}
              icon={g.icon}
              items={g.items}
              isOpen={openGroups[g.key]}
              onToggle={() => toggleGroup(g.key)}
              mini={mini}
            />
          </Box>
        ))}
      </List>

      {/* Usuario pie del drawer */}
      <Box
        sx={{
          px: 1.5,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          bgcolor: "rgba(255,255,255,0.9)",
          borderRadius: 2,
          mx: 1.5,
          mb: 1.5,
          border: "1px solid rgba(148,163,184,0.3)",
        }}
      >
        <Avatar src="/images/user.png" alt={username} />
        {!mini && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={700} noWrap>
              {username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ADMINISTRADOR
            </Typography>
          </Box>
        )}
        <IconButton
          color="primary"
          onClick={onLogout}
          sx={{ cursor: "pointer" }}
        >
          <PowerSettingsNewIcon />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", bgcolor: "#f7f9fc", minHeight: "100vh" }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: VCM_BG_SOFT,
          color: "inherit",
          borderBottom: "1px solid #f1c9a5",
          pl: {
            sm: sideOpen ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
          },
        }}
      >
        <Toolbar
          sx={{
            gap: 2,
            bgcolor: VCM_BG_SOFT,
            minHeight: 64,
          }}
        >
          {/* Toggle desktop */}
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setSideOpen((v) => !v)}
            sx={{ display: { xs: "none", sm: "inline-flex" }, cursor: "pointer" }}
          >
            <MenuIcon />
          </IconButton>

          {/* Toggle mobile */}
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setMobileOpen((v) => !v)}
            sx={{
              display: { xs: "inline-flex", sm: "none" },
              cursor: "pointer",
            }}
          >
            <MenuIcon />
          </IconButton>

          {showFilters && (
            <>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Año</InputLabel>
                <Select
                  label="Año"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {[year - 1, year, year + 1].map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Mes</InputLabel>
                <Select
                  label="Mes"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {[
                    "Enero",
                    "Febrero",
                    "Marzo",
                    "Abril",
                    "Mayo",
                    "Junio",
                    "Julio",
                    "Agosto",
                    "Septiembre",
                    "Octubre",
                    "Noviembre",
                    "Diciembre",
                  ].map((m, i) => (
                    <MenuItem key={m} value={i + 1}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}

          <Box sx={{ flex: 1 }} />

          {/* Menú de usuario (avatar superior derecha) */}
          <UserMenu />
        </Toolbar>
      </AppBar>

      {/* Drawer permanente (desktop) */}
      <Drawer
        variant="permanent"
        open={sideOpen}
        sx={{ display: { xs: "none", sm: "block" } }}
      >
        <DrawerSpacer />
        {drawerContent}
      </Drawer>

      {/* Drawer temporal (mobile) */}
      <MuiDrawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { width: drawerWidthOpen },
        }}
      >
        <DrawerSpacer />
        {drawerContent}
      </MuiDrawer>

      {/* Contenedor de página */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <DrawerSpacer />
        <Container maxWidth="lg" disableGutters>
          {title && (
            <Typography variant="h4" fontWeight={800} sx={{ mb: 2 }}>
              {title}
            </Typography>
          )}
          {children}
        </Container>
      </Box>

      {/* 🔔 Notificador global de alertas, siempre abajo a la derecha */}
      <GlobalAlertNotifier />
    </Box>
  );
}
