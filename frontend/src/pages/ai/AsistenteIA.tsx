// src/pages/ai/AsistenteIA.tsx
import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress,
  IconButton, Paper, Tab, Tabs, TextField, Tooltip, Typography,
} from "@mui/material";
import SendRoundedIcon        from "@mui/icons-material/SendRounded";
import DeleteOutlineIcon      from "@mui/icons-material/DeleteOutline";
import SmartToyOutlinedIcon   from "@mui/icons-material/SmartToyOutlined";
import PersonOutlinedIcon     from "@mui/icons-material/PersonOutlined";
import PeopleAltOutlinedIcon  from "@mui/icons-material/PeopleAltOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import RequestQuoteOutlinedIcon    from "@mui/icons-material/RequestQuoteOutlined";
import PaymentsOutlinedIcon        from "@mui/icons-material/PaymentsOutlined";
import HomeRepairServiceOutlinedIcon from "@mui/icons-material/HomeRepairServiceOutlined";
import CampaignOutlinedIcon   from "@mui/icons-material/CampaignOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import ImageOutlinedIcon      from "@mui/icons-material/ImageOutlined";
import DownloadIcon           from "@mui/icons-material/Download";
import SendIcon               from "@mui/icons-material/Send";

import AppLayout from "../../layout/AppLayout";
import {
  sendAiMessage, generateAiImage, sendAiEmail,
  type AiContextType,
} from "../../apis/aiApi";

const ORANGE      = "#f57c00";
const ORANGE_DARK = "#e65100";
const ORANGE_SOFT = "#fff7ed";
const SURFACE     = "#f7f9fc";
const BORDER      = "#eef2f7";
const TEXT_PRIMARY = "#1f2937";
const TEXT_MUTED   = "#6b7280";
const MAX_CHARS    = 2000;

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

const QUICK_PROMPTS: Record<AiContextType, string[]> = {
  general:      ["¿Cómo va el negocio este mes?", "Resume la actividad reciente", "¿Qué áreas necesitan atención?"],
  clientes:     ["¿Qué clientes tienen servicios por vencer?", "¿Cuáles son los clientes más rentables?", "Lista clientes sin actividad reciente"],
  leads:        ["¿Qué leads están sin respuesta esta semana?", "Genera mensaje de seguimiento para un lead", "Analiza el pipeline actual"],
  cotizaciones: ["Redacta email para cotización enviada", "¿Qué cotizaciones están pendientes de respuesta?", "¿Cuál es el valor promedio de las cotizaciones?"],
  pagos:        ["Resume pagos pendientes de cobro", "¿Cuánto se cobró este mes?", "¿Qué clientes tienen deuda pendiente?"],
  servicios:    ["¿Qué servicios tienen mayor demanda?", "Lista servicios inactivos", "¿Qué servicios vencen este mes?"],
  campanas:     ["Crea asunto para campaña de email", "¿Cuáles campañas tuvieron mejor apertura?", "Redacta cuerpo de email promocional"],
  reportes:     ["Interpreta el NPS del último trimestre", "¿Cómo va el MRR vs la proyección?", "Resume la tasa de cierre del pipeline"],
};

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

const IMAGE_PROMPTS = [
  "Obligaciones tributarias mensuales en Perú",
  "Proceso de contratación laboral paso a paso",
  "Calendario de declaraciones SUNAT 2026",
  "Beneficios sociales del trabajador peruano",
  "Regímenes tributarios en Perú: diferencias",
  "Tipos de contratos laborales en Perú",
];

// ── Tipos ────────────────────────────────────────────────────────────────────
type Message = { id: string; role: "user" | "ai"; text: string; };
interface EmailDraft { to: string; subject: string; htmlBody: string; }

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

