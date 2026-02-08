import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
  Link,
  Paper,
} from "@mui/material";
import {
  Shield,
  Activity,
  Pill,
  BarChart3,
  Users,
  Lock,
  AlertTriangle,
  ClipboardList,
  FileText,
  Brain,
  Database,
  Zap,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

function FeaturesPage() {
  const coreFeatures = [
    {
      icon: Brain,
      title: "AI-Powered Risk Assessment",
      description:
        "Advanced machine learning algorithms analyze patient data, medication history, and known drug interactions to provide accurate risk predictions.",
      highlights: [
        "Real-time risk scoring",
        "Personalized recommendations",
        "Evidence-based analysis",
      ],
    },
    {
      icon: Pill,
      title: "Drug Interaction Detection",
      description:
        "Comprehensive database of drug interactions with severity ratings and clinical recommendations for safer prescribing.",
      highlights: [
        "50,000+ drug profiles",
        "Multi-drug analysis",
        "Contraindication alerts",
      ],
    },
    {
      icon: BarChart3,
      title: "Clinical Dashboard",
      description:
        "Intuitive dashboard for healthcare providers to monitor patient risk levels, track outcomes, and make informed decisions.",
      highlights: [
        "Visual risk indicators",
        "Trend analysis",
        "Exportable reports",
      ],
    },
    {
      icon: Users,
      title: "Patient Management",
      description:
        "Centralized patient records with medication histories, adverse reaction tracking, and risk assessment results.",
      highlights: [
        "Complete medication history",
        "ADR documentation",
        "Patient demographics",
      ],
    },
  ];

  const patientFeatures = [
    {
      icon: ClipboardList,
      title: "Medication Tracking",
      description:
        "Keep a complete digital record of all your prescriptions and medications in one secure place.",
    },
    {
      icon: AlertTriangle,
      title: "Side Effect Awareness",
      description:
        "Understand potential side effects and what symptoms to watch for with your medications.",
    },
    {
      icon: FileText,
      title: "Health Reports",
      description:
        "Access easy-to-understand reports about your medication risks and safety profile.",
    },
  ];

  const providerFeatures = [
    {
      icon: Database,
      title: "FDA Database Integration",
      description:
        "Direct integration with FDA adverse event reporting system for comprehensive drug safety data.",
    },
    {
      icon: Zap,
      title: "Real-Time Alerts",
      description:
        "Instant notifications when high-risk drug combinations are detected in patient prescriptions.",
    },
    {
      icon: Activity,
      title: "Outcome Tracking",
      description:
        "Monitor patient outcomes and refine risk assessments based on real-world data.",
    },
  ];

  const securityFeatures = [
    "HIPAA Compliant",
    "256-bit Encryption",
    "SOC 2 Type II",
    "Role-Based Access",
    "Audit Logging",
    "99.9% Uptime SLA",
  ];

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
            <Link
              href="/"
              underline="none"
              sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
            >
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
            </Link>

            <Stack direction="row" spacing={4} alignItems="center">
              <Link
                href="/features"
                underline="none"
                sx={{ color: "primary.main", fontWeight: 600 }}
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
              <Button component={Link} href="/" variant="contained">
                Sign In
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
          color: "white",
          py: 10,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={800} gutterBottom>
            Powerful Features for{" "}
            <Box component="span" sx={{ color: "rgba(255,255,255,0.9)" }}>
              Safer Healthcare
            </Box>
          </Typography>
          <Typography
            variant="h6"
            sx={{ opacity: 0.9, fontWeight: 400, lineHeight: 1.7 }}
          >
            Discover how MediRisk helps healthcare providers and patients make
            informed decisions about medication safety through advanced
            analytics and comprehensive drug data.
          </Typography>
        </Container>
      </Box>

      {/* Core Features */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Core Platform Features
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive tools designed for modern healthcare environments
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {coreFeatures.map((feature, index) => (
            <Grid size={{ xs: 12, md: 6 }} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: "primary.light",
                      borderRadius: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "primary.main",
                      mb: 2,
                    }}
                  >
                    <feature.icon size={28} />
                  </Box>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {feature.description}
                  </Typography>
                  <Stack spacing={1}>
                    {feature.highlights.map((item, i) => (
                      <Box
                        key={i}
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckCircle2 size={16} color="#3b82f6" />
                        <Typography variant="body2">{item}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* For Patients Section */}
      <Box sx={{ bgcolor: "rgba(59, 130, 246, 0.04)", py: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <Chip
                label="For Patients"
                color="primary"
                sx={{ mb: 2, fontWeight: 600 }}
              />
              <Typography variant="h3" fontWeight={700} gutterBottom>
                Take Control of Your Medication Safety
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Understand your medications, track your prescriptions, and stay
                informed about potential risks with our patient-focused
                features.
              </Typography>
              <Button
                component={Link}
                href="/signup/patient"
                variant="contained"
                size="large"
                endIcon={<ArrowRight size={18} />}
              >
                Create Patient Account
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={2}>
                {patientFeatures.map((feature, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{ p: 3, display: "flex", gap: 2, bgcolor: "white" }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: "primary.light",
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "primary.main",
                        flexShrink: 0,
                      }}
                    >
                      <feature.icon size={22} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* For Providers Section */}
      <Box sx={{ bgcolor: "rgba(16, 185, 129, 0.04)", py: 10 }}>
        <Container maxWidth="lg">
          <Grid
            container
            spacing={6}
            alignItems="center"
            direction={{ xs: "column-reverse", md: "row" }}
          >
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={2}>
                {providerFeatures.map((feature, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{ p: 3, display: "flex", gap: 2, bgcolor: "white" }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: "rgba(16, 185, 129, 0.15)",
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "secondary.main",
                        flexShrink: 0,
                      }}
                    >
                      <feature.icon size={22} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Chip
                label="For Healthcare Providers"
                color="secondary"
                sx={{ mb: 2, fontWeight: 600 }}
              />
              <Typography variant="h3" fontWeight={700} gutterBottom>
                Clinical-Grade Risk Assessment
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Empower your organization with advanced analytics, real-time
                alerts, and comprehensive drug safety data to enhance patient
                care.
              </Typography>
              <Button
                component={Link}
                href="/signup/provider"
                variant="contained"
                color="secondary"
                size="large"
                endIcon={<ArrowRight size={18} />}
              >
                Register Your Organization
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Security Section */}
      <Container maxWidth="md" sx={{ py: 10, textAlign: "center" }}>
        <Lock size={40} color="#3b82f6" style={{ marginBottom: 16 }} />
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Enterprise-Grade Security
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Your data security is our top priority
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 2,
          }}
        >
          {securityFeatures.map((feature, index) => (
            <Chip
              key={index}
              icon={<CheckCircle2 size={16} />}
              label={feature}
              variant="outlined"
              sx={{ px: 1.5, py: 2.5 }}
            />
          ))}
        </Box>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          color: "white",
          py: 10,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Ready to Enhance Patient Safety?
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, mb: 4 }}>
            Join healthcare organizations already using MediRisk to improve
            medication safety outcomes.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              component={Link}
              href="/signup/provider"
              variant="contained"
              size="large"
            >
              Get Started
            </Button>
            <Button
              component={Link}
              href="/about"
              variant="outlined"
              size="large"
              sx={{
                borderColor: "white",
                color: "white",
                "&:hover": {
                  borderColor: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              Learn More
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 4,
          textAlign: "center",
          bgcolor: "white",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © 2026 MediRisk — Clark University Capstone Project
        </Typography>
        <Typography variant="caption" color="text.disabled">
          For Demonstration Purposes Only
        </Typography>
      </Box>
    </Box>
  );
}

export default FeaturesPage;
