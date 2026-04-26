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
  Plus,
  Save,
  Search,
  Sparkles,
  Star,
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
  is_favorite?: boolean;
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
  uploaded_file_name?: string | null;
  uploaded_file_mime_type?: string | null;
  uploaded_file_content?: string | null;
}

interface Diagnosis {
  id?: string;
  diagnosis_name: string;
  date: string;
  uploaded_file_name?: string | null;
  uploaded_file_mime_type?: string | null;
  uploaded_file_content?: string | null;
}

interface Allergy {
  id?: string;
  allergy_name: string;
}

interface Prescription {
  id?: string;
  medication?: string;
  medications: Array<{
    id?: string;
    drug_id?: string | null;
    medication_name: string;
    dosage_level?: string | null;
    dosage_amount?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    notes?: string | null;
  }>;
  instructions: string;
  prescription_date?: string | null;
  doctor_id?: string | null;
  doctor_name?: string | null;
  doctor_specialty?: string | null;
  drug_id?: string | null;
  uploaded_file_name?: string | null;
  approval_status?: string | null;
  approved_at?: string | null;
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

interface PatientAccessSearchResult {
  patientId: string;
  patientUserId: string;
  name: string;
  email: string;
  alreadyAccessible: boolean;
  requestStatus: "pending" | "approved" | "rejected" | null;
}

interface MedicationInteractionResult {
  drug1Name: string;
  drug2Name: string;
  severity: "high" | "medium" | "low";
  description: string;
  recommendation?: string;
}

type RelatedPage = "details" | "visits" | "prescriptions" | "medications" | "labs" | "diagnoses" | "allergies";

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
    uploadedFileName: string;
    uploadedFileMimeType: string;
    uploadedFileContent: string;
  }[];
  diagnoses: {
    diagnosisName: string;
    date: string;
    uploadedFileName: string;
    uploadedFileMimeType: string;
    uploadedFileContent: string;
  }[];
  allergies: {
    allergyName: string;
  }[];
  prescriptions: {
    id?: string;
    medications: Array<{
      selectedDrug: DrugSuggestion | null;
      search: string;
      suggestions: DrugSuggestion[];
      dosageLevel: string;
      dosageAmount: string;
      startDate: string;
      endDate: string;
      notes: string;
    }>;
    instructions: string;
    prescriptionDate: string;
    doctorName: string;
    doctorSpecialty: string;
    uploadedFileName: string;
    approvalStatus: "draft" | "approved";
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

const bottomSnackbarSx = {
  zIndex: (theme: { zIndex: { appBar: number } }) => theme.zIndex.appBar + 1400,
  bottom: { xs: 16, sm: 20 },
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

function compactSpacedChunks(text: string) {
  let current = text.replace(/\s+/g, " ").trim();
  for (let i = 0; i < 5; i += 1) {
    const next = current.replace(/\b(?:[A-Za-z]{1,2}\s+){2,}[A-Za-z]{1,2}\b/g, (match) =>
      match.replace(/\s+/g, ""),
    );
    if (next === current) {
      break;
    }
    current = next;
  }
  return current;
}

function compactSpacedLine(text: string) {
  return compactSpacedChunks(text)
    .replace(/\s*([:;|,])\s*/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhraseSpacing(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .replace(/\bOnceADay\b/gi, "Once A Day")
    .replace(/\bOnceDaily\b/gi, "Once Daily")
    .replace(/\bTwiceDaily\b/gi, "Twice Daily")
    .replace(/\bThreeTimesDaily\b/gi, "Three Times Daily")
    .replace(/\bFourTimesDaily\b/gi, "Four Times Daily")
    .replace(/\bEvery(\d+)(Hours?|Days?)\b/gi, "Every $1 $2")
    .replace(/\bAfterMeal\b/gi, "After Meal")
    .replace(/\bWithFood\b/gi, "With Food")
    .replace(/\bBeforeBreakfast\b/gi, "Before Breakfast")
    .replace(/\bAtBedtime\b/gi, "At Bedtime")
    .replace(/\bEmptyStomach\b/gi, "Empty Stomach")
    .replace(/\bMorningDose\b/gi, "Morning Dose")
    .replace(/\s*,\s*/g, ", ")
    .trim();
}

function extractTextOperators(streamText: string) {
  return [
    ...Array.from(streamText.matchAll(/\(([^()]*(?:\\.[^()]*)*)\)\s*Tj/g), (match) => match[1]),
    ...Array.from(streamText.matchAll(/\[(.*?)\]\s*TJ/gs), (match) =>
      Array.from(match[1].matchAll(/\(([^()]*(?:\\.[^()]*)*)\)/g), (nested) => nested[1]).join(" "),
    ),
  ]
    .map((item) => item.replace(/\\([()\\])/g, "$1"))
    .map((item) => compactSpacedLine(item))
    .filter(Boolean);
}

async function extractPdfText(file: File) {
  const buffer = new Uint8Array(await file.arrayBuffer());
  const pdfText = new TextDecoder("latin1").decode(buffer);
  const chunks: string[] = [];
  let searchIndex = 0;

  while (true) {
    const streamIndex = pdfText.indexOf("stream", searchIndex);
    if (streamIndex === -1) {
      break;
    }

    let contentStart = streamIndex + 6;
    if (pdfText[contentStart] === "\r" && pdfText[contentStart + 1] === "\n") {
      contentStart += 2;
    } else if (pdfText[contentStart] === "\n") {
      contentStart += 1;
    }

    const endStreamIndex = pdfText.indexOf("endstream", contentStart);
    if (endStreamIndex === -1) {
      break;
    }

    let contentEnd = endStreamIndex;
    if (pdfText[contentEnd - 2] === "\r" && pdfText[contentEnd - 1] === "\n") {
      contentEnd -= 2;
    } else if (pdfText[contentEnd - 1] === "\n") {
      contentEnd -= 1;
    }

    try {
      const rawBytes = buffer.slice(contentStart, contentEnd);
      const rawText = new TextDecoder("latin1").decode(rawBytes);
      const rawOperators = extractTextOperators(rawText);

      if (rawOperators.length > 0) {
        chunks.push(...rawOperators);
      } else {
        const decompressedStream = new Blob([rawBytes]).stream().pipeThrough(new DecompressionStream("deflate"));
        const decompressedBuffer = await new Response(decompressedStream).arrayBuffer();
        const decompressedText = new TextDecoder("latin1").decode(decompressedBuffer);
        const decompressedOperators = extractTextOperators(decompressedText);
        if (decompressedOperators.length > 0) {
          chunks.push(...decompressedOperators);
        }
      }
    } catch {
      // Ignore non-text streams.
    }

    searchIndex = endStreamIndex + 9;
  }

  return chunks.join("\n");
}

function formatDateForInput(value: string) {
  const compact = value.replace(/\s+/g, "").replace(/[^\d/]/g, "");
  const match = compact.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    return "";
  }
  const month = match[1].padStart(2, "0");
  const day = match[2].padStart(2, "0");
  return `${match[3]}-${month}-${day}`;
}

function addDurationToDate(startDate: string, amount: number, unit: string) {
  if (!startDate) {
    return "";
  }
  const date = new Date(startDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const normalizedUnit = unit.toLowerCase();
  const days =
    normalizedUnit.startsWith("week") ? amount * 7
    : normalizedUnit.startsWith("month") ? amount * 30
    : amount;
  date.setDate(date.getDate() + Math.max(days - 1, 0));
  return date.toISOString().split("T")[0];
}

function parseDoctorLine(value: string) {
  const cleaned = normalizePhraseSpacing(value).replace(/^(Prescriber|Physician|Clinician|Provider|Attending Physician|Ordering Provider)\s*:\s*/i, "").trim();
  if (!cleaned) {
    return { doctorName: "", doctorSpecialty: "" };
  }
  const [name, ...rest] = cleaned.split(",").map((part) => part.trim()).filter(Boolean);
  return {
    doctorName: name || "",
    doctorSpecialty: rest.join(", "),
  };
}

function extractMedicationNameAndStrength(value: string) {
  const cleaned = normalizePhraseSpacing(value)
    .replace(/^(Rx|Medication)\s*[A-Z0-9.-]*\s*:\s*/i, "")
    .replace(/^\d+[\).\s-]+/, "")
    .trim();

  const strengthMatch = cleaned.match(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|mL|ml|units?|IU|%|percent)(?:\s*\/\s*\d+(?:\.\d+)?\s*(?:mg|mcg|g|mL|ml))?(?:\s*(?:tablet|capsule|suspension|ointment|solution|patch|inhaler))?/i);
  const strength = strengthMatch ? normalizePhraseSpacing(strengthMatch[0]) : "";
  const medicationName = normalizePhraseSpacing(
    strengthMatch ? cleaned.slice(0, strengthMatch.index).trim().replace(/[,;:]$/, "") : cleaned,
  );

  return {
    medicationName: medicationName || normalizePhraseSpacing(cleaned.split(/[;|]/)[0] || ""),
    strength,
  };
}

function parseMedicationLine(line: string, prescriptionDate: string) {
  const normalizedLine = normalizePhraseSpacing(line);
  const parts = normalizedLine.split(/[;|]/).map((part) => normalizePhraseSpacing(part)).filter(Boolean);
  if (parts.length === 0) {
    return null;
  }

  const head = extractMedicationNameAndStrength(parts[0]);
  if (!head.medicationName) {
    return null;
  }

  const durationSource = parts.join("; ");
  const durationMatch = durationSource.match(/\bfor\s+(\d+)\s+(day|days|week|weeks|month|months)\b/i);
  const endDate = durationMatch
    ? addDurationToDate(prescriptionDate, Number(durationMatch[1]), durationMatch[2])
    : "";

  const dosageAmount = normalizePhraseSpacing(
    parts.find((part, index) => index > 0 && !/\bfor\s+\d+\s+(?:day|days|week|weeks|month|months)\b/i.test(part) && !/\bafter\b|\bwith\b|\bbefore\b|\bas needed\b|\bmorning\b|\bevening\b|\bnightly\b|\bbedtime\b/i.test(part))
    || parts.find((part, index) => index > 0 && !/\bfor\s+\d+\s+(?:day|days|week|weeks|month|months)\b/i.test(part))
    || "",
  );

  const notes = parts
    .slice(1)
    .filter((part) => part !== dosageAmount)
    .filter((part) => !/\bfor\s+\d+\s+(?:day|days|week|weeks|month|months)\b/i.test(part))
    .filter(Boolean)
    .join("; ");

  return {
    medicationName: head.medicationName,
    dosageAmount,
    startDate: prescriptionDate,
    endDate,
    notes,
  };
}

function parsePrescriptionText(text: string) {
  const lines = text
    .split(/\n+/)
    .map((line) => normalizePhraseSpacing(compactSpacedLine(line)))
    .filter(Boolean);
  const normalized = compactSpacedChunks(lines.join(" "));
  const dateMatch =
    normalized.match(/(?:Date\s+Prescribed|Prescription\s+Date|Date\s+Written|Date)\s*[:\-]?\s*([0-9\s/]{6,24})/i) ||
    normalized.match(/([0-9]\s*[0-9]?\s*\/\s*[0-9]\s*[0-9]?\s*\/\s*[0-9](?:\s*[0-9]){3})/);
  const prescriptionDate = dateMatch ? formatDateForInput(dateMatch[1]) : "";

  const doctorLine = lines.find((line) => /^(Prescriber|Physician|Clinician|Provider|Attending Physician|Ordering Provider)\s*:/i.test(line));
  const { doctorName, doctorSpecialty } = parseDoctorLine(doctorLine || "");

  const medicationLines = lines.filter((line) =>
    /^(\d+[\).\s-]+|Rx\s*\d*:?|Medication\s*[A-Z0-9.-]*:)/i.test(line) ||
    /\b(?:mg|mcg|g|mL|ml|units?|IU|%|percent)\b/i.test(line),
  ).filter((line) =>
    !/^(Patient|DOB|MRN|Account|Record|Encounter|Date|Date Prescribed|Prescription Date|Prescriber|Physician|Clinician|Provider|Instructions|Notes|Monitoring|Comment|Care Advice|Parent Instructions|Additional Instructions|Counseling|Signature|Ordering Clinician)/i.test(line),
  );

  const medications = medicationLines
    .map((line) => parseMedicationLine(line, prescriptionDate))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (medications.length === 0) {
    const medicationBlocks = Array.from(normalized.matchAll(/\[([^\]]+)\]/g), (match) => match[1].trim());
    medicationBlocks.forEach((block) => {
      const parsed = parseMedicationLine(block, prescriptionDate);
      if (parsed) {
        medications.push(parsed);
      }
    });
  }

  return {
    prescriptionDate,
    doctorName,
    doctorSpecialty,
    medications,
  };
}