// Superpone el logo VCM sobre la franja superior de la infografía usando Canvas
function addLogoToImage(imageDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) { resolve(imageDataUrl); return; }

    const img = new Image();
    img.onload = () => {
      canvas.width  = img.width;
      canvas.height = img.height;

      // 1. Dibujar la infografía completa
      ctx.drawImage(img, 0, 0);

      // 2. Franja superior blanca (24% del alto)
      const stripH = img.height * 0.24;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, img.width, stripH);

      // 3. Línea divisoria sutil al borde inferior de la franja
      ctx.strokeStyle = "#f57c00";
      ctx.lineWidth = img.width * 0.003;
      ctx.beginPath();
      ctx.moveTo(0, stripH);
      ctx.lineTo(img.width, stripH);
      ctx.stroke();

      // 4. Logo centrado ocupando el 85% del alto de la franja
      const logo = new Image();
      logo.onload = () => {
        const logoH = stripH * 0.85;
        const logoW = (logo.width / logo.height) * logoH;
        const x = (img.width - logoW) / 2;
        const y = (stripH - logoH) / 2;
        ctx.drawImage(logo, x, y, logoW, logoH);
        resolve(canvas.toDataURL("image/png"));
      };
      logo.onerror = () => resolve(canvas.toDataURL("image/png"));
      logo.src = "/images/logo_sinFondo.png";
    };
    img.onerror = () => resolve(imageDataUrl);
    img.src = imageDataUrl;
  });
}

// Parsea <<EMAIL_DRAFT>>...<<END_EMAIL_DRAFT>> del reply
function parseEmailDraft(text: string): { clean: string; draft: EmailDraft | null } {
  const match = text.match(/<<EMAIL_DRAFT>>\s*([\s\S]*?)\s*<<END_EMAIL_DRAFT>>/);
  if (!match) return { clean: text, draft: null };
  try {
    const draft: EmailDraft = JSON.parse(match[1]);
    const clean = text.replace(/<<EMAIL_DRAFT>>[\s\S]*?<<END_EMAIL_DRAFT>>/, "").trim();
    return { clean: clean || "He preparado el siguiente borrador de email:", draft };
  } catch {
    return { clean: text, draft: null };
  }
}

// ── Burbuja ───────────────────────────────────────────────────────────────────
function Bubble({ msg, onSendEmail }: { msg: Message; onSendEmail?: (d: EmailDraft) => void }) {
  const isUser = msg.role === "user";
  const { clean, draft } = isUser ? { clean: msg.text, draft: null } : parseEmailDraft(msg.text);

  return (
    <Box sx={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-start", gap: 1 }}>
      {!isUser && (
        <Avatar sx={{ bgcolor: ORANGE, width: 32, height: 32, flexShrink: 0, mt: 0.25 }}>
          <SmartToyOutlinedIcon sx={{ fontSize: 17 }} />
        </Avatar>
      )}
      <Box sx={{ maxWidth: { xs: "88%", sm: "72%" }, display: "flex", flexDirection: "column", gap: 1 }}>
        <Box sx={{
          px: 2, py: 1.25,
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          bgcolor: isUser ? ORANGE : "#f8fafc",
          color: isUser ? "#fff" : TEXT_PRIMARY,
          border: isUser ? "none" : `1px solid ${BORDER}`,
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.65, wordBreak: "break-word" }}>
            {clean}
          </Typography>
        </Box>

        {/* Email draft card */}
        {draft && (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#fff8f0", borderColor: ORANGE }}>
            <Typography variant="caption" fontWeight={700} color={ORANGE} sx={{ display: "block", mb: 1 }}>
              📧 Borrador de email
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}><b>Para:</b> {draft.to || "(sin destinatario)"}</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}><b>Asunto:</b> {draft.subject}</Typography>
            <Box sx={{ p: 1.5, bgcolor: "white", borderRadius: 1, border: `1px solid ${BORDER}`, mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}
                dangerouslySetInnerHTML={{ __html: draft.htmlBody }} />
            </Box>
            {onSendEmail && (
              <Button size="small" variant="contained" startIcon={<SendIcon />}
                onClick={() => onSendEmail(draft)}
                sx={{ bgcolor: ORANGE, "&:hover": { bgcolor: ORANGE_DARK }, textTransform: "none" }}>
                Confirmar y enviar
              </Button>
            )}
          </Paper>
        )}
      </Box>

      {isUser && (
        <Avatar sx={{ bgcolor: "#374151", width: 32, height: 32, flexShrink: 0, mt: 0.25 }}>
          <PersonOutlinedIcon sx={{ fontSize: 17 }} />
        </Avatar>
      )}
    </Box>
  );
}

