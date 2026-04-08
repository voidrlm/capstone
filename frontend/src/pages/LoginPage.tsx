import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
  useTheme,
} from "@mui/material";
import { Shield, Mail, KeyRound, Eye, EyeOff, ArrowRight, Activity, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

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
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || "Invalid email or password");
        return;
      }
      setSuccess("Login successful.");
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
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
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      {/* Left panel */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          width: "45%",
          background: "linear-gradient(160deg, #04080f 0%, #0a1628 55%, #0c2820 100%)",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: 6,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative orbs */}
        <Box sx={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.06)" }} />
        <Box sx={{ position: "absolute", bottom: -120, left: -60, width: 400, height: 400, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.04)" }} />
        <Box sx={{ position: "absolute", top: "40%", right: "10%", width: 150, height: 150, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.05)" }} />
        <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 60% at 50% 40%, rgba(0,212,170,0.07) 0%, transparent 70%)" }} />

        <Box sx={{ position: "relative", zIndex: 1, maxWidth: 440, textAlign: "center" }}>
          {/* Logo mark */}
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 4,
              background: "linear-gradient(135deg, rgba(0,212,170,0.2) 0%, rgba(0,153,204,0.15) 100%)",
              mb: 4,
              border: "1px solid rgba(0,212,170,0.25)",
              boxShadow: "0 0 40px rgba(0,212,170,0.15)",
            }}
          >
            <Shield size={36} color="#00d4aa" />
          </Box>
          <Typography variant="h3" sx={{ color: "white", fontWeight: 800, mb: 2, fontFamily: '"Bricolage Grotesque", sans-serif' }}>
            MediRisk
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.5)", mb: 6, lineHeight: 1.7 }}>
            Empowering safer prescribing decisions through intelligent drug interaction analysis and patient risk monitoring.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { icon: Shield, text: "Drug interaction analysis" },
              { icon: Activity, text: "Real-time risk monitoring" },
              { icon: Heart, text: "Patient safety scoring" },
            ].map((feat) => {
              const FeatIcon = feat.icon;
              return (
                <Box
                  key={feat.text}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    borderRadius: 3,
                    bgcolor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <FeatIcon size={20} color="#00d4aa" />
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.65)" }}>
                    {feat.text}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Right panel — form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, sm: 6 },
          bgcolor: "background.default",
          overflow: "auto",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 440 }}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1, mb: 4 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                background: "linear-gradient(135deg, #00d4aa 0%, #0099cc 100%)",
                display: "flex",
              }}
            >
              <Shield size={20} color="#04080f" />
            </Box>
            <Typography variant="h6" fontWeight={800}>
              MediRisk
            </Typography>
          </Box>

          <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
            Welcome back
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Sign in to your account to continue
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2.5 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>
              Email address
            </Typography>
            <TextField
              fullWidth
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail size={18} color="#94a3b8" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2.5 }}
            />

            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>
              Password
            </Typography>
            <TextField
              fullWidth
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyRound size={18} color="#94a3b8" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
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
              endIcon={!isLoading && <ArrowRight size={18} />}
              sx={{ mb: 2, py: 1.5 }}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Chip
              label="New to MediRisk?"
              size="small"
              sx={{
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
              }}
            />
          </Divider>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate("/signup/provider")}
              sx={{
                py: 1.25,
                borderColor: "divider",
                color: "text.primary",
                "&:hover": {
                  borderColor: "#00d4aa",
                  bgcolor: isDark ? "rgba(0,212,170,0.06)" : "rgba(0,212,170,0.04)",
                },
              }}
            >
              Healthcare Provider
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate("/signup/patient")}
              sx={{
                py: 1.25,
                borderColor: "divider",
                color: "text.primary",
                "&:hover": {
                  borderColor: "#00d4aa",
                  bgcolor: isDark ? "rgba(0,212,170,0.06)" : "rgba(0,212,170,0.04)",
                },
              }}
            >
              Patient
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={3}>
            Demo credentials: doctor@medirisk.com / password123
          </Typography>

          <Divider sx={{ my: 2.5 }}>
            <Chip
              label="Sample Patient PDFs"
              size="small"
              sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}
            />
          </Divider>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
            {[
              "John Doe", "Jane Smith", "Robert Johnson", "Emily Davis", "Michael Wilson",
              "Sarah Moore", "David Taylor", "Lisa Anderson", "William Thomas", "Mary Jackson",
            ].map((name) => (
              <Link
                key={name}
                href={`/sample_patients/${name.replace(" ", "_").toLowerCase()}.pdf`}
                target="_blank"
                download
                variant="caption"
                sx={{
                  textDecoration: "none",
                  bgcolor: isDark ? "rgba(255,255,255,0.04)" : "white",
                  border: "1px solid",
                  borderColor: "divider",
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  color: "text.secondary",
                  fontWeight: 500,
                  transition: "all 0.15s ease",
                  "&:hover": { borderColor: "#00d4aa", color: "#00d4aa" },
                }}
              >
                {name}
              </Link>
            ))}
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={3}>
            © 2025 MediRisk · Clark University ·{" "}
            <Link href="#" color="inherit">
              Privacy Policy
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default LoginPage;
