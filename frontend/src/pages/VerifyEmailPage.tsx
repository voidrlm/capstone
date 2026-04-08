import { useEffect, useRef, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Alert,
  Button,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { Shield, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

function VerifyEmailPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    if (calledRef.current) return;
    calledRef.current = true;

    const verify = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
        );
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success) {
          setStatus("success");
          setMessage(data.data?.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data?.error?.message || "Verification failed. The link may be invalid or expired.");
        }
      } catch {
        setStatus("error");
        setMessage("Unable to connect to server. Please try again.");
      }
    };

    verify();
  }, [token]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: isDark
          ? "linear-gradient(160deg, #04080f 0%, #0a1628 55%, #0c2820 100%)"
          : "linear-gradient(160deg, #f1f5f9 0%, #e0fdf4 60%, #f0fdf4 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative orbs */}
      <Box sx={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.06)" }} />
      <Box sx={{ position: "absolute", bottom: -120, left: -60, width: 400, height: 400, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.04)" }} />
      <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 60% at 50% 40%, rgba(0,212,170,0.07) 0%, transparent 70%)" }} />

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 4,
              background: "linear-gradient(135deg, rgba(0,212,170,0.2) 0%, rgba(0,153,204,0.15) 100%)",
              mb: 3,
              border: "1px solid rgba(0,212,170,0.25)",
              boxShadow: "0 0 40px rgba(0,212,170,0.15)",
            }}
          >
            <Shield size={36} color="#00d4aa" />
          </Box>
          <Typography
            variant="h3"
            sx={{
              color: isDark ? "white" : "text.primary",
              fontWeight: 800,
              fontFamily: '"Bricolage Grotesque", sans-serif',
            }}
          >
            MediRisk
          </Typography>
          <Typography variant="body1" sx={{ color: isDark ? "rgba(255,255,255,0.5)" : "text.secondary", mt: 1 }}>
            Email Verification
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            {status === "loading" && (
              <>
                <CircularProgress size={48} sx={{ mb: 2, color: "#00d4aa" }} />
                <Typography variant="h6" fontWeight={600}>
                  Verifying your email...
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Please wait while we confirm your email address.
                </Typography>
              </>
            )}

            {status === "success" && (
              <>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    bgcolor: isDark ? "rgba(22,163,74,0.15)" : "#f0fdf4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                    border: isDark ? "1px solid rgba(22,163,74,0.25)" : "none",
                  }}
                >
                  <CheckCircle2 size={32} color="#16a34a" />
                </Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Email Verified!
                </Typography>
                <Alert severity="success" sx={{ mb: 3, textAlign: "left" }}>
                  {message}
                </Alert>
                <Button variant="contained" size="large" fullWidth onClick={() => navigate("/login")}>
                  Sign In to Your Account
                </Button>
              </>
            )}

            {status === "error" && (
              <>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    bgcolor: isDark ? "rgba(220,38,38,0.12)" : "#fef2f2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                    border: isDark ? "1px solid rgba(220,38,38,0.2)" : "none",
                  }}
                >
                  <XCircle size={32} color="#dc2626" />
                </Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Verification Failed
                </Typography>
                <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
                  {message}
                </Alert>
                <Button variant="contained" size="large" fullWidth onClick={() => navigate("/login")}>
                  Back to Sign In
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default VerifyEmailPage;
