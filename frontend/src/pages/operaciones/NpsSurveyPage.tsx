// src/pages/public/NpsSurveyPage.tsx

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Button,
  TextField,
  Stack,
  Chip,
  Alert,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { http } from "../../apis/http";

export default function NpsSurveyPage() {
  const [searchParams] = useSearchParams();
  
  // Memoizar el token para evitar re-renders
  const token = useMemo(() => searchParams.get("token"), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<any>(null);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ===============================================================
  //            CARGAR INVITACIÓN NPS PÚBLICA (SOLO UNA VEZ)
  // ===============================================================
  useEffect(() => {
    if (!token) {
      setError("Token inválido.");
      setLoading(false);
      return;
    }

    let isMounted = true;

    http
      .get(`/nps/public/invite/${token}`)
      .then((res) => {
        if (isMounted) {
          setInvite(res.data);
          setError(null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Invitación no válida o expirada.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // ===============================================================
  //            HANDLERS
  // ===============================================================
  const handleScoreClick = useCallback((n: number) => {
    if (sent) return;
    setScore(n);
    setError(null);
  }, [sent]);

  const handleCommentChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (sent) return;
    setComment(e.target.value);
  }, [sent]);

  const handleSubmit = useCallback(() => {
    if (sent || submitting) return;
    
    if (score === null) {
      setError("Selecciona un puntaje antes de enviar.");
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    http
      .post("/nps/public/answer", {
        token,
        score,
        comment,
      })
      .then(() => {
        setSent(true);
        setSuccess("¡Gracias por tu feedback! Tu opinión nos ayuda a mejorar.");
        setSubmitting(false);
      })
      .catch(() => {
        setError("No se pudo registrar tu respuesta.");
        setSubmitting(false);
      });
  }, [sent, submitting, score, token, comment]);

  // ===============================================================
  //            RENDERIZADO CONDICIONAL PARA CARGA INICIAL
  // ===============================================================
  if (loading) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
        bgcolor="#f97316"
        p={2}
      >
        <Card sx={{ maxWidth: 600, width: "100%", p: 3 }}>
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" py={4}>
              <CircularProgress sx={{ color: "#ff7a1a" }} />
              <Typography sx={{ mt: 2, color: "#666" }}>
                Cargando encuesta...
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // ===============================================================
  //            ERROR SIN INVITACIÓN
  // ===============================================================
  if (error && !invite) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
        bgcolor="#f97316"
        p={2}
      >
        <Card sx={{ maxWidth: 600, width: "100%", p: 3 }}>
          <CardContent>
            <Alert severity="error" sx={{ fontSize: 16 }}>
              {error}
            </Alert>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // ===============================================================
  //            FORMULARIO PRINCIPAL
  // ===============================================================
  return (
    <Box
      minHeight="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
      bgcolor="#f97316"
      p={2}
    >
      <Card sx={{ maxWidth: 600, width: "100%", p: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
            Evalúa nuestro servicio
          </Typography>

          <Typography textAlign="center" sx={{ color: "gray", mb: 2 }}>
            Cliente: <strong>{invite?.clientName ?? "—"}</strong> · Servicio:{" "}
            <strong>{invite?.serviceName ?? "—"}</strong>
          </Typography>

          {/* BLOQUE NPS */}
          <Box
            sx={{
              borderRadius: 2,
              border: "1px solid #fde7d3",
              background: "#fff7ef",
              p: 2.5,
              mb: 3,
            }}
          >
            <Typography fontWeight={600} textAlign="center" sx={{ mb: 1 }}>
              ¿Qué tan probable es que nos recomiendes?
            </Typography>

            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Poco probable
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Muy probable
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <Chip
                  key={n}
                  label={n}
                  onClick={() => handleScoreClick(n)}
                  clickable={!sent}
                  disabled={sent}
                  sx={{
                    fontSize: 18,
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    cursor: sent ? "default" : "pointer",
                    opacity: sent ? 0.7 : 1,
                    background: score === n ? "#ff7a1a" : "#ffe1c4",
                    color: score === n ? "white" : "#b45309",
                    transition: "background 0.15s, transform 0.1s",
                    "&:hover": !sent ? {
                      background: score === n ? "#ff7a1a" : "#ffd4a3",
                      transform: "scale(1.05)",
                    } : {},
                  }}
                />
              ))}
            </Stack>

            <Typography
              textAlign="center"
              sx={{ mt: 2, fontWeight: "bold", fontSize: 24, color: "#b45309" }}
            >
              {score !== null ? `${score}/10` : "--/10"}
            </Typography>
          </Box>

          {/* COMENTARIO */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            ¿Qué podríamos mejorar o qué te gustó?
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Escribe tu comentario aquí (opcional)"
            sx={{ mb: 2 }}
            value={comment}
            onChange={handleCommentChange}
            disabled={sent}
            inputProps={{
              maxLength: 500,
            }}
          />

          {/* MENSAJES */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* BOTÓN */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={sent || submitting}
            sx={{
              py: 1.5,
              bgcolor: sent ? "#d1d5db" : "#ff7a1a",
              "&:hover": {
                bgcolor: sent ? "#d1d5db" : "#e66910",
              },
              "&.Mui-disabled": {
                bgcolor: "#d1d5db",
                color: "#9ca3af",
              },
            }}
          >
            {submitting ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={20} sx={{ color: "white" }} />
                Enviando...
              </Box>
            ) : sent ? (
              "¡Enviado!"
            ) : (
              "Enviar respuesta"
            )}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}