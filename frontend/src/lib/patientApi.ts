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
  vaccinations: { id: string; vaccine_name: string; administered_date: string | null; dose: string | null; document_id: string | null }[];
  insuranceEOBs: { id: string; insurer_name: string | null; plan_name: string | null; member_id: string | null; statement_date: string | null; service_date: string | null; total_billed: string | null; total_allowed: string | null; plan_paid: string | null; your_responsibility: string | null; claim_reference: string | null; document_id: string | null }[];
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

export interface ProviderDashboardData {
  overview: {
    totalPatients: number;
    activeMedications: number;
    storedDocuments: number;
    pendingAccessRequests: number;
  };
  recentPatients: Array<{
    id: string;
    name: string;
    date_of_birth: string;
    created_at: string;
    risk_level: string;
    last_assessment: string | null;
    medications: number;
  }>;
  riskDistribution: Array<{
    name: string;
    value: number;
  }>;
  medicationCategories: Array<{
    name: string;
    value: number;
  }>;
  pendingRequests: Array<{
    id: string;
    patient_name: string;
    requested_by_name: string;
    organization_name: string;
    created_at: string;
  }>;
}

export async function fetchProviderDashboard(): Promise<ProviderDashboardData> {
  const res = await fetch(`${API_URL}/api/analytics/dashboard`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to load provider dashboard");
  }

  const json = await res.json();
  return json.data as ProviderDashboardData;
}

export interface DrugInteraction {
  drug1Id: string;
  drug1Name: string;
  drug2Id: string;
  drug2Name: string;
  severity: "high" | "medium" | "low";
  description: string;
  recommendation: string;
}

export async function checkDrugInteractions(drugIds: string[]): Promise<DrugInteraction[]> {
  const res = await fetch(`${API_URL}/api/drugs/check-interactions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ drugIds }),
  });

  if (!res.ok) {
    throw new Error("Failed to check drug interactions");
  }

  const json = await res.json();
  return json.data.interactions as DrugInteraction[];
}

export interface DrugDetail {
  id: string;
  name: string;
  openfda_id: string;
  generic_name: string;
  category: string;
  manufacturer_name: string;
  manufacturer_names: string[];
  route: string;
  product_type: string;
  set_id: string;
  version: string;
  effective_time: string;
  uses: string[];
  warnings: string[];
  dosage_info: string;
  active_ingredients: string;
  inactive_ingredients: string;
  pregnancy: string;
  overdosage: string | null;
  description: string | null;
  how_supplied: string | null;
  geriatric_use: string | null;
  pediatric_use: string | null;
  clinical_studies: string | null;
  pharmacodynamics: string | null;
  pharmacokinetics: string | null;
  adverse_reactions: string | null;
  mechanism_of_action: string | null;
  recent_major_changes: string | null;
  clinical_pharmacology: string | null;
  indications_and_usage: string;
  warnings_and_cautions: string | null;
  nonclinical_toxicology: string | null;
  information_for_patients: string | null;
  spl_unclassified_section: string | null;
  purpose: string;
  dosage_and_administration: string;
  spl_product_data_elements: string;
  dosage_forms_and_strengths: string | null;
  use_in_specific_populations: string | null;
  package_label_principal_display_panel: string;
  carcinogenesis_and_mutagenesis_and_impairment_of_fertility: string | null;
  drug_contraindications: string | null;
  drug_interactions: string | null;
  dependence: string | null;
  do_not_use: string;
  stop_use: string;
  general_precautions: string | null;
  openfda_fetched_at: string;
  scraped_date: string;
  created_at: string;
  sideEffects: {
    high: Array<{
      id: string;
      drug_id: string;
      effect_name: string;
      risk_level: "high";
      frequency: "common" | "uncommon" | "rare";
      description: string;
    }>;
    medium: Array<{
      id: string;
      drug_id: string;
      effect_name: string;
      risk_level: "medium";
      frequency: "common" | "uncommon" | "rare";
      description: string;
    }>;
    low: Array<{
      id: string;
      drug_id: string;
      effect_name: string;
      risk_level: "low";
      frequency: "common" | "uncommon" | "rare";
      description: string;
    }>;
  };
  interactions: Array<{
    id: string;
    drug_id_1: string;
    drug_id_2: string;
    severity: "high" | "medium" | "low";
    description: string;
    recommendation: string;
  }>;
}

export async function fetchDrugDetails(drugId: string): Promise<DrugDetail> {
  const res = await fetch(`${API_URL}/api/drugs/${drugId}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch drug details");
  }

  const json = await res.json();
  return json.data.drug as DrugDetail;
}

export async function updateMedicationEndDate(medicationId: string, endDate: string): Promise<void> {
  const patientRes = await fetch(`${API_URL}/api/patients?limit=1&offset=0`, {
    headers: getAuthHeaders(),
  });

  if (!patientRes.ok) {
    throw new Error("Failed to load patient");
  }

  const patientJson = await patientRes.json();
  const patient = patientJson.data?.patients?.[0];

  if (!patient?.id) {
    throw new Error("No patient record found");
  }

  const res = await fetch(`${API_URL}/api/patients/${patient.id}/medications/${medicationId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ end_date: endDate }),
  });

  if (!res.ok) {
    throw new Error("Failed to update medication");
  }
}
