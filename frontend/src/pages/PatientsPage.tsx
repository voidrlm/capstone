import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
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
  ArrowLeft,
  Edit2,
  Save,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { RelatedPatientSections } from "../components/patient/RelatedPatientSections";
import { MedicationSection } from "../components/patient/MedicationSection";
import { PatientFormDialog } from "../components/patient/PatientFormDialog";
import {
  type Patient,
  type PatientDetail,
  type DrugSuggestion,
  type PatientAccessSearchResult,
  type MedicationInteractionResult,
  type RelatedPage,
  type PatientForm,
  type MedicationDialogForm,
} from "../types/patient";
import {
  getAuthHeaders,
  calculateAge,
  updateListItem,
  compactSpacedChunks,
  normalizePhraseSpacing,
  downloadStoredFile,
  readFileAsDataUrl,
} from "../lib/helpers";
import { extractPdfText } from "../lib/pdfParser";
import {
  parsePrescriptionText,
  parseLabResultText,
  parseDiagnosisText,
} from "../lib/textParser";
import {
  toForm,
  emptyForm,
  emptyMedicationForm,
  bottomSnackbarSx,
  relatedSectionSx,
} from "../lib/patientFormHelpers";
import PatientsListPanel from "./patients/PatientsListPanel";
import RequestPatientAccessCard from "./patients/RequestPatientAccessCard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
  },
});

export { toForm };

