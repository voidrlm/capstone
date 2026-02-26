import { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  User,
  Users,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Bell,
  Activity,
  Plus,
  Search,
  Clock,
  TrendingUp,
  Building2,
} from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import QuickActionGrid from "../components/dashboard/QuickActionGrid";
import { RiskBarChart, RiskPieChart } from "../components/dashboard/RiskChart";
import {
  patients,
  alerts,
  stats,
  riskDistribution,
  medicationCategories,
  schedule,
} from "../data/mockProviderData";

export default function ProviderDashboard() {
  const [patientSearch, setPatientSearch] = useState("");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "success";
      case "medium": return "warning";
      case "high": return "error";
      default: return "default";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "interaction": return <AlertTriangle size={18} color="#ef4444" />;
      case "side_effect": return <Activity size={18} color="#f59e0b" />;
      case "assessment_due": return <Clock size={18} color="#3b82f6" />;
      default: return <Bell size={18} />;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case "interaction": return "Drug Interaction";
      case "side_effect": return "Side Effect";
      case "assessment_due": return "Assessment Due";
      default: return "Alert";
    }
  };

  const statIcons = [Users, AlertTriangle, Activity, Clock];
  const statColors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"];
  const statBgs = ["#eff6ff", "#fef2f2", "#ecfdf5", "#fffbeb"];

  const quickActions = [
    { icon: Users, label: "Manage Patients", description: "View and edit patient list" },
    { icon: Activity, label: "New Assessment", description: "Create risk assessment" },
    { icon: TrendingUp, label: "Analytics", description: "View practice insights" },
    { icon: Building2, label: "Organization", description: "Manage team & settings" },
  ];

  return (
    <Box>
      {/* Welcome Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Good morning, Dr. {user?.name?.split(" ").slice(-1)[0] || "Provider"}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your patients today
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />}>
          New Patient
        </Button>
      </Box>

      {/* Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <StatCard
              icon={statIcons[index]}
              iconColor={statColors[index]}
              iconBg={statBgs[index]}
              value={stat.value}
              label={stat.label}
              trend={{ direction: stat.trend, text: stat.change }}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Patients Table */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  Recent Patients
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                  <TextField
                    placeholder="Search patients..."
                    size="small"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    sx={{ width: 200 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search size={16} color="#94a3b8" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button variant="text" size="small" endIcon={<ChevronRight size={16} />}>
                    View All
                  </Button>
                </Box>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>Risk Level</TableCell>
                      <TableCell>Medications</TableCell>
                      <TableCell>Last Assessment</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPatients.slice(0, 5).map((patient) => (
                      <TableRow key={patient.id} hover>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.light" }}>
                              <User size={16} />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {patient.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Age {patient.age}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={patient.riskLevel}
                            size="small"
                            color={getRiskColor(patient.riskLevel) as "success" | "warning" | "error" | "default"}
                            sx={{ textTransform: "capitalize" }}
                          />
                        </TableCell>
                        <TableCell>{patient.medications}</TableCell>
                        <TableCell>{patient.lastAssessment}</TableCell>
                        <TableCell align="right">
                          <Button variant="text" size="small">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts Panel */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  Active Alerts
                </Typography>
                <Chip label={`${alerts.length} alerts`} size="small" color="warning" />
              </Box>

              <List sx={{ p: 0 }}>
                {alerts.map((alert, index) => (
                  <Box key={alert.id}>
                    <ListItem sx={{ px: 0, py: 2, alignItems: "flex-start" }}>
                      <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                        {getAlertIcon(alert.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ mb: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {alert.patientName}
                            </Typography>
                            <Chip
                              label={getAlertTypeLabel(alert.type)}
                              size="small"
                              color={getRiskColor(alert.severity) as "success" | "warning" | "error" | "default"}
                              sx={{ mt: 0.5, fontSize: "0.7rem" }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {alert.message}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < alerts.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>

              <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                View All Alerts
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Distribution Bar Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Patient Risk Distribution
              </Typography>
              <RiskBarChart data={riskDistribution} />
            </CardContent>
          </Card>
        </Grid>

        {/* Medication Category Pie Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Medication Categories
              </Typography>
              <RiskPieChart data={medicationCategories} />
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12, md: 6 }}>
          <QuickActionGrid actions={quickActions} />
        </Grid>

        {/* Today's Schedule */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  Today's Schedule
                </Typography>
                <Button variant="text" size="small">View Calendar</Button>
              </Box>

              <List sx={{ p: 0 }}>
                {schedule.map((appt, index) => (
                  <Box key={index}>
                    <ListItem sx={{ px: 0, py: 2 }}>
                      <ListItemIcon sx={{ minWidth: 60 }}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="caption" color="primary" fontWeight={600}>
                            {appt.time.split(" ")[0]}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {appt.time.split(" ")[1]}
                          </Typography>
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600}>
                            {appt.patient}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Calendar size={12} color="#64748b" />
                            <Typography variant="caption" color="text.secondary">
                              {appt.type} &bull; {appt.duration}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < schedule.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
