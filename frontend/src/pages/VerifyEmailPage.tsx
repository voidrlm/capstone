import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    const controller = new AbortController();

    const verify = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
          { signal: controller.signal },
        );
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success) {
          setStatus("success");
          setMessage(data.data?.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data?.error?.message || "Verification failed. The link may be invalid or expired.");
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setStatus("error");
        setMessage("Unable to connect to server. Please try again.");
      }
    };

    verify();

    return () => controller.abort();
  }, [token]);

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
        </Box>

        <Card>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            {status === "loading" && (
              <>
                <CircularProgress size={48} sx={{ mb: 2 }} />
                <Typography variant="h6" fontWeight={600}>
                  Verifying your email...
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
                    bgcolor: "success.light",
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
                    bgcolor: "error.light",
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
