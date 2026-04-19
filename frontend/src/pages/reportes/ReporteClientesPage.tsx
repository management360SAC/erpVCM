import { useEffect, useState, useCallback } from "react";
import {
  Alert, Box, CircularProgress, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TablePagination, TableRow, Typography,
} from "@mui/material";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";

import AppLayout from "../../layout/AppLayout";
import FiltrosBar from "./components/FiltrosBar";
import PageHeader from "./components/PageHeader";
import KpiCard from "./components/KpiCard";
import { getClientes, downloadCsv, type ClienteRow } from "../../apis/reportes";

const PEN = (v: number) =>
  `S/ ${Number(v || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

export default function ReporteClientesPage() {
  const [rows, setRows]     = useState<ClienteRow[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const [q, setQ]       = useState("");
  const [dq, setDq]     = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  useEffect(() => {
    const t = setTimeout(() => setDq(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const resp = await getClientes({ q: dq || undefined, page, size });
      setRows(resp.content);
      setTotal(resp.totalElements);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  }, [dq, page, size]);

  useEffect(() => { document.title = "Reporte Clientes | VCM"; }, []);
  useEffect(() => { load(); }, [load]);

  const handleExport = () => downloadCsv("clientes", { q: dq || undefined });

  return (
    <AppLayout>
      <PageHeader title="Reporte de Clientes" breadcrumb="Clientes" />

      <Box sx={{ mb: 2, maxWidth: 280 }}>
        <KpiCard
          label="Total clientes"
          value={total}
          sub="según filtros aplicados"
          icon={<PeopleAltOutlinedIcon fontSize="large" />}
          color="#1565c0"
          loading={loading && total === 0}
        />
      </Box>

      <FiltrosBar
        from="" to="" q={q}
        onFrom={() => {}} onTo={() => {}} onQ={(v) => { setQ(v); setPage(0); }}
        onExport={handleExport}
        showDates={false}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ border: "1px solid #eef2f7", borderRadius: 3, overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f7f9fc" }}>
              <TableRow>
                {["Razón Social","RUC/DNI","Email","Teléfono","Servicios","Total Facturado"].map(h => (
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
                  <TableCell sx={{ fontWeight: 600 }}>{r.legalName}</TableCell>
                  <TableCell>{r.taxId ?? "—"}</TableCell>
                  <TableCell>{r.email ?? "—"}</TableCell>
                  <TableCell>{r.phone ?? "—"}</TableCell>
                  <TableCell align="center">{r.serviciosCount}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: r.totalFacturado > 0 ? "#2e7d32" : "inherit" }}>
                    {PEN(r.totalFacturado)}
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
