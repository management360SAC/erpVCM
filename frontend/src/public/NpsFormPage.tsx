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
  Divider,
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

const api = axios.create({ baseURL: "/api" });

const QUESTIONS = [
  { key: "q1" as const, label: "¿Cómo calificarías la calidad general del servicio?", max: 5 },
  { key: "q2" as const, label: "¿Cómo fue la comunicación y atención de nuestro equipo?", max: 5 },
  { key: "q3" as const, label: "¿El servicio fue entregado dentro de los plazos acordados?", max: 5 },
  { key: "q4" as const, label: "¿Qué tan satisfecho estás con los resultados obtenidos?", max: 5 },
  { key: "score" as const, label: "¿Qué tan probable es que nos recomiende a otras personas?", max: 10 },
];

type Answers = { q1: number | null; q2: number | null; q3: number | null; q4: number | null; score: number | null };

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
          top: 0, left: 0, right: 0, bottom: 0,
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

function QuestionBlock({
  number,
  label,
  max,
  value,
  onChange,
  disabled,
}: {
  number: number;
  label: string;
  max: number;
  value: number | null;
  onChange: (v: number | null) => void;
  disabled: boolean;
}) {
  return (
    <Box sx={{ bgcolor: "#fff7f0", p: 3, borderRadius: 3, border: "2px solid #ffe8d6" }}>
      <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 2 }}>
        <Box
          sx={{
            minWidth: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
            color: "#fff", fontWeight: 700, fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {number}
        </Box>
        <Typography variant="body1" fontWeight={600} sx={{ color: "#333" }}>
          {label}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
        {max === 5 && (
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 48 }}>
            Malo
          </Typography>
        )}
        {max === 10 && (
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
            Poco probable
          </Typography>
        )}
        <Rating
          max={max}
          value={value ?? 0}
          onChange={(_, v) => onChange(v ?? 0)}
          disabled={disabled}
          icon={<StarIcon fontSize="inherit" />}
          emptyIcon={<StarIcon fontSize="inherit" />}
          sx={{
            "& .MuiRating-iconFilled": { color: "#ff6b35" },
            "& .MuiRating-iconHover": { color: "#f7931e" },
            fontSize: max === 10 ? { xs: "1.3rem", sm: "1.6rem" } : { xs: "1.6rem", sm: "2rem" },
          }}
        />
        {max === 5 && (
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 48, textAlign: "right" }}>
            Excelente
          </Typography>
        )}
        {max === 10 && (
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80, textAlign: "right" }}>
            Muy probable
          </Typography>
        )}
      </Stack>
      {value !== null && value > 0 && (
        <Typography variant="h6" fontWeight={700} textAlign="center" sx={{ mt: 1, color: "#ff6b35" }}>
          {value} / {max}
        </Typography>
      )}
    </Box>
  );
}