function parseLabResultText(text: string) {
  const lines = text
    .split(/\n+/)
    .map((line) => normalizePhraseSpacing(compactSpacedLine(line)))
    .filter(Boolean);

  const joined = lines.join(" ");
  const dateMatch =
    joined.match(/(?:Collection Date|Collected|Collection|Reported|Resulted)\s*[:\-]?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i)
    || joined.match(/([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/);

  const reportDate = dateMatch ? formatDateForInput(dateMatch[1]) : "";

  const headerLines = lines.filter((line) =>
    !/^(Patient|DOB|Accession|Collection Date|Collected|Collection|Reported|Resulted|Ordering Clinician|Ordering Provider|Interpretation|Comment|Assessment|Clinical Note|Recommendations|Plan)/i.test(line),
  );

  const metricLines = lines.filter((line) =>
    /:\s*.+/.test(line)
    && !/^(Patient|DOB|Accession|Collection Date|Collected|Collection|Reported|Resulted|Ordering Clinician|Ordering Provider|Interpretation|Comment|Assessment|Clinical Note|Recommendations|Plan)/i.test(line),
  );

  const summaryLines = lines.filter((line) =>
    /^(Interpretation|Comment|Assessment|Clinical Note|Recommendations|Plan)\s*:/i.test(line),
  );

  const testName =
    headerLines.find((line) => !/:\s*.+/.test(line))
    || metricLines[0]?.split(":")[0]?.trim()
    || "";

  const result = [...metricLines, ...summaryLines]
    .map((line) => normalizePhraseSpacing(line))
    .join("\n");

  return {
    testName: normalizePhraseSpacing(testName),
    result,
    date: reportDate,
  };
}

function parseDiagnosisText(text: string) {
  const lines = text
    .split(/\n+/)
    .map((line) => normalizePhraseSpacing(compactSpacedLine(line)))
    .filter(Boolean);

  const joined = lines.join(" ");
  const dateMatch =
    joined.match(/(?:Date of Diagnosis|Diagnosis Date|Date Diagnosed|Date)\s*[:\-]?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i)
    || joined.match(/([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/);

  const diagnosisDate = dateMatch ? formatDateForInput(dateMatch[1]) : "";

  const primaryDiagnosisLine =
    lines.find((line) => /^Primary Diagnosis\s*:/i.test(line))
    || lines.find((line) => /^Diagnosis\s*:/i.test(line))
    || lines.find((line) => /^Clinical Impression\s*:/i.test(line));

  const diagnosisName = primaryDiagnosisLine
    ? normalizePhraseSpacing(primaryDiagnosisLine.replace(/^(Primary Diagnosis|Diagnosis|Clinical Impression)\s*:\s*/i, ""))
    : normalizePhraseSpacing(
        lines.find((line) =>
          !/^(Patient|DOB|Encounter|Date of Diagnosis|Diagnosis Date|Date Diagnosed|Diagnosing Clinician|Secondary Diagnosis|Assessment|Plan|Recommendations|Treatment|Provider Note|Pediatric Note|Summary|Comment|Advice|Impression)/i.test(line),
        ) || "",
      );

  return {
    diagnosisName,
    date: diagnosisDate,
  };
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
      uploadedFileName: lab.uploaded_file_name || "",
      uploadedFileMimeType: lab.uploaded_file_mime_type || "",
      uploadedFileContent: lab.uploaded_file_content || "",
    })),
    diagnoses: (patient.diagnoses || []).map((diagnosis) => ({
      diagnosisName: diagnosis.diagnosis_name || "",
      date: diagnosis.date ? diagnosis.date.split("T")[0] : "",
      uploadedFileName: diagnosis.uploaded_file_name || "",
      uploadedFileMimeType: diagnosis.uploaded_file_mime_type || "",
      uploadedFileContent: diagnosis.uploaded_file_content || "",
    })),
    allergies: (patient.allergies || []).map((allergy) => ({
      allergyName: allergy.allergy_name || "",
    })),
    prescriptions: (patient.prescriptions || []).map((prescription) => ({
      id: prescription.id,
      medications: ((prescription.medications && prescription.medications.length > 0)
        ? prescription.medications
        : prescription.medication
          ? [{
              medication_name: prescription.medication,
              drug_id: prescription.drug_id || null,
              dosage_level: "medium",
              start_date: prescription.prescription_date || "",
            }]
          : []
      ).map((item) => ({
        selectedDrug: item.drug_id ? { id: item.drug_id, name: item.medication_name } : null,
        search: item.medication_name || "",
        suggestions: [],
        dosageLevel: item.dosage_level || "medium",
        dosageAmount: item.dosage_amount || "",
        startDate: item.start_date ? item.start_date.split("T")[0] : "",
        endDate: item.end_date ? item.end_date.split("T")[0] : "",
        notes: item.notes || "",
      })),
      instructions: prescription.instructions || "",
      prescriptionDate: prescription.prescription_date ? prescription.prescription_date.split("T")[0] : "",
      doctorName: prescription.doctor_name || "",
      doctorSpecialty: prescription.doctor_specialty || "",
      uploadedFileName: prescription.uploaded_file_name || "",
      approvalStatus: prescription.approval_status === "approved" ? "approved" : "draft",
    })),
  };
}

