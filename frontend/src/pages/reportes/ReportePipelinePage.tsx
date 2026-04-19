import { useEffect, useState, useCallback } from "react";
import {
  Alert, Box, Chip, CircularProgress, FormControl, Grid,
  InputLabel, MenuItem, Paper, Select,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TablePagination, TableRow, Typography,
} from "@mui/material";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";

import AppLayout from "../../layout/AppLayout";
import FiltrosBar from "./components/FiltrosBar";
import PageHeader from "./components/PageHeader";
import KpiCard from "./components/KpiCard";
import { getPipeline, downloadCsv, type DealRow } from "../../apis/reportes";

const PEN = (v: number | null) =>
  v == null ? "—" : `S/ ${Number(v).toLocaleString("es-PE", { minimumFractionDigits: 0 })}`;

const STAGE_COLOR: Record<string, "default" | "info" | "warning" | "success" | "error"> = {
  PROSPECTO: "default",
  CONTACTO: "info",
  PROPUESTA: "warning",
  NEGOCIACION: "warning",
  CERRADO: "success",
};
const STATUS_COLOR: Record<string, "default" | "success" | "error" | "info"> = {
  OPEN: "info",
  WON: "success",
  LOST: "error",
};

const today = () => new Date().toISOString().slice(0, 10);
const yearStart = () => { const d = new Date(); d.setMonth(0); d.setDate(1); return d.toISOString().slice(0, 10); };

const STAGES  = ["", "PROSPECTO","CONTACTO","PROPUESTA","NEGOCIACION","CERRADO"];
const STATUSES = ["", "OPEN","WON","LOST"];

export default function ReportePipelinePage() {
  const [rows, setRows]       = useState<DealRow[]>([]);
  const [total, setTotal]     = useState(0);
  const [pipeline, setPipeline] = useState(0);
  const [ganadas, setGanadas] = useState(0);
  const [perdidas, setPerdidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [from, setFrom]     = useState(yearStart());
  const [to, setTo]         = useState(today());
  const [q, setQ]           = useState("");
  const [dq, setDq]         = useState("");
  const [stage, setStage]   = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage]     = useState(0);
  const [size, setSize]     = useState(10);

  useEffect(() => {
    const t = setTimeout(() => setDq(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const resp = await getPipeline({
        from, to,
        stage: stage || undefined,
        status: status || undefined,
        q: dq || undefined,
        page, size,
      });
      setRows(resp.content);
      setTotal(resp.totalElements);
      setPipeline(Number(resp.totalPipelineValue));
      setGanadas(resp.dealsGanadas);
      setPerdidas(resp.dealsPerdidas);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Error al cargar pipeline");
    } finally {
      setLoading(false);
    }
  }, [from, to, dq, stage, status, page, size]);

  useEffect(() => { document.title = "Reporte Pipeline | VCM"; }, []);
  useEffect(() => { load(); }, [load]);

  const handleExport = () => downloadCsv("pipeline", { from, to, q: dq || undefined });

  return (
    <AppLayout>
      <PageHeader title="Reporte Pipeline / Deals" breadcrumb="Pipeline" />

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <KpiCard label="Valor pipeline (filtro)" value={PEN(pipeline)}
            icon={<TrendingUpOutlinedIcon fontSize="large" />} color="#f57c00" loading={loading && !total} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KpiCard label="Deals ganados" value={ganadas} color="#2e7d32" loading={loading && !total} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KpiCard label="Deals perdidos" value={perdidas} color="#c62828" loading={loading && !total} />
        </Grid>
      </Grid>

      {/* Filtros */}
      <FiltrosBar
        from={from} to={to} q={q}
        onFrom={(v) => { setFrom(v); setPage(0); }}
        onTo={(v) => { setTo(v); setPage(0); }}
        onQ={(v) => { setQ(v); setPage(0); }}
        onExport={handleExport}
      />

      {/* Filtros extra: etapa / estado */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Etapa</InputLabel>
          <Select value={stage} label="Etapa" onChange={(e) => { setStage(e.target.value); setPage(0); }}>
            {STAGES.map(s => <MenuItem key={s} value={s}>{s || "Todas"}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Estado</InputLabel>
          <Select value={status} label="Estado" onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
            {STATUSES.map(s => <MenuItem key={s} value={s}>{s || "Todos"}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ border: "1px solid #eef2f7", borderRadius: 3, overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f7f9fc" }}>
              <TableRow>
                {["Título","Cliente","Monto","Etapa","Estado","Fecha Creación"].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: "#f57c00" }} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">Sin resultados</Typography>
                  </TableCell>
                </TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontWeight: 600, maxWidth: 220 }}>{r.title}</TableCell>
                  <TableCell>{r.clientNombre ?? "—"}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{PEN(r.amount)}</TableCell>
                  <TableCell>
                    <Chip label={r.stage} size="small"
                      color={STAGE_COLOR[r.stage] ?? "default"} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={r.status} size="small"
                      color={STATUS_COLOR[r.status] ?? "default"} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString("es-PE") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={size}
          rowsPerPageOptions={[10, 20, 50]}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
          labelRowsPerPage="Filas:"
        />
      </Paper>
    </AppLayout>
  );
}
