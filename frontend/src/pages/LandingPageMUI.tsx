import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Link,
  InputAdornment,
  Chip,
  Stack,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
} from "@mui/material";
import {
  Shield,
  Activity,
  Users,
  Lock,
  AlertTriangle,
  ClipboardList,
  Pill,
  Stethoscope,
  ChevronRight,
  Heart,
  FileText,
  BarChart3,
  CheckCircle2,
  Mail,
  KeyRound,
} from "lucide-react";

type LoginMode = "patient" | "provider";

function LandingPage() {
  const [loginMode, setLoginMode] = useState<LoginMode>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log(`${loginMode} login:`, { email, password });
    setTimeout(() => setIsLoading(false), 1500);
  };

  const patientFeatures = [
    {
      icon: ClipboardList,
      title: "Medication Tracking",
      description:
        "Complete digital record of your prescriptions and medication history",
    },
    {
      icon: AlertTriangle,
      title: "Risk Awareness",
      description: "Understand potential side effects and drug interactions",
    },
    {
      icon: Lock,
      title: "HIPAA Compliant",
      description: "Your health data is encrypted and protected",
    },
  ];

  const providerFeatures = [
    {
      icon: BarChart3,
      title: "Risk Analytics",
      description: "AI-powered patient risk assessment dashboard",
    },
    {
      icon: Pill,
      title: "Drug Interactions",
      description: "Real-time detection of dangerous combinations",
    },
    {
      icon: Users,
      title: "Patient Management",
      description: "Streamlined records and medication histories",
    },
  ];

  const stats = [
    { icon: Pill, number: "50,000+", label: "Drug Profiles" },
    { icon: FileText, number: "2M+", label: "Interaction Checks" },
    { icon: Users, number: "10,000+", label: "Active Users" },
    { icon: Shield, number: "99.9%", label: "Uptime" },
  ];

  const features = loginMode === "patient" ? patientFeatures : providerFeatures;
  const isProvider = loginMode === "provider";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid",
          borderColor: "divider",
          py: 2,
          px: 3,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: "primary.main",
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                }}
              >
                <Shield size={24} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                  MediRisk
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Drug Safety Platform
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={4} alignItems="center">
              <Link
                href="/features"
                underline="none"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                Features
              </Link>
              <Link
                href="/about"
                underline="none"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                About
              </Link>
              <ToggleButtonGroup
                value={loginMode}
                exclusive
                onChange={(_, value) => value && setLoginMode(value)}
                size="small"
                sx={{
                  "& .MuiToggleButton-root": {
                    px: 2,
                    py: 0.75,
                    border: "none",
                    borderRadius: "8px !important",
                    textTransform: "none",
                    fontWeight: 500,
                  },
                  "& .Mui-selected": {
                    bgcolor: isProvider ? "secondary.main" : "primary.main",
                    color: "white !important",
                    "&:hover": {
                      bgcolor: isProvider ? "secondary.dark" : "primary.dark",
                    },
                  },
                }}
              >
                <ToggleButton value="patient">
                  <Heart size={16} style={{ marginRight: 6 }} /> Patient
                </ToggleButton>
                <ToggleButton value="provider">
                  <Stethoscope size={16} style={{ marginRight: 6 }} /> Provider
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={6} alignItems="center">
          {/* Left Side */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Chip
              icon={<Activity size={14} />}
              label="Trusted by Healthcare Professionals"
              sx={{
                mb: 3,
                bgcolor: "primary.light",
                color: "primary.dark",
                fontWeight: 600,
              }}
            />
            <Typography
              variant="h2"
              fontWeight={800}
              gutterBottom
              sx={{ lineHeight: 1.2 }}
            >
              Intelligent Drug Safety
              <Box
                component="span"
                sx={{ color: isProvider ? "secondary.main" : "primary.main" }}
              >
                {" "}
                Risk Assessment
              </Box>
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4, lineHeight: 1.7, fontSize: "1.1rem" }}
            >
              MediRisk provides comprehensive drug interaction analysis and
              personalized risk assessment to enhance patient safety and support
              clinical decision-making.
            </Typography>

            <Stack spacing={2.5} sx={{ mb: 4 }}>
              {features.map((feature, index) => (
                <Box key={index} sx={{ display: "flex", gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: isProvider
                        ? "rgba(16, 185, 129, 0.1)"
                        : "primary.light",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isProvider ? "secondary.main" : "primary.main",
                      flexShrink: 0,
                    }}
                  >
                    <feature.icon size={22} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>

            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
              {[
                "FDA Database Integration",
                "Evidence-Based Analysis",
                "Real-Time Monitoring",
              ].map((item, i) => (
                <Box
                  key={i}
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <CheckCircle2
                    size={16}
                    color={isProvider ? "#10b981" : "#3b82f6"}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {item}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Grid>

          {/* Right Side - Login Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              elevation={0}
              sx={{
                boxShadow: "0 25px 60px rgba(0, 0, 0, 0.12)",
                maxWidth: 440,
                mx: "auto",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ textAlign: "center", mb: 3 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: isProvider
                        ? "rgba(16, 185, 129, 0.15)"
                        : "primary.light",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 2,
                      color: isProvider ? "secondary.main" : "primary.main",
                    }}
                  >
                    {isProvider ? (
                      <Stethoscope size={24} />
                    ) : (
                      <Heart size={24} />
                    )}
                  </Box>
                  <Typography variant="h5" fontWeight={700}>
                    {isProvider ? "Provider Login" : "Patient Portal"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isProvider
                      ? "Access the clinical dashboard"
                      : "Access your medication profile"}
                  </Typography>
                </Box>

                <form onSubmit={handleLogin}>
                  <Stack spacing={2.5}>
                    <TextField
                      label={isProvider ? "Work Email" : "Email Address"}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        isProvider
                          ? "Enter your institutional email"
                          : "Enter your email"
                      }
                      required
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Mail size={18} color="#9ca3af" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <KeyRound size={18} color="#9ca3af" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      color={isProvider ? "secondary" : "primary"}
                      size="large"
                      disabled={isLoading}
                      endIcon={<ChevronRight size={18} />}
                      fullWidth
                    >
                      {isLoading
                        ? "Signing In..."
                        : isProvider
                          ? "Access Dashboard"
                          : "Sign In"}
                    </Button>
                  </Stack>
                </form>

                <Box sx={{ textAlign: "center", mt: 3 }}>
                  <Link
                    href="#forgot"
                    underline="hover"
                    variant="body2"
                    color="text.secondary"
                  >
                    Forgot password?
                  </Link>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 2 }}
                  >
                    {isProvider
                      ? "Register your organization "
                      : "New patient? "}
                    <Link
                      href={isProvider ? "/signup/provider" : "/signup/patient"}
                      underline="hover"
                      fontWeight={600}
                      color={isProvider ? "secondary.main" : "primary.main"}
                    >
                      {isProvider
                        ? "Create Healthcare Account"
                        : "Create an account"}
                    </Link>
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Stats Section */}
      <Box
        sx={{ bgcolor: isProvider ? "secondary.main" : "primary.main", py: 5 }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid size={{ xs: 6, md: 3 }} key={index}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    color: "white",
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: "rgba(255, 255, 255, 0.15)",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <stat.icon size={22} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {stat.number}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Disclaimer */}
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert
          severity="warning"
          icon={<AlertTriangle size={20} />}
          sx={{ borderRadius: 3 }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Educational Project Disclaimer
          </Typography>
          <Typography variant="body2">
            This is a <strong>capstone demonstration project</strong> developed
            for educational purposes at Clark University. MediRisk is{" "}
            <strong>NOT</strong> a certified medical device and should{" "}
            <strong>NOT</strong> be used for actual clinical decision-making.
            Always consult qualified healthcare professionals for medical
            advice.
          </Typography>
        </Alert>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{ bgcolor: "#1e293b", color: "white", py: 6 }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}
              >
                <Shield size={24} />
                <Typography variant="h6" fontWeight={700}>
                  MediRisk
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Drug Side-Effect Risk Assessment Platform
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Platform
              </Typography>
              <Stack spacing={1}>
                <Link
                  href="/features"
                  color="inherit"
                  underline="hover"
                  sx={{ opacity: 0.7, fontSize: "0.875rem" }}
                >
                  Features
                </Link>
                <Link
                  href="#security"
                  color="inherit"
                  underline="hover"
                  sx={{ opacity: 0.7, fontSize: "0.875rem" }}
                >
                  Security
                </Link>
                <Link
                  href="#integrations"
                  color="inherit"
                  underline="hover"
                  sx={{ opacity: 0.7, fontSize: "0.875rem" }}
                >
                  Integrations
                </Link>
              </Stack>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Resources
              </Typography>
              <Stack spacing={1}>
                <Link
                  href="#docs"
                  color="inherit"
                  underline="hover"
                  sx={{ opacity: 0.7, fontSize: "0.875rem" }}
                >
                  Documentation
                </Link>
                <Link
                  href="#support"
                  color="inherit"
                  underline="hover"
                  sx={{ opacity: 0.7, fontSize: "0.875rem" }}
                >
                  Support
                </Link>
                <Link
                  href="#faq"
                  color="inherit"
                  underline="hover"
                  sx={{ opacity: 0.7, fontSize: "0.875rem" }}
                >
                  FAQ
                </Link>
              </Stack>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Legal
              </Typography>
              <Stack spacing={1}>
                <Link
                  href="#privacy"
                  color="inherit"
                  underline="hover"
                  sx={{ opacity: 0.7, fontSize: "0.875rem" }}
                >
                  Privacy Policy
                </Link>
                <Link
                  href="#terms"
                  color="inherit"
                  underline="hover"
                  sx={{ opacity: 0.7, fontSize: "0.875rem" }}
                >
                  Terms of Use
                </Link>
                <Link
                  href="#hipaa"
                  color="inherit"
                  underline="hover"
                  sx={{ opacity: 0.7, fontSize: "0.875rem" }}
                >
                  HIPAA Notice
                </Link>
              </Stack>
            </Grid>
          </Grid>
          <Box
            sx={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              mt: 4,
              pt: 4,
              textAlign: "center",
            }}
          >
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              © 2026 MediRisk — Clark University Capstone Project
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.5 }}>
              For Demonstration Purposes Only
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default LandingPage;
