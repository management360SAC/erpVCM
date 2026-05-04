// src/pages/ai/AsistenteIA.tsx
import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import HomeRepairServiceOutlinedIcon from "@mui/icons-material/HomeRepairServiceOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";

import AppLayout from "../../layout/AppLayout";
import { sendAiMessage, type AiContextType } from "../../apis/aiApi";

// ── Tokens de diseño (alineados al sistema VCM) ─────────────────────────────
const ORANGE = "#f57c00";
const ORANGE_DARK = "#e65100";
const ORANGE_SOFT = "#fff7ed";
const SURFACE = "#f7f9fc";
const BORDER = "#eef2f7";
const TEXT_PRIMARY = "#1f2937";
const TEXT_MUTED = "#6b7280";
const MAX_CHARS = 1000;

// ── Contextos — entidades reales del CRM ─────────────────────────────────────
const CONTEXTS: { label: string; value: AiContextType; icon: React.ReactNode }[] = [
  { label: "General",      value: "general",      icon: <SmartToyOutlinedIcon sx={{ fontSize: 14 }} /> },
  { label: "Clientes",     value: "clientes",     icon: <PeopleAltOutlinedIcon sx={{ fontSize: 14 }} /> },
  { label: "Leads",        value: "leads",        icon: <TrendingUpOutlinedIcon sx={{ fontSize: 14 }} /> },
  { label: "Cotizaciones", value: "cotizaciones", icon: <RequestQuoteOutlinedIcon sx={{ fontSize: 14 }} /> },
  { label: "Pagos",        value: "pagos",        icon: <PaymentsOutlinedIcon sx={{ fontSize: 14 }} /> },
  { label: "Servicios",    value: "servicios",    icon: <HomeRepairServiceOutlinedIcon sx={{ fontSize: 14 }} /> },
  { label: "Campañas",     value: "campanas",     icon: <CampaignOutlinedIcon sx={{ fontSize: 14 }} /> },
  { label: "Reportes",     value: "reportes",     icon: <AssessmentOutlinedIcon sx={{ fontSize: 14 }} /> },
];

// ── Prompts rápidos por contexto ─────────────────────────────────────────────
const QUICK_PROMPTS: Record<AiContextType, string[]> = {
  general: [
    "¿Cómo va el negocio este mes?",
    "Resume la actividad reciente",
    "¿Qué áreas necesitan atención?",
    "Dame un resumen ejecutivo",
  ],
  clientes: [
    "¿Qué clientes tienen servicios por vencer?",
    "¿Cuáles son los clientes más rentables?",
    "Lista clientes sin actividad reciente",
    "¿Cuántos clientes nuevos ingresaron este mes?",
  ],
  leads: [
    "¿Qué leads están sin respuesta esta semana?",
    "Genera mensaje de seguimiento para un lead",
    "¿Cuántos leads se convirtieron este mes?",
    "Analiza el pipeline actual",
  ],
  cotizaciones: [
    "Redacta email para cotización enviada",
    "¿Qué cotizaciones están pendientes de respuesta?",
    "¿Cuál es el valor promedio de las cotizaciones?",
    "Lista cotizaciones rechazadas del último mes",
  ],
  pagos: [
    "Resume pagos pendientes de cobro",
    "¿Cuánto se cobró este mes?",
    "¿Qué clientes tienen deuda pendiente?",
    "Genera resumen de cobros parciales",
  ],
  servicios: [
    "¿Qué servicios tienen mayor demanda?",
    "Lista servicios inactivos",
    "¿Cuál es el precio promedio por servicio?",
    "¿Qué servicios vencen este mes?",
  ],
  campanas: [
    "Crea asunto para campaña de email",
    "¿Cuáles campañas tuvieron mejor apertura?",
    "Redacta cuerpo de email promocional",
    "Sugiere segmentación para próxima campaña",
  ],
  reportes: [
    "Interpreta el NPS del último trimestre",
    "¿Cómo va el MRR vs la proyección?",
    "Resume la tasa de cierre del pipeline",
    "¿Cuál es la rentabilidad por servicio?",
  ],
};

// ── Placeholder del input por contexto ───────────────────────────────────────
const PLACEHOLDERS: Record<AiContextType, string> = {
  general:      "Escribe una consulta general sobre el negocio…",
  clientes:     "Pregunta sobre clientes, sectores, contratos activos…",
  leads:        "Consulta sobre leads, pipeline, seguimiento, conversión…",
  cotizaciones: "Pregunta sobre cotizaciones, propuestas, estados…",
  pagos:        "Consulta sobre pagos, cobros pendientes, deudas…",
  servicios:    "Pregunta sobre catálogo de servicios, precios, contratos…",
  campanas:     "Consulta sobre campañas, tasas de apertura, contenido…",
  reportes:     "Pregunta sobre KPIs, MRR, NPS, rentabilidad, proyecciones…",
};

