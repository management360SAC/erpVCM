// src/pages/cotizaciones/NuevaCotizacion.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar, Box, Breadcrumbs, Button, Card, CardActionArea, CardContent,
  Checkbox, CircularProgress, Paper, Stack, Step, StepLabel, Stepper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography, InputAdornment, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, Autocomplete
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import AppLayout from "../../layout/AppLayout";
import { type ServiceResponse, getServices } from "../../apis/service";
import {
  createClient,
  type CreateClientRequest,
  type ClientResponse,
  getClients,
} from "../../apis/client";
import { sendQuoteEmail } from "../../apis/quotes";

/** ------------------ Tipos locales ------------------ */
// Ampliamos el formulario del cliente para incluir validUntil aquí en el front.
type ClientForm = Partial<CreateClientRequest> & {
  orgId: number;
  sectorId: number | null;
  sizeId: number | null;
  legalName: string;
  taxId?: string;
  email?: string;
  phone?: string;
  validUntil?: string; // 👈 nueva fecha de vigencia en el front
};

type SectorType = "PRIVADO" | "PUBLICO" | null;

const fmtSoles = (n: number) =>
  `S/ ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ---------- Beneficios (catálogo) ---------- */
type CategoryKey =
  | "ASESORIA_FISCAL_LABORAL"
  | "GESTION_CONTABLE"
  | "CAMBIO_ESTRATEGIAS"
  | "AUDITORIA_PERITAJES"
  | "OPTIMIZACION_PROCESOS"
  | "CONTROL_INTERNO_GOBIERNO"
  | "NEGOCIOS_FAMILIARES"
  | "LIQUIDACION_TECNICA_FINANCIERA"
  | "OTROS";

const CATEGORY_LABEL: Record<CategoryKey, string> = {
  ASESORIA_FISCAL_LABORAL: "ASESORÍA FISCAL Y LABORAL",
  GESTION_CONTABLE: "ASESORÍA EN GESTIÓN CONTABLE",
  CAMBIO_ESTRATEGIAS: "CAMBIO DE ESTRATEGIAS",
  AUDITORIA_PERITAJES: "AUDITORÍA Y PERITAJES CONTABLES",
  OPTIMIZACION_PROCESOS: "OPTIMIZACIÓN DE PROCESOS CONTABLES",
  CONTROL_INTERNO_GOBIERNO: "CONTROL INTERNO Y GOBIERNO CORPORATIVO",
  NEGOCIOS_FAMILIARES: "ASESORÍA EN NEGOCIOS FAMILIARES",
  LIQUIDACION_TECNICA_FINANCIERA: "LIQUIDACIÓN TÉCNICA Y FINANCIERA",
  OTROS: "OTROS SERVICIOS",
};

const BENEFITS_BY_CATEGORY: Record<CategoryKey, string[]> = {
  ASESORIA_FISCAL_LABORAL: [
    "Reducir contingencias y multas tributarias/laborales.",
    "Revisión mensual de impuestos y obligaciones.",
    "Acompañamiento ante SUNAT y fiscalizaciones.",
    "Mejora del cumplimiento y trazabilidad de obligaciones.",
  ],
  GESTION_CONTABLE: [
    "Outsourcing contable eficiente y trazable.",
    "Modelo tributario alineado con contabilidad (cruces automáticos).",
    "Alertas de desviaciones financieras y aplicación de NIIF.",
    "Reportes para gerencia: ratios y estados financieros oportunos.",
  ],
  CAMBIO_ESTRATEGIAS: [
    "Plan estratégico para mayor rentabilidad y posicionamiento.",
    "Gestión de financiamiento (preparación de file bancario).",
    "Controles previos a inversiones y análisis de impacto.",
  ],
  AUDITORIA_PERITAJES: [
    "Validación independiente de información financiera.",
    "Detección de fraudes y brechas de control.",
    "Cumplimiento legal y regulatorio frente a auditorías.",
  ],
  OPTIMIZACION_PROCESOS: [
    "Estandarización de políticas y procedimientos contables.",
    "Instructivos operativos para reducir tiempos de entrega.",
    "Integración de áreas (proveedores, pagos, RR.HH., activos).",
  ],
  CONTROL_INTERNO_GOBIERNO: [
    "Auditorías inopinadas y arqueos de caja.",
    "Revisión de brechas de seguridad de la información.",
    "Gobierno corporativo alineado a normativas y mejores prácticas.",
  ],
  NEGOCIOS_FAMILIARES: [
    "Profesionalización de la empresa familiar.",
    "Plan de sucesión y continuidad.",
    "Controles para flujo de caja y resguardo patrimonial.",
  ],
  LIQUIDACION_TECNICA_FINANCIERA: [
    "Sinceramiento de obras en curso y valorizaciones según NIIF.",
    "Reducción de pérdidas patrimoniales por registros incorrectos.",
    "Información financiera actualizada para toma de decisiones.",
  ],
  OTROS: [
    "Optimización de tiempos administrativos.",
    "Información confiable para decisiones.",
  ],
};

/* ---------- Heurística simple de categoría ---------- */
function classifyCategoryByName(name?: string): CategoryKey {
  const n = (name || "").toLowerCase();
  if (/(fiscal|tribut|sunat|laboral)/.test(n)) return "ASESORIA_FISCAL_LABORAL";
  if (/(contable|outsourcing|niif)/.test(n)) return "GESTION_CONTABLE";
  if (/(estrateg|mercad|financiamient|plan)/.test(n)) return "CAMBIO_ESTRATEGIAS";
  if (/(auditor|perit|due diligence|fraude)/.test(n)) return "AUDITORIA_PERITAJES";
  if (/(optimiz|proceso|procedimiento|instructivo|portal)/.test(n)) return "OPTIMIZACION_PROCESOS";
  if (/(control interno|gobierno|arqueo|seguridad|patrimonial)/.test(n)) return "CONTROL_INTERNO_GOBIERNO";
  if (/(familiar|sucesión|patrimonial)/.test(n)) return "NEGOCIOS_FAMILIARES";
  if (/(liquidaci|valoriz|obras en curso)/.test(n)) return "LIQUIDACION_TECNICA_FINANCIERA";
  return "OTROS";
}

/* =================== Utiles para PDF multipágina =================== */
function drawOrangeCornersOn(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const S = 95; // ~25mm a escala de captura 2x
  ctx.save();
  ctx.fillStyle = "#f97316";
  // esquina superior derecha
  ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(w - S, 0); ctx.lineTo(w, S); ctx.closePath(); ctx.fill();
  // esquina inferior izquierda
  ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(S, h); ctx.lineTo(0, h - S); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function hideByClass(root: HTMLElement, className: string) {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(`.${className}`));
  const originals = nodes.map((n) => n.style.display);
  nodes.forEach((n) => (n.style.display = "none"));
  return () => nodes.forEach((n, i) => (n.style.display = originals[i]));
}

async function makeA4PdfFromNode(node: HTMLElement): Promise<Blob> {
  const restore = hideByClass(node, "corner-decor");
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    windowWidth: node.scrollWidth,
  });
  restore();

  const A4_W = 210, A4_H = 297, MARGIN = 10;
  const imgWmm = A4_W - MARGIN * 2;
  const pxToMm = imgWmm / canvas.width;
  const usableHmm = A4_H - MARGIN * 2;
  const sliceHeightPx = Math.floor(usableHmm / pxToMm) - 20; // padding de seguridad

  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });

  let yPx = 0; let first = true;
  while (yPx < canvas.height) {
    const slicePx = Math.min(sliceHeightPx, canvas.height - yPx);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width; pageCanvas.height = slicePx;
    const ctx = pageCanvas.getContext("2d")!;
    ctx.drawImage(canvas, 0, yPx, canvas.width, slicePx, 0, 0, canvas.width, slicePx);
    drawOrangeCornersOn(ctx, pageCanvas.width, pageCanvas.height);
    const imgData = pageCanvas.toDataURL("image/png");
    const imgHmm = slicePx * pxToMm;
    if (!first) pdf.addPage();
    pdf.addImage(imgData, "PNG", MARGIN, MARGIN, imgWmm, imgHmm, undefined, "FAST");
    first = false;
    yPx += sliceHeightPx;
  }
  return pdf.output("blob");
}

/* =================== Componente =================== */
export default function NuevaCotizacion() {
  const nav = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const steps = ["Seleccionar Sector", "Elegir Servicios", "Datos del Cliente", "Previsualizar Cotización"];
  const [sector, setSector] = useState<SectorType>(null);

  // Servicios + costos
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceCosts, setServiceCosts] = useState<Record<number, number>>({});

  // Cliente + listado (para Autocomplete)
  const [clientsList, setClientsList] = useState<ClientResponse[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Form local (incluye validUntil)
  const [form, setForm] = useState<ClientForm>({
    orgId: 1,
    legalName: "",
    taxId: "",
    sectorId: null,
    sizeId: null,
    email: "",
    phone: "",
    validUntil: "", // 👈 nueva propiedad en el formulario del front
  });

  const [client, setClient] = useState<ClientResponse | null>(null);
  const [saving, setSaving] = useState(false);

  // Envío (modales)
  const [sending, setSending] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultOk, setResultOk] = useState<boolean | null>(null);
  const [resultMsg, setResultMsg] = useState<string>("");

  // Preview
  const previewRef = useRef<HTMLDivElement>(null);

  // Auth guard
  useEffect(() => {
    document.title = "Nueva Cotización";
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) nav("/login");
  }, [nav]);

  // Cargar servicios
  useEffect(() => {
    if (activeStep === 1 && services.length === 0) void fetchServices();
  }, [activeStep]); // eslint-disable-line

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const data = await getServices({ onlyActive: true });
      setServices(data);
    } finally {
      setLoadingServices(false);
    }
  };

  // Cargar clientes para el Autocomplete en Paso 3
  useEffect(() => {
    if (activeStep === 2 && clientsList.length === 0) void fetchClients();
  }, [activeStep]); // eslint-disable-line

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const data = await getClients();
      setClientsList(data || []);
    } finally {
      setLoadingClients(false);
    }
  };

  const filteredServices = services.filter((s) =>
    (s.name ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedServicesData = services.filter((s) => selectedServices.includes(s.id!));

  const toggleService = (id: number, base?: number) => {
    setSelectedServices((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        const { [id]: _, ...rest } = serviceCosts;
        setServiceCosts(rest);
        return prev.filter((x) => x !== id);
      } else {
        setServiceCosts((old) => ({ ...old, [id]: old[id] ?? (base ?? 0) }));
        return [...prev, id];
      }
    });
  };

  const handleCostChange = (id: number, value: string) => {
    const clean = Number(value.replace(/[^0-9.]/g, ""));
    setServiceCosts((prev) => ({ ...prev, [id]: isNaN(clean) ? 0 : clean }));
  };

  const subTotal = selectedServicesData.reduce(
    (sum, s) => sum + (serviceCosts[s.id!] ?? s.basePrice ?? 0), 0
  );
  const igv = subTotal * 0.18;
  const total = subTotal + igv;

  /* ---------- Validaciones SOLO de los campos visibles ---------- */
  const clientErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!form.legalName?.trim()) errs.legalName = "Razón social requerida";
    if (form.taxId && !form.taxId.match(/^\d{11}$/)) errs.taxId = "RUC inválido (11 dígitos)";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Email inválido";
    return errs;
  }, [form]);

  const canSaveClient = Object.keys(clientErrors).length === 0;

  // Cuando eliges o escribes en el Autocomplete de Razón Social
  const handleSelectClient = (value: string | ClientResponse | null) => {
    if (typeof value === "string") {
      setClient(null);
      setForm((f) => ({ ...f, legalName: value }));
    } else if (value) {
      setClient(value);
      setForm((f) => ({
        ...f,
        legalName: value.legalName || "",
        taxId: value.taxId || "",
        email: value.email || "",
        phone: value.phone || "",
      }));
    } else {
      setClient(null);
      setForm({
        orgId: 1,
        legalName: "",
        taxId: "",
        email: "",
        phone: "",
        sectorId: null,
        sizeId: null,
        validUntil: "",
      });
    }
  };

  const handleNext = async () => {
    if (activeStep === 1 && selectedServices.length === 0) {
      setResultOk(false);
      setResultMsg("Debes seleccionar al menos un servicio.");
      setResultOpen(true);
      return;
    }

    if (activeStep === 2 && !client) {
      if (!canSaveClient) {
        setResultOk(false);
        setResultMsg("Completa los datos del cliente correctamente.");
        setResultOpen(true);
        return;
      }
      try {
        setSaving(true);
        const saved = await createClient({
          orgId: form.orgId!,
          legalName: form.legalName!,
          taxId: form.taxId || "",
          sectorId: form.sectorId,
          sizeId: form.sizeId,
          email: form.email || "",
          phone: form.phone || "",
        } as CreateClientRequest);
        setClient(saved);
      } catch (e: any) {
        setResultOk(false);
        setResultMsg(e?.response?.data?.message || "No se pudo guardar el cliente (verifica RUC único).");
        setResultOpen(true);
        return;
      } finally {
        setSaving(false);
      }
    }

    if (activeStep === 2) {
      const defaultTo = (client?.email || form.email || "").trim();
      if (!defaultTo) {
        setResultOk(false);
        setResultMsg("Ingresa un correo válido para enviar la cotización.");
        setResultOpen(true);
        return;
      }
    }

    setActiveStep((p) => p + 1);
  };

  const handleBack = () => setActiveStep((p) => Math.max(p - 1, 0));

  const handleSendQuote = async () => {
    const sendToEmail = (client?.email || form.email || "").trim();

    if (!client && !canSaveClient) {
      setResultOk(false);
      setResultMsg("Primero completa y guarda los datos del cliente.");
      setResultOpen(true);
      return;
    }
    if (!sendToEmail || !/^\S+@\S+\.\S+$/.test(sendToEmail)) {
      setResultOk(false);
      setResultMsg("Ingresa un correo válido para enviar la cotización.");
      setResultOpen(true);
      return;
    }
    if (!previewRef.current) {
      setResultOk(false);
      setResultMsg("No se encontró la previsualización para generar el PDF.");
      setResultOpen(true);
      return;
    }

    try {
      setSending(true);
      const blob = await makeA4PdfFromNode(previewRef.current);
      const filename = `COT-${client?.id ?? "preview"}.pdf`;

      const payload = {
        clientId: client?.id ?? null,
        sendTo: sendToEmail,
        items: selectedServicesData.map((s) => ({
          serviceId: s.id!,
          cost: serviceCosts[s.id!] ?? s.basePrice ?? 0,
          name: s.name,
        })),
        totals: { subTotal, igv, total },
        meta: {
          orgId: form.orgId,
          sector: (sector as "PRIVADO" | "PUBLICO") || "PRIVADO",
        },
        validUntil: form.validUntil || null, // 👈 se envía al backend
      };

      await sendQuoteEmail(payload, blob, filename);

      setResultOk(true);
      setResultMsg("Cotización enviada correctamente al correo.");
      setResultOpen(true);
    } catch (e: any) {
      console.error(e);
      setResultOk(false);
      setResultMsg(e?.response?.data?.message || "No se pudo enviar la cotización.");
      setResultOpen(true);
    } finally {
      setSending(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    const blob = await makeA4PdfFromNode(previewRef.current);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `COT-${client?.id ?? "preview"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredClients = useMemo(() => {
    return clientsList.sort((a, b) =>
      (a.legalName || "").localeCompare(b.legalName || "", "es", { sensitivity: "base" })
    );
  }, [clientsList]);

  return (
    <AppLayout title="">
      {/* Header */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, border: "1px solid #eef2f7", background: "#eef6ff" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={800}>Nueva Cotización</Typography>
            <Breadcrumbs sx={{ mt: .5 }}>
              <Typography color="text.secondary">Cotizaciones</Typography>
              <Typography color="text.primary">Nueva Cotización</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {/* Stepper */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: "1px solid #eef2f7" }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
      </Paper>

      {/* PASO 1 */}
      {activeStep === 0 && (
        <Stack direction="row" spacing={3} sx={{ maxWidth: 900 }}>
          {(["PRIVADO", "PUBLICO"] as SectorType[]).map((s) => (
            <Card
              key={s}
              onClick={() => {
                setSector(s);
                setForm((f) => ({ ...f, sectorId: s === "PRIVADO" ? 1 : 2 }));
                setActiveStep(1);
              }}
              sx={{
                flex: 1,
                border: sector === s ? "2px solid #1976d2" : "2px solid transparent",
                borderRadius: 3,
                "&:hover": { boxShadow: 3 },
              }}
            >
              <CardActionArea sx={{ p: 4 }}>
                <CardContent sx={{ textAlign: "center" }}>
                  {s === "PRIVADO" ? (
                    <BusinessIcon sx={{ fontSize: 80, color: "primary.main" }} />
                  ) : (
                    <AccountBalanceIcon sx={{ fontSize: 80, color: "success.main" }} />
                  )}
                  <Typography variant="h5" fontWeight={700}>
                    {s === "PRIVADO" ? "Sector Privado" : "Sector Público"}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}

      {/* PASO 2 */}
      {activeStep === 1 && (
        <Box>
          <Typography variant="h6" fontWeight={700}>Selecciona los servicios y define el costo</Typography>
          <TextField
            placeholder="Buscar servicio..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
            sx={{ my: 2 }}
          />
          {loadingServices ? (
            <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width={56}></TableCell>
                    <TableCell>Servicio</TableCell>
                    <TableCell align="right" width={220}>Costo (S/)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredServices.map((s) => {
                    const checked = selectedServices.includes(s.id!);
                    const cost = serviceCosts[s.id!] ?? s.basePrice ?? 0;
                    return (
                      <TableRow key={s.id} hover>
                        <TableCell onClick={() => toggleService(s.id!, s.basePrice)} sx={{ cursor: "pointer" }}>
                          <Checkbox checked={checked} />
                        </TableCell>
                        <TableCell onClick={() => toggleService(s.id!, s.basePrice)} sx={{ cursor: "pointer" }}>
                          {s.name}
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            value={cost}
                            onChange={(e) => handleCostChange(s.id!, e.target.value)}
                            inputProps={{ inputMode: "decimal" }}
                            disabled={!checked}
                            sx={{ width: 180 }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={2} align="right" sx={{ fontWeight: 700 }}>Subtotal:</TableCell>
                    <TableCell align="right">{fmtSoles(subTotal)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={2} align="right" sx={{ fontWeight: 700 }}>IGV (18%):</TableCell>
                    <TableCell align="right">{fmtSoles(igv)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={2} align="right" sx={{ fontWeight: 800 }}>Total:</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>{fmtSoles(total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* PASO 3 (con Autocomplete y Fecha de Vigencia) */}
      {activeStep === 2 && (
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Datos del Cliente y Vigencia</Typography>

          <Stack spacing={2} sx={{ maxWidth: 900 }}>
            <Autocomplete
              freeSolo
              loading={loadingClients}
              options={filteredClients}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.legalName || ""
              }
              value={client || form.legalName}
              onChange={(_, val) => handleSelectClient(val)}
              onInputChange={(_, val) => {
                if (typeof val === "string") setForm((f) => ({ ...f, legalName: val }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Razón Social"
                  error={!!clientErrors.legalName}
                  helperText={clientErrors.legalName}
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingClients ? <CircularProgress size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={(option as ClientResponse).id ?? (option as any)}>
                  {typeof option === "string"
                    ? option
                    : `${option.legalName ?? ""}${option.taxId ? ` — RUC: ${option.taxId}` : ""}`}
                </li>
              )}
            />

            <TextField
              label="RUC"
              value={form.taxId ?? ""}
              onChange={(e) => setForm({ ...form, taxId: e.target.value.replace(/\D/g, "") })}
              error={!!clientErrors.taxId}
              helperText={clientErrors.taxId}
              fullWidth
            />

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Correo"
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={!!clientErrors.email}
                helperText={clientErrors.email}
                fullWidth
              />
              <TextField
                label="Teléfono"
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                fullWidth
              />
            </Stack>

            {/* Nuevo campo: Fecha de Vigencia */}
            <TextField
              label="Fecha de Vigencia de la Cotización"
              type="date"
              value={form.validUntil || ""}
              onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Selecciona hasta qué fecha es válida esta cotización."
            />
          </Stack>
        </Box>
      )}

      {/* PASO 4: Previsualización */}
      {activeStep === 3 && (
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Previsualización</Typography>

          <Box
            ref={previewRef}
            sx={{
              background: "#fff",
              position: "relative",
              width: "210mm",
              minHeight: "297mm",
              p: 0,
              borderRadius: 2,
              boxShadow: 1,
              overflow: "hidden",
              margin: "0 auto",
            }}
          >
            {/* Esquinas visibles solo en la preview */}
            <Box className="corner-decor" sx={{
              position: "absolute", top: 0, right: 0, width: 0, height: 0,
              borderStyle: "solid", borderWidth: "0 35mm 35mm 0",
              borderColor: "transparent #f97316 transparent transparent", zIndex: 1
            }} />
            <Box className="corner-decor" sx={{
              position: "absolute", bottom: 0, left: 0, width: 0, height: 0,
              borderStyle: "solid", borderWidth: "35mm 0 0 35mm",
              borderColor: "transparent transparent transparent #f97316", zIndex: 1
            }} />

            {/* Logo inferior */}
            <Box sx={{ position: "absolute", bottom: 20, right: 20, zIndex: 2 }}>
              <img src="/marca-secundaria.png" alt="VCM" style={{ height: 52, opacity: 0.9 }} />
            </Box>

            {/* Contenido */}
            <Box sx={{ position: "relative", zIndex: 2, p: 6, pt: 5 }}>
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <img src="/marca-secundaria.png" alt="VCM" style={{ height: 80 }} />
              </Box>

              {/* Carta */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: "#4b5563", fontSize: "0.95rem", mb: 0.5 }}>
                  Estimados Señores
                </Typography>
                <Typography variant="body2" sx={{ mb: 2.5, fontWeight: 700, fontSize: "0.95rem" }}>
                  {client?.legalName || form.legalName || "—"}
                </Typography>

                <Typography paragraph sx={{ textAlign: "justify", fontSize: "0.92rem", lineHeight: 1.6 }}>
                  Con sumo agrado, recibimos la invitación para presentar nuestra
                  propuesta de servicios profesionales para su prestigiosa empresa
                  (En adelante la Compañía). El éxito de nuestros clientes siempre
                  ha sido una prioridad para nuestra firma y estamos totalmente
                  comprometidos a ayudarlos a lograr su objetivo. Nuestra
                  consultoría está enfocada en darle solución a medida, pero lo más
                  importante es generar valor con el cumplimiento de sus
                  entregables de manera eficiente y con altos estándares de
                  calidad.
                </Typography>

                <Typography paragraph sx={{ textAlign: "justify", fontSize: "0.92rem", lineHeight: 1.6 }}>
                  Asumimos esta oportunidad con un alto sentido de responsabilidad y
                  tengan la certeza que destinaremos nuestros mejores recursos para
                  contribuir desde nuestras funciones a acompañarlos en su
                  crecimiento.
                </Typography>

                <Typography paragraph sx={{ textAlign: "justify", fontSize: "0.92rem", lineHeight: 1.6 }}>
                  Nuestros socios asignados cuentan con un alto índice de conocimiento y
                  experiencia no solo a nivel local respecto a su sector, sino también internacional;
                  nos enfocamos en realizar consultorías con herramientas modernas usando la
                  tecnología tanto en el ámbito financiero, contable, laboral y fiscal, que incluye
                  el modelamiento de procesos para grupos económicos.
                </Typography>

                <Typography paragraph sx={{ textAlign: "justify", fontSize: "0.92rem", lineHeight: 1.6 }}>
                  Presentamos a nuestra empresa VCM (GRUPO VCM S.A.C.) y su plataforma de servicios
                  especializados, donde nuestra firma brinda soluciones contables, fiscales y
                  administrativas a la medida, con la finalidad de optimizar tiempos y mejorar la
                  calidad de la presentación, reduciendo la carga de tiempo de los analistas y
                  supervisores contables.
                </Typography>

                <Typography paragraph sx={{ textAlign: "justify", fontSize: "0.92rem", lineHeight: 1.6 }}>
                  Contamos con un equipo profesional de mucha idoneidad y transparencia profesional,
                  primando la buena reputación y la experiencia; hemos participado durante 15 años en
                  atender a diversos clientes priorizando su satisfacción respecto a la calidad del
                  servicio, tanto para Grupos Económicos más grandes del País y grupos familiares de los
                  sectores de construcción, inmobiliario, agroexportador, electricidad, financieras,
                  retail, mineros, seguros y agroindustrial. Nuestros socios consultores tienen más de
                  25 años de experiencia.
                </Typography>

                <Typography paragraph sx={{ textAlign: "justify", fontSize: "0.92rem", lineHeight: 1.6 }}>
                  Esperamos que la presente propuesta les provea toda la información
                  necesaria para ser distinguidos con su elección y les expresamos nuestro
                  compromiso para satisfacer sus requerimientos y expectativas con la
                  calidad, seriedad, eficiencia y oportunidad que ustedes merecen. Quedamos
                  a su disposición para responder a cualquier pregunta o solicitud.
                </Typography>
              </Box>

              {/* Tabla servicios */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0e4a88", mb: 1.5, mt: 3 }}>
                SERVICIOS COTIZADOS
              </Typography>
              <Table size="small" sx={{ mb: 2, border: "1px solid #e0e0e0" }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.9rem" }}>Servicio</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, width: 150, fontSize: "0.9rem" }}>Costo (S/)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedServicesData.length === 0 ? (
                    <TableRow><TableCell colSpan={2} align="center">No hay servicios seleccionados</TableCell></TableRow>
                  ) : (
                    selectedServicesData.map((s) => {
                      const cost = serviceCosts[s.id!] ?? s.basePrice ?? 0;
                      return (
                        <TableRow key={s.id}>
                          <TableCell sx={{ fontSize: "0.88rem" }}>{s.name}</TableCell>
                          <TableCell align="right" sx={{ fontSize: "0.88rem" }}>{fmtSoles(cost)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                  <TableRow sx={{ backgroundColor: "#fafafa" }}>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Subtotal:</TableCell>
                    <TableCell align="right" sx={{ fontSize: "0.9rem" }}>{fmtSoles(subTotal)}</TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: "#fafafa" }}>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.9rem" }}>IGV (18%):</TableCell>
                    <TableCell align="right" sx={{ fontSize: "0.9rem" }}>{fmtSoles(igv)}</TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: "#e3f2fd" }}>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.95rem" }}>Total:</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.95rem" }}>{fmtSoles(total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Beneficios */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0e4a88", mb: 1.5 }}>
                BENEFICIOS POR TIPO DE SERVICIO
              </Typography>
              {(() => {
                const presentCats: CategoryKey[] = Array.from(
                  new Set(selectedServicesData.map((s) => classifyCategoryByName(s.name)))
                );
                if (presentCats.length === 0) {
                  return <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.9rem" }}>Sin servicios seleccionados.</Typography>;
                }
                return (
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr", rowGap: 1.5 }}>
                    {presentCats.map((cat) => (
                      <Box key={cat}>
                        <Typography sx={{ fontWeight: 700, mb: .5, fontSize: "0.9rem" }}>{CATEGORY_LABEL[cat]}</Typography>
                        <ul style={{ marginTop: 0, paddingLeft: 20, fontSize: "0.88rem", lineHeight: 1.5 }}>
                          {BENEFITS_BY_CATEGORY[cat].map((b, i) => (<li key={i}>{b}</li>))}
                        </ul>
                      </Box>
                    ))}
                  </Box>
                );
              })()}

              {/* Firma al final */}
              <Box sx={{ mt: 4, textAlign: "center" }}>
                <Typography sx={{ fontSize: "0.92rem" }}>Atentamente,</Typography>
                <Typography fontWeight={700} sx={{ mt: 1, fontSize: "0.95rem" }}>MARIO H. VILLARREYES</Typography>
                <Typography variant="body2" sx={{ fontSize: "0.88rem" }}>SOCIO - CONSULTOR</Typography>
              </Box>
            </Box>
          </Box>

          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={handleDownloadPDF}>Generar PDF</Button>
            <Button variant="contained" startIcon={<SendIcon />} onClick={handleSendQuote}>
              Enviar Cotización
            </Button>
          </Stack>
        </Box>
      )}

      {/* Navegación */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 4, pt: 3, borderTop: "1px solid #eef2f7" }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack} disabled={activeStep === 0}>
          Anterior
        </Button>
        {activeStep < 3 && (
          <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={handleNext} disabled={saving}>
            Siguiente
          </Button>
        )}
      </Stack>

      {/* ==== MODALES ==== */}
      {/* Modal de envío (loading) */}
      <Dialog
        open={sending}
        aria-labelledby="sending-dialog-title"
        PaperProps={{ sx: { borderRadius: 3, p: 2, minWidth: 380 } }}
      >
        <DialogTitle id="sending-dialog-title" sx={{ color: "#f97316", fontWeight: 800 }}>
          Enviando cotización…
        </DialogTitle>
        <DialogContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 3 }}>
          <CircularProgress sx={{ color: "#f97316" }} />
          <Typography>Generando PDF y enviando por correo.</Typography>
        </DialogContent>
      </Dialog>

      {/* Modal de resultado */}
      <Dialog
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        aria-labelledby="result-dialog-title"
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2,
            minWidth: 400,
            background: resultOk ? "#e6f7ef" : "#fdecea",
          },
        }}
      >
        <DialogTitle
          id="result-dialog-title"
          sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 800 }}
        >
          {resultOk ? (
            <>
              <CheckCircleOutlineIcon sx={{ color: "#16a34a" }} />
              Envío exitoso
            </>
          ) : (
            <>
              <ErrorOutlineIcon sx={{ color: "#dc2626" }} />
              Ocurrió un problema
            </>
          )}
        </DialogTitle>
        <DialogContent>
          <Typography>{resultMsg}</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button
            onClick={() => {
              setResultOpen(false);
              if (resultOk) {
                // Lleva al historial de cotizaciones
                nav("/cotizaciones");
                // Si prefieres forzar recarga completa:
                // window.location.href = "http://localhost:5173/cotizaciones";
              }
            }}
            autoFocus
            variant="contained"
            sx={{
              backgroundColor: resultOk ? "#22c55e" : "#dc2626",
              "&:hover": { backgroundColor: resultOk ? "#16a34a" : "#b91c1c" },
            }}
          >
            Aceptar
          </Button>
        </DialogActions>

      </Dialog>
    </AppLayout>
  );
}
