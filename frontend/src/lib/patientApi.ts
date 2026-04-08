const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface PatientMedicationRecord {
  id: string;
  drug_name: string;
  drug_id: string;
  dosage_level: string;
  dosage_amount: string;
  start_date: string;
  end_date: string | null;
  notes: string;
}

export interface PatientVisitRecord {
  id?: string;
  visit_date: string;
  reason: string;
  doctor_id?: string | null;
  doctor_name?: string | null;
  doctor_specialty?: string | null;
}

export interface PatientLabRecord {
  id?: string;
  test_name: string;
  result: string;
  date: string;
  uploaded_file_name?: string | null;
  uploaded_file_mime_type?: string | null;
  uploaded_file_content?: string | null;
}

export interface PatientDiagnosisRecord {
  id?: string;
  diagnosis_name: string;
  date: string;
  uploaded_file_name?: string | null;
  uploaded_file_mime_type?: string | null;
  uploaded_file_content?: string | null;
}

export interface PatientAllergyRecord {
  id?: string;
  allergy_name: string;
}

export interface PatientDocumentRecord {
  id?: string;
  title: string;
  document_type?: string | null;
  uploaded_file_name: string;
  uploaded_file_mime_type?: string | null;
  uploaded_file_content: string;
  uploaded_by?: string | null;
  created_at?: string | null;
}

export interface PatientPrescriptionRecord {
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

export interface PatientDetailApi {
  id: string;
  user_id?: string;
  name: string;
  date_of_birth: string;
  gender?: string | null;
  age_group: string;
  medical_history: string[];
  created_at: string;
  medications: PatientMedicationRecord[];
  visits: PatientVisitRecord[];
  labResults: PatientLabRecord[];
  diagnoses: PatientDiagnosisRecord[];
  allergies: PatientAllergyRecord[];
  prescriptions: PatientPrescriptionRecord[];
  documents: PatientDocumentRecord[];
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export async function fetchCurrentPatientDetail(): Promise<PatientDetailApi> {
  const listRes = await fetch(`${API_URL}/api/patients?limit=1&offset=0`, {
    headers: getAuthHeaders(),
  });

  if (!listRes.ok) {
    throw new Error("Failed to load patient");
  }

  const listJson = await listRes.json();
  const patient = listJson.data?.patients?.[0];

  if (!patient?.id) {
    throw new Error("No patient record found");
  }

  const detailRes = await fetch(`${API_URL}/api/patients/${patient.id}`, {
    headers: getAuthHeaders(),
  });

  if (!detailRes.ok) {
    throw new Error("Failed to load patient details");
  }

  const detailJson = await detailRes.json();
  return detailJson.data as PatientDetailApi;
}

export interface AnalyticsData {
  populationTrend: Array<{
    month: string;
    "Low Risk": number;
    "Med Risk": number;
    "High Risk": number;
  }>;
  sideEffectsDist: Array<{
    name: string;
    value: number;
  }>;
  activePatients: string;
  avgAdherenceRate: string;
  criticalRiskAlerts: string;
  predictedAdmissions: string;
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch(`${API_URL}/api/analytics`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to load analytics");
  }

  const json = await res.json();
  return json.data as AnalyticsData;
}