// ── Tipos ────────────────────────────────────────────────────────────────────
type Message = {
  id: string;
  role: "user" | "ai";
  text: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Burbuja de mensaje ───────────────────────────────────────────────────────
function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        alignItems: "flex-start",
        gap: 1,
      }}
    >
      {!isUser && (
        <Avatar
          sx={{ bgcolor: ORANGE, width: 32, height: 32, flexShrink: 0, mt: 0.25 }}
        >
          <SmartToyOutlinedIcon sx={{ fontSize: 17 }} />
        </Avatar>
      )}

      <Box
        sx={{
          maxWidth: { xs: "88%", sm: "68%" },
          px: 2,
          py: 1.25,
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          bgcolor: isUser ? ORANGE : "#f8fafc",
          color: isUser ? "#fff" : TEXT_PRIMARY,
          border: isUser ? "none" : `1px solid ${BORDER}`,
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        <Typography
          variant="body2"
          sx={{ whiteSpace: "pre-wrap", lineHeight: 1.65, wordBreak: "break-word" }}
        >
          {msg.text}
        </Typography>
      </Box>

      {isUser && (
        <Avatar
          sx={{ bgcolor: "#374151", width: 32, height: 32, flexShrink: 0, mt: 0.25 }}
        >
          <PersonOutlinedIcon sx={{ fontSize: 17 }} />
        </Avatar>
      )}
    </Box>
  );
}

// ── Loader de escritura ───────────────────────────────────────────────────────
function TypingBubble() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Avatar sx={{ bgcolor: ORANGE, width: 32, height: 32 }}>
        <SmartToyOutlinedIcon sx={{ fontSize: 17 }} />
      </Avatar>
      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderRadius: "18px 18px 18px 4px",
          bgcolor: "#f8fafc",
          border: `1px solid ${BORDER}`,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <CircularProgress size={13} sx={{ color: ORANGE }} />
        <Typography variant="body2" color="text.secondary">
          Generando respuesta…
        </Typography>
      </Box>
    </Box>
  );
}

