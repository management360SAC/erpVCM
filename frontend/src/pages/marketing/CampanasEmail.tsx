// src/pages/marketing/CampanasEmail.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import MailOutlineOutlinedIcon from "@mui/icons-material/MailOutlineOutlined";

import AppLayout from "../../layout/AppLayout";
import { getEmailCampaigns } from "../../apis/emailCampaigns";
import type { Campaign } from "../../types/campaign";


const pct = (v?: number | null, base = 100) =>
  `${((Number(v || 0) / base) * 100).toFixed(1)}%`;

// Mapea el estado a un color de Chip
const statusColor = (st: Campaign["status"]) => {
  switch (st) {
    case "BORRADOR":
      return "default";
    case "PROGRAMADA":
      return "info";
    case "ENVIADA":
      return "success";
    case "PAUSADA":
      return "warning";
    default:
      return "default";
  }
};

export default function CampanasEmail() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  async function load() {``
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await getEmailCampaigns(1);
      setRows(data);
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudieron cargar campañas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = "Campañas Email";
    void load();
  }, []);

  const filtered = rows.filter((r) =>
    r.name.toLowerCase().includes(q.toLowerCase())
  );
  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <AppLayout>
      {/* Header / Encabezado */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: 3,
          border: "1px solid #eef2f7",
          background: "#eef6ff",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Campañas Email
            </Typography>
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">
                Marketing & Escalabilidad
              </Typography>
              <Typography color="text.primary">Campañas</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {/* Barra de acciones */}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <TextField
          size="small"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Buscar por nombre"
          sx={{ width: 360 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={load}
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/marketing/email/nueva")}
        >
          Nueva campaña
        </Button>
      </Stack>

      {/* Error */}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMsg}
        </Alert>
      )}

      {/* Tabla principal */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid #eef2f7", borderRadius: 3 }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700 } }}>
              <TableCell width={56}>#</TableCell>
              <TableCell>Campaña</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Enviados</TableCell>
              <TableCell align="right">Aperturas</TableCell>
              <TableCell align="right">Clicks</TableCell>
              <TableCell>Programación</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              paginated.map((r, i) => (
                <TableRow key={r.id} hover>
                  <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <MailOutlineOutlinedIcon fontSize="small" />
                      <Typography fontWeight={700}>{r.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={statusColor(r.status)}
                      label={r.status}
                    />
                  </TableCell>
                  <TableCell align="right">{r.sent ?? 0}</TableCell>
                  <TableCell align="right">
                    {pct(r.opens, r.sent || 100)}
                  </TableCell>
                  <TableCell align="right">
                    {pct(r.clicks, r.sent || 100)}
                  </TableCell>
                  <TableCell>
                    {r.scheduledAt
                      ? new Date(r.scheduledAt).toLocaleString("es-PE")
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}

            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{ py: 4, color: "text.secondary" }}
                >
                  No hay campañas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 20]}
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
    </AppLayout>
  );
}
