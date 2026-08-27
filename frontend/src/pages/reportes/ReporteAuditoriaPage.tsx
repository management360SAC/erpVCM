import { useEffect, useState, useCallback } from "react";
import {
  Alert, Box, Chip, CircularProgress, Paper, Stack,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TablePagination, TableRow, Tooltip, Typography,
} from "@mui/material";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";

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

const KEY_LABEL: Record<string, string> = {
  dashboard: "Tablero (Dashboard)",
  pagos: "Reporte de Pagos",
  clientes: "Reporte de Clientes",
  pipeline: "Reporte de Pipeline",
  export_pagos: "Exportación · Pagos",
  export_clientes: "Exportación · Clientes",
  export_pipeline: "Exportación · Pipeline",
};

const FIELD_LABEL: Record<string, string> = {
  from: "Desde",
  to: "Hasta",
  q: "Búsqueda",
  status: "Estado",
  sector: "Sector",
  clientId: "Cliente",
  page: "Página",
  size: "Tamaño",
};

/** Convierte el JSON crudo de filtros en pares legibles, descartando vacíos. */
function parseFiltros(json: string | null): { key: string; value: string }[] {
  if (!json) return [];
  try {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return [];
    return Object.entries(obj)
      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
      .map(([k, v]) => ({ key: FIELD_LABEL[k] ?? k, value: String(v) }));
  } catch {
    return [];
  }
}

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
              ) : rows.map((r) => {
                const filtros = parseFiltros(r.filtrosJson);
                return (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ color: "text.secondary" }}>#{r.id}</TableCell>
                    <TableCell>
                      <Chip
                        label={KEY_LABEL[r.reportKey] ?? r.reportKey}
                        size="small"
                        color={KEY_COLOR[r.reportKey] ?? "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{r.username}</TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      {filtros.length === 0 ? (
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.disabled" }}>
                          <EventBusyOutlinedIcon fontSize="inherit" />
                          <Typography variant="caption" color="text.disabled">Sin filtros aplicados</Typography>
                        </Stack>
                      ) : (
                        <Tooltip title={r.filtrosJson ?? ""} arrow>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {filtros.map((f, i) => (
                              <Chip
                                key={i}
                                size="small"
                                variant="outlined"
                                label={`${f.key}: ${f.value}`}
                                sx={{ fontSize: 11, height: 22 }}
                              />
                            ))}
                          </Box>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleString("es-PE")
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
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
