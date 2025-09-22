import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../apis/auth";

// MUI
import {
  TextField,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Button,
  Box,
  Typography,
  Paper,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login";
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Tu API de login (debe guardar token si aplica)
      await login(username.trim(), password);

      // ✅ Persistimos username para el layout
      localStorage.setItem("username", username.trim());

      if (remember) localStorage.setItem("remember", "1");
      navigate("/dashboard");
    } catch {
      setError("Usuario o contraseña inválidos");
    }
  };

  return (
    <Box className="vcm-auth" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, minHeight: "100vh" }}>
      {/* Columna izquierda con ilustración */}
      <Box className="vcm-side" sx={{ display: { xs: "none", md: "block" }, background: "linear-gradient(135deg,#0ea5e9 0%,#22c55e 100%)" }} />

      {/* Columna derecha con formulario */}
      <Box className="vcm-form-wrap" sx={{ display: "grid", placeItems: "center", p: 3 }}>
        <Box sx={{ width: "100%", maxWidth: 420 }}>
          <Box className="vcm-brand" sx={{ textAlign: "center", mb: 3 }}>
            <img
              src="/vcm-logo.svg"
              alt="GRUPO VCM"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              style={{ height: 48 }}
            />
            <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>
              GRUPO <span style={{ color: "#0ea5e9" }}>VCM</span>
            </Typography>
            <Typography variant="body2" color="text.secondary">Sistema CRM • Acceso</Typography>
          </Box>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #eef2f7" }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
              Iniciar sesión
            </Typography>

            <Box component="form" onSubmit={onSubmit}>
              {/* Usuario */}
              <TextField
                fullWidth
                label="Usuario *"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
              />

              {/* Contraseña */}
              <TextField
                fullWidth
                label="Contraseña *"
                variant="outlined"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={(e) => {
                          e.preventDefault();
                          setShowPassword((v) => !v);
                        }}
                        edge="end"
                        aria-label="mostrar/ocultar contraseña"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Recordar */}
              <FormControlLabel
                control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
                label="Recordar este dispositivo"
              />

              {/* Error */}
              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}

              {/* Botón ingresar */}
              <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
                Ingresar
              </Button>
            </Box>

            <Box className="vcm-foot" sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                © {new Date().getFullYear()} Desarrollado por TI M360 - Todos los derechos reservados.
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
