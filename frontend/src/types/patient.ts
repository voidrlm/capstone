export interface Patient {
  id: string;
  name: string;
  date_of_birth: string;
  gender?: string | null;
  age_group: string;
  medical_history: string[];
  created_at: string;
  is_favorite?: boolean;
}

export interface PatientVisit {
  id?: string;
  visit_date: string;
  reason: string;
  doctor_id?: string | null;
  doctor_name?: string | null;
  doctor_specialty?: string | null;
}

export interface LabResult {
  id?: string;
  test_name: string;
  result: string;
  date: string;
  uploaded_file_name?: string | null;
  uploaded_file_mime_type?: string | null;
  uploaded_file_content?: string | null;
}

export interface Diagnosis {
  id?: string;
  diagnosis_name: string;
  date: string;
  uploaded_file_name?: string | null;
  uploaded_file_mime_type?: string | null;
  uploaded_file_content?: string | null;
}

export interface Allergy {
  id?: string;
  allergy_name: string;
}

export interface Prescription {
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

export interface PatientDetail extends Patient {
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

export type RelatedPage = "details" | "visits" | "prescriptions" | "medications" | "labs" | "diagnoses" | "allergies";

export interface PatientForm {
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
    prescriptionDate: string;
    uploadedFileName: string;
    uploadedFileMimeType: string;
    uploadedFileContent: string;
  }[];
}

export interface DrugSuggestion {
  id: string;
  name: string;
  generic_name?: string | null;
}

export interface PatientAccessSearchResult {
  patientId: string;
  patientUserId: string;
  name: string;
  email: string;
  alreadyAccessible: boolean;
  requestStatus: "pending" | "approved" | "rejected" | null;
}

export interface MedicationInteractionResult {
  drug1Name: string;
  drug2Name: string;
  severity: "high" | "medium" | "low";
  description: string;
  recommendation?: string;
}

export interface MedicationDialogForm {
  id?: string;
  selectedDrug: DrugSuggestion | null;
  search: string;
  suggestions: DrugSuggestion[];
  dosageLevel: string;
  dosageAmount: string;
  startDate: string;
  endDate: string;
  notes: string;
}
