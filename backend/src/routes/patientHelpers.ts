import { getClient, query } from "../db/index.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

export { getClient };

type DbClient = Awaited<ReturnType<typeof getClient>>;
type ColumnSet = Set<string>;

let patientColumnsPromise: Promise<ColumnSet> | null = null;
let organizationMemberColumnsPromise: Promise<ColumnSet> | null = null;
let patientVisitColumnsPromise: Promise<ColumnSet> | null = null;
let patientDiagnosisColumnsPromise: Promise<ColumnSet> | null = null;
let patientLabResultColumnsPromise: Promise<ColumnSet> | null = null;
let legacyLabResultColumnsPromise: Promise<ColumnSet> | null = null;

async function getTableColumns(tableName: string): Promise<ColumnSet> {
  const result = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName],
  );

  return new Set(result.rows.map((row) => row.column_name));
}

async function getPatientColumns(): Promise<ColumnSet> {
  if (!patientColumnsPromise) {
    patientColumnsPromise = getTableColumns("patients");
    patientColumnsPromise.catch(() => { patientColumnsPromise = null; });
  }

  return patientColumnsPromise;
}

async function getOrganizationMemberColumns(): Promise<ColumnSet> {
  if (!organizationMemberColumnsPromise) {
    organizationMemberColumnsPromise = getTableColumns("organization_members");
    organizationMemberColumnsPromise.catch(() => { organizationMemberColumnsPromise = null; });
  }

  return organizationMemberColumnsPromise;
}

async function getPatientVisitColumns(): Promise<ColumnSet> {
  if (!patientVisitColumnsPromise) {
    patientVisitColumnsPromise = getTableColumns("patient_visits");
    patientVisitColumnsPromise.catch(() => { patientVisitColumnsPromise = null; });
  }

  return patientVisitColumnsPromise;
}

async function getPatientDiagnosisColumns(): Promise<ColumnSet> {
  if (!patientDiagnosisColumnsPromise) {
    patientDiagnosisColumnsPromise = getTableColumns("patient_diagnoses");
    patientDiagnosisColumnsPromise.catch(() => { patientDiagnosisColumnsPromise = null; });
  }

  return patientDiagnosisColumnsPromise;
}

async function getPatientLabResultColumns(): Promise<ColumnSet> {
  if (!patientLabResultColumnsPromise) {
    patientLabResultColumnsPromise = getTableColumns("patient_lab_results");
    patientLabResultColumnsPromise.catch(() => { patientLabResultColumnsPromise = null; });
  }

  return patientLabResultColumnsPromise;
}