const relatedSectionSx = {
  borderRadius: 4,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
};

function PatientRecordSection({
  title,
  count,
  addLabel,
  onAdd,
  children,
  sx,
}: {
  title: string;
  count?: number;
  addLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
  sx?: object;
}) {
  return (
    <Card variant="outlined" sx={sx}>
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

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function downloadStoredFile(fileName: string, mimeType: string, dataUrlOrBase64: string) {
  const href = dataUrlOrBase64.startsWith("data:")
    ? dataUrlOrBase64
    : `data:${mimeType || "application/octet-stream"};base64,${dataUrlOrBase64}`;
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName || "lab-result-file";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function MedicationSection({
  selectedPatient,
  medicationDialogOpen,
  medicationForm,
  medicationSearch,
  medicationSuggestions,
  medicationInteractions,
  medicationInteractionLoading,
  medicationLoading,
  openMedicationDialog,
  closeMedicationDialog,
  handleMedicationInteractionCheck,
  handleMedicationSubmit,
  setMedicationForm,
  setMedicationSearch,
  setMedicationSuggestions,
  handleMedicationDelete,
}: {
  selectedPatient: PatientDetail;
  medicationDialogOpen: boolean;
  medicationForm: MedicationDialogForm;
  medicationSearch: string;
  medicationSuggestions: DrugSuggestion[];
  medicationInteractions: MedicationInteractionResult[];
  medicationInteractionLoading: boolean;
  medicationLoading: boolean;
  openMedicationDialog: (medication?: PatientDetail["medications"][number]) => void;
  closeMedicationDialog: () => void;
  handleMedicationInteractionCheck: () => Promise<void>;
  handleMedicationSubmit: () => Promise<void>;
  setMedicationForm: Dispatch<SetStateAction<MedicationDialogForm>>;
  setMedicationSearch: Dispatch<SetStateAction<string>>;
  setMedicationSuggestions: Dispatch<SetStateAction<DrugSuggestion[]>>;
  handleMedicationDelete: (medicationId: string) => Promise<void>;
}) {
  return (
    <PatientRecordSection
      title="Medications"
      count={selectedPatient.medications?.length || 0}
      addLabel="Add Medication"
      onAdd={() => openMedicationDialog()}
      sx={{ mt: 0 }}
    >
      {medicationDialogOpen ? (
        <Card variant="outlined" sx={{ mb: 2, bgcolor: "background.default" }}>
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
                  color="primary"
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
                          <Typography variant="body2">{interaction.description}</Typography>
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
            <Card key={med.id} variant="outlined" sx={{ bgcolor: "background.default" }}>
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
                      onClick={() => openMedicationDialog(med)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<Trash2 size={14} />}
                      onClick={() => void handleMedicationDelete(med.id)}
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
  );
}

function PrescriptionMedicationEditor({
  item,
  label,
  disabled,
  comparisonDrugIds,
  onChange,
  onRemove,
  onCancel,
  onDone,
}: {
  item: PatientForm["prescriptions"][number]["medications"][number];
  label: string;
  disabled?: boolean;
  comparisonDrugIds: string[];
  onChange: (patch: Partial<PatientForm["prescriptions"][number]["medications"][number]>) => void;
  onRemove: () => void;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [interactions, setInteractions] = useState<MedicationInteractionResult[]>([]);

  useEffect(() => {
    const query = item.search.trim();
    if (query.length < 2 || item.selectedDrug) {
      if (item.suggestions.length > 0) {
        onChange({ suggestions: [] });
      }
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/drugs/autocomplete?q=${encodeURIComponent(query)}`);
        if (!res.ok) {
          onChange({ suggestions: [] });
          return;
        }
        const json = await res.json();
        onChange({ suggestions: json.data?.suggestions || [] });
      } catch {
        onChange({ suggestions: [] });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [item.search, item.selectedDrug]);

  const handleInteractionCheck = async () => {
    if (!item.selectedDrug?.id) {
      return;
    }

    const drugIds = Array.from(new Set([...comparisonDrugIds, item.selectedDrug.id]));
    if (drugIds.length < 2) {
      setInteractions([]);
      return;
    }

    setInteractionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/drugs/check-interactions`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ drugIds }),
      });

      if (!res.ok) {
        setInteractions([]);
        return;
      }

      const json = await res.json();
      setInteractions(json.data?.interactions || []);
    } catch {
      setInteractions([]);
    } finally {
      setInteractionLoading(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ bgcolor: "background.paper" }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid size={12}>
            <Box sx={{ position: "relative" }}>
              <TextField
                fullWidth
                label={label}
                placeholder="Search drugs..."
                value={item.search}
                onChange={(e) => {
                  const value = e.target.value;
                  onChange({
                    search: value,
                    selectedDrug: item.selectedDrug?.name === value ? item.selectedDrug : null,
                    suggestions: value.length < 2 ? [] : item.suggestions,
                  });
                  setInteractions([]);
                }}
                helperText="Search and choose a drug from the drugs table."
                required
                disabled={disabled}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} color="#94a3b8" />
                    </InputAdornment>
                  ),
                }}
              />
              {item.selectedDrug ? (
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={`Selected: ${item.selectedDrug.name}`}
                    onDelete={
                      disabled
                        ? undefined
                        : () => {
                            onChange({ selectedDrug: null, search: "", suggestions: [] });
                            setInteractions([]);
                          }
                    }
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              ) : null}
              {!item.selectedDrug && item.suggestions.length > 0 ? (
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
                    {item.suggestions.map((drug) => (
                      <ListItemButton
                        key={drug.id}
                        onClick={() => {
                          onChange({ selectedDrug: drug, search: drug.name, suggestions: [] });
                          setInteractions([]);
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
              value={item.dosageLevel}
              onChange={(e) => onChange({ dosageLevel: e.target.value })}
              disabled={disabled}
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
              value={item.dosageAmount}
              onChange={(e) => onChange({ dosageAmount: e.target.value })}
              placeholder="e.g. 10 mg twice daily"
              disabled={disabled}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={item.startDate}
              onChange={(e) => onChange({ startDate: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              required
              disabled={disabled}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={item.endDate}
              onChange={(e) => onChange({ endDate: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={disabled}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Notes"
              value={item.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              disabled={disabled}
            />
          </Grid>
          <Grid size={12} sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
            <Button color="error" variant="outlined" startIcon={<Trash2 size={14} />} onClick={onRemove} disabled={disabled}>
              Remove
            </Button>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <Button onClick={onCancel} sx={{ color: "text.secondary" }} disabled={disabled}>
                Cancel
              </Button>
              <Button
                variant="outlined"
                onClick={() => void handleInteractionCheck()}
                disabled={disabled || interactionLoading || !item.selectedDrug}
              >
                {interactionLoading ? <CircularProgress size={20} color="inherit" /> : "Check Interactions"}
              </Button>
              <Button
                variant="contained"
                onClick={onDone}
                disabled={disabled}
                color="primary"
              >
                Done
              </Button>
            </Box>
          </Grid>
          {interactions.length > 0 ? (
            <Grid size={12}>
              <Alert severity="warning">
                <Typography fontWeight={700} sx={{ mb: 1 }}>
                  Interaction results
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {interactions.map((interaction, index) => (
                    <Box key={`${interaction.drug1Name}-${interaction.drug2Name}-${index}`}>
                      <Typography variant="body2" fontWeight={600}>
                        {interaction.drug1Name} + {interaction.drug2Name} ({interaction.severity})
                      </Typography>
                      <Typography variant="body2">{interaction.description}</Typography>
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
  );
}

function RelatedPatientSections({
  form,
  setForm,
  editable,
  activePage,
  setActivePage,
  onStartEdit,
  onSave,
  saving,
  existingMedicationDrugIds,
  onSavePrescription,
  onDeletePrescription,
  onApprovePrescription,
  patientDetail,
  onUploadPrescriptionFile,
  onUploadLabResultFile,
  onUploadDiagnosisFile,
  onError,
  medicationsSection,
  detailsSection,
}: {
  form: PatientForm;
  setForm: Dispatch<SetStateAction<PatientForm>>;
  editable: boolean;
  activePage: RelatedPage;
  setActivePage: Dispatch<SetStateAction<RelatedPage>>;
  onStartEdit?: () => void;
  onSave?: () => Promise<boolean>;
  saving?: boolean;
  existingMedicationDrugIds: string[];
  onSavePrescription: (index: number) => Promise<boolean>;
  onDeletePrescription: (index: number) => Promise<void>;
  onApprovePrescription: (index: number) => Promise<boolean>;
  patientDetail: PatientDetail | null;
  onUploadPrescriptionFile: (index: number, file: File) => Promise<void>;
  onUploadLabResultFile: (index: number, file: File) => Promise<void>;
  onUploadDiagnosisFile: (index: number, file: File) => Promise<void>;
  onError: (message: string) => void;
  medicationsSection?: React.ReactNode;
  detailsSection?: React.ReactNode;
}) {
  const [editingVisitIndex, setEditingVisitIndex] = useState<number | null>(null);
  const [editingLabIndex, setEditingLabIndex] = useState<number | null>(null);
  const [editingDiagnosisIndex, setEditingDiagnosisIndex] = useState<number | null>(null);
  const [editingAllergyIndex, setEditingAllergyIndex] = useState<number | null>(null);
  const [editingPrescriptionIndex, setEditingPrescriptionIndex] = useState<number | null>(null);
  const [prescriptionInteractionLoadingIndex, setPrescriptionInteractionLoadingIndex] = useState<number | null>(null);
  const [prescriptionInteractionsByIndex, setPrescriptionInteractionsByIndex] = useState<Record<number, MedicationInteractionResult[]>>({});

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
    const didSave = await onSave?.();
    if (didSave !== false) {
      resetEditor();
    }
  };

  const handlePrescriptionCancel = (index: number) => {
    if (patientDetail?.prescriptions?.[index]) {
      const original = toForm({
        ...patientDetail,
        prescriptions: [patientDetail.prescriptions[index]],
      }).prescriptions[0];

      setForm((current) => ({
        ...current,
        prescriptions: current.prescriptions.map((prescription, currentIndex) =>
          currentIndex === index ? original : prescription,
        ),
      }));
    } else {
      setForm((current) => ({
        ...current,
        prescriptions: current.prescriptions.filter((_, currentIndex) => currentIndex !== index),
      }));
    }
    setEditingPrescriptionIndex(null);
  };

  const handlePrescriptionInteractionCheck = async (index: number) => {
    const prescription = form.prescriptions[index];
    if (!prescription) {
      return;
    }

    setPrescriptionInteractionLoadingIndex(index);
    let resolvedMedications = prescription.medications;

    try {
      const resolved = await Promise.all(
        prescription.medications.map(async (medication) => {
          if (medication.selectedDrug?.id) {
            return medication;
          }

          const fallbackQuery = medication.search.trim();
          if (!fallbackQuery) {
            return medication;
          }

          try {
            const safeQuery = normalizePhraseSpacing(fallbackQuery.split(",")[0] || fallbackQuery).trim();
            if (!safeQuery) {
              return medication;
            }

            const res = await fetch(`${API_URL}/api/drugs/autocomplete?q=${encodeURIComponent(safeQuery)}`);
            if (!res.ok) {
              return medication;
            }

            const json = await res.json();
            const suggestions: DrugSuggestion[] = json.data?.suggestions || [];
            const selectedDrug = suggestions[0] || null;

            return selectedDrug
              ? {
                  ...medication,
                  selectedDrug,
                  search: selectedDrug.name,
                  suggestions: [],
                }
              : medication;
          } catch {
            return medication;
          }
        }),
      );

      resolvedMedications = resolved;
      setForm((current) => ({
        ...current,
        prescriptions: updateListItem(current.prescriptions, index, {
          medications: resolved,
        }),
      }));
    } catch {
      resolvedMedications = prescription.medications;
    }

    const drugIds = Array.from(
      new Set([
        ...existingMedicationDrugIds,
        ...resolvedMedications
          .map((medication) => medication.selectedDrug?.id)
          .filter((drugId): drugId is string => Boolean(drugId)),
      ]),
    );

    if (drugIds.length < 2) {
      onError("Add at least two medications, or select valid drugs, to check interactions.");
      setPrescriptionInteractionsByIndex((current) => ({ ...current, [index]: [] }));
      setPrescriptionInteractionLoadingIndex((current) => (current === index ? null : current));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/drugs/check-interactions`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ drugIds }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        onError(errJson.error?.message || "Failed to check interactions.");
        setPrescriptionInteractionsByIndex((current) => ({ ...current, [index]: [] }));
        return;
      }

      const json = await res.json();
      const interactions = json.data?.interactions || [];
      setPrescriptionInteractionsByIndex((current) => ({
        ...current,
        [index]: interactions,
      }));
      if (interactions.length === 0) {
        onError("No known interactions found for the selected prescription drugs.");
      }
    } catch {
      onError("Failed to check interactions.");
      setPrescriptionInteractionsByIndex((current) => ({ ...current, [index]: [] }));
    } finally {
      setPrescriptionInteractionLoadingIndex((current) => (current === index ? null : current));
    }
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

      <Card variant="outlined" sx={relatedSectionSx}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {[
              { key: "details", label: "Details", count: undefined },
              { key: "visits", label: "Visits", count: form.visits.length },
              { key: "prescriptions", label: "Prescriptions", count: form.prescriptions.length },
              { key: "medications", label: "Medications", count: patientDetail?.medications?.length || 0 },
              { key: "labs", label: "Lab Results", count: form.labResults.length },
              { key: "diagnoses", label: "Diagnoses", count: form.diagnoses.length },
              { key: "allergies", label: "Allergies", count: form.allergies.length },
            ].map((page) => (
              <Button
                key={page.key}
                variant={activePage === page.key ? "contained" : "outlined"}
                onClick={() => setActivePage(page.key as RelatedPage)}
                sx={{
                  borderRadius: 999,
                  px: 1.75,
                  py: 0.85,
                  fontWeight: 700,
                  bgcolor: activePage === page.key ? "#00d4aa" : "transparent",
                  color: activePage === page.key ? "white" : "#00d4aa",
                  borderColor: "rgba(0,212,170,0.25)",
                  "&:hover": {
                    bgcolor: activePage === page.key ? "#00b894" : "rgba(0,212,170,0.08)",
                    borderColor: "rgba(0,212,170,0.35)",
                  },
                }}
              >
                {typeof page.count === "number" ? `${page.label} (${page.count})` : page.label}
              </Button>
            ))}
          </Box>
        </CardContent>
      </Card>

      {activePage === "details" ? detailsSection : null}

      {activePage === "visits" ? (
      <PatientRecordSection
        title="Visits / Appointments"
        count={form.visits.length}
        addLabel="Add Visit"
        onAdd={() => {
          ensureEditable();
          setEditingVisitIndex(0);
          setForm((current) => ({
            ...current,
            visits: [{ visitDate: "", reason: "", doctorName: "", doctorSpecialty: "" }, ...current.visits],
          }));
        }}
      >
          {form.visits.length === 0 ? <Alert severity="info">No visits recorded.</Alert> : form.visits.map((visit, index) => {
            const isEditing = editingVisitIndex === index;
            return (
              <Card key={`visit-${index}`} variant="outlined" sx={{ mb: index === form.visits.length - 1 ? 0 : 2, bgcolor: "background.default" }}>
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
      ) : null}

      {activePage === "prescriptions" ? (
      <PatientRecordSection
        title="Prescriptions"
        count={form.prescriptions.length}
        addLabel="Add Prescription"
        onAdd={() => {
          ensureEditable();
          setEditingPrescriptionIndex(0);
          setForm((current) => ({
            ...current,
            prescriptions: [{ medications: [], instructions: "", prescriptionDate: new Date().toISOString().split("T")[0], doctorName: "", doctorSpecialty: "", uploadedFileName: "", approvalStatus: "draft" }, ...current.prescriptions],
          }));
        }}
      >
          {form.prescriptions.length === 0 ? <Alert severity="info">No prescriptions recorded.</Alert> : form.prescriptions.map((prescription, index) => {
            const isEditing = editingPrescriptionIndex === index;
            return (
              <Card key={`prescription-${index}`} variant="outlined" sx={{ mb: index === form.prescriptions.length - 1 ? 0 : 2, bgcolor: "background.default" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: isEditing ? 2 : 0 }}>
                    <Box>
                      <Typography fontWeight={700}>
                        {prescription.medications.map((item) => item.selectedDrug?.name || item.search).filter(Boolean).join(", ") || "Prescription"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {prescription.prescriptionDate || "No date"}{prescription.doctorName ? ` • ${prescription.doctorName}` : ""}{prescription.doctorSpecialty ? ` (${prescription.doctorSpecialty})` : ""} • {prescription.approvalStatus === "approved" ? "Approved" : "Draft"}
                      </Typography>
                      {prescription.uploadedFileName ? (
                        <Typography variant="caption" color="text.secondary">
                          File: {prescription.uploadedFileName}
                        </Typography>
                      ) : null}
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => void handlePrescriptionInteractionCheck(index)}
                        disabled={prescriptionInteractionLoadingIndex === index}
                      >
                        {prescriptionInteractionLoadingIndex === index ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          "Check Interactions"
                        )}
                      </Button>
                      {prescription.approvalStatus !== "approved" ? (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            ensureEditable();
                            setEditingPrescriptionIndex(index);
                            void onApprovePrescription(index).then((didSave: boolean) => {
                              if (didSave) {
                                setEditingPrescriptionIndex(null);
                              }
                            });
                          }}
                        >
                          Approve
                        </Button>
                      ) : null}
                      {itemActions(
                        () => setEditingPrescriptionIndex(index),
                        () => void onDeletePrescription(index),
                        isEditing,
                      )}
                    </Box>
                  </Box>
                  {(prescriptionInteractionsByIndex[index] || []).length > 0 ? (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography fontWeight={700} sx={{ mb: 1 }}>
                        Interaction results
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {prescriptionInteractionsByIndex[index].map((interaction, interactionIndex) => (
                          <Box key={`${interaction.drug1Name}-${interaction.drug2Name}-${interactionIndex}`}>
                            <Typography variant="body2" fontWeight={600}>
                              {interaction.drug1Name} + {interaction.drug2Name} ({interaction.severity})
                            </Typography>
                            <Typography variant="body2">{interaction.description}</Typography>
                            {interaction.recommendation ? (
                              <Typography variant="caption" color="text.secondary">
                                Recommendation: {interaction.recommendation}
                              </Typography>
                            ) : null}
                          </Box>
                        ))}
                      </Box>
                    </Alert>
                  ) : null}
                  {isEditing ? (
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField fullWidth label="Prescription Date" type="date" value={prescription.prescriptionDate} onChange={(e) => setForm((current) => ({ ...current, prescriptions: updateListItem(current.prescriptions, index, { prescriptionDate: e.target.value }) }))} slotProps={{ inputLabel: { shrink: true } }} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                          fullWidth
                          select
                          label="Status"
                          value={prescription.approvalStatus}
                          onChange={(e) => setForm((current) => ({ ...current, prescriptions: updateListItem(current.prescriptions, index, { approvalStatus: e.target.value as "draft" | "approved" }) }))}
                        >
                          <MenuItem value="draft">Draft</MenuItem>
                          <MenuItem value="approved">Approved</MenuItem>
                        </TextField>
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
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Button
                          component="label"
                          variant="outlined"
                          fullWidth
                          sx={{ height: "100%" }}
                        >
                          {prescription.uploadedFileName ? `Uploaded: ${prescription.uploadedFileName}` : "Upload Prescription"}
                          <input
                            type="file"
                            hidden
                            accept=".pdf,.txt,.text"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) {
                                return;
                              }
                              void onUploadPrescriptionFile(index, file);
                              e.currentTarget.value = "";
                            }}
                          />
                        </Button>
                      </Grid>
                      <Grid size={12}>
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                          Prescription Medications
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {prescription.medications.length === 0 ? (
                            <Alert severity="info">No prescription medications yet. Add one below.</Alert>
                          ) : null}
                          {prescription.medications.map((item, medicationIndex) => (
                            <PrescriptionMedicationEditor
                              key={`prescription-${index}-medication-${medicationIndex}`}
                              item={item}
                              label="Medication"
                              disabled={saving}
                              comparisonDrugIds={[
                                ...existingMedicationDrugIds,
                                ...prescription.medications
                                  .filter((_, currentMedicationIndex) => currentMedicationIndex !== medicationIndex)
                                  .map((currentMedication) => currentMedication.selectedDrug?.id)
                                  .filter((drugId): drugId is string => Boolean(drugId)),
                              ]}
                              onChange={(patch) => {
                                setForm((current) => ({
                                  ...current,
                                  prescriptions: current.prescriptions.map((currentPrescription, currentIndex) =>
                                    currentIndex === index
                                      ? {
                                          ...currentPrescription,
                                          medications: currentPrescription.medications.map((currentMedication, currentMedicationIndex) =>
                                            currentMedicationIndex === medicationIndex
                                              ? { ...currentMedication, ...patch }
                                              : currentMedication,
                                          ),
                                        }
                                      : currentPrescription,
                                  ),
                                }));
                              }}
                              onRemove={() => {
                                setForm((current) => ({
                                  ...current,
                                  prescriptions: current.prescriptions.map((currentPrescription, currentIndex) =>
                                    currentIndex === index
                                      ? {
                                          ...currentPrescription,
                                          medications: currentPrescription.medications.filter((_, currentMedicationIndex) => currentMedicationIndex !== medicationIndex),
                                        }
                                      : currentPrescription,
                                  ),
                                }));
                              }}
                              onCancel={() => {
                                handlePrescriptionCancel(index);
                              }}
                              onDone={() => void onSavePrescription(index).then((didSave) => {
                                if (didSave) {
                                  setEditingPrescriptionIndex(null);
                                }
                              })}
                            />
                          ))}
                          <Box>
                            <Button
                              size="small"
                              startIcon={<Plus size={16} />}
                              onClick={() => {
                                setForm((current) => ({
                                  ...current,
                                  prescriptions: current.prescriptions.map((currentPrescription, currentIndex) =>
                                    currentIndex === index
                                      ? {
                                          ...currentPrescription,
                                          medications: [
                                            {
                                              selectedDrug: null,
                                              search: "",
                                              suggestions: [],
                                              dosageLevel: "medium",
                                              dosageAmount: "",
                                              startDate: prescription.prescriptionDate || "",
                                              endDate: "",
                                              notes: "",
                                            },
                                            ...currentPrescription.medications,
                                          ],
                                        }
                                      : currentPrescription,
                                  ),
                                }));
                              }}
                            >
                              Add Medication
                            </Button>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid size={12} sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                        <Button size="small" color="inherit" onClick={() => handlePrescriptionCancel(index)} disabled={saving}>
                          Cancel
                        </Button>
                        <Button
                          size="small"
                          onClick={() => void onSavePrescription(index).then((didSave) => {
                            if (didSave) {
                              setEditingPrescriptionIndex(null);
                            }
                          })}
                          disabled={saving}
                        >
                          Done
                        </Button>
                      </Grid>
                    </Grid>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
      </PatientRecordSection>
      ) : null}

      {activePage === "medications" ? medicationsSection : null}

      {activePage === "labs" ? (
      <PatientRecordSection
        title="Lab Results"
        count={form.labResults.length}
        addLabel="Add Lab Result"
        onAdd={() => {
          ensureEditable();
          setEditingLabIndex(0);
          setForm((current) => ({
            ...current,
            labResults: [{
              testName: "",
              result: "",
              date: "",
              uploadedFileName: "",
              uploadedFileMimeType: "",
              uploadedFileContent: "",
            }, ...current.labResults],
          }));
        }}
      >
          {form.labResults.length === 0 ? <Alert severity="info">No lab results recorded.</Alert> : (() => {
            const groupedByDate = form.labResults.reduce((acc, lab, index) => {
              const date = lab.date || "No date";
              if (!acc[date]) {
                acc[date] = [];
              }
              acc[date].push({ lab, index });
              return acc;
            }, {} as Record<string, Array<{ lab: typeof form.labResults[0]; index: number }>>);

            return Object.entries(groupedByDate).map(([date, items]) => (
              <Box key={date} sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <Box sx={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(15,23,42,0.1))" }} />
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 2,
                      py: 0.75,
                      borderRadius: 99,
                      bgcolor: "#f8fafc",
                      border: "1px solid rgba(15,23,42,0.09)",
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: "#334155", letterSpacing: "0.04em" }}>
                      {date}
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
                      {items.length} result{items.length === 1 ? "" : "s"}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(15,23,42,0.1), transparent)" }} />
                </Box>
                {items.map(({ lab, index }) => {
                  const isEditing = editingLabIndex === index;
                  return (
                    <Card key={`lab-${index}`} variant="outlined" sx={{ mb: 2, bgcolor: "background.default" }}>
                      <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: isEditing ? 2 : 0 }}>
                          <Box>
                            <Typography fontWeight={700}>{lab.testName || "Lab Result"}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
                              {lab.result || "-"}
                            </Typography>
                            {lab.uploadedFileName ? (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                File: {lab.uploadedFileName}
                              </Typography>
                            ) : null}
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
                              <TextField fullWidth multiline minRows={5} label="Result" value={lab.result} onChange={(e) => setForm((current) => ({ ...current, labResults: updateListItem(current.labResults, index, { result: e.target.value }) }))} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }}>
                              <TextField fullWidth label="Date" type="date" value={lab.date} onChange={(e) => setForm((current) => ({ ...current, labResults: updateListItem(current.labResults, index, { date: e.target.value }) }))} slotProps={{ inputLabel: { shrink: true } }} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 8 }}>
                              <Button component="label" variant="outlined" fullWidth>
                                {lab.uploadedFileName ? `Uploaded: ${lab.uploadedFileName}` : "Upload Lab Result File"}
                                <input
                                  hidden
                                  type="file"
                                  onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (!file) {
                                      return;
                                    }
                                    void onUploadLabResultFile(index, file);
                                    event.target.value = "";
                                  }}
                                />
                              </Button>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", alignItems: "center" }}>
                              {lab.uploadedFileContent ? (
                                <Button
                                  variant="text"
                                  onClick={() => downloadStoredFile(
                                    lab.uploadedFileName || "lab-result-file",
                                    lab.uploadedFileMimeType || "application/octet-stream",
                                    lab.uploadedFileContent,
                                  )}
                                >
                                  Download File
                                </Button>
                              ) : null}
                            </Grid>
                            <Grid size={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
                              <Button size="small" onClick={() => void handleDone(() => setEditingLabIndex(null))} disabled={saving}>Done</Button>
                            </Grid>
                          </Grid>
                        ) : lab.uploadedFileContent ? (
                          <Box sx={{ mt: 2 }}>
                            <Button
                              variant="text"
                              onClick={() => downloadStoredFile(
                                lab.uploadedFileName || "lab-result-file",
                                lab.uploadedFileMimeType || "application/octet-stream",
                                lab.uploadedFileContent,
                              )}
                            >
                              Download File
                            </Button>
                          </Box>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            ));
          })()}
      </PatientRecordSection>
      ) : null}

      {activePage === "diagnoses" ? (
      <PatientRecordSection
        title="Diagnoses"
        count={form.diagnoses.length}
        addLabel="Add Diagnosis"
        onAdd={() => {
          ensureEditable();
          setEditingDiagnosisIndex(0);
          setForm((current) => ({
            ...current,
            diagnoses: [{
              diagnosisName: "",
              date: "",
              uploadedFileName: "",
              uploadedFileMimeType: "",
              uploadedFileContent: "",
            }, ...current.diagnoses],
          }));
        }}
      >
          {form.diagnoses.length === 0 ? <Alert severity="info">No diagnoses recorded.</Alert> : form.diagnoses.map((diagnosis, index) => {
            const isEditing = editingDiagnosisIndex === index;
            return (
              <Card key={`diagnosis-${index}`} variant="outlined" sx={{ mb: index === form.diagnoses.length - 1 ? 0 : 2, bgcolor: "background.default" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: isEditing ? 2 : 0 }}>
                    <Box>
                      <Typography fontWeight={700}>{diagnosis.diagnosisName || "Diagnosis"}</Typography>
                      <Typography variant="body2" color="text.secondary">{diagnosis.date || "No date"}</Typography>
                      {diagnosis.uploadedFileName ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          File: {diagnosis.uploadedFileName}
                        </Typography>
                      ) : null}
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
                      <Grid size={{ xs: 12, md: 8 }}>
                        <Button component="label" variant="outlined" fullWidth>
                          {diagnosis.uploadedFileName ? `Uploaded: ${diagnosis.uploadedFileName}` : "Upload Diagnosis File"}
                          <input
                            hidden
                            type="file"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) {
                                return;
                              }
                              void onUploadDiagnosisFile(index, file);
                              event.target.value = "";
                            }}
                          />
                        </Button>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", alignItems: "center" }}>
                        {diagnosis.uploadedFileContent ? (
                          <Button
                            variant="text"
                            onClick={() => downloadStoredFile(
                              diagnosis.uploadedFileName || "diagnosis-file",
                              diagnosis.uploadedFileMimeType || "application/octet-stream",
                              diagnosis.uploadedFileContent,
                            )}
                          >
                            Download File
                          </Button>
                        ) : null}
                      </Grid>
                      <Grid size={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button size="small" onClick={() => void handleDone(() => setEditingDiagnosisIndex(null))} disabled={saving}>Done</Button>
                      </Grid>
                    </Grid>
                  ) : diagnosis.uploadedFileContent ? (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="text"
                        onClick={() => downloadStoredFile(
                          diagnosis.uploadedFileName || "diagnosis-file",
                          diagnosis.uploadedFileMimeType || "application/octet-stream",
                          diagnosis.uploadedFileContent,
                        )}
                      >
                        Download File
                      </Button>
                    </Box>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
      </PatientRecordSection>
      ) : null}

      {activePage === "allergies" ? (
      <PatientRecordSection
        title="Allergies"
        count={form.allergies.length}
        addLabel="Add Allergy"
        onAdd={() => {
          ensureEditable();
          setEditingAllergyIndex(0);
          setForm((current) => ({
            ...current,
            allergies: [{ allergyName: "" }, ...current.allergies],
          }));
        }}
      >
          {form.allergies.length === 0 ? <Alert severity="info">No allergies recorded.</Alert> : form.allergies.map((allergy, index) => {
            const isEditing = editingAllergyIndex === index;
            return (
              <Card key={`allergy-${index}`} variant="outlined" sx={{ mb: index === form.allergies.length - 1 ? 0 : 2, bgcolor: "background.default" }}>
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
      ) : null}
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
      current.map((patient) => (
        patient.id === patientId
          ? { ...patient, is_favorite: isFavorite }
          : patient
      )),
    );
    setSelectedPatient((current) => (
      current && current.id === patientId
        ? { ...current, is_favorite: isFavorite }
        : current
    ));
  }, []);

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
    if (!email || !email.includes("@")) {
      setError("Enter a valid patient email.");
      return;
    }

    setRequestSearchLoading(true);
    setRequestSearchResult(null);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/patients/access-requests/search?email=${encodeURIComponent(email)}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error?.message || "Failed to search patient by email");
      }
      setRequestSearchResult(json?.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search patient by email.");
    } finally {
      setRequestSearchLoading(false);
    }
  }, [patientEmailSearch]);

  const handleRequestAccess = useCallback(async () => {
    const email = requestSearchResult?.email || patientEmailSearch.trim().toLowerCase();
    if (!email) {
      return;
    }

    setRequestSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/patients/access-requests`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error?.message || "Failed to send access request");
      }
      setSuccess(json?.data?.message || "Access request sent.");
      setRequestSearchResult((current) => current ? { ...current, requestStatus: "pending" } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send access request.");
    } finally {
      setRequestSubmitting(false);
    }
  }, [patientEmailSearch, requestSearchResult]);

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
    setActivePatientPage("details");
    setIsCreating(true);
    setFormOpen(true);
    setError("");
  };

  const startEditDialog = () => {
    if (!selectedPatient) {
      return;
    }
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
        allergies: form.allergies.map((allergy) => ({
          allergyName: allergy.allergyName || undefined,
        })),
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

  const handlePrescriptionSubmit = async (prescriptionIndex: number, forcedApprovalStatus?: "draft" | "approved") => {
    if (!selectedPatient) {
      return false;
    }

    const prescription = form.prescriptions[prescriptionIndex];
    if (!prescription) {
      return false;
    }

    if (!prescription.prescriptionDate) {
      setError("Prescription date is required.");
      return false;
    }

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
            ? {
                name: prescription.doctorName || undefined,
                specialty: prescription.doctorSpecialty || undefined,
              }
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
    if (!selectedPatient) {
      return;
    }

    const prescription = form.prescriptions[prescriptionIndex];
    if (!prescription?.id) {
      setForm((current) => ({
        ...current,
        prescriptions: current.prescriptions.filter((_, currentIndex) => currentIndex !== prescriptionIndex),
      }));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/patients/${selectedPatient.id}/prescriptions/${prescription.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

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

  const handlePrescriptionApprove = async (prescriptionIndex: number) => {
    setForm((current) => ({
      ...current,
      prescriptions: updateListItem(current.prescriptions, prescriptionIndex, { approvalStatus: "approved" }),
    }));
    return handlePrescriptionSubmit(prescriptionIndex, "approved");
  };

  const resolveDrugSuggestion = async (query: string): Promise<DrugSuggestion | null> => {
    const safeQuery = normalizePhraseSpacing(query.split(",")[0] || query).trim();
    if (!safeQuery) {
      return null;
    }

    try {
      const res = await fetch(`${API_URL}/api/drugs/autocomplete?q=${encodeURIComponent(safeQuery)}`);
      if (!res.ok) {
        return null;
      }
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
      const nextPrescriptionDate =
        parsed.prescriptionDate ||
        form.prescriptions[prescriptionIndex]?.prescriptionDate ||
        "";
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

      setForm((current) => ({
        ...current,
        labResults: updateListItem(current.labResults, labIndex, {
          uploadedFileName: file.name,
          uploadedFileMimeType: file.type || "application/octet-stream",
          uploadedFileContent: dataUrl,
          testName: parsed.testName || current.labResults[labIndex]?.testName || "",
          result: parsed.result || current.labResults[labIndex]?.result || "",
          date: parsed.date || current.labResults[labIndex]?.date || "",
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

      setForm((current) => ({
        ...current,
        diagnoses: updateListItem(current.diagnoses, diagnosisIndex, {
          uploadedFileName: file.name,
          uploadedFileMimeType: file.type || "application/octet-stream",
          uploadedFileContent: dataUrl,
          diagnosisName: parsed.diagnosisName || current.diagnoses[diagnosisIndex]?.diagnosisName || "",
          date: parsed.date || current.diagnoses[diagnosisIndex]?.date || "",
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
      <Box>
        <Snackbar
          open={!!error}
          autoHideDuration={5000}
          onClose={() => setError("")}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          sx={bottomSnackbarSx}
        >
          <Alert onClose={() => setError("")} severity="error" variant="filled" sx={{ width: "100%" }}>
            {error}
          </Alert>
        </Snackbar>
        <Snackbar
          open={!!success}
          autoHideDuration={3500}
          onClose={() => setSuccess("")}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          sx={bottomSnackbarSx}
        >
          <Alert onClose={() => setSuccess("")} severity="success" variant="filled" sx={{ width: "100%" }}>
            {success}
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
                sx={{ px: 0, mb: 1, color: "#00d4aa" }}
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
              {selectedPatient ? (
                <IconButton
                  onClick={() => void toggleFavorite(selectedPatient.id, !selectedPatient.is_favorite)}
                  title={selectedPatient.is_favorite ? "Remove favorite" : "Add favorite"}
                  sx={{
                    color: selectedPatient.is_favorite ? "#f59e0b" : "#94a3b8",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Star size={18} fill={selectedPatient.is_favorite ? "currentColor" : "none"} />
                </IconButton>
              ) : null}
              {!isEditing ? (
                <Button variant="outlined" startIcon={<Edit2 size={16} />} onClick={startEditDialog}>
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
                    color="primary"
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
                {selectedPatient ? (
                  <>
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
                      onApprovePrescription={handlePrescriptionApprove}
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
                                <TextField fullWidth label="Date of Birth" type="date" value={form.dateOfBirth} slotProps={{ inputLabel: { shrink: true } }} disabled />
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
                                <TextField
                                  fullWidth
                                  multiline
                                  minRows={3}
                                  label="Medical History"
                                  value={form.medicalHistory || "-"}
                                  disabled
                                />
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
            {canRequestInsteadOfCreate
              ? "Search for a patient by email and request organization access once they approve."
              : "Manage patient profiles and their medications"}
          </Typography>
        </Box>
        {canDirectlyCreatePatients ? (
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={startCreate} sx={{ position: "relative", zIndex: 1, bgcolor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>
            Add Patient
          </Button>
        ) : null}
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={bottomSnackbarSx}
      >
        <Alert onClose={() => setError("")} severity="error" variant="filled" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!success}
        autoHideDuration={3500}
        onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={bottomSnackbarSx}
      >
        <Alert onClose={() => setSuccess("")} severity="success" variant="filled" sx={{ width: "100%" }}>
          {success}
        </Alert>
      </Snackbar>

      {canRequestInsteadOfCreate ? (
        <Card sx={{ mb: 2.5 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
                  Request Patient Access
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Search using the patient&apos;s email. After the patient approves, your organization will be able to view their records.
                </Typography>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) auto" }, gap: 1.5 }}>
                <TextField
                  label="Patient Email"
                  value={patientEmailSearch}
                  onChange={(event) => setPatientEmailSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handlePatientEmailSearch();
                    }
                  }}
                  placeholder="jane.doe@example.com"
                />
                <Button variant="contained" onClick={() => void handlePatientEmailSearch()} disabled={requestSearchLoading}>
                  {requestSearchLoading ? <CircularProgress size={20} color="inherit" /> : "Search"}
                </Button>
              </Box>
              {requestSearchResult ? (
                <Box sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "background.default", display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
                  <Box>
                    <Typography fontWeight={700}>{requestSearchResult.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{requestSearchResult.email}</Typography>
                    <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {requestSearchResult.alreadyAccessible ? (
                        <Chip label="Already Accessible" color="success" size="small" />
                      ) : requestSearchResult.requestStatus ? (
                        <Chip
                          label={`Request ${requestSearchResult.requestStatus}`}
                          size="small"
                          color={requestSearchResult.requestStatus === "approved" ? "success" : requestSearchResult.requestStatus === "rejected" ? "error" : "warning"}
                        />
                      ) : (
                        <Chip label="No request yet" size="small" />
                      )}
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={() => void handleRequestAccess()}
                    disabled={requestSubmitting || requestSearchResult.alreadyAccessible || requestSearchResult.requestStatus === "pending"}
                  >
                    {requestSubmitting ? <CircularProgress size={18} color="inherit" /> : requestSearchResult.requestStatus === "rejected" ? "Request Again" : "Request Approval"}
                  </Button>
                </Box>
              ) : null}
            </Box>
          </CardContent>
        </Card>
      ) : null}

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: 2 }}>
          <TextField
            fullWidth
            placeholder="Search patients by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            size="small"
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.paper" } }}
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
                      <Box sx={{ p: 2, borderRadius: 3, bgcolor: "action.hover" }}><Users size={40} color="#94a3b8" /></Box>
                      <Typography color="text.secondary" fontWeight={500}>
                        {search
                          ? "No patients match your search."
                          : canRequestInsteadOfCreate
                            ? "No approved patient access yet. Search by patient email and request approval above."
                            : "No patients yet. Add your first patient."}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow key={patient.id} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(0,212,170,0.12)", color: "#00d4aa", fontSize: 13, fontWeight: 700 }}>
                          {patient.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                        </Avatar>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography fontWeight={600}>{patient.name}</Typography>
                          {patient.is_favorite ? (
                            <Star size={14} fill="#f59e0b" color="#f59e0b" />
                          ) : null}
                        </Box>
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
                        <IconButton
                          size="small"
                          onClick={() => void toggleFavorite(patient.id, !patient.is_favorite)}
                          title={patient.is_favorite ? "Remove favorite" : "Add favorite"}
                          sx={{ color: patient.is_favorite ? "#f59e0b" : "#94a3b8" }}
                        >
                          <Star size={16} fill={patient.is_favorite ? "currentColor" : "none"} />
                        </IconButton>
                        <IconButton size="small" onClick={() => viewPatient(patient.id, false)} title="View" sx={{ color: "#00d4aa" }}><Eye size={16} /></IconButton>
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

      <Dialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setIsCreating(false);
          setForm(selectedPatient && !isCreating ? toForm(selectedPatient) : emptyForm);
        }}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              overflow: "hidden",
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{isCreating ? "Add New Patient" : "Edit Patient"}</DialogTitle>
        <DialogContent sx={{ position: "relative", pointerEvents: "auto" }}>
          <Grid container spacing={2} sx={{ mt: 0.5, position: "relative", zIndex: 1 }}>
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
            {isCreating ? (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required helperText="Minimum 8 characters" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Confirm Password" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
                </Grid>
              </>
            ) : null}
          </Grid>

          {isCreating ? (
            <Alert severity="info" sx={{ mt: 3 }}>
              Create the patient first, then add visits, prescriptions, medications, labs, diagnoses, and allergies from the patient record page.
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setFormOpen(false);
              setIsCreating(false);
              setForm(selectedPatient && !isCreating ? toForm(selectedPatient) : emptyForm);
            }}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={formLoading} color="primary">
            {formLoading ? <CircularProgress size={20} /> : isCreating ? "Create" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={bottomSnackbarSx}
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
