import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Backdrop,
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
  Grid,
  IconButton,
  Skeleton,
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
  Activity,
  AlertCircle,
  FileStack,
  FileText,
  Mail,
  Edit2,
  Pill,
  RotateCw,
  Save,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ManualEntryDialog } from "./ManualEntryDialog";
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
  readFileAsDataUrl,
} from "../lib/helpers";
import {
  toForm,
  emptyForm,
  emptyMedicationForm,
  bottomSnackbarSx,
  relatedSectionSx,
} from "../lib/patientFormHelpers";
import { API_URL } from "../lib/api";
import PatientsListPanel from "./patients/PatientsListPanel";
import RequestPatientAccessCard from "./patients/RequestPatientAccessCard";

const muiTheme = createTheme({ palette: { primary: { main: "#1976d2" } } });

export { toForm };

export default function PatientsPage() {
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchInput, setSearchInput] = useState("");
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
  const [requestSearchResult, setRequestSearchResult] = useState<PatientAccessSearchResult | null>(null);
  const [requestAccessLoading, setRequestAccessLoading] = useState(false);
  const [entryModeOpen, setEntryModeOpen] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<"lab_result" | "visit" | "vaccination" | "diagnosis" | "insurance" | "discharge" | "allergy" | "medication" | null>(null);
  const [uploadReviewOpen, setUploadReviewOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ file: File; parsedData: any } | null>(null);
  const [uploadConfirmLoading, setUploadConfirmLoading] = useState(false);
  const [uploadParseLoading, setUploadParseLoading] = useState(false);
  // Per-tab lazy loading
  const [loadedTabs, setLoadedTabs] = useState<Set<RelatedPage>>(new Set());
  const [tabLoading, setTabLoading] = useState<RelatedPage | null>(null);
  const limit = 20;
  const selectedPatientId = searchParams.get("patientId");
  let userRole = "";
  try {
    const storedUser = localStorage.getItem("user");
    userRole = storedUser ? (JSON.parse(storedUser).role as string) : "";
  } catch {
    userRole = "";
  }
  const canRequestPatientAccess = userRole === "doctor" || userRole === "nurse";
  const canDirectlyCreatePatients = userRole !== "patient";
  const canRequestInsteadOfCreate = canRequestPatientAccess && !canDirectlyCreatePatients;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

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
      const list = Array.isArray(json.data) ? json.data : json.data?.patients;
      setPatients(Array.isArray(list) ? list : []);
      setTotal(Number(json.total ?? json.data?.total ?? list?.length ?? 0));
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
      const raw = json?.data;
      setRequestSearchResult(raw ? {
        patientId: raw.patientId ?? raw.patient_id,
        patientUserId: raw.patientUserId ?? raw.patient_user_id ?? "",
        name: raw.name ?? raw.patient_name ?? "",
        email: raw.email ?? raw.patient_email ?? "",
        alreadyAccessible: raw.alreadyAccessible ?? raw.has_shared_organization ?? false,
        requestStatus: raw.requestStatus ?? raw.request_status ?? null,
      } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search patient by email.");
    } finally {
      setRequestSearchLoading(false);
    }
  }, [patientEmailSearch]);

  const handleRequestAccess = useCallback(async () => {
    if (!requestSearchResult?.patientId) return;
    setRequestAccessLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/patients/access-requests`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ patient_id: requestSearchResult.patientId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || "Failed to request access");
      setSuccess("Access request sent to patient successfully.");
      // Update search result to show pending status
      setRequestSearchResult((prev) => prev ? { ...prev, requestStatus: "pending" } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request access.");
    } finally {
      setRequestAccessLoading(false);
    }
  }, [requestSearchResult?.patientId]);

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

  const viewPatient = useCallback(async (id: string, edit = false) => {
    setLoadingDetail(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/patients/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load patient");
      const json = await res.json();
      const detail = json.data || null;
      // Strip tab data — each tab loads its own data lazily
      const basicDetail = detail ? {
        ...detail,
        medications: [],
        visits: [],
        labResults: [],
        diagnoses: [],
        allergies: [],
        prescriptions: [],
        vaccinations: [],
      } : null;
      setSelectedPatient(basicDetail);
      setForm(toForm(basicDetail ?? detail));
      setLoadedTabs(new Set());
      setIsEditing(edit);
      setIsCreating(false);
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set("patientId", id);
        return next;
      }, { replace: true });
    } catch {
      setError("Failed to load patient details.");
    } finally {
      setLoadingDetail(false);
    }
  }, [setSearchParams]);

  const refreshSelectedPatient = useCallback(async () => {
    if (!selectedPatient?.id) return;
    await viewPatient(selectedPatient.id, false);
  }, [selectedPatient?.id, viewPatient]);

  // Map from RelatedPage tab key to API endpoint segment
  const TAB_ENDPOINT: Partial<Record<RelatedPage, string>> = {
    medications: "medications",
    visits: "visits",
    labs: "lab-results",
    diagnoses: "diagnoses",
    allergies: "allergies",
    vaccinations: "vaccinations",
    prescriptions: "prescriptions",
  };

  // Fetch data for a single tab and merge it into selectedPatient + form
  const loadTabData = useCallback(async (tab: RelatedPage, patientId: string) => {
    const endpoint = TAB_ENDPOINT[tab];
    if (!endpoint) return; // "details" tab has no separate endpoint
    setTabLoading(tab);
    try {
      const res = await fetch(`${API_URL}/api/patients/${patientId}/${endpoint}`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const json = await res.json();
      const rows = json.data ?? [];

      setSelectedPatient((current) => {
        if (!current) return current;
        switch (tab) {
          case "medications": return { ...current, medications: rows };
          case "visits": return { ...current, visits: rows };
          case "labs": return { ...current, labResults: rows };
          case "diagnoses": return { ...current, diagnoses: rows };
          case "allergies": return { ...current, allergies: rows };
          case "vaccinations": return { ...current, vaccinations: rows };
          case "prescriptions": return { ...current, prescriptions: rows };
          default: return current;
        }
      });

      setForm((current) => {
        switch (tab) {
          case "medications": return current; // medications managed separately via dialog
          case "visits": return { ...current, visits: (rows as PatientDetail["visits"]).map((v) => ({ visitDate: v.visit_date ? v.visit_date.split("T")[0] : "", reason: v.reason || "", doctorName: v.doctor_name || "", doctorSpecialty: v.doctor_specialty || "" })) };
          case "labs": return { ...current, labResults: (rows as PatientDetail["labResults"]).map((l) => ({ testName: l.test_name || "", result: l.result || "", date: l.date ? l.date.split("T")[0] : "", uploadedFileName: l.uploaded_file_name || "", uploadedFileMimeType: l.uploaded_file_mime_type || "", uploadedFileContent: l.uploaded_file_content || "" })) };
          case "diagnoses": return { ...current, diagnoses: (rows as PatientDetail["diagnoses"]).map((d) => ({ diagnosisName: d.diagnosis_name || "", date: d.date ? d.date.split("T")[0] : "", uploadedFileName: d.uploaded_file_name || "", uploadedFileMimeType: d.uploaded_file_mime_type || "", uploadedFileContent: d.uploaded_file_content || "" })) };
          case "allergies": return { ...current, allergies: (rows as PatientDetail["allergies"]).map((a) => ({ allergyName: a.allergy_name || "" })) };
          case "vaccinations": return { ...current, vaccinations: (rows as Array<{ vaccine_name: string; administered_date: string | null; dose: string | null }>).map((v) => ({ vaccineName: v.vaccine_name || "", date: v.administered_date ? v.administered_date.split("T")[0] : "", dose: v.dose || "" })) };
          case "prescriptions": return { ...current, prescriptions: (rows as PatientDetail["prescriptions"]).map((pr) => ({ id: pr.id, medications: (Array.isArray(pr.medications) ? pr.medications : []).map((item) => ({ selectedDrug: item.drug_id ? { id: item.drug_id, name: item.medication_name } : null, search: item.medication_name || "", suggestions: [], dosageLevel: item.dosage_level || "medium", dosageAmount: item.dosage_amount || "", startDate: item.start_date ? item.start_date.split("T")[0] : "", endDate: item.end_date ? item.end_date.split("T")[0] : "", notes: item.notes || "" })), instructions: pr.instructions || "", prescriptionDate: pr.prescription_date ? pr.prescription_date.split("T")[0] : "", doctorName: pr.doctor_name || "", doctorSpecialty: pr.doctor_specialty || "", uploadedFileName: pr.uploaded_file_name || "", uploadedFileMimeType: "", uploadedFileContent: "", approvalStatus: pr.approval_status === "approved" ? "approved" : "draft" })) };
          default: return current;
        }
      });

      setLoadedTabs((prev) => new Set([...prev, tab]));
    } catch {
      // silently ignore — tab will show empty state
    } finally {
      setTabLoading(null);
    }
  }, []);

  // Called when user clicks a tab button
  const handleTabChange = useCallback((tab: RelatedPage) => {
    setActivePatientPage(tab);
    if (!selectedPatient?.id) return;
    if (tab === "details") return; // no API needed
    if (loadedTabs.has(tab)) return; // already loaded
    void loadTabData(tab, selectedPatient.id);
  }, [selectedPatient?.id, loadedTabs, loadTabData]);

  // Reload a specific tab after a mutation (add/edit/delete)
  const reloadTab = useCallback(async (tab: RelatedPage) => {
    if (!selectedPatient?.id) return;
    setLoadedTabs((prev) => { const next = new Set(prev); next.delete(tab); return next; });
    await loadTabData(tab, selectedPatient.id);
  }, [selectedPatient?.id, loadTabData]);

  const handleManualEntrySuccess = useCallback(async () => {
    setSelectedDocType(null);
    setSuccess("Record added successfully.");
    await refreshSelectedPatient();
  }, [refreshSelectedPatient]);

  useEffect(() => {
    if (!selectedPatient?.id || isEditing) return;

    const refreshOnReturn = () => {
      if (document.visibilityState === "visible") {
        void refreshSelectedPatient();
      }
    };

    window.addEventListener("focus", refreshOnReturn);
    document.addEventListener("visibilitychange", refreshOnReturn);

    return () => {
      window.removeEventListener("focus", refreshOnReturn);
      document.removeEventListener("visibilitychange", refreshOnReturn);
    };
  }, [isEditing, refreshSelectedPatient, selectedPatient?.id]);

  const startCreate = useCallback(() => {
    setForm(emptyForm);
    setActivePatientPage("details");
    setIsCreating(true);
    setFormOpen(true);
    setError("");
  }, []);

  const startEditDialog = useCallback(() => {
    if (!selectedPatient) return;
    setForm(toForm(selectedPatient));
    setActivePatientPage("details");
    setIsCreating(false);
    setFormOpen(true);
    setError("");
  }, [selectedPatient]);

  const goBack = useCallback(() => {
    setSelectedPatient(null);
    setActivePatientPage("details");
    setForm(emptyForm);
    setIsEditing(false);
    setIsCreating(false);
    setLoadingDetail(false);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("patientId");
      return next;
    }, { replace: true });
  }, [setSearchParams]);

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

  const handleSubmit = async (formData?: PatientForm): Promise<boolean> => {
    const f = formData ?? form;
    if (!f.name.trim()) { setError("Patient name is required."); return false; }
    if (!f.dateOfBirth) { setError("Date of birth is required."); return false; }
    if (isCreating) {
      if (!f.email.trim() || !f.email.includes("@")) { setError("A valid email is required."); return false; }
      if (f.password.length < 8) { setError("Password must be at least 8 characters."); return false; }
      if (f.password !== f.confirmPassword) { setError("Passwords do not match."); return false; }
    }

    setFormLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = isCreating
        ? {
            name: f.name,
            dateOfBirth: f.dateOfBirth || undefined,
            gender: f.gender || undefined,
            ageGroup: f.ageGroup || undefined,
            medicalHistory: f.medicalHistory ? f.medicalHistory.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
            visits: f.visits.map((visit) => ({
              visitDate: visit.visitDate || undefined,
              reason: visit.reason || undefined,
              doctor: visit.doctorName || visit.doctorSpecialty ? { name: visit.doctorName || undefined, specialty: visit.doctorSpecialty || undefined } : undefined,
            })),
            labResults: f.labResults.map((lab) => ({
              testName: lab.testName || undefined,
              result: lab.result || undefined,
              date: lab.date || undefined,
              uploadedFileName: lab.uploadedFileName || undefined,
              uploadedFileMimeType: lab.uploadedFileMimeType || undefined,
            })),
            diagnoses: f.diagnoses.map((diagnosis) => ({
              diagnosisName: diagnosis.diagnosisName || undefined,
              date: diagnosis.date || undefined,
              uploadedFileName: diagnosis.uploadedFileName || undefined,
              uploadedFileMimeType: diagnosis.uploadedFileMimeType || undefined,
            })),
            allergies: f.allergies.map((allergy) => ({ allergyName: allergy.allergyName || undefined })),
            prescriptions: f.prescriptions.map((prescription) => ({
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
            email: f.email.trim(),
            phone: f.phone.trim() || undefined,
            password: f.password,
          }
        : {
            name: f.name,
            date_of_birth: f.dateOfBirth || undefined,
            gender: f.gender || undefined,
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

      if (!isCreating && selectedPatient?.id) {
        const existingVisits = new Set(
          (selectedPatient.visits || []).map((visit) =>
            [
              visit.visit_date ? visit.visit_date.split("T")[0] : "",
              visit.reason || "",
              visit.doctor_name || "",
              visit.doctor_specialty || "",
            ].join("|"),
          ),
        );
        const newVisits = f.visits.filter((visit) => {
          const key = [
            visit.visitDate || "",
            visit.reason || "",
            visit.doctorName || "",
            visit.doctorSpecialty || "",
          ].join("|");
          return visit.visitDate && !existingVisits.has(key);
        });

        for (const visit of newVisits) {
          const visitResponse = await fetch(`${API_URL}/api/patients/${selectedPatient.id}/visits`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              visit_date: visit.visitDate,
              reason: visit.reason || undefined,
              doctor_name: visit.doctorName || undefined,
              doctor_specialty: visit.doctorSpecialty || undefined,
            }),
          });
          if (!visitResponse.ok) {
            const visitJson = await visitResponse.json().catch(() => null);
            throw new Error(visitJson?.error?.message || "Failed to save visit");
          }
        }
      }

      setSuccess(isCreating ? "Patient created." : "Patient updated.");
      setTimeout(() => setSuccess(""), 3000);
      await fetchPatients();

      if (isCreating) {
        setFormOpen(false);
        setIsCreating(false);
        setForm(emptyForm);
      } else if (savedDetail) {
        await viewPatient(selectedPatient?.id || savedDetail.id, false);
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

  const handleDocumentUpload = async (file: File) => {
    if (!selectedPatient?.id) {
      setError("No patient selected.");
      return;
    }
    setUploadParseLoading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const parseResponse = await fetch(`${API_URL}/api/patients/${selectedPatient.id}/documents/preview?debug=1`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          uploaded_file_name: file.name,
          uploaded_file_mime_type: file.type || "application/octet-stream",
          uploaded_file_content: dataUrl,
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
    } finally {
      setUploadParseLoading(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!pendingUpload || !selectedPatient?.id) return;
    setUploadConfirmLoading(true);
    try {
      const dataUrl = await readFileAsDataUrl(pendingUpload.file);
      const response = await fetch(`${API_URL}/api/patients/${selectedPatient.id}/documents`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: pendingUpload.file.name.replace(/\.[^.]+$/, "") || pendingUpload.file.name,
          uploaded_file_name: pendingUpload.file.name,
          uploaded_file_mime_type: pendingUpload.file.type || "application/octet-stream",
          uploaded_file_content: dataUrl,
        }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(json?.error?.message || "Failed to upload document");
      }
      // Always refresh from server to get all extracted records reflected in the UI
      await refreshSelectedPatient();
      setUploadReviewOpen(false);
      setPendingUpload(null);
      const extractedType: string = json?.extractedType ?? pendingUpload.parsedData?.type ?? "unknown";
      const extractedMedications: number = json?.extractedMedications ?? 0;
      const extractedLabResults: number = json?.extractedLabResults ?? 0;
      const extractedVaccinations: number = json?.extractedVaccinations ?? 0;
      const extractedVisits: number = json?.extractedVisits ?? 0;
      const extractedInsuranceEOBs: number = json?.extractedInsuranceEOBs ?? 0;
      if (extractedType === "prescription" && extractedMedications > 0) {
        setSuccess(`Prescription uploaded — ${extractedMedications} medication${extractedMedications !== 1 ? "s" : ""} extracted.`);
      } else if (extractedType === "lab_result" && extractedLabResults > 0) {
        setSuccess(`Lab result uploaded — ${extractedLabResults} test result${extractedLabResults !== 1 ? "s" : ""} extracted.`);
      } else if (extractedType === "vaccination" && extractedVaccinations > 0) {
        setSuccess(`Vaccination uploaded — ${extractedVaccinations} record${extractedVaccinations !== 1 ? "s" : ""} extracted.`);
      } else if (extractedType === "visit" && extractedVisits > 0) {
        setSuccess(`Visit summary uploaded — ${extractedVisits} visit${extractedVisits !== 1 ? "s" : ""} extracted.`);
      } else if (extractedType === "insurance_eob" && extractedInsuranceEOBs > 0) {
        setSuccess("Insurance EOB uploaded and added to patient records.");
      } else {
        setSuccess("Document uploaded.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setUploadConfirmLoading(false);
    }
  };

  const handleCancelUpload = () => {
    setUploadReviewOpen(false);
    setPendingUpload(null);
  };

  const existingMedicationDrugIds = useMemo(
    () => (selectedPatient?.medications || []).map((med) => med.drug_id).filter(Boolean),
    [selectedPatient?.medications],
  );

  if (selectedPatient) {
    const currentAge = calculateAge(form.dateOfBirth || selectedPatient?.date_of_birth);

    return (
      <ThemeProvider theme={muiTheme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box>
            <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError("")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} sx={bottomSnackbarSx}>
              <Alert onClose={() => setError("")} severity="error" variant="filled" sx={{ width: "100%" }}>{error}</Alert>
            </Snackbar>
            <Snackbar open={!!success} autoHideDuration={3500} onClose={() => setSuccess("")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} sx={bottomSnackbarSx}>
              <Alert onClose={() => setSuccess("")} severity="success" variant="filled" sx={{ width: "100%" }}>{success}</Alert>
            </Snackbar>

            <Box sx={{ mb: 4, p: { xs: 3, sm: 4 }, borderRadius: 5, background: "linear-gradient(135deg, #f8fffd 0%, #eefaf7 40%, #f7fbff 100%)", border: "1px solid rgba(0,212,170,0.12)", boxShadow: "0 30px 60px rgba(15,23,42,0.06)", position: "relative", overflow: "hidden", display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
              <Box sx={{ position: "absolute", top: -70, right: -30, width: 220, height: 220, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.08)" }} />
              <Box sx={{ position: "absolute", bottom: -90, left: "22%", width: 180, height: 180, borderRadius: "50%", bgcolor: "rgba(59,130,246,0.08)" }} />
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Button variant="text" startIcon={<ArrowLeft size={16} />} onClick={goBack} sx={{ px: 0, mb: 1, color: "#008f74" }}>
                  Go back
                </Button>
                <Typography variant="h4" fontWeight={900} sx={{ mb: 0.5, letterSpacing: "-0.02em", color: "#0f172a" }}>{form.name || "Patient Record"}</Typography>
                <Typography variant="body1" color="text.secondary">Full patient form view with basic information and medications.</Typography>
              </Box>
              <Box sx={{ position: "relative", zIndex: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                {selectedPatient ? (
                  <IconButton
                    onClick={() => void toggleFavorite(selectedPatient.id, !selectedPatient.is_favorite)}
                    title={selectedPatient.is_favorite ? "Remove favorite" : "Add favorite"}
                    sx={{ color: selectedPatient.is_favorite ? "#f59e0b" : "#94a3b8", border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                  >
                    <Star size={18} fill={selectedPatient.is_favorite ? "currentColor" : "none"} />
                  </IconButton>
                ) : null}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RotateCw size={15} />}
                  onClick={() => void refreshSelectedPatient()}
                  disabled={loadingDetail}
                  sx={{ borderRadius: 999, borderColor: "rgba(0,212,170,0.35)", color: "#00d4aa", "&:hover": { borderColor: "#00d4aa", bgcolor: "rgba(0,212,170,0.06)" } }}
                >
                  Refresh
                </Button>
                {!isEditing ? (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Edit2 size={15} />}
                    onClick={startEditDialog}
                    sx={{ borderRadius: 999, borderColor: "rgba(0,212,170,0.35)", color: "#00d4aa", "&:hover": { borderColor: "#00d4aa", bgcolor: "rgba(0,212,170,0.06)" } }}
                  >
                    Edit
                  </Button>
                ) : null}
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Upload size={15} />}
                  onClick={() => setEntryModeOpen(true)}
                  sx={{ borderRadius: 999, bgcolor: "#00d4aa", color: "#fff", boxShadow: "none", "&:hover": { bgcolor: "#00b894", boxShadow: "none" } }}
                >
                  Add Record
                </Button>
                {selectedPatient ? (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Trash2 size={15} />}
                    onClick={() => setDeleteId(selectedPatient.id)}
                    sx={{ borderRadius: 999, borderColor: "rgba(239,68,68,0.35)", color: "#ef4444", "&:hover": { borderColor: "#ef4444", bgcolor: "rgba(239,68,68,0.06)" } }}
                  >
                    Delete
                  </Button>
                ) : null}
                {isEditing ? (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<X size={15} />}
                      onClick={() => { if (selectedPatient) setForm(toForm(selectedPatient)); setIsEditing(false); setError(""); }}
                      sx={{ borderRadius: 999, borderColor: "rgba(15,23,42,0.2)", color: "text.secondary", "&:hover": { borderColor: "rgba(15,23,42,0.35)", bgcolor: "rgba(15,23,42,0.04)" } }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Save size={15} />}
                      onClick={() => void handleSubmit(form)}
                      disabled={formLoading}
                      sx={{ borderRadius: 999, bgcolor: "#00d4aa", color: "#fff", boxShadow: "none", "&:hover": { bgcolor: "#00b894", boxShadow: "none" } }}
                    >
                      {formLoading ? <CircularProgress size={16} color="inherit" /> : "Save"}
                    </Button>
                  </>
                ) : null}
              </Box>
            </Box>

            <Card sx={{ borderRadius: 5 }}>

              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                {loadingDetail ? (
                  <Box>
                    <Box sx={{ display: "flex", gap: 1, mb: 3, pb: 1.5, borderBottom: "1px solid", borderColor: "divider", flexWrap: "wrap" }}>
                      {[110, 70, 115, 105, 95, 85, 75, 105].map((w, i) => (
                        <Skeleton key={i} variant="rounded" width={w} height={34} sx={{ borderRadius: 2 }} />
                      ))}
                    </Box>
                    <Box sx={{ display: "grid", gap: 2 }}>
                      <Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} />
                      <Skeleton variant="rounded" height={80} sx={{ borderRadius: 3 }} />
                      <Skeleton variant="rounded" height={80} sx={{ borderRadius: 3 }} />
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                        <Skeleton variant="rounded" height={64} sx={{ borderRadius: 3 }} />
                        <Skeleton variant="rounded" height={64} sx={{ borderRadius: 3 }} />
                      </Box>
                    </Box>
                  </Box>
                ) : selectedPatient ? (
                  <RelatedPatientSections
                    form={form}
                    setForm={setForm}
                    editable={isEditing}
                    activePage={activePatientPage}
                    setActivePage={setActivePatientPage}
                    onStartEdit={() => setIsEditing(true)}
                    onSave={() => handleSubmit(form)}
                    saving={formLoading}
                    existingMedicationDrugIds={existingMedicationDrugIds}
                    onSavePrescription={handlePrescriptionSubmit}
                    onDeletePrescription={handlePrescriptionDelete}
                    patientDetail={selectedPatient}
                    onError={setError}
                    userRole={userRole}
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

            <Dialog open={entryModeOpen} onClose={() => setEntryModeOpen(false)} maxWidth="sm" fullWidth transitionDuration={{ enter: 200, exit: 100 }} PaperProps={{ sx: { borderRadius: 4 } }}>
              <DialogTitle sx={{ fontWeight: 800 }}>How would you like to add a record?</DialogTitle>
              <DialogContent sx={{ pt: 2.75 }}>
                <Box sx={{ display: "grid", gap: 2 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => uploadInputRef.current?.click()}
                    sx={{ py: 2, display: "flex", flexDirection: "column", gap: 1, textTransform: "none" }}
                  >
                    <Upload size={32} />
                    <Typography fontWeight={600}>Upload Document</Typography>
                    <Typography variant="body2" color="text.secondary">Upload a PDF to store and classify it</Typography>
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => {
                      setEntryModeOpen(false);
                      setManualEntryOpen(true);
                    }}
                    sx={{ py: 2, display: "flex", flexDirection: "column", gap: 1, textTransform: "none" }}
                  >
                    <FileText size={32} />
                    <Typography fontWeight={600}>Enter Manually</Typography>
                    <Typography variant="body2" color="text.secondary">Fill out a form to add structured data</Typography>
                  </Button>
                </Box>
              </DialogContent>
            </Dialog>

            <input
              ref={uploadInputRef}
              hidden
              type="file"
              accept="application/pdf"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setEntryModeOpen(false);
                void handleDocumentUpload(file);
                event.target.value = "";
              }}
            />

            <Dialog open={manualEntryOpen} onClose={() => setManualEntryOpen(false)} maxWidth="sm" fullWidth transitionDuration={{ enter: 200, exit: 100 }} PaperProps={{ sx: { borderRadius: 4 } }}>
              <DialogTitle sx={{ fontWeight: 800 }}>What type of record?</DialogTitle>
              <DialogContent sx={{ pt: 2.75 }}>
                <Box sx={{ display: "grid", gap: 1.5 }}>
                  {[
                    { type: "lab_result" as const, label: "Lab Result", icon: Activity, color: "#3b82f6" },
                    { type: "visit" as const, label: "Visit", icon: Stethoscope, color: "#0f766e" },
                    { type: "vaccination" as const, label: "Vaccination", icon: ShieldCheck, color: "#ec4899" },
                    { type: "diagnosis" as const, label: "Diagnosis", icon: FileText, color: "#8b5cf6" },
                    { type: "allergy" as const, label: "Allergy", icon: AlertCircle, color: "#ef4444" },
                    { type: "medication" as const, label: "Medication", icon: Pill, color: "#06b6d4" },
                    { type: "insurance" as const, label: "Insurance", icon: FileStack, color: "#f97316" },
                    { type: "discharge" as const, label: "Discharge", icon: FileText, color: "#64748b" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.type}
                        variant="outlined"
                        onClick={() => {
                          setSelectedDocType(item.type);
                          setManualEntryOpen(false);
                        }}
                        sx={{
                          py: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-start",
                          gap: 2,
                          textTransform: "none",
                          borderColor: `${item.color}40`,
                          "&:hover": { borderColor: item.color, bgcolor: `${item.color}10` },
                        }}
                      >
                        <Icon size={24} color={item.color} />
                        <Typography fontWeight={600}>{item.label}</Typography>
                      </Button>
                    );
                  })}
                </Box>
              </DialogContent>
            </Dialog>

            <ManualEntryDialog
              open={!!selectedDocType}
              docType={selectedDocType}
              patientId={selectedPatient?.id ?? ""}
              onClose={() => setSelectedDocType(null)}
              onSuccess={handleManualEntrySuccess}
              onError={setError}
            />

            <Dialog
              open={uploadReviewOpen}
              onClose={handleCancelUpload}
              maxWidth="md"
              fullWidth
              transitionDuration={{ enter: 200, exit: 100 }}
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

                    {pendingUpload.parsedData.dischargeSummary && (
                      <Box>
                        <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                          EXTRACTED DISCHARGE SUMMARY
                        </Typography>
                        <Box sx={{ mt: 1.5, p: 2, borderRadius: 2, bgcolor: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)", display: "grid", gap: 0.75 }}>
                          {pendingUpload.parsedData.dischargeSummary.admissionDate && <Typography variant="body2" sx={{ color: "#4b5563", fontSize: "0.85rem" }}>Admitted: {pendingUpload.parsedData.dischargeSummary.admissionDate}</Typography>}
                          {pendingUpload.parsedData.dischargeSummary.dischargeDate && <Typography variant="body2" sx={{ color: "#4b5563", fontSize: "0.85rem" }}>Discharged: {pendingUpload.parsedData.dischargeSummary.dischargeDate}{pendingUpload.parsedData.dischargeSummary.losDays ? ` (${pendingUpload.parsedData.dischargeSummary.losDays} days)` : ""}</Typography>}
                          {pendingUpload.parsedData.dischargeSummary.attendingPhysician && <Typography variant="body2" sx={{ color: "#4b5563", fontSize: "0.85rem" }}>Attending: {pendingUpload.parsedData.dischargeSummary.attendingPhysician}</Typography>}
                          {pendingUpload.parsedData.dischargeSummary.primaryDiagnosis && <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 600, fontSize: "0.85rem" }}>Primary Dx: {pendingUpload.parsedData.dischargeSummary.primaryDiagnosis}</Typography>}
                        </Box>
                      </Box>
                    )}

                    {pendingUpload.parsedData.insuranceEOB && (
                      <Box>
                        <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                          EXTRACTED INSURANCE EOB
                        </Typography>
                        <Box sx={{ mt: 1.5, p: 2, borderRadius: 2, bgcolor: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)", display: "grid", gap: 0.75 }}>
                          {pendingUpload.parsedData.insuranceEOB.insurerName && <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 700 }}>{pendingUpload.parsedData.insuranceEOB.insurerName}</Typography>}
                          {pendingUpload.parsedData.insuranceEOB.planName && <Typography variant="body2" sx={{ color: "#4b5563", fontSize: "0.85rem" }}>Plan: {pendingUpload.parsedData.insuranceEOB.planName}</Typography>}
                          {pendingUpload.parsedData.insuranceEOB.statementDate && <Typography variant="body2" sx={{ color: "#4b5563", fontSize: "0.85rem" }}>Statement Date: {pendingUpload.parsedData.insuranceEOB.statementDate}</Typography>}
                          {pendingUpload.parsedData.insuranceEOB.serviceDate && <Typography variant="body2" sx={{ color: "#4b5563", fontSize: "0.85rem" }}>Service Date: {pendingUpload.parsedData.insuranceEOB.serviceDate}</Typography>}
                          {pendingUpload.parsedData.insuranceEOB.totalBilled && <Typography variant="body2" sx={{ color: "#4b5563", fontSize: "0.85rem" }}>Total Billed: ${pendingUpload.parsedData.insuranceEOB.totalBilled}</Typography>}
                          {pendingUpload.parsedData.insuranceEOB.yourResponsibility && <Typography variant="body2" sx={{ color: "#c62828", fontSize: "0.85rem", fontWeight: 600 }}>Your Responsibility: ${pendingUpload.parsedData.insuranceEOB.yourResponsibility}</Typography>}
                        </Box>
                      </Box>
                    )}

                    {pendingUpload.parsedData.medications.length === 0 && pendingUpload.parsedData.labResults.length === 0 && (!pendingUpload.parsedData.vaccinations || pendingUpload.parsedData.vaccinations.length === 0) && !(pendingUpload.parsedData.visits?.[0] ?? pendingUpload.parsedData.visit) && !pendingUpload.parsedData.insuranceEOB && !pendingUpload.parsedData.dischargeSummary && (
                      <Alert severity="info">
                        No structured data was extracted from this document. It will be saved as a general document.
                      </Alert>
                    )}
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button onClick={handleCancelUpload} variant="outlined" disabled={uploadConfirmLoading}>
                  Cancel
                </Button>
                <Button onClick={() => void handleConfirmUpload()} variant="contained" disabled={uploadConfirmLoading} sx={{ bgcolor: "#22c55e", "&:hover": { bgcolor: "#16a34a" }, minWidth: 140 }}>
                  {uploadConfirmLoading ? <CircularProgress size={18} color="inherit" /> : "Confirm Upload"}
                </Button>
              </DialogActions>
            </Dialog>

            <Backdrop open={uploadParseLoading} sx={{ zIndex: 1400, color: "#fff", flexDirection: "column", gap: 2 }}>
              <CircularProgress color="inherit" size={48} />
              <Typography color="inherit" fontWeight={700} fontSize="1rem">Analyzing document…</Typography>
            </Backdrop>
          </Box>
        </LocalizationProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box>
          <Box sx={{ mb: 3, p: { xs: 2.5, sm: 3.25 }, borderRadius: 5, background: "linear-gradient(135deg, #ffffff 0%, #f0fdfa 48%, #eef7ff 100%)", border: "1px solid rgba(0,212,170,0.16)", boxShadow: "0 26px 70px rgba(15,23,42,0.07)", position: "relative", overflow: "hidden", display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2.5 }}>
            <Box sx={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 82% 16%, rgba(0,212,170,0.16), transparent 24%), radial-gradient(circle at 30% 105%, rgba(59,130,246,0.12), transparent 22%)", pointerEvents: "none" }} />
            <Box sx={{ position: "relative", zIndex: 1, maxWidth: 760 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box sx={{ width: 34, height: 34, borderRadius: 2.5, bgcolor: "rgba(0,212,170,0.12)", display: "grid", placeItems: "center", border: "1px solid rgba(0,212,170,0.18)" }}>
                  <Sparkles size={17} color="#008f74" />
                </Box>
                <Chip label="Patient Management" size="small" sx={{ bgcolor: "rgba(0,212,170,0.14)", color: "#008f74", fontWeight: 800, height: 25, fontSize: "0.72rem" }} />
              </Box>
              <Typography variant="h3" fontWeight={900} sx={{ mb: 0.75, letterSpacing: "-0.03em", color: "#0f172a", fontSize: { xs: "2rem", md: "2.55rem" } }}>Patients</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680, lineHeight: 1.75 }}>
                {canRequestPatientAccess ? "Create patient profiles directly or request access to existing patient records." : "Manage patient profiles and their medications"}
              </Typography>
            </Box>
            {canRequestPatientAccess ? (
              <Box sx={{ position: "relative", zIndex: 1, display: "flex", gap: 1.25, alignItems: "center", p: 1.5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.72)", border: "1px solid rgba(148,163,184,0.18)", minWidth: { xs: "100%", sm: 280 } }}>
                <Box sx={{ width: 42, height: 42, borderRadius: 2.5, bgcolor: "rgba(59,130,246,0.1)", display: "grid", placeItems: "center" }}>
                  <Mail size={20} color="#2563eb" />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>Access Workflow</Typography>
                  <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 800 }}>Request, approve, manage</Typography>
                </Box>
              </Box>
            ) : null}
            {canDirectlyCreatePatients ? (
              <Button variant="contained" startIcon={<Sparkles size={18} />} onClick={startCreate} sx={{ position: "relative", zIndex: 1, borderRadius: 999, px: 2.25, py: 1.2 }}>
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

          {canRequestPatientAccess ? (
            <RequestPatientAccessCard
              patientEmailSearch={patientEmailSearch}
              requestSearchLoading={requestSearchLoading}
              requestSearchResult={requestSearchResult}
              requestAccessLoading={requestAccessLoading}
              setPatientEmailSearch={setPatientEmailSearch}
              onSearch={() => void handlePatientEmailSearch()}
              onViewPatient={() => {
                if (requestSearchResult?.patientId) {
                  void viewPatient(requestSearchResult.patientId, false);
                }
              }}
              onRequestAccess={() => void handleRequestAccess()}
            />
          ) : null}

          <PatientsListPanel
            search={searchInput}
            setSearch={setSearchInput}
            setPage={setPage}
            loading={loading}
            patients={patients}
            canRequestInsteadOfCreate={canRequestInsteadOfCreate}
            onToggleFavorite={toggleFavorite}
            onViewPatient={viewPatient}
            onDeletePatient={setDeleteId}
            total={total}
            limit={limit}
            page={page}
          />

          <PatientFormDialog
            open={formOpen}
            isCreating={isCreating}
            initialForm={form}
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
