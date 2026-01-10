// src/public/NpsFormPage.tsx
import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Rating,
  Alert,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import StarIcon from "@mui/icons-material/Star";

type InviteInfo = {
  token: string;
  clientName: string;
  serviceName: string;
  expiresAt: string;
  used: boolean;
};

// Instancia de axios FUERA del componente
const api = axios.create({
  // ⛔ QUITA esto:
  // baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8080/api",

  // ✅ Usa el proxy de Vite:
  baseURL: "/api",
});

function Container({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
        p: 2,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08) 0%, transparent 50%)",
          pointerEvents: "none",
        },
      }}
    >
      {children}
    </Box>
  );
}

export default function NpsFormPage() {
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get("token");
  const { token: paramToken } = useParams<{ token: string }>();
  const token = queryToken || paramToken || undefined;

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [score, setScore] = useState<number | null>(10);
  const [comment, setComment] = useState("");
  const [status, setStatus] =
    useState<"idle" | "loading" | "done" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErr("Invitación inválida o vencida.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.get<InviteInfo>(
          `/nps/public/invite/${token}`
        );
        if (!cancelled) {
          setInfo(data);
        }
      } catch (e: any) {
        if (!cancelled) {
          setErr(
            e?.response?.data?.message || "Invitación inválida o vencida."
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async () => {
    if (!token || score == null) return;
    try {
      setStatus("loading");
      await api.post("/nps/public/answer", {
        token,
        score,
        comment,
      });
      setStatus("done");
    } catch (e: any) {
      setStatus("error");
      setErr(e?.response?.data?.message || "No se pudo registrar tu respuesta.");
    }
  };

  // Estado de error SIN Fade
  if (err && !info) {
    return (
      <Container>
        <Paper
          elevation={8}
          sx={{
            p: 4,
            maxWidth: 480,
            width: "90%",
            borderRadius: 4,
            textAlign: "center",
          }}
        >
          <Alert
            severity="error"
            sx={{
              borderRadius: 2,
              "& .MuiAlert-icon": { fontSize: 32 },
            }}
          >
            {err}
          </Alert>
        </Paper>
      </Container>
    );
  }

  // Estado de carga
  if (!info) {
    return (
      <Container>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={48} sx={{ color: "white" }} />
          <Typography color="white" fontSize={18} fontWeight={500}>
            Cargando encuesta...
          </Typography>
        </Stack>
      </Container>
    );
  }

  // Invitación ya usada
  if (info.used) {
    return (
      <Container>
        <Paper
          elevation={8}
          sx={{
            p: 4,
            maxWidth: 480,
            width: "90%",
            borderRadius: 4,
            textAlign: "center",
          }}
        >
          <Alert
            severity="info"
            sx={{
              borderRadius: 2,
              "& .MuiAlert-icon": { fontSize: 32 },
            }}
          >
            Esta invitación ya fue utilizada o está vencida.
          </Alert>
        </Paper>
      </Container>
    );
  }

  // Formulario principal SIN Fade
  return (
    <Container>
      <Paper
        elevation={12}
        sx={{
          p: { xs: 3, sm: 5 },
          width: "100%",
          maxWidth: 640,
          borderRadius: 5,
          background: "linear-gradient(to bottom, #ffffff, #fafafa)",
          position: "relative",
        }}
      >
        <Stack spacing={2.5} alignItems="center">
          {/* Logo */}
          <Box
            sx={{
              filter: "drop-shadow(0 4px 12px rgba(255, 107, 53, 0.2))",
            }}
          >
            <img
              src="/images/logo_sinFondo.png"
              alt="Grupo VCM"
              style={{ height: 150, display: "block" }}
            />
          </Box>

          {/* Encabezado */}
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                mb: 1,
                background:
                  "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Evalúa nuestro servicio
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 0.5, sm: 1 }}
              justifyContent="center"
              sx={{ mt: 1.5 }}
            >
              <Typography color="text.secondary">
                Cliente: <strong>{info.clientName}</strong>
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                •
              </Typography>
              <Typography color="text.secondary">
                Servicio: <strong>{info.serviceName}</strong>
              </Typography>
            </Stack>
          </Box>

          {/* Formulario */}
          <Stack spacing={3.5} sx={{ width: "100%" }}>
            {/* Rating */}
            <Box
              sx={{
                bgcolor: "#fff7f0",
                p: 3,
                borderRadius: 3,
                border: "2px solid #ffe8d6",
              }}
            >
              <Typography
                variant="body1"
                fontWeight={600}
                sx={{ mb: 2, color: "#333" }}
              >
                ¿Qué tan probable es que nos recomiendes?
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: 80 }}
                >
                  Poco probable
                </Typography>
                <Rating
                  max={10}
                  value={score ?? 0}
                  onChange={(_, v) => {
                    setScore(v ?? 0);
                  }}
                  disabled={status === "done"}
                  icon={<StarIcon fontSize="inherit" />}
                  emptyIcon={<StarIcon fontSize="inherit" />}
                  sx={{
                    "& .MuiRating-iconFilled": {
                      color: "#ff6b35",
                    },
                    "& .MuiRating-iconHover": {
                      color: "#f7931e",
                    },
                    fontSize: { xs: "1.5rem", sm: "1.8rem" },
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: 80, textAlign: "right" }}
                >
                  Muy probable
                </Typography>
              </Stack>
              {score !== null && (
                <Typography
                  variant="h5"
                  fontWeight={700}
                  textAlign="center"
                  sx={{ mt: 2, color: "#ff6b35" }}
                >
                  {score} / 10
                </Typography>
              )}
            </Box>

            {/* Comentario */}
            <TextField
              label="¿Qué podríamos mejorar o qué te gustó?"
              placeholder="Tu opinión es muy valiosa para nosotros..."
              multiline
              rows={4}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
              }}
              disabled={status === "done"}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "white",
                  "&:hover fieldset": {
                    borderColor: "#ff6b35",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#ff6b35",
                    borderWidth: 2,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#ff6b35",
                },
              }}
            />

            {/* Botón y mensajes */}
            <Stack spacing={2}>
              <Button
                variant="contained"
                onClick={submit}
                disabled={status === "loading" || status === "done"}
                fullWidth
                size="large"
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: "1rem",
                  textTransform: "none",
                  background:
                    "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                  boxShadow: "0 4px 12px rgba(255, 107, 53, 0.4)",
                  "&:hover": {
                    boxShadow: "0 6px 16px rgba(255, 107, 53, 0.5)",
                    background:
                      "linear-gradient(135deg, #e65a2b 0%, #de8210 100%)",
                  },
                  "&:disabled": {
                    background: "#ccc",
                    boxShadow: "none",
                  },
                }}
              >
                {status === "loading" ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : status === "done" ? (
                  "¡Enviado!"
                ) : (
                  "Enviar respuesta"
                )}
              </Button>

              {status === "done" && (
                <Alert
                  severity="success"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 500,
                  }}
                >
                  ¡Gracias por tu feedback! Tu opinión nos ayuda a mejorar.
                </Alert>
              )}

              {status === "error" && err && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {err}
                </Alert>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
