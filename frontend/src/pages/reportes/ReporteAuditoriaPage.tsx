import { useEffect, useState, useCallback } from "react";
import {
  Alert, Chip, CircularProgress, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TablePagination, TableRow, Typography,
} from "@mui/material";

import AppLayout from "../../layout/AppLayout";
import PageHeader from "./components/PageHeader";
import { getAuditoria, type AuditoriaRow } from "../../apis/reportes";

const KEY_COLOR: Record<string, "default"|"info"|"success"|"warning"> = {
  dashboard: "info",
  pagos: "success",
  clientes: "default",
  pipeline: "warning",
  export_pagos: "success",
  export_clientes: "default",
  export_pipeline: "warning",
};

export default function ReporteAuditoriaPage() {
  const [rows, setRows]     = useState<AuditoriaRow[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [page, setPage]     = useState(0);
  const [size, setSize]     = useState(10);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const resp = await getAuditoria({ page, size });
      setRows(resp.content);
      setTotal(resp.totalElements);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 403) {
        setError("Acceso denegado: solo ADMIN puede ver la auditoría.");
      } else {
        setError(e?.response?.data?.message || e?.message || "Error al cargar auditoría");
      }
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => { document.title = "Auditoría de Reportes | VCM"; }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <AppLayout>
      <PageHeader title="Auditoría de Reportes" breadcrumb="Auditoría" />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ border: "1px solid #eef2f7", borderRadius: 3, overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f7f9fc" }}>
              <TableRow>
                {["ID","Reporte","Usuario","Filtros usados","Fecha / Hora"].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: "#f57c00" }} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">Sin registros de auditoría</Typography>
                  </TableCell>
                </TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>
                    <Chip
                      label={r.reportKey}
                      size="small"
                      color={KEY_COLOR[r.reportKey] ?? "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{r.username}</TableCell>
                  <TableCell
                    sx={{ maxWidth: 320, overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap",
                          fontSize: 12, color: "text.secondary" }}
                    title={r.filtrosJson ?? ""}
                  >
                    {r.filtrosJson ?? "—"}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleString("es-PE")
                      : "—"}
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
