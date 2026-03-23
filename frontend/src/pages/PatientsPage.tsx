import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from "react";
import { useSearchParams } from "react-router-dom";
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
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Pagination,
  Paper,
  Snackbar,
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
  ArrowLeft,
  Edit2,
  Eye,
  Pill,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface Patient {
  id: string;
  name: string;
  date_of_birth: string;
  gender?: string | null;
  age_group: string;
  medical_history: string[];
  created_at: string;
}

interface PatientVisit {
  id?: string;
  visit_date: string;
  reason: string;
  doctor_id?: string | null;
  doctor_name?: string | null;
  doctor_specialty?: string | null;
}

interface LabResult {
  id?: string;
  test_name: string;
  result: string;
  date: string;
}

interface Diagnosis {
  id?: string;
  diagnosis_name: string;
  date: string;
}

interface Allergy {
  id?: string;
  allergy_name: string;
}

interface Prescription {
  id?: string;
  medication: string;
  instructions: string;
  doctor_id?: string | null;
  doctor_name?: string | null;
  doctor_specialty?: string | null;
  drug_id?: string | null;
}

interface PatientDetail extends Patient {
  medications: {
    id: string;
    drug_name: string;
    drug_id: string;
    dosage_level: string;
    dosage_amount: string;
    start_date: string;
    end_date: string | null;
    notes: string;
  }[];
  visits: PatientVisit[];
  labResults: LabResult[];
  diagnoses: Diagnosis[];
  allergies: Allergy[];
  prescriptions: Prescription[];
}

interface DrugSuggestion {
  id: string;
  name: string;
  generic_name?: string | null;
}

interface MedicationInteractionResult {
  drug1Name: string;
  drug2Name: string;
  severity: "high" | "medium" | "low";
  description: string;
  recommendation?: string;
}

interface PatientForm {
  name: string;
  dateOfBirth: string;
  gender: string;
  ageGroup: string;
  medicalHistory: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  visits: {
    visitDate: string;
    reason: string;
    doctorName: string;
    doctorSpecialty: string;
  }[];
  labResults: {
    testName: string;
    result: string;
    date: string;
  }[];
  diagnoses: {
    diagnosisName: string;
    date: string;
  }[];
  allergies: {
    allergyName: string;
  }[];
  prescriptions: {
    medication: string;
    instructions: string;
    doctorName: string;
    doctorSpecialty: string;
  }[];
}

interface MedicationDialogForm {
  id?: string;
  selectedDrug: DrugSuggestion | null;
  dosageLevel: string;
  dosageAmount: string;
  startDate: string;
  endDate: string;
  notes: string;
}

const emptyForm: PatientForm = {
  name: "",
  dateOfBirth: "",
  gender: "",
  ageGroup: "",
  medicalHistory: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  visits: [],
  labResults: [],
  diagnoses: [],
  allergies: [],
  prescriptions: [],
};

const emptyMedicationForm: MedicationDialogForm = {
  selectedDrug: null,
  dosageLevel: "medium",
  dosageAmount: "",
  startDate: "",
  endDate: "",
  notes: "",
};

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function calculateAge(dateOfBirth?: string | null) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

function updateListItem<T>(items: T[], index: number, patch: Partial<T>) {
  return items.map((item, currentIndex) =>
    currentIndex === index ? { ...item, ...patch } : item,
  );
}

function toForm(patient: PatientDetail): PatientForm {
  return {
    name: patient.name,
    dateOfBirth: patient.date_of_birth ? patient.date_of_birth.split("T")[0] : "",
    gender: patient.gender || "",
    ageGroup: patient.age_group || "",
    medicalHistory: (patient.medical_history || []).join(", "),
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    visits: (patient.visits || []).map((visit) => ({
      visitDate: visit.visit_date ? visit.visit_date.split("T")[0] : "",
      reason: visit.reason || "",
      doctorName: visit.doctor_name || "",
      doctorSpecialty: visit.doctor_specialty || "",
    })),
    labResults: (patient.labResults || []).map((lab) => ({
      testName: lab.test_name || "",
      result: lab.result || "",
      date: lab.date ? lab.date.split("T")[0] : "",
    })),
    diagnoses: (patient.diagnoses || []).map((diagnosis) => ({
      diagnosisName: diagnosis.diagnosis_name || "",
      date: diagnosis.date ? diagnosis.date.split("T")[0] : "",
    })),
    allergies: (patient.allergies || []).map((allergy) => ({
      allergyName: allergy.allergy_name || "",
    })),
    prescriptions: (patient.prescriptions || []).map((prescription) => ({
      medication: prescription.medication || "",
      instructions: prescription.instructions || "",
      doctorName: prescription.doctor_name || "",
      doctorSpecialty: prescription.doctor_specialty || "",
    })),
  };
}