async function getLegacyLabResultColumns(): Promise<ColumnSet> {
  if (!legacyLabResultColumnsPromise) {
    legacyLabResultColumnsPromise = getTableColumns("lab_results");
    legacyLabResultColumnsPromise.catch(() => { legacyLabResultColumnsPromise = null; });
  }

  return legacyLabResultColumnsPromise;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AgeGroup = "young" | "middle" | "elderly";

type NestedDoctorInput = {
  id?: string | null;
  name?: string | null;
  specialty?: string | null;
};

type VisitInput = {
  visitDate?: string | null;
  reason?: string | null;
  doctorId?: string | null;
  doctor?: NestedDoctorInput | null;
};

type LabResultInput = {
  testName?: string | null;
  result?: string | null;
  date?: string | null;
  uploadedFileName?: string | null;
  uploadedFileMimeType?: string | null;
  uploadedFileContent?: string | null;
};

type DiagnosisInput = {
  diagnosisName?: string | null;
  date?: string | null;
  uploadedFileName?: string | null;
  uploadedFileMimeType?: string | null;
  uploadedFileContent?: string | null;
};

type AllergyInput = {
  allergyName?: string | null;
};

type PatientDocumentInput = {
  title?: string | null;
  documentType?: string | null;
  uploadedFileName?: string | null;
  uploadedFileMimeType?: string | null;
  uploadedFileContent?: string | null;
};

type PrescriptionInput = {
  medication?: string | null;
  medications?: Array<{
    drugId?: string | null;
    medicationName?: string | null;
    dosageLevel?: string | null;
    dosageAmount?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    notes?: string | null;
  }> | null;
  prescriptionDate?: string | null;
  instructions?: string | null;
  drugId?: string | null;
  doctorId?: string | null;
  doctor?: NestedDoctorInput | null;
  uploadedFileName?: string | null;
  approvalStatus?: string | null;
};

type NormalizedPrescriptionMedication = {
  drugId: string | null;
  medicationName: string;
  dosageLevel: string | null;
  dosageAmount: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
};

type NormalizedPrescriptionInput = {
  doctorId: string | null;
  doctor: NestedDoctorInput | null;
  medications: NormalizedPrescriptionMedication[];
  prescriptionDate: string;
  instructions: string | null;
  uploadedFileName: string | null;
  approvalStatus: "draft" | "approved";
};

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function calculateAgeGroup(dateOfBirth: string): AgeGroup {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  if (age < 35) return "young";
  if (age < 60) return "middle";
  return "elderly";
}

function isProviderOrAdmin(role: string): boolean {
  return role === "provider" || role === "doctor" || role === "nurse" || role === "admin" || role === "org_admin";
}

function canUseOrganizationScopedPatients(role: string): boolean {
  return role === "provider" || role === "doctor" || role === "nurse" || role === "org_admin";
}

async function getPatientSelectFields(alias?: string): Promise<string> {
  const columns = await getPatientColumns();
  const prefix = alias ? `${alias}.` : "";

  return [
    `${prefix}id`,
    `${prefix}user_id`,
    `${prefix}name`,
    `${prefix}date_of_birth`,
    `${prefix}gender`,
    columns.has("blood_type") ? `${prefix}blood_type` : "NULL::text AS blood_type",
    `${prefix}created_by`,
  ].join(", ");
}

function canFavoritePatients(role: string): boolean {
  return role === "doctor" || role === "nurse";
}

function canRequestPatientAccess(role: string): boolean {
  return role === "doctor" || role === "nurse";
}

async function getUserOrganizationIds(client: DbClient, userId: string): Promise<string[]> {
  const organizationIds = new Set<string>();

  const membershipResult = await client.query<{ organization_id: string }>(
    `SELECT organization_id
     FROM organization_members
     WHERE user_id = $1 AND status = 'active'`,
    [userId],
  );

  for (const row of membershipResult.rows) {
    if (row.organization_id) {
      organizationIds.add(String(row.organization_id));
    }
  }

  const userResult = await client.query<{ organization_id: string | null }>(
    `SELECT organization_id
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId],
  );

  const primaryOrganizationId = userResult.rows[0]?.organization_id;
  if (primaryOrganizationId) {
    organizationIds.add(String(primaryOrganizationId));
  }

  return Array.from(organizationIds);
}

async function getPatientOrganizationIds(client: DbClient, patientId: string): Promise<string[]> {
  const result = await client.query<{ organization_id: string }>(
    `SELECT organization_id
     FROM patient_organizations
     WHERE patient_id = $1`,
    [patientId],
  );

  return result.rows.map((row) => String(row.organization_id));
}

async function getPrimaryOrganizationId(client: DbClient, userId: string): Promise<string | null> {
  const userResult = await client.query<{ organization_id: string | null }>(
    `SELECT organization_id
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId],
  );

  const primaryOrganizationId = userResult.rows[0]?.organization_id;
  if (primaryOrganizationId) {
    return String(primaryOrganizationId);
  }

  const membershipResult = await client.query<{ organization_id: string }>(
    `SELECT organization_id
     FROM organization_members
     WHERE user_id = $1 AND status = 'active'
     ORDER BY joined_at NULLS LAST, created_at
     LIMIT 1`,
    [userId],
  );

  return membershipResult.rows[0]?.organization_id ?? null;
}

async function findPatientByEmail(client: DbClient, email: string) {
  return client.query<{
    patient_id: string;
    patient_user_id: string;
    patient_name: string;
    patient_email: string;
  }>(
    `SELECT p.id AS patient_id,
            u.id AS patient_user_id,
            p.name AS patient_name,
            u.email AS patient_email
     FROM users u
     INNER JOIN patients p ON p.user_id = u.id
     WHERE LOWER(u.email) = LOWER($1)
       AND u.role = 'patient'
     LIMIT 1`,
    [email],
  );
}