function TypingBubble() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Avatar sx={{ bgcolor: ORANGE, width: 32, height: 32 }}>
        <SmartToyOutlinedIcon sx={{ fontSize: 17 }} />
      </Avatar>
      <Box sx={{ px: 2, py: 1.25, borderRadius: "18px 18px 18px 4px", bgcolor: "#f8fafc",
        border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 1 }}>
        <CircularProgress size={13} sx={{ color: ORANGE }} />
        <Typography variant="body2" color="text.secondary">Generando respuesta…</Typography>
      </Box>
    </Box>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function AsistenteIA() {
  const [tab, setTab]           = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [context, setContext]   = useState<AiContextType>("general");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // Image generation
  const [imgPrompt, setImgPrompt]   = useState("");
  const [imgLoading, setImgLoading] = useState(false);
  const [imgUrl, setImgUrl]         = useState<string | null>(null);
  const [imgError, setImgError]     = useState<string | null>(null);

  // Email sending
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent]       = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // ── Chat ──────────────────────────────────────────────────────────────────
  const dispatch = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading || trimmed.length > MAX_CHARS) return;
    setMessages((prev) => [...prev, { id: uid(), role: "user", text: trimmed }]);
    setInput(""); setError(null); setLoading(true);
    try {
      const reply = await sendAiMessage(trimmed, context);
      setMessages((prev) => [...prev, { id: uid(), role: "ai", text: reply }]);
    } catch {
      setError("No se pudo conectar con el asistente. Verifica la conexión o intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); dispatch(input); }
  };

  // ── Email desde draft ─────────────────────────────────────────────────────
  const handleSendEmail = async (draft: EmailDraft) => {
    if (!draft.to) { setError("El borrador no tiene destinatario. Especifica el email en tu mensaje."); return; }
    setSendingEmail(true);
    try {
      await sendAiEmail(draft.to, draft.subject, draft.htmlBody);
      setEmailSent(`Correo enviado a ${draft.to}`);
      setTimeout(() => setEmailSent(null), 4000);
    } catch {
      setError("Error al enviar el correo. Verifica la configuración de email.");
    } finally {
      setSendingEmail(false);
    }
  };

  // ── Generar imagen ────────────────────────────────────────────────────────
  const handleGenerateImage = async () => {
    const prompt = imgPrompt.trim();
    if (!prompt || imgLoading) return;
    setImgLoading(true); setImgError(null); setImgUrl(null);
    try {
      const res = await generateAiImage(prompt);
      const withLogo = await addLogoToImage(res.imageUrl);
      setImgUrl(withLogo);
    } catch (e: any) {
      setImgError(e?.response?.data?.error ?? "Error al generar la imagen. Intenta de nuevo.");
    } finally {
      setImgLoading(false);
    }
  };

  const handleDownloadImage = () => {
    if (!imgUrl) return;
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = `vcm-infografia-${Date.now()}.png`;
    a.click();
  };

  const charCount = input.length;
  const nearLimit = charCount > 800;

  return (
    <AppLayout>
      <Box sx={{ display: "flex", flexDirection: "column", height: { xs: "calc(100vh - 96px)", sm: "calc(100vh - 108px)" }, gap: 2 }}>

        {/* ── CABECERA ─────────────────────────────────────────────────────── */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: ORANGE_SOFT,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid rgba(245,124,0,0.2)` }}>
              <SmartToyOutlinedIcon sx={{ fontSize: 22, color: ORANGE }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} lineHeight={1.2}>Asistente IA</Typography>
              <Typography variant="caption" color="text.secondary">
                Consultas CRM · Generación de infografías · Redacción de emails
              </Typography>
            </Box>
          </Box>
          {tab === 0 && messages.length > 0 && (
            <Tooltip title="Limpiar conversación">
              <Button size="small" variant="outlined" startIcon={<DeleteOutlineIcon />}
                onClick={() => { setMessages([]); setError(null); }}
                sx={{ color: TEXT_MUTED, borderColor: BORDER, textTransform: "none", fontSize: 12,
                  "&:hover": { borderColor: ORANGE, color: ORANGE, bgcolor: ORANGE_SOFT } }}>
                Limpiar
              </Button>
            </Tooltip>
          )}
        </Box>

        {/* ── TABS ─────────────────────────────────────────────────────────── */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ flexShrink: 0, minHeight: 36,
          "& .MuiTab-root": { textTransform: "none", minHeight: 36, fontSize: 13, fontWeight: 600 },
          "& .Mui-selected": { color: ORANGE },
          "& .MuiTabs-indicator": { bgcolor: ORANGE },
        }}>
          <Tab icon={<SmartToyOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Chat CRM" />
          <Tab icon={<ImageOutlinedIcon sx={{ fontSize: 16 }} />}    iconPosition="start" label="Generar Infografía" />
        </Tabs>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 0 — CHAT                                                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 0 && (
          <>
            {/* Contexto */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, flexShrink: 0 }}>
              {CONTEXTS.map((ctx) => {
                const active = context === ctx.value;
                return (
                  <Chip key={ctx.value} icon={ctx.icon as React.ReactElement} label={ctx.label} size="small"
                    onClick={() => setContext(ctx.value)}
                    sx={{
                      fontWeight: active ? 700 : 400, fontSize: 12,
                      bgcolor: active ? ORANGE : "white", color: active ? "#fff" : TEXT_PRIMARY,
                      borderColor: active ? ORANGE : BORDER, border: "1px solid", cursor: "pointer",
                      "& .MuiChip-icon": { color: active ? "#fff" : TEXT_MUTED },
                      "&:hover": { bgcolor: active ? ORANGE_DARK : ORANGE_SOFT, borderColor: ORANGE,
                        color: active ? "#fff" : ORANGE, "& .MuiChip-icon": { color: active ? "#fff" : ORANGE } },
                      transition: "all 0.15s ease",
                    }} />
                );
              })}
            </Box>

            {/* Prompts rápidos */}
            <Paper elevation={0} sx={{ px: 2, py: 1.5, bgcolor: "white", borderRadius: 2,
              border: `1px solid ${BORDER}`, flexShrink: 0 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ display: "block", mb: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Acciones rápidas · {CONTEXTS.find((c) => c.value === context)?.label}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {QUICK_PROMPTS[context].map((text) => (
                  <Button key={text} size="small" variant="outlined" disabled={loading}
                    onClick={() => dispatch(text)}
                    sx={{ fontSize: 11.5, borderColor: BORDER, color: TEXT_PRIMARY, textTransform: "none",
                      borderRadius: 5, py: 0.4,
                      "&:hover": { borderColor: ORANGE, color: ORANGE, bgcolor: ORANGE_SOFT },
                      "&.Mui-disabled": { opacity: 0.45 } }}>
                    {text}
                  </Button>
                ))}
              </Box>
            </Paper>

            {/* Notificación de email enviado */}
            {emailSent && (
              <Alert severity="success" onClose={() => setEmailSent(null)} sx={{ flexShrink: 0, borderRadius: 2 }}>
                {emailSent}
              </Alert>
            )}

            {/* Mensajes */}
            <Paper elevation={0} sx={{ flex: 1, overflow: "auto", p: 2, bgcolor: "white",
              borderRadius: 2, border: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: 2 }}>
              {messages.length === 0 && !loading && (
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 1.5, py: 6 }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: ORANGE_SOFT,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <SmartToyOutlinedIcon sx={{ fontSize: 32, color: ORANGE, opacity: 0.7 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={320}>
                    Selecciona un contexto, usa un prompt rápido o escribe tu consulta.
                  </Typography>
                </Box>
              )}
              {messages.map((msg) => (
                <Bubble key={msg.id} msg={msg}
                  onSendEmail={sendingEmail ? undefined : handleSendEmail} />
              ))}
              {loading && <TypingBubble />}
              {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 2, fontSize: 13 }}>
                  {error}
                </Alert>
              )}
              <div ref={bottomRef} />
            </Paper>

            {/* Input */}
            <Paper elevation={0} sx={{ px: 1.5, py: 1.25, bgcolor: "white", borderRadius: 2,
              border: `1px solid ${nearLimit ? ORANGE : BORDER}`, display: "flex", gap: 1,
              alignItems: "flex-end", flexShrink: 0, transition: "border-color 0.2s ease" }}>
              <TextField multiline maxRows={4} fullWidth size="small"
                placeholder={PLACEHOLDERS[context]} value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={handleKeyDown} disabled={loading}
                variant="standard" InputProps={{ disableUnderline: true, sx: { fontSize: 14, pt: 0.5 } }} />
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.25 }}>
                {nearLimit && (
                  <Typography variant="caption"
                    sx={{ color: charCount >= MAX_CHARS ? "error.main" : TEXT_MUTED, fontSize: 10 }}>
                    {charCount}/{MAX_CHARS}
                  </Typography>
                )}
                <Tooltip title={loading ? "Esperando respuesta…" : "Enviar (Enter)"}>
                  <span>
                    <IconButton size="small" onClick={() => dispatch(input)}
                      disabled={loading || !input.trim()}
                      sx={{ bgcolor: ORANGE, color: "#fff", width: 36, height: 36, borderRadius: 1.5,
                        "&:hover": { bgcolor: ORANGE_DARK },
                        "&.Mui-disabled": { bgcolor: SURFACE, color: TEXT_MUTED },
                        transition: "background-color 0.15s ease" }}>
                      {loading ? <CircularProgress size={16} sx={{ color: ORANGE }} /> : <SendRoundedIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Paper>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1 — GENERAR INFOGRAFÍA                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, overflow: "auto" }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${BORDER}`, bgcolor: "white" }}>
              <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
                Describe la infografía que deseas generar
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                El asistente creará una infografía profesional con la paleta de colores VCM (naranja y gris),
                con textos en español y diseño listo para presentación.
              </Typography>

              {/* Sugerencias rápidas */}
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                Temas sugeridos
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
                {IMAGE_PROMPTS.map((p) => (
                  <Button key={p} size="small" variant="outlined" disabled={imgLoading}
                    onClick={() => setImgPrompt(p)}
                    sx={{ fontSize: 11.5, borderColor: BORDER, color: TEXT_PRIMARY, textTransform: "none",
                      borderRadius: 5, py: 0.4,
                      "&:hover": { borderColor: ORANGE, color: ORANGE, bgcolor: ORANGE_SOFT } }}>
                    {p}
                  </Button>
                ))}
              </Box>

              <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
                <TextField fullWidth multiline maxRows={3} size="small" variant="outlined"
                  label="Descripción de la infografía"
                  placeholder="Ej: Obligaciones tributarias mensuales de una empresa MYPE en Perú"
                  value={imgPrompt}
                  onChange={(e) => setImgPrompt(e.target.value.slice(0, 500))}
                  disabled={imgLoading}
                  sx={{ "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: ORANGE },
                    "& label.Mui-focused": { color: ORANGE } }} />
                <Button variant="contained" onClick={handleGenerateImage}
                  disabled={imgLoading || !imgPrompt.trim()}
                  startIcon={imgLoading ? <CircularProgress size={16} color="inherit" /> : <ImageOutlinedIcon />}
                  sx={{ bgcolor: ORANGE, "&:hover": { bgcolor: ORANGE_DARK }, textTransform: "none",
                    whiteSpace: "nowrap", minWidth: 140, height: 40 }}>
                  {imgLoading ? "Generando…" : "Generar"}
                </Button>
              </Box>

              {imgLoading && (
                <Box sx={{ mt: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, py: 4 }}>
                  <CircularProgress sx={{ color: ORANGE }} />
                  <Typography variant="body2" color="text.secondary">
                    Generando infografía con Gemini… esto puede tardar hasta 30 segundos.
                  </Typography>
                </Box>
              )}

              {imgError && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }} onClose={() => setImgError(null)}>
                  {imgError}
                </Alert>
              )}
            </Paper>

            {/* Imagen generada */}
            {imgUrl && !imgLoading && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${BORDER}`, bgcolor: "white" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700}>Infografía generada</Typography>
                  <Button variant="outlined" size="small" startIcon={<DownloadIcon />}
                    onClick={handleDownloadImage}
                    sx={{ borderColor: ORANGE, color: ORANGE, textTransform: "none",
                      "&:hover": { bgcolor: ORANGE_SOFT } }}>
                    Descargar PNG
                  </Button>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <img src={imgUrl} alt="Infografía generada"
                    style={{ maxWidth: "100%", maxHeight: 700, borderRadius: 8,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }} />
                </Box>
              </Paper>
            )}
          </Box>
        )}
      </Box>
    </AppLayout>
  );
}
