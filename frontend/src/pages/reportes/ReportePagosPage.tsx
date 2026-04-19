import { useEffect, useState, useCallback } from "react";
import {
  Alert, Box, Chip, CircularProgress, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TablePagination, TableRow, Typography,
} from "@mui/material";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";

import AppLayout from "../../layout/AppLayout";
import FiltrosBar from "./components/FiltrosBar";
import PageHeader from "./components/PageHeader";
import KpiCard from "./components/KpiCard";
import { getPagos, downloadCsv, type PagoRow } from "../../apis/reportes";

const PEN = (v: number) =>
  `S/ ${Number(v || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

const today = () => new Date().toISOString().slice(0, 10);
const firstOfMonth = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); };

const METHOD_COLOR: Record<string, "default" | "success" | "info" | "warning"> = {
  TRANSFERENCIA: "info",
  EFECTIVO: "success",
  DEPOSITO: "info",
  TARJETA: "warning",
};

export default function ReportePagosPage() {
  const [rows, setRows]         = useState<PagoRow[]>([]);
  const [total, setTotal]       = useState(0);
  const [totalPagado, setTotalPagado] = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo]     = useState(today());
  const [q, setQ]       = useState("");
  const [dq, setDq]     = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => setDq(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const resp = await getPagos({ from, to, q: dq || undefined, page, size });
      setRows(resp.content);
      setTotal(resp.totalElements);
      setTotalPagado(Number(resp.totalPagado));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Error al cargar pagos");
    } finally {
      setLoading(false);
    }
  }, [from, to, dq, page, size]);

  useEffect(() => { document.title = "Reporte Pagos | VCM"; }, []);
  useEffect(() => { load(); }, [load]);

  const handleExport = () => downloadCsv("pagos", { from, to, q: dq || undefined });

  return (
    <AppLayout>
      <PageHeader title="Reporte de Pagos" breadcrumb="Pagos" />

      {/* KPI total */}
      <Box sx={{ mb: 2, maxWidth: 280 }}>
        <KpiCard
          label="Total pagado (filtro actual)"
          value={PEN(totalPagado)}
          sub={`${total} registros encontrados`}
          icon={<PaymentsOutlinedIcon fontSize="large" />}
          color="#2e7d32"
          loading={loading}
        />
      </Box>

      <FiltrosBar
        from={from} to={to} q={q}
        onFrom={(v) => { setFrom(v); setPage(0); }}
        onTo={(v) => { setTo(v); setPage(0); }}
        onQ={(v) => { setQ(v); setPage(0); }}
        onExport={handleExport}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ border: "1px solid #eef2f7", borderRadius: 3, overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f7f9fc" }}>
              <TableRow>
                {["N° Pago","N° Factura","Cliente","Monto","Método","Referencia","Fecha Pago"].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: "#f57c00" }} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">Sin resultados con los filtros aplicados</Typography>
                  </TableCell>
                </TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{r.number}</TableCell>
                  <TableCell>{r.invoiceNumber}</TableCell>
                  <TableCell>{r.clientNombre ?? "—"}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#2e7d32" }}>{PEN(r.amount)}</TableCell>
                  <TableCell>
                    <Chip
                      label={r.method}
                      size="small"
                      color={METHOD_COLOR[r.method] ?? "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{r.refCode ?? "—"}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {r.paidAt ? new Date(r.paidAt).toLocaleDateString("es-PE") : "—"}
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