export default function PatientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [activePatientPage, setActivePatientPage] = useState<RelatedPage>("details");
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false);
  const [medicationForm, setMedicationForm] = useState<MedicationDialogForm>(emptyMedicationForm);
  const [medicationSuggestions, setMedicationSuggestions] = useState<DrugSuggestion[]>([]);
  const [medicationSearch, setMedicationSearch] = useState("");
  const [medicationLoading, setMedicationLoading] = useState(false);
  const [medicationInteractionLoading, setMedicationInteractionLoading] = useState(false);
  const [medicationInteractions, setMedicationInteractions] = useState<MedicationInteractionResult[]>([]);
  const [patientEmailSearch, setPatientEmailSearch] = useState("");
  const [requestSearchLoading, setRequestSearchLoading] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSearchResult, setRequestSearchResult] = useState<PatientAccessSearchResult | null>(null);
  const limit = 20;
  const selectedPatientId = searchParams.get("patientId");
  let userRole = "";
  try {
    const storedUser = localStorage.getItem("user");
    userRole = storedUser ? (JSON.parse(storedUser).role as string) : "";
  } catch {
    userRole = "";
  }
  const canRequestInsteadOfCreate = userRole === "doctor" || userRole === "nurse";
  const canDirectlyCreatePatients = !canRequestInsteadOfCreate;

  const applyFavoriteState = useCallback((patientId: string, isFavorite: boolean) => {
    setPatients((current) =>
      current.map((patient) => (patient.id === patientId ? { ...patient, is_favorite: isFavorite } : patient)),
    );
    setSelectedPatient((current) =>
      current && current.id === patientId ? { ...current, is_favorite: isFavorite } : current,
    );
  }, []);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String((page - 1) * limit) });
      if (search) params.set("search", search);
      const res = await fetch(`${API_URL}/api/patients?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load patients");
      const json = await res.json();
      const data = json.data || {};
      setPatients(data.patients || []);
      setTotal(data.total || 0);
    } catch {
      setError("Failed to load patients.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const toggleFavorite = useCallback(async (patientId: string, nextFavorite: boolean) => {
    applyFavoriteState(patientId, nextFavorite);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/patients/${patientId}/favorite`, {
        method: nextFavorite ? "POST" : "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error?.message || "Failed to update favorite");
      }
      setSuccess(nextFavorite ? "Patient added to favorites." : "Patient removed from favorites.");
      await fetchPatients();
    } catch (err) {
      applyFavoriteState(patientId, !nextFavorite);
      setError(err instanceof Error ? err.message : "Failed to update favorite.");
    }
  }, [applyFavoriteState, fetchPatients]);

  const handlePatientEmailSearch = useCallback(async () => {
    const email = patientEmailSearch.trim().toLowerCase();
    if (!email || !email.includes("@")) { setError("Enter a valid patient email."); return; }
    setRequestSearchLoading(true);
    setRequestSearchResult(null);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/patients/access-requests/search?email=${encodeURIComponent(email)}`, { headers: getAuthHeaders() });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || "Failed to search patient by email");
      setRequestSearchResult(json?.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search patient by email.");
    } finally {
      setRequestSearchLoading(false);
    }
  }, [patientEmailSearch]);

  const handleRequestAccess = useCallback(async () => {
    const email = requestSearchResult?.email || patientEmailSearch.trim().toLowerCase();
    if (!email) return;
    setRequestSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/patients/access-requests`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || "Failed to send access request");
      setSuccess(json?.data?.message || "Access request sent.");
      setRequestSearchResult((current) => (current ? { ...current, requestStatus: "pending" } : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send access request.");
    } finally {
      setRequestSubmitting(false);
    }
  }, [patientEmailSearch, requestSearchResult]);

  useEffect(() => { void fetchPatients(); }, [fetchPatients]);

  useEffect(() => {
    if (!selectedPatientId) return;
    if (selectedPatient?.id === selectedPatientId) return;
    void viewPatient(selectedPatientId, false);
  }, [selectedPatientId]);

  useEffect(() => {
    if (!medicationDialogOpen) { setMedicationSuggestions([]); return; }
    const query = medicationSearch.trim();
    if (query.length < 2) { setMedicationSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/drugs/autocomplete?q=${encodeURIComponent(query)}`);
        if (!res.ok) return;
        const json = await res.json();
        setMedicationSuggestions(json.data?.suggestions || []);
      } catch {
        setMedicationSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [medicationDialogOpen, medicationSearch]);

  const viewPatient = async (id: string, edit = false) => {
    setLoadingDetail(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/patients/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load patient");
      const json = await res.json();
      const detail = json.data || null;
      setSelectedPatient(detail);
      setForm(toForm(detail));
      setIsEditing(edit);
      setIsCreating(false);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("patientId", id);
      setSearchParams(nextParams, { replace: true });
    } catch {
      setError("Failed to load patient details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const startCreate = () => {
    setForm(emptyForm);
    setActivePatientPage("details");
    setIsCreating(true);
    setFormOpen(true);
    setError("");
  };

  const startEditDialog = () => {
    if (!selectedPatient) return;
    setForm(toForm(selectedPatient));
    setActivePatientPage("details");
    setIsCreating(false);
    setFormOpen(true);
    setError("");
  };

  const goBack = () => {
    setSelectedPatient(null);
    setActivePatientPage("details");
    setForm(emptyForm);
    setIsEditing(false);
    setIsCreating(false);
    setLoadingDetail(false);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("patientId");
    setSearchParams(nextParams, { replace: true });
  };

  const openMedicationDialog = (medication?: PatientDetail["medications"][number]) => {
    if (!selectedPatient) return;
    if (medication) {
      setMedicationForm({
        id: medication.id,
        selectedDrug: medication.drug_id ? { id: medication.drug_id, name: medication.drug_name } : null,
        search: "",
        suggestions: [],
        dosageLevel: medication.dosage_level || "medium",
        dosageAmount: medication.dosage_amount || "",
        startDate: medication.start_date ? medication.start_date.split("T")[0] : "",
        endDate: medication.end_date ? medication.end_date.split("T")[0] : "",
        notes: medication.notes || "",
      });
      setMedicationSearch(medication.drug_name || "");
    } else {
      setMedicationForm(emptyMedicationForm);
      setMedicationSearch("");
    }
    setMedicationInteractions([]);
    setMedicationDialogOpen(true);
    setIsEditing(true);
  };

  const closeMedicationDialog = () => {
    setMedicationDialogOpen(false);
    setMedicationForm(emptyMedicationForm);
    setMedicationSearch("");
    setMedicationSuggestions([]);
    setMedicationInteractions([]);
  };

  const handleSubmit = async (): Promise<boolean> => {
    if (!form.name.trim()) { setError("Patient name is required."); return false; }
    if (!form.dateOfBirth) { setError("Date of birth is required."); return false; }
    if (isCreating) {
      if (!form.email.trim() || !form.email.includes("@")) { setError("A valid email is required."); return false; }
      if (form.password.length < 8) { setError("Password must be at least 8 characters."); return false; }
      if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return false; }
    }

    setFormLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        ageGroup: form.ageGroup || undefined,
        medicalHistory: form.medicalHistory ? form.medicalHistory.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        visits: form.visits.map((visit) => ({
          visitDate: visit.visitDate || undefined,
          reason: visit.reason || undefined,
          doctor: visit.doctorName || visit.doctorSpecialty ? { name: visit.doctorName || undefined, specialty: visit.doctorSpecialty || undefined } : undefined,
        })),
        labResults: form.labResults.map((lab) => ({
          testName: lab.testName || undefined,
          result: lab.result || undefined,
          date: lab.date || undefined,
          uploadedFileName: lab.uploadedFileName || undefined,
          uploadedFileMimeType: lab.uploadedFileMimeType || undefined,
          uploadedFileContent: lab.uploadedFileContent || undefined,
        })),
        diagnoses: form.diagnoses.map((diagnosis) => ({
          diagnosisName: diagnosis.diagnosisName || undefined,
          date: diagnosis.date || undefined,
          uploadedFileName: diagnosis.uploadedFileName || undefined,
          uploadedFileMimeType: diagnosis.uploadedFileMimeType || undefined,
          uploadedFileContent: diagnosis.uploadedFileContent || undefined,
        })),
        allergies: form.allergies.map((allergy) => ({ allergyName: allergy.allergyName || undefined })),
        prescriptions: form.prescriptions.map((prescription) => ({
          medications: prescription.medications
            .filter((item) => item.selectedDrug?.id || item.search.trim())
            .map((item) => ({
              drugId: item.selectedDrug?.id || undefined,
              medicationName: item.selectedDrug?.name || item.search.trim() || undefined,
              dosageLevel: item.dosageLevel || undefined,
              dosageAmount: item.dosageAmount || undefined,
              startDate: item.startDate || undefined,
              endDate: item.endDate || undefined,
              notes: item.notes || undefined,
            })),
          prescriptionDate: prescription.prescriptionDate || undefined,
          instructions: prescription.instructions || undefined,
          uploadedFileName: prescription.uploadedFileName || undefined,
          approvalStatus: prescription.approvalStatus || "draft",
          doctor: prescription.doctorName || prescription.doctorSpecialty
            ? { name: prescription.doctorName || undefined, specialty: prescription.doctorSpecialty || undefined }
            : undefined,
        })),
        ...(isCreating ? { email: form.email.trim(), phone: form.phone.trim() || undefined, password: form.password } : {}),
      };

      const url = isCreating ? `${API_URL}/api/patients` : `${API_URL}/api/patients/${selectedPatient?.id}`;
      const method = isCreating ? "POST" : "PUT";
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(body) });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "Failed to save patient");
      }

      const json = await res.json();
      const savedDetail = json.data || null;
      setSuccess(isCreating ? "Patient created." : "Patient updated.");
      setTimeout(() => setSuccess(""), 3000);
      await fetchPatients();

      if (isCreating) {
        setFormOpen(false);
        setIsCreating(false);
        setForm(emptyForm);
      } else if (savedDetail) {
        setSelectedPatient(savedDetail);
        setForm(toForm(savedDetail));
        setIsEditing(false);
        setFormOpen(false);
      } else if (selectedPatient) {
        await viewPatient(selectedPatient.id, false);
        setFormOpen(false);
      }
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save patient.");
      return false;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`${API_URL}/api/patients/${deleteId}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to delete patient");
      setSuccess("Patient deleted.");
      setDeleteId(null);
      if (selectedPatient?.id === deleteId) goBack();
      await fetchPatients();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to delete patient.");
    }
  };

  const handleMedicationSubmit = async () => {
    if (!selectedPatient) return;
    if (!medicationForm.selectedDrug?.id) { setError("Please select a medication from the drug list."); return; }
    if (!medicationForm.startDate) { setError("Medication start date is required."); return; }

    setMedicationLoading(true);
    setError("");
    try {
      const url = medicationForm.id
        ? `${API_URL}/api/patients/${selectedPatient.id}/medications/${medicationForm.id}`
        : `${API_URL}/api/patients/${selectedPatient.id}/medications`;
      const method = medicationForm.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          drugId: medicationForm.selectedDrug.id,
          dosageLevel: medicationForm.dosageLevel || undefined,
          dosageAmount: medicationForm.dosageAmount || undefined,
          startDate: medicationForm.startDate,
          endDate: medicationForm.endDate || undefined,
          notes: medicationForm.notes || undefined,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "Failed to save medication");
      }
      setSuccess(medicationForm.id ? "Medication updated." : "Medication added.");
      closeMedicationDialog();
      await viewPatient(selectedPatient.id, false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save medication.");
    } finally {
      setMedicationLoading(false);
    }
  };

  const handleMedicationDelete = async (medicationId: string) => {
    if (!selectedPatient) return;
    try {
      const res = await fetch(`${API_URL}/api/patients/${selectedPatient.id}/medications/${medicationId}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "Failed to delete medication");
      }
      setSuccess("Medication deleted.");
      await viewPatient(selectedPatient.id, false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete medication.");
    }
  };

  const handleMedicationInteractionCheck = async () => {
    if (!selectedPatient || !medicationForm.selectedDrug?.id) { setError("Select a medication first."); return; }
    const currentDrugIds = (selectedPatient.medications || [])
      .filter((med) => med.drug_id && (!medicationForm.id || med.id !== medicationForm.id))
      .map((med) => med.drug_id);
    const drugIds = Array.from(new Set([...currentDrugIds, medicationForm.selectedDrug.id]));
    if (drugIds.length < 2) { setMedicationInteractions([]); setError("Add at least one other medication for this patient to check interactions."); return; }

    setMedicationInteractionLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/drugs/check-interactions`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ drugIds }) });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "Failed to check interactions");
      }
      const json = await res.json();
      setMedicationInteractions(json.data?.interactions || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to check interactions.");
    } finally {
      setMedicationInteractionLoading(false);
    }
  };

  const handlePrescriptionSubmit = async (prescriptionIndex: number, forcedApprovalStatus?: "draft" | "approved") => {
    if (!selectedPatient) return false;
    const prescription = form.prescriptions[prescriptionIndex];
    if (!prescription) return false;
    if (!prescription.prescriptionDate) { setError("Prescription date is required."); return false; }

    const medications = prescription.medications
      .filter((item) => item.selectedDrug?.id || item.search.trim())
      .map((item) => ({
        drugId: item.selectedDrug?.id || undefined,
        medicationName: item.selectedDrug?.name || item.search.trim() || undefined,
        dosageLevel: item.dosageLevel || undefined,
        dosageAmount: item.dosageAmount || undefined,
        startDate: item.startDate || undefined,
        endDate: item.endDate || undefined,
        notes: item.notes || undefined,
      }));

    setFormLoading(true);
    setError("");
    try {
      const url = prescription.id
        ? `${API_URL}/api/patients/${selectedPatient.id}/prescriptions/${prescription.id}`
        : `${API_URL}/api/patients/${selectedPatient.id}/prescriptions`;
      const method = prescription.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          medications,
          prescriptionDate: prescription.prescriptionDate,
          instructions: prescription.instructions || undefined,
          uploadedFileName: prescription.uploadedFileName || undefined,
          approvalStatus: forcedApprovalStatus || prescription.approvalStatus || "draft",
          doctor: prescription.doctorName || prescription.doctorSpecialty
            ? { name: prescription.doctorName || undefined, specialty: prescription.doctorSpecialty || undefined }
            : undefined,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "Failed to save prescription");
      }
      setSuccess(prescription.id ? "Prescription updated." : "Prescription added.");
      await fetchPatients();
      await viewPatient(selectedPatient.id, false);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save prescription.");
      return false;
    } finally {
      setFormLoading(false);
    }
  };

  const handlePrescriptionDelete = async (prescriptionIndex: number) => {
    if (!selectedPatient) return;
    const prescription = form.prescriptions[prescriptionIndex];
    if (!prescription?.id) {
      setForm((current) => ({ ...current, prescriptions: current.prescriptions.filter((_, i) => i !== prescriptionIndex) }));
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/patients/${selectedPatient.id}/prescriptions/${prescription.id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "Failed to delete prescription");
      }
      setSuccess("Prescription deleted.");
      await fetchPatients();
      await viewPatient(selectedPatient.id, false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete prescription.");
    }
  };

  const resolveDrugSuggestion = async (query: string): Promise<DrugSuggestion | null> => {
    const safeQuery = normalizePhraseSpacing(query.split(",")[0] || query).trim();
    if (!safeQuery) return null;
    try {
      const res = await fetch(`${API_URL}/api/drugs/autocomplete?q=${encodeURIComponent(safeQuery)}`);
      if (!res.ok) return null;
      const json = await res.json();
      const suggestions: DrugSuggestion[] = json.data?.suggestions || [];
      return suggestions[0] || null;
    } catch {
      return null;
    }
  };

  const handlePrescriptionFileUpload = async (prescriptionIndex: number, file: File) => {
    try {
      const rawText =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
          ? await extractPdfText(file)
          : compactSpacedChunks(await file.text());
      const parsed = parsePrescriptionText(rawText);
      const nextPrescriptionDate = parsed.prescriptionDate || form.prescriptions[prescriptionIndex]?.prescriptionDate || "";
      const medications = await Promise.all(
        parsed.medications.map(async (medication) => {
          const selectedDrug = await resolveDrugSuggestion(medication.medicationName);
          return {
            selectedDrug,
            search: selectedDrug?.name || medication.medicationName,
            suggestions: [],
            dosageLevel: "medium",
            dosageAmount: medication.dosageAmount,
            startDate: nextPrescriptionDate,
            endDate: medication.endDate,
            notes: medication.notes,
          };
        }),
      );
      setForm((current) => ({
        ...current,
        prescriptions: current.prescriptions.map((prescription, currentIndex) =>
          currentIndex === prescriptionIndex
            ? {
                ...prescription,
                uploadedFileName: file.name,
                prescriptionDate: nextPrescriptionDate,
                doctorName: parsed.doctorName || prescription.doctorName,
                doctorSpecialty: parsed.doctorSpecialty || prescription.doctorSpecialty,
                medications: medications.length > 0 ? medications : prescription.medications,
              }
            : prescription,
        ),
      }));
      setSuccess("Prescription file parsed.");
    } catch {
      setError("Failed to read prescription file.");
    }
  };

  const handleLabResultFileUpload = async (labIndex: number, file: File) => {
    try {
      const [dataUrl, rawText] = await Promise.all([
        readFileAsDataUrl(file),
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
          ? extractPdfText(file)
          : file.text().then((value) => compactSpacedChunks(value)),
      ]);
      const parsed = parseLabResultText(rawText);
      const labResult = parsed[0] || {};
      setForm((current) => ({
        ...current,
        labResults: updateListItem(current.labResults, labIndex, {
          uploadedFileName: file.name,
          uploadedFileMimeType: file.type || "application/octet-stream",
          uploadedFileContent: dataUrl,
          testName: labResult.testName || current.labResults[labIndex]?.testName || "",
          result: labResult.result || current.labResults[labIndex]?.result || "",
          date: labResult.date || current.labResults[labIndex]?.date || "",
        }),
      }));
      setSuccess("Lab report parsed.");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to read lab result file.");
    }
  };

  const handleDiagnosisFileUpload = async (diagnosisIndex: number, file: File) => {
    try {
      const [dataUrl, rawText] = await Promise.all([
        readFileAsDataUrl(file),
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
          ? extractPdfText(file)
          : file.text().then((value) => compactSpacedChunks(value)),
      ]);
      const parsed = parseDiagnosisText(rawText);
      const diagnosis = parsed[0] || {};
      setForm((current) => ({
        ...current,
        diagnoses: updateListItem(current.diagnoses, diagnosisIndex, {
          uploadedFileName: file.name,
          uploadedFileMimeType: file.type || "application/octet-stream",
          uploadedFileContent: dataUrl,
          diagnosisName: diagnosis.diagnosisName || current.diagnoses[diagnosisIndex]?.diagnosisName || "",
          date: diagnosis.date || current.diagnoses[diagnosisIndex]?.date || "",
        }),
      }));
      setSuccess("Diagnosis file parsed.");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to read diagnosis file.");
    }
  };

  if (selectedPatient) {
    const currentAge = calculateAge(form.dateOfBirth || selectedPatient?.date_of_birth);

    return (
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box>
            <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError("")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} sx={bottomSnackbarSx}>
              <Alert onClose={() => setError("")} severity="error" variant="filled" sx={{ width: "100%" }}>{error}</Alert>
            </Snackbar>
            <Snackbar open={!!success} autoHideDuration={3500} onClose={() => setSuccess("")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} sx={bottomSnackbarSx}>
              <Alert onClose={() => setSuccess("")} severity="success" variant="filled" sx={{ width: "100%" }}>{success}</Alert>
            </Snackbar>

            <Card sx={{ borderRadius: 4 }}>
              <Box sx={{ p: { xs: 3, sm: 4 }, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                <Box>
                  <Button variant="text" startIcon={<ArrowLeft size={16} />} onClick={goBack} sx={{ px: 0, mb: 1, color: "#00d4aa" }}>
                    Go back
                  </Button>
                  <Typography variant="h4" fontWeight={800}>{form.name || "Patient Record"}</Typography>
                  <Typography variant="body1" color="text.secondary">Full patient form view with basic information and medications.</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {selectedPatient ? (
                    <IconButton
                      onClick={() => void toggleFavorite(selectedPatient.id, !selectedPatient.is_favorite)}
                      title={selectedPatient.is_favorite ? "Remove favorite" : "Add favorite"}
                      sx={{ color: selectedPatient.is_favorite ? "#f59e0b" : "#94a3b8", border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                    >
                      <Star size={18} fill={selectedPatient.is_favorite ? "currentColor" : "none"} />
                    </IconButton>
                  ) : null}
                  {!isEditing ? (
                    <Button variant="outlined" startIcon={<Edit2 size={16} />} onClick={startEditDialog}>Edit</Button>
                  ) : null}
                  {selectedPatient ? (
                    <Button variant="outlined" color="error" startIcon={<Trash2 size={16} />} onClick={() => setDeleteId(selectedPatient.id)}>Delete</Button>
                  ) : null}
                  {isEditing ? (
                    <>
                      <Button variant="text" startIcon={<X size={16} />} onClick={() => { if (selectedPatient) setForm(toForm(selectedPatient)); setIsEditing(false); setError(""); }}>
                        Cancel
                      </Button>
                      <Button variant="contained" startIcon={<Save size={16} />} onClick={handleSubmit} disabled={formLoading} color="primary">
                        {formLoading ? <CircularProgress size={18} color="inherit" /> : "Save"}
                      </Button>
                    </>
                  ) : null}
                </Box>
              </Box>

              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                {loadingDetail ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : selectedPatient ? (
                  <RelatedPatientSections
                    form={form}
                    setForm={setForm}
                    editable={isEditing}
                    activePage={activePatientPage}
                    setActivePage={setActivePatientPage}
                    onStartEdit={() => setIsEditing(true)}
                    onSave={handleSubmit}
                    saving={formLoading}
                    existingMedicationDrugIds={(selectedPatient.medications || []).map((med) => med.drug_id).filter(Boolean)}
                    onSavePrescription={handlePrescriptionSubmit}
                    onDeletePrescription={handlePrescriptionDelete}
                    patientDetail={selectedPatient}
                    onUploadPrescriptionFile={handlePrescriptionFileUpload}
                    onUploadLabResultFile={handleLabResultFileUpload}
                    onUploadDiagnosisFile={handleDiagnosisFileUpload}
                    onError={setError}
                    detailsSection={
                      <Card variant="outlined" sx={relatedSectionSx}>
                        <CardContent>
                          <Grid container spacing={2.5}>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <TextField fullWidth label="Patient ID" value={selectedPatient?.id || "Will be generated after create"} disabled />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <TextField fullWidth label="Full Name" value={form.name} disabled />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <DatePicker
                                label="Date of Birth"
                                value={form.dateOfBirth ? dayjs(form.dateOfBirth) : null}
                                disabled
                                format="MM/DD/YYYY"
                                slotProps={{
                                  textField: { fullWidth: true, size: "small" },
                                  popper: { sx: { "& .MuiIconButton-root": { color: "#333" } } },
                                }}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <TextField fullWidth label="Age" value={currentAge ?? "-"} disabled />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <TextField fullWidth label="Age Group" value={form.ageGroup || "Auto-detect"} disabled />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <TextField fullWidth label="Gender" value={form.gender ? form.gender.replace(/_/g, " ") : "Not set"} disabled />
                            </Grid>
                            <Grid size={12}>
                              <TextField fullWidth multiline minRows={3} label="Medical History" value={form.medicalHistory || "-"} disabled />
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    }
                    medicationsSection={
                      <MedicationSection
                        selectedPatient={selectedPatient}
                        medicationDialogOpen={medicationDialogOpen}
                        medicationForm={medicationForm}
                        medicationSearch={medicationSearch}
                        medicationSuggestions={medicationSuggestions}
                        medicationInteractions={medicationInteractions}
                        medicationInteractionLoading={medicationInteractionLoading}
                        medicationLoading={medicationLoading}
                        openMedicationDialog={openMedicationDialog}
                        closeMedicationDialog={closeMedicationDialog}
                        handleMedicationInteractionCheck={handleMedicationInteractionCheck}
                        handleMedicationSubmit={handleMedicationSubmit}
                        setMedicationForm={setMedicationForm}
                        setMedicationSearch={setMedicationSearch}
                        setMedicationSuggestions={setMedicationSuggestions}
                        handleMedicationDelete={handleMedicationDelete}
                      />
                    }
                  />
                ) : null}
              </CardContent>
            </Card>

            <Snackbar open={!!deleteId && !selectedPatient} autoHideDuration={1} onClose={() => setDeleteId(null)} />
          </Box>
        </LocalizationProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box>
          <Box sx={{ mb: 4, p: { xs: 3, sm: 4 }, borderRadius: 4, background: "linear-gradient(135deg, #04080f 0%, #0a1628 55%, #0c2820 100%)", color: "white", position: "relative", overflow: "hidden", display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
            <Box sx={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.08)" }} />
            <Box sx={{ position: "absolute", bottom: -60, right: 100, width: 150, height: 150, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.05)" }} />
            <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(0,212,170,0.07) 0%, transparent 70%)" }} />
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Sparkles size={18} color="#00d4aa" />
                <Chip label="Patient Management" size="small" sx={{ bgcolor: "rgba(0,212,170,0.18)", color: "#00d4aa", fontWeight: 600, height: 24, fontSize: "0.7rem" }} />
              </Box>
              <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>Patients</Typography>
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)" }}>
                {canRequestInsteadOfCreate ? "Search for a patient by email and request organization access once they approve." : "Manage patient profiles and their medications"}
              </Typography>
            </Box>
            {canDirectlyCreatePatients ? (
              <Button variant="contained" startIcon={<Sparkles size={18} />} onClick={startCreate} sx={{ position: "relative", zIndex: 1, bgcolor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>
                Add Patient
              </Button>
            ) : null}
          </Box>

          <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError("")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} sx={bottomSnackbarSx}>
            <Alert onClose={() => setError("")} severity="error" variant="filled" sx={{ width: "100%" }}>{error}</Alert>
          </Snackbar>
          <Snackbar open={!!success} autoHideDuration={3500} onClose={() => setSuccess("")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} sx={bottomSnackbarSx}>
            <Alert onClose={() => setSuccess("")} severity="success" variant="filled" sx={{ width: "100%" }}>{success}</Alert>
          </Snackbar>

          {canRequestInsteadOfCreate ? (
            <RequestPatientAccessCard
              patientEmailSearch={patientEmailSearch}
              requestSearchLoading={requestSearchLoading}
              requestSubmitting={requestSubmitting}
              requestSearchResult={requestSearchResult}
              setPatientEmailSearch={setPatientEmailSearch}
              onSearch={() => void handlePatientEmailSearch()}
              onRequestAccess={() => void handleRequestAccess()}
            />
          ) : null}

          <PatientsListPanel
            search={search}
            setSearch={setSearch}
            setPage={setPage}
            loading={loading}
            patients={patients}
            canRequestInsteadOfCreate={canRequestInsteadOfCreate}
            onToggleFavorite={(patientId, nextFavorite) => void toggleFavorite(patientId, nextFavorite)}
            onViewPatient={viewPatient}
            onDeletePatient={setDeleteId}
            total={total}
            limit={limit}
            page={page}
          />

          <PatientFormDialog
            open={formOpen}
            isCreating={isCreating}
            form={form}
            setForm={setForm}
            loading={formLoading}
            onClose={() => {
              setFormOpen(false);
              setIsCreating(false);
              setForm(selectedPatient && !isCreating ? toForm(selectedPatient) : emptyForm);
            }}
            onSubmit={handleSubmit}
          />

          <Snackbar open={!!deleteId} onClose={() => setDeleteId(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} sx={bottomSnackbarSx}>
            <Alert
              severity="warning"
              variant="filled"
              action={
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button color="inherit" size="small" onClick={() => setDeleteId(null)}>Cancel</Button>
                  <Button color="inherit" size="small" onClick={handleDelete}>Delete</Button>
                </Box>
              }
            >
              Delete this patient record?
            </Alert>
          </Snackbar>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
