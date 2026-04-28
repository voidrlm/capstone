import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import {
  Calendar,
  ArrowUpRight,
  Building2,
  Filter,
  Hospital,
  Search,
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

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
  },
});

function getVisitVisual(type: VisitItem["type"]) {
  return type === "discharge"
    ? {
        label: "Discharge Summary",
        accent: "#0f766e",
        surface: "rgba(15,118,110,0.1)",
        icon: Hospital,
      }
    : {
        label: "Visit",
        accent: "#2563eb",
        surface: "rgba(37,99,235,0.1)",
        icon: Stethoscope,
      };
}

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

      <Box
        sx={{
          mb: 3,
          p: { xs: 2.5, md: 3.25 },
          borderRadius: 5,
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #f8fffd 0%, #eef7ff 52%, #fff7ed 100%)",
          border: "1px solid rgba(148,163,184,0.16)",
          boxShadow: "0 24px 70px rgba(15,23,42,0.07)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 12% 18%, rgba(0,212,170,0.18), transparent 25%), radial-gradient(circle at 86% 12%, rgba(59,130,246,0.16), transparent 24%)",
            pointerEvents: "none",
          }}
        />
        <Box sx={{ position: "relative", display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ maxWidth: 680 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.25 }}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 3,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(15,118,110,0.12)",
                  border: "1px solid rgba(15,118,110,0.18)",
                }}
              >
                <Stethoscope size={22} color="#0f766e" />
              </Box>
              <Chip
                label={`${filteredVisits.length} visible`}
                size="small"
                sx={{ bgcolor: "rgba(15,23,42,0.06)", color: "#334155", fontWeight: 800 }}
              />
            </Box>
            <Typography variant="h4" fontWeight={900} sx={{ color: "#0f172a", mb: 1, letterSpacing: 0 }}>
              My Visits
            </Typography>
            <Typography variant="body1" sx={{ color: "#64748b", maxWidth: 560 }}>
              Review provider visits, hospital stays, discharge summaries, and the care team behind each event.
            </Typography>
          </Box>
          <Box
            sx={{
              alignSelf: { xs: "stretch", md: "center" },
              minWidth: { xs: "100%", sm: 260 },
              p: 2,
              borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.72)",
              border: "1px solid rgba(148,163,184,0.18)",
              backdropFilter: "blur(16px)",
            }}
          >
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
              Care Touchpoints
            </Typography>
            <Typography variant="h5" fontWeight={900} sx={{ color: "#0f172a", lineHeight: 1.1, mt: 0.4 }}>
              {visits.length}
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
              total visit records
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Analytics Summary */}
      {visits.length > 0 && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
          {[
            { label: "Total Visits", value: analytics.totalVisits, color: "#2563eb", icon: Stethoscope },
            { label: "Hospital Stays", value: analytics.totalDischarges, color: "#0f766e", icon: Hospital },
            { label: "Avg. Stay", value: `${analytics.avgLosDays} days`, color: "#7c3aed", icon: Calendar },
            { label: "Providers", value: analytics.uniqueProviders, color: "#059669", icon: User },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Box
                key={stat.label}
                sx={{
                  p: 2.25,
                  borderRadius: 3,
                  bgcolor: "#fff",
                  border: `1px solid ${alpha(stat.color, 0.16)}`,
                  boxShadow: `0 16px 36px ${alpha(stat.color, 0.08)}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  minHeight: 102,
                }}
              >
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 2.5,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha(stat.color, 0.1),
                    border: `1px solid ${alpha(stat.color, 0.18)}`,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={21} color={stat.color} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800, display: "block" }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={900} sx={{ color: stat.color, lineHeight: 1.15, wordBreak: "break-word" }}>
                    {stat.value}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Filters */}
      {visits.length > 0 && (
        <Box sx={{ mb: 3, p: { xs: 2, md: 2.5 }, borderRadius: 4, bgcolor: "#fff", border: "1px solid rgba(148,163,184,0.16)", boxShadow: "0 14px 42px rgba(15,23,42,0.06)" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: "rgba(15,118,110,0.1)", display: "grid", placeItems: "center" }}>
                <Filter size={18} color="#0f766e" />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={900} sx={{ color: "#0f172a" }}>
                  Filter Visits
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Search by reason, provider, specialty, or date
                </Typography>
              </Box>
            </Box>
            <Button
              size="small"
              onClick={() => {
                setSearchFilter("");
                setTypeFilter("All");
                setStartDateFilter(null);
                setEndDateFilter(null);
              }}
              sx={{ color: "#0f766e", fontWeight: 800, textTransform: "none" }}
            >
              Reset
            </Button>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "0.9fr 1.35fr 1fr 1fr" }, gap: 1.5 }}>
            <TextField
              id="visits-type-filter"
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
              id="visits-search"
              fullWidth
              size="small"
              label="Search"
              placeholder="Reason, provider, specialty..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              InputProps={{
                startAdornment: <Search size={17} color="#64748b" style={{ marginRight: 8, flexShrink: 0 }} />,
              }}
            />
            <DatePicker
              label="From Date"
              value={startDateFilter}
              onChange={(newValue) => setStartDateFilter(newValue)}
              format="MM/DD/YYYY"
              slotProps={{
                textField: { size: "small", fullWidth: true },
                popper: { sx: { "& .MuiIconButton-root": { color: "#333" } } },
              }}
            />
            <DatePicker
              label="To Date"
              value={endDateFilter}
              onChange={(newValue) => setEndDateFilter(newValue)}
              format="MM/DD/YYYY"
              slotProps={{
                textField: { size: "small", fullWidth: true },
                popper: { sx: { "& .MuiIconButton-root": { color: "#333" } } },
              }}
            />
          </Box>
        </Box>
      )}

      {filteredVisits.length === 0 && visits.length > 0 ? (
        <Alert severity="info">No visits match your filters.</Alert>
      ) : filteredVisits.length === 0 ? (
        <Alert severity="info">No visits recorded yet.</Alert>
      ) : (
        <Box sx={{ display: "grid", gap: 2.25 }}>
          {filteredVisits.map((visit, index) => {
            const visual = getVisitVisual(visit.type);
            const Icon = visual.icon;

            return (
            <Card
              key={visit.id}
              component={motion.button}
              type="button"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: Math.min(index * 0.035, 0.3) }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
              sx={{
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                borderRadius: 4,
                border: `1px solid ${alpha(visual.accent, 0.18)}`,
                background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 62%, #f8fffd 100%)",
                boxShadow: "0 18px 44px rgba(15,23,42,0.07)",
                overflow: "hidden",
                position: "relative",
                "&:before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  width: 7,
                  bgcolor: visual.accent,
                },
                "&:after": {
                  content: '""',
                  position: "absolute",
                  right: -60,
                  top: -80,
                  width: 190,
                  height: 190,
                  borderRadius: "50%",
                  background: alpha(visual.accent, 0.1),
                  pointerEvents: "none",
                },
              }}
              onClick={() => handleVisitClick(visit)}
            >
              <CardContent sx={{ p: { xs: 2.25, md: 2.75 }, position: "relative", zIndex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: { xs: 1.75, md: 2.25 } }}>
                  <Box
                    sx={{
                      width: { xs: 52, md: 60 },
                      height: { xs: 52, md: 60 },
                      borderRadius: 3,
                      bgcolor: visual.surface,
                      border: `1px solid ${alpha(visual.accent, 0.22)}`,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                      boxShadow: `0 14px 30px ${alpha(visual.accent, 0.12)}`,
                    }}
                  >
                    <Icon size={26} color={visual.accent} />
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Chip
                          label={visual.label}
                          size="small"
                          sx={{
                            bgcolor: visual.surface,
                            color: visual.accent,
                            border: `1px solid ${alpha(visual.accent, 0.18)}`,
                            fontWeight: 900,
                            fontSize: "0.72rem",
                            mb: 1,
                          }}
                        />
                        <Typography
                          variant="h6"
                          fontWeight={900}
                          sx={{ color: "#0f172a", lineHeight: 1.22, wordBreak: "break-word", fontSize: { xs: "1.02rem", md: "1.12rem" } }}
                        >
                          {visit.reason}
                        </Typography>
                      </Box>
                      <ArrowUpRight size={19} color={visual.accent} style={{ flexShrink: 0, marginTop: 4 }} />
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.4, mt: 1.6, flexWrap: "wrap" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Calendar size={16} color="#64748b" />
                        <Typography variant="body2" sx={{ color: "#475569", fontWeight: 700 }}>
                          {formatDate(visit.date)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <User size={16} color="#64748b" />
                        <Typography variant="body2" sx={{ color: "#475569", fontWeight: 700, wordBreak: "break-word" }}>
                          {visit.doctorName}
                        </Typography>
                      </Box>
                      {visit.doctorSpecialty && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.65, color: "#64748b" }}>
                          <Building2 size={16} />
                          <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 700 }}>
                            {visit.doctorSpecialty}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    {visit.type === "discharge" && visit.losDays ? (
                      <Chip
                        label={`${visit.losDays} day stay`}
                        size="small"
                        sx={{ mt: 1.25, bgcolor: "rgba(15,23,42,0.05)", color: "#334155", fontWeight: 800, height: 24 }}
                      />
                    ) : null}
                  </Box>
                </Box>
              </CardContent>
            </Card>
            );
          })}
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
    </ThemeProvider>
  );
}
