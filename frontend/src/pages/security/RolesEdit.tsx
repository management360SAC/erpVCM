// src/pages/security/RoleNew.tsx
import { useState } from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  Divider,
} from "@mui/material";
import AppLayout from "../../layout/AppLayout";
import { useNavigate } from "react-router-dom";
import { createRole } from "../../apis/role";

export default function RoleNew() {
  const nav = useNavigate();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [activo, setActivo] = useState(true);

  const handleSave = async () => {
    try {
      await createRole({
        name: nombre.toUpperCase().trim(),
        description: descripcion,
        isActive: activo,
      });
      nav("/seguridad/roles");
    } catch (err) {
      console.error("Error al crear rol", err);
      alert("No se pudo guardar el rol.");
    }
  };

  return (
    <AppLayout title="Nuevo Rol">
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: "1px solid #eef2f7",
          background: "#f6f9ff",
        }}
      >
        <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
          Nuevo Rol
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Stack spacing={3}>
          {/* Nombre */}
          <TextField
            fullWidth
            label="Nombre *"
            value={nombre}
            onChange={(e) => setNombre(e.target.value.toUpperCase())}
            helperText="Escribe el nombre del rol en mayúsculas"
          />

          {/* Descripción */}
          <TextField
            fullWidth
            label="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            multiline
            minRows={2}
          />

          {/* Estado */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography color="text.secondary">Estado</Typography>
            <Switch
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
            />
            <Typography
              color={activo ? "success.main" : "text.secondary"}
              fontWeight={700}
            >
              {activo ? "ACTIVO" : "INACTIVO"}
            </Typography>
          </Stack>
        </Stack>

        {/* Botones */}
        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 4 }}>
          <Button variant="outlined" onClick={() => nav("/seguridad/roles")}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Guardar
          </Button>
        </Stack>
      </Paper>
    </AppLayout>
  );
}
