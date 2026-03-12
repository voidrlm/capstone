import { Box, Typography, Grid, Card, CardContent, Alert, Chip } from "@mui/material";
import {
  Pill, Activity, Calendar, Heart, FileText, TrendingUp, AlertTriangle, Sparkles,
} from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import MedicationList from "../components/dashboard/MedicationList";
import NotificationList from "../components/dashboard/NotificationList";
import QuickActionGrid from "../components/dashboard/QuickActionGrid";
import { RiskRadarChart, RiskAreaChart } from "../components/dashboard/RiskChart";
import { medications, notifications, radarData, riskTrendData } from "../data/mockPatientData";

export default function PatientDashboard() {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const quickActions = [
    { icon: FileText, label: "View Reports", description: "Access your medical records" },
    { icon: TrendingUp, label: "Risk History", description: "View past assessments" },
    { icon: Calendar, label: "Schedule Appointment", description: "Book with your provider" },
    { icon: AlertTriangle, label: "Report Side Effect", description: "Log any adverse reactions" },
  ];

  return (
    <Box>
      <Box
        sx={{
          mb: 4, p: { xs: 3, sm: 4 }, borderRadius: 4,
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #2563eb 100%)",
          color: "white", position: "relative", overflow: "hidden",
        }}
      >
        <Box sx={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(96,165,250,0.1)" }} />
        <Box sx={{ position: "absolute", bottom: -60, right: 100, width: 150, height: 150, borderRadius: "50%", bgcolor: "rgba(96,165,250,0.06)" }} />
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Sparkles size={18} color="#60a5fa" />
            <Chip label="Patient Dashboard" size="small" sx={{ bgcolor: "rgba(96,165,250,0.15)", color: "#93c5fd", fontWeight: 600, height: 24, fontSize: "0.7rem" }} />
          </Box>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
            Welcome back, {user?.name?.split(" ")[0] || "Patient"}
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)" }}>
            Here's an overview of your health status and medications
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={Pill} iconColor="#2563eb" iconBg="#eff6ff" value={medications.length} label="Active Medications" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={Activity} iconColor="#d97706" iconBg="#fffbeb" value="Medium" label="Current Risk Level" trend={{ direction: "down", text: "Improving" }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={Calendar} iconColor="#16a34a" iconBg="#f0fdf4" value={15} label="Days Until Next Check" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={Heart} iconColor="#dc2626" iconBg="#fef2f2" value={unreadCount} label="Alerts to Review" trend={{ direction: "up", text: `${unreadCount} unread` }} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}><MedicationList medications={medications} /></Grid>
        <Grid size={{ xs: 12, lg: 4 }}><NotificationList notifications={notifications} /></Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Risk Assessment Overview</Typography>
              <RiskRadarChart data={radarData} />
              <Alert severity="info" sx={{ mt: 2, bgcolor: "#f0f9ff", border: "1px solid #bae6fd", "& .MuiAlert-icon": { color: "#0284c7" } }}>
                Assessment from 2026-02-15. Your next assessment is scheduled in 15 days.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Risk Trend Over Time</Typography>
              <RiskAreaChart data={riskTrendData} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12 }}><QuickActionGrid actions={quickActions} /></Grid>
      </Grid>
    </Box>
  );
}
