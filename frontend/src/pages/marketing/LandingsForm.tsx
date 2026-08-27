import { useEffect, useState } from "react";
import {
  Alert, Avatar, Box, Breadcrumbs, Button, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Paper, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  TextField, Tooltip, Typography, IconButton,
} from "@mui/material";
import AppLayout from "../../layout/AppLayout";
import WebAssetOutlinedIcon from "@mui/icons-material/WebAssetOutlined";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";

type Landing = {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  leadsCount: number;
  createdAt?: string | null;
};

async function listLandings(): Promise<Landing[]> {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const res = await fetch(`/api/marketing/landings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function createLanding(name: string): Promise<void> {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const res = await fetch(`/api/marketing/landings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "No se pudo crear la landing.");
  }
}

function NuevaLandingModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (open) { setName(""); setErrorMsg(""); }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) { setErrorMsg("El nombre es requerido."); return; }
    try {
      setSaving(true);
      setErrorMsg("");
      await createLanding(name);
      onCreated();
      onClose();
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudo crear la landing.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>Nueva Landing / Formulario</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
          <TextField
            label="Nombre de la landing"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Landing Contabilidad 2026"
            fullWidth
            autoFocus
          />
          <Typography variant="caption" color="text.secondary">
            El path/slug para recibir leads (webhook) se genera automáticamente a partir del nombre.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? "Creando..." : "Crear Landing"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function LandingsForm() {
  const [rows, setRows] = useState<Landing[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true); setErrorMsg("");
      const data = await listLandings();
      setRows(data);
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudieron cargar las landings");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { document.title = "Landing / Formularios"; load(); }, []);

  const webhookPath = (slug: string) => `/api/leads/public/${slug}`;

  const copyPath = (slug: string) => {
    navigator.clipboard?.writeText(window.location.origin + webhookPath(slug));
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug((s) => (s === slug ? null : s)), 1500);
  };

  const paged = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <AppLayout title="Landing / Formularios">
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, border: "1px solid #fed7aa", background: "#fff7ed" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={800}>Landing / Formularios</Typography>
            <Breadcrumbs sx={{ mt: .5 }}>
              <Typography color="text.secondary">Marketing & Escalabilidad</Typography>
              <Typography color="text.primary">Landings</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
          Nueva Landing
        </Button>
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #eef2f7", borderRadius: 3 }}>
        <Table size="medium">
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700 } }}>
              <TableCell>#</TableCell>
              <TableCell>Landing</TableCell>
              <TableCell>Path para recibir leads</TableCell>
              <TableCell align="right">Leads capturados</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Creado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24}/></TableCell></TableRow>}
            {!loading && paged.map((r, i)=>(
              <TableRow key={r.id} hover>
                <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <WebAssetOutlinedIcon fontSize="small"/><Typography fontWeight={700}>{r.name}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                      {webhookPath(r.slug)}
                    </Typography>
                    <Tooltip title={copiedSlug === r.slug ? "¡Copiado!" : "Copiar URL completa"}>
                      <IconButton size="small" onClick={() => copyPath(r.slug)}>
                        <ContentCopyOutlinedIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
                <TableCell align="right">{r.leadsCount}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={r.active ? "Activa" : "Inactiva"}
                    color={r.active ? "success" : "default"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{r.createdAt ? new Date(r.createdAt).toLocaleString("es-PE") : "—"}</TableCell>
              </TableRow>
            ))}
            {!loading && rows.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>No hay landings registradas</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination component="div" rowsPerPageOptions={[10,20,50]} count={rows.length}
          rowsPerPage={rowsPerPage} page={page}
          onPageChange={(_,p)=>setPage(p)} onRowsPerPageChange={(e)=>{setRowsPerPage(parseInt(e.target.value,10)); setPage(0);}}
          labelRowsPerPage="Filas:" />
      </TableContainer>

      <NuevaLandingModal open={formOpen} onClose={() => setFormOpen(false)} onCreated={load} />
    </AppLayout>
  );
}
