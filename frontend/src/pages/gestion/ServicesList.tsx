import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  FormControl,
  InputLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import RefreshIcon from "@mui/icons-material/Refresh";

import AppLayout from "../../layout/AppLayout";
import {
  type ServiceResponse,
  getServices,
  deleteService,
} from "../../apis/service";

export default function ServicesList() {
  const nav = useNavigate();

  const [rows, setRows] = useState<ServiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // filtros UI
  const [q, setQ] = useState("");
  const [soloActivos, setSoloActivos] = useState<"SI" | "NO">("SI");

  // menú por fila
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [rowSel, setRowSel] = useState<ServiceResponse | null>(null);
  const menuOpen = Boolean(anchorEl);

  // confirmación de borrado
  const [openConfirm, setOpenConfirm] = useState(false);

  const openMenu = (e: React.MouseEvent<HTMLElement>, row: ServiceResponse) => {
    setAnchorEl(e.currentTarget);
    setRowSel(row);
  };
  const closeMenu = () => {
    setAnchorEl(null);
    setRowSel(null);
  };

  const fetchServices = async () => {
    try {
      setErrMsg(null);
      setLoading(true);
      const data = await getServices({
        onlyActive: soloActivos === "SI",
      });
      setRows(data);
    } catch {
      setErrMsg("No se pudo cargar la lista de servicios.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Servicios";
    // Si usas token:
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) {
      nav("/login");
      return;
    }
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav, soloActivos]);

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        (r.name ?? "").toLowerCase().includes(q.toLowerCase())
        || (r.billingModel ?? "").toLowerCase().includes(q.toLowerCase())
        || String(r.orgId ?? "").includes(q)
      ),
    [rows, q]
  );

  const handleDelete = async () => {
    if (!rowSel?.id) return;
    try {
      await deleteService(rowSel.id);
      setOpenConfirm(false);
      closeMenu();
      fetchServices();
    } catch {
      setOpenConfirm(false);
      closeMenu();
      setErrMsg("No se pudo eliminar el servicio.");
    }
  };
  const VCM_BG_SOFT = "#fff7ed";
  return (
    <AppLayout title="">
      {/* Encabezado */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: 3,
          border: "1px solid #fed7aa", // borde naranja suave
          background: VCM_BG_SOFT,      // 💥 mismo color que el menú lateral
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Servicios
            </Typography>
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">Gestión</Typography>
              <Typography color="text.primary">Servicios</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {/* Barra de acciones */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
        <TextField
          placeholder="Buscar servicio"
          size="small"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 260 }}
        />

        <FormControl size="small">
          <InputLabel>Solo activos</InputLabel>
          <Select
            value={soloActivos}
            label="Solo activos"
            onChange={(e) => setSoloActivos(e.target.value as any)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="SI">SI</MenuItem>
            <MenuItem value="NO">NO</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchServices}
          disabled={loading}
        >
          Actualizar
        </Button>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => nav("/catalogo/servicios/nuevo")}
        >
          Nuevo Servicio
        </Button>
      </Stack>

      {/* Error */}
      {errMsg && (
        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
          {errMsg}
        </Typography>
      )}

      {/* Tabla */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid #eef2f7", borderRadius: 3 }}
      >
        <Table size="medium">
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700 } }}>
              <TableCell width={48}>#</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Modelo de cobro</TableCell>
              <TableCell align="right">Precio base</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right" width={72}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {/* Loading */}
            {loading && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <CircularProgress size={24} />
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {/* Datos */}
            {!loading &&
              filtered.map((r, idx) => (
                <TableRow key={r.id} hover>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>
                    <Typography fontWeight={700} sx={{ lineHeight: 1.15 }}>
                      {r.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        String(r.billingModel) === "FIXED"
                          ? "Fijo"
                          : String(r.billingModel) === "HOURLY"
                          ? "Por hora"
                          : "Por unidad"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {r.basePrice?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={r.isActive ? "Activo" : "Inactivo"}
                      color={r.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={(e) => openMenu(e, r)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

            {/* Empty */}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                    Sin resultados
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Menú por fila */}
      <Menu anchorEl={anchorEl} open={menuOpen} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            if (rowSel?.id) {
              nav(`/catalogo/servicios/${rowSel.id}`);
            }
            closeMenu();
          }}
        >
          Editar
        </MenuItem>
        <MenuItem
          onClick={() => {
            setOpenConfirm(true);
          }}
        >
          Eliminar
        </MenuItem>
      </Menu>

      {/* Confirmación de borrado */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Eliminar servicio</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Seguro que deseas eliminar "{rowSel?.name}"? (Se aplicará baja lógica)
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>Cancelar</Button>
          <Button color="error" onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
