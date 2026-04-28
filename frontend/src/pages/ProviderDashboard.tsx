import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";
import {
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Pill,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import { RiskBarChart, RiskPieChart } from "../components/dashboard/RiskChart";
import { fetchProviderDashboard, type ProviderDashboardData } from "../lib/patientApi";

const categoryColors = ["#00d4aa", "#2563eb", "#f59e0b", "#8b5cf6", "#ef4444"];

function calculateAge(dateOfBirth?: string | null) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

function formatShortDate(value?: string | null) {
  if (!value) return "No assessment yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No assessment yet";
  return date.toLocaleDateString();
}

function getRiskColor(riskLevel: string) {
  switch (riskLevel) {
    case "low":
      return "success";
    case "medium":
      return "warning";
    case "high":
      return "error";
    default:
      return "default";
  }
}

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const [patientSearch, setPatientSearch] = useState("");
  const [dashboard, setDashboard] = useState<ProviderDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    let active = true;

    fetchProviderDashboard()
      .then((response) => {
        if (!active) return;
        setDashboard(response);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message || "Failed to load dashboard");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredPatients = (dashboard?.recentPatients || []).filter((patient) =>
    patient.name.toLowerCase().includes(patientSearch.toLowerCase()),
  );

  const medicationCategories = (dashboard?.medicationCategories || []).map((item, index) => ({
    ...item,
    color: categoryColors[index % categoryColors.length],
  }));

  const statCards = dashboard ? [
    {
      label: "Accessible Patients",
      value: dashboard.overview.totalPatients,
      icon: Users,
      iconColor: "#00d4aa",
      iconBg: "#e0fdf4",
    },
    {
      label: "Active Medications",
      value: dashboard.overview.activeMedications,
      icon: Pill,
      iconColor: "#2563eb",
      iconBg: "#eff6ff",
    },
    {
      label: "Pending Approvals",
      value: dashboard.overview.pendingAccessRequests,
      icon: ShieldCheck,
      iconColor: "#d97706",
      iconBg: "#fffbeb",
    },
    {
      label: "Stored Documents",
      value: dashboard.overview.storedDocuments,
      icon: FileText,
      iconColor: "#8b5cf6",
      iconBg: "#f5f3ff",
    },
  ] : [];

  if (loading) {
    return (
      <Box sx={{ minHeight: "55vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !dashboard) {
    return (
      <Alert severity="error" sx={{ borderRadius: 3 }}>
        {error || "Failed to load provider dashboard"}
      </Alert>
    );
  }

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
          <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
            Welcome back, {user?.name || "Provider"}
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)" }}>
            You currently have access to {dashboard.overview.totalPatients} patient{dashboard.overview.totalPatients === 1 ? "" : "s"} and {dashboard.overview.pendingAccessRequests} pending approval{dashboard.overview.pendingAccessRequests === 1 ? "" : "s"}.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate("/patients")}
          sx={{ position: "relative", zIndex: 1, bgcolor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}
        >
          Open Patients
        </Button>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {statCards.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
            <StatCard
              icon={stat.icon}
              iconColor={stat.iconColor}
              iconBg={stat.iconBg}
              value={stat.value}
              label={stat.label}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 3, pb: 2, flexWrap: "wrap", gap: 2 }}>
                <Typography variant="h6" fontWeight={700}>Recent Patients</Typography>
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
                  <TextField
                    placeholder="Search patients..."
                    size="small"
                    value={patientSearch}
                    onChange={(event) => setPatientSearch(event.target.value)}
                    sx={{ width: 220 }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search size={16} color="#94a3b8" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <Button variant="text" size="small" endIcon={<ChevronRight size={16} />} sx={{ color: "primary.main", fontWeight: 600 }} onClick={() => navigate("/patients")}>
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
                      <TableCell>Active Medications</TableCell>
                      <TableCell>Last Assessment</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPatients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">
                            {patientSearch ? "No patients match that search." : "No patients are currently linked to your organization."}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPatients.slice(0, 8).map((patient) => (
                        <TableRow key={patient.id} hover>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(0,212,170,0.12)", color: "#00d4aa", fontSize: 13, fontWeight: 700 }}>
                                {patient.name.split(" ").map((segment) => segment[0]).join("").slice(0, 2)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>{patient.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Age {calculateAge(patient.date_of_birth) ?? "-"}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={patient.risk_level === "unknown" ? "Unassessed" : patient.risk_level}
                              size="small"
                              color={getRiskColor(patient.risk_level) as "success" | "warning" | "error" | "default"}
                              sx={{ textTransform: "capitalize", fontSize: "0.7rem" }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{patient.medications}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{formatShortDate(patient.last_assessment)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Button variant="text" size="small" startIcon={<Eye size={15} />} sx={{ color: "primary.main", fontWeight: 600, minWidth: "auto" }} onClick={() => navigate("/patients")}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
                <Typography variant="h6" fontWeight={700}>Pending Access Requests</Typography>
                <Chip
                  label={`${dashboard.pendingRequests.length} visible`}
                  size="small"
                  sx={{ bgcolor: "rgba(217,119,6,0.12)", color: "#d97706", fontWeight: 700, fontSize: "0.7rem" }}
                />
              </Box>
              {dashboard.pendingRequests.length === 0 ? (
                <Box sx={{ minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                  <Typography color="text.secondary">
                    No patient approvals are waiting right now.
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {dashboard.pendingRequests.map((request, index) => (
                    <ListItem
                      key={request.id}
                      sx={{ px: 2, py: 1.5, borderRadius: 2.5, mb: index < dashboard.pendingRequests.length - 1 ? 1 : 0, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", alignItems: "flex-start" }}
                    >
                      <Box sx={{ mr: 1.5, mt: 0.25, color: "#d97706" }}>
                        <Clock size={16} />
                      </Box>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={600}>{request.patient_name}</Typography>}
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Requested by {request.requested_by_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {request.organization_name} • {formatShortDate(request.created_at)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              <Button variant="outlined" fullWidth sx={{ mt: 2, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main" } }} onClick={() => navigate("/patients")}>
                Go To Patient Workspace
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Patient Risk Distribution</Typography>
              {dashboard.riskDistribution.length === 0 ? (
                <Box
                  sx={{
                    minHeight: 210,
                    borderRadius: 3,
                    border: "1px dashed rgba(15, 23, 42, 0.12)",
                    background: "linear-gradient(180deg, rgba(0, 212, 170, 0.06), rgba(248, 250, 252, 0.9))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    px: 3,
                  }}
                >
                  <Box sx={{ maxWidth: 360 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: "18px",
                        mx: "auto",
                        mb: 2,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "rgba(0, 212, 170, 0.12)",
                        color: "primary.main",
                      }}
                    >
                      <ShieldCheck size={28} />
                    </Box>
                    <Typography fontWeight={800} sx={{ mb: 0.75 }}>
                      No risk mix yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                      Risk levels will appear here after patients complete assessments.
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mt: 2.25, borderColor: "divider", color: "text.primary" }}
                      onClick={() => navigate("/patients")}
                    >
                      Review Patients
                    </Button>
                  </Box>
                </Box>
              ) : (
                <RiskBarChart data={dashboard.riskDistribution} />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Medication Categories</Typography>
              {medicationCategories.length === 0 ? (
                <Box sx={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography color="text.secondary">No medication data is available for your current patient set.</Typography>
                </Box>
              ) : (
                <RiskPieChart data={medicationCategories} />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
