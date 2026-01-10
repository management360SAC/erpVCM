// src/pages/gestion/ServiceForm.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import AppLayout from "../../layout/AppLayout";
import {
  type BillingModel,
  type ServiceResponse,
  createService,
  getService,
  updateService,
} from "../../apis/service";

type Mode = "new" | "edit";
const LIST_PATH = "/catalogo/servicios";

export default function ServiceForm() {
  const nav = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const mode: Mode = id ? "edit" : "new";

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Ajusta si tu app maneja multi-org desde contexto
  const [orgId, setOrgId] = useState<number>(1);
  const [name, setName] = useState<string>("");
  const [billingModel, setBillingModel] = useState<BillingModel>("FIXED");
  const [basePrice, setBasePrice] = useState<string>("0.00");
  const [active, setActive] = useState<boolean>(true);

  useEffect(() => {
    document.title = mode === "new" ? "Nuevo Servicio" : "Editar Servicio";

    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) {
      nav("/login");
      return;
    }

    const load = async () => {
      if (mode === "edit" && id) {
        try {
          setErrMsg(null);
          setLoading(true);
          const numId = Number(id);
          if (Number.isNaN(numId)) {
            setErrMsg("ID de servicio inválido.");
            return;
          }
          const data: ServiceResponse = await getService(numId);
          setOrgId(data.orgId);
          setName(data.name);
          setBillingModel(data.billingModel);
          setBasePrice(
            data.basePrice != null ? String(data.basePrice) : "0.00"
          );
          setActive(Boolean(data.isActive));
        } catch {
          setErrMsg("No se pudo cargar el servicio.");
        } finally {
          setLoading(false);
        }
      }
    };
    load();
  }, [mode, id, nav]);

  const onSubmit = async () => {
    try {
      setSaving(true);
      setErrMsg(null);

      if (!name?.trim()) {
        setErrMsg("El nombre es obligatorio.");
        setSaving(false);
        return;
      }
      const priceNumber = Number(basePrice);
      if (Number.isNaN(priceNumber) || priceNumber < 0) {
        setErrMsg("El precio base debe ser un número válido mayor o igual a 0.");
        setSaving(false);
        return;
      }

      if (mode === "new") {
        await createService({
          orgId,
          name: name.trim(),
          billingModel,
          basePrice: priceNumber,
        });
      } else {
        await updateService(Number(id), {
          name: name.trim(),
          billingModel,
          basePrice: priceNumber,
          isActive: active,
        });
      }

      nav(LIST_PATH);
    } catch (e: any) {
      setErrMsg(
        e?.response?.data?.message || "No se pudo guardar el servicio."
      );
    } finally {
      setSaving(false);
    }
  };

  const title = mode === "new" ? "Nuevo Servicio" : "Editar Servicio";

  return (
    <AppLayout title="">
      {/* Encabezado */}
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
          gap={2}
        >
          <Box>
            <Typography variant="h5" fontWeight={800}>
              {title}
            </Typography>
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">Gestión</Typography>
              <Typography color="text.primary">Servicios</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid #eef2f7",
          }}
        >
          <Stack spacing={2} maxWidth={560}>
            {errMsg && (
              <Typography color="error" variant="body2">
                {errMsg}
              </Typography>
            )}

            <TextField
              label="Organización (orgId)"
              type="number"
              size="small"
              value={orgId}
              onChange={(e) => setOrgId(Number(e.target.value))}
              helperText="ID de la organización"
              fullWidth
            />

            <TextField
              label="Nombre del servicio"
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Modelo de cobro</InputLabel>
              <Select
                label="Modelo de cobro"
                value={billingModel}
                onChange={(e) =>
                  setBillingModel(e.target.value as BillingModel)
                }
              >
              <MenuItem value="FIXED">Fijo</MenuItem>
              <MenuItem value="UNIT">Por Unidad</MenuItem>
              <MenuItem value="MENSUAL">Mensual</MenuItem>
              <MenuItem value="ANUAL">Anual</MenuItem>
              <MenuItem value="PROYECTO">Proyecto</MenuItem>
              <MenuItem value="POR_HORA">Por hora</MenuItem>
              <MenuItem value="LICENCIA">Licencia</MenuItem>

              </Select>
            </FormControl>

            <TextField
              label="Precio base"
              size="small"
              type="number"
              inputProps={{ step: "0.01", min: 0 }}
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              fullWidth
            />

            {mode === "edit" && (
              <FormControl size="small" fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  label="Estado"
                  value={active ? "ACTIVO" : "INACTIVO"}
                  onChange={(e) => setActive(e.target.value === "ACTIVO")}
                >
                  <MenuItem value="ACTIVO">Activo</MenuItem>
                  <MenuItem value="INACTIVO">Inactivo</MenuItem>
                </Select>
              </FormControl>
            )}

            <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
              <Button variant="outlined" onClick={() => nav(LIST_PATH)}>
                Cancelar
              </Button>
              <Button variant="contained" onClick={onSubmit} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </AppLayout>
  );
}
