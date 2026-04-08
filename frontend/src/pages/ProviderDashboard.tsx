import { useState } from "react";
import {
  Box, Typography, Grid, Card, CardContent, Avatar, Button, Chip, List, ListItem, ListItemText, ListItemIcon,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, InputAdornment,
} from "@mui/material";
import {
  Users, AlertTriangle, Calendar, ChevronRight, Bell, Activity, Plus, Search, Clock, TrendingUp, Building2, Sparkles,
} from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import QuickActionGrid from "../components/dashboard/QuickActionGrid";
import { RiskBarChart, RiskPieChart } from "../components/dashboard/RiskChart";
import { patients, alerts, stats, riskDistribution, medicationCategories, schedule } from "../data/mockProviderData";

export default function ProviderDashboard() {
  const [patientSearch, setPatientSearch] = useState("");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const filteredPatients = patients.filter((p) => p.name.toLowerCase().includes(patientSearch.toLowerCase()));

  const getRiskColor = (risk: string) => {
    switch (risk) { case "low": return "success"; case "medium": return "warning"; case "high": return "error"; default: return "default"; }
  };
  const getAlertIcon = (type: string) => {
    switch (type) { case "interaction": return <AlertTriangle size={16} color="#dc2626" />; case "assessment_due": return <Clock size={16} color="#2563eb" />; default: return <Bell size={16} />; }
  };
  const getAlertTypeLabel = (type: string) => {
    switch (type) { case "interaction": return "Drug Interaction"; case "assessment_due": return "Assessment Due"; default: return "Alert"; }
  };

  const statIcons = [Users, AlertTriangle, Activity, Clock];
  const statColors = ["#00d4aa", "#dc2626", "#16a34a", "#d97706"];
  const statBgs = ["#e0fdf4", "#fef2f2", "#f0fdf4", "#fffbeb"];

  const quickActions = [
    { icon: Users, label: "Manage Patients", description: "View and edit patient list" },
    { icon: Activity, label: "New Assessment", description: "Create risk assessment" },
    { icon: TrendingUp, label: "Analytics", description: "View practice insights" },
    { icon: Building2, label: "Organization", description: "Manage team & settings" },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4, p: { xs: 3, sm: 4 }, borderRadius: 4, background: "linear-gradient(135deg, #04080f 0%, #0a1628 55%, #0c2820 100%)", color: "white", position: "relative", overflow: "hidden", display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
        <Box sx={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.08)" }} />
        <Box sx={{ position: "absolute", bottom: -60, right: 100, width: 150, height: 150, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.05)" }} />
        <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(0,212,170,0.07) 0%, transparent 70%)" }} />
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Sparkles size={18} color="#00d4aa" />
            <Chip label="Provider Dashboard" size="small" sx={{ bgcolor: "rgba(0,212,170,0.18)", color: "#00d4aa", fontWeight: 600, height: 24, fontSize: "0.7rem" }} />
          </Box>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>Good morning, Dr. {user?.name?.split(" ").slice(-1)[0] || "Provider"}</Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)" }}>Here's what's happening with your patients today</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} sx={{ position: "relative", zIndex: 1, bgcolor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>New Patient</Button>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <StatCard icon={statIcons[index]} iconColor={statColors[index]} iconBg={statBgs[index]} value={stat.value} label={stat.label} trend={{ direction: stat.trend, text: stat.change }} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 3, pb: 2, flexWrap: "wrap", gap: 2 }}>
                <Typography variant="h6" fontWeight={700}>Recent Patients</Typography>
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                  <TextField placeholder="Search patients..." size="small" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} sx={{ width: 200 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} color="#94a3b8" /></InputAdornment> }} />
                  <Button variant="text" size="small" endIcon={<ChevronRight size={16} />} sx={{ color: "primary.main", fontWeight: 600 }}>View All</Button>
                </Box>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Patient</TableCell><TableCell>Risk Level</TableCell><TableCell>Medications</TableCell><TableCell>Last Assessment</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                  <TableBody>
                    {filteredPatients.slice(0, 5).map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(0,212,170,0.12)", color: "#00d4aa", fontSize: 13, fontWeight: 700 }}>{patient.name.split(" ").map((n) => n[0]).join("")}</Avatar>
                            <Box><Typography variant="body2" fontWeight={600}>{patient.name}</Typography><Typography variant="caption" color="text.secondary">Age {patient.age}</Typography></Box>
                          </Box>
                        </TableCell>
                        <TableCell><Chip label={patient.riskLevel} size="small" color={getRiskColor(patient.riskLevel) as "success" | "warning" | "error" | "default"} sx={{ textTransform: "capitalize", fontSize: "0.7rem" }} /></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{patient.medications}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{patient.lastAssessment}</Typography></TableCell>
                        <TableCell align="right"><Button variant="text" size="small" sx={{ color: "primary.main", fontWeight: 600, minWidth: "auto" }}>View</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>Active Alerts</Typography>
                <Chip label={`${alerts.length} alerts`} size="small" sx={{ bgcolor: "rgba(220,38,38,0.1)", color: "#dc2626", fontWeight: 700, fontSize: "0.7rem" }} />
              </Box>
              <List sx={{ p: 0 }}>
                {alerts.map((alert, index) => (
                  <ListItem key={alert.id} sx={{ px: 2, py: 1.5, borderRadius: 2.5, mb: index < alerts.length - 1 ? 1 : 0, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", alignItems: "flex-start" }}>
                    <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>{getAlertIcon(alert.type)}</ListItemIcon>
                    <ListItemText
                      primary={<Box sx={{ mb: 0.5 }}><Typography variant="body2" fontWeight={600}>{alert.patientName}</Typography><Chip label={getAlertTypeLabel(alert.type)} size="small" color={getRiskColor(alert.severity) as "success" | "warning" | "error" | "default"} sx={{ mt: 0.5, fontSize: "0.65rem", height: 22 }} /></Box>}
                      secondary={<Typography variant="caption" color="text.secondary">{alert.message}</Typography>}
                    />
                  </ListItem>
                ))}
              </List>
              <Button variant="outlined" fullWidth sx={{ mt: 2, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main" } }}>View All Alerts</Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}><Card><CardContent sx={{ p: 3 }}><Typography variant="h6" fontWeight={700} mb={2}>Patient Risk Distribution</Typography><RiskBarChart data={riskDistribution} /></CardContent></Card></Grid>
        <Grid size={{ xs: 12, md: 6 }}><Card><CardContent sx={{ p: 3 }}><Typography variant="h6" fontWeight={700} mb={2}>Medication Categories</Typography><RiskPieChart data={medicationCategories} /></CardContent></Card></Grid>
        <Grid size={{ xs: 12, md: 6 }}><QuickActionGrid actions={quickActions} /></Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>Today's Schedule</Typography>
                <Button variant="text" size="small" sx={{ color: "primary.main", fontWeight: 600 }}>View Calendar</Button>
              </Box>
              <List sx={{ p: 0 }}>
                {schedule.map((appt, index) => (
                  <ListItem key={index} sx={{ px: 2, py: 1.5, borderRadius: 2.5, mb: index < schedule.length - 1 ? 1 : 0, bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
                    <Box sx={{ mr: 2, p: 1, borderRadius: 2, bgcolor: "rgba(0,212,170,0.1)", textAlign: "center", minWidth: 48 }}>
                      <Typography variant="caption" color="primary.main" fontWeight={700} display="block">{appt.time.split(" ")[0]}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem" }}>{appt.time.split(" ")[1]}</Typography>
                    </Box>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={600}>{appt.patient}</Typography>}
                      secondary={<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><Calendar size={11} color="#94a3b8" /><Typography variant="caption" color="text.secondary">{appt.type} &bull; {appt.duration}</Typography></Box>}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
