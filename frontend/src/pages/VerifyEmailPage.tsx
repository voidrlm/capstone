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
} from "@mui/material";
import { Shield, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

function VerifyEmailPage() {
  const navigate = useNavigate();
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

    // Prevent StrictMode from firing a second request
    // (the first request consumes the token, so a second would always fail)
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
        background: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box sx={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", bgcolor: "rgba(96,165,250,0.08)" }} />
      <Box sx={{ position: "absolute", bottom: -120, left: -60, width: 400, height: 400, borderRadius: "50%", bgcolor: "rgba(96,165,250,0.05)" }} />
      <Box sx={{ position: "absolute", top: "40%", right: "10%", width: 150, height: 150, borderRadius: "50%", bgcolor: "rgba(96,165,250,0.06)" }} />

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
              bgcolor: "rgba(96,165,250,0.15)",
              mb: 3,
              border: "1px solid rgba(96,165,250,0.2)",
            }}
          >
            <Shield size={36} color="#60a5fa" />
          </Box>
          <Typography variant="h3" sx={{ color: "white", fontWeight: 800 }}>
            MediRisk
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)", mt: 1 }}>
            Email Verification
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            {status === "loading" && (
              <>
                <CircularProgress size={48} sx={{ mb: 2, color: "#2563eb" }} />
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
                    bgcolor: "#f0fdf4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
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
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() => navigate("/login")}
                  sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
                >
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
                    bgcolor: "#fef2f2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
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
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() => navigate("/login")}
                  sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
                >
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
