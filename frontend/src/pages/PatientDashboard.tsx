import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Card, CardContent, Chip, CircularProgress, Grid, Typography } from "@mui/material";
import {
  Pill, Activity, Calendar, Heart, FileText, TrendingUp, AlertTriangle, Sparkles,
} from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import MedicationList from "../components/dashboard/MedicationList";
import NotificationList from "../components/dashboard/NotificationList";
import QuickActionGrid from "../components/dashboard/QuickActionGrid";
import { RiskRadarChart, RiskAreaChart } from "../components/dashboard/RiskChart";
import { fetchCurrentPatientDetail, type PatientDetailApi } from "../lib/patientApi";

export default function PatientDashboard() {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const [patient, setPatient] = useState<PatientDetailApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetchCurrentPatientDetail()
      .then((detail) => {
        if (active) setPatient(detail);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load dashboard");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const dashboardData = useMemo(() => {
    const medications = (patient?.medications || []).map((med) => ({
      id: med.id,
      name: med.drug_name,
      dosage: med.dosage_amount || med.dosage_level || "-",
      frequency: med.notes || (med.end_date ? `Ends ${new Date(med.end_date).toLocaleDateString()}` : "Ongoing"),
      riskLevel: med.dosage_level === "high" ? "high" : med.dosage_level === "low" ? "low" : "medium" as "low" | "medium" | "high",
    }));

    const notifications = [
      ...(patient?.labResults || []).slice(0, 2).map((lab, index) => ({
        id: `lab-${index}`,
        type: "info" as const,
        message: `${lab.test_name || "Lab result"} is available in your records`,
        date: lab.date ? new Date(lab.date).toLocaleDateString() : "Recent",
        read: false,
      })),
      ...(patient?.diagnoses || []).slice(0, 1).map((diagnosis, index) => ({
        id: `diagnosis-${index}`,
        type: "warning" as const,
        message: `Diagnosis recorded: ${diagnosis.diagnosis_name}`,
        date: diagnosis.date ? new Date(diagnosis.date).toLocaleDateString() : "Recent",
        read: false,
      })),
      ...(patient?.prescriptions || []).slice(0, 1).map((prescription, index) => ({
        id: `prescription-${index}`,
        type: prescription.approval_status === "approved" ? "success" as const : "info" as const,
        message: `${prescription.approval_status === "approved" ? "Approved" : "Draft"} prescription from ${prescription.doctor_name || "provider"}`,
        date: prescription.prescription_date ? new Date(prescription.prescription_date).toLocaleDateString() : "Recent",
        read: false,
      })),
    ].slice(0, 4);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const radarData = [
      { subject: "Medications", value: Math.min((patient?.medications.length || 0) * 20, 100) },
      { subject: "Visits", value: Math.min((patient?.visits.length || 0) * 18, 100) },
      { subject: "Labs", value: Math.min((patient?.labResults.length || 0) * 22, 100) },
      { subject: "Diagnoses", value: Math.min((patient?.diagnoses.length || 0) * 22, 100) },
      { subject: "Allergies", value: Math.min((patient?.allergies.length || 0) * 30, 100) },
    ];

    const riskTrendData = [
      { date: "Visits", risk: Math.min((patient?.visits.length || 0) * 18, 100) },
      { date: "Labs", risk: Math.min((patient?.labResults.length || 0) * 20, 100) },
      { date: "Dx", risk: Math.min((patient?.diagnoses.length || 0) * 22, 100) },
      { date: "Rx", risk: Math.min((patient?.prescriptions.length || 0) * 18, 100) },
      { date: "Meds", risk: Math.min((patient?.medications.length || 0) * 16, 100) },
    ];

    const quickActions = [
      { icon: FileText, label: "View Reports", description: "Access your medical records" },
      { icon: TrendingUp, label: "Trend Review", description: "See activity across your profile" },
      { icon: Calendar, label: "Recent Visits", description: `${patient?.visits.length || 0} visits on file` },
      { icon: AlertTriangle, label: "Allergy Summary", description: `${patient?.allergies.length || 0} allergies recorded` },
    ];

    return { medications, notifications, unreadCount, radarData, riskTrendData, quickActions };
  }, [patient]);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box
        sx={{
          mb: 4, p: { xs: 3, sm: 4 }, borderRadius: 4,
          background: "linear-gradient(135deg, #04080f 0%, #0a1628 55%, #0c2820 100%)",
          color: "white", position: "relative", overflow: "hidden",
        }}
      >
        <Box sx={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.08)" }} />
        <Box sx={{ position: "absolute", bottom: -60, right: 100, width: 150, height: 150, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.05)" }} />
        <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(0,212,170,0.07) 0%, transparent 70%)" }} />
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Sparkles size={18} color="#00d4aa" />
            <Chip label="Patient Dashboard" size="small" sx={{ bgcolor: "rgba(0,212,170,0.18)", color: "#00d4aa", fontWeight: 600, height: 24, fontSize: "0.7rem" }} />
          </Box>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
            Welcome back, {user?.name?.split(" ")[0] || "Patient"}
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)" }}>
            This dashboard is now driven by your live patient record.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={Pill} iconColor="#00d4aa" iconBg="#e0fdf4" value={patient?.medications.length || 0} label="Active Medications" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={Activity} iconColor="#d97706" iconBg="#fffbeb" value={patient?.diagnoses.length || 0} label="Diagnoses On File" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={Calendar} iconColor="#16a34a" iconBg="#f0fdf4" value={patient?.visits.length || 0} label="Visits Recorded" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={Heart} iconColor="#dc2626" iconBg="#fef2f2" value={dashboardData.unreadCount} label="Updates to Review" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}><MedicationList medications={dashboardData.medications} /></Grid>
        <Grid size={{ xs: 12, lg: 4 }}><NotificationList notifications={dashboardData.notifications} /></Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Patient Record Overview</Typography>
              <RiskRadarChart data={dashboardData.radarData} />
              <Alert severity="info" sx={{ mt: 2 }}>
                Based on live counts from medications, visits, labs, diagnoses, and allergies.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Record Activity Trend</Typography>
              <RiskAreaChart data={dashboardData.riskTrendData} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <QuickActionGrid actions={dashboardData.quickActions} />
        </Grid>
      </Grid>
    </Box>
  );
}
