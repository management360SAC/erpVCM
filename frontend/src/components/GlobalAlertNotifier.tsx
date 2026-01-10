// src/components/GlobalAlertNotifier.tsx
import { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  Slide,
  Typography,
  Paper,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { listAlerts, markAlertRead, type AlertItem } from "../apis/alertsApi";

type SlideTransitionProps = {
  children: React.ReactElement<any, any>;
};

function SlideTransition(props: SlideTransitionProps) {
  return <Slide {...props} direction="left" />;
}

export default function GlobalAlertNotifier() {
  const [current, setCurrent] = useState<AlertItem | null>(null);
  const [open, setOpen] = useState(false);
  const [shownIds, setShownIds] = useState<Set<number>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Lee el usuario activo desde localStorage
  const getActiveUserId = () => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("userId");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
  };

  // Carga la próxima alerta no leída que debe ejecutarse AHORA
  const loadNext = async () => {
    try {
      console.log("🔔 Verificando alertas...", new Date().toISOString());

      const activeUserId = getActiveUserId();
      console.log("👤 Usuario activo:", activeUserId);

      // Obtener alertas activas, no leídas y del usuario actual (si hay userId)
      // Construir los params en una variable con tipo permissivo para evitar
      // el chequeo de propiedades extra en literales de objeto.
      const params: any = {
        all: false,
        page: 0,
        size: 50,
        activo: true,
        leido: false,
      };
      if (activeUserId != null) {
        params.userId = activeUserId;
      }
      const page = await listAlerts(params);

      console.log(`📋 Alertas obtenidas: ${page.content.length}`, page.content);

      if (page.content.length === 0) {
        console.log("✅ No hay alertas pendientes");
        return;
      }

      const now = new Date();

      const pendingAlerts = page.content.filter((alert) => {
        // 0) No repetir en esta sesión
        if (shownIds.has(alert.id)) {
          console.log(`⏭️  Alerta ${alert.id} ya fue mostrada en esta sesión`);
          return false;
        }

        // 1) Seguridad extra: no mostrar si ya tiene readAt (aunque backend filtre)
        if (alert.readAt) {
          console.log(
            `⛔ Alerta ${alert.id} tiene readAt=${alert.readAt}, se considera leída`
          );
          return false;
        }

        // 2) Validar que la alerta pertenezca al usuario activo
        //    Si quieres que solo se muestren alertas con userId EXACTO:
        const alertUserId = (alert as any).userId;
        if (activeUserId && alertUserId && alertUserId !== activeUserId) {
          console.log(
            `⛔ Alerta ${alert.id} pertenece a userId=${alertUserId}, distinto del activo=${activeUserId}`
          );
          return false;
        }

        // 3) Validar tiempo de ejecución (próxima ejecución)
        if (!alert.proximaEjecucion) {
          // Si no tiene proximaEjecucion, se puede mostrar inmediatamente
          console.log(
            `📅 Alerta "${alert.titulo || alert.title}" sin proximaEjecucion, mostrando ahora`
          );
          return true;
        }

        const nextExec = new Date(alert.proximaEjecucion);
        const shouldShow = nextExec <= now;

        console.log(`📅 Alerta "${alert.titulo || alert.title}":`, {
          id: alert.id,
          proximaEjecucion: alert.proximaEjecucion,
          ahora: now.toISOString(),
          deberiamostrarse: shouldShow,
        });

        return shouldShow;
      });

      if (pendingAlerts.length > 0) {
        // Ordenar por próxima ejecución (más antigua primero)
        pendingAlerts.sort((a, b) => {
          const timeA = a.proximaEjecucion
            ? new Date(a.proximaEjecucion).getTime()
            : 0;
          const timeB = b.proximaEjecucion
            ? new Date(b.proximaEjecucion).getTime()
            : 0;
          return timeA - timeB;
        });

        const nextAlert = pendingAlerts[0];
        console.log("🎯 Mostrando alerta:", nextAlert);

        setCurrent(nextAlert);
        setOpen(true);
        setShownIds((prev) => new Set(prev).add(nextAlert.id));
      } else {
        console.log("⏰ Hay alertas, pero ninguna debe ejecutarse todavía");
      }
    } catch (err) {
      console.error("❌ Error cargando alerta global:", err);
    }
  };

  useEffect(() => {
    console.log("🚀 GlobalAlertNotifier montado");

    // Cargar inmediatamente
    loadNext();

    // Revisar cada 15 segundos (puedes ajustar)
    intervalRef.current = setInterval(() => {
      console.log("⏱️  Intervalo: verificando alertas...");
      loadNext();
    }, 15000);

    return () => {
      console.log("🛑 GlobalAlertNotifier desmontado");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleClose = async (_?: any, reason?: string) => {
    if (reason === "clickaway") return;

    console.log("👋 Cerrando alerta:", current?.id);
    setOpen(false);

    if (current) {
      try {
        await markAlertRead(current.id);
        console.log("✅ Alerta marcada como leída:", current.id);
      } catch (err) {
        console.error("❌ Error marcando alerta como leída:", err);
      }
    }

    setCurrent(null);

    setTimeout(() => {
      console.log("🔄 Buscando siguiente alerta...");
      loadNext();
    }, 1000);
  };

  if (!current) return null;

  return (
    <Snackbar
      open={open}
      onClose={handleClose}
      autoHideDuration={12000}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      TransitionComponent={SlideTransition}
      sx={{
        zIndex: (theme) => theme.zIndex.snackbar + 1000,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 2.5,
          maxWidth: 380,
          borderRadius: 3,
          bgcolor: "background.paper",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          border: "2px solid #0ea5e9",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: "#0ea5e9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              animation: "pulse 2s infinite",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.7 },
              },
            }}
          >
            <NotificationsActiveIcon sx={{ fontSize: 22, color: "#fff" }} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                wordBreak: "break-word",
                color: "#0ea5e9",
              }}
            >
              {current.titulo || current.title}
            </Typography>

            {(current.descripcion || current.message) && (
              <Typography
                variant="body2"
                sx={{
                  color: "text.primary",
                  mb: 1,
                  wordBreak: "break-word",
                  lineHeight: 1.5,
                }}
              >
                {current.descripcion || current.message}
              </Typography>
            )}

            <Typography
              variant="caption"
              sx={{
                color: "text.disabled",
                display: "block",
                mt: 1,
              }}
            >
              {current.canal || "Recordatorio en la app"}
            </Typography>
          </Box>

          <IconButton
            size="small"
            onClick={handleClose}
            sx={{
              color: "text.secondary",
              "&:hover": { color: "error.main" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
          <Button
            size="small"
            onClick={handleClose}
            variant="contained"
            sx={{
              bgcolor: "#0ea5e9",
              "&:hover": { bgcolor: "#0284c7" },
            }}
          >
            Entendido
          </Button>
        </Box>
      </Paper>
    </Snackbar>
  );
}
