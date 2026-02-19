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
  Alert,
  IconButton,
  Paper,
  Tooltip,
  Badge,
} from "@mui/material";
import {
  User,
  Shield,
  Pill,
  AlertTriangle,
  FileText,
  Calendar,
  ChevronRight,
  Bell,
  Settings,
  LogOut,
  TrendingUp,
  Activity,
  Heart,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  status: "active" | "discontinued";
  riskLevel: "low" | "medium" | "high";
}

interface RiskAssessment {
  id: string;
  date: string;
  overallRisk: "low" | "medium" | "high";
  nauseaRisk: number;
  fatigueRisk: number;
  kidneyRisk: number;
}

interface Notification {
  id: string;
  type: "warning" | "info" | "success";
  message: string;
  date: string;
  read: boolean;
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - would come from API
  const medications: Medication[] = [
    {
      id: "1",
      name: "Metformin",
      dosage: "500mg",
      frequency: "Twice daily",
      startDate: "2025-01-15",
      status: "active",
      riskLevel: "low",
    },
    {
      id: "2",
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Once daily",
      startDate: "2025-02-01",
      status: "active",
      riskLevel: "medium",
    },
    {
      id: "3",
      name: "Atorvastatin",
      dosage: "20mg",
      frequency: "Once daily at bedtime",
      startDate: "2024-12-10",
      status: "active",
      riskLevel: "low",
    },
  ];

  const riskAssessments: RiskAssessment[] = [
    {
      id: "1",
      date: "2026-02-15",
      overallRisk: "medium",
      nauseaRisk: 25,
      fatigueRisk: 40,
      kidneyRisk: 15,
    },
    {
      id: "2",
      date: "2026-01-15",
      overallRisk: "medium",
      nauseaRisk: 30,
      fatigueRisk: 35,
      kidneyRisk: 20,
    },
  ];

  const notifications: Notification[] = [
    {
      id: "1",
      type: "warning",
      message: "Potential interaction detected between Metformin and new supplement",
      date: "2026-02-17",
      read: false,
    },
    {
      id: "2",
      type: "info",
      message: "Your monthly risk assessment is ready for review",
      date: "2026-02-15",
      read: false,
    },
    {
      id: "3",
      type: "success",
      message: "Lab results have been uploaded to your records",
      date: "2026-02-10",
      read: true,
    },
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
      if (userData.role !== "patient") {
        navigate("/dashboard/provider");
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle size={20} color="#f59e0b" />;
      case "success":
        return <Shield size={20} color="#10b981" />;
      default:
        return <Bell size={20} color="#3b82f6" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <LinearProgress />
      </Box>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

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

            {/* Right Side Actions */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Tooltip title="Notifications">
                <IconButton color="inherit">
                  <Badge badgeContent={unreadCount} color="error">
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
                  <User size={20} />
                </Avatar>
                <Box sx={{ display: { xs: "none", sm: "block" } }}>
                  <Typography variant="body2" fontWeight={600}>
                    {user?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Patient
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
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "primary.light",
                      color: "primary.contrastText",
                    }}
                  >
                    <Pill size={24} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {medications.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Medications
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "warning.light",
                      color: "warning.contrastText",
                    }}
                  >
                    <Activity size={24} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      Medium
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current Risk Level
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "success.light",
                      color: "success.contrastText",
                    }}
                  >
                    <Calendar size={24} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      15
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Days Until Next Check
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "error.light",
                      color: "error.contrastText",
                    }}
                  >
                    <Heart size={24} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      2
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Alerts to Review
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Current Medications */}
          <Grid size={{ xs: 12, lg: 8 }}>
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
                    Current Medications
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    endIcon={<ChevronRight size={16} />}
                  >
                    View All
                  </Button>
                </Box>

                <List sx={{ p: 0 }}>
                  {medications.map((med, index) => (
                    <Box key={med.id}>
                      <ListItem sx={{ px: 0, py: 2 }}>
                        <ListItemIcon sx={{ minWidth: 48 }}>
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 2,
                              bgcolor: "background.default",
                            }}
                          >
                            <Pill size={20} color="#3b82f6" />
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.5,
                              }}
                            >
                              <Typography variant="subtitle1" fontWeight={600}>
                                {med.name}
                              </Typography>
                              <Chip
                                label={med.riskLevel}
                                size="small"
                                color={getRiskColor(med.riskLevel) as "success" | "warning" | "error" | "default"}
                                sx={{ textTransform: "capitalize" }}
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {med.dosage} • {med.frequency}
                            </Typography>
                          }
                        />
                        <Button
                          variant="text"
                          size="small"
                          endIcon={<ChevronRight size={16} />}
                        >
                          Details
                        </Button>
                      </ListItem>
                      {index < medications.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Notifications */}
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
                    Notifications
                  </Typography>
                  <Button variant="text" size="small">
                    Mark All Read
                  </Button>
                </Box>

                <List sx={{ p: 0 }}>
                  {notifications.map((notif, index) => (
                    <Box key={notif.id}>
                      <ListItem
                        sx={{
                          px: 0,
                          py: 2,
                          bgcolor: notif.read ? "transparent" : "action.hover",
                          borderRadius: 1,
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 44 }}>
                          {getNotificationIcon(notif.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              fontWeight={notif.read ? 400 : 600}
                            >
                              {notif.message}
                            </Typography>
                          }
                          secondary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                mt: 0.5,
                              }}
                            >
                              <Clock size={12} color="#64748b" />
                              <Typography variant="caption" color="text.secondary">
                                {notif.date}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < notifications.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Risk Assessment Summary */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={3}>
                  Latest Risk Assessment
                </Typography>

                {riskAssessments.length > 0 && (
                  <Box>
                    <Box sx={{ mb: 3 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Nausea Risk
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {riskAssessments[0].nauseaRisk}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={riskAssessments[0].nauseaRisk}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: "grey.200",
                          "& .MuiLinearProgress-bar": {
                            bgcolor:
                              riskAssessments[0].nauseaRisk > 50
                                ? "error.main"
                                : riskAssessments[0].nauseaRisk > 25
                                ? "warning.main"
                                : "success.main",
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Fatigue Risk
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {riskAssessments[0].fatigueRisk}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={riskAssessments[0].fatigueRisk}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: "grey.200",
                          "& .MuiLinearProgress-bar": {
                            bgcolor:
                              riskAssessments[0].fatigueRisk > 50
                                ? "error.main"
                                : riskAssessments[0].fatigueRisk > 25
                                ? "warning.main"
                                : "success.main",
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Kidney Risk
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {riskAssessments[0].kidneyRisk}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={riskAssessments[0].kidneyRisk}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: "grey.200",
                          "& .MuiLinearProgress-bar": {
                            bgcolor:
                              riskAssessments[0].kidneyRisk > 50
                                ? "error.main"
                                : riskAssessments[0].kidneyRisk > 25
                                ? "warning.main"
                                : "success.main",
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>

                    <Alert severity="info" sx={{ mt: 2 }}>
                      Assessment from {riskAssessments[0].date}. Your next
                      assessment is scheduled in 15 days.
                    </Alert>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ height: "100%" }}>
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
                      startIcon={<FileText size={20} />}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          View Reports
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Access your medical records
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
                          Risk History
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          View past assessments
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
                      startIcon={<Calendar size={20} />}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Schedule Appointment
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Book with your provider
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
                      startIcon={<AlertTriangle size={20} />}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Report Side Effect
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Log any adverse reactions
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
