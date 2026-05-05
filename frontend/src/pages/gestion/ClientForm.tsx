// src/pages/gestion/ClientForm.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import AppLayout from "../../layout/AppLayout";
import {
  createClient,
  getClient,
  updateClient,
  type ClientResponse,
  type CreateClientRequest,
} from "../../apis/client";

export default function ClientForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState<CreateClientRequest>({
    orgId: 1,
    legalName: "",
    taxId: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // --- Loading previo (4s) ---
  const [preloadOpen, setPreloadOpen] = useState(false);

  // --- Modal final de éxito ---
  const [successOpen, setSuccessOpen] = useState(false);
  const [successText, setSuccessText] = useState("");

  useEffect(() => {
    document.title = isEdit ? "Editar Cliente" : "Nuevo Cliente";

    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) return nav("/login");

    const fetch = async () => {
      if (!isEdit) return;
      try {
        const data: ClientResponse = await getClient(Number(id));

        setForm({
          orgId: data.orgId ?? 1,
          legalName: data.legalName ?? "",
          taxId: data.taxId ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
        });
      } catch {
        setErrMsg("No se pudo cargar el cliente.");
      }
    };
    fetch();
  }, [id, isEdit, nav]);

  const onChange =
    (k: keyof CreateClientRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setForm((s) => ({ ...s, [k]: v === "" ? "" : v }));
    };

  const onSubmit = async () => {
    try {
      setErrMsg(null);
      setLoading(true);

      /** PRIMERA FASE: LOADING DE 4 SEGUNDOS */
      setPreloadOpen(true);

      setTimeout(async () => {
        /** EJECUTAR LA OPERACIÓN DESPUÉS DE LOS 4s */
        try {
          if (isEdit) {
            await updateClient(Number(id), {
              legalName: form.legalName,
              taxId: form.taxId || undefined,
              email: form.email || undefined,
              phone: form.phone || undefined,
            });
          } else {
            await createClient(form);
          }

          /** CERRAR LOADING Y ABRIR MODAL DE ÉXITO */
          setPreloadOpen(false);
          setSuccessText(
            isEdit
              ? "Cliente actualizado correctamente."
              : "Cliente creado correctamente."
          );
          setSuccessOpen(true);

          /** ESPERAR 4 segundos más, luego redirigir */
          setTimeout(() => {
            setSuccessOpen(false);
            nav("/clientes");
          }, 4000);

        } catch (err: any) {
          setPreloadOpen(false);
          setErrMsg(
            err?.response?.data?.message ||
              "No se pudo guardar el cliente."
          );
        }

        setLoading(false);
      }, 4000);

    } catch (e) {
      setLoading(false);
      setErrMsg("Error inesperado.");
    }
  };

  return (
    <AppLayout title="">
      {/* Header */}
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
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={800}>
              {isEdit ? "Editar Cliente" : "Nuevo Cliente"}
            </Typography>
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">Gestión</Typography>
              <Typography color="text.primary">Clientes</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {/* FORM */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #eef2f7" }}>
        {errMsg && <Alert severity="error" sx={{ mb: 2 }}>{errMsg}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Razón Social"
              fullWidth
              value={form.legalName}
              onChange={onChange("legalName")}
              required
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="RUC / Tax ID"
              fullWidth
              value={form.taxId ?? ""}
              onChange={onChange("taxId")}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Correo"
              fullWidth
              value={form.email ?? ""}
              onChange={onChange("email")}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Teléfono"
              fullWidth
              value={form.phone ?? ""}
              onChange={onChange("phone")}
            />
          </Grid>
        </Grid>

        <Stack direction="row" spacing={1.5} sx={{ mt: 3 }} justifyContent="flex-end">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => nav("/clientes")}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            startIcon={!loading ? <SaveIcon /> : undefined}
            onClick={onSubmit}
            disabled={loading}
            sx={{
              bgcolor: "#f97316",
              "&:hover": { bgcolor: "#ea580c" },
              minWidth: 150,
            }}
          >
            {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Guardar"}
          </Button>
        </Stack>
      </Paper>

      {/* ===================== MODAL LOADING (4s iniciales) ===================== */}
      <Dialog open={preloadOpen} PaperProps={{ sx: { borderRadius: 4, p: 2, width: 380 } }}>
        <DialogContent sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress size={40} sx={{ color: "#f97316", mb: 2 }} />
          <Typography variant="h6" fontWeight={600}>
            Procesando...
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
            Esto tomará unos segundos
          </Typography>
        </DialogContent>
      </Dialog>

      {/* ===================== MODAL FINAL DE ÉXITO ===================== */}
      <Dialog
        open={successOpen}
        PaperProps={{
          sx: { borderRadius: 4, width: 420, textAlign: "center" },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: "#ffedd5",
            color: "#c2410c",
            fontWeight: 900,
            textAlign: "center",
            py: 2,
            fontSize: "1.4rem",
          }}
        >
          ¡Operación exitosa!
        </DialogTitle>

        <DialogContent sx={{ py: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {successText}
          </Typography>

          <CircularProgress size={30} sx={{ color: "#f97316", mb: 2 }} />

          <Typography variant="body1" sx={{ mb: 1 }}>
            Redirigiendo al listado de clientes…
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Esto tomará unos segundos.
          </Typography>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
