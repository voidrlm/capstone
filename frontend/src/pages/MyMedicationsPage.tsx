import { useEffect, useMemo, useState } from "react";
import { Alert, Avatar, Box, Card, CardContent, Chip, CircularProgress, LinearProgress, Typography } from "@mui/material";
import { Pill, AlertCircle, Calendar, RefreshCcw, Clock } from "lucide-react";
import { fetchCurrentPatientDetail, type PatientDetailApi } from "../lib/patientApi";

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
    ? { bgcolor: "rgba(100,116,139,0.12)", color: "#64748b", border: "rgba(100,116,139,0.25)" }
    : { bgcolor: "rgba(22,163,74,0.12)", color: "#16a34a", border: "rgba(22,163,74,0.25)" };
}

export default function MyMedicationsPage() {
  const [patient, setPatient] = useState<PatientDetailApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const medicationStats = useMemo(() => {
    const meds = patient?.medications || [];
    const activeCount = meds.filter((med) => getMedicationStatus(med.end_date) === "Active").length;
    const endingSoon = meds.filter((med) => {
      if (!med.end_date) return false;
      const diff = new Date(med.end_date).getTime() - Date.now();
      return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 7;
    }).length;
    return {
      total: meds.length,
      activeCount,
      endingSoon,
      dosesToday: meds.filter((med) => getMedicationStatus(med.end_date) === "Active").length,
    };
  }, [patient]);

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

  const medications = patient?.medications || [];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>My Medications</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Active medications from your live patient record.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" }, gap: 2.5, mb: 4 }}>
        {[
          { label: "Total Medications", value: String(medicationStats.total), icon: Pill, color: "#00d4aa", bg: "#e0fdf4" },
          { label: "Active Courses", value: String(medicationStats.activeCount), icon: AlertCircle, color: "#16a34a", bg: "#f0fdf4" },
          { label: "Ending Soon", value: String(medicationStats.endingSoon), icon: Clock, color: "#d97706", bg: "#fffbeb" },
          { label: "Tracked Today", value: String(medicationStats.dosesToday), icon: Calendar, color: "#0284c7", bg: "#ecfeff" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} sx={{ position: "relative", overflow: "hidden" }}>
              <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, bgcolor: stat.color, opacity: 0.7 }} />
              <CardContent sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: stat.bg, display: "flex" }}>
                  <Icon size={22} color={stat.color} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>{stat.label}</Typography>
                  <Typography variant="h4" fontWeight={800}>{stat.value}</Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Current Medications</Typography>

      {medications.length === 0 ? (
        <Alert severity="info">No medications were found in your patient record.</Alert>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {medications.map((med) => {
            const status = getMedicationStatus(med.end_date);
            const statusStyle = getStatusStyle(status);
            const progress = status === "Completed" ? 100 : 65;

            return (
              <Card key={med.id} sx={{ overflow: "visible", position: "relative" }}>
                <Box sx={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, bgcolor: status === "Completed" ? "#64748b" : "#00d4aa", borderRadius: "16px 0 0 16px" }} />
                <CardContent sx={{ p: 3, pl: 4 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                      <Avatar sx={{ width: 44, height: 44, bgcolor: status === "Completed" ? "rgba(100,116,139,0.12)" : "rgba(0,212,170,0.12)", color: status === "Completed" ? "#64748b" : "#00d4aa" }}>
                        <Pill size={22} />
                      </Avatar>
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                          <Typography variant="h6" fontWeight={700}>{med.drug_name}</Typography>
                          <Chip size="small" label={status} sx={{ bgcolor: statusStyle.bgcolor, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, fontWeight: 600, height: 24, fontSize: "0.7rem" }} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {med.dosage_amount || med.dosage_level || "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Start: {formatDate(med.start_date)} {med.end_date ? `• End: ${formatDate(med.end_date)}` : "• Ongoing"}
                        </Typography>
                        {med.notes ? (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {med.notes}
                          </Typography>
                        ) : null}
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, borderRadius: 2.5, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", flexWrap: "wrap", gap: 2 }}>
                    <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "text.secondary" }}>
                        <Calendar size={14} />
                        <Typography variant="caption" fontWeight={500}>Started {formatDate(med.start_date)}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "text.secondary" }}>
                        <RefreshCcw size={14} />
                        <Typography variant="caption" fontWeight={500}>{med.end_date ? `Ends ${formatDate(med.end_date)}` : "Active course"}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
                      <Box sx={{ flexGrow: 1, minWidth: 100 }}>
                        <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 4, "& .MuiLinearProgress-bar": { bgcolor: status === "Completed" ? "#64748b" : "#00d4aa", borderRadius: 4 } }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ minWidth: 34, textAlign: "right" }}>
                        {progress}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
