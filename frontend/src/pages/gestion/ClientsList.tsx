// src/pages/gestion/ClientsList.tsx
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
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import RefreshIcon from "@mui/icons-material/Refresh";

import AppLayout from "../../layout/AppLayout";
import {
  getClients,
  deleteClient,
  type ClientResponse,
} from "../../apis/client";
import {
  getClientServices,
  type ClientServiceDTO,
} from "../../apis/clientService";

type SvcCount = { a: number; i: number; error?: boolean };

// mismo color suave que el menú lateral
const VCM_BG_SOFT = "#fff7ed";

export default function ClientsList() {
  const nav = useNavigate();

  const [rows, setRows] = useState<ClientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [q, setQ] = useState("");

  // menú por fila
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [rowSel, setRowSel] = useState<ClientResponse | null>(null);
  const open = Boolean(anchorEl);
  const openMenu = (e: any, r: ClientResponse) => {
    setAnchorEl(e.currentTarget);
    setRowSel(r);
  };
  const closeMenu = () => {
    setAnchorEl(null);
  };

  // confirmación de eliminación
  const [delOpen, setDelOpen] = useState(false);
  const [delLoading, setDelLoading] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);

  // mapa de conteos de servicios por cliente
  const [svcMap, setSvcMap] = useState<Record<number, SvcCount>>({});
  const [svcLoading, setSvcLoading] = useState(false);

  // diálogo de servicios
  const [svcDlgOpen, setSvcDlgOpen] = useState(false);
  const [svcDlgLoading, setSvcDlgLoading] = useState(false);
  const [svcDlgErr, setSvcDlgErr] = useState<string | null>(null);
  const [svcDlgClient, setSvcDlgClient] = useState<ClientResponse | null>(null);
  const [svcDlgRows, setSvcDlgRows] = useState<ClientServiceDTO[]>([]);

  const fmtMoney = (v?: number | string | null) =>
    v === null || v === undefined || v === ""
      ? "-"
      : Number(v).toLocaleString("es-PE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  const fmtDate = (s?: string | null) =>
    s ? new Date(s).toLocaleDateString() : "-";

  const fetchData = async () => {
    try {
      setErrMsg(null);
      setLoading(true);
      const list = await getClients();
      setRows(list);
    } catch {
      setErrMsg("No se pudo cargar la lista de clientes.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Clientes";
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) {
      nav("/login");
      return;
    }
    fetchData();
  }, [nav]);

  // cargar conteos por cliente
  useEffect(() => {
    const loadSvcCounts = async () => {
      if (!rows.length) {
        setSvcMap({});
        return;
      }
      setSvcLoading(true);
      const map: Record<number, SvcCount> = {};
      try {
        await Promise.all(
          rows
            .filter((r) => typeof r.id === "number")
            .map(async (r) => {
              try {
                const all = await getClientServices(r.id as number);
                const a = all.filter((s) => s.active).length;
                const i = all.length - a;
                map[r.id as number] = { a, i };
              } catch {
                map[r.id as number] = { a: 0, i: 0, error: true };
              }
            })
        );
        setSvcMap(map);
      } finally {
        setSvcLoading(false);
      }
    };
    loadSvcCounts();
  }, [rows]);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return rows.filter(
      (r) =>
        (r.legalName ?? "").toLowerCase().includes(t) ||
        (r.taxId ?? "").toLowerCase().includes(t) ||
        (r.email ?? "").toLowerCase().includes(t) ||
        (r.phone ?? "").toLowerCase().includes(t) ||
        String(r.id ?? "").includes(q)
    );
  }, [rows, q]);

  // abrir modal y cargar servicios del cliente
  const openServicesDialog = async (client: ClientResponse) => {
    if (!client.id) return;
    setSvcDlgClient(client);
    setSvcDlgRows([]);
    setSvcDlgErr(null);
    setSvcDlgOpen(true);
    setSvcDlgLoading(true);
    try {
      const list = await getClientServices(client.id);
      setSvcDlgRows(list);
    } catch {
      setSvcDlgErr("No se pudo cargar los servicios del cliente.");
    } finally {
      setSvcDlgLoading(false);
    }
  };

  // ======== DELETE ========
  const askDelete = () => {
    setDelError(null);
    setDelOpen(true);
    closeMenu();
  };

  const doDelete = async () => {
    if (!rowSel?.id) return;
    try {
      setDelLoading(true);
      setDelError(null);
      await deleteClient(rowSel.id);
      setRows((prev) => prev.filter((c) => c.id !== rowSel.id));
      setDelOpen(false);
      setRowSel(null);
    } catch (e: any) {
      setDelError(e?.message || "No se pudo eliminar el cliente.");
    } finally {
      setDelLoading(false);
    }
  };

  const refreshAll = async () => {
    await fetchData();
  };

  return (
    <AppLayout title="">
      {/* header */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: 3,
          border: "1px solid #fed7aa", // borde naranja suave
          background: VCM_BG_SOFT, // 💥 mismo color que el menú lateral
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Clientes
            </Typography>
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">Gestión</Typography>
              <Typography color="text.primary">Clientes</Typography>
            </Breadcrumbs>
          </Box>
          
        </Stack>
      </Paper>

      {/* actions */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ mb: 1.5 }}
      >
        <TextField
          placeholder="Buscar Cliente"
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
          sx={{ width: 300 }}
        />
        <Box sx={{ flex: 1 }} />

        {/* 🔸 Botón ACTUALIZAR en naranja */}
        <Button
          variant="outlined"
          color="warning"
          startIcon={<RefreshIcon />}
          onClick={refreshAll}
          disabled={loading || svcLoading}
          sx={{
            borderColor: "#f97316",
            color: "#c2410c",
            "&:hover": {
              borderColor: "#ea580c",
              backgroundColor: "rgba(249,115,22,0.06)",
            },
          }}
        >
          Actualizar
        </Button>

        {/* botón principal naranja */}
        <Button
          variant="contained"
          color="warning"
          startIcon={<AddIcon />}
          onClick={() => nav("/clientes/nuevo")}
        >
          Nuevo Cliente
        </Button>
      </Stack>

      {errMsg && (
        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
          {errMsg}
        </Typography>
      )}

      {/* table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid #eef2f7", borderRadius: 3 }}
      >
        <Table size="medium">
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700 } }}>
              <TableCell width={48}>#</TableCell>
              <TableCell>Razón Social</TableCell>
              <TableCell>RUC / Tax ID</TableCell>
              <TableCell>Correo</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Sector</TableCell>
              <TableCell>Tamaño</TableCell>
              <TableCell>Servicios</TableCell>
              <TableCell align="right" width={72}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <CircularProgress size={24} />
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              filtered.map((r, i) => {
                const cnt = r.id ? svcMap[r.id] : undefined;
                const total = (cnt?.a ?? 0) + (cnt?.i ?? 0);

                return (
                  <TableRow key={r.id ?? i} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <Typography fontWeight={700}>
                        {r.legalName || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>{r.taxId || "-"}</TableCell>
                    <TableCell>
                      <Typography
                        color="text.secondary"
                        noWrap
                        title={r.email || "-"}
                      >
                        {r.email || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>{r.phone || "-"}</TableCell>
                    <TableCell>
                      <Chip size="small" label={r.sectorId ?? "-"} />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={r.sizeId ?? "-"} />
                    </TableCell>

                    {/* Botón que abre modal con servicios */}
                    <TableCell>
                      {svcLoading && !cnt ? (
                        <Typography variant="body2" color="text.secondary">
                          …
                        </Typography>
                      ) : cnt?.error ? (
                        <Typography variant="body2" color="error">
                          error
                        </Typography>
                      ) : (
                        <Tooltip title="Ver servicios del cliente">
                          <span>
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning" // naranja
                              onClick={() => openServicesDialog(r)}
                              disabled={!r.id}
                            >
                              Ver {total > 0 ? `(${total})` : ""}
                            </Button>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <IconButton onClick={(e) => openMenu(e, r)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}

            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Box
                    sx={{
                      py: 6,
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    Sin resultados
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Menú contextual por fila */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => {
          setRowSel(null);
          closeMenu();
        }}
      >
        <MenuItem
          onClick={() => {
            if (rowSel?.id) nav(`/clientes/${rowSel.id}`);
            setRowSel(null);
            closeMenu();
          }}
        >
          Editar
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            askDelete();
          }}
          sx={{ color: "error.main" }}
        >
          Eliminar
        </MenuItem>
      </Menu>

      {/* Dialogo de servicios del cliente */}
      <Dialog
        open={svcDlgOpen}
        onClose={() => setSvcDlgOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Servicios —{" "}
          {svcDlgClient?.legalName || `Cliente #${svcDlgClient?.id ?? ""}`}
        </DialogTitle>
        <DialogContent dividers>
          {svcDlgLoading ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <CircularProgress size={22} />
            </Box>
          ) : svcDlgErr ? (
            <Typography color="error">{svcDlgErr}</Typography>
          ) : svcDlgRows.length === 0 ? (
            <Typography color="text.secondary">
              Sin servicios registrados.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Servicio</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Precio</TableCell>
                  <TableCell>Inicio</TableCell>
                  <TableCell>Fin</TableCell>
                  <TableCell>Notas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {svcDlgRows.map((s, idx) => (
                  <TableRow key={s.id ?? idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      {s.serviceName ?? `#${s.serviceId}`}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={s.active ? "success" : "default"}
                        label={s.active ? "Activo" : "Inactivo"}
                      />
                    </TableCell>
                    <TableCell align="right">{fmtMoney(s.price)}</TableCell>
                    <TableCell>{fmtDate(s.startDate)}</TableCell>
                    <TableCell>{fmtDate(s.endDate)}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        title={s.notes ?? ""}
                      >
                        {s.notes ?? "-"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSvcDlgOpen(false)} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={delOpen}
        onClose={() => !delLoading && setDelOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Eliminar cliente</DialogTitle>
        <DialogContent dividers>
          <Typography>
            ¿Seguro que deseas eliminar al cliente{" "}
            <strong>{rowSel?.legalName ?? `#${rowSel?.id}`}</strong>? Esta
            acción no se puede deshacer.
          </Typography>
          {delError && (
            <Typography color="error" sx={{ mt: 1 }}>
              {delError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDelOpen(false)} disabled={delLoading}>
            Cancelar
          </Button>
          <Button
            onClick={doDelete}
            color="error"
            variant="contained"
            disabled={delLoading}
          >
            {delLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
