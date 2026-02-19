import { useState, useEffect } from "react";
import {
  Box,
  Container,
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
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  Tooltip,
  Badge,
  Tabs,
  Tab,
} from "@mui/material";
import {
  User,
  Shield,
  Users,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Bell,
  Settings,
  LogOut,
  TrendingUp,
  Activity,
  Plus,
  Search,
  Clock,
  Stethoscope,
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  riskLevel: "low" | "medium" | "high";
  medications: number;
  lastAssessment: string;
  status: "active" | "inactive";
}

interface Alert {
  id: string;
  type: "interaction" | "side_effect" | "assessment_due";
  patientName: string;
  message: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
}

interface Stat {
  label: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "neutral";
}

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Mock data - would come from API
  const patients: Patient[] = [
    {
      id: "1",
      name: "John Smith",
      age: 58,
      riskLevel: "high",
      medications: 4,
      lastAssessment: "2026-02-16",
      status: "active",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      age: 45,
      riskLevel: "medium",
      medications: 2,
      lastAssessment: "2026-02-10",
      status: "active",
    },
    {
      id: "3",
      name: "Michael Brown",
      age: 72,
      riskLevel: "low",
      medications: 3,
      lastAssessment: "2026-02-14",
      status: "active",
    },
    {
      id: "4",
      name: "Emily Davis",
      age: 34,
      riskLevel: "medium",
      medications: 1,
      lastAssessment: "2026-02-08",
      status: "inactive",
    },
    {
      id: "5",
      name: "Robert Wilson",
      age: 65,
      riskLevel: "high",
      medications: 5,
      lastAssessment: "2026-02-17",
      status: "active",
    },
  ];

  const alerts: Alert[] = [
    {
      id: "1",
      type: "interaction",
      patientName: "John Smith",
      message: "Potential drug interaction: Warfarin + Aspirin",
      severity: "high",
      timestamp: "2026-02-18T09:30:00",
    },
    {
      id: "2",
      type: "assessment_due",
      patientName: "Emily Davis",
      message: "Risk assessment overdue by 10 days",
      severity: "medium",
      timestamp: "2026-02-17T14:20:00",
    },
    {
      id: "3",
      type: "side_effect",
      patientName: "Sarah Johnson",
      message: "Patient reported increased fatigue",
      severity: "medium",
      timestamp: "2026-02-17T11:15:00",
    },
    {
      id: "4",
      type: "interaction",
      patientName: "Robert Wilson",
      message: "Dosage adjustment recommended for Metformin",
      severity: "low",
      timestamp: "2026-02-16T16:45:00",
    },
  ];

  const stats: Stat[] = [
    { label: "Total Patients", value: 48, change: "+3 this month", trend: "up" },
    { label: "High Risk", value: 8, change: "-2 from last week", trend: "down" },
    { label: "Assessments", value: 24, change: "This week", trend: "neutral" },
    { label: "Pending Reviews", value: 5, change: "Needs attention", trend: "up" },
  ];

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userStr || !token) {
      navigate("/login");
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      if (userData.role === "patient") {
        navigate("/dashboard/patient");
        return;
      }
      setUser(userData);
    } catch {
      navigate("/login");
      return;
    }

    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "success";
      case "medium":
        return "warning";
      case "high":
        return "error";
      default:
        return "default";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "interaction":
        return <AlertTriangle size={18} color="#ef4444" />;
      case "side_effect":
        return <Activity size={18} color="#f59e0b" />;
      case "assessment_due":
        return <Clock size={18} color="#3b82f6" />;
      default:
        return <Bell size={18} />;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case "interaction":
        return "Drug Interaction";
      case "side_effect":
        return "Side Effect";
      case "assessment_due":
        return "Assessment Due";
      default:
        return "Alert";
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <LinearProgress />
      </Box>
    );
  }

  const unreadAlerts = alerts.filter((a) => a.severity === "high").length;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Top Navigation Bar */}
      <Paper
        elevation={0}
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1100,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 2,
            }}
          >
            {/* Logo */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  color: "white",
                }}
              >
                <Shield size={22} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="primary.main">
                MediRisk
              </Typography>
            </Box>

            {/* Navigation Tabs */}
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab label="Dashboard" />
                <Tab label="Patients" />
                <Tab label="Assessments" />
                <Tab label="Reports" />
              </Tabs>
            </Box>

            {/* Right Side Actions */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Tooltip title="Notifications">
                <IconButton color="inherit">
                  <Badge badgeContent={unreadAlerts} color="error">
                    <Bell size={22} />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton color="inherit">
                  <Settings size={22} />
                </IconButton>
              </Tooltip>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    width: 36,
                    height: 36,
                  }}
                >
                  <Stethoscope size={20} />
                </Avatar>
                <Box sx={{ display: { xs: "none", sm: "block" } }}>
                  <Typography variant="body2" fontWeight={600}>
                    {user?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Healthcare Provider
                  </Typography>
                </Box>
                <Tooltip title="Logout">
                  <IconButton onClick={handleLogout} size="small">
                    <LogOut size={18} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="xl" sx={{ py: 4 }}>
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
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<Search size={18} />}
              sx={{ display: { xs: "none", sm: "flex" } }}
            >
              Search Patients
            </Button>
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
            >
              New Patient
            </Button>
          </Box>
        </Box>

        {/* Stats Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        stat.trend === "up"
                          ? "success.main"
                          : stat.trend === "down"
                          ? "error.main"
                          : "text.secondary",
                    }}
                  >
                    {stat.change}
                  </Typography>
                </CardContent>
              </Card>
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
                  }}
                >
                  <Typography variant="h6" fontWeight={600}>
                    Recent Patients
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    endIcon={<ChevronRight size={16} />}
                  >
                    View All
                  </Button>
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
                      {patients.slice(0, 5).map((patient) => (
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
                            <Button variant="text" size="small">
                              View
                            </Button>
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
                  <Chip
                    label={`${alerts.length} alerts`}
                    size="small"
                    color="warning"
                  />
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

          {/* Quick Actions */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={3}>
                  Quick Actions
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{
                        py: 2,
                        justifyContent: "flex-start",
                        textAlign: "left",
                      }}
                      startIcon={<Users size={20} />}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Manage Patients
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          View and edit patient list
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{
                        py: 2,
                        justifyContent: "flex-start",
                        textAlign: "left",
                      }}
                      startIcon={<Activity size={20} />}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          New Assessment
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Create risk assessment
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{
                        py: 2,
                        justifyContent: "flex-start",
                        textAlign: "left",
                      }}
                      startIcon={<TrendingUp size={20} />}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Analytics
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          View practice insights
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{
                        py: 2,
                        justifyContent: "flex-start",
                        textAlign: "left",
                      }}
                      startIcon={<Building2 size={20} />}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Organization
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Manage team & settings
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming Appointments */}
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
                  <Button variant="text" size="small">
                    View Calendar
                  </Button>
                </Box>

                <List sx={{ p: 0 }}>
                  {[
                    {
                      time: "09:00 AM",
                      patient: "John Smith",
                      type: "Risk Assessment",
                      duration: "30 min",
                    },
                    {
                      time: "10:30 AM",
                      patient: "Sarah Johnson",
                      type: "Follow-up",
                      duration: "15 min",
                    },
                    {
                      time: "02:00 PM",
                      patient: "Michael Brown",
                      type: "Medication Review",
                      duration: "45 min",
                    },
                  ].map((appt, index) => (
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
                                {appt.type} • {appt.duration}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < 2 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
