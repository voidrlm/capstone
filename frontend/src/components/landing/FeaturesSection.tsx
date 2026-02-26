import { Box, Container, Typography, Card, CardContent, Grid } from "@mui/material";
import {
  FileText,
  Activity,
  Shield,
  AlertTriangle,
  TrendingUp,
  Lock,
} from "lucide-react";

const features = [
  {
    title: "Patient Health Records",
    description:
      "Securely store and manage comprehensive patient health records with easy access for authorized providers.",
    icon: FileText,
    color: "#3b82f6",
    bgColor: "#eff6ff",
  },
  {
    title: "Drug Side Effects Analysis",
    description:
      "AI-powered analysis of potential side effects based on patient history, genetics, and current medications.",
    icon: Activity,
    color: "#f97316",
    bgColor: "#fff7ed",
  },
  {
    title: "Drug Combination Risk Checker",
    description:
      "Instantly check for dangerous drug interactions before prescribing. Get real-time safety alerts.",
    icon: Shield,
    color: "#ef4444",
    bgColor: "#fef2f2",
  },
  {
    title: "Side Effect Tracking",
    description:
      "Patients can log and track side effects over time, helping providers make better-informed decisions.",
    icon: AlertTriangle,
    color: "#eab308",
    bgColor: "#fefce8",
  },
  {
    title: "Analytics Dashboard",
    description:
      "Comprehensive analytics with visual charts showing risk trends, medication patterns, and patient outcomes.",
    icon: TrendingUp,
    color: "#10b981",
    bgColor: "#ecfdf5",
  },
  {
    title: "Role-Based Access & Security",
    description:
      "HIPAA-compliant platform with role-based access control ensuring data security for every user.",
    icon: Lock,
    color: "#8b5cf6",
    bgColor: "#f5f3ff",
  },
];

export default function FeaturesSection() {
  return (
    <Box id="features" sx={{ py: { xs: 8, md: 12 }, bgcolor: "background.default" }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="overline"
            sx={{ color: "primary.main", fontWeight: 600, letterSpacing: 2 }}
          >
            PLATFORM FEATURES
          </Typography>
          <Typography variant="h2" sx={{ mt: 1, mb: 2 }}>
            Everything You Need for Drug Safety
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: "auto" }}
          >
            MediRisk provides a comprehensive suite of tools designed to reduce
            prescribing errors and improve patient outcomes.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature.title}>
                <Card
                  sx={{
                    height: "100%",
                    cursor: "default",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        bgcolor: feature.bgColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2.5,
                      }}
                    >
                      <Icon size={24} color={feature.color} />
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}
