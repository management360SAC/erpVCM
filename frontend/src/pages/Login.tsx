// src/pages/LoginPage.tsx
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../apis/auth";
import { getUsers, type UserResponse } from "../apis/user";

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
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login";
  }, []);

  const store = remember ? localStorage : sessionStorage;

  const persistAuth = (profile?: Partial<UserResponse>) => {
    store.setItem("username", (profile?.username ?? username).trim());
    store.setItem("userFullName", profile?.nombre ?? profile?.username ?? username);
    store.setItem("email", profile?.email ?? "");
    store.setItem("celular", profile?.celular ?? "");
    store.setItem("rol", profile?.rol ?? "ADMIN");
    if (remember) localStorage.setItem("remember", "1");
  };

  const fetchAndPersistProfile = async () => {
    try {
      const users = await getUsers();
      const me = users.find(
        (u) => (u.username ?? "").toLowerCase() === username.toLowerCase()
      );
      if (me) persistAuth(me);
      else persistAuth();
    } catch {
      persistAuth();
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { accessToken, refreshToken } = await login(username.trim(), password);
      store.setItem("accessToken", accessToken);
      if (refreshToken) store.setItem("refreshToken", refreshToken);
      await fetchAndPersistProfile();
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Usuario o contraseña inválidos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      className="vcm-auth"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        minHeight: "100vh",
      }}
    >
      {/* Columna izquierda con fondo anaranjado + logo */}
      <Box
        className="vcm-side"
        sx={{
          display: { xs: "none", md: "grid" },
          placeItems: "center",
          p: 4,
          background: "linear-gradient(135deg,#fb923c 0%, #f59e0b 100%)", // anaranjado
        }}
      >
        <Box
          sx={{
            bgcolor: "rgba(255, 255, 255, 1)",
            borderRadius: 3,
            p: 3,
            width: "min(420px, 90%)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            textAlign: "center",
          }}
        >
          <img
            // Usamos la imagen local. Si no existe, no intentamos un fallback,
            // pero el alt text sigue siendo "GRUPO VCM"
            src="/images/grupo-vcm.png" 
            alt="GRUPO VCM"
            onError={(e) => {
              // Opcional: Si /vcm-logo.svg falla, podrías ocultarla
              // (e.target as HTMLImageElement).style.display = "none";
              // Opcional: o no hacer nada si el svg es importante
            }}
            style={{
              width: "100%",
              maxWidth: 180, // Reducido para mejor apariencia
              height: "auto",
              objectFit: "contain",
              display: "block",
              margin: "0 auto",
            }}
          />
          <Typography variant="body2" color="text.secondary">
            Soluciones contables, fiscales y de gestión
          </Typography>
        </Box>
      </Box>

      {/* Columna derecha con formulario */}
      <Box className="vcm-form-wrap" sx={{ display: "grid", placeItems: "center", p: 3 }}>
        <Box sx={{ width: "100%", maxWidth: 420 }}>
          <Box className="vcm-brand" sx={{ textAlign: "center", mb: 3 }}>
            <img
              src="/vcm-logo.svg"
              alt="GRUPO VCM"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
              style={{ height: 48 }}
            />
            <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>
              GRUPO <span style={{ color: "#f97316" }}>VCM</span>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sistema CRM • Acceso
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #ffe4cc", // borde tenue anaranjado
              boxShadow: "0 8px 24px rgba(249, 115, 22, 0.08)",
            }}
          >
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
                autoFocus
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
                control={
                  <Checkbox
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    sx={{
                      color: "#fb923c",
                      "&.Mui-checked": { color: "#fb923c" },
                    }}
                  />
                }
                label="Recordar este dispositivo"
              />

              {/* Error */}
              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}

              {/* Botón ingresar */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 2,
                  py: 1.2,
                  fontWeight: 700,
                  bgcolor: "#f97316",
                  "&:hover": { bgcolor: "#ea580c" },
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1, color: "white" }} /> Ingresando…
                  </>
                ) : (
                  "Ingresar"
                )}
              </Button>
            </Box>

            <Box className="vcm-foot" sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                © {new Date().getFullYear()} Desarrollado por TI M360 - Todos los derechos
                reservados.
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}