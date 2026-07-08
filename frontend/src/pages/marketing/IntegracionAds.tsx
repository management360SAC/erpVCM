import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AppLayout from "../../layout/AppLayout";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  getMetaStatus,
  connectMeta,
  disconnectMeta,
  type MetaIntegrationResponse,
} from "../../apis/metaApi";

const META_BLUE = "#1877F2";
const META_BG = "#e7f0fd";

export default function IntegracionAds() {
  const [integration, setIntegration] = useState<MetaIntegrationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const [pageId, setPageId] = useState("");
  const [pageName, setPageName] = useState("");
  const [pageToken, setPageToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");

  const baseUrl = import.meta.env.VITE_API_BASE?.replace("/api", "") || "http://95.216.168.66:8080";
  const webhookUrl = `${baseUrl}/api/webhooks/meta`;

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await getMetaStatus();
      setIntegration(data);
      if (data.verifyToken) setVerifyToken(data.verifyToken);
    } catch {
      setError("No se pudo cargar el estado de la integración.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = "Integración Meta — Ads/Redes";
    load();
  }, []);

  async function handleConnect() {
    if (!pageId.trim() || !pageToken.trim() || !verifyToken.trim()) {
      setError("Page ID, Token de Página y Token de Verificación son obligatorios.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const data = await connectMeta({ pageId, pageName, pageAccessToken: pageToken, verifyToken });
      setIntegration(data);
      setShowForm(false);
      setSuccess("Integración con Meta conectada correctamente.");
    } catch {
      setError("No se pudo conectar con Meta. Verifica los datos.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("¿Desconectar la integración con Meta?")) return;
    try {
      await disconnectMeta();
      setIntegration((prev) => prev ? { ...prev, status: "DISCONNECTED", pageAccessToken: null } as any : prev);
      setSuccess("Integración desconectada.");
    } catch {
      setError("No se pudo desconectar.");
    }
  }

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isConnected = integration?.status === "CONNECTED";

  return (
    <AppLayout title="">
      {/* Header */}
      <Paper
        elevation={0}
        sx={{ p: 2.5, mb: 2, borderRadius: 3, border: "1px solid #eef2f7", background: META_BG }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Integración Meta (Facebook / Instagram)
            </Typography>
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">Marketing & Escalabilidad</Typography>
              <Typography color="text.primary">Integración Meta</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar sx={{ width: 56, height: 56, bgcolor: META_BLUE, fontSize: 28 }}>f</Avatar>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

      {loading ? (
        <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress /></Box>
      ) : (
        <Stack spacing={2}>
          {/* Status card */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #eef2f7" }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: META_BG,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 900,
                    color: META_BLUE,
                  }}
                >
                  f
                </Box>
                <Box>
                  <Typography fontWeight={700}>
                    {integration?.pageName || "Página de Facebook / Instagram"}
                  </Typography>
                  {integration?.pageId && (
                    <Typography variant="caption" color="text.secondary">
                      Page ID: {integration.pageId}
                    </Typography>
                  )}
                </Box>
                <Chip
                  size="small"
                  label={isConnected ? "CONECTADO" : "DESCONECTADO"}
                  color={isConnected ? "success" : "default"}
                  variant="outlined"
                  icon={isConnected ? <CheckCircleOutlineIcon /> : <LinkOffIcon />}
                />
              </Stack>

              <Stack direction="row" spacing={1}>
                <IconButton onClick={load} size="small">
                  <RefreshIcon />
                </IconButton>
                {isConnected ? (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<LinkOffIcon />}
                    onClick={handleDisconnect}
                  >
                    Desconectar
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ bgcolor: META_BLUE, "&:hover": { bgcolor: "#1565c0" } }}
                    onClick={() => setShowForm(true)}
                  >
                    Conectar Meta
                  </Button>
                )}
              </Stack>
            </Stack>

            {integration?.lastSyncAt && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Última sincronización: {new Date(integration.lastSyncAt).toLocaleString("es-PE")}
              </Typography>
            )}
          </Paper>

          {/* Formulario de conexión */}
          <Collapse in={showForm || !isConnected}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #eef2f7" }}>
              <Typography fontWeight={700} sx={{ mb: 2 }}>
                Configurar integración
              </Typography>
              <Stack spacing={2} maxWidth={540}>
                <TextField
                  label="Page ID de Facebook"
                  size="small"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  helperText="ID numérico de tu página (ej. 123456789012345)"
                  fullWidth
                />
                <TextField
                  label="Nombre de la Página (opcional)"
                  size="small"
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Page Access Token"
                  size="small"
                  value={pageToken}
                  onChange={(e) => setPageToken(e.target.value)}
                  helperText="Token de larga duración de tu página de Meta Business"
                  type="password"
                  fullWidth
                />
                <TextField
                  label="Verify Token"
                  size="small"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  helperText="Token que configurarás en el webhook de Meta (elige uno secreto)"
                  fullWidth
                />
                <Stack direction="row" spacing={1.5}>
                  <Button variant="outlined" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: META_BLUE, "&:hover": { bgcolor: "#1565c0" } }}
                    onClick={handleConnect}
                    disabled={saving}
                  >
                    {saving ? "Conectando..." : "Conectar"}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Collapse>

          {/* Webhook URL */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #eef2f7" }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Typography fontWeight={700}>URL del Webhook</Typography>
              <Tooltip title="Copia esta URL y configúrala en Meta for Developers → tu App → Webhooks → Lead Gen">
                <InfoOutlinedIcon fontSize="small" color="action" />
              </Tooltip>
            </Stack>
            <TextField
              size="small"
              fullWidth
              value={webhookUrl}
              inputProps={{ readOnly: true }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={copied ? "¡Copiado!" : "Copiar"}>
                      <IconButton size="small" onClick={copyWebhook}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
          </Paper>

          {/* Instrucciones */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #eef2f7", bgcolor: "#fafafa" }}>
            <Typography fontWeight={700} sx={{ mb: 1.5 }}>
              Cómo conectar paso a paso
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Stack spacing={1}>
              {[
                "Ve a developers.facebook.com → Mi App → Webhooks.",
                "Agrega un nuevo webhook de tipo \"Lead Gen\".",
                `Pega la URL del webhook de arriba y el Verify Token que configuraste.`,
                "Suscríbete al evento \"leadgen\" de tu Página.",
                "Ingresa aquí el Page ID, el Page Access Token y el mismo Verify Token, luego pulsa Conectar.",
                "¡Listo! Cada nuevo lead de tus anuncios de Meta se creará automáticamente en el CRM.",
              ].map((step, i) => (
                <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                  <Box
                    sx={{
                      minWidth: 24,
                      height: 24,
                      borderRadius: "50%",
                      bgcolor: META_BLUE,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                      mt: 0.1,
                    }}
                  >
                    {i + 1}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {step}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Stack>
      )}
    </AppLayout>
  );
}
