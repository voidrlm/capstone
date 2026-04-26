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
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
  X,
} from "lucide-react";
import { fetchCurrentPatientDetail, type PatientDetailApi } from "../lib/patientApi";
import { getAuthHeaders, downloadStoredFile, getStoredFileHref, readFileAsDataUrl, formatDate, formatDateParts } from "../lib/helpers";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type RecordItem = {
  id: string;
  rawDate: string | null;
  date: string;
  time: string;
  monthLabel: string;
  type: "Lab Result" | "Visit Summary" | "Diagnosis" | "Prescription" | "Patient Document" | "Vaccination";
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
  documentType?: string | null;
  extractedData?: {
    medications?: Array<{ name: string; dosage?: string }>;
    labResults?: Array<{ testName: string; result: string }>;
    vaccinations?: Array<{ vaccineName: string; date: string; dose?: string }>;
  };
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
    case "Vaccination":
      return { accent: "#ec4899", surface: "rgba(236,72,153,0.1)", icon: ShieldCheck };
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
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadReviewOpen, setUploadReviewOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ file: File; parsedData: any } | null>(null);

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
        docType === "Visit Summary" ? "Visit Summary" :
        docType === "Discharge Summary" ? "Visit Summary" :
        "Patient Document";
      const visual = getRecordVisual(displayType);
      return {
        id: document.id || `document-${index}`,
        rawDate: document.created_at || null,
        date: parts.date,
        time: parts.time,
        monthLabel: parts.monthLabel,
        type: displayType,
        category: document.title || "Uploaded document",
        provider: "Patient Upload",
        status: "Available",
        accent: visual.accent,
        surface: visual.surface,
        icon: visual.icon,
        fileName: document.uploaded_file_name || null,
        fileMimeType: document.uploaded_file_mime_type || null,
        fileContent: document.uploaded_file_content || null,
        documentType: docType || null,
        details: [
          docType ? `Document type: ${docType}` : "Patient uploaded a document",
          document.uploaded_file_name ? `File: ${document.uploaded_file_name}` : "",
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
      const existing = groups.find((group) => group.label === record.date);
      if (existing) {
        existing.items.push(record);
      } else {
        groups.push({ label: record.date, items: [record] });
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
      
      // First, parse the document to show preview
      const parseResponse = await fetch(`${API_URL}/api/patients/${patient.id}/documents/preview?debug=1`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          uploadedFileName: file.name,
          uploadedFileMimeType: file.type || "application/octet-stream",
          uploadedFileContent: dataUrl,
        }),
      });

      if (!parseResponse.ok) {
        const json = await parseResponse.json().catch(() => null);
        throw new Error(json?.error?.message || "Failed to parse document");
      }

      const parseJson = await parseResponse.json().catch(() => null);
      const parsedData = parseJson?.data || { type: "unknown", medications: [], labResults: [] };

      setPendingUpload({ file, parsedData });
      setUploadReviewOpen(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to parse document");
    }
  };

  const handleConfirmUpload = async () => {
    if (!pendingUpload || !patient?.id) return;

    try {
      const dataUrl = await readFileAsDataUrl(pendingUpload.file);
      const response = await fetch(`${API_URL}/api/patients/${patient.id}/documents`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: pendingUpload.file.name.replace(/\.[^.]+$/, "") || pendingUpload.file.name,
          uploadedFileName: pendingUpload.file.name,
          uploadedFileMimeType: pendingUpload.file.type || "application/octet-stream",
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
      const extractedVaccinations: number = json?.data?.extractedVaccinations ?? 0;
      const extractedVisits: number = json?.data?.extractedVisits ?? 0;

      await refreshPatient();
      setUploadReviewOpen(false);
      setPendingUpload(null);

      if (extractedType === "prescription" && extractedMedications > 0) {
        setSuccess(`Prescription uploaded — ${extractedMedications} medication${extractedMedications !== 1 ? "s" : ""} extracted and added to your records.`);
      } else if (extractedType === "lab_result" && extractedLabResults > 0) {
        setSuccess(`Lab result uploaded — ${extractedLabResults} test result${extractedLabResults !== 1 ? "s" : ""} extracted and added to your records.`);
      } else if (extractedType === "vaccination" && extractedVaccinations > 0) {
        setSuccess(`Vaccination record uploaded — ${extractedVaccinations} vaccination${extractedVaccinations !== 1 ? "s" : ""} extracted and added to your records.`);
      } else if (extractedType === "visit" && extractedVisits > 0) {
        setSuccess(`Visit summary uploaded — ${extractedVisits} visit${extractedVisits !== 1 ? "s" : ""} extracted and added to your records.`);
      } else if (extractedType === "visit") {
        setSuccess("Visit summary uploaded and saved to your records.");
      } else if (extractedType === "discharge_summary") {
        setSuccess("Discharge summary uploaded and saved to your records.");
      } else {
        setSuccess("Document uploaded.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    }
  };

  const handleCancelUpload = () => {
    setUploadReviewOpen(false);
    setPendingUpload(null);
  };

  const handleRecordClick = (record: RecordItem) => {
    setSelectedRecord(record);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRecord(null);
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

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, maxHeight: "90vh" },
        }}
      >
        {selectedRecord && (
          <>
            <DialogTitle
              sx={{
                background: `linear-gradient(135deg, ${selectedRecord.surface} 0%, #fff 100%)`,
                borderBottom: `1px solid ${selectedRecord.accent}22`,
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
                    bgcolor: selectedRecord.accent,
                    display: "grid",
                    placeItems: "center",
                    border: "4px solid #fff",
                    boxShadow: `0 0 0 3px ${selectedRecord.accent}22, 0 8px 28px ${selectedRecord.accent}44`,
                  }}
                >
                  <selectedRecord.icon size={22} color="#fff" />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a" }}>
                    {selectedRecord.category}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
                    {selectedRecord.type} • {selectedRecord.date}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={handleCloseDialog} sx={{ ml: "auto" }}>
                <X size={20} />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ display: "grid", gap: 2.5 }}>
                {selectedRecord.documentType && (
                  <Box>
                    <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                      DOCUMENT TYPE
                    </Typography>
                    <Box sx={{ mt: 1.5 }}>
                      <Chip
                        label={selectedRecord.documentType}
                        sx={{
                          bgcolor: `${selectedRecord.accent}22`,
                          color: selectedRecord.accent,
                          fontWeight: 700,
                          fontSize: "0.75rem",
                        }}
                      />
                    </Box>
                  </Box>
                )}

                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    DETAILS
                  </Typography>
                  <Box sx={{ mt: 1.5, display: "grid", gap: 1 }}>
                    {selectedRecord.details.map((detail, idx) => (
                      <Typography key={idx} variant="body1" sx={{ color: "#334155", lineHeight: 1.7 }}>
                        {detail}
                      </Typography>
                    ))}
                  </Box>
                </Box>

                {(selectedRecord.documentType === "Visit Summary" || selectedRecord.documentType === "Discharge Summary") && patient?.visits && patient.visits.length > 0 && (
                  <Box>
                    <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                      VISIT DETAILS
                    </Typography>
                    <Box sx={{ mt: 1.5, display: "grid", gap: 1.5 }}>
                      {patient.visits.slice(0, 1).map((visit: any) => (
                        <Box key={visit.id} sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)" }}>
                          {visit.reason && (
                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0f172a", mb: 0.5 }}>
                              {visit.reason}
                            </Typography>
                          )}
                          {visit.visit_date && (
                            <Typography variant="body2" sx={{ color: "#4b5563", fontSize: "0.85rem" }}>
                              Date: {formatDate(visit.visit_date)}
                            </Typography>
                          )}
                          {visit.doctor_name && (
                            <Typography variant="body2" sx={{ color: "#4b5563", fontSize: "0.85rem" }}>
                              Provider: {visit.doctor_name}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {selectedRecord.documentType === "Prescription" && patient?.prescriptions && (
                  <Box>
                    <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                      RELATED PRESCRIPTIONS
                    </Typography>
                    <Box sx={{ mt: 1.5, display: "grid", gap: 1.5 }}>
                      {patient.prescriptions.length === 0 ? (
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          No prescriptions found.
                        </Typography>
                      ) : (
                        patient.prescriptions.map((rx) => (
                          <Box
                            key={rx.id}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              bgcolor: "rgba(15,23,42,0.04)",
                              border: "1px solid rgba(15,23,42,0.08)",
                            }}
                          >
                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0f172a" }}>
                              {rx.medication || "Prescription"}
                            </Typography>
                            {rx.medications && rx.medications.length > 0 && (
                              <Box sx={{ mt: 1, display: "grid", gap: 1 }}>
                                {rx.medications.map((med) => (
                                  <Box key={med.id} sx={{ pl: 1, borderLeft: "2px solid rgba(15,23,42,0.1)" }}>
                                    <Typography variant="body2" fontWeight={600} sx={{ color: "#334155" }}>
                                      {med.medication_name}
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 0.5, mt: 0.25, flexWrap: "wrap" }}>
                                      {med.dosage_level && (
                                        <Chip size="small" label={med.dosage_level} sx={{ fontSize: "0.65rem", height: 20 }} />
                                      )}
                                      {med.dosage_amount && (
                                        <Chip size="small" label={med.dosage_amount} sx={{ fontSize: "0.65rem", height: 20 }} />
                                      )}
                                    </Box>
                                    {med.notes && (
                                      <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                                        {med.notes}
                                      </Typography>
                                    )}
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        ))
                      )}
                    </Box>
                  </Box>
                )}

                {selectedRecord.documentType === "Lab Result" && patient?.labResults && (
                  <Box>
                    <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                      LAB RESULTS
                    </Typography>
                    <Box sx={{ mt: 1.5, display: "grid", gap: 1.5 }}>
                      {patient.labResults.length === 0 ? (
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          No lab results found.
                        </Typography>
                      ) : (
                        patient.labResults.map((lab) => (
                          <Box
                            key={lab.id}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              bgcolor: "rgba(15,23,42,0.04)",
                              border: "1px solid rgba(15,23,42,0.08)",
                            }}
                          >
                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0f172a" }}>
                              {lab.test_name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#334155", mt: 0.25 }}>
                              {lab.result}
                            </Typography>
                            {lab.date && (
                              <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                                {formatDate(lab.date)}
                              </Typography>
                            )}
                          </Box>
                        ))
                      )}
                    </Box>
                  </Box>
                )}

                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    METADATA
                  </Typography>
                  <Box sx={{ mt: 1.5, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                        Provider
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 600 }}>
                        {selectedRecord.provider}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                        Status
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 600 }}>
                        {selectedRecord.status}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                        Date
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 600 }}>
                        {selectedRecord.date}
                      </Typography>
                    </Box>
                    {selectedRecord.time && (
                      <Box>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                          Time
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 600 }}>
                          {selectedRecord.time}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {selectedRecord.fileContent && (
                  <Box>
                    <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                      ATTACHMENT
                    </Typography>
                    <Box sx={{ mt: 1.5, display: "grid", gap: 1.5 }}>
                      {(selectedRecord.fileMimeType || "").toLowerCase().includes("pdf") ? (
                        <Box
                          sx={{
                            borderRadius: 2,
                            overflow: "hidden",
                            border: "1px solid rgba(15,23,42,0.12)",
                            bgcolor: "rgba(15,23,42,0.02)",
                          }}
                        >
                          <Box
                            component="iframe"
                            title={selectedRecord.fileName || "PDF preview"}
                            src={getStoredFileHref(
                              selectedRecord.fileContent || "",
                              selectedRecord.fileMimeType || "application/pdf",
                            )}
                            sx={{
                              width: "100%",
                              height: { xs: 360, md: 520 },
                              border: 0,
                            }}
                          />
                        </Box>
                      ) : (selectedRecord.fileMimeType || "").toLowerCase().startsWith("image/") ? (
                        <Box
                          component="img"
                          alt={selectedRecord.fileName || "Attachment preview"}
                          src={getStoredFileHref(
                            selectedRecord.fileContent || "",
                            selectedRecord.fileMimeType || "image/*",
                          )}
                          sx={{
                            width: "100%",
                            maxHeight: { xs: 340, md: 460 },
                            objectFit: "contain",
                            borderRadius: 2,
                            border: "1px solid rgba(15,23,42,0.12)",
                            bgcolor: "rgba(15,23,42,0.02)",
                          }}
                        />
                      ) : null}
                      <Button
                        variant="contained"
                        startIcon={<Download size={18} />}
                        onClick={() =>
                          downloadStoredFile(
                            selectedRecord.fileName || "record-file",
                            selectedRecord.fileMimeType || "application/octet-stream",
                            selectedRecord.fileContent || "",
                          )
                        }
                        sx={{
                          borderRadius: 999,
                          bgcolor: selectedRecord.accent,
                          "&:hover": { bgcolor: selectedRecord.accent },
                        }}
                      >
                        Download {selectedRecord.fileName || "file"}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      <Dialog
        open={uploadReviewOpen}
        onClose={handleCancelUpload}
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
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a" }}>
              Review Document Upload
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
              {pendingUpload?.file.name}
            </Typography>
          </Box>
          <IconButton onClick={handleCancelUpload}>
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {pendingUpload?.parsedData && (
            <Box sx={{ display: "grid", gap: 2.5 }}>
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                  DETECTED TYPE
                </Typography>
                <Box sx={{ mt: 1.5 }}>
                  <Chip
                    label={pendingUpload.parsedData.type === "prescription" ? "Prescription" : pendingUpload.parsedData.type === "lab_result" ? "Lab Result" : pendingUpload.parsedData.type === "discharge_summary" ? "Discharge Summary" : pendingUpload.parsedData.type === "vaccination" ? "Vaccination" : pendingUpload.parsedData.type === "visit" ? "Visit Summary" : "Unknown"}
                    sx={{
                      bgcolor: pendingUpload.parsedData.type === "prescription" ? "rgba(59,130,246,0.12)" : pendingUpload.parsedData.type === "lab_result" ? "rgba(34,197,94,0.12)" : pendingUpload.parsedData.type === "vaccination" ? "rgba(236,72,153,0.12)" : pendingUpload.parsedData.type === "visit" ? "rgba(15,118,110,0.12)" : "rgba(15,23,42,0.08)",
                      color: pendingUpload.parsedData.type === "prescription" ? "#2563eb" : pendingUpload.parsedData.type === "lab_result" ? "#16a34a" : pendingUpload.parsedData.type === "vaccination" ? "#db2777" : pendingUpload.parsedData.type === "visit" ? "#0d9488" : "text.primary",
                      fontWeight: 700,
                    }}
                  />
                </Box>
              </Box>

              {pendingUpload.parsedData.medications && pendingUpload.parsedData.medications.length > 0 && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    EXTRACTED MEDICATIONS ({pendingUpload.parsedData.medications.length})
                  </Typography>
                  <Box sx={{ mt: 1.5, display: "grid", gap: 1 }}>
                    {pendingUpload.parsedData.medications.map((med: any, idx: number) => (
                      <Box key={idx} sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)" }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0f172a" }}>
                          {med.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#4b5563", fontSize: "0.85rem" }}>
                          {med.dosageAmount} • {med.frequency}
                        </Typography>
                        {med.instructions && (
                          <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                            {med.instructions}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {pendingUpload.parsedData.labResults && pendingUpload.parsedData.labResults.length > 0 && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    EXTRACTED LAB RESULTS ({pendingUpload.parsedData.labResults.length})
                  </Typography>
                  <Box sx={{ mt: 1.5, display: "grid", gap: 1 }}>
                    {pendingUpload.parsedData.labResults.map((lab: any, idx: number) => (
                      <Box key={idx} sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)" }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0f172a" }}>
                          {lab.testName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#4b5563", fontSize: "0.85rem" }}>
                          {lab.result}
                        </Typography>
                        {lab.referenceRange && (
                          <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                            Ref: {lab.referenceRange}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {pendingUpload.parsedData.vaccinations && pendingUpload.parsedData.vaccinations.length > 0 && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    EXTRACTED VACCINATIONS ({pendingUpload.parsedData.vaccinations.length})
                  </Typography>
                  <Box sx={{ mt: 1.5, display: "grid", gap: 1 }}>
                    {pendingUpload.parsedData.vaccinations.map((vaccine: any, idx: number) => (
                      <Box key={idx} sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)" }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0f172a" }}>
                          {vaccine.vaccineName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#4b5563", fontSize: "0.85rem" }}>
                          Date: {vaccine.date}
                        </Typography>
                        {vaccine.dose && (
                          <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                            Dose: {vaccine.dose}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {(pendingUpload.parsedData.visits?.[0] ?? pendingUpload.parsedData.visit) && (
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    EXTRACTED VISIT DETAILS
                  </Typography>
                  <Box sx={{ mt: 1.5, p: 2, borderRadius: 2, bgcolor: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)" }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0f172a", mb: 0.5 }}>
                      {(pendingUpload.parsedData.visits?.[0] ?? pendingUpload.parsedData.visit)?.reason || "Visit"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#4b5563", fontSize: "0.85rem" }}>
                      Date: {(pendingUpload.parsedData.visits?.[0] ?? pendingUpload.parsedData.visit)?.visitDate || "Not specified"}
                    </Typography>
                    {(pendingUpload.parsedData.visits?.[0] ?? pendingUpload.parsedData.visit)?.doctorName && (
                      <Typography variant="body2" sx={{ color: "#4b5563", fontSize: "0.85rem" }}>
                        Doctor: {(pendingUpload.parsedData.visits?.[0] ?? pendingUpload.parsedData.visit)?.doctorName}
                      </Typography>
                    )}
                    {(pendingUpload.parsedData.visits?.[0] ?? pendingUpload.parsedData.visit)?.doctorSpecialty && (
                      <Typography variant="body2" sx={{ color: "#4b5563", fontSize: "0.85rem" }}>
                        Specialty: {(pendingUpload.parsedData.visits?.[0] ?? pendingUpload.parsedData.visit)?.doctorSpecialty}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {pendingUpload.parsedData.medications.length === 0 && pendingUpload.parsedData.labResults.length === 0 && (!pendingUpload.parsedData.vaccinations || pendingUpload.parsedData.vaccinations.length === 0) && !(pendingUpload.parsedData.visits?.[0] ?? pendingUpload.parsedData.visit) && (
                <Alert severity="info">
                  No structured data was extracted from this document. It will be saved as a general document.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCancelUpload} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleConfirmUpload} variant="contained" sx={{ bgcolor: "#22c55e", "&:hover": { bgcolor: "#16a34a" } }}>
            Confirm Upload
          </Button>
        </DialogActions>
      </Dialog>

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
                  {["All", "Visit Summary", "Prescription", "Lab Result", "Diagnosis", "Patient Document", "Vaccination"].map((option) => (
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

          <Box
            sx={{
              borderRadius: 5,
              overflow: "hidden",
              border: "1px solid rgba(15,23,42,0.07)",
              boxShadow: "0 28px 50px rgba(15,23,42,0.06)",
              background: "#fff",
            }}
          >
            {/* Header */}
            <Box
              sx={{
                px: 4,
                py: 3,
                borderBottom: "1px solid rgba(15,23,42,0.07)",
                background: "linear-gradient(105deg, #f8fffd 0%, #f0f9ff 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{ letterSpacing: "0.14em", color: "#00b894", fontWeight: 800, display: "block" }}
                >
                  Record Flow
                </Typography>
                <Typography variant="h5" fontWeight={900} sx={{ color: "#0f172a", mt: 0.3, lineHeight: 1.1 }}>
                  Chronological timeline
                </Typography>
              </Box>
              <Chip
                label={`${filteredRecords.length} event${filteredRecords.length === 1 ? "" : "s"}`}
                sx={{
                  bgcolor: "rgba(0,212,170,0.1)",
                  color: "#007a63",
                  fontWeight: 800,
                  border: "1px solid rgba(0,212,170,0.2)",
                }}
              />
            </Box>

            {/* Timeline body */}
            <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
              {groupedRecords.length === 0 ? (
                <Alert severity="info">No records match the current filters.</Alert>
              ) : (
                <Box sx={{ display: "grid", gap: 5 }}>
                  {groupedRecords.map((group) => (
                    <Box key={group.label}>

                      {/* Month separator */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
                        <Box sx={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(15,23,42,0.1))" }} />
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.25,
                            px: 2,
                            py: 0.75,
                            borderRadius: 99,
                            bgcolor: "#f8fafc",
                            border: "1px solid rgba(15,23,42,0.09)",
                          }}
                        >
                          <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: "#334155", letterSpacing: "0.04em" }}>
                            {group.label}
                          </Typography>
                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              borderRadius: "50%",
                              bgcolor: "rgba(15,23,42,0.25)",
                            }}
                          />
                          <Typography sx={{ fontWeight: 600, fontSize: "0.72rem", color: "#94a3b8" }}>
                            {group.items.length} record{group.items.length === 1 ? "" : "s"}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(15,23,42,0.1), transparent)" }} />
                      </Box>

                      {/* Alternating items */}
                      <Box sx={{ position: "relative" }}>

                        {/* Desktop spine */}
                        <Box
                          sx={{
                            display: { xs: "none", md: "block" },
                            position: "absolute",
                            left: "50%",
                            top: 28,
                            bottom: 28,
                            width: 2,
                            transform: "translateX(-50%)",
                            background: "linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.1) 6%, rgba(15,23,42,0.1) 94%, transparent 100%)",
                            pointerEvents: "none",
                          }}
                        />

                        <Box sx={{ display: "grid", gap: 3 }}>
                          {group.items.map((record, idx) => {
                            const IconCmp = record.icon;
                            const isLeft = idx % 2 !== 0;

                            /* ── shared card body ── */
                            const cardBody = (side: "left" | "right") => (
                              <Box
                                onClick={() => handleRecordClick(record)}
                                sx={{
                                  borderRadius: "14px",
                                  border: "1px solid rgba(15,23,42,0.07)",
                                  background: "#fff",
                                  boxShadow: "0 4px 24px rgba(15,23,42,0.05), 0 1px 4px rgba(15,23,42,0.04)",
                                  overflow: "hidden",
                                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                  cursor: "pointer",
                                  "&:hover": {
                                    transform: "translateY(-3px)",
                                    boxShadow: `0 16px 48px rgba(15,23,42,0.1), 0 0 0 1px ${record.accent}22`,
                                  },
                                  ...(side === "right"
                                    ? { borderLeft: `3px solid ${record.accent}` }
                                    : { borderRight: `3px solid ${record.accent}` }),
                                }}
                              >
                                {/* Accent header strip */}
                                <Box
                                  sx={{
                                    px: 2.5,
                                    py: 1.5,
                                    background: record.surface,
                                    borderBottom: `1px solid ${record.accent}22`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: 1,
                                  }}
                                >
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                    <Chip
                                      label={record.type}
                                      size="small"
                                      sx={{
                                        bgcolor: `${record.accent}22`,
                                        color: record.accent,
                                        fontWeight: 800,
                                        fontSize: "0.67rem",
                                        height: 22,
                                        border: `1px solid ${record.accent}33`,
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      sx={{ color: record.accent, fontWeight: 700, opacity: 0.8, fontSize: "0.7rem" }}
                                    >
                                      {record.provider}
                                    </Typography>
                                  </Box>
                                  <Chip
                                    label={record.status}
                                    size="small"
                                    sx={{
                                      bgcolor: "rgba(16,185,129,0.12)",
                                      color: "#059669",
                                      fontWeight: 800,
                                      fontSize: "0.65rem",
                                      height: 20,
                                    }}
                                  />
                                </Box>

                                {/* Card content */}
                                <Box sx={{ p: 2.5 }}>
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight={900}
                                    sx={{ color: "#0f172a", mb: 1, lineHeight: 1.3, fontSize: "0.95rem" }}
                                  >
                                    {record.category}
                                  </Typography>
                                  <Box sx={{ display: "grid", gap: 0.5, mb: record.fileContent ? 2 : 0 }}>
                                    {record.details.map((detail) => (
                                      <Typography
                                        key={detail}
                                        variant="body2"
                                        sx={{ color: "#64748b", lineHeight: 1.65, fontSize: "0.8rem" }}
                                      >
                                        {detail}
                                      </Typography>
                                    ))}
                                  </Box>
                                  {record.fileContent ? (
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={<Download size={13} />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadStoredFile(
                                          record.fileName || "record-file",
                                          record.fileMimeType || "application/octet-stream",
                                          record.fileContent || "",
                                        );
                                      }}
                                      sx={{
                                        borderRadius: 999,
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        px: 2,
                                        py: 0.6,
                                        borderColor: `${record.accent}55`,
                                        color: record.accent,
                                        "&:hover": { borderColor: record.accent, bgcolor: record.surface },
                                      }}
                                    >
                                      Download file
                                    </Button>
                                  ) : null}
                                </Box>
                              </Box>
                            );

                            return (
                              <Box key={record.id}>
                                {/* ── MOBILE layout ── */}
                                <Box sx={{ display: { xs: "flex", md: "none" }, gap: 2, alignItems: "flex-start" }}>
                                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, pt: 0.5 }}>
                                    <Box
                                      sx={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: "50%",
                                        bgcolor: record.accent,
                                        display: "grid",
                                        placeItems: "center",
                                        border: "3px solid #fff",
                                        boxShadow: `0 6px 20px ${record.accent}44`,
                                        flexShrink: 0,
                                      }}
                                    >
                                      <IconCmp size={15} color="#fff" />
                                    </Box>
                                    <Typography
                                      sx={{
                                        mt: 0.75,
                                        fontSize: "0.6rem",
                                        fontWeight: 800,
                                        color: record.accent,
                                        textAlign: "center",
                                        lineHeight: 1.3,
                                        maxWidth: 48,
                                      }}
                                    >
                                      {record.date}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>{cardBody("right")}</Box>
                                </Box>

                                {/* ── DESKTOP alternating layout ── */}
                                <Box
                                  sx={{
                                    display: { xs: "none", md: "grid" },
                                    gridTemplateColumns: "1fr 72px 1fr",
                                    alignItems: "center",
                                    gap: 0,
                                  }}
                                >
                                  {/* Left slot */}
                                  <Box sx={{ pr: 2.5 }}>
                                    {isLeft ? cardBody("left") : null}
                                  </Box>

                                  {/* Center node */}
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      zIndex: 1,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: "50%",
                                        bgcolor: record.accent,
                                        display: "grid",
                                        placeItems: "center",
                                        border: "4px solid #fff",
                                        boxShadow: `0 0 0 3px ${record.accent}22, 0 8px 28px ${record.accent}44`,
                                        flexShrink: 0,
                                      }}
                                    >
                                      <IconCmp size={18} color="#fff" />
                                    </Box>
                                    <Typography
                                      sx={{
                                        mt: 1,
                                        fontSize: "0.6rem",
                                        fontWeight: 800,
                                        color: record.accent,
                                        textAlign: "center",
                                        lineHeight: 1.35,
                                        letterSpacing: "0.01em",
                                      }}
                                    >
                                      {record.date}
                                      {record.time ? (
                                        <>
                                          {"\n"}
                                          <Box component="span" sx={{ display: "block", color: "#94a3b8", fontWeight: 600 }}>
                                            {record.time}
                                          </Box>
                                        </>
                                      ) : null}
                                    </Typography>
                                  </Box>

                                  {/* Right slot */}
                                  <Box sx={{ pl: 2.5 }}>
                                    {!isLeft ? cardBody("right") : null}
                                  </Box>
                                </Box>
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
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
