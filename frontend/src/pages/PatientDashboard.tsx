import { Box, Typography, Grid, Card, CardContent, Alert } from "@mui/material";
import {
  Pill,
  Activity,
  Calendar,
  Heart,
  FileText,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import MedicationList from "../components/dashboard/MedicationList";
import NotificationList from "../components/dashboard/NotificationList";
import QuickActionGrid from "../components/dashboard/QuickActionGrid";
import { RiskRadarChart, RiskAreaChart } from "../components/dashboard/RiskChart";
import {
  medications,
  notifications,
  radarData,
  riskTrendData,
} from "../data/mockPatientData";

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
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Welcome back, {user?.name?.split(" ")[0] || "Patient"}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your health status and medications
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={Pill}
            iconColor="#3b82f6"
            iconBg="#eff6ff"
            value={medications.length}
            label="Active Medications"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={Activity}
            iconColor="#f59e0b"
            iconBg="#fffbeb"
            value="Medium"
            label="Current Risk Level"
            trend={{ direction: "down", text: "Improving" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={Calendar}
            iconColor="#10b981"
            iconBg="#ecfdf5"
            value={15}
            label="Days Until Next Check"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={Heart}
            iconColor="#ef4444"
            iconBg="#fef2f2"
            value={unreadCount}
            label="Alerts to Review"
            trend={{ direction: "up", text: `${unreadCount} unread` }}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Medications */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <MedicationList medications={medications} />
        </Grid>

        {/* Notifications */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <NotificationList notifications={notifications} />
        </Grid>

        {/* Risk Radar Chart */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Risk Assessment Overview
              </Typography>
              <RiskRadarChart data={radarData} />
              <Alert severity="info" sx={{ mt: 2 }}>
                Assessment from 2026-02-15. Your next assessment is scheduled in
                15 days.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Trend Area Chart */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Risk Trend Over Time
              </Typography>
              <RiskAreaChart data={riskTrendData} />
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12 }}>
          <QuickActionGrid actions={quickActions} />
        </Grid>
      </Grid>
    </Box>
  );
}
