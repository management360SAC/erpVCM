// src/pages/pipeline/EmbudoVentas.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Divider,
} from "@mui/material";
import AppLayout from "../../layout/AppLayout";

import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";

// ======= Etapas del embudo (ajusta si tu dominio usa otras) =======
export type Stage =
  | "PROSPECTO"
  | "CONTACTO"
  | "CALIFICADO"
  | "PROPUESTA"
  | "CERRADO_GANADO"
  | "CERRADO_PERDIDO";

const STAGES: { key: Stage; title: string; color: "default" | "primary" | "success" | "warning" | "info" | "error" }[] =
  [
    { key: "PROSPECTO",        title: "Prospecto",       color: "default" },
    { key: "CONTACTO",         title: "Contacto",        color: "info"    },
    { key: "CALIFICADO",       title: "Calificado",      color: "warning" },
    { key: "PROPUESTA",        title: "Propuesta",       color: "primary" },
    { key: "CERRADO_GANADO",   title: "Cerrado (Ganado)",color: "success" },
    { key: "CERRADO_PERDIDO",  title: "Cerrado (Perdido)",color: "error"  },
  ];

// ======= API helpers (ajusta endpoints según tu backend) =======
type Deal = {
  id: number;
  title: string;           // nombre de la oportunidad
  clientName?: string|null;
  amount?: number|null;    // valor PEN
  ownerName?: string|null; // responsable
  stage: Stage;
  createdAt?: string|null;
  probability?: number|null; // 0-100
};

type BoardResp = {
  // opcional: el backend puede enviarte un mapa por etapa
  deals: Deal[];
};

const PEN = (v?: number|null) =>
  `S/ ${Number(v || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

async function fetchBoard(): Promise<BoardResp> {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const res = await fetch(`/api/deals/board`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function updateDealStage(id: number, stage: Stage) {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const res = await fetch(`/api/deals/${id}/stage`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ stage }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ======= Card de oportunidad =======
function DealCard({ deal, onOpen }: { deal: Deal; onOpen: (d: Deal) => void }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: "1px solid #e9eef5",
        mb: 1,
        background: "#fff",
        cursor: "grab",
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(deal.id));
      }}
    >
      <Stack spacing={0.75}>
        <Typography fontWeight={700} fontSize={14} lineHeight={1.2}>
          {deal.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {deal.clientName || "—"} · {deal.ownerName || "Sin asignar"}
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Chip
            size="small"
            icon={<MonetizationOnOutlinedIcon fontSize="small" />}
            label={PEN(deal.amount)}
            variant="outlined"
          />
          {typeof deal.probability === "number" && (
            <Typography variant="caption" color="text.secondary">
              {Math.round(deal.probability)}%
            </Typography>
          )}
        </Stack>
        <Stack direction="row" justifyContent="flex-end">
          <Tooltip title="Abrir oportunidad">
            <IconButton size="small" onClick={() => onOpen(deal)}>
              <LaunchOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}

// ======= Columna de etapa =======
function StageColumn({
  title,
  color,
  stageKey,
  items,
  onDropDeal,
  totalAmount,
}: {
  title: string;
  color: "default" | "primary" | "success" | "warning" | "info" | "error";
  stageKey: Stage;
  items: Deal[];
  onDropDeal: (dealId: number, toStage: Stage) => void;
  totalAmount: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  return (
    <Box
      ref={ref}
      sx={{
        width: 320,
        minWidth: 320,
        maxWidth: 360,
        mr: 2,
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = Number(e.dataTransfer.getData("text/plain"));
        if (!isNaN(id)) onDropDeal(id, stageKey);
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 1.25,
          borderRadius: 2,
          border: "1px solid #e9eef5",
          background: "#f8fbff",
          mb: 1,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" color={color} label={title} />
            <Typography variant="caption" color="text.secondary">
              {items.length} deals
            </Typography>
          </Stack>
          <Typography variant="caption" fontWeight={700}>
            {PEN(totalAmount)}
          </Typography>
        </Stack>
      </Paper>

      {/* Zona de tarjetas */}
      <Box sx={{ minHeight: 60 }}>
        {items.map((d) => (
          <DealCard key={d.id} deal={d} onOpen={(deal) => alert(`Abrir ${deal.title} (#${deal.id})`)} />
        ))}
        {items.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px dashed #dbe3ef",
              color: "text.secondary",
              textAlign: "center",
              fontSize: 13,
              background: "#fff",
            }}
          >
            Arrastra oportunidades aquí
          </Paper>
        )}
      </Box>
    </Box>
  );
}

