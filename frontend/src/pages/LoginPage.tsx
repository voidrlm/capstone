import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
} from "@mui/material";
import { Shield, Mail, KeyRound, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Please enter your email and password");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || "Invalid email or password");
        return;
      }
      setSuccess("Login successful.");
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      // Redirect based on role
      const role = data.data.user.role;
      setTimeout(() => {
        if (role === "patient") {
          navigate("/dashboard/patient");
        } else {
          navigate("/dashboard/provider");
        }
      }, 800);
    } catch {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        {/* Logo / Brand */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.2)",
              mb: 2,
            }}
          >
            <Shield size={32} color="white" />
          </Box>
          <Typography variant="h4" sx={{ color: "white", fontWeight: 700 }}>
            MediRisk
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mt: 0.5 }}>
            Safer prescribing decisions
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} mb={0.5}>
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Sign in to your account to continue
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={18} color="#64748b" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyRound size={18} color="#64748b" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isLoading}
                sx={{ mb: 2 }}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </Box>

            <Divider sx={{ my: 2 }}>
              <Chip label="New to MediRisk?" size="small" />
            </Divider>

            <Box sx={{ display: "flex", gap: 1.5, flexDirection: "column" }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate("/signup/provider")}
              >
                Register as Healthcare Provider
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate("/signup/patient")}
              >
                Register as Patient
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={2}>
              Demo credentials: doctor@medirisk.com / password123
            </Typography>
          </CardContent>
        </Card>

        <Typography variant="caption" color="rgba(255,255,255,0.7)" display="block" textAlign="center" mt={2}>
          © 2025 MediRisk · Clark University ·{" "}
          <Link href="#" color="inherit">
            Privacy Policy
          </Link>
        </Typography>
      </Container>
    </Box>
  );
}

export default LoginPage;
