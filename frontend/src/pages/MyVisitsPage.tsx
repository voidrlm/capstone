import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import {
  Calendar,
  Filter,
  Hospital,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import { fetchCurrentPatientDetail, type PatientDetailApi } from "../lib/patientApi";
import { formatDate } from "../lib/helpers";

type VisitItem = {
  id: string;
  date: string;
  type: "visit" | "discharge";
  reason: string;
  doctorName: string;
  doctorSpecialty: string;
  admissionDate?: string | null;
  dischargeDate?: string | null;
  losDays?: number | null;
  primaryDiagnosis?: string | null;
  dischargeDiagnoses?: string[] | null;
  attendingPhysician?: string | null;
};

const theme = createTheme();

export default function MyVisitsPage() {
  const [patient, setPatient] = useState<PatientDetailApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVisit, setSelectedVisit] = useState<VisitItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"All" | "visit" | "discharge">("All");
  const [startDateFilter, setStartDateFilter] = useState<dayjs.Dayjs | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<dayjs.Dayjs | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    let active = true;
    fetchCurrentPatientDetail()
      .then((detail) => {
        if (active) {
          setPatient(detail);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load visits");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const visits = useMemo<VisitItem[]>(() => {
    if (!patient) return [];

    const visitItems: VisitItem[] = patient.visits.map((visit, index) => ({
      id: visit.id || `visit-${index}`,
      date: visit.visit_date,
      type: "visit" as const,
      reason: visit.reason || "General visit",
      doctorName: visit.doctor_name || "Provider",
      doctorSpecialty: visit.doctor_specialty || "",
    }));

    const dischargeItems: VisitItem[] = patient.dischargeSummaries.map((ds, index) => ({
      id: ds.id || `discharge-${index}`,
      date: ds.discharge_date || ds.admission_date || "",
      type: "discharge" as const,
      reason: ds.primary_diagnosis || "Hospital stay",
      doctorName: ds.attending_physician || "Attending Physician",
      doctorSpecialty: "",
      admissionDate: ds.admission_date,
      dischargeDate: ds.discharge_date,
      losDays: ds.los_days,
      primaryDiagnosis: ds.primary_diagnosis,
      dischargeDiagnoses: ds.discharge_diagnoses,
      attendingPhysician: ds.attending_physician,
    }));

    return [...visitItems, ...dischargeItems].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [patient]);

  const filteredVisits = useMemo(() => {
    return visits.filter((visit) => {
      if (typeFilter !== "All" && visit.type !== typeFilter) {
        return false;
      }

      if (searchFilter) {
        const haystack = [visit.reason, visit.doctorName, visit.doctorSpecialty].join(" ").toLowerCase();
        if (!haystack.includes(searchFilter.toLowerCase())) {
          return false;
        }
      }

      const visitDate = visit.date ? new Date(visit.date) : null;
      if (!visitDate || Number.isNaN(visitDate.getTime())) {
        return !startDateFilter && !endDateFilter;
      }

      if (startDateFilter) {
        const start = startDateFilter.startOf("day").toDate();
        if (visitDate < start) {
          return false;
        }
      }

      if (endDateFilter) {
        const end = endDateFilter.endOf("day").toDate();
        if (visitDate > end) {
          return false;
        }
      }

      return true;
    });
  }, [visits, typeFilter, startDateFilter, endDateFilter, searchFilter]);

  const analytics = useMemo(() => {
    const totalVisits = visits.filter((v) => v.type === "visit").length;
    const totalDischarges = visits.filter((v) => v.type === "discharge").length;
    const avgLosDays = visits
      .filter((v) => v.type === "discharge" && v.losDays)
      .reduce((sum, v) => sum + (v.losDays || 0), 0) / (visits.filter((v) => v.type === "discharge" && v.losDays).length || 1);
    const uniqueProviders = new Set(visits.map((v) => v.doctorName)).size;

    return {
      totalVisits,
      totalDischarges,
      avgLosDays: Number.isFinite(avgLosDays) ? avgLosDays.toFixed(1) : "N/A",
      uniqueProviders,
    };
  }, [visits]);

  const handleVisitClick = (visit: VisitItem) => {
    setSelectedVisit(visit);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedVisit(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ pb: 4 }}>
        <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError("")} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
          <Alert onClose={() => setError("")} severity="error" variant="filled" sx={{ width: "100%" }}>
            {error}
          </Alert>
        </Snackbar>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} sx={{ color: "#0f172a", mb: 1 }}>
          My Visits
        </Typography>
        <Typography variant="body1" sx={{ color: "#64748b" }}>
          View your visit history and discharge summaries
        </Typography>
      </Box>

      {/* Analytics Summary */}
      {visits.length > 0 && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2, mb: 4 }}>
          <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "block", mb: 0.5 }}>
              Total Visits
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color: "#3b82f6" }}>
              {analytics.totalVisits}
            </Typography>
          </Box>
          <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: "rgba(15,118,110,0.08)", border: "1px solid rgba(15,118,110,0.15)" }}>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "block", mb: 0.5 }}>
              Hospital Stays
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color: "#0f766e" }}>
              {analytics.totalDischarges}
            </Typography>
          </Box>
          <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "block", mb: 0.5 }}>
              Avg. Length of Stay
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color: "#8b5cf6" }}>
              {analytics.avgLosDays} days
            </Typography>
          </Box>
          <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "block", mb: 0.5 }}>
              Unique Providers
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color: "#10b981" }}>
              {analytics.uniqueProviders}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Filters */}
      {visits.length > 0 && (
        <Box sx={{ mb: 4, p: 2.5, borderRadius: 2, bgcolor: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Filter size={18} color="#64748b" />
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0f172a" }}>
              Filters
            </Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Type"
              select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "All" | "visit" | "discharge")}
              slotProps={{ inputLabel: { shrink: true } }}
            >
              <MenuItem value="All">All Types</MenuItem>
              <MenuItem value="visit">Visits</MenuItem>
              <MenuItem value="discharge">Discharge Summaries</MenuItem>
            </TextField>
            <TextField
              fullWidth
              size="small"
              label="Search"
              placeholder="Reason, provider, specialty..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
            <DatePicker
              label="From Date"
              value={startDateFilter}
              onChange={(newValue) => setStartDateFilter(newValue)}
              format="MM/DD/YYYY"
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
            <DatePicker
              label="To Date"
              value={endDateFilter}
              onChange={(newValue) => setEndDateFilter(newValue)}
              format="MM/DD/YYYY"
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Box>
        </Box>
      )}

      {filteredVisits.length === 0 && visits.length > 0 ? (
        <Alert severity="info">No visits match your filters.</Alert>
      ) : filteredVisits.length === 0 ? (
        <Alert severity="info">No visits recorded yet.</Alert>
      ) : (
        <Box sx={{ display: "grid", gap: 3 }}>
          {filteredVisits.map((visit) => (
            <Card
              key={visit.id}
              variant="outlined"
              sx={{
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  boxShadow: "0 8px 28px rgba(15, 23, 42, 0.12)",
                  transform: "translateY(-2px)",
                },
                borderLeft: visit.type === "discharge" ? "4px solid #0f766e" : "4px solid #3b82f6",
              }}
              onClick={() => handleVisitClick(visit)}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                      {visit.type === "discharge" ? (
                        <Hospital size={20} color="#0f766e" />
                      ) : (
                        <Stethoscope size={20} color="#3b82f6" />
                      )}
                      <Chip
                        label={visit.type === "discharge" ? "Discharge Summary" : "Visit"}
                        size="small"
                        sx={{
                          bgcolor: visit.type === "discharge" ? "rgba(15,118,110,0.1)" : "rgba(59,130,246,0.1)",
                          color: visit.type === "discharge" ? "#0f766e" : "#3b82f6",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                        }}
                      />
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ color: "#0f172a", mb: 0.5 }}>
                      {visit.reason}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1.5, flexWrap: "wrap" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Calendar size={16} color="#64748b" />
                        <Typography variant="body2" sx={{ color: "#64748b" }}>
                          {formatDate(visit.date)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <User size={16} color="#64748b" />
                        <Typography variant="body2" sx={{ color: "#64748b" }}>
                          {visit.doctorName}
                        </Typography>
                      </Box>
                      {visit.doctorSpecialty && (
                        <Typography variant="body2" sx={{ color: "#64748b" }}>
                          • {visit.doctorSpecialty}
                        </Typography>
                      )}
                    </Box>
                    {visit.type === "discharge" && visit.losDays && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>
                          Length of stay: {visit.losDays} days
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, maxHeight: "90vh" },
        }}
      >
        {selectedVisit && (
          <>
            <DialogTitle
              sx={{
                background: selectedVisit.type === "discharge"
                  ? "linear-gradient(135deg, rgba(15,118,110,0.1) 0%, #fff 100%)"
                  : "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, #fff 100%)",
                borderBottom: selectedVisit.type === "discharge"
                  ? "1px solid rgba(15,118,110,0.22)"
                  : "1px solid rgba(59,130,246,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    bgcolor: selectedVisit.type === "discharge" ? "#0f766e" : "#3b82f6",
                    display: "grid",
                    placeItems: "center",
                    border: "4px solid #fff",
                    boxShadow: selectedVisit.type === "discharge"
                      ? "0 0 0 3px rgba(15,118,110,0.22), 0 8px 28px rgba(15,118,110,0.44)"
                      : "0 0 0 3px rgba(59,130,246,0.22), 0 8px 28px rgba(59,130,246,0.44)",
                  }}
                >
                  {selectedVisit.type === "discharge" ? (
                    <Hospital size={22} color="#fff" />
                  ) : (
                    <Stethoscope size={22} color="#fff" />
                  )}
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a" }}>
                    {selectedVisit.reason}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
                    {selectedVisit.type === "discharge" ? "Discharge Summary" : "Visit"} • {formatDate(selectedVisit.date)}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={handleCloseDialog} sx={{ ml: "auto" }}>
                <X size={20} />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ display: "grid", gap: 2.5 }}>
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    PROVIDER
                  </Typography>
                  <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                    <User size={18} color="#64748b" />
                    <Typography variant="body1" sx={{ color: "#334155", fontWeight: 600 }}>
                      {selectedVisit.doctorName}
                    </Typography>
                    {selectedVisit.doctorSpecialty && (
                      <Typography variant="body2" sx={{ color: "#64748b" }}>
                        ({selectedVisit.doctorSpecialty})
                      </Typography>
                    )}
                  </Box>
                </Box>

                {selectedVisit.type === "discharge" && (
                  <>
                    <Box>
                      <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                        HOSPITAL STAY
                      </Typography>
                      <Box sx={{ mt: 1.5, display: "grid", gap: 1.5 }}>
                        {selectedVisit.admissionDate && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Calendar size={18} color="#64748b" />
                            <Typography variant="body2" sx={{ color: "#4b5563" }}>
                              Admission: {formatDate(selectedVisit.admissionDate)}
                            </Typography>
                          </Box>
                        )}
                        {selectedVisit.dischargeDate && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Calendar size={18} color="#64748b" />
                            <Typography variant="body2" sx={{ color: "#4b5563" }}>
                              Discharge: {formatDate(selectedVisit.dischargeDate)}
                            </Typography>
                          </Box>
                        )}
                        {selectedVisit.losDays && (
                          <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "rgba(15,23,42,0.06)" }}>
                            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                              Length of Stay
                            </Typography>
                            <Typography variant="body2" fontWeight={700}>
                              {selectedVisit.losDays} days
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {selectedVisit.primaryDiagnosis && (
                      <Box>
                        <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                          PRIMARY DIAGNOSIS
                        </Typography>
                        <Box sx={{ mt: 1.5, p: 2, borderRadius: 2, bgcolor: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)" }}>
                          <Typography variant="body1" sx={{ color: "#0f172a", fontWeight: 600 }}>
                            {selectedVisit.primaryDiagnosis}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {selectedVisit.dischargeDiagnoses && selectedVisit.dischargeDiagnoses.length > 0 && (
                      <Box>
                        <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                          DISCHARGE DIAGNOSES
                        </Typography>
                        <Box sx={{ mt: 1.5, display: "grid", gap: 1 }}>
                          {selectedVisit.dischargeDiagnoses.map((dx, i) => (
                            <Box key={i} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)" }}>
                              <Typography variant="body2" sx={{ color: "#4b5563" }}>
                                • {dx}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {selectedVisit.attendingPhysician && (
                      <Box>
                        <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                          ATTENDING PHYSICIAN
                        </Typography>
                        <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                          <User size={18} color="#64748b" />
                          <Typography variant="body1" sx={{ color: "#334155", fontWeight: 600 }}>
                            {selectedVisit.attendingPhysician}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
    </LocalizationProvider>
  );
}
