import {
  Box,
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ArrowRight, Shield, Activity, Users, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../layout/Logo";

export default function HeroSection() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 50%, #9333ea 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background circles */}
      <Box
        sx={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.05)",
          top: -200,
          right: -200,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.03)",
          bottom: -100,
          left: -100,
        }}
      />

      {/* Sticky Navbar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: "space-between", px: { xs: 0 } }}>
            <Logo variant="light" size="md" />

            <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 3, alignItems: "center" }}>
              <Typography
                component="a"
                href="#features"
                sx={{ color: "rgba(255,255,255,0.85)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500, "&:hover": { color: "white" } }}
              >
                Features
              </Typography>
              <Typography
                component="a"
                href="#stats"
                sx={{ color: "rgba(255,255,255,0.85)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500, "&:hover": { color: "white" } }}
              >
                Stats
              </Typography>
              <Typography
                component="a"
                href="#testimonials"
                sx={{ color: "rgba(255,255,255,0.85)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500, "&:hover": { color: "white" } }}
              >
                Testimonials
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button
                variant="text"
                sx={{ color: "white", fontWeight: 500 }}
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                sx={{
                  bgcolor: "white",
                  color: "primary.dark",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
                }}
                onClick={() => navigate("/signup/patient")}
              >
                Get Started
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Content */}
      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 16 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 6, md: 8 },
            alignItems: "center",
          }}
        >
          {/* Left: text */}
          <Box>
            <Typography
              variant="h1"
              sx={{
                color: "white",
                mb: 3,
                fontSize: { xs: "2.5rem", md: "3.5rem" },
              }}
            >
              Smarter Prescribing.{" "}
              <Box component="span" sx={{ color: "rgba(255,255,255,0.8)" }}>
                Safer Patients.
              </Box>
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "rgba(255,255,255,0.8)",
                fontWeight: 400,
                lineHeight: 1.7,
                mb: 5,
                maxWidth: 520,
              }}
            >
              MediRisk uses AI-powered analysis to detect drug interactions,
              assess side-effect risks, and give healthcare providers the
              insights they need to prescribe safely.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowRight size={18} />}
                onClick={() => navigate("/signup/patient")}
                sx={{
                  bgcolor: "white",
                  color: "primary.dark",
                  px: 4,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
                }}
              >
                Get Started Free
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }}
                sx={{
                  borderColor: "rgba(255,255,255,0.4)",
                  color: "white",
                  px: 4,
                  "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.1)" },
                }}
              >
                See How It Works
              </Button>
            </Box>
          </Box>

          {/* Right: floating preview card */}
          {!isMobile && (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Card
                sx={{
                  maxWidth: 380,
                  borderRadius: 4,
                  boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
                  transform: "rotate(2deg)",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: "primary.light",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "primary.dark",
                      }}
                    >
                      <Shield size={18} />
                    </Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Risk Overview
                    </Typography>
                  </Box>

                  {[
                    { label: "Drug Interactions", value: 85, color: "#ef4444", icon: Activity },
                    { label: "Patient Safety Score", value: 92, color: "#10b981", icon: Users },
                    { label: "Risk Trend", value: 67, color: "#f59e0b", icon: TrendingUp },
                  ].map((item) => (
                    <Box key={item.label} sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <item.icon size={14} color={item.color} />
                          <Typography variant="caption" color="text.secondary">
                            {item.label}
                          </Typography>
                        </Box>
                        <Typography variant="caption" fontWeight={600}>
                          {item.value}%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: "grey.100",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            height: "100%",
                            width: `${item.value}%`,
                            bgcolor: item.color,
                            borderRadius: 3,
                          }}
                        />
                      </Box>
                    </Box>
                  ))}

                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      bgcolor: "grey.50",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "success.main",
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      All systems operational
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