// ── Estado vacío ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        py: 6,
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          bgcolor: ORANGE_SOFT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SmartToyOutlinedIcon sx={{ fontSize: 32, color: ORANGE, opacity: 0.7 }} />
      </Box>
      <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={320}>
        Selecciona un contexto, usa un prompt rápido o escribe tu consulta directamente.
      </Typography>
    </Box>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function AsistenteIA() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [context, setContext] = useState<AiContextType>("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final al recibir mensajes nuevos
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const dispatch = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading || trimmed.length > MAX_CHARS) return;

    setMessages((prev) => [...prev, { id: uid(), role: "user", text: trimmed }]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const reply = await sendAiMessage(trimmed, context);
      setMessages((prev) => [...prev, { id: uid(), role: "ai", text: reply }]);
    } catch {
      setError(
        "No se pudo conectar con el asistente. Verifica la conexión o intenta más tarde."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      dispatch(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  const charCount = input.length;
  const nearLimit = charCount > 800;

  return (
    <AppLayout>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: { xs: "calc(100vh - 96px)", sm: "calc(100vh - 108px)" },
          gap: 2,
        }}
      >
        {/* ── CABECERA ────────────────────────────────────────────────────── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  bgcolor: ORANGE_SOFT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid rgba(245,124,0,0.2)`,
                }}
              >
                <SmartToyOutlinedIcon sx={{ fontSize: 22, color: ORANGE }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
                  Asistente IA
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Consultas sobre clientes, leads, cotizaciones, pagos y reportes
                </Typography>
              </Box>
            </Box>
          </Box>

          {messages.length > 0 && (
            <Tooltip title="Limpiar conversación">
              <Button
                size="small"
                variant="outlined"
                startIcon={<DeleteOutlineIcon />}
                onClick={clearChat}
                sx={{
                  color: TEXT_MUTED,
                  borderColor: BORDER,
                  textTransform: "none",
                  fontSize: 12,
                  "&:hover": { borderColor: ORANGE, color: ORANGE, bgcolor: ORANGE_SOFT },
                }}
              >
                Limpiar
              </Button>
            </Tooltip>
          )}
        </Box>

        {/* ── SELECTOR DE CONTEXTO ─────────────────────────────────────────── */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, flexShrink: 0 }}>
          {CONTEXTS.map((ctx) => {
            const active = context === ctx.value;
            return (
              <Chip
                key={ctx.value}
                icon={ctx.icon as React.ReactElement}
                label={ctx.label}
                size="small"
                onClick={() => setContext(ctx.value)}
                sx={{
                  fontWeight: active ? 700 : 400,
                  fontSize: 12,
                  bgcolor: active ? ORANGE : "white",
                  color: active ? "#fff" : TEXT_PRIMARY,
                  borderColor: active ? ORANGE : BORDER,
                  border: "1px solid",
                  cursor: "pointer",
                  "& .MuiChip-icon": { color: active ? "#fff" : TEXT_MUTED },
                  "&:hover": {
                    bgcolor: active ? ORANGE_DARK : ORANGE_SOFT,
                    borderColor: ORANGE,
                    color: active ? "#fff" : ORANGE,
                    "& .MuiChip-icon": { color: active ? "#fff" : ORANGE },
                  },
                  transition: "all 0.15s ease",
                }}
              />
            );
          })}
        </Box>

        {/* ── PROMPTS RÁPIDOS — cambian según el contexto activo ─────────── */}
        <Paper
          elevation={0}
          sx={{
            px: 2,
            py: 1.5,
            bgcolor: "white",
            borderRadius: 2,
            border: `1px solid ${BORDER}`,
            flexShrink: 0,
          }}
        >
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{ display: "block", mb: 1, textTransform: "uppercase", letterSpacing: 0.5 }}
          >
            Acciones rápidas · {CONTEXTS.find((c) => c.value === context)?.label}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {QUICK_PROMPTS[context].map((text) => (
              <Button
                key={text}
                size="small"
                variant="outlined"
                disabled={loading}
                onClick={() => dispatch(text)}
                sx={{
                  fontSize: 11.5,
                  borderColor: BORDER,
                  color: TEXT_PRIMARY,
                  textTransform: "none",
                  borderRadius: 5,
                  py: 0.4,
                  "&:hover": { borderColor: ORANGE, color: ORANGE, bgcolor: ORANGE_SOFT },
                  "&.Mui-disabled": { opacity: 0.45 },
                }}
              >
                {text}
              </Button>
            ))}
          </Box>
        </Paper>

        {/* ── ÁREA DE MENSAJES ─────────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            overflow: "auto",
            p: 2,
            bgcolor: "white",
            borderRadius: 2,
            border: `1px solid ${BORDER}`,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {messages.length === 0 && !loading && <EmptyState />}

          {messages.map((msg) => (
            <Bubble key={msg.id} msg={msg} />
          ))}

          {loading && <TypingBubble />}

          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ borderRadius: 2, fontSize: 13 }}
            >
              {error}
            </Alert>
          )}

          <div ref={bottomRef} />
        </Paper>

        {/* ── INPUT ────────────────────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            px: 1.5,
            py: 1.25,
            bgcolor: "white",
            borderRadius: 2,
            border: `1px solid ${nearLimit ? ORANGE : BORDER}`,
            display: "flex",
            gap: 1,
            alignItems: "flex-end",
            flexShrink: 0,
            transition: "border-color 0.2s ease",
            position: { xs: "sticky", sm: "static" },
            bottom: { xs: 0, sm: "auto" },
          }}
        >
          <TextField
            multiline
            maxRows={4}
            fullWidth
            size="small"
            placeholder={PLACEHOLDERS[context]}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            disabled={loading}
            variant="standard"
            InputProps={{ disableUnderline: true, sx: { fontSize: 14, pt: 0.5 } }}
          />

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.25 }}>
            {nearLimit && (
              <Typography
                variant="caption"
                sx={{ color: charCount >= MAX_CHARS ? "error.main" : TEXT_MUTED, fontSize: 10 }}
              >
                {charCount}/{MAX_CHARS}
              </Typography>
            )}
            <Tooltip title={loading ? "Esperando respuesta…" : "Enviar (Enter)"}>
              <span>
                <IconButton
                  size="small"
                  onClick={() => dispatch(input)}
                  disabled={loading || !input.trim()}
                  sx={{
                    bgcolor: ORANGE,
                    color: "#fff",
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    "&:hover": { bgcolor: ORANGE_DARK },
                    "&.Mui-disabled": { bgcolor: SURFACE, color: TEXT_MUTED },
                    transition: "background-color 0.15s ease",
                  }}
                >
                  {loading ? (
                    <CircularProgress size={16} sx={{ color: ORANGE }} />
                  ) : (
                    <SendRoundedIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Paper>
      </Box>
    </AppLayout>
  );
}