export default function NpsFormPage() {
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get("token");
  const { token: paramToken } = useParams<{ token: string }>();
  const token = queryToken || paramToken || undefined;

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [answers, setAnswers] = useState<Answers>({ q1: null, q2: null, q3: null, q4: null, score: null });
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setErr("Invitación inválida o vencida."); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<InviteInfo>(`/nps/public/invite/${token}`);
        if (!cancelled) setInfo(data);
      } catch (e: any) {
        if (!cancelled) setErr(e?.response?.data?.message || "Invitación inválida o vencida.");
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const setAnswer = (key: keyof Answers) => (v: number | null) =>
    setAnswers((prev) => ({ ...prev, [key]: v }));

  const allAnswered = QUESTIONS.every((q) => (answers[q.key] ?? 0) > 0);

  const submit = async () => {
    if (!token || !allAnswered) return;
    try {
      setStatus("loading");
      await api.post("/nps/public/answer", { token, ...answers, comment });
      setStatus("done");
    } catch (e: any) {
      setStatus("error");
      setErr(e?.response?.data?.message || "No se pudo registrar tu respuesta.");
    }
  };

  if (err && !info) {
    return (
      <Container>
        <Paper elevation={8} sx={{ p: 4, maxWidth: 480, width: "90%", borderRadius: 4, textAlign: "center" }}>
          <Alert severity="error" sx={{ borderRadius: 2, "& .MuiAlert-icon": { fontSize: 32 } }}>
            {err}
          </Alert>
        </Paper>
      </Container>
    );
  }

  if (!info) {
    return (
      <Container>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={48} sx={{ color: "white" }} />
          <Typography color="white" fontSize={18} fontWeight={500}>Cargando encuesta...</Typography>
        </Stack>
      </Container>
    );
  }

  if (info.used) {
    return (
      <Container>
        <Paper elevation={8} sx={{ p: 4, maxWidth: 480, width: "90%", borderRadius: 4, textAlign: "center" }}>
          <Alert severity="info" sx={{ borderRadius: 2, "& .MuiAlert-icon": { fontSize: 32 } }}>
            Esta invitación ya fue utilizada o está vencida.
          </Alert>
        </Paper>
      </Container>
    );
  }

  if (status === "done") {
    return (
      <Container>
        <Paper elevation={12} sx={{ p: { xs: 3, sm: 5 }, width: "100%", maxWidth: 560, borderRadius: 5, textAlign: "center" }}>
          <img src="/images/logo_sinFondo.png" alt="Grupo VCM" style={{ height: 100, marginBottom: 24 }} />
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1, color: "#ff6b35" }}>
            ¡Gracias por tu respuesta!
          </Typography>
          <Typography color="text.secondary">
            Tu opinión nos ayuda a seguir mejorando la calidad de nuestros servicios.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container>
      <Paper
        elevation={12}
        sx={{
          p: { xs: 3, sm: 5 },
          width: "100%",
          maxWidth: 680,
          borderRadius: 5,
          background: "linear-gradient(to bottom, #ffffff, #fafafa)",
        }}
      >
        <Stack spacing={3} alignItems="center">
          <Box sx={{ filter: "drop-shadow(0 4px 12px rgba(255, 107, 53, 0.2))" }}>
            <img src="/images/logo_sinFondo.png" alt="Grupo VCM" style={{ height: 120, display: "block" }} />
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h4" fontWeight={700}
              sx={{
                mb: 1,
                background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Encuesta de satisfacción
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 1 }} justifyContent="center" sx={{ mt: 1 }}>
              <Typography color="text.secondary">Cliente: <strong>{info.clientName}</strong></Typography>
              <Typography color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>•</Typography>
              <Typography color="text.secondary">Servicio: <strong>{info.serviceName}</strong></Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Responde las 5 preguntas a continuación. Tu opinión es muy valiosa para nosotros.
            </Typography>
          </Box>

          <Divider sx={{ width: "100%" }} />

          <Stack spacing={2.5} sx={{ width: "100%" }}>
            {QUESTIONS.map((q, idx) => (
              <QuestionBlock
                key={q.key}
                number={idx + 1}
                label={q.label}
                max={q.max}
                value={answers[q.key]}
                onChange={setAnswer(q.key)}
                disabled={status === "loading"}
              />
            ))}

            <TextField
              label="¿Qué podríamos mejorar o qué te gustó especialmente? (opcional)"
              placeholder="Tu opinión es muy valiosa para nosotros..."
              multiline
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={status === "loading"}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2, bgcolor: "white",
                  "&:hover fieldset": { borderColor: "#ff6b35" },
                  "&.Mui-focused fieldset": { borderColor: "#ff6b35", borderWidth: 2 },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "#ff6b35" },
              }}
            />

            {!allAnswered && (
              <Typography variant="caption" color="text.secondary" textAlign="center">
                Por favor responde todas las preguntas para poder enviar.
              </Typography>
            )}

            <Button
              variant="contained"
              onClick={submit}
              disabled={status === "loading" || !allAnswered}
              fullWidth
              size="large"
              sx={{
                py: 1.5, borderRadius: 2, fontWeight: 600, fontSize: "1rem",
                textTransform: "none",
                background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                boxShadow: "0 4px 12px rgba(255, 107, 53, 0.4)",
                "&:hover": {
                  boxShadow: "0 6px 16px rgba(255, 107, 53, 0.5)",
                  background: "linear-gradient(135deg, #e65a2b 0%, #de8210 100%)",
                },
                "&:disabled": { background: "#ccc", boxShadow: "none" },
              }}
            >
              {status === "loading" ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Enviar respuesta"}
            </Button>

            {status === "error" && err && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>{err}</Alert>
            )}
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
