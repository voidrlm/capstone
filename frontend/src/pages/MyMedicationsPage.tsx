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
  Collapse,
  LinearProgress,
  TextField,
  Typography,
} from "@mui/material";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock3,
  Pill,
  RefreshCcw,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { fetchCurrentPatientDetail, checkDrugInteractions, type PatientDetailApi, type DrugInteraction } from "../lib/patientApi";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

function getMedicationStatus(endDate?: string | null) {
  if (!endDate) {
    return "Active";
  }
  const today = new Date();
  const end = new Date(endDate);
  return end < today ? "Completed" : "Active";
}

function getStatusStyle(status: string) {
  return status === "Completed"
    ? { bgcolor: "rgba(100,116,139,0.12)", color: "#64748b", border: "rgba(100,116,139,0.25)", accent: "#64748b", surface: "rgba(100,116,139,0.08)" }
    : { bgcolor: "rgba(16,185,129,0.12)", color: "#059669", border: "rgba(16,185,129,0.22)", accent: "#10b981", surface: "rgba(16,185,129,0.08)" };
}

function getCourseProgress(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return null;
  }

  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function getRelativeEndLabel(endDate?: string | null) {
  if (!endDate) return "No end date set";
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return `Ends ${endDate}`;

  const diffMs = end.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Ended ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} ago`;
  if (diffDays === 0) return "Ends today";
  if (diffDays === 1) return "Ends tomorrow";
  return `${diffDays} days remaining`;
}

export default function MyMedicationsPage() {
  const [patient, setPatient] = useState<PatientDetailApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Completed">("All");
  const [searchFilter, setSearchFilter] = useState("");
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [interactionsLoading, setInteractionsLoading] = useState(false);
  const [expandedInteraction, setExpandedInteraction] = useState<string | null>(null);

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

    setInteractionsLoading(true);
    void checkDrugInteractions(activeDrugIds)
      .then((result) => {
        setInteractions(result);
      })
      .catch((err: unknown) => {
        console.error("Failed to load interactions:", err);
      })
      .finally(() => {
        setInteractionsLoading(false);
      });
  }, [patient]);

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
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "320px minmax(0,1fr)" }, gap: 3, alignItems: "start" }}>
        <Box sx={{ position: { xl: "sticky" }, top: { xl: 148 }, display: "grid", gap: 2.5 }}>
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
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} color="#dc2626">
                      Drug Interactions Detected
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(220, 38, 38, 0.7)" }}>
                      {interactions.length} potential interaction{interactions.length === 1 ? "" : "s"} found
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "grid", gap: 1.5 }}>
                  {interactionsLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    interactions.slice(0, 3).map((interaction) => {
                    const isExpanded = expandedInteraction === `${interaction.drug1Id}-${interaction.drug2Id}`;
                    const severityColors = {
                      high: { bg: "rgba(239, 68, 68, 0.12)", color: "#dc2626", border: "rgba(239, 68, 68, 0.3)" },
                      medium: { bg: "rgba(245, 158, 11, 0.12)", color: "#d97706", border: "rgba(245, 158, 11, 0.3)" },
                      low: { bg: "rgba(34, 197, 94, 0.12)", color: "#16a34a", border: "rgba(34, 197, 94, 0.3)" },
                    };
                    const colors = severityColors[interaction.severity];

                    return (
                      <Box
                        key={`${interaction.drug1Id}-${interaction.drug2Id}`}
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          bgcolor: "rgba(255, 255, 255, 0.8)",
                          border: `1px solid ${colors.border}`,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          "&:hover": { bgcolor: "rgba(255, 255, 255, 1)" },
                        }}
                        onClick={() => setExpandedInteraction(isExpanded ? null : `${interaction.drug1Id}-${interaction.drug2Id}`)}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                              <Typography variant="body2" fontWeight={700} sx={{ color: "#1f2937" }}>
                                {interaction.drug1Name}
                              </Typography>
                              <Typography variant="body2" sx={{ color: "#6b7280" }}>+</Typography>
                              <Typography variant="body2" fontWeight={700} sx={{ color: "#1f2937" }}>
                                {interaction.drug2Name}
                              </Typography>
                            </Box>
                            <Chip
                              size="small"
                              label={interaction.severity.toUpperCase()}
                              sx={{
                                bgcolor: colors.bg,
                                color: colors.color,
                                fontWeight: 700,
                                fontSize: "0.7rem",
                                height: 22,
                              }}
                            />
                          </Box>
                          {isExpanded ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
                        </Box>
                        <Collapse in={isExpanded}>
                          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid rgba(0, 0, 0, 0.06)" }}>
                            <Typography variant="body2" sx={{ color: "#4b5563", lineHeight: 1.6, mb: 1 }}>
                              {interaction.description}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colors.color, fontWeight: 600, display: "block" }}>
                              {interaction.recommendation}
                            </Typography>
                          </Box>
                        </Collapse>
                      </Box>
                    );
                  })
                  )}
                  {interactions.length > 3 && (
                    <Typography variant="caption" sx={{ color: "text.secondary", textAlign: "center", display: "block", mt: 0.5 }}>
                      +{interactions.length - 3} more interaction{interactions.length - 3 === 1 ? "" : "s"}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}
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
                  label="Search medications"
                  value={searchFilter}
                  onChange={(event) => setSearchFilter(event.target.value)}
                  placeholder="Metformin, dosage, notes..."
                />
                <TextField
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
              const progress = getCourseProgress(med.start_date, med.end_date);

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
                        gridTemplateColumns: { xs: "1fr", lg: "200px minmax(0,1fr) 220px" },
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

                      <Box sx={{ p: 2.6 }}>
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
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          p: 2.4,
                          borderLeft: { xs: "none", lg: "1px solid" },
                          borderTop: { xs: "1px solid", lg: "none" },
                          borderColor: "rgba(15,23,42,0.08)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: 2,
                          background: "linear-gradient(180deg, #ffffff 0%, #fafcff 100%)",
                        }}
                      >
                        <Box>
                          <Typography variant="caption" sx={{ display: "block", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                            Course Progress
                          </Typography>
                          <Typography variant="h4" fontWeight={900} sx={{ mt: 0.8, color: statusStyle.accent }}>
                            {progress ?? (status === "Completed" ? 100 : 65)}%
                          </Typography>
                        </Box>

                        <Box>
                          <LinearProgress
                            variant="determinate"
                            value={progress ?? (status === "Completed" ? 100 : 65)}
                            sx={{
                              height: 8,
                              borderRadius: 999,
                              bgcolor: "rgba(15,23,42,0.08)",
                              "& .MuiLinearProgress-bar": {
                                bgcolor: statusStyle.accent,
                                borderRadius: 999,
                              },
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                            {status === "Completed" ? "Course completed" : "Live treatment estimate"}
                          </Typography>
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
    </Box>
  );
}