function PatientRecordSection({
  title,
  count,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  count?: number;
  addLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            {title}
            {typeof count === "number" ? ` (${count})` : ""}
          </Typography>
          <Button size="small" startIcon={<Plus size={16} />} onClick={onAdd}>
            {addLabel}
          </Button>
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

function RelatedPatientSections({
  form,
  setForm,
  editable,
  onStartEdit,
  onSave,
  saving,
}: {
  form: PatientForm;
  setForm: Dispatch<SetStateAction<PatientForm>>;
  editable: boolean;
  onStartEdit?: () => void;
  onSave?: () => void;
  saving?: boolean;
}) {
  const [editingVisitIndex, setEditingVisitIndex] = useState<number | null>(null);
  const [editingLabIndex, setEditingLabIndex] = useState<number | null>(null);
  const [editingDiagnosisIndex, setEditingDiagnosisIndex] = useState<number | null>(null);
  const [editingAllergyIndex, setEditingAllergyIndex] = useState<number | null>(null);
  const [editingPrescriptionIndex, setEditingPrescriptionIndex] = useState<number | null>(null);

  const resetEditors = () => {
    setEditingVisitIndex(null);
    setEditingLabIndex(null);
    setEditingDiagnosisIndex(null);
    setEditingAllergyIndex(null);
    setEditingPrescriptionIndex(null);
  };

  useEffect(() => {
    if (!editable) {
      resetEditors();
    }
  }, [editable]);

  const itemActions = (
    onEdit: () => void,
    onDelete: () => void,
    isEditing: boolean,
  ) => (
    <Box sx={{ display: "flex", gap: 1 }}>
      <Button
        size="small"
        variant={isEditing ? "contained" : "outlined"}
        startIcon={<Edit2 size={14} />}
        onClick={() => {
          ensureEditable();
          onEdit();
        }}
      >
        {isEditing ? "Editing" : "Edit"}
      </Button>
      <Button
        size="small"
        color="error"
        variant="outlined"
        startIcon={<Trash2 size={14} />}
        onClick={() => {
          ensureEditable();
          onDelete();
        }}
      >
        Delete
      </Button>
    </Box>
  );

  const ensureEditable = () => {
    if (!editable) {
      onStartEdit?.();
    }
  };

  const handleDone = async (resetEditor: () => void) => {
    resetEditor();
    await onSave?.();
  };

  return (
    <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 3 }}>
      {editable ? (
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={onSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          }
        >
          Changes in visits, labs, diagnoses, allergies, and prescriptions are written to the database when you click Save Changes.
        </Alert>
      ) : null}

      <PatientRecordSection
        title="Visits / Appointments"
        count={form.visits.length}
        addLabel="Add Visit"
        onAdd={() => {
          ensureEditable();
          setEditingVisitIndex(form.visits.length);
          setForm((current) => ({
            ...current,
            visits: [...current.visits, { visitDate: "", reason: "", doctorName: "", doctorSpecialty: "" }],
          }));
        }}
      >
          {form.visits.length === 0 ? <Alert severity="info">No visits recorded.</Alert> : form.visits.map((visit, index) => {
            const isEditing = editingVisitIndex === index;
            return (
              <Card key={`visit-${index}`} variant="outlined" sx={{ mb: index === form.visits.length - 1 ? 0 : 2, bgcolor: "#fafafa" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: isEditing ? 2 : 0 }}>
                    <Box>
                      <Typography fontWeight={700}>{visit.reason || "Visit"}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {visit.visitDate || "No date"}{visit.doctorName ? ` • ${visit.doctorName}` : ""}{visit.doctorSpecialty ? ` (${visit.doctorSpecialty})` : ""}
                      </Typography>
                    </Box>
                    {itemActions(
                      () => setEditingVisitIndex(index),
                      () => setForm((current) => ({ ...current, visits: current.visits.filter((_, currentIndex) => currentIndex !== index) })),
                      isEditing,
                    )}
                  </Box>
                  {isEditing ? (
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField fullWidth label="Visit Date" type="date" value={visit.visitDate} onChange={(e) => setForm((current) => ({ ...current, visits: updateListItem(current.visits, index, { visitDate: e.target.value }) }))} slotProps={{ inputLabel: { shrink: true } }} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField fullWidth label="Reason" value={visit.reason} onChange={(e) => setForm((current) => ({ ...current, visits: updateListItem(current.visits, index, { reason: e.target.value }) }))} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField fullWidth label="Doctor Name" value={visit.doctorName} onChange={(e) => setForm((current) => ({ ...current, visits: updateListItem(current.visits, index, { doctorName: e.target.value }) }))} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <TextField fullWidth label="Specialty" value={visit.doctorSpecialty} onChange={(e) => setForm((current) => ({ ...current, visits: updateListItem(current.visits, index, { doctorSpecialty: e.target.value }) }))} />
                      </Grid>
                      <Grid size={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button size="small" onClick={() => void handleDone(() => setEditingVisitIndex(null))} disabled={saving}>Done</Button>
                      </Grid>
                    </Grid>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
      </PatientRecordSection>

      <PatientRecordSection
        title="Lab Results"
        count={form.labResults.length}
        addLabel="Add Lab Result"
        onAdd={() => {
          ensureEditable();
          setEditingLabIndex(form.labResults.length);
          setForm((current) => ({
            ...current,
            labResults: [...current.labResults, { testName: "", result: "", date: "" }],
          }));
        }}
      >
          {form.labResults.length === 0 ? <Alert severity="info">No lab results recorded.</Alert> : form.labResults.map((lab, index) => {
            const isEditing = editingLabIndex === index;
            return (
              <Card key={`lab-${index}`} variant="outlined" sx={{ mb: index === form.labResults.length - 1 ? 0 : 2, bgcolor: "#fafafa" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: isEditing ? 2 : 0 }}>
                    <Box>
                      <Typography fontWeight={700}>{lab.testName || "Lab Result"}</Typography>
                      <Typography variant="body2" color="text.secondary">{lab.result || "-"} • {lab.date || "No date"}</Typography>
                    </Box>
                    {itemActions(
                      () => setEditingLabIndex(index),
                      () => setForm((current) => ({ ...current, labResults: current.labResults.filter((_, currentIndex) => currentIndex !== index) })),
                      isEditing,
                    )}
                  </Box>
                  {isEditing ? (
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField fullWidth label="Test Name" value={lab.testName} onChange={(e) => setForm((current) => ({ ...current, labResults: updateListItem(current.labResults, index, { testName: e.target.value }) }))} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 5 }}>
                        <TextField fullWidth label="Result" value={lab.result} onChange={(e) => setForm((current) => ({ ...current, labResults: updateListItem(current.labResults, index, { result: e.target.value }) }))} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField fullWidth label="Date" type="date" value={lab.date} onChange={(e) => setForm((current) => ({ ...current, labResults: updateListItem(current.labResults, index, { date: e.target.value }) }))} slotProps={{ inputLabel: { shrink: true } }} />
                      </Grid>
                      <Grid size={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button size="small" onClick={() => void handleDone(() => setEditingLabIndex(null))} disabled={saving}>Done</Button>
                      </Grid>
                    </Grid>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
      </PatientRecordSection>

      <PatientRecordSection
        title="Diagnoses"
        count={form.diagnoses.length}
        addLabel="Add Diagnosis"
        onAdd={() => {
          ensureEditable();
          setEditingDiagnosisIndex(form.diagnoses.length);
          setForm((current) => ({
            ...current,
            diagnoses: [...current.diagnoses, { diagnosisName: "", date: "" }],
          }));
        }}
      >
          {form.diagnoses.length === 0 ? <Alert severity="info">No diagnoses recorded.</Alert> : form.diagnoses.map((diagnosis, index) => {
            const isEditing = editingDiagnosisIndex === index;
            return (
              <Card key={`diagnosis-${index}`} variant="outlined" sx={{ mb: index === form.diagnoses.length - 1 ? 0 : 2, bgcolor: "#fafafa" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: isEditing ? 2 : 0 }}>
                    <Box>
                      <Typography fontWeight={700}>{diagnosis.diagnosisName || "Diagnosis"}</Typography>
                      <Typography variant="body2" color="text.secondary">{diagnosis.date || "No date"}</Typography>
                    </Box>
                    {itemActions(
                      () => setEditingDiagnosisIndex(index),
                      () => setForm((current) => ({ ...current, diagnoses: current.diagnoses.filter((_, currentIndex) => currentIndex !== index) })),
                      isEditing,
                    )}
                  </Box>
                  {isEditing ? (
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 8 }}>
                        <TextField fullWidth label="Diagnosis" value={diagnosis.diagnosisName} onChange={(e) => setForm((current) => ({ ...current, diagnoses: updateListItem(current.diagnoses, index, { diagnosisName: e.target.value }) }))} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField fullWidth label="Date" type="date" value={diagnosis.date} onChange={(e) => setForm((current) => ({ ...current, diagnoses: updateListItem(current.diagnoses, index, { date: e.target.value }) }))} slotProps={{ inputLabel: { shrink: true } }} />
                      </Grid>
                      <Grid size={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button size="small" onClick={() => void handleDone(() => setEditingDiagnosisIndex(null))} disabled={saving}>Done</Button>
                      </Grid>
                    </Grid>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
      </PatientRecordSection>

      <PatientRecordSection
        title="Allergies"
        count={form.allergies.length}
        addLabel="Add Allergy"
        onAdd={() => {
          ensureEditable();
          setEditingAllergyIndex(form.allergies.length);
          setForm((current) => ({
            ...current,
            allergies: [...current.allergies, { allergyName: "" }],
          }));
        }}
      >
          {form.allergies.length === 0 ? <Alert severity="info">No allergies recorded.</Alert> : form.allergies.map((allergy, index) => {
            const isEditing = editingAllergyIndex === index;
            return (
              <Card key={`allergy-${index}`} variant="outlined" sx={{ mb: index === form.allergies.length - 1 ? 0 : 2, bgcolor: "#fafafa" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: isEditing ? 2 : 0 }}>
                    <Typography fontWeight={700}>{allergy.allergyName || "Allergy"}</Typography>
                    {itemActions(
                      () => setEditingAllergyIndex(index),
                      () => setForm((current) => ({ ...current, allergies: current.allergies.filter((_, currentIndex) => currentIndex !== index) })),
                      isEditing,
                    )}
                  </Box>
                  {isEditing ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <TextField fullWidth label="Allergy Name" value={allergy.allergyName} onChange={(e) => setForm((current) => ({ ...current, allergies: updateListItem(current.allergies, index, { allergyName: e.target.value }) }))} />
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button size="small" onClick={() => void handleDone(() => setEditingAllergyIndex(null))} disabled={saving}>Done</Button>
                      </Box>
                    </Box>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
      </PatientRecordSection>

      <PatientRecordSection
        title="Prescriptions"
        count={form.prescriptions.length}
        addLabel="Add Prescription"
        onAdd={() => {
          ensureEditable();
          setEditingPrescriptionIndex(form.prescriptions.length);
          setForm((current) => ({
            ...current,
            prescriptions: [...current.prescriptions, { medication: "", instructions: "", doctorName: "", doctorSpecialty: "" }],
          }));
        }}
      >
          {form.prescriptions.length === 0 ? <Alert severity="info">No prescriptions recorded.</Alert> : form.prescriptions.map((prescription, index) => {
            const isEditing = editingPrescriptionIndex === index;
            return (
              <Card key={`prescription-${index}`} variant="outlined" sx={{ mb: index === form.prescriptions.length - 1 ? 0 : 2, bgcolor: "#fafafa" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: isEditing ? 2 : 0 }}>
                    <Box>
                      <Typography fontWeight={700}>{prescription.medication || "Prescription"}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {prescription.instructions || "-"}{prescription.doctorName ? ` • ${prescription.doctorName}` : ""}{prescription.doctorSpecialty ? ` (${prescription.doctorSpecialty})` : ""}
                      </Typography>
                    </Box>
                    {itemActions(
                      () => setEditingPrescriptionIndex(index),
                      () => setForm((current) => ({ ...current, prescriptions: current.prescriptions.filter((_, currentIndex) => currentIndex !== index) })),
                      isEditing,
                    )}
                  </Box>
                  {isEditing ? (
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField fullWidth label="Medication" value={prescription.medication} onChange={(e) => setForm((current) => ({ ...current, prescriptions: updateListItem(current.prescriptions, index, { medication: e.target.value }) }))} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField fullWidth label="Instructions" value={prescription.instructions} onChange={(e) => setForm((current) => ({ ...current, prescriptions: updateListItem(current.prescriptions, index, { instructions: e.target.value }) }))} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <TextField fullWidth label="Doctor Name" value={prescription.doctorName} onChange={(e) => setForm((current) => ({ ...current, prescriptions: updateListItem(current.prescriptions, index, { doctorName: e.target.value }) }))} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <TextField fullWidth label="Specialty" value={prescription.doctorSpecialty} onChange={(e) => setForm((current) => ({ ...current, prescriptions: updateListItem(current.prescriptions, index, { doctorSpecialty: e.target.value }) }))} />
                      </Grid>
                      <Grid size={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button size="small" onClick={() => void handleDone(() => setEditingPrescriptionIndex(null))} disabled={saving}>Done</Button>
                      </Grid>
                    </Grid>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
      </PatientRecordSection>
    </Box>
  );
}

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
  const limit = 20;
  const selectedPatientId = searchParams.get("patientId");

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String((page - 1) * limit),
      });
      if (search) params.set("search", search);
      const res = await fetch(`${API_URL}/api/patients?${params}`, {
        headers: getAuthHeaders(),
      });
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

  useEffect(() => {
    void fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (!selectedPatientId) {
      return;
    }

    if (selectedPatient?.id === selectedPatientId) {
      return;
    }

    void viewPatient(selectedPatientId, false);
  }, [selectedPatientId]);

  useEffect(() => {
    if (!medicationDialogOpen) {
      setMedicationSuggestions([]);
      return;
    }

    const query = medicationSearch.trim();
    if (query.length < 2) {
      setMedicationSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/drugs/autocomplete?q=${encodeURIComponent(query)}`);
        if (!res.ok) {
          return;
        }
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
      const res = await fetch(`${API_URL}/api/patients/${id}`, {
        headers: getAuthHeaders(),
      });
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
    setIsCreating(true);
    setFormOpen(true);
    setError("");
  };

  const goBack = () => {
    setSelectedPatient(null);
    setForm(emptyForm);
    setIsEditing(false);
    setIsCreating(false);
    setLoadingDetail(false);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("patientId");
    setSearchParams(nextParams, { replace: true });
  };

  const openMedicationDialog = (medication?: PatientDetail["medications"][number]) => {
    if (!selectedPatient) {
      return;
    }

    if (medication) {
      setMedicationForm({
        id: medication.id,
        selectedDrug: medication.drug_id
          ? { id: medication.drug_id, name: medication.drug_name }
          : null,
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

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Patient name is required."); return; }
    if (!form.dateOfBirth) { setError("Date of birth is required."); return; }
    if (isCreating) {
      if (!form.email.trim() || !form.email.includes("@")) { setError("A valid email is required."); return; }
      if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    }

    setFormLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        ageGroup: form.ageGroup || undefined,
        medicalHistory: form.medicalHistory
          ? form.medicalHistory.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        visits: form.visits.map((visit) => ({
          visitDate: visit.visitDate || undefined,
          reason: visit.reason || undefined,
          doctor: visit.doctorName || visit.doctorSpecialty
            ? {
                name: visit.doctorName || undefined,
                specialty: visit.doctorSpecialty || undefined,
              }
            : undefined,
        })),
        labResults: form.labResults.map((lab) => ({
          testName: lab.testName || undefined,
          result: lab.result || undefined,
          date: lab.date || undefined,
        })),
        diagnoses: form.diagnoses.map((diagnosis) => ({
          diagnosisName: diagnosis.diagnosisName || undefined,
          date: diagnosis.date || undefined,
        })),
        allergies: form.allergies.map((allergy) => ({
          allergyName: allergy.allergyName || undefined,
        })),
        prescriptions: form.prescriptions.map((prescription) => ({
          medication: prescription.medication || undefined,
          instructions: prescription.instructions || undefined,
          doctor: prescription.doctorName || prescription.doctorSpecialty
            ? {
                name: prescription.doctorName || undefined,
                specialty: prescription.doctorSpecialty || undefined,
              }
            : undefined,
        })),
        ...(isCreating
          ? {
              email: form.email.trim(),
              phone: form.phone.trim() || undefined,
              password: form.password,
            }
          : {}),
      };

      const url = isCreating
        ? `${API_URL}/api/patients`
        : `${API_URL}/api/patients/${selectedPatient?.id}`;
      const method = isCreating ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "Failed to save patient");
      }

      await res.json();

      setSuccess(isCreating ? "Patient created." : "Patient updated.");
      setTimeout(() => setSuccess(""), 3000);
      await fetchPatients();

      if (isCreating) {
        setFormOpen(false);
        setIsCreating(false);
        setForm(emptyForm);
      } else if (selectedPatient) {
        await viewPatient(selectedPatient.id, false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save patient.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`${API_URL}/api/patients/${deleteId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete patient");
      setSuccess("Patient deleted.");
      setDeleteId(null);
      if (selectedPatient?.id === deleteId) {
        goBack();
      }
      await fetchPatients();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to delete patient.");
    }
  };

  const handleMedicationSubmit = async () => {
    if (!selectedPatient) {
      return;
    }
    if (!medicationForm.selectedDrug?.id) {
      setError("Please select a medication from the drug list.");
      return;
    }
    if (!medicationForm.startDate) {
      setError("Medication start date is required.");
      return;
    }

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
    if (!selectedPatient) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/patients/${selectedPatient.id}/medications/${medicationId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

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
    if (!selectedPatient || !medicationForm.selectedDrug?.id) {
      setError("Select a medication first.");
      return;
    }

    const currentDrugIds = (selectedPatient.medications || [])
      .filter((med) => med.drug_id && (!medicationForm.id || med.id !== medicationForm.id))
      .map((med) => med.drug_id);
    const drugIds = Array.from(new Set([...currentDrugIds, medicationForm.selectedDrug.id]));

    if (drugIds.length < 2) {
      setMedicationInteractions([]);
      setError("Add at least one other medication for this patient to check interactions.");
      return;
    }

    setMedicationInteractionLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/drugs/check-interactions`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ drugIds }),
      });

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

  if (selectedPatient) {
    const currentAge = calculateAge(form.dateOfBirth || selectedPatient?.date_of_birth);

    return (
      <Box>
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Snackbar
          open={!!error}
          autoHideDuration={5000}
          onClose={() => setError("")}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert onClose={() => setError("")} severity="error" variant="filled" sx={{ width: "100%" }}>
            {error}
          </Alert>
        </Snackbar>

        <Card sx={{ borderRadius: 4 }}>
          <Box
            sx={{
              p: { xs: 3, sm: 4 },
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}
          >
            <Box>
              <Button
                variant="text"
                startIcon={<ArrowLeft size={16} />}
                onClick={goBack}
                sx={{ px: 0, mb: 1, color: "#2563eb" }}
              >
                Go back
              </Button>
              <Typography variant="h4" fontWeight={800}>
                {form.name || "Patient Record"}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Full patient form view with basic information and medications.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {!isEditing ? (
                <Button variant="outlined" startIcon={<Edit2 size={16} />} onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              ) : null}
              {selectedPatient ? (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Trash2 size={16} />}
                  onClick={() => setDeleteId(selectedPatient.id)}
                >
                  Delete
                </Button>
              ) : null}
              {isEditing ? (
                <>
                  <Button variant="text" startIcon={<X size={16} />} onClick={() => {
                    if (selectedPatient) {
                      setForm(toForm(selectedPatient));
                    }
                    setIsEditing(false);
                    setError("");
                  }}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Save size={16} />}
                    onClick={handleSubmit}
                    disabled={formLoading}
                    sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
                  >
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
            ) : (
              <>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Patient ID"
                      value={selectedPatient?.id || "Will be generated after create"}
                      disabled
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                      slotProps={{ inputLabel: { shrink: true } }}
                      required
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Age"
                      value={currentAge ?? "-"}
                      disabled
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      select
                      label="Age Group"
                      value={form.ageGroup}
                      onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}
                      disabled={!isEditing}
                    >
                      <MenuItem value="">Auto-detect</MenuItem>
                      <MenuItem value="young">Young (0-17)</MenuItem>
                      <MenuItem value="middle">Middle (18-64)</MenuItem>
                      <MenuItem value="elderly">Elderly (65+)</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      select
                      label="Gender"
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      disabled={!isEditing}
                    >
                      <MenuItem value="">Not set</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="non_binary">Non-binary</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Medical History"
                      value={form.medicalHistory}
                      onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
                      placeholder="Comma-separated (e.g., Diabetes, Hypertension)"
                      disabled={!isEditing}
                    />
                  </Grid>
                </Grid>

                {selectedPatient ? (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 4, mb: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: "#eff6ff", display: "none" }}>
                        <Pill size={18} color="#2563eb" />
                      </Box>
                    </Box>
                    <PatientRecordSection
                      title="Medications"
                      count={selectedPatient.medications?.length || 0}
                      addLabel="Add Medication"
                      onAdd={() => openMedicationDialog()}
                    >
                      {medicationDialogOpen ? (
                        <Card variant="outlined" sx={{ mb: 2, bgcolor: "#fafafa" }}>
                          <CardContent>
                            <Grid container spacing={2}>
                              <Grid size={12}>
                                <Box sx={{ position: "relative" }}>
                                  <TextField
                                    fullWidth
                                    label="Medication"
                                    placeholder="Search drugs..."
                                    value={medicationSearch}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setMedicationSearch(value);
                                      if (medicationForm.selectedDrug && value !== medicationForm.selectedDrug.name) {
                                        setMedicationForm((current) => ({ ...current, selectedDrug: null }));
                                      }
                                    }}
                                    helperText="Search and choose a drug from the drugs table."
                                    required
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          <Search size={18} color="#94a3b8" />
                                        </InputAdornment>
                                      ),
                                    }}
                                  />
                                  {medicationForm.selectedDrug ? (
                                    <Box sx={{ mt: 1 }}>
                                      <Chip
                                        label={`Selected: ${medicationForm.selectedDrug.name}`}
                                        onDelete={() => {
                                          setMedicationForm((current) => ({ ...current, selectedDrug: null }));
                                          setMedicationSearch("");
                                          setMedicationSuggestions([]);
                                        }}
                                        color="primary"
                                        variant="outlined"
                                      />
                                    </Box>
                                  ) : null}
                                  {!medicationForm.selectedDrug && medicationSuggestions.length > 0 ? (
                                    <Paper
                                      elevation={6}
                                      sx={{
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        right: 0,
                                        zIndex: 10,
                                        mt: 1,
                                        borderRadius: 3,
                                        overflow: "hidden",
                                        border: "1px solid",
                                        borderColor: "divider",
                                      }}
                                    >
                                      <List sx={{ py: 0, maxHeight: 260, overflowY: "auto" }}>
                                        {medicationSuggestions.map((drug) => (
                                          <ListItemButton
                                            key={drug.id}
                                            onClick={() => {
                                              setMedicationForm((current) => ({ ...current, selectedDrug: drug }));
                                              setMedicationSearch(drug.name);
                                              setMedicationSuggestions([]);
                                            }}
                                            sx={{ py: 1.25, px: 2 }}
                                          >
                                            <ListItemText
                                              primary={drug.name}
                                              secondary={drug.generic_name ? `Generic: ${drug.generic_name}` : undefined}
                                            />
                                          </ListItemButton>
                                        ))}
                                      </List>
                                    </Paper>
                                  ) : null}
                                </Box>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  fullWidth
                                  select
                                  label="Dosage Level"
                                  value={medicationForm.dosageLevel}
                                  onChange={(e) => setMedicationForm((current) => ({ ...current, dosageLevel: e.target.value }))}
                                >
                                  <MenuItem value="none">None</MenuItem>
                                  <MenuItem value="low">Low</MenuItem>
                                  <MenuItem value="medium">Medium</MenuItem>
                                  <MenuItem value="high">High</MenuItem>
                                </TextField>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  fullWidth
                                  label="Dosage Amount"
                                  value={medicationForm.dosageAmount}
                                  onChange={(e) => setMedicationForm((current) => ({ ...current, dosageAmount: e.target.value }))}
                                  placeholder="e.g. 10 mg twice daily"
                                />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  fullWidth
                                  label="Start Date"
                                  type="date"
                                  value={medicationForm.startDate}
                                  onChange={(e) => setMedicationForm((current) => ({ ...current, startDate: e.target.value }))}
                                  slotProps={{ inputLabel: { shrink: true } }}
                                  required
                                />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  fullWidth
                                  label="End Date"
                                  type="date"
                                  value={medicationForm.endDate}
                                  onChange={(e) => setMedicationForm((current) => ({ ...current, endDate: e.target.value }))}
                                  slotProps={{ inputLabel: { shrink: true } }}
                                />
                              </Grid>
                              <Grid size={12}>
                                <TextField
                                  fullWidth
                                  multiline
                                  minRows={2}
                                  label="Notes"
                                  value={medicationForm.notes}
                                  onChange={(e) => setMedicationForm((current) => ({ ...current, notes: e.target.value }))}
                                />
                              </Grid>
                              <Grid size={12} sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                                <Button onClick={closeMedicationDialog} sx={{ color: "text.secondary" }}>
                                  Cancel
                                </Button>
                                <Button
                                  variant="outlined"
                                  onClick={() => void handleMedicationInteractionCheck()}
                                  disabled={medicationInteractionLoading || medicationLoading || !medicationForm.selectedDrug}
                                >
                                  {medicationInteractionLoading ? <CircularProgress size={20} color="inherit" /> : "Check Interactions"}
                                </Button>
                                <Button
                                  variant="contained"
                                  onClick={() => void handleMedicationSubmit()}
                                  disabled={medicationLoading}
                                  sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
                                >
                                  {medicationLoading ? <CircularProgress size={20} color="inherit" /> : "Done"}
                                </Button>
                              </Grid>
                              {medicationInteractions.length > 0 ? (
                                <Grid size={12}>
                                  <Alert severity="warning">
                                    <Typography fontWeight={700} sx={{ mb: 1 }}>
                                      Interaction results
                                    </Typography>
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                      {medicationInteractions.map((interaction, index) => (
                                        <Box key={`${interaction.drug1Name}-${interaction.drug2Name}-${index}`}>
                                          <Typography variant="body2" fontWeight={600}>
                                            {interaction.drug1Name} + {interaction.drug2Name} ({interaction.severity})
                                          </Typography>
                                          <Typography variant="body2">
                                            {interaction.description}
                                          </Typography>
                                          {interaction.recommendation ? (
                                            <Typography variant="caption" color="text.secondary">
                                              Recommendation: {interaction.recommendation}
                                            </Typography>
                                          ) : null}
                                        </Box>
                                      ))}
                                    </Box>
                                  </Alert>
                                </Grid>
                              ) : null}
                            </Grid>
                          </CardContent>
                        </Card>
                      ) : null}
                      {selectedPatient.medications && selectedPatient.medications.length > 0 ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {selectedPatient.medications.map((med) => (
                            <Card key={med.id} variant="outlined" sx={{ bgcolor: "#fafafa" }}>
                              <CardContent>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
                                  <Box>
                                    <Typography fontWeight={700}>{med.drug_name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {med.dosage_amount || med.dosage_level || "-"} • {med.start_date ? new Date(med.start_date).toLocaleDateString() : "-"} • {med.end_date ? new Date(med.end_date).toLocaleDateString() : "Ongoing"}
                                    </Typography>
                                    {med.notes ? (
                                      <Typography variant="body2" sx={{ mt: 1 }}>
                                        {med.notes}
                                      </Typography>
                                    ) : null}
                                  </Box>
                                  <Box sx={{ display: "flex", gap: 1 }}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<Edit2 size={14} />}
                                      onClick={() => {
                                        setIsEditing(true);
                                        openMedicationDialog(med);
                                      }}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="small"
                                      color="error"
                                      variant="outlined"
                                      startIcon={<Trash2 size={14} />}
                                      onClick={() => {
                                        setIsEditing(true);
                                        void handleMedicationDelete(med.id);
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      ) : (
                        <Alert severity="info">No medications recorded. Use Add Medication to link a drug from the drugs table.</Alert>
                      )}
                    </PatientRecordSection>

                    <RelatedPatientSections
                      form={form}
                      setForm={setForm}
                      editable={isEditing}
                      onStartEdit={() => setIsEditing(true)}
                      onSave={() => void handleSubmit()}
                      saving={formLoading}
                    />
                  </>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        <Snackbar
          open={!!deleteId && !selectedPatient}
          autoHideDuration={1}
          onClose={() => setDeleteId(null)}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, p: { xs: 3, sm: 4 }, borderRadius: 4, background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #2563eb 100%)", color: "white", position: "relative", overflow: "hidden", display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
        <Box sx={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(96,165,250,0.1)" }} />
        <Box sx={{ position: "absolute", bottom: -60, right: 100, width: 150, height: 150, borderRadius: "50%", bgcolor: "rgba(96,165,250,0.06)" }} />
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Sparkles size={18} color="#60a5fa" />
            <Chip label="Patient Management" size="small" sx={{ bgcolor: "rgba(96,165,250,0.15)", color: "#93c5fd", fontWeight: 600, height: 24, fontSize: "0.7rem" }} />
          </Box>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>Patients</Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)" }}>Manage patient profiles and their medications</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={startCreate} sx={{ position: "relative", zIndex: 1, bgcolor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>
          Add Patient
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setError("")} severity="error" variant="filled" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: 2 }}>
          <TextField
            fullWidth
            placeholder="Search patients by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            size="small"
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#f8fafc" } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} color="#94a3b8" /></InputAdornment> } }}
          />
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>DOB / Age</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{ p: 2, borderRadius: 3, bgcolor: "#f8fafc" }}><Users size={40} color="#94a3b8" /></Box>
                      <Typography color="text.secondary" fontWeight={500}>
                        {search ? "No patients match your search." : "No patients yet. Add your first patient."}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow key={patient.id} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: "#eff6ff", color: "#2563eb", fontSize: 13, fontWeight: 700 }}>
                          {patient.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                        </Avatar>
                        <Typography fontWeight={600}>{patient.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : "-"}
                        {patient.date_of_birth ? ` / ${calculateAge(patient.date_of_birth) ?? "-"}` : ""}
                      </Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{patient.gender || "-"}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{new Date(patient.created_at).toLocaleDateString()}</Typography></TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                        <IconButton size="small" onClick={() => viewPatient(patient.id, false)} title="View" sx={{ color: "#2563eb" }}><Eye size={16} /></IconButton>
                        <IconButton size="small" onClick={() => viewPatient(patient.id, true)} title="Edit" sx={{ color: "#64748b" }}><Edit2 size={16} /></IconButton>
                        <IconButton size="small" onClick={() => setDeleteId(patient.id)} title="Delete" sx={{ color: "#dc2626" }}><Trash2 size={16} /></IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {total > limit && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <Pagination count={Math.ceil(total / limit)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
          </Box>
        )}
      </Card>

      <Dialog open={formOpen} onClose={() => { setFormOpen(false); setIsCreating(false); setForm(emptyForm); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Patient</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <TextField fullWidth label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select label="Age Group" value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}>
                <MenuItem value="">Auto-detect</MenuItem>
                <MenuItem value="young">Young (0-17)</MenuItem>
                <MenuItem value="middle">Middle (18-64)</MenuItem>
                <MenuItem value="elderly">Elderly (65+)</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <MenuItem value="">Not set</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="non_binary">Non-binary</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Medical History" value={form.medicalHistory} onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })} placeholder="Comma-separated (e.g., Diabetes, Hypertension)" multiline rows={2} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Patient Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required helperText="Minimum 8 characters" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Confirm Password" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
            </Grid>
          </Grid>

          <RelatedPatientSections
            form={form}
            setForm={setForm}
            editable
            onSave={() => void handleSubmit()}
            saving={formLoading}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => { setFormOpen(false); setIsCreating(false); setForm(emptyForm); }} sx={{ color: "text.secondary" }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={formLoading} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
            {formLoading ? <CircularProgress size={20} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
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
  );
}
