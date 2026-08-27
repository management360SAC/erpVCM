import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import AppLayout from "../../layout/AppLayout";
import {
  getQuote,
  getQuoteItems,
  updateQuoteValidUntil,
  type QuoteResponse,
  type QuoteItemResponse,
} from "../../apis/quotes";

const STATUS_LABEL: Record<string, { label: string; color: "default" | "warning" | "success" | "error" | "info" }> = {
  BORRADOR:   { label: "Borrador",   color: "default" },
  ENVIADA:    { label: "Enviada",    color: "info" },
  APROBADA:   { label: "Aprobada",   color: "success" },
  RECHAZADA:  { label: "Rechazada",  color: "error" },
  CONVERTIDA: { label: "Convertida", color: "success" },
};

function fmtMoney(v: number | undefined, currency?: string) {
  const symbol = currency === "USD" ? "US$" : "S/";
  if (v == null) return `${symbol} 0.00`;
  return `${symbol} ${Number(v).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function EditarCotizacion() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [quote, setQuote]   = useState<QuoteResponse | null>(null);
  const [items, setItems]   = useState<QuoteItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const [validUntil, setValidUntil] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) { nav("/login"); return; }

    (async () => {
      try {
        setLoading(true);
        const [q, its] = await Promise.all([
          getQuote(Number(id)),
          getQuoteItems(Number(id)),
        ]);
        setQuote(q);
        setItems(its);
        setValidUntil(q.validUntil ?? "");
      } catch {
        setError("No se pudo cargar la cotización.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, nav]);

  const handleSave = async () => {
    if (!id) return;
    try {
      setSaving(true);
      setSaved(false);
      await updateQuoteValidUntil(Number(id), validUntil || null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("No se pudo guardar la vigencia.");
    } finally {
      setSaving(false);
    }
  };

  const st = quote ? (STATUS_LABEL[quote.status as string] ?? { label: quote.status, color: "default" as const }) : null;

  return (
    <AppLayout title="">
      {/* Header */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, border: "1px solid #eef2f7", background: "#eef6ff" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Editar Cotización {quote?.number ?? `#${id}`}
            </Typography>
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">Cotizaciones</Typography>
              <Typography
                color="primary"
                sx={{ cursor: "pointer", textDecoration: "underline" }}
                onClick={() => nav("/cotizaciones")}
              >
                Historial
              </Typography>
              <Typography color="text.primary">Editar</Typography>
            </Breadcrumbs>
          </Box>
          <Button
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            onClick={() => nav("/cotizaciones")}
          >
            Volver
          </Button>
        </Stack>
      </Paper>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "#f97316" }} />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && quote && (
        <Stack spacing={2}>
          {/* Info general */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #eef2f7" }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Información general
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Número</Typography>
                <Typography fontWeight={700}>{quote.number}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Estado</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip size="small" label={st?.label} color={st?.color} />
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Email destino</Typography>
                <Typography>{quote.emailTo ?? "—"}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Sector</Typography>
                <Typography>{quote.sector}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Subtotal</Typography>
                <Typography>{fmtMoney(quote.subTotal, quote.currency)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">IGV (18%)</Typography>
                <Typography>{fmtMoney(quote.igv, quote.currency)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Total</Typography>
                <Typography fontWeight={800} color="#f97316">{fmtMoney(quote.total, quote.currency)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Creado</Typography>
                <Typography>
                  {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString("es-PE") : "—"}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Servicios */}
          {items.length > 0 && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #eef2f7" }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Servicios cotizados
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Servicio</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Costo ({quote.currency === "USD" ? "US$" : "S/"})</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.name}</TableCell>
                      <TableCell align="right">{fmtMoney(it.cost, quote.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          <Divider />

          {/* Edición — vigencia */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #eef2f7" }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Editar vigencia
            </Typography>

            {saved && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Vigencia actualizada correctamente.
              </Alert>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "flex-end" }}>
              <TextField
                label="Fecha de vigencia"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ maxWidth: 240 }}
                helperText="Hasta cuándo es válida esta cotización"
              />
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{ bgcolor: "#f97316", "&:hover": { bgcolor: "#ea580c" }, height: 40 }}
              >
                {saving ? "Guardando…" : "Guardar vigencia"}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      )}
    </AppLayout>
  );
}