// ======= Página principal =======
export default function EmbudoVentas() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState(q);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  async function load() {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await fetchBoard();
      setDeals(data.deals || []);
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudo cargar el embudo");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = "Embudo de Ventas";
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) return;
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!debouncedQ.trim()) return deals;
    const ql = debouncedQ.toLowerCase();
    return deals.filter((d) =>
      (d.title || "").toLowerCase().includes(ql) ||
      (d.clientName || "").toLowerCase().includes(ql) ||
      (d.ownerName || "").toLowerCase().includes(ql)
    );
  }, [deals, debouncedQ]);

  const grouped = useMemo(() => {
    const map: Record<Stage, Deal[]> = {
      PROSPECTO: [], CONTACTO: [], CALIFICADO: [],
      PROPUESTA: [], CERRADO_GANADO: [], CERRADO_PERDIDO: [],
    };
    for (const d of filtered) map[d.stage]?.push(d);
    return map;
  }, [filtered]);

  const totals = useMemo(() => {
    const tot: Record<Stage, number> = {
      PROSPECTO: 0, CONTACTO: 0, CALIFICADO: 0,
      PROPUESTA: 0, CERRADO_GANADO: 0, CERRADO_PERDIDO: 0,
    };
    for (const d of filtered) tot[d.stage] += Number(d.amount || 0);
    return tot;
  }, [filtered]);

  async function handleDrop(dealId: number, toStage: Stage) {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: toStage } : d))
    ); // optimista

    try {
      await updateDealStage(dealId, toStage);
    } catch (e) {
      // revertir si falla
      setDeals((prev) => {
        // carga original
        const original = deals.find((x) => x.id === dealId);
        return prev.map((d) => (d.id === dealId ? { ...d, stage: original?.stage || d.stage } : d));
      });
      alert("No se pudo actualizar la etapa.");
    }
  }

  return (
    <AppLayout title="Embudo de Ventas">
      {/* Encabezado */}
      <Paper
        elevation={0}
        sx={{ p: 2.5, mb: 2, borderRadius: 3, border: "1px solid #eef2f7", background: "#eef6ff" }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={800}>Embudo de Ventas</Typography>
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">Gestión</Typography>
              <Typography color="text.primary">Pipeline</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {/* Filtros / acciones */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <TextField
          size="small"
          placeholder="Buscar por oportunidad, cliente o responsable"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ width: 420 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />

        <Box sx={{ flex: 1 }} />

        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => alert("Crear nueva oportunidad")}>
          Nueva Oportunidad
        </Button>
      </Stack>

      {/* Errores */}
      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

      {/* Board */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid #eef2f7",
          borderRadius: 3,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        {loading ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <Box sx={{ p: 1.5, borderBottom: "1px solid #eef2f7", background: "#fbfdff" }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Arrastra tarjetas entre etapas para cambiar su estado.
                </Typography>
                <Divider orientation="vertical" flexItem />
                <Typography variant="body2">
                  Ganado: <b>{PEN(totals.CERRADO_GANADO)}</b>
                </Typography>
              </Stack>
            </Box>

            <Box sx={{ p: 1.5, overflowX: "auto" }}>
              <Stack direction="row" alignItems="flex-start">
                {STAGES.map((s) => (
                  <StageColumn
                    key={s.key}
                    title={s.title}
                    color={s.color}
                    stageKey={s.key}
                    items={grouped[s.key] || []}
                    totalAmount={totals[s.key] || 0}
                    onDropDeal={handleDrop}
                  />
                ))}
              </Stack>
            </Box>
          </>
        )}
      </Paper>
    </AppLayout>
  );
}