async function ensurePatientNotificationsTable(client: DbClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS patient_notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      patient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
      type VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      metadata JSONB,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function ensurePatientOrganizationLink(
  client: DbClient,
  patientId: string,
  organizationId: string | null,
  linkedBy: string,
) {
  if (!organizationId) {
    return;
  }

  await client.query(
    `INSERT INTO patient_organizations (patient_id, organization_id, linked_by)
     VALUES ($1, $2, $3)
     ON CONFLICT (patient_id, organization_id) DO NOTHING`,
    [patientId, organizationId, linkedBy],
  );
}

async function canAccessPatient(user: NonNullable<AuthenticatedRequest["user"]>, patientId: string): Promise<boolean> {
  const client = await getClient();

  try {
    const patientResult = await client.query<{ user_id: string | null }>(
      `SELECT user_id
       FROM patients
       WHERE id = $1
       LIMIT 1`,
      [patientId],
    );

    if (patientResult.rows.length === 0) {
      return false;
    }

    const patientUserId = patientResult.rows[0]?.user_id ?? null;
    if (user.role === "admin") {
      return true;
    }

    if (user.role === "patient") {
      return patientUserId === user.sub;
    }

    if (canUseOrganizationScopedPatients(user.role)) {
      const [userOrganizationIds, patientOrganizationIds] = await Promise.all([
        getUserOrganizationIds(client, user.sub),
        getPatientOrganizationIds(client, patientId),
      ]);

      return userOrganizationIds.some((organizationId) =>
        patientOrganizationIds.includes(organizationId),
      );
    }

    return false;
  } finally {
    client.release();
  }
}

function ensureDate(value: string | null | undefined, fieldName: string) {
  if (!value) {
    throw new Error(`${fieldName} is required`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return parsed;
}

export async function getAccessiblePatientOrThrow(user: AuthenticatedRequest["user"], patientId: string) {
  if (!user) {
    throw new Error("Unauthorized");
  }

  const hasAccess = await canAccessPatient(user, patientId);
  if (!hasAccess) {
    throw new Error("Forbidden");
  }

  const patientSelectFields = await getPatientSelectFields();
  const patientResult = await query(
    `SELECT ${patientSelectFields}
     FROM patients
     WHERE id = $1`,
    [patientId],
  );

  if (patientResult.rows.length === 0) {
    return null;
  }

  return patientResult.rows[0];
}

export async function getPatientDetail(patientId: string, _user: AuthenticatedRequest["user"]) {
  const patientSelectFields = await getPatientSelectFields("p");
  const [visitColumns, diagnosisColumns, labResultColumns, legacyLabResultColumns] = await Promise.all([
    getPatientVisitColumns(),
    getPatientDiagnosisColumns(),
    getPatientLabResultColumns(),
    getLegacyLabResultColumns(),
  ]);
  const patientResult = await query(
    `SELECT ${patientSelectFields}
     FROM patients p
     WHERE p.id = $1`,
    [patientId],
  );

  if (patientResult.rows.length === 0) {
    return null;
  }

  const patient = patientResult.rows[0];

  const visitDoctorNameSelect = visitColumns.has("doctor_name")
    ? "v.doctor_name"
    : "d.name AS doctor_name";
  const visitDoctorSpecialtySelect = visitColumns.has("doctor_specialty")
    ? "v.doctor_specialty"
    : "d.specialty AS doctor_specialty";
  const visitDoctorJoin = visitColumns.has("doctor_name") || visitColumns.has("doctor_specialty")
    ? ""
    : "LEFT JOIN doctors d ON d.id = v.doctor_id";

  const hasModernLabTable = labResultColumns.size > 0;
  const labTableName = hasModernLabTable ? "patient_lab_results" : "lab_results";
  const labDateColumn = hasModernLabTable
    ? (labResultColumns.has("date") ? "lr.date" : "lr.result_date")
    : "lr.result_date";
  const labReferenceRangeSelect = hasModernLabTable && labResultColumns.has("reference_range")
    ? "lr.reference_range"
    : "NULL::text AS reference_range";
  const labUploadedFileNameSelect = hasModernLabTable && labResultColumns.has("uploaded_file_name")
    ? "lr.uploaded_file_name"
    : legacyLabResultColumns.has("uploaded_file_name")
      ? "lr.uploaded_file_name"
      : "NULL::text AS uploaded_file_name";
  const labUploadedFileMimeTypeSelect = hasModernLabTable && labResultColumns.has("uploaded_file_mime_type")
    ? "lr.uploaded_file_mime_type"
    : legacyLabResultColumns.has("uploaded_file_mime_type")
      ? "lr.uploaded_file_mime_type"
      : "NULL::text AS uploaded_file_mime_type";
  const labUploadedFileContentSelect = hasModernLabTable && labResultColumns.has("uploaded_file_content")
    ? "lr.uploaded_file_content"
    : legacyLabResultColumns.has("uploaded_file_content")
      ? "lr.uploaded_file_content"
      : "NULL::text AS uploaded_file_content";

  const diagnosisDateSelect = diagnosisColumns.has("date")
    ? "pd.date"
    : "pd.diagnosis_date AS date";
  const diagnosisUploadedFileNameSelect = diagnosisColumns.has("uploaded_file_name")
    ? "pd.uploaded_file_name"
    : "NULL::text AS uploaded_file_name";
  const diagnosisUploadedFileMimeTypeSelect = diagnosisColumns.has("uploaded_file_mime_type")
    ? "pd.uploaded_file_mime_type"
    : "NULL::text AS uploaded_file_mime_type";
  const diagnosisUploadedFileContentSelect = diagnosisColumns.has("uploaded_file_content")
    ? "pd.uploaded_file_content"
    : "NULL::text AS uploaded_file_content";

  // Fetch all related data
  const [medications, visits, labResults, diagnoses, allergies, documents, prescriptions, vaccinations, dischargeSummaries, insuranceEOBs] = await Promise.all([
    query(
      `SELECT pm.id, pm.drug_id, d.name AS drug_name, pm.dosage_level, pm.dosage_amount,
              pm.start_date, pm.end_date, pm.notes, pm.created_at
       FROM patient_medications pm
       LEFT JOIN drugs d ON d.id = pm.drug_id
       WHERE pm.patient_id = $1
       ORDER BY pm.created_at DESC`,
      [patientId],
    ).catch((err) => { console.error("Failed to fetch medications:", err); return { rows: [] }; }),
    query(
      `SELECT v.id, v.visit_date, v.reason, ${visitDoctorNameSelect}, ${visitDoctorSpecialtySelect}, v.created_at
       FROM patient_visits v
       ${visitDoctorJoin}
       WHERE v.patient_id = $1
       ORDER BY v.visit_date DESC`,
      [patientId],
    ).catch((err) => { console.error("Failed to fetch visits:", err); return { rows: [] }; }),
    query(
      `SELECT lr.id, lr.test_name, lr.result, ${labDateColumn} AS date, ${labReferenceRangeSelect},
              ${labUploadedFileNameSelect}, ${labUploadedFileMimeTypeSelect}, ${labUploadedFileContentSelect}, lr.created_at
       FROM ${labTableName} lr
       WHERE lr.patient_id = $1
       ORDER BY ${labDateColumn} DESC`,
      [patientId],
    ).catch((err) => { console.error("Failed to fetch lab results:", err); return { rows: [] }; }),
    query(
      `SELECT pd.id, pd.diagnosis_name, ${diagnosisDateSelect}, ${diagnosisUploadedFileNameSelect},
              ${diagnosisUploadedFileMimeTypeSelect}, ${diagnosisUploadedFileContentSelect}, pd.created_at
       FROM patient_diagnoses pd
       WHERE pd.patient_id = $1
       ORDER BY ${diagnosisColumns.has("date") ? "pd.date" : "pd.diagnosis_date"} DESC`,
      [patientId],
    ).catch((err) => { console.error("Failed to fetch diagnoses:", err); return { rows: [] }; }),
    query(
      `SELECT pa.id, pa.allergy_name, pa.created_at
       FROM patient_allergies pa
       WHERE pa.patient_id = $1
       ORDER BY pa.created_at DESC`,
      [patientId],
    ).catch((err) => { console.error("Failed to fetch allergies:", err); return { rows: [] }; }),
    query(
      `SELECT pd.id, pd.title, pd.document_type, pd.uploaded_file_name,
              pd.uploaded_file_mime_type, pd.uploaded_file_content, pd.uploaded_by, pd.created_at,
              u.name AS uploaded_by_name
       FROM patient_documents pd
       LEFT JOIN users u ON u.id = pd.uploaded_by
       WHERE pd.patient_id = $1
       ORDER BY pd.created_at DESC`,
      [patientId],
    ).catch((err) => { console.error("Failed to fetch documents:", err); return { rows: [] }; }),
    query(
      `SELECT pr.id, pr.doctor_id, d.name AS doctor_name, d.specialty AS doctor_specialty,
              pr.drug_id,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', pm.id,
                    'drug_id', pm.drug_id,
                    'medication_name', pm.medication_name,
                    'dosage_level', pm.dosage_level,
                    'dosage_amount', pm.dosage_amount,
                    'start_date', pm.start_date,
                    'end_date', pm.end_date,
                    'notes', pm.notes
                  )
                  ORDER BY pm.created_at
                ) FILTER (WHERE pm.id IS NOT NULL),
                '[]'::json
              ) AS medications,
              pr.prescription_date, pr.instructions, pr.uploaded_file_name, pr.approval_status, pr.created_at
       FROM prescriptions pr
       LEFT JOIN doctors d ON d.id = pr.doctor_id
       LEFT JOIN prescription_medications pm ON pm.prescription_id = pr.id
       WHERE pr.patient_id = $1
       GROUP BY pr.id, pr.doctor_id, d.name, d.specialty, pr.drug_id, pr.prescription_date, pr.instructions, pr.uploaded_file_name, pr.approval_status, pr.created_at
       ORDER BY pr.created_at DESC`,
      [patientId],
    ).catch((err) => { console.error("Failed to fetch prescriptions:", err); return { rows: [] }; }),
    query(
      `SELECT pv.id, pv.vaccine_name, pv.administered_date, pv.dose, pv.created_at
       FROM patient_vaccinations pv
       WHERE pv.patient_id = $1
       ORDER BY pv.administered_date DESC`,
      [patientId],
    ).catch(() => ({ rows: [] })),
    query(
      `SELECT pds.id, pds.admission_date, pds.discharge_date, pds.primary_diagnosis,
              pds.attending_physician, pds.los_days, pds.created_at
       FROM patient_discharge_summaries pds
       WHERE pds.patient_id = $1
       ORDER BY pds.discharge_date DESC`,
      [patientId],
    ).catch(() => ({ rows: [] })),
    query(
      `SELECT pie.id, pie.insurer_name, pie.plan_name, pie.statement_date, pie.service_date,
              pie.total_billed, pie.plan_paid, pie.your_responsibility, pie.claim_reference, pie.created_at
       FROM patient_insurance_eobs pie
       WHERE pie.patient_id = $1
       ORDER BY pie.statement_date DESC`,
      [patientId],
    ).catch(() => ({ rows: [] })),
  ]);

  return {
    ...patient,
    medications: medications.rows,
    visits: visits.rows,
    labResults: labResults.rows,
    diagnoses: diagnoses.rows,
    allergies: allergies.rows,
    documents: documents.rows,
    prescriptions: prescriptions.rows,
    vaccinations: vaccinations.rows,
    dischargeSummaries: dischargeSummaries.rows,
    insuranceEOBs: insuranceEOBs.rows,
  };
}

async function savePrescription(
  client: DbClient,
  patientId: string,
  input: PrescriptionInput,
  userId: string,
) {
  const { medications, prescriptionDate, instructions, doctorId, doctor, uploadedFileName, approvalStatus } = input;

  if (!medications || medications.length === 0) {
    throw new Error("At least one medication is required");
  }

  const parsedPrescriptionDate = ensureDate(prescriptionDate || new Date().toISOString(), "prescription_date");

  const finalDoctorId = doctorId || doctor?.id || null;
  const normalizedMedications: NormalizedPrescriptionMedication[] = medications.map((med) => ({
    drugId: med.drugId || null,
    medicationName: med.medicationName || "",
    dosageLevel: med.dosageLevel || null,
    dosageAmount: med.dosageAmount || null,
    startDate: med.startDate || null,
    endDate: med.endDate || null,
    notes: med.notes || null,
  }));

  const finalApprovalStatus = (approvalStatus || "draft") as "draft" | "approved";

  const prescriptionResult = await client.query(
    `INSERT INTO prescriptions (patient_id, doctor_id, prescription_date, instructions, uploaded_file_name, approval_status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [patientId, finalDoctorId, parsedPrescriptionDate.toISOString(), instructions || null, uploadedFileName || null, finalApprovalStatus, userId],
  );

  const prescriptionId = prescriptionResult.rows[0].id;

  for (const med of normalizedMedications) {
    await client.query(
      `INSERT INTO prescription_medications (prescription_id, drug_id, medication_name, dosage_level, dosage_amount, start_date, end_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        prescriptionId,
        med.drugId,
        med.medicationName,
        med.dosageLevel,
        med.dosageAmount,
        med.startDate,
        med.endDate,
        med.notes,
      ],
    );
  }

  return prescriptionId;
}

export {
  type AgeGroup,
  type NestedDoctorInput,
  type VisitInput,
  type LabResultInput,
  type DiagnosisInput,
  type AllergyInput,
  type PatientDocumentInput,
  type PrescriptionInput,
  type NormalizedPrescriptionMedication,
  type NormalizedPrescriptionInput,
  type DbClient,
  calculateAgeGroup,
  isProviderOrAdmin,
  canUseOrganizationScopedPatients,
  canFavoritePatients,
  canRequestPatientAccess,
  getUserOrganizationIds,
  getPatientOrganizationIds,
  getPrimaryOrganizationId,
  findPatientByEmail,
  ensurePatientNotificationsTable,
  ensurePatientOrganizationLink,
  canAccessPatient,
  getPatientSelectFields,
  getOrganizationMemberColumns,
  getPatientVisitColumns,
  getPatientDiagnosisColumns,
  getPatientLabResultColumns,
  getLegacyLabResultColumns,
  ensureDate,
  savePrescription,
};
