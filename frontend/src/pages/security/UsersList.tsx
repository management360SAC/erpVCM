// src/pages/seguridad/UsersList.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Divider,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import RefreshIcon from "@mui/icons-material/Refresh";

import AppLayout from "../../layout/AppLayout";
import { getUsers, type UserResponse } from "../../apis/user";

// --- Compatibilidad: el backend puede mandar (nombre, rol) o (name, role).
//    Extendemos el tipo para evitar errores de TS y leer ambos campos.
type UIUser = UserResponse & {
  id?: number;
  username?: string;
  email?: string;

  // nombres "viejos"
  nombre?: string;
  rol?: string;
  direccion?: string;
  celular?: string;

  // nombres "nuevos" alineados a tus DTO
  name?: string;
  role?: string;
  active?: boolean;
};

export default function UsersList() {
  const nav = useNavigate();

  const [rows, setRows] = useState<UIUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // filtros UI
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState<"Persona" | "Empresa">("Persona");

  // menú por fila
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [rowSel, setRowSel] = useState<UIUser | null>(null);
  const menuOpen = Boolean(anchorEl);

  const openMenu = (e: React.MouseEvent<HTMLElement>, row: UIUser) => {
    setAnchorEl(e.currentTarget);
    setRowSel(row);
  };
  const closeMenu = () => {
    setAnchorEl(null);
    setRowSel(null);
  };

  const fetchUsers = async () => {
    try {
      setErrMsg(null);
      setLoading(true);
      const data = await getUsers(); // usa axios con interceptor (Authorization)
      setRows((data || []) as UIUser[]);
    } catch (_e) {
      setErrMsg("No se pudo cargar la lista de usuarios.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Usuarios";

    // Si no hay token, enviamos a /login
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) {
      nav("/login");
      return;
    }

    fetchUsers();
  }, [nav]);

  // Helpers para compatibilidad de campos
  const getNombre = (u: UIUser) => u.nombre ?? u.name ?? "";
  const getRol = (u: UIUser) => u.rol ?? u.role ?? "";
  const getDireccion = (u: UIUser) => (u as any).direccion ?? "-";
  const getCelular = (u: UIUser) => (u as any).celular ?? "-";

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const nombre = getNombre(r).toLowerCase();
        const email = (r.email ?? "").toLowerCase();
        const username = (r.username ?? "").toLowerCase();
        const term = q.toLowerCase();
        return (
          nombre.includes(term) ||
          email.includes(term) ||
          username.includes(term) ||
          String(r.id ?? "").includes(q)
        );
      }),
    [rows, q]
  );

  return (
    <AppLayout title="">
      {/* Encabezado */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: 3,
          border: "1px solid #fed7aa",
          background: "#fff7ed",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Usuarios
            </Typography>
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">Seguridad</Typography>
              <Typography color="text.primary">Usuarios</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {/* Barra de acciones */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
        <TextField
          placeholder="Buscar Usuario"
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
          <InputLabel>Persona</InputLabel>
          <Select
            value={tipo}
            label="Persona"
            onChange={(e) => setTipo(e.target.value as any)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="Persona">Persona</MenuItem>
            <MenuItem value="Empresa">Empresa</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchUsers}
          disabled={loading}
        >
          Actualizar
        </Button>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            nav("/seguridad/usuarios/nuevo");
          }}
        >
          Nuevo Usuario
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
              <TableCell>Usuario</TableCell>
              <TableCell>Correo Electrónico</TableCell>
              <TableCell>Dirección</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Perfil</TableCell>
              <TableCell align="right" width={72}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {/* Loading state */}
            {loading && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <CircularProgress size={24} />
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {/* Datos */}
            {!loading &&
              filtered.map((r, idx) => (
                <TableRow key={r.id ?? idx} hover>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell sx={{ maxWidth: 260 }}>
                    <Typography fontWeight={700} sx={{ lineHeight: 1.15 }}>
                      {getNombre(r) || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>{r.username || "-"}</TableCell>
                  <TableCell sx={{ maxWidth: 260 }}>
                    <Typography color="text.secondary" noWrap title={r.email || "-"}>
                      {r.email || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 240 }}>
                    <Typography color="text.secondary" noWrap title={getDireccion(r)}>
                      {getDireccion(r)}
                    </Typography>
                  </TableCell>
                  <TableCell>{getCelular(r)}</TableCell>
                  <TableCell>
                    <Chip label={getRol(r) || "-"} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={(e) => openMenu(e, r)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
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
              nav(`/seguridad/usuarios/${rowSel.id}`);
            }
            closeMenu();
          }}
        >
          Editar
        </MenuItem>
        <MenuItem
          onClick={() => {
            // acción de reset pass (pendiente)
            closeMenu();
          }}
        >
          Restablecer contraseña
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            // desactivar (pendiente)
            closeMenu();
          }}
        >
          Desactivar
        </MenuItem>
      </Menu>
    </AppLayout>
  );
}
