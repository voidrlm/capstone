import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, IconButton, MenuItem, Snackbar, TextField, Typography, useTheme } from "@mui/material";
import { Download, Search, CalendarRange, Activity, Stethoscope, FileText, Upload } from "lucide-react";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineOppositeContent, { timelineOppositeContentClasses } from "@mui/lab/TimelineOppositeContent";
import TimelineDot from "@mui/lab/TimelineDot";
import { fetchCurrentPatientDetail, type PatientDetailApi } from "../lib/patientApi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type RecordItem = {
  id: string;
  rawDate: string | null;
  date: string;
  time: string;
  type: "Lab Result" | "Visit Summary" | "Diagnosis" | "Prescription" | "Patient Document";
  category: string;
  provider: string;
  status: "Available";
  color: "primary" | "secondary" | "info" | "success";
  icon: typeof Activity;
  fileName?: string | null;
  fileMimeType?: string | null;
  fileContent?: string | null;
  details: string[];
};

function formatDateParts(value?: string | null) {
  if (!value) {
    return { date: "-", time: "" };
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { date: value, time: "" };
  }
  return {
    date: parsed.toLocaleDateString(),
    time: parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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

export default function MyRecordsPage() {
  const theme = useTheme();
  const [patient, setPatient] = useState<PatientDetailApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | RecordItem["type"]>("All");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  useEffect(() => {
    let active = true;
    void fetchCurrentPatientDetail()
      .then((detail) => {
        if (active) setPatient(detail);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load records");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const refreshPatient = async () => {
    setLoading(true);
    try {
      const detail = await fetchCurrentPatientDetail();
      setPatient(detail);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const records = useMemo<RecordItem[]>(() => {
    if (!patient) return [];

    const visitRecords: RecordItem[] = patient.visits.map((visit, index) => {
      const parts = formatDateParts(visit.visit_date);
      return {
        id: visit.id || `visit-${index}`,
        rawDate: visit.visit_date || null,
        date: parts.date,
        time: parts.time,
        type: "Visit Summary",
        category: visit.reason || "Visit",
        provider: visit.doctor_name || "Provider",
        status: "Available",
        icon: Stethoscope,
        color: "secondary",
        details: [
          visit.reason ? `Reason: ${visit.reason}` : "Reason: General visit",
          visit.doctor_name ? `Doctor: ${visit.doctor_name}` : "Doctor: Assigned provider",
          visit.doctor_specialty ? `Specialty: ${visit.doctor_specialty}` : "",
        ].filter(Boolean),
      };
    });

    const labRecords: RecordItem[] = patient.labResults.map((lab, index) => {
      const parts = formatDateParts(lab.date);
      return {
        id: lab.id || `lab-${index}`,
        rawDate: lab.date || null,
        date: parts.date,
        time: parts.time,
        type: "Lab Result",
        category: lab.test_name || "Lab",
        provider: "Laboratory Record",
        status: "Available",
        icon: Activity,
        color: "primary",
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
      return {
        id: diagnosis.id || `diagnosis-${index}`,
        rawDate: diagnosis.date || null,
        date: parts.date,
        time: parts.time,
        type: "Diagnosis",
        category: diagnosis.diagnosis_name || "Diagnosis",
        provider: "Clinical Diagnosis",
        status: "Available",
        icon: FileText,
        color: "info",
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
      return {
        id: prescription.id || `prescription-${index}`,
        rawDate: prescription.prescription_date || null,
        date: parts.date,
        time: parts.time,
        type: "Prescription",
        category:
          prescription.medications?.map((item) => item.medication_name).filter(Boolean).join(", ")
          || prescription.medication
          || "Prescription",
        provider: prescription.doctor_name || "Prescriber",
        status: "Available",
        icon: FileText,
        color: "success",
        details: [
          prescription.approval_status ? `Status: ${prescription.approval_status}` : "Status: Draft",
          prescription.instructions ? `Instructions: ${prescription.instructions}` : "",
          prescription.medications?.length ? `Medications: ${prescription.medications.length}` : "",
        ].filter(Boolean),
      };
    });

    const documentRecords: RecordItem[] = (patient.documents || []).map((document, index) => {
      const parts = formatDateParts(document.created_at);
      return {
        id: document.id || `document-${index}`,
        rawDate: document.created_at || null,
        date: parts.date,
        time: parts.time,
        type: "Patient Document",
        category: document.title || "Uploaded document",
        provider: "Patient Upload",
        status: "Available",
        icon: FileText,
        color: "info",
        fileName: document.uploaded_file_name || null,
        fileMimeType: document.uploaded_file_mime_type || null,
        fileContent: document.uploaded_file_content || null,
        details: [
          document.document_type ? `Document type: ${document.document_type}` : "Patient uploaded a document",
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
  }, [records, typeFilter, startDateFilter, endDateFilter]);

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
          documentType: "Patient Upload",
          uploadedFileName: file.name,
          uploadedFileMimeType: file.type || "application/octet-stream",
          uploadedFileContent: dataUrl,
        }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error?.message || "Failed to upload document");
      }

      await refreshPatient();
      setSuccess("Document uploaded.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    }
  };

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>My Medical History</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Live timeline of your visits, labs, diagnoses, and prescriptions.
          </Typography>
        </Box>
        <Button component="label" variant="contained" startIcon={<Upload size={18} />} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
          Upload Document
          <input
            hidden
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }
              void handleDocumentUpload(file);
              event.target.value = "";
            }}
          />
        </Button>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr 1fr auto" }, gap: 2, alignItems: "center" }}>
            <TextField
              select
              label="Record Type"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as "All" | RecordItem["type"])}
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
            <Button
              variant="outlined"
              startIcon={<CalendarRange size={18} />}
              onClick={() => {
                setTypeFilter("All");
                setStartDateFilter("");
                setEndDateFilter("");
              }}
              sx={{ height: 56, borderColor: "#dbe4f0", color: "text.primary" }}
            >
              Clear
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2.5, mb: 4 }}>
          {[
            { title: "Total Records", value: String(records.length), color: "#2563eb" },
            { title: "Lab Results", value: String(patient?.labResults.length || 0), color: "#0284c7" },
            { title: "Visits", value: String(patient?.visits.length || 0), color: "#0d9488" },
            { title: "Documents", value: String(patient?.documents?.length || 0), color: "#7c3aed" },
          ].map((item) => (
          <Card key={item.title} sx={{ position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, bgcolor: item.color }} />
            <CardContent sx={{ p: 3, pl: 3.5 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>
                {item.title}
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>{item.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card>
        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#f8fafc", borderRadius: "16px 16px 0 0" }}>
          <Typography variant="h6" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Activity size={20} color="#2563eb" /> Chronological Records
          </Typography>
          <IconButton sx={{ bgcolor: "white", border: "1px solid #e2e8f0" }}><Search size={18} /></IconButton>
        </Box>

        <Box sx={{ p: { xs: 1, md: 3 } }}>
          {filteredRecords.length === 0 ? (
            <Alert severity="info">No records were found in your patient profile.</Alert>
          ) : (
            <Timeline sx={{ [`& .${timelineOppositeContentClasses.root}`]: { flex: 0.2, minWidth: 150 } }}>
              {filteredRecords.map((record, index) => {
                const IconCmp = record.icon;
                return (
                  <TimelineItem key={record.id}>
                    <TimelineOppositeContent sx={{ m: "auto 0" }}>
                      <Typography variant="body2" fontWeight={700} color="text.primary">{record.date}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>{record.time || "-"}</Typography>
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineConnector sx={{ bgcolor: index === 0 ? "transparent" : `${record.color}.light`, opacity: 0.5, width: 2 }} />
                      <TimelineDot color={record.color} sx={{ p: 1.5, boxShadow: `0 4px 15px ${theme.palette[record.color].main}40`, border: `4px solid ${theme.palette.background.paper}` }}>
                        <IconCmp size={22} color="#fff" />
                      </TimelineDot>
                      <TimelineConnector sx={{ bgcolor: index === records.length - 1 ? "transparent" : `${record.color}.light`, opacity: 0.5, width: 2 }} />
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: "24px", px: { xs: 2, md: 4 } }}>
                      <Card
                        sx={{
                          transition: "all 0.2s ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                          },
                          "&:hover .record-hover-details": {
                            opacity: 1,
                            maxHeight: 200,
                            mt: 2,
                          },
                        }}
                      >
                        <CardContent sx={{ p: 3, pb: "24px !important" }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
                            <Box>
                              <Chip label={record.type} size="small" color={record.color} variant="outlined" sx={{ mb: 1.5, fontWeight: 700 }} />
                              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>{record.category}</Typography>
                              <Typography variant="caption" color="text.secondary" fontWeight={500}>{record.provider}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                              <Chip label={record.status} size="small" color="success" sx={{ fontWeight: 600, height: 24, fontSize: "0.7rem" }} />
                              {record.fileContent ? (
                                <Button
                                  variant="text"
                                  size="small"
                                  startIcon={<Download size={14} />}
                                  sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                                  onClick={() => downloadStoredFile(record.fileName || "record-file", record.fileMimeType || "application/octet-stream", record.fileContent || "")}
                                >
                                  Download File
                                </Button>
                              ) : null}
                            </Box>
                          </Box>
                          <Box
                            className="record-hover-details"
                            sx={{
                              opacity: 0,
                              maxHeight: 0,
                              overflow: "hidden",
                              transition: "all 0.2s ease",
                              borderTop: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            <Typography variant="caption" sx={{ display: "block", color: "text.secondary", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", mb: 1 }}>
                              Additional Details
                            </Typography>
                            <Box sx={{ display: "grid", gap: 0.75 }}>
                              {record.details.map((detail) => (
                                <Typography key={detail} variant="body2" color="text.secondary">
                                  {detail}
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </TimelineContent>
                  </TimelineItem>
                );
              })}
            </Timeline>
          )}
        </Box>
      </Card>
    </Box>
  );
}
