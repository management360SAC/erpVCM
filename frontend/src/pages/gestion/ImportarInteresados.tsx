import React, { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AppLayout from "../../layout/AppLayout";
import {
  ejecutarImport,
  ImportPreviewResponse,
  ImportPreviewRow,
  ImportResultResponse,
  previewImport,
} from "../../apis/importApi";

const STAGE_LABELS: Record<string, { label: string; color: "default" | "warning" | "success" | "error" }> = {
  CERRADO_GANADO:  { label: "Venta Ganada",     color: "success" },
  CERRADO_PERDIDO: { label: "Venta Perdida",     color: "error"   },
  PROPUESTA:       { label: "Propuesta enviada", color: "warning" },
  PROSPECTO:       { label: "Prospecto",         color: "default" },
};

export default function ImportarInteresados() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile]       = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [result,  setResult]  = useState<ImportResultResponse | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [expandIgnorados, setExpandIgnorados] = useState(false);
  const [expandDetalle,   setExpandDetalle]   = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await previewImport(file);
      setPreview(data);
      setResult(null);
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Error al leer el archivo");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ejecutarImport(file);
      setResult(data);
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Error durante la importación");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1100, mx: "auto", p: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
          <UploadFileIcon sx={{ color: "primary.main", fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Importación Masiva de Interesados
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Carga el Excel "GC.FO.02-01 Seguimiento de Interesados" para crear clientes y deals en el CRM
            </Typography>
          </Box>
        </Stack>

        {/* STEP 1: Seleccionar archivo */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            1. Selecciona el archivo Excel
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => fileRef.current?.click()}
            >
              Seleccionar archivo (.xlsx)
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            {file && (
              <Chip
                label={file.name}
                onDelete={resetAll}
                color="primary"
                variant="outlined"
              />
            )}
            {file && !preview && !result && (
              <Button
                variant="contained"
                onClick={handlePreview}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : undefined}
              >
                {loading ? "Analizando..." : "Analizar archivo"}
              </Button>
            )}
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* STEP 2: Preview */}
        {preview && !result && (
          <>
            {/* Resumen */}
            <Paper variant="outlined" sx={{ p: 3, mb: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                2. Resumen del análisis
              </Typography>
              <Stack direction="row" spacing={3} flexWrap="wrap">
                <KpiBox label="Filas encontradas" value={preview.totalFilas} color="#f57c00" />
                <KpiBox label="Clientes / Deals a procesar" value={preview.filasValidas} color="#2e7d32" />
                <KpiBox
                  label="Ganadas → WON"
                  value={preview.filas.filter(f => f.stageCrm === "CERRADO_GANADO").length}
                  color="#1565c0"
                />
                <KpiBox
                  label="Perdidas → LOST"
                  value={preview.filas.filter(f => f.stageCrm === "CERRADO_PERDIDO").length}
                  color="#b71c1c"
                />
                <KpiBox
                  label="En propuesta"
                  value={preview.filas.filter(f => f.stageCrm === "PROPUESTA").length}
                  color="#e65100"
                />
              </Stack>
            </Paper>

            {/* Columnas NO importadas */}
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: "#fff8f0" }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                onClick={() => setExpandIgnorados(v => !v)}
                sx={{ cursor: "pointer" }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <InfoIcon sx={{ color: "#f57c00", fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={700} color="#f57c00">
                    Columnas del Excel que NO se importan ({preview.columnasNoImportadas.length})
                  </Typography>
                </Stack>
                <IconButton size="small">
                  {expandIgnorados ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Stack>
              <Collapse in={expandIgnorados}>
                <Box mt={1}>
                  {preview.columnasNoImportadas.map((col, i) => (
                    <Typography key={i} variant="body2" color="text.secondary" sx={{ mb: 0.5, pl: 1 }}>
                      • {col}
                    </Typography>
                  ))}
                </Box>
              </Collapse>
            </Paper>

            {/* Tabla de preview — todos los campos */}
            <Paper variant="outlined" sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#5a5a5a" }}>
                      {[
                        "Fila","Razón Social","Sector","Tipo","Contacto","Servicio",
                        "F. Cot.","Nº Cot. Ext.","F. Aprob.","Contrato/OS",
                        "Monto","Stage CRM","Notas","Factura","Cobro","Saldo","Cliente"
                      ].map(h => (
                        <TableCell key={h} sx={{ color: "white", fontWeight: 700, whiteSpace: "nowrap", fontSize: 11 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.filas.map((row: ImportPreviewRow) => (
                      <TableRow key={row.fila} hover>
                        <TableCell sx={{ color: "#9e9e9e", fontSize: 10 }}>{row.fila}</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 11, maxWidth: 140, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Tooltip title={row.razonSocial}><span>{row.razonSocial}</span></Tooltip>
                        </TableCell>
                        <TableCell sx={{ fontSize: 10 }}>
                          <Chip label={row.sector ?? "—"} size="small"
                            color={row.sector === "PUBLICO" ? "info" : row.sector === "PRIVADO" ? "default" : "default"}
                            variant="outlined" sx={{ fontSize: 9 }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: 10 }}>
                          {row.tipoServicio ? <Chip label={row.tipoServicio} size="small" sx={{ fontSize: 9 }} /> : "—"}
                        </TableCell>
                        <TableCell sx={{ fontSize: 10, maxWidth: 120, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Tooltip title={row.contacto ?? ""}>
                            <span>{row.emailDetectado ? `📧 ${row.emailDetectado}` : (row.contacto ?? "—")}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ fontSize: 10, maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Tooltip title={row.detalleServicio ?? ""}><span>{row.detalleServicio ?? "—"}</span></Tooltip>
                        </TableCell>
                        <TableCell sx={{ fontSize: 10, whiteSpace: "nowrap" }}>{row.fechaCotizacion ?? "—"}</TableCell>
                        <TableCell sx={{ fontSize: 10 }}>{row.nroCotizacionExterno ?? "—"}</TableCell>
                        <TableCell sx={{ fontSize: 10, whiteSpace: "nowrap" }}>{row.fechaAprobacion ?? "—"}</TableCell>
                        <TableCell sx={{ fontSize: 10, maxWidth: 100, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Tooltip title={row.nroContrato ?? ""}><span>{row.nroContrato ?? "—"}</span></Tooltip>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap", fontSize: 11, fontWeight: 600 }}>
                          {row.precioSoles != null
                            ? `S/ ${row.precioSoles.toLocaleString()}`
                            : row.precioUsd != null
                            ? `$${row.precioUsd.toLocaleString()}`
                            : "—"}
                          {row.monedaUsada === "USD" && <Typography variant="caption" color="warning.main"> USD</Typography>}
                        </TableCell>
                        <TableCell>
                          <Chip label={STAGE_LABELS[row.stageCrm]?.label ?? row.stageCrm}
                            color={STAGE_LABELS[row.stageCrm]?.color ?? "default"} size="small" />
                        </TableCell>
                        <TableCell sx={{ fontSize: 10, maxWidth: 140, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Tooltip title={row.notas ?? ""}><span>{row.notas ?? "—"}</span></Tooltip>
                        </TableCell>
                        <TableCell sx={{ fontSize: 10 }}>{row.factura ?? "—"}</TableCell>
                        <TableCell sx={{ fontSize: 10, whiteSpace: "nowrap" }}>
                          {row.cobro != null ? `S/ ${row.cobro.toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell sx={{ fontSize: 10, whiteSpace: "nowrap" }}>
                          {row.saldoCobrar != null ? `S/ ${row.saldoCobrar.toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell>
                          <Chip label={row.clienteExistente ? "Existente" : "Nuevo"}
                            color={row.clienteExistente ? "default" : "success"}
                            size="small" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Paper>

            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
              Todos los campos del Excel se importan al CRM. Solo se omite el N° de fila (columna A).
              Sector y Tipo de Servicio se guardan en el cliente y deal respectivamente.
              Factura, Cobro y Saldo quedan registrados como referencia en el deal.
            </Typography>

            {/* Botón confirmar */}
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={resetAll}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleImport}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                size="large"
              >
                {loading ? "Importando..." : `Confirmar e importar ${preview.filasValidas} registros`}
              </Button>
            </Stack>
          </>
        )}

        {/* STEP 3: Resultado */}
        {result && (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
              <CheckCircleIcon sx={{ color: "success.main", fontSize: 28 }} />
              <Typography variant="h6" fontWeight={700}>
                Importación completada
              </Typography>
            </Stack>

            <Stack direction="row" spacing={3} mb={3} flexWrap="wrap">
              <KpiBox label="Total procesadas" value={result.totalProcesadas} color="#5a5a5a" />
              <KpiBox label="Exitosas" value={result.exitosas} color="#2e7d32" />
              {result.fallidas > 0 && (
                <KpiBox label="Con error" value={result.fallidas} color="#b71c1c" />
              )}
            </Stack>

            <Alert severity={result.fallidas === 0 ? "success" : "warning"} sx={{ mb: 2 }}>
              {result.fallidas === 0
                ? `Se importaron ${result.exitosas} registros correctamente. Los clientes y deals ya están disponibles en el CRM.`
                : `${result.exitosas} registros importados, ${result.fallidas} con errores. Revisa el detalle.`}
            </Alert>

            {/* Detalle colapsable */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              onClick={() => setExpandDetalle(v => !v)}
              sx={{ cursor: "pointer", mb: 1 }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                Ver detalle por fila
              </Typography>
              <IconButton size="small">
                {expandDetalle ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Stack>
            <Collapse in={expandDetalle}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Fila</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Detalle</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Cliente ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Deal ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.detalle.map(r => (
                    <TableRow key={r.fila}>
                      <TableCell>{r.fila}</TableCell>
                      <TableCell>
                        {r.exito
                          ? <CheckCircleIcon sx={{ color: "success.main", fontSize: 18 }} />
                          : <ErrorIcon sx={{ color: "error.main", fontSize: 18 }} />}
                      </TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.mensaje}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.clienteId ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.dealId ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Collapse>

            <Divider sx={{ my: 2 }} />
            <Button variant="outlined" onClick={resetAll}>
              Importar otro archivo
            </Button>
          </Paper>
        )}
      </Box>
    </AppLayout>
  );
}

function KpiBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Box sx={{ textAlign: "center", minWidth: 100 }}>
      <Typography variant="h4" fontWeight={700} sx={{ color }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
