import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import {
  Activity,
  CalendarRange,
  Clock3,
  Download,
  FileStack,
  FileText,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Upload,
} from "lucide-react";
import { fetchCurrentPatientDetail, type PatientDetailApi } from "../lib/patientApi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type RecordItem = {
  id: string;
  rawDate: string | null;
  date: string;
  time: string;
  monthLabel: string;
  type: "Lab Result" | "Visit Summary" | "Diagnosis" | "Prescription" | "Patient Document";
  category: string;
  provider: string;
  status: "Available";
  accent: string;
  surface: string;
  icon: typeof Activity;
  fileName?: string | null;
  fileMimeType?: string | null;
  fileContent?: string | null;
  details: string[];
};

type AccessRequestItem = {
  id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  organization_id: string;
  organization_name: string;
  requested_by: string;
  requested_by_name: string;
  requested_by_email: string;
};

function formatDateParts(value?: string | null) {
  if (!value) {
    return { date: "-", time: "", monthLabel: "Undated" };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { date: value, time: "", monthLabel: "Undated" };
  }

  return {
    date: parsed.toLocaleDateString(),
    time: parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    monthLabel: parsed.toLocaleDateString([], { month: "long", year: "numeric" }),
  };
}

function downloadStoredFile(fileName: string, mimeType: string, dataUrlOrBase64: string) {
  const href = dataUrlOrBase64.startsWith("data:")
    ? dataUrlOrBase64
    : `data:${mimeType || "application/octet-stream"};base64,${dataUrlOrBase64}`;
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName || "record-file";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function getRecordVisual(type: RecordItem["type"]) {
  switch (type) {
    case "Lab Result":
      return { accent: "#3b82f6", surface: "rgba(59,130,246,0.1)", icon: Activity };
    case "Visit Summary":
      return { accent: "#0f766e", surface: "rgba(15,118,110,0.1)", icon: Stethoscope };
    case "Diagnosis":
      return { accent: "#8b5cf6", surface: "rgba(139,92,246,0.1)", icon: FileText };
    case "Prescription":
      return { accent: "#10b981", surface: "rgba(16,185,129,0.1)", icon: FileStack };
    case "Patient Document":
      return { accent: "#f59e0b", surface: "rgba(245,158,11,0.12)", icon: FileText };
    default:
      return { accent: "#00d4aa", surface: "rgba(0,212,170,0.1)", icon: FileText };
  }
}

export default function MyRecordsPage() {
  const [patient, setPatient] = useState<PatientDetailApi | null>(null);
  const [accessRequests, setAccessRequests] = useState<AccessRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessActionLoadingId, setAccessActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | RecordItem["type"]>("All");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetchCurrentPatientDetail(),
      fetch(`${API_URL}/api/patients/access-requests/my`, {
        headers: getAuthHeaders(),
      }).then(async (response) => {
        const json = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(json?.error?.message || "Failed to load access requests");
        }
        return (json?.data?.requests || []) as AccessRequestItem[];
      }),
    ])
      .then(([detail, requests]) => {
        if (active) {
          setPatient(detail);
          setAccessRequests(requests);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load records");
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

  const refreshPatient = async () => {
    setLoading(true);
    try {
      const [detail, requestResponse] = await Promise.all([
        fetchCurrentPatientDetail(),
        fetch(`${API_URL}/api/patients/access-requests/my`, {
          headers: getAuthHeaders(),
        }),
      ]);
      const requestJson = await requestResponse.json().catch(() => null);
      if (!requestResponse.ok) {
        throw new Error(requestJson?.error?.message || "Failed to load access requests");
      }
      setPatient(detail);
      setAccessRequests((requestJson?.data?.requests || []) as AccessRequestItem[]);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const handleAccessRequestResponse = async (requestId: string, action: "approve" | "reject") => {
    setAccessActionLoadingId(requestId);
    try {
      const response = await fetch(`${API_URL}/api/patients/access-requests/${requestId}/respond`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ action }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(json?.error?.message || "Failed to respond to access request");
      }
      await refreshPatient();
      setSuccess(json?.data?.message || (action === "approve" ? "Access request approved." : "Access request rejected."));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to respond to access request");
    } finally {
      setAccessActionLoadingId(null);
    }
  };

  const records = useMemo<RecordItem[]>(() => {
    if (!patient) return [];

    const visitRecords: RecordItem[] = patient.visits.map((visit, index) => {
      const parts = formatDateParts(visit.visit_date);
      const visual = getRecordVisual("Visit Summary");
      return {
        id: visit.id || `visit-${index}`,
        rawDate: visit.visit_date || null,
        date: parts.date,
        time: parts.time,
        monthLabel: parts.monthLabel,
        type: "Visit Summary",
        category: visit.reason || "Visit",
        provider: visit.doctor_name || "Provider",
        status: "Available",
        accent: visual.accent,
        surface: visual.surface,
        icon: visual.icon,
        details: [
          visit.reason ? `Reason: ${visit.reason}` : "Reason: General visit",
          visit.doctor_name ? `Doctor: ${visit.doctor_name}` : "Doctor: Assigned provider",
          visit.doctor_specialty ? `Specialty: ${visit.doctor_specialty}` : "",
        ].filter(Boolean),
      };
    });

    const labRecords: RecordItem[] = patient.labResults.map((lab, index) => {
      const parts = formatDateParts(lab.date);
      const visual = getRecordVisual("Lab Result");
      return {
        id: lab.id || `lab-${index}`,
        rawDate: lab.date || null,
        date: parts.date,
        time: parts.time,
        monthLabel: parts.monthLabel,
        type: "Lab Result",
        category: lab.test_name || "Lab",
        provider: "Laboratory Record",
        status: "Available",
        accent: visual.accent,
        surface: visual.surface,
        icon: visual.icon,
        fileName: lab.uploaded_file_name || null,
        fileMimeType: lab.uploaded_file_mime_type || null,
        fileContent: lab.uploaded_file_content || null,
        details: [
          lab.result ? `Result: ${lab.result}` : "Result: Pending entry",
          lab.uploaded_file_name ? `Attachment: ${lab.uploaded_file_name}` : "",
        ].filter(Boolean),
      };
    });

    const diagnosisRecords: RecordItem[] = patient.diagnoses.map((diagnosis, index) => {
      const parts = formatDateParts(diagnosis.date);
      const visual = getRecordVisual("Diagnosis");
      return {
        id: diagnosis.id || `diagnosis-${index}`,
        rawDate: diagnosis.date || null,
        date: parts.date,
        time: parts.time,
        monthLabel: parts.monthLabel,
        type: "Diagnosis",
        category: diagnosis.diagnosis_name || "Diagnosis",
        provider: "Clinical Diagnosis",
        status: "Available",
        accent: visual.accent,
        surface: visual.surface,
        icon: visual.icon,
        fileName: diagnosis.uploaded_file_name || null,
        fileMimeType: diagnosis.uploaded_file_mime_type || null,
        fileContent: diagnosis.uploaded_file_content || null,
        details: [
          diagnosis.diagnosis_name ? `Condition: ${diagnosis.diagnosis_name}` : "Condition: Diagnosis",
          diagnosis.uploaded_file_name ? `Attachment: ${diagnosis.uploaded_file_name}` : "",
        ].filter(Boolean),
      };
    });

    const prescriptionRecords: RecordItem[] = patient.prescriptions.map((prescription, index) => {
      const parts = formatDateParts(prescription.prescription_date);
      const visual = getRecordVisual("Prescription");
      return {
        id: prescription.id || `prescription-${index}`,
        rawDate: prescription.prescription_date || null,
        date: parts.date,
        time: parts.time,
        monthLabel: parts.monthLabel,
        type: "Prescription",
        category:
          prescription.medications?.map((item) => item.medication_name).filter(Boolean).join(", ")
          || prescription.medication
          || "Prescription",
        provider: prescription.doctor_name || "Prescriber",
        status: "Available",
        accent: visual.accent,
        surface: visual.surface,
        icon: visual.icon,
        details: [
          prescription.approval_status ? `Status: ${prescription.approval_status}` : "Status: Draft",
          prescription.instructions ? `Instructions: ${prescription.instructions}` : "",
          prescription.medications?.length ? `Medications: ${prescription.medications.length}` : "",
        ].filter(Boolean),
      };
    });

    const documentRecords: RecordItem[] = (patient.documents || []).map((document, index) => {
      const parts = formatDateParts(document.created_at);
      // Use the detected document type for a richer visual
      const docType = document.document_type;
      const displayType: RecordItem["type"] =
        docType === "Prescription" ? "Prescription" :
        docType === "Lab Result" ? "Lab Result" :
        docType === "Discharge Summary" ? "Visit Summary" :
        "Patient Document";
      const visual = getRecordVisual(displayType);
      return {
        id: document.id || `document-${index}`,
        rawDate: document.created_at || null,
        date: parts.date,
        time: parts.time,
        monthLabel: parts.monthLabel,
        type: "Patient Document",
        category: document.title || "Uploaded document",
        provider: "Patient Upload",
        status: "Available",
        accent: visual.accent,
        surface: visual.surface,
        icon: visual.icon,
        fileName: document.uploaded_file_name || null,
        fileMimeType: document.uploaded_file_mime_type || null,
        fileContent: document.uploaded_file_content || null,
        details: [
          docType ? `Document type: ${docType}` : "Patient uploaded a document",
          document.uploaded_file_name ? `Patient uploaded: ${document.uploaded_file_name}` : "",
        ].filter(Boolean),
      };
    });

    return [...documentRecords, ...labRecords, ...visitRecords, ...diagnosisRecords, ...prescriptionRecords].sort((a, b) => {
      const dateA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
      const dateB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [patient]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (typeFilter !== "All" && record.type !== typeFilter) {
        return false;
      }

      if (searchFilter) {
        const haystack = [record.category, record.provider, record.type, ...record.details].join(" ").toLowerCase();
        if (!haystack.includes(searchFilter.toLowerCase())) {
          return false;
        }
      }

      const recordDate = record.rawDate ? new Date(record.rawDate) : null;
      if (!recordDate || Number.isNaN(recordDate.getTime())) {
        return !startDateFilter && !endDateFilter;
      }

      if (startDateFilter) {
        const start = new Date(`${startDateFilter}T00:00:00`);
        if (recordDate < start) {
          return false;
        }
      }

      if (endDateFilter) {
        const end = new Date(`${endDateFilter}T23:59:59`);
        if (recordDate > end) {
          return false;
        }
      }

      return true;
    });
  }, [records, typeFilter, startDateFilter, endDateFilter, searchFilter]);

  const groupedRecords = useMemo(() => {
    const groups: Array<{ label: string; items: RecordItem[] }> = [];
    filteredRecords.forEach((record) => {
      const existing = groups.find((group) => group.label === record.monthLabel);
      if (existing) {
        existing.items.push(record);
      } else {
        groups.push({ label: record.monthLabel, items: [record] });
      }
    });
    return groups;
  }, [filteredRecords]);

  const pendingAccessRequests = accessRequests.filter((request) => request.status === "pending");

  const handleDocumentUpload = async (file: File) => {
    if (!patient?.id) {
      setError("No patient record found.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const response = await fetch(`${API_URL}/api/patients/${patient.id}/documents`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: file.name.replace(/\.[^.]+$/, "") || file.name,
          uploadedFileName: file.name,
          uploadedFileMimeType: file.type || "application/octet-stream",
          uploadedFileContent: dataUrl,
        }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error?.message || "Failed to upload document");
      }

      const json = await response.json().catch(() => null);
      const extractedType: string = json?.data?.extractedType ?? "unknown";
      const extractedMedications: number = json?.data?.extractedMedications ?? 0;
      const extractedLabResults: number = json?.data?.extractedLabResults ?? 0;

      await refreshPatient();

      if (extractedType === "prescription" && extractedMedications > 0) {
        setSuccess(`Prescription uploaded — ${extractedMedications} medication${extractedMedications !== 1 ? "s" : ""} extracted and added to your records.`);
      } else if (extractedType === "lab_result" && extractedLabResults > 0) {
        setSuccess(`Lab result uploaded — ${extractedLabResults} test result${extractedLabResults !== 1 ? "s" : ""} extracted and added to your records.`);
      } else if (extractedType === "discharge_summary") {
        setSuccess("Discharge summary uploaded and saved to your records.");
      } else {
        setSuccess("Document uploaded.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError("")} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={() => setError("")} severity="error" variant="filled" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3500} onClose={() => setSuccess("")} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={() => setSuccess("")} severity="success" variant="filled" sx={{ width: "100%" }}>
          {success}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          mb: 3.5,
          p: { xs: 3, md: 4 },
          borderRadius: 5,
          background: "linear-gradient(135deg, #f8fffd 0%, #eefaf7 40%, #f7fbff 100%)",
          border: "1px solid rgba(0,212,170,0.12)",
          boxShadow: "0 30px 60px rgba(15,23,42,0.06)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ position: "absolute", top: -70, right: -30, width: 220, height: 220, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.08)" }} />
        <Box sx={{ position: "absolute", bottom: -90, left: "22%", width: 180, height: 180, borderRadius: "50%", bgcolor: "rgba(59,130,246,0.08)" }} />
        <Box sx={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.35fr 0.9fr" }, gap: 3 }}>
          <Box>
            <Chip
              icon={<Sparkles size={14} />}
              label="My Records Timeline"
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
              Your health story, organized as a living timeline.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 620, lineHeight: 1.8 }}>
              Every upload, lab, diagnosis, visit summary, and prescription appears in one place so you can scan your history quickly and control who gets access.
            </Typography>

            <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap", mt: 3 }}>
              <Button component="label" variant="contained" startIcon={<Upload size={18} />} sx={{ borderRadius: 999, px: 2.25, py: 1.2 }}>
                Upload Record
                <input
                  hidden
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    void handleDocumentUpload(file);
                    event.target.value = "";
                  }}
                />
              </Button>
              <Button
                variant="outlined"
                startIcon={<CalendarRange size={18} />}
                sx={{ borderRadius: 999, px: 2.25, py: 1.2 }}
                onClick={() => {
                  setTypeFilter("All");
                  setStartDateFilter("");
                  setEndDateFilter("");
                  setSearchFilter("");
                }}
              >
                Reset Filters
              </Button>
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
              { label: "Total Records", value: records.length, accent: "#00b894" },
              { label: "Documents", value: patient?.documents?.length || 0, accent: "#f59e0b" },
              { label: "Visits", value: patient?.visits.length || 0, accent: "#0f766e" },
              { label: "Lab Results", value: patient?.labResults.length || 0, accent: "#2563eb" },
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

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "340px minmax(0,1fr)" }, gap: 3, alignItems: "start" }}>
        <Box sx={{ position: { xl: "sticky" }, top: { xl: 148 }, display: "grid", gap: 2.5 }}>
          <Card sx={{ borderRadius: 5, boxShadow: "0 24px 50px rgba(15,23,42,0.06)" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800 }}>
                Timeline Controls
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{ mt: 0.6, mb: 2.2 }}>
                Refine the view
              </Typography>
              <Box sx={{ display: "grid", gap: 1.5 }}>
                <TextField
                  label="Search records"
                  value={searchFilter}
                  onChange={(event) => setSearchFilter(event.target.value)}
                  placeholder="Medication, provider, visit..."
                />
                <TextField
                  select
                  label="Record Type"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as "All" | RecordItem["type"])}
                  SelectProps={{
                    MenuProps: {
                      disablePortal: true,
                      keepMounted: true,
                    },
                  }}
                >
                  {["All", "Visit Summary", "Prescription", "Lab Result", "Diagnosis", "Patient Document"].map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="From"
                  type="date"
                  value={startDateFilter}
                  onChange={(event) => setStartDateFilter(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="To"
                  type="date"
                  value={endDateFilter}
                  onChange={(event) => setEndDateFilter(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
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
                  <ShieldCheck size={20} color="#00d4aa" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Access Control
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(236,254,255,0.64)" }}>
                    You stay in charge
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: "rgba(236,254,255,0.78)", lineHeight: 1.8 }}>
                Clinicians only get access after your approval. Pending requests appear here until you decide.
              </Typography>
              <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Chip label={`${pendingAccessRequests.length} pending`} size="small" sx={{ bgcolor: "rgba(0,212,170,0.14)", color: "#7ef7de", fontWeight: 700 }} />
                <Chip label={`${accessRequests.filter((request) => request.status === "approved").length} approved`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#dbeafe", fontWeight: 700 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ display: "grid", gap: 2.5 }}>
          {pendingAccessRequests.length > 0 ? (
            <Card sx={{ borderRadius: 5, border: "1px solid rgba(245,158,11,0.2)", boxShadow: "0 24px 50px rgba(245,158,11,0.08)" }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, flexWrap: "wrap", mb: 2.2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={900}>
                      Pending approval requests
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Review carefully before sharing your record timeline with an organization.
                    </Typography>
                  </Box>
                  <Chip label={`${pendingAccessRequests.length} awaiting response`} sx={{ bgcolor: "rgba(245,158,11,0.14)", color: "#b45309", fontWeight: 700 }} />
                </Box>

                <Box sx={{ display: "grid", gap: 1.4 }}>
                  {pendingAccessRequests.map((request) => (
                    <Box
                      key={request.id}
                      sx={{
                        p: 2.2,
                        borderRadius: 4,
                        border: "1px solid",
                        borderColor: "divider",
                        background: "linear-gradient(180deg, #ffffff 0%, #fbfcff 100%)",
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
                        gap: 2,
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography fontWeight={800}>{request.organization_name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Requested by {request.requested_by_name} ({request.requested_by_email})
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mt: 1 }}>
                          <Clock3 size={14} color="#94a3b8" />
                          <Typography variant="caption" color="text.secondary">
                            Requested on {new Date(request.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => void handleAccessRequestResponse(request.id, "reject")}
                          disabled={accessActionLoadingId === request.id}
                          sx={{ borderRadius: 999 }}
                        >
                          {accessActionLoadingId === request.id ? <CircularProgress size={18} color="inherit" /> : "Reject"}
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => void handleAccessRequestResponse(request.id, "approve")}
                          disabled={accessActionLoadingId === request.id}
                          sx={{ borderRadius: 999 }}
                        >
                          {accessActionLoadingId === request.id ? <CircularProgress size={18} color="inherit" /> : "Approve"}
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          ) : null}

          <Card sx={{ borderRadius: 5, overflow: "hidden", boxShadow: "0 28px 50px rgba(15,23,42,0.06)" }}>
            <Box
              sx={{
                px: 3,
                py: 2.2,
                borderBottom: "1px solid",
                borderColor: "divider",
                background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
              }}
            >
              <Typography variant="overline" sx={{ letterSpacing: "0.12em", color: "text.secondary", fontWeight: 800 }}>
                Record Flow
              </Typography>
              <Typography variant="h5" fontWeight={900} sx={{ mt: 0.6 }}>
                Chronological timeline
              </Typography>
            </Box>

            <Box sx={{ p: { xs: 2, md: 3 } }}>
              {groupedRecords.length === 0 ? (
                <Alert severity="info">No records match the current filters.</Alert>
              ) : (
                <Box sx={{ display: "grid", gap: 3 }}>
                  {groupedRecords.map((group) => (
                    <Box key={group.label}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
                        <Chip label={group.label} sx={{ bgcolor: "rgba(15,23,42,0.06)", color: "text.primary", fontWeight: 800 }} />
                        <Typography variant="body2" color="text.secondary">
                          {group.items.length} record{group.items.length === 1 ? "" : "s"}
                        </Typography>
                      </Box>

                      <Box sx={{ position: "relative", pl: { xs: 0, md: 4 } }}>
                        <Box
                          sx={{
                            display: { xs: "none", md: "block" },
                            position: "absolute",
                            left: 15,
                            top: 8,
                            bottom: 8,
                            width: 2,
                            bgcolor: "rgba(15,23,42,0.08)",
                          }}
                        />

                        <Box sx={{ display: "grid", gap: 2 }}>
                          {group.items.map((record) => {
                            const IconCmp = record.icon;
                            return (
                              <Box key={record.id} sx={{ position: "relative" }}>
                                <Box
                                  sx={{
                                    display: { xs: "none", md: "grid" },
                                    placeItems: "center",
                                    position: "absolute",
                                    left: -1,
                                    top: 30,
                                    width: 34,
                                    height: 34,
                                    borderRadius: "50%",
                                    bgcolor: record.accent,
                                    boxShadow: `0 12px 30px ${record.accent}33`,
                                    border: "4px solid #fff",
                                  }}
                                >
                                  <IconCmp size={16} color="#fff" />
                                </Box>

                                <Card
                                  sx={{
                                    ml: { xs: 0, md: 5 },
                                    borderRadius: 4,
                                    border: "1px solid",
                                    borderColor: "rgba(15,23,42,0.08)",
                                    boxShadow: "0 20px 45px rgba(15,23,42,0.05)",
                                    transition: "transform 0.18s ease, box-shadow 0.18s ease",
                                    "&:hover": {
                                      transform: "translateY(-2px)",
                                      boxShadow: "0 28px 55px rgba(15,23,42,0.08)",
                                    },
                                  }}
                                >
                                  <CardContent sx={{ p: 0 }}>
                                    <Box
                                      sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr", lg: "180px minmax(0,1fr) auto" },
                                        gap: 0,
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          p: 2.2,
                                          borderRight: { xs: "none", lg: "1px solid" },
                                          borderBottom: { xs: "1px solid", lg: "none" },
                                          borderColor: "rgba(15,23,42,0.08)",
                                          background: record.surface,
                                        }}
                                      >
                                        <Typography variant="caption" sx={{ display: "block", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                                          Event Date
                                        </Typography>
                                        <Typography variant="h6" fontWeight={900} sx={{ mt: 0.6, color: "#0f172a" }}>
                                          {record.date}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          {record.time || "No time captured"}
                                        </Typography>
                                      </Box>

                                      <Box sx={{ p: 2.4 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1.2 }}>
                                          <Chip
                                            label={record.type}
                                            size="small"
                                            sx={{
                                              bgcolor: record.surface,
                                              color: record.accent,
                                              fontWeight: 800,
                                            }}
                                          />
                                          <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                            {record.provider}
                                          </Typography>
                                        </Box>
                                        <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", mb: 1 }}>
                                          {record.category}
                                        </Typography>
                                        <Box sx={{ display: "grid", gap: 0.85 }}>
                                          {record.details.map((detail) => (
                                            <Typography key={detail} variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                              {detail}
                                            </Typography>
                                          ))}
                                        </Box>
                                      </Box>

                                      <Box
                                        sx={{
                                          p: 2.2,
                                          borderLeft: { xs: "none", lg: "1px solid" },
                                          borderTop: { xs: "1px solid", lg: "none" },
                                          borderColor: "rgba(15,23,42,0.08)",
                                          display: "flex",
                                          flexDirection: { xs: "row", lg: "column" },
                                          justifyContent: "space-between",
                                          alignItems: { xs: "center", lg: "flex-end" },
                                          gap: 1.25,
                                          minWidth: { lg: 170 },
                                        }}
                                      >
                                        <Chip label={record.status} size="small" sx={{ bgcolor: "rgba(16,185,129,0.12)", color: "#059669", fontWeight: 800 }} />
                                        {record.fileContent ? (
                                          <Button
                                            variant="text"
                                            size="small"
                                            startIcon={<Download size={14} />}
                                            sx={{ fontWeight: 700, borderRadius: 999 }}
                                            onClick={() => downloadStoredFile(record.fileName || "record-file", record.fileMimeType || "application/octet-stream", record.fileContent || "")}
                                          >
                                            Download
                                          </Button>
                                        ) : (
                                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            No file attached
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                  </CardContent>
                                </Card>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
