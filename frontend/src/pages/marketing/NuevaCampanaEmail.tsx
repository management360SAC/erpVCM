// src/pages/marketing/NuevaCampanaEmail.tsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  InputAdornment,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import SearchIcon from "@mui/icons-material/Search";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import PreviewIcon from "@mui/icons-material/Visibility";

import AppLayout from "../../layout/AppLayout";
import { createEmailCampaign } from "../../apis/emailCampaigns";
import { getClients, type ClientResponse } from "../../apis/client";
import Autocomplete from "@mui/material/Autocomplete";

// ====== CONFIG LOGO + LINKS ======
// Usa el logo que tienes en public/images/logo_sinFondo.png
const LOGO_URL = "/images/logo_sinFondo.png";

const WEBSITE_URL = "https://TU-DOMINIO.COM";
const FACEBOOK_URL = "https://www.facebook.com";
const INSTAGRAM_URL = "https://www.instagram.com";
const LINKEDIN_URL = "https://www.linkedin.com/company";

// ====== FUNCIÓN QUE ENVUELVE EL CUERPO EN UNA PLANTILLA HTML ======
function buildEmailHtml(plainBody: string): string {
  const paragraphs = plainBody
    ? plainBody
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map(
          (line) =>
            `<p style="margin:0 0 8px;line-height:1.6;color:#333333;font-size:14px;">${line}</p>`
        )
        .join("")
    : `<p style="margin:0 0 8px;line-height:1.6;color:#555555;font-size:14px;">[Sin contenido]</p>`;

  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>VCM</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
          <!-- HEADER -->
          <tr>
            <td align="center" style="padding:24px 24px 16px 24px;">
              <img src="${LOGO_URL}" alt="VCM" style="max-width:160px;height:auto;display:block;margin:0 auto 8px auto;" />
            </td>
          </tr>

          <!-- CONTENIDO -->
          <tr>
            <td style="padding:0 24px 24px 24px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
              ${paragraphs}
            </td>
          </tr>

          <!-- MARCADOR PARA IMAGEN + FOOTER (PASO 4) -->
          <!--VCM-FOOTER-->

          <!-- FOOTER REAL -->
          <tr>
            <td style="padding:16px 24px 24px 24px;border-top:1px solid #eeeeee;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:11px;color:#888888;text-align:center;">
              <p style="margin:0 0 8px;">
                © ${year} VCM Consultores. Todos los derechos reservados.
              </p>
              <p style="margin:0 0 8px;">
                <a href="${WEBSITE_URL}" style="color:#2563eb;text-decoration:none;">Sitio web</a> ·
                <a href="${FACEBOOK_URL}" style="color:#2563eb;text-decoration:none;">Facebook</a> ·
                <a href="${INSTAGRAM_URL}" style="color:#2563eb;text-decoration:none;">Instagram</a> ·
                <a href="${LINKEDIN_URL}" style="color:#2563eb;text-decoration:none;">LinkedIn</a>
              </p>
              <p style="margin:0;color:#aaaaaa;">
                Estás recibiendo este correo porque mantienes una relación comercial con VCM.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const steps = ["Datos básicos", "Destinatarios & contenido"];

export default function NuevaCampanaEmail() {
  const navigate = useNavigate();

  // STEP / GENERAL
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Datos básicos
  const [name, setName] = useState("");
  const [scheduledDate, setScheduledDate] = useState(""); // yyyy-MM-dd

  // Destinatarios
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClients, setSelectedClients] = useState<ClientResponse[]>([]);

  // Contenido
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [headerImage, setHeaderImage] = useState<File | null>(null);

  // Previsualización
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Cargar clientes solo una vez
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingClients(true);
        const data = await getClients();
        setClients(data || []);
      } catch {
        // si falla, solo no habrá sugerencias
      } finally {
        setLoadingClients(false);
      }
    };
    loadClients();
  }, []);

  // URL temporal de la imagen para la preview
  useEffect(() => {
    if (!headerImage) {
      setPreviewImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(headerImage);
    setPreviewImageUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [headerImage]);

  const sortedClients = useMemo(
    () =>
      clients
        .slice()
        .sort((a, b) =>
          (a.legalName || "").localeCompare(b.legalName || "", "es", {
            sensitivity: "base",
          })
        ),
    [clients]
  );

  const selectableClients = useMemo(
    () => sortedClients.filter((c) => !!c.email),
    [sortedClients]
  );

  /* --------- Validaciones --------- */
  const canNextFromStep0 = name.trim().length > 2;

  const canSave =
    name.trim().length > 2 &&
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    selectedClients.length > 0 &&
    !saving;

  const canPreview =
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    selectedClients.length > 0;

  const handleNext = () => {
    if (activeStep === 0 && !canNextFromStep0) return;
    setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handleBackStep = () => {
    setActiveStep((s) => Math.max(s - 1, 0));
  };

  /* --------- Guardar campaña --------- */
  const handleSubmit = async () => {
    if (!canSave) return;

    try {
      setSaving(true);
      setErrorMsg("");

      const clientIds = selectedClients
        .map((c) => c.id)
        .filter((id): id is number => typeof id === "number");

      // Usamos la plantilla HTML
      const finalHtml = buildEmailHtml(body.trim());

      await createEmailCampaign({
        orgId: 1, // ajusta si luego usas org dinámica
        name: name.trim(),
        scheduledAt: scheduledDate ? `${scheduledDate}T09:00:00` : null,
        subject: subject.trim(),
        bodyHtml: finalHtml,
        clientIds,
        headerImage,
      });

      navigate("/marketing/email");
    } catch (e: any) {
      setErrorMsg(
        e?.response?.data?.message || "No se pudo crear la campaña."
      );
    } finally {
      setSaving(false);
    }
  };

  // Para resumen de destinatarios
  const totalEmails = selectedClients.filter((c) => !!c.email).length;
  const allSelected =
    selectableClients.length > 0 &&
    selectedClients.length === selectableClients.length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedClients([]);
    } else {
      setSelectedClients(selectableClients);
    }
  };

  const openPreview = () => {
    if (!canPreview) return;
    setPreviewOpen(true);
  };

  const closePreview = () => setPreviewOpen(false);

  const previewHtml = buildEmailHtml(body || "");

  return (
    <AppLayout>
      {/* HEADER igual estilo CampañasEmail */}
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
              Nueva campaña
            </Typography>
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">
                Marketing & Escalabilidad
              </Typography>
              <Typography color="text.secondary">Campañas</Typography>
              <Typography color="text.primary">Nueva campaña</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {/* STEPPER */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: "1px solid #eef2f7",
          maxWidth: 840,
          mx: "auto",
        }}
      >
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* CARD CENTRAL */}
      <Paper
        elevation={0}
        sx={{
          maxWidth: 840,
          mx: "auto",
          p: 3,
          borderRadius: 3,
          border: "1px solid #eef2f7",
        }}
      >
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}

        {/* STEP 0: DATOS BÁSICOS */}
        {activeStep === 0 && (
          <Stack spacing={2.5}>
            <Typography variant="h6" fontWeight={700}>
              Datos básicos de la campaña
            </Typography>

            <TextField
              label="Nombre de campaña *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />

            <TextField
              label="Programar envío (opcional)"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <EventIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              helperText="Si no eliges fecha, la campaña quedará como BORRADOR."
              fullWidth
            />
          </Stack>
        )}

        {/* STEP 1: DESTINATARIOS Y CONTENIDO */}
        {activeStep === 1 && (
          <Stack spacing={3}>
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Destinatarios (empresas)
                </Typography>

                <Button
                  size="small"
                  startIcon={<DoneAllIcon />}
                  onClick={handleToggleSelectAll}
                  disabled={selectableClients.length === 0}
                >
                  {allSelected ? "Quitar selección" : "Seleccionar todas"}
                </Button>
              </Stack>

              <Autocomplete
                multiple
                disableCloseOnSelect
                loading={loadingClients}
                options={selectableClients}
                value={selectedClients}
                onChange={(_, value) => setSelectedClients(value)}
                getOptionLabel={(opt) =>
                  opt.legalName
                    ? `${opt.legalName}${
                        opt.email ? ` — ${opt.email}` : ""
                      }`
                    : ""
                }
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                filterSelectedOptions
                renderOption={(props, option, { selected }) => (
                  <li {...props} key={option.id}>
                    <Checkbox
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    {option.legalName}
                    {option.email ? ` — ${option.email}` : ""}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Selecciona empresas"
                    placeholder="Buscar empresas por razón social"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                    helperText={
                      totalEmails === 0
                        ? "Elige una o más empresas que tengan correo registrado."
                        : `Se enviará a ${totalEmails} correo(s) de ${selectedClients.length} empresa(s) seleccionadas.`
                    }
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id ?? index}
                      label={option.legalName}
                      size="small"
                    />
                  ))
                }
              />
            </Box>

            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                Contenido de la campaña
              </Typography>

              <TextField
                label="Asunto del correo *"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                fullWidth
              />

              <TextField
                label="Contenido del correo *"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                fullWidth
                multiline
                minRows={6}
                placeholder="Escribe el mensaje que recibirán tus clientes. Más adelante podrás usar plantillas HTML."
                sx={{ mt: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlineIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Subida de imagen */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Imagen principal (opcional)
                </Typography>
                <Button variant="outlined" component="label" size="small">
                  Seleccionar imagen
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setHeaderImage(file);
                    }}
                  />
                </Button>
                {headerImage && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Imagen seleccionada: <strong>{headerImage.name}</strong>
                  </Typography>
                )}
              </Box>
            </Box>
          </Stack>
        )}

        {/* FOOTER DE NAVEGACIÓN */}
        <Stack
          direction="row"
          spacing={1.5}
          justifyContent="space-between"
          sx={{ mt: 4, pt: 2, borderTop: "1px solid #eef2f7" }}
        >
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => {
              if (activeStep === 0) {
                navigate("/marketing/email");
              } else {
                handleBackStep();
              }
            }}
            disabled={saving}
          >
            {activeStep === 0 ? "Cancelar" : "Atrás"}
          </Button>

          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!canNextFromStep0}
            >
              Siguiente
            </Button>
          ) : (
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={openPreview}
                disabled={!canPreview}
              >
                Previsualizar
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={!canSave}
              >
                {saving ? "Creando..." : "Crear campaña"}
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* DIÁLOGO DE PREVISUALIZACIÓN */}
      <Dialog
        open={previewOpen}
        onClose={closePreview}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Previsualización del correo</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" color="text.secondary">
            Asunto
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {subject || "(sin asunto)"}
          </Typography>

          <Typography variant="subtitle2" color="text.secondary">
            Destinatarios
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Se enviará a {totalEmails} correo(s) de{" "}
            {selectedClients.length} empresa(s) seleccionadas.
          </Typography>

          <Divider sx={{ my: 2 }} />

          {previewImageUrl && (
            <Box sx={{ mb: 2, textAlign: "center" }}>
              <img
                src={previewImageUrl}
                alt="Imagen de cabecera"
                style={{ maxWidth: "100%", borderRadius: 8 }}
              />
            </Box>
          )}

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Cuerpo del correo (estructura real)
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              minHeight: 120,
              backgroundColor: "#fafafa",
              fontSize: 14,
              maxHeight: 400,
              overflow: "auto",
            }}
          >
            <div
              dangerouslySetInnerHTML={{
                __html: previewHtml,
              }}
            />
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePreview} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
