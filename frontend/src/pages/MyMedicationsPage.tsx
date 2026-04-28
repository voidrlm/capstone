import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Clock3,
  X,
  Pill,
  RefreshCcw,
  Sparkles,
  Stethoscope,
  Info,
} from "lucide-react";
import { fetchCurrentPatientDetail, checkDrugInteractions, fetchDrugDetails, updateMedicationEndDate, type PatientDetailApi, type DrugInteraction, type DrugDetail } from "../lib/patientApi";
import { formatDate, getMedicationStatus, getStatusStyle, getRelativeEndLabel } from "../lib/helpers";

export default function MyMedicationsPage() {
  const [patient, setPatient] = useState<PatientDetailApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Completed">("All");
  const [searchFilter, setSearchFilter] = useState("");
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [interactionsDialogOpen, setInteractionsDialogOpen] = useState(false);
  const [drugDetails, setDrugDetails] = useState<DrugDetail | null>(null);
  const [drugDialogOpen, setDrugDialogOpen] = useState(false);
  const [drugDetailsLoading, setDrugDetailsLoading] = useState(false);
  const [manufacturerSearch, setManufacturerSearch] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    void fetchCurrentPatientDetail()
      .then((detail) => {
        if (active) {
          setPatient(detail);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load medications");
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

  useEffect(() => {
    if (!patient || patient.medications.length < 2) {
      setInteractions([]);
      return;
    }

    const activeDrugIds = patient.medications
      .filter((med) => getMedicationStatus(med.end_date) === "Active" && med.drug_id)
      .map((med) => med.drug_id);

    if (activeDrugIds.length < 2) {
      setInteractions([]);
      return;
    }

    void checkDrugInteractions(activeDrugIds)
      .then((result) => {
        setInteractions(result);
      })
      .catch((err: unknown) => {
        console.error("Failed to load interactions:", err);
      });
  }, [patient]);

  const handleViewDrugDetails = (drugId: string) => {
    setDrugDialogOpen(true);
    setDrugDetailsLoading(true);
    setDrugDetails(null);

    void fetchDrugDetails(drugId)
      .then((details) => {
        setDrugDetails(details);
      })
      .catch((err: unknown) => {
        console.error("Failed to load drug details:", err);
      })
      .finally(() => {
        setDrugDetailsLoading(false);
      });
  };

  const handleMarkAsCompleted = async (medicationId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await updateMedicationEndDate(medicationId, today);
      await fetchCurrentPatientDetail().then(setPatient);
    } catch (err: unknown) {
      console.error("Failed to mark medication as completed:", err);
    }
  };

  const handleCloseDrugDialog = () => {
    setDrugDialogOpen(false);
    setDrugDetails(null);
  };

  const medications = patient?.medications || [];

  const medicationStats = useMemo(() => {
    const activeCount = medications.filter((med) => getMedicationStatus(med.end_date) === "Active").length;
    const completedCount = medications.filter((med) => getMedicationStatus(med.end_date) === "Completed").length;
    const endingSoon = medications.filter((med) => {
      if (!med.end_date) return false;
      const diff = new Date(med.end_date).getTime() - Date.now();
      return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 7;
    }).length;

    return {
      total: medications.length,
      activeCount,
      completedCount,
      endingSoon,
      trackedToday: activeCount,
    };
  }, [medications]);

  const filteredMedications = useMemo(() => {
    return medications.filter((med) => {
      const status = getMedicationStatus(med.end_date);

      if (statusFilter !== "All" && status !== statusFilter) {
        return false;
      }

      if (!searchFilter) {
        return true;
      }

      const haystack = [
        med.drug_name,
        med.dosage_amount,
        med.dosage_level,
        med.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchFilter.toLowerCase());
    });
  }, [medications, searchFilter, statusFilter]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box
        sx={{
          mb: 3.5,
          p: { xs: 3, md: 4 },
          borderRadius: 5,
          background: "linear-gradient(135deg, #fbfffd 0%, #effcf7 42%, #f7fbff 100%)",
          border: "1px solid rgba(0,212,170,0.12)",
          boxShadow: "0 30px 60px rgba(15,23,42,0.06)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ position: "absolute", top: -90, right: -30, width: 240, height: 240, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.08)" }} />
        <Box sx={{ position: "absolute", bottom: -70, left: "26%", width: 180, height: 180, borderRadius: "50%", bgcolor: "rgba(59,130,246,0.08)" }} />
        <Box sx={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.35fr 0.95fr" }, gap: 3 }}>
          <Box>
            <Chip
              icon={<Sparkles size={14} />}
              label="Medication Board"
              size="small"
              sx={{
                mb: 1.75,
                bgcolor: "rgba(0,212,170,0.14)",
                color: "#008f74",
                fontWeight: 700,
                "& .MuiChip-icon": { color: "#008f74" },
              }}
            />
            <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: "-0.04em", color: "#0f172a", maxWidth: 700, lineHeight: 1 }}>
              A clearer view of every medication you’re tracking.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 620, lineHeight: 1.8 }}>
              See what is active, what is ending soon, and how each treatment course is progressing without digging through a dense list.
            </Typography>

            <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap", mt: 3 }}>
              {(["All", "Active", "Completed"] as const).map((option) => (
                <Button
                  key={option}
                  variant={statusFilter === option ? "contained" : "outlined"}
                  onClick={() => setStatusFilter(option)}
                  sx={{ borderRadius: 999, px: 2.1 }}
                >
                  {option}
                </Button>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              p: 2.5,
              borderRadius: 4,
              bgcolor: "rgba(255,255,255,0.72)",
              border: "1px solid rgba(15,23,42,0.06)",
              backdropFilter: "blur(10px)",
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 1.5,
              alignContent: "start",
            }}
          >
            {[
              { label: "Total Medications", value: medicationStats.total, accent: "#00b894" },
              { label: "Active Courses", value: medicationStats.activeCount, accent: "#10b981" },
              { label: "Ending Soon", value: medicationStats.endingSoon, accent: "#f59e0b" },
              { label: "Completed", value: medicationStats.completedCount, accent: "#64748b" },
            ].map((item) => (
              <Box
                key={item.label}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.85)",
                  border: "1px solid rgba(15,23,42,0.06)",
                  boxShadow: "0 12px 30px rgba(15,23,42,0.04)",
                }}
              >
                <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                  {item.label}
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.8, fontWeight: 900, color: item.accent }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>

          {interactions.length > 0 && (
            <Card
              sx={{
                borderRadius: 5,
                border: "1px solid rgba(239, 68, 68, 0.2)",
                background: "linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)",
                boxShadow: "0 24px 50px rgba(239, 68, 68, 0.08)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
                  <Box sx={{ width: 42, height: 42, borderRadius: 3, bgcolor: "rgba(239, 68, 68, 0.12)", display: "grid", placeItems: "center" }}>
                    <AlertTriangle size={20} color="#ef4444" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={800} color="#dc2626">
                      Drug Interactions Detected
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(220, 38, 38, 0.7)" }}>
                      {interactions.length} potential interaction{interactions.length === 1 ? "" : "s"} found
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setInteractionsDialogOpen(true)}
                    sx={{
                      borderRadius: 2,
                      bgcolor: "#dc2626",
                      "&:hover": { bgcolor: "#b91c1c" },
                    }}
                  >
                    Show Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "320px minmax(0,1fr)" }, gap: 3, alignItems: "start" }}>
        <Box sx={{ position: { xl: "sticky" }, top: { xl: 148 }, display: "grid", gap: 2.5 }}>
          <Card sx={{ borderRadius: 5, boxShadow: "0 24px 50px rgba(15,23,42,0.06)" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800 }}>
                Medication Filters
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{ mt: 0.6, mb: 2.2 }}>
                Focus your list
              </Typography>
              <Box sx={{ display: "grid", gap: 1.5 }}>
                <TextField
                  id="medications-search"
                  label="Search medications"
                  value={searchFilter}
                  onChange={(event) => setSearchFilter(event.target.value)}
                  placeholder="Metformin, dosage, notes..."
                />
                <TextField
                  id="medications-status-filter"
                  select
                  label="Course Status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as "All" | "Active" | "Completed")}
                >
                  {["All", "Active", "Completed"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </TextField>
              </Box>
            </CardContent>
          </Card>

          <Card
            sx={{
              borderRadius: 5,
              color: "#ecfeff",
              background: "linear-gradient(145deg, #09151f 0%, #0d2230 100%)",
              boxShadow: "0 28px 50px rgba(2,6,23,0.22)",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.4 }}>
                <Box sx={{ width: 42, height: 42, borderRadius: 3, bgcolor: "rgba(0,212,170,0.14)", display: "grid", placeItems: "center" }}>
                  <Stethoscope size={20} color="#00d4aa" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Treatment Snapshot
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(236,254,255,0.64)" }}>
                    Your active medication load
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: "rgba(236,254,255,0.78)", lineHeight: 1.8 }}>
                You currently have {medicationStats.activeCount} active course{medicationStats.activeCount === 1 ? "" : "s"} and {medicationStats.endingSoon} medication{medicationStats.endingSoon === 1 ? "" : "s"} ending soon.
              </Typography>
              <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Chip label={`${medicationStats.trackedToday} active today`} size="small" sx={{ bgcolor: "rgba(0,212,170,0.14)", color: "#7ef7de", fontWeight: 700 }} />
                <Chip label={`${medicationStats.completedCount} completed`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#dbeafe", fontWeight: 700 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ display: "grid", gap: 2.25 }}>
          {filteredMedications.length === 0 ? (
            <Alert severity="info">No medications match the current view.</Alert>
          ) : (
            filteredMedications.map((med) => {
              const status = getMedicationStatus(med.end_date);
              const statusStyle = getStatusStyle(status);

              return (
                <Card
                  key={med.id}
                  sx={{
                    borderRadius: 5,
                    overflow: "hidden",
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 24px 50px rgba(15,23,42,0.06)",
                    transition: "transform 0.18s ease, box-shadow 0.18s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 30px 60px rgba(15,23,42,0.08)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", lg: "200px minmax(0,1fr)" },
                      }}
                    >
                      <Box
                        sx={{
                          p: 2.4,
                          background: statusStyle.surface,
                          borderRight: { xs: "none", lg: "1px solid" },
                          borderBottom: { xs: "1px solid", lg: "none" },
                          borderColor: "rgba(15,23,42,0.08)",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
                          <Avatar
                            sx={{
                              width: 48,
                              height: 48,
                              bgcolor: statusStyle.bgcolor,
                              color: statusStyle.accent,
                            }}
                          >
                            <Pill size={22} />
                          </Avatar>
                          <Box>
                            <Typography variant="caption" sx={{ display: "block", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                              Course Status
                            </Typography>
                            <Chip
                              size="small"
                              label={status}
                              sx={{
                                mt: 0.8,
                                bgcolor: statusStyle.bgcolor,
                                color: statusStyle.color,
                                border: `1px solid ${statusStyle.border}`,
                                fontWeight: 700,
                              }}
                            />
                          </Box>
                        </Box>

                        <Box sx={{ mt: 2.2, display: "grid", gap: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "text.secondary" }}>
                            <Calendar size={14} />
                            <Typography variant="caption" fontWeight={600}>
                              Started {formatDate(med.start_date)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "text.secondary" }}>
                            <Clock3 size={14} />
                            <Typography variant="caption" fontWeight={600}>
                              {getRelativeEndLabel(med.end_date)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Box sx={{ p: 2.6, pb: 2.25 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1 }}>
                          <Typography variant="h5" fontWeight={900} sx={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
                            {med.drug_name}
                          </Typography>
                          <Chip
                            size="small"
                            label={med.dosage_level || "Standard dose"}
                            sx={{ bgcolor: "rgba(15,23,42,0.06)", color: "text.primary", fontWeight: 700 }}
                          />
                        </Box>

                        <Typography variant="body1" color="text.secondary" fontWeight={600}>
                          {med.dosage_amount || "Dosage details not specified"}
                        </Typography>

                        {med.notes ? (
                          <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary", lineHeight: 1.8 }}>
                            {med.notes}
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary", lineHeight: 1.8 }}>
                            No additional medication notes were added for this course.
                          </Typography>
                        )}

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mt: 2 }}>
                          <Chip size="small" icon={<RefreshCcw size={12} />} label={med.end_date ? `Ends ${formatDate(med.end_date)}` : "Ongoing course"} sx={{ bgcolor: "rgba(15,23,42,0.05)", color: "text.secondary" }} />
                          {status === "Active" && medicationStats.endingSoon > 0 && med.end_date ? (
                            <Chip size="small" icon={<AlertCircle size={12} />} label={getRelativeEndLabel(med.end_date)} sx={{ bgcolor: "rgba(245,158,11,0.12)", color: "#b45309", fontWeight: 700 }} />
                          ) : null}
                          {status === "Active" && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleMarkAsCompleted(med.id)}
                              sx={{
                                borderRadius: 999,
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                px: 2,
                                py: 0.6,
                                bgcolor: "#10b981",
                                "&:hover": { bgcolor: "#059669" },
                              }}
                            >
                              Mark as Completed
                            </Button>
                          )}
                          {med.drug_id && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleViewDrugDetails(med.drug_id)}
                              sx={{
                                borderRadius: 999,
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                px: 2,
                                py: 0.6,
                                borderColor: "rgba(15,23,42,0.15)",
                                color: "text.primary",
                                "&:hover": { borderColor: "rgba(15,23,42,0.3)", bgcolor: "rgba(15,23,42,0.04)" },
                              }}
                            >
                              View Details
                            </Button>
                          )}
                        </Box>
                      </Box>

                    </Box>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Box>
      </Box>

      <Dialog
        open={drugDialogOpen}
        onClose={handleCloseDrugDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4 },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #f0fdf4 0%, #f0fdfa 100%)",
            borderBottom: "1px solid rgba(34,197,94,0.2)",
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
                borderRadius: 3,
                bgcolor: "rgba(34,197,94,0.12)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Pill size={24} color="#22c55e" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a" }}>
                {drugDetails?.name || "Loading..."}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleCloseDrugDialog}>
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, maxHeight: "70vh", overflowY: "auto" }}>
          {drugDetailsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : drugDetails ? (
            <Box sx={{ display: "grid", gap: 2.5 }}>
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                  BASIC INFORMATION
                </Typography>
                <Box sx={{ mt: 1.5, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Drug Name
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 600 }}>
                      {drugDetails.name}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Generic Name
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 600 }}>
                      {drugDetails.generic_name || "N/A"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Category
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 600 }}>
                      {drugDetails.category || "N/A"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Route
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 600 }}>
                      {drugDetails.route || "N/A"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Product Type
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 600 }}>
                      {drugDetails.product_type || "N/A"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Manufacturer
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 600 }}>
                      {drugDetails.manufacturer_name || "N/A"}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {drugDetails.uses && drugDetails.uses.length > 0 && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    USES
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    {drugDetails.uses.map((use, idx) => (
                      <Typography key={idx} variant="body2" sx={{ color: "#334155", lineHeight: 1.7, mb: 0.5 }}>
                        {use}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {drugDetails.purpose && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    PURPOSE
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.7 }}>
                      {drugDetails.purpose}
                    </Typography>
                  </Box>
                </Box>
              )}

              {drugDetails.indications_and_usage && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    INDICATIONS AND USAGE
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.7 }}>
                      {drugDetails.indications_and_usage}
                    </Typography>
                  </Box>
                </Box>
              )}

              {drugDetails.dosage_info && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    DOSAGE INFORMATION
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.7 }}>
                      {drugDetails.dosage_info}
                    </Typography>
                  </Box>
                </Box>
              )}

              {drugDetails.dosage_and_administration && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    DOSAGE AND ADMINISTRATION
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.7 }}>
                      {drugDetails.dosage_and_administration}
                    </Typography>
                  </Box>
                </Box>
              )}

              {drugDetails.active_ingredients && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    ACTIVE INGREDIENTS
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.7 }}>
                      {drugDetails.active_ingredients}
                    </Typography>
                  </Box>
                </Box>
              )}

              {drugDetails.inactive_ingredients && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    INACTIVE INGREDIENTS
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.7 }}>
                      {drugDetails.inactive_ingredients}
                    </Typography>
                  </Box>
                </Box>
              )}

              {drugDetails.warnings && drugDetails.warnings.length > 0 && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    WARNINGS
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    {drugDetails.warnings.map((warning, idx) => (
                      <Box key={idx} sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", mb: 1 }}>
                        <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.7 }}>
                          {warning}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {drugDetails.do_not_use && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    DO NOT USE
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.7 }}>
                      {drugDetails.do_not_use}
                    </Typography>
                  </Box>
                </Box>
              )}

              {drugDetails.stop_use && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    STOP USE
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.7 }}>
                      {drugDetails.stop_use}
                    </Typography>
                  </Box>
                </Box>
              )}

              {drugDetails.pregnancy && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    PREGNANCY
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.7 }}>
                      {drugDetails.pregnancy}
                    </Typography>
                  </Box>
                </Box>
              )}

              {drugDetails.overdosage && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    OVERDOSAGE
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.7 }}>
                      {drugDetails.overdosage}
                    </Typography>
                  </Box>
                </Box>
              )}

              {drugDetails.adverse_reactions && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    ADVERSE REACTIONS
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.7 }}>
                      {drugDetails.adverse_reactions}
                    </Typography>
                  </Box>
                </Box>
              )}

              {drugDetails.sideEffects && (drugDetails.sideEffects.high.length > 0 || drugDetails.sideEffects.medium.length > 0 || drugDetails.sideEffects.low.length > 0) && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    SIDE EFFECTS
                  </Typography>
                  <Box sx={{ mt: 1.5, display: "grid", gap: 1.5 }}>
                    {drugDetails.sideEffects.high.map((effect: any) => (
                      <Box
                        key={effect.id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.2)",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                          <Chip
                            size="small"
                            label="HIGH"
                            sx={{
                              bgcolor: "rgba(239,68,68,0.15)",
                              color: "#dc2626",
                              fontWeight: 700,
                              fontSize: "0.65rem",
                              height: 20,
                            }}
                          />
                          <Chip
                            size="small"
                            label={effect.frequency}
                            sx={{
                              bgcolor: "rgba(15,23,42,0.08)",
                              color: "text.secondary",
                              fontWeight: 600,
                              fontSize: "0.65rem",
                              height: 20,
                            }}
                          />
                        </Box>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0f172a", mb: 0.25 }}>
                          {effect.effect_name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#4b5563", lineHeight: 1.6 }}>
                          {effect.description}
                        </Typography>
                      </Box>
                    ))}
                    {drugDetails.sideEffects.medium.map((effect: any) => (
                      <Box
                        key={effect.id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: "rgba(245,158,11,0.08)",
                          border: "1px solid rgba(245,158,11,0.2)",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                          <Chip
                            size="small"
                            label="MEDIUM"
                            sx={{
                              bgcolor: "rgba(245,158,11,0.15)",
                              color: "#d97706",
                              fontWeight: 700,
                              fontSize: "0.65rem",
                              height: 20,
                            }}
                          />
                          <Chip
                            size="small"
                            label={effect.frequency}
                            sx={{
                              bgcolor: "rgba(15,23,42,0.08)",
                              color: "text.secondary",
                              fontWeight: 600,
                              fontSize: "0.65rem",
                              height: 20,
                            }}
                          />
                        </Box>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0f172a", mb: 0.25 }}>
                          {effect.effect_name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#4b5563", lineHeight: 1.6 }}>
                          {effect.description}
                        </Typography>
                      </Box>
                    ))}
                    {drugDetails.sideEffects.low.map((effect: any) => (
                      <Box
                        key={effect.id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: "rgba(34,197,94,0.08)",
                          border: "1px solid rgba(34,197,94,0.2)",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                          <Chip
                            size="small"
                            label="LOW"
                            sx={{
                              bgcolor: "rgba(34,197,94,0.15)",
                              color: "#16a34a",
                              fontWeight: 700,
                              fontSize: "0.65rem",
                              height: 20,
                            }}
                          />
                          <Chip
                            size="small"
                            label={effect.frequency}
                            sx={{
                              bgcolor: "rgba(15,23,42,0.08)",
                              color: "text.secondary",
                              fontWeight: 600,
                              fontSize: "0.65rem",
                              height: 20,
                            }}
                          />
                        </Box>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0f172a", mb: 0.25 }}>
                          {effect.effect_name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#4b5563", lineHeight: 1.6 }}>
                          {effect.description}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {drugDetails.interactions && drugDetails.interactions.length > 0 && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    DRUG INTERACTIONS
                  </Typography>
                  <Box sx={{ mt: 1.5, display: "grid", gap: 1.5 }}>
                    {drugDetails.interactions.map((interaction) => (
                      <Box
                        key={interaction.id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: interaction.severity === "high" ? "rgba(239,68,68,0.08)" : interaction.severity === "medium" ? "rgba(245,158,11,0.08)" : "rgba(34,197,94,0.08)",
                          border: `1px solid ${interaction.severity === "high" ? "rgba(239,68,68,0.2)" : interaction.severity === "medium" ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.2)"}`,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                          <Chip
                            size="small"
                            label={interaction.severity.toUpperCase()}
                            sx={{
                              bgcolor: interaction.severity === "high" ? "rgba(239,68,68,0.15)" : interaction.severity === "medium" ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)",
                              color: interaction.severity === "high" ? "#dc2626" : interaction.severity === "medium" ? "#d97706" : "#16a34a",
                              fontWeight: 700,
                              fontSize: "0.65rem",
                              height: 20,
                            }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ color: "#4b5563", lineHeight: 1.6, mb: 0.5 }}>
                          {interaction.description}
                        </Typography>
                        <Typography variant="caption" sx={{ color: interaction.severity === "high" ? "#dc2626" : interaction.severity === "medium" ? "#d97706" : "#16a34a", fontWeight: 600 }}>
                          {interaction.recommendation}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {drugDetails.manufacturer_names && drugDetails.manufacturer_names.length > 0 && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    ALL MANUFACTURERS
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    <TextField
                      id="manufacturer-search"
                      fullWidth
                      size="small"
                      placeholder="Search manufacturers..."
                      value={manufacturerSearch}
                      onChange={(e) => setManufacturerSearch(e.target.value)}
                      sx={{ mb: 1.5 }}
                    />
                    <TableContainer sx={{ maxHeight: 200, "&::-webkit-scrollbar": { width: 8 }, "&::-webkit-scrollbar-track": { bgcolor: "rgba(0,0,0,0.05)" }, "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(150,150,150,0.4)", borderRadius: 4 }, "&::-webkit-scrollbar-thumb:hover": { bgcolor: "rgba(150,150,150,0.6)" } }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>Manufacturer Name</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {drugDetails.manufacturer_names
                            .filter((mfr) => mfr.toLowerCase().includes(manufacturerSearch.toLowerCase()))
                            .map((mfr, idx) => (
                              <TableRow key={idx}>
                                <TableCell sx={{ color: "#334155" }}>{mfr}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Typography variant="caption" sx={{ color: "text.secondary", mt: 1, display: "block" }}>
                      Showing {drugDetails.manufacturer_names.filter((mfr) => mfr.toLowerCase().includes(manufacturerSearch.toLowerCase())).length} of {drugDetails.manufacturer_names.length} manufacturers
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: "text.secondary", py: 4 }}>
              Failed to load drug details.
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Interactions Dialog */}
      <Dialog
        open={interactionsDialogOpen}
        onClose={() => setInteractionsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, overflow: "hidden" }
        }}
      >
        <DialogTitle sx={{ bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider", py: 3, px: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: "rgba(239, 68, 68, 0.12)", color: "#ef4444", display: "flex" }}>
              <AlertTriangle size={28} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} color="text.primary">
                Drug Interactions Detected
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {interactions.length} potential interaction{interactions.length === 1 ? "" : "s"} found
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4, maxHeight: "70vh", overflowY: "auto" }}>
          <Box sx={{ display: "grid", gap: 2 }}>
            {interactions.map((interaction) => {
              const severityColors = {
                high: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
                medium: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
                low: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
              };
              const colors = severityColors[interaction.severity];

              return (
                <Box
                  key={`${interaction.drug1Id}-${interaction.drug2Id}`}
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    border: "2px solid",
                    borderColor: colors.border,
                    bgcolor: colors.bg,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box sx={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 6, bgcolor: colors.color }} />

                  <Box sx={{ pl: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 2 }}>
                      <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {interaction.drug1Name} <X size={18} color={colors.color} style={{ margin: "0 6px" }} /> {interaction.drug2Name}
                      </Typography>
                      <Chip
                        label={`${interaction.severity.toUpperCase()} RISK`}
                        sx={{
                          bgcolor: colors.color,
                          color: "#fff",
                          fontWeight: 800,
                          letterSpacing: 0.5,
                          borderRadius: 2
                        }}
                      />
                    </Box>

                    <Typography variant="body1" color="text.primary" sx={{ mb: 2, lineHeight: 1.6, fontWeight: 500 }}>
                      {interaction.description}
                    </Typography>

                    {interaction.recommendation && (
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, p: 2, bgcolor: "white", borderRadius: 3, border: "1px solid", borderColor: colors.border }}>
                        <Info size={20} color={colors.color} style={{ flexShrink: 0, marginTop: 2 }} />
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} color={colors.color} mb={0.5}>
                            Clinical Recommendation
                          </Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight={500} lineHeight={1.5}>
                            {interaction.recommendation}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: "grey.50", borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={() => setInteractionsDialogOpen(false)} sx={{ fontWeight: 600, color: "text.secondary" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
