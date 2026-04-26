import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { getClient, query } from "../db/index.js";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.js";
import { parseUploadedDocument } from "../services/documentParser.js";

const router = Router();
type DbClient = Awaited<ReturnType<typeof getClient>>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type AgeGroup = "young" | "middle" | "elderly";

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

function ensureDate(value: string | null | undefined, fieldName: string) {
  if (!value) {
    throw new Error(`${fieldName} is required`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return String(value);
}

function normalizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : [];
}

async function getAccessiblePatientOrThrow(user: NonNullable<AuthenticatedRequest["user"]>, patientId: string) {
  const patientResult = await query(
    `SELECT id, user_id, created_by FROM patients WHERE id = $1`,
    [patientId],
  );

  if (patientResult.rows.length === 0) {
    return null;
  }

  const patient = patientResult.rows[0];
  const hasAccess = await canAccessPatient(user, patientId);
  if (!hasAccess) {
    throw new Error("Forbidden");
  }

  return patient;
}

function normalizePrescriptionInput(prescription: PrescriptionInput): NormalizedPrescriptionInput {
  const medication = String(prescription?.medication ?? "").trim();
  const drugId = String(prescription?.drugId ?? "").trim() || null;
  const medications = Array.isArray(prescription?.medications)
    ? prescription.medications
        .map((item) => ({
          drugId: String(item?.drugId ?? "").trim() || null,
          medicationName: String(item?.medicationName ?? "").trim(),
          dosageLevel: String(item?.dosageLevel ?? "").trim() || null,
          dosageAmount: String(item?.dosageAmount ?? "").trim() || null,
          startDate: String(item?.startDate ?? "").trim() || null,
          endDate: String(item?.endDate ?? "").trim() || null,
          notes: String(item?.notes ?? "").trim() || null,
        }))
        .filter((item) => item.drugId || item.medicationName)
    : medication
      ? [{ drugId, medicationName: medication, dosageLevel: null, dosageAmount: null, startDate: null, endDate: null, notes: null }]
      : [];
  const prescriptionDate = String(prescription?.prescriptionDate ?? "").trim();
  const instructions = String(prescription?.instructions ?? "").trim() || null;
  const uploadedFileName = String(prescription?.uploadedFileName ?? "").trim() || null;
  const approvalStatus = String(prescription?.approvalStatus ?? "draft").trim().toLowerCase();

  if (!["draft", "approved"].includes(approvalStatus)) {
    throw new Error("Invalid prescription approval status");
  }

  return {
    doctorId: prescription?.doctorId ?? null,
    doctor: prescription?.doctor ?? null,
    medications,
    prescriptionDate: ensureDate(prescriptionDate, "prescription date"),
    instructions,
    uploadedFileName,
    approvalStatus: approvalStatus as "draft" | "approved",
  };
}

async function resolveDoctorId(client: DbClient, doctor?: NestedDoctorInput | null, doctorId?: string | null) {
  if (doctorId) {
    return doctorId;
  }

  const doctorName = String(doctor?.name ?? "").trim();
  if (!doctorName) {
    return null;
  }

  const doctorSpecialty = String(doctor?.specialty ?? "").trim() || null;
  const existingDoctor = await client.query(
    `SELECT id
     FROM doctors
     WHERE LOWER(name) = LOWER($1)
       AND COALESCE(LOWER(specialty), '') = COALESCE(LOWER($2), '')
     LIMIT 1`,
    [doctorName, doctorSpecialty],
  );

  if (existingDoctor.rows.length > 0) {
    return existingDoctor.rows[0].id as string;
  }

  const createdDoctor = await client.query(
    `INSERT INTO doctors (name, specialty)
     VALUES ($1, $2)
     RETURNING id`,
    [doctorName, doctorSpecialty],
  );

  return createdDoctor.rows[0].id as string;
}

async function getPatientDetail(
  patientId: string,
  viewer?: NonNullable<AuthenticatedRequest["user"]> | null,
) {
  const patientResult = await query(
    `SELECT p.id, p.user_id, p.name, p.date_of_birth, p.gender, p.age_group,
            p.medical_history, p.created_by, p.created_at, p.updated_at
     FROM patients p
     WHERE p.id = $1`,
    [patientId],
  );

  if (patientResult.rows.length === 0) {
    return null;
  }

  const medicationsResult = await query(
    `SELECT pm.id, pm.drug_id, d.name AS drug_name, pm.dosage_level,
            pm.dosage_amount, pm.start_date, pm.end_date, pm.notes,
            pm.prescribed_by, pm.created_at
     FROM patient_medications pm
     LEFT JOIN drugs d ON d.id = pm.drug_id
     WHERE pm.patient_id = $1
     ORDER BY pm.start_date DESC, pm.created_at DESC`,
    [patientId],
  );

  const visitsResult = await query(
    `SELECT pv.id, pv.visit_date, pv.reason, pv.doctor_id,
            d.name AS doctor_name, d.specialty AS doctor_specialty
     FROM patient_visits pv
     LEFT JOIN doctors d ON d.id = pv.doctor_id
     WHERE pv.patient_id = $1
     ORDER BY pv.visit_date DESC, pv.created_at DESC`,
    [patientId],
  );

  const labResults = await query(
    `SELECT lr.id, lr.test_name, lr.result, lr.result_date AS date,
            lr.uploaded_file_name, lr.uploaded_file_mime_type, lr.uploaded_file_content
     FROM lab_results lr
     WHERE lr.patient_id = $1
     ORDER BY lr.result_date DESC, lr.created_at DESC`,
    [patientId],
  );

  const diagnoses = await query(
    `SELECT pd.id, pd.diagnosis_name, pd.diagnosis_date AS date,
            pd.uploaded_file_name, pd.uploaded_file_mime_type, pd.uploaded_file_content
     FROM patient_diagnoses pd
     WHERE pd.patient_id = $1
     ORDER BY pd.diagnosis_date DESC, pd.created_at DESC`,
    [patientId],
  );

  const allergies = await query(
    `SELECT pa.id, pa.allergy_name
     FROM patient_allergies pa
     WHERE pa.patient_id = $1
     ORDER BY pa.created_at DESC`,
    [patientId],
  );

  let documents = { rows: [] as unknown[] };
  try {
    documents = await query(
      `SELECT pd.id, pd.title, pd.document_type, pd.uploaded_file_name,
              pd.uploaded_file_mime_type, pd.uploaded_file_content, pd.uploaded_by, pd.created_at
       FROM patient_documents pd
       WHERE pd.patient_id = $1
       ORDER BY pd.created_at DESC`,
      [patientId],
    );
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";
    if (code !== "42P01") {
      throw error;
    }
  }

  const prescriptions = await query(
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
            COALESCE(dr.name, pr.medication) AS medication,
            pr.instructions,
            pr.prescription_date,
            pr.uploaded_file_name,
            pr.approval_status,
            pr.approved_at
     FROM prescriptions pr
     LEFT JOIN doctors d ON d.id = pr.doctor_id
     LEFT JOIN drugs dr ON dr.id = pr.drug_id
     LEFT JOIN prescription_medications pm ON pm.prescription_id = pr.id
     WHERE pr.patient_id = $1
     GROUP BY pr.id, d.name, d.specialty, dr.name
     ORDER BY pr.created_at DESC`,
    [patientId],
  );

  let isFavorite = false;
  if (viewer && canFavoritePatients(viewer.role)) {
    const favoriteResult = await query(
      `SELECT 1
       FROM patient_favorites
       WHERE user_id = $1 AND patient_id = $2
       LIMIT 1`,
      [viewer.sub, patientId],
    );
    isFavorite = favoriteResult.rows.length > 0;
  }

  return {
    ...patientResult.rows[0],
    is_favorite: isFavorite,
    medications: medicationsResult.rows,
    visits: visitsResult.rows,
    labResults: labResults.rows,
    diagnoses: diagnoses.rows,
    allergies: allergies.rows,
    prescriptions: prescriptions.rows,
    documents: documents.rows,
  };
}

async function resolveDrugForPrescriptionMedication(medicationName: string, drugId?: string | null) {
  if (drugId) {
    const byId = await query(
      `SELECT id, name
       FROM drugs
       WHERE id = $1
       LIMIT 1`,
      [drugId],
    );

    if (byId.rows.length > 0) {
      return byId.rows[0];
    }
  }

  const safeName = medicationName.trim();
  if (!safeName) {
    return null;
  }

  const result = await query(
    `SELECT id, name
     FROM drugs
     WHERE LOWER(name) = LOWER($1)
        OR LOWER(generic_name) = LOWER($1)
     ORDER BY name
     LIMIT 1`,
    [safeName],
  );

  return result.rows[0] ?? null;
}

async function syncPatientRelatedData(
  client: DbClient,
  patientId: string,
  payload: {
    visits?: VisitInput[];
    labResults?: LabResultInput[];
    diagnoses?: DiagnosisInput[];
    allergies?: AllergyInput[];
    prescriptions?: PrescriptionInput[];
  },
) {
  if (Array.isArray(payload.visits)) {
    await client.query(`DELETE FROM patient_visits WHERE patient_id = $1`, [patientId]);

    for (const visit of payload.visits) {
      const reason = String(visit?.reason ?? "").trim();
      const visitDate = String(visit?.visitDate ?? "").trim();
      if (!reason && !visitDate) {
        continue;
      }

      const doctorId = await resolveDoctorId(client, visit?.doctor ?? null, visit?.doctorId ?? null);

      await client.query(
        `INSERT INTO patient_visits (patient_id, doctor_id, visit_date, reason)
         VALUES ($1, $2, $3, $4)`,
        [patientId, doctorId, ensureDate(visitDate, "visit date"), reason || null],
      );
    }
  }

  if (Array.isArray(payload.labResults)) {
    await client.query(`DELETE FROM lab_results WHERE patient_id = $1`, [patientId]);

    for (const lab of payload.labResults) {
      const testName = String(lab?.testName ?? "").trim();
      const result = String(lab?.result ?? "").trim();
      const date = String(lab?.date ?? "").trim();
      const uploadedFileName = String(lab?.uploadedFileName ?? "").trim() || null;
      const uploadedFileMimeType = String(lab?.uploadedFileMimeType ?? "").trim() || null;
      const uploadedFileContent = String(lab?.uploadedFileContent ?? "").trim() || null;
      if (!testName && !result && !date && !uploadedFileName && !uploadedFileContent) {
        continue;
      }
      if (!testName) {
        throw new Error("Lab result test name is required");
      }

      await client.query(
        `INSERT INTO lab_results (
           patient_id,
           test_name,
           result,
           result_date,
           uploaded_file_name,
           uploaded_file_mime_type,
           uploaded_file_content
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          patientId,
          testName,
          result || null,
          ensureDate(date, "lab result date"),
          uploadedFileName,
          uploadedFileMimeType,
          uploadedFileContent,
        ],
      );
    }
  }

  if (Array.isArray(payload.diagnoses)) {
    await client.query(`DELETE FROM patient_diagnoses WHERE patient_id = $1`, [patientId]);

    for (const diagnosis of payload.diagnoses) {
      const diagnosisName = String(diagnosis?.diagnosisName ?? "").trim();
      const date = String(diagnosis?.date ?? "").trim();
      const uploadedFileName = String(diagnosis?.uploadedFileName ?? "").trim() || null;
      const uploadedFileMimeType = String(diagnosis?.uploadedFileMimeType ?? "").trim() || null;
      const uploadedFileContent = String(diagnosis?.uploadedFileContent ?? "").trim() || null;
      if (!diagnosisName && !date && !uploadedFileName && !uploadedFileContent) {
        continue;
      }
      if (!diagnosisName) {
        throw new Error("Diagnosis name is required");
      }

      await client.query(
        `INSERT INTO patient_diagnoses (
           patient_id,
           diagnosis_name,
           diagnosis_date,
           uploaded_file_name,
           uploaded_file_mime_type,
           uploaded_file_content
         )
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          patientId,
          diagnosisName,
          ensureDate(date, "diagnosis date"),
          uploadedFileName,
          uploadedFileMimeType,
          uploadedFileContent,
        ],
      );
    }
  }

  if (Array.isArray(payload.allergies)) {
    await client.query(`DELETE FROM patient_allergies WHERE patient_id = $1`, [patientId]);

    for (const allergy of payload.allergies) {
      const allergyName = String(allergy?.allergyName ?? "").trim();
      if (!allergyName) {
        continue;
      }

      await client.query(
        `INSERT INTO patient_allergies (patient_id, allergy_name)
         VALUES ($1, $2)`,
        [patientId, allergyName],
      );
    }
  }

  if (Array.isArray(payload.prescriptions)) {
    await client.query(
      `DELETE FROM patient_medications
       WHERE prescription_id IN (
         SELECT id FROM prescriptions WHERE patient_id = $1
       )`,
      [patientId],
    );
    await client.query(`DELETE FROM prescriptions WHERE patient_id = $1`, [patientId]);

    for (const prescription of payload.prescriptions) {
      const normalized = normalizePrescriptionInput(prescription);

      const doctorId = await resolveDoctorId(
        client,
        normalized.doctor,
        normalized.doctorId,
      );

      const insertedPrescription = await client.query(
        `INSERT INTO prescriptions (
           patient_id,
           doctor_id,
           drug_id,
           medication,
           medications,
           prescription_date,
           instructions,
           approval_status,
           approved_at,
           uploaded_file_name
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          patientId,
          doctorId,
          normalized.medications[0]?.drugId || null,
          normalized.medications[0]?.medicationName || null,
          normalized.medications.map((item) => item.medicationName).filter(Boolean),
          normalized.prescriptionDate,
          normalized.instructions,
          normalized.approvalStatus,
          normalized.approvalStatus === "approved" ? new Date().toISOString() : null,
          normalized.uploadedFileName,
        ],
      );

      const prescriptionId = insertedPrescription.rows[0].id as string;

      for (const prescriptionMedication of normalized.medications) {
        await client.query(
          `INSERT INTO prescription_medications (
             prescription_id,
             drug_id,
             medication_name,
             dosage_level,
             dosage_amount,
             start_date,
             end_date,
             notes
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            prescriptionId,
            prescriptionMedication.drugId,
            prescriptionMedication.medicationName || "Unknown medication",
            prescriptionMedication.dosageLevel,
            prescriptionMedication.dosageAmount,
            prescriptionMedication.startDate || null,
            prescriptionMedication.endDate || null,
            prescriptionMedication.notes,
          ],
        );
      }

      if (normalized.approvalStatus === "approved") {
        for (const prescriptionMedication of normalized.medications) {
          const resolvedDrug = await resolveDrugForPrescriptionMedication(
            prescriptionMedication.medicationName,
            prescriptionMedication.drugId,
          );
          if (!resolvedDrug) {
            continue;
          }

          await client.query(
            `INSERT INTO patient_medications (
               patient_id,
               prescription_id,
               drug_id,
              dosage_level,
              dosage_amount,
              start_date,
              end_date,
              notes
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              patientId,
              prescriptionId,
              resolvedDrug.id,
              prescriptionMedication.dosageLevel || "medium",
              prescriptionMedication.dosageAmount,
              prescriptionMedication.startDate || normalized.prescriptionDate,
              prescriptionMedication.endDate || null,
              prescriptionMedication.notes || normalized.instructions || null,
            ],
          );
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// GET /api/patients – list patients (paginated, searchable)
// ---------------------------------------------------------------------------
router.get(
  "/",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { sub, role } = req.user;
      const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
      const limit = Math.min(Math.max(parseInt(String(req.query.limit || "20"), 10) || 20, 1), 100);
      const offset = Math.max(parseInt(String(req.query.offset || "0"), 10) || 0, 0);

      const conditions: string[] = [];
      const params: unknown[] = [];
      let paramIdx = 1;

      // Role-based filtering
      if (role === "patient") {
        conditions.push(`p.user_id = $${paramIdx++}`);
        params.push(sub);
      } else if (canUseOrganizationScopedPatients(role)) {
        const client = await getClient();
        let organizationIds: string[];
        try {
          organizationIds = await getUserOrganizationIds(client, sub);
        } finally {
          client.release();
        }

        if (organizationIds.length === 0) {
          res.status(200).json({
            success: true,
            data: {
              patients: [],
              total: 0,
              limit,
              offset,
            },
          });
          return;
        }

        conditions.push(`EXISTS (
          SELECT 1
          FROM patient_organizations po
          WHERE po.patient_id = p.id
            AND po.organization_id = ANY($${paramIdx++}::uuid[])
        )`);
        params.push(organizationIds);
      }
      // admin: no filter

      if (search) {
        conditions.push(`p.name ILIKE $${paramIdx++}`);
        params.push(`%${search}%`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const countResult = await query(
        `SELECT COUNT(*) FROM patients p ${whereClause}`,
        params,
      );
      const total = parseInt(countResult.rows[0].count, 10);

      const favoritesEnabled = canFavoritePatients(role);
      const favoriteSelect = favoritesEnabled
        ? `EXISTS (
            SELECT 1
            FROM patient_favorites pf
            WHERE pf.patient_id = p.id
              AND pf.user_id = $${paramIdx++}
          ) AS is_favorite`
        : "FALSE AS is_favorite";
      const orderByClause = favoritesEnabled
        ? "ORDER BY is_favorite DESC, p.created_at DESC"
        : "ORDER BY p.created_at DESC";
      const dataParams = favoritesEnabled ? [...params, sub, limit, offset] : [...params, limit, offset];
      const rows = await query(
        `SELECT p.id, p.name, p.date_of_birth, p.gender, p.age_group, p.medical_history, p.created_at,
                ${favoriteSelect}
         FROM patients p
         ${whereClause}
         ${orderByClause}
         LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
        dataParams,
      );

      res.status(200).json({
        success: true,
        data: {
          patients: rows.rows,
          total,
          limit,
          offset,
        },
      });
    } catch (error) {
      console.error("List patients error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to list patients" } });
    }
  },
);

// ---------------------------------------------------------------------------
// GET /api/patients/:id – single patient with medications
// ---------------------------------------------------------------------------
router.get(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { role } = req.user;
      const { id } = req.params;

      const patientResult = await query(
        `SELECT p.id, p.user_id, p.name, p.date_of_birth, p.gender, p.age_group,
                p.medical_history, p.created_by, p.created_at, p.updated_at
         FROM patients p
         WHERE p.id = $1`,
        [id],
      );

      if (patientResult.rows.length === 0) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      // Authorization check
      const hasAccess = role === "admin" ? true : await canAccessPatient(req.user, id);
      if (!hasAccess) {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      // admin: allowed

      const detail = await getPatientDetail(id, req.user);

      res.status(200).json({
        success: true,
        data: detail,
      });
    } catch (error) {
      console.error("Get patient error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to get patient" } });
    }
  },
);

router.post(
  "/:id/favorite",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      if (!canFavoritePatients(req.user.role)) {
        res.status(403).json({ success: false, error: { message: "Only doctors and nurses can favorite patients" } });
        return;
      }

      const { id } = req.params;
      const accessiblePatient = await getAccessiblePatientOrThrow(req.user, id);

      if (!accessiblePatient) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      await query(
        `INSERT INTO patient_favorites (user_id, patient_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, patient_id) DO NOTHING`,
        [req.user.sub, id],
      );

      res.status(200).json({
        success: true,
        data: {
          patientId: id,
          isFavorite: true,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }

      console.error("Favorite patient error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to favorite patient" } });
    }
  },
);

router.delete(
  "/:id/favorite",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      if (!canFavoritePatients(req.user.role)) {
        res.status(403).json({ success: false, error: { message: "Only doctors and nurses can favorite patients" } });
        return;
      }

      const { id } = req.params;
      const accessiblePatient = await getAccessiblePatientOrThrow(req.user, id);

      if (!accessiblePatient) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      await query(
        `DELETE FROM patient_favorites
         WHERE user_id = $1 AND patient_id = $2`,
        [req.user.sub, id],
      );

      res.status(200).json({
        success: true,
        data: {
          patientId: id,
          isFavorite: false,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }

      console.error("Unfavorite patient error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to remove favorite" } });
    }
  },
);

// ---------------------------------------------------------------------------
// POST /api/patients – create patient (provider/admin only)
// ---------------------------------------------------------------------------
router.post(
  "/",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { sub, role } = req.user;

      if (!isProviderOrAdmin(role)) {
        res.status(403).json({ success: false, error: { message: "Only providers and admins can create patients" } });
        return;
      }

      if (role === "doctor" || role === "nurse") {
        res.status(403).json({
          success: false,
          error: { message: "Doctors and nurses cannot create patients directly. Request access from the patient instead." },
        });
        return;
      }

      const {
        name,
        dateOfBirth,
        gender,
        ageGroup,
        medicalHistory,
        email,
        password,
        phone,
        visits,
        labResults,
        diagnoses,
        allergies,
        prescriptions,
      } = req.body;

      if (!name || typeof name !== "string" || !name.trim()) {
        res.status(400).json({ success: false, error: { message: "Name is required" } });
        return;
      }

      const normalizedEmail = String(email || "").trim().toLowerCase();
      const safePassword = String(password || "");
      const safeName = name.trim();
      const safeDob = dateOfBirth ? String(dateOfBirth) : null;
      const safePhone = String(phone || "").trim() || null;
      const safeGender = String(gender || "").trim() || null;

      if (!safeDob) {
        res.status(400).json({ success: false, error: { message: "Date of birth is required" } });
        return;
      }

      if (!normalizedEmail || !normalizedEmail.includes("@")) {
        res.status(400).json({ success: false, error: { message: "A valid email is required" } });
        return;
      }

      if (safeDob) {
        const parsed = new Date(safeDob);
        if (Number.isNaN(parsed.getTime())) {
          res.status(400).json({ success: false, error: { message: "Invalid date of birth" } });
          return;
        }
      }

      let resolvedAgeGroup: AgeGroup | null = ageGroup || null;
      if (!resolvedAgeGroup && safeDob) {
        resolvedAgeGroup = calculateAgeGroup(safeDob);
      }

      if (resolvedAgeGroup && !["young", "middle", "elderly"].includes(resolvedAgeGroup)) {
        res.status(400).json({ success: false, error: { message: "Invalid age group. Must be young, middle, or elderly" } });
        return;
      }

      const safeMedicalHistory = normalizeStringArray(medicalHistory);
      const client = await getClient();

      try {
        await client.query("BEGIN");

        const existingUserResult = await client.query<{
          id: string;
          role: string;
        }>(
          `SELECT id, role
           FROM users
           WHERE LOWER(email) = LOWER($1)`,
          [normalizedEmail],
        );

        if (existingUserResult.rows.length === 0 && safePassword.length < 8) {
          await client.query("ROLLBACK");
          res.status(400).json({ success: false, error: { message: "Password must be at least 8 characters long" } });
          return;
        }

        const userColumnsResult = await client.query<{ column_name: string }>(
          `SELECT column_name
           FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'users'`,
        );
        const userColumns = new Set(
          userColumnsResult.rows.map((row) => row.column_name),
        );
        const nameColumn = userColumns.has("name") ? "name" : "full_name";
        const hasPhoneColumn = userColumns.has("phone");
        const organizationIds = await getUserOrganizationIds(client, sub);
        const organizationId = organizationIds[0] ?? null;

        if (!organizationId && role !== "admin") {
          await client.query("ROLLBACK");
          res.status(400).json({ success: false, error: { message: "You must belong to an organization to create or link patients" } });
          return;
        }

        let createdUserId: string;
        let patientId: string;
        let linkedExistingPatient = false;

        if (existingUserResult.rows.length > 0) {
          const existingUser = existingUserResult.rows[0];
          if (existingUser.role !== "patient") {
            await client.query("ROLLBACK");
            res.status(409).json({ success: false, error: { message: "User exists but is not a patient account" } });
            return;
          }

          createdUserId = existingUser.id;
          const existingPatientResult = await client.query<{ id: string }>(
            `SELECT id
             FROM patients
             WHERE user_id = $1
             LIMIT 1`,
            [createdUserId],
          );

          if (existingPatientResult.rows.length > 0) {
            patientId = existingPatientResult.rows[0].id;
            linkedExistingPatient = true;
          } else {
            const result = await client.query(
              `INSERT INTO patients (user_id, name, date_of_birth, gender, age_group, medical_history, created_by)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               RETURNING id`,
              [createdUserId, safeName, safeDob, safeGender, resolvedAgeGroup, safeMedicalHistory, sub],
            );
            patientId = result.rows[0].id as string;
          }
        } else {
          const hashedPassword = await bcrypt.hash(safePassword, 10);
          const insertColumns = [
            "email",
            "password_hash",
            nameColumn,
            "role",
            ...(hasPhoneColumn ? ["phone"] : []),
          ];
          const insertParams: unknown[] = [
            normalizedEmail,
            hashedPassword,
            safeName,
            "patient",
            ...(hasPhoneColumn ? [safePhone] : []),
          ];
          const placeholders = insertParams
            .map((_, index) => `$${index + 1}`)
            .join(", ");

          const createdUserResult = await client.query(
            `INSERT INTO users (${insertColumns.join(", ")})
             VALUES (${placeholders})
             RETURNING id`,
            insertParams,
          );

          createdUserId = createdUserResult.rows[0]?.id;

          const result = await client.query(
            `INSERT INTO patients (user_id, name, date_of_birth, gender, age_group, medical_history, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [createdUserId, safeName, safeDob, safeGender, resolvedAgeGroup, safeMedicalHistory, sub],
          );

          patientId = result.rows[0].id as string;
        }

        await ensurePatientOrganizationLink(client, patientId, organizationId, sub);

        await syncPatientRelatedData(client, patientId, {
          visits: Array.isArray(visits) ? visits : undefined,
          labResults: Array.isArray(labResults) ? labResults : undefined,
          diagnoses: Array.isArray(diagnoses) ? diagnoses : undefined,
          allergies: Array.isArray(allergies) ? allergies : undefined,
          prescriptions: Array.isArray(prescriptions) ? prescriptions : undefined,
        });

        await client.query("COMMIT");

        const detail = await getPatientDetail(patientId, req.user);

        res.status(linkedExistingPatient ? 200 : 201).json({
          success: true,
          data: {
            ...detail,
            existingUserLinked: linkedExistingPatient,
            message: linkedExistingPatient
              ? "User exists. Linked the existing patient to your organization."
              : "Patient created successfully.",
          },
        });
      } catch (dbError) {
        await client.query("ROLLBACK");
        throw dbError;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Create patient error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to create patient" } });
    }
  },
);

// ---------------------------------------------------------------------------
// PUT /api/patients/:id – update patient
// ---------------------------------------------------------------------------
router.put(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { role } = req.user;
      const { id } = req.params;

      // Check existence and authorization
      const existing = await query(
        `SELECT id, user_id, created_by FROM patients WHERE id = $1`,
        [id],
      );

      if (existing.rows.length === 0) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      const hasAccess = role === "admin" ? true : await canAccessPatient(req.user, id);
      if (!hasAccess) {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }

      const { name, dateOfBirth, gender, ageGroup, medicalHistory, visits, labResults, diagnoses, allergies, prescriptions } = req.body;
      const prescriptionsWereUpdated = Array.isArray(prescriptions);

      const setClauses: string[] = [];
      const params: unknown[] = [];
      let paramIdx = 1;

      if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
          res.status(400).json({ success: false, error: { message: "Name cannot be empty" } });
          return;
        }
        setClauses.push(`name = $${paramIdx++}`);
        params.push(name.trim());
      }

      if (dateOfBirth !== undefined) {
        if (dateOfBirth !== null) {
          const parsed = new Date(String(dateOfBirth));
          if (Number.isNaN(parsed.getTime())) {
            res.status(400).json({ success: false, error: { message: "Invalid date of birth" } });
            return;
          }
        }
        setClauses.push(`date_of_birth = $${paramIdx++}`);
        params.push(dateOfBirth || null);
      }

      if (ageGroup !== undefined) {
        if (ageGroup !== null && !["young", "middle", "elderly"].includes(ageGroup)) {
          res.status(400).json({ success: false, error: { message: "Invalid age group" } });
          return;
        }
        setClauses.push(`age_group = $${paramIdx++}`);
        params.push(ageGroup || null);
      }

      if (gender !== undefined) {
        setClauses.push(`gender = $${paramIdx++}`);
        params.push(gender ? String(gender).trim() : null);
      }

      if (medicalHistory !== undefined) {
        setClauses.push(`medical_history = $${paramIdx++}`);
        params.push(normalizeStringArray(medicalHistory));
      }

      const hasNestedUpdates =
        Array.isArray(visits) ||
        Array.isArray(labResults) ||
        Array.isArray(diagnoses) ||
        Array.isArray(allergies) ||
        Array.isArray(prescriptions);

      if (setClauses.length === 0 && !hasNestedUpdates) {
        res.status(400).json({ success: false, error: { message: "No fields to update" } });
        return;
      }

      setClauses.push(`updated_at = NOW()`);
      params.push(id);

      const client = await getClient();

      try {
        await client.query("BEGIN");

        if (setClauses.length > 0) {
          await client.query(
            `UPDATE patients
             SET ${setClauses.join(", ")}
             WHERE id = $${paramIdx}
             RETURNING id`,
            params,
          );
        }

        await syncPatientRelatedData(client, id, {
          visits: Array.isArray(visits) ? visits : undefined,
          labResults: Array.isArray(labResults) ? labResults : undefined,
          diagnoses: Array.isArray(diagnoses) ? diagnoses : undefined,
          allergies: Array.isArray(allergies) ? allergies : undefined,
          prescriptions: Array.isArray(prescriptions) ? prescriptions : undefined,
        });

        if (prescriptionsWereUpdated && req.user.role === "nurse") {
          await ensurePatientNotificationsTable(client);
          const actorResult = await client.query<{ name: string | null; email: string | null }>(
            `SELECT name, email
             FROM users
             WHERE id = $1
             LIMIT 1`,
            [req.user.sub],
          );
          const actorName = actorResult.rows[0]?.name || "Nurse";
          const actorEmail = actorResult.rows[0]?.email || null;

          await client.query(
            `INSERT INTO patient_notifications (
               patient_user_id,
               patient_id,
               type,
               title,
               message,
               metadata,
               created_by
             )
             VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
            [
              existing.rows[0].user_id,
              id,
              "medication_updated",
              "Medication list updated",
              `${actorName} updated your medication list. Please review your current medications.`,
              JSON.stringify({
                updatedByRole: "nurse",
                updatedByName: actorName,
                updatedByEmail: actorEmail,
                patientId: id,
                updatedAt: new Date().toISOString(),
              }),
              req.user.sub,
            ],
          );
        }

        await client.query("COMMIT");
      } catch (dbError) {
        await client.query("ROLLBACK");
        throw dbError;
      } finally {
        client.release();
      }

      const detail = await getPatientDetail(id, req.user);

      res.status(200).json({
        success: true,
        data: detail,
      });
    } catch (error) {
      console.error("Update patient error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to update patient" } });
    }
  },
);

// ---------------------------------------------------------------------------
// POST /api/patients/:id/documents – upload a patient document
// ---------------------------------------------------------------------------
router.post(
  "/:id/documents/preview",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { id } = req.params;
      const accessiblePatient = await getAccessiblePatientOrThrow(req.user, id);

      if (!accessiblePatient) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      const body = req.body as PatientDocumentInput;
      const uploadedFileName = String(body.uploadedFileName ?? "").trim();
      const uploadedFileMimeType = String(body.uploadedFileMimeType ?? "").trim() || null;
      const uploadedFileContent = String(body.uploadedFileContent ?? "").trim();

      if (!uploadedFileName || !uploadedFileContent) {
        res.status(400).json({ success: false, error: { message: "Uploaded file is required" } });
        return;
      }

      // Parse the PDF to detect type and extract structured data
      let parsedType: "prescription" | "lab_result" | "discharge_summary" | "unknown" = "unknown";
      let parsedMedications: { name: string; dosageAmount: string; frequency: string; instructions: string }[] = [];
      let parsedLabResults: { testName: string; result: string; referenceRange: string }[] = [];
      try {
        const parsed = await parseUploadedDocument(uploadedFileContent, uploadedFileMimeType);
        parsedType = parsed.type;
        parsedMedications = parsed.medications;
        parsedLabResults = parsed.labResults;
      } catch (parseErr) {
        console.warn("Document parse warning (non-fatal):", parseErr);
      }

      res.status(200).json({
        success: true,
        data: {
          type: parsedType,
          medications: parsedMedications,
          labResults: parsedLabResults,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      console.error("Document preview error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to preview document" } });
    }
  }
);

router.post(
  "/:id/documents",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { id } = req.params;
      const accessiblePatient = await getAccessiblePatientOrThrow(req.user, id);

      if (!accessiblePatient) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      const body = req.body as PatientDocumentInput;
      const title = String(body.title ?? "").trim();
      const uploadedFileName = String(body.uploadedFileName ?? "").trim();
      const uploadedFileMimeType = String(body.uploadedFileMimeType ?? "").trim() || null;
      const uploadedFileContent = String(body.uploadedFileContent ?? "").trim();

      if (!title) {
        res.status(400).json({ success: false, error: { message: "Document title is required" } });
        return;
      }

      if (!uploadedFileName || !uploadedFileContent) {
        res.status(400).json({ success: false, error: { message: "Uploaded file is required" } });
        return;
      }

      // Parse the PDF to detect type and extract structured data
      let parsedType: "prescription" | "lab_result" | "discharge_summary" | "unknown" = "unknown";
      let parsedMedications: { name: string; dosageAmount: string; frequency: string; instructions: string }[] = [];
      let parsedLabResults: { testName: string; result: string; referenceRange: string }[] = [];
      try {
        const parsed = await parseUploadedDocument(uploadedFileContent, uploadedFileMimeType);
        parsedType = parsed.type;
        parsedMedications = parsed.medications;
        parsedLabResults = parsed.labResults;
      } catch (parseErr) {
        console.warn("Document parse warning (non-fatal):", parseErr);
      }

      const resolvedDocumentType =
        parsedType === "prescription" ? "Prescription" :
        parsedType === "lab_result" ? "Lab Result" :
        parsedType === "discharge_summary" ? "Discharge Summary" :
        "Patient Upload";

      const insertResult = await query(
        `INSERT INTO patient_documents (
           patient_id,
           title,
           document_type,
           uploaded_file_name,
           uploaded_file_mime_type,
           uploaded_file_content,
           uploaded_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          id,
          title,
          resolvedDocumentType,
          uploadedFileName,
          uploadedFileMimeType,
          uploadedFileContent,
          req.user.sub,
        ],
      );

      const today = new Date().toISOString().split("T")[0];

      // If it's a prescription — create a prescription record with its medications
      if (parsedType === "prescription" && parsedMedications.length > 0) {
        try {
          const medicationNames = parsedMedications.map((m) => m.name);

          const rxInsert = await query(
            `INSERT INTO prescriptions (
               patient_id,
               doctor_id,
               drug_id,
               medication,
               medications,
               prescription_date,
               instructions,
               approval_status,
               uploaded_file_name
             )
             VALUES ($1, NULL, NULL, $2, $3, $4, $5, 'draft', $6)
             RETURNING id`,
            [
              id,
              medicationNames[0] ?? null,
              medicationNames,
              today,
              parsedMedications[0]?.instructions || null,
              uploadedFileName,
            ],
          );

          const prescriptionId = rxInsert.rows[0]?.id as string | undefined;

          if (prescriptionId) {
            for (const med of parsedMedications) {
              // Try to find a matching drug in the drugs table
              let drugId: string | null = null;
              try {
                // Extract base name (remove salt/form suffixes for matching)
                const baseName = med.name
                  .replace(/\s+(HCl|Calcium|Sodium|Tartrate|Citrate|Hydrochloride|Succinate|ER|XR|SR|CR|LA|Extended Release|Controlled Release)\b/gi, "")
                  .trim();
                const drugMatch = await query(
                  `SELECT id FROM drugs WHERE LOWER(name) ILIKE $1 ORDER BY LENGTH(name) LIMIT 1`,
                  [`%${baseName.toLowerCase()}%`],
                );
                drugId = drugMatch.rows[0]?.id ?? null;
              } catch {
                // drug lookup failure is non-fatal
              }

              await query(
                `INSERT INTO prescription_medications (
                   prescription_id,
                   drug_id,
                   medication_name,
                   dosage_level,
                   dosage_amount,
                   notes
                 )
                 VALUES ($1, $2, $3, 'medium', $4, $5)`,
                [
                  prescriptionId,
                  drugId,
                  med.name,
                  med.dosageAmount || null,
                  med.instructions || null,
                ],
              );

              // Also add to patient_medications so the drug appears in the medication list
              if (drugId) {
                try {
                  await query(
                    `INSERT INTO patient_medications (
                       patient_id,
                       prescription_id,
                       drug_id,
                       dosage_level,
                       dosage_amount,
                       start_date,
                       notes,
                       prescribed_by
                     )
                     VALUES ($1, $2, $3, 'medium', $4, $5, $6, $7)
                     ON CONFLICT DO NOTHING`,
                    [
                      id,
                      prescriptionId,
                      drugId,
                      med.dosageAmount || null,
                      today,
                      med.instructions || null,
                      req.user.sub,
                    ],
                  );
                } catch {
                  // patient_medications insert failure is non-fatal
                }
              }
            }
          }
        } catch (rxErr) {
          console.warn("Prescription auto-create warning (non-fatal):", rxErr);
        }
      }

      // If it's a lab result — create lab_results records
      if (parsedType === "lab_result" && parsedLabResults.length > 0) {
        try {
          // Cap at 30 tests to avoid flooding the table
          const testsToInsert = parsedLabResults.slice(0, 30);
          for (const test of testsToInsert) {
            await query(
              `INSERT INTO lab_results (
                 patient_id,
                 test_name,
                 result,
                 result_date,
                 uploaded_file_name,
                 uploaded_file_mime_type,
                 uploaded_file_content
               )
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                id,
                test.testName,
                test.referenceRange
                  ? `${test.result} (Ref: ${test.referenceRange})`
                  : test.result,
                today,
                uploadedFileName,
                uploadedFileMimeType,
                // Store the data URL only on the first record to avoid huge duplicated blobs
                testsToInsert.indexOf(test) === 0 ? uploadedFileContent : null,
              ],
            );
          }
        } catch (labErr) {
          console.warn("Lab result auto-create warning (non-fatal):", labErr);
        }
      }

      const detail = await getPatientDetail(id, req.user);

      res.status(201).json({
        success: true,
        data: {
          documentId: insertResult.rows[0]?.id ?? null,
          extractedType: parsedType,
          extractedMedications: parsedMedications.length,
          extractedLabResults: parsedLabResults.length,
          patient: detail,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }

      console.error("Upload patient document error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to upload patient document" } });
    }
  },
);

// ---------------------------------------------------------------------------
// DELETE /api/patients/:id – delete patient (provider/admin only)
// ---------------------------------------------------------------------------
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { role } = req.user;
      const { id } = req.params;

      if (!isProviderOrAdmin(role)) {
        res.status(403).json({ success: false, error: { message: "Only providers and admins can delete patients" } });
        return;
      }

      if (role !== "admin") {
        const hasAccess = await canAccessPatient(req.user, id);
        if (!hasAccess) {
          res.status(404).json({ success: false, error: { message: "Patient not found" } });
          return;
        }
      }

      const result = await query(
        `DELETE FROM patients WHERE id = $1 RETURNING id`,
        [id],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      res.status(200).json({
        success: true,
        data: { message: "Patient deleted successfully" },
      });
    } catch (error) {
      console.error("Delete patient error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to delete patient" } });
    }
  },
);

async function savePrescription(
  client: DbClient,
  patientId: string,
  prescription: PrescriptionInput,
  currentUserId: string,
  prescriptionId?: string,
) {
  const normalized = normalizePrescriptionInput(prescription);
  let doctorId: string | null;
  try {
    doctorId = await resolveDoctorId(client, normalized.doctor, normalized.doctorId);
  } catch (error) {
    throw new Error(`Prescription save failed at doctor resolution: ${error instanceof Error ? error.message : "unknown error"}`);
  }

  let savedPrescriptionId = prescriptionId ?? null;

  if (savedPrescriptionId) {
    let updated;
    try {
      updated = await client.query(
        `UPDATE prescriptions
         SET doctor_id = $1,
             drug_id = $2,
             medication = $3,
             medications = $4,
             prescription_date = $5,
             instructions = $6,
             approval_status = $7,
             approved_at = $8,
             uploaded_file_name = $9
         WHERE id = $10 AND patient_id = $11
         RETURNING id`,
        [
          doctorId,
          normalized.medications[0]?.drugId || null,
          normalized.medications[0]?.medicationName || null,
          normalized.medications.map((item) => item.medicationName).filter(Boolean),
          normalized.prescriptionDate,
          normalized.instructions,
          normalized.approvalStatus,
          normalized.approvalStatus === "approved" ? new Date().toISOString() : null,
          normalized.uploadedFileName,
          savedPrescriptionId,
          patientId,
        ],
      );
    } catch (error) {
      throw new Error(`Prescription save failed at parent update: ${error instanceof Error ? error.message : "unknown error"}`);
    }

    if (updated.rows.length === 0) {
      throw new Error("Prescription not found");
    }

    try {
      await client.query(`DELETE FROM patient_medications WHERE prescription_id = $1`, [savedPrescriptionId]);
      await client.query(`DELETE FROM prescription_medications WHERE prescription_id = $1`, [savedPrescriptionId]);
    } catch (error) {
      throw new Error(`Prescription save failed at child cleanup: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  } else {
    let inserted;
    try {
      inserted = await client.query(
        `INSERT INTO prescriptions (
           patient_id,
           doctor_id,
           drug_id,
           medication,
           medications,
           prescription_date,
           instructions,
           approval_status,
           approved_at,
           uploaded_file_name
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          patientId,
          doctorId,
          normalized.medications[0]?.drugId || null,
          normalized.medications[0]?.medicationName || null,
          normalized.medications.map((item) => item.medicationName).filter(Boolean),
          normalized.prescriptionDate,
          normalized.instructions,
          normalized.approvalStatus,
          normalized.approvalStatus === "approved" ? new Date().toISOString() : null,
          normalized.uploadedFileName,
        ],
      );
    } catch (error) {
      throw new Error(`Prescription save failed at parent insert: ${error instanceof Error ? error.message : "unknown error"}`);
    }
    savedPrescriptionId = inserted.rows[0].id as string;
  }

  for (const prescriptionMedication of normalized.medications) {
    try {
      await client.query(
        `INSERT INTO prescription_medications (
           prescription_id,
           drug_id,
           medication_name,
           dosage_level,
           dosage_amount,
           start_date,
           end_date,
           notes
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          savedPrescriptionId,
          prescriptionMedication.drugId,
          prescriptionMedication.medicationName || "Unknown medication",
          prescriptionMedication.dosageLevel,
          prescriptionMedication.dosageAmount,
          prescriptionMedication.startDate || null,
          prescriptionMedication.endDate || null,
          prescriptionMedication.notes,
        ],
      );
    } catch (error) {
      throw new Error(`Prescription save failed at prescription medication insert: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  if (normalized.approvalStatus === "approved") {
    for (const prescriptionMedication of normalized.medications) {
      let resolvedDrug;
      try {
        resolvedDrug = await resolveDrugForPrescriptionMedication(
          prescriptionMedication.medicationName,
          prescriptionMedication.drugId,
        );
      } catch (error) {
        throw new Error(`Prescription save failed at approved medication lookup: ${error instanceof Error ? error.message : "unknown error"}`);
      }
      if (!resolvedDrug) {
        continue;
      }

      try {
        await client.query(
          `INSERT INTO patient_medications (
             patient_id,
             prescription_id,
             drug_id,
             dosage_level,
             dosage_amount,
             start_date,
             end_date,
             notes,
             prescribed_by
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            patientId,
            savedPrescriptionId,
            resolvedDrug.id,
            prescriptionMedication.dosageLevel || "medium",
            prescriptionMedication.dosageAmount,
            prescriptionMedication.startDate || normalized.prescriptionDate,
            prescriptionMedication.endDate || null,
            prescriptionMedication.notes || normalized.instructions || null,
            currentUserId,
          ],
        );
      } catch (error) {
        throw new Error(`Prescription save failed at approved medication sync: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }
  }

  return savedPrescriptionId;
}

router.get(
  "/access-requests/search",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      if (!canRequestPatientAccess(req.user.role)) {
        res.status(403).json({ success: false, error: { message: "Only doctors and nurses can search patients by email" } });
        return;
      }

      const email = typeof req.query.email === "string" ? req.query.email.trim().toLowerCase() : "";
      if (!email || !email.includes("@")) {
        res.status(400).json({ success: false, error: { message: "A valid patient email is required" } });
        return;
      }

      const client = await getClient();
      try {
        const organizationId = await getPrimaryOrganizationId(client, req.user.sub);
        if (!organizationId) {
          res.status(400).json({ success: false, error: { message: "You must belong to an organization before requesting patient access" } });
          return;
        }

        const patientResult = await findPatientByEmail(client, email);
        if (patientResult.rows.length === 0) {
          res.status(404).json({ success: false, error: { message: "No patient account found for that email" } });
          return;
        }

        const patient = patientResult.rows[0];
        const [patientOrganizationIds, requestResult] = await Promise.all([
          getPatientOrganizationIds(client, patient.patient_id),
          client.query<{ status: string }>(
            `SELECT status
             FROM patient_access_requests
             WHERE patient_id = $1 AND organization_id = $2
             LIMIT 1`,
            [patient.patient_id, organizationId],
          ),
        ]);

        res.status(200).json({
          success: true,
          data: {
            patientId: patient.patient_id,
            patientUserId: patient.patient_user_id,
            name: patient.patient_name,
            email: patient.patient_email,
            alreadyAccessible: patientOrganizationIds.includes(organizationId),
            requestStatus: requestResult.rows[0]?.status ?? null,
          },
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Search patient by email error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to search patient" } });
    }
  },
);

router.post(
  "/access-requests",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      if (!canRequestPatientAccess(req.user.role)) {
        res.status(403).json({ success: false, error: { message: "Only doctors and nurses can request patient access" } });
        return;
      }

      const email = String(req.body?.email ?? "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        res.status(400).json({ success: false, error: { message: "A valid patient email is required" } });
        return;
      }

      const client = await getClient();
      try {
        await client.query("BEGIN");

        const organizationId = await getPrimaryOrganizationId(client, req.user.sub);
        if (!organizationId) {
          await client.query("ROLLBACK");
          res.status(400).json({ success: false, error: { message: "You must belong to an organization before requesting patient access" } });
          return;
        }

        const patientResult = await findPatientByEmail(client, email);
        if (patientResult.rows.length === 0) {
          await client.query("ROLLBACK");
          res.status(404).json({ success: false, error: { message: "No patient account found for that email" } });
          return;
        }

        const patient = patientResult.rows[0];
        const patientOrganizationIds = await getPatientOrganizationIds(client, patient.patient_id);
        if (patientOrganizationIds.includes(organizationId)) {
          await client.query("ROLLBACK");
          res.status(409).json({ success: false, error: { message: "Your organization already has access to this patient" } });
          return;
        }

        const requestResult = await client.query<{ id: string; status: string }>(
          `INSERT INTO patient_access_requests (
             patient_id,
             patient_user_id,
             organization_id,
             requested_by,
             status,
             updated_at,
             responded_at
           )
           VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP, NULL)
           ON CONFLICT (patient_id, organization_id)
           DO UPDATE SET
             requested_by = EXCLUDED.requested_by,
             status = 'pending',
             updated_at = CURRENT_TIMESTAMP,
             responded_at = NULL
           RETURNING id, status`,
          [patient.patient_id, patient.patient_user_id, organizationId, req.user.sub],
        );

        await client.query("COMMIT");

        res.status(200).json({
          success: true,
          data: {
            requestId: requestResult.rows[0]?.id ?? null,
            patientId: patient.patient_id,
            requestStatus: requestResult.rows[0]?.status ?? "pending",
            message: "Access request sent to the patient.",
          },
        });
      } catch (dbError) {
        await client.query("ROLLBACK");
        throw dbError;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Create patient access request error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to create access request" } });
    }
  },
);

router.get(
  "/notifications/my",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      if (req.user.role !== "patient") {
        res.status(403).json({ success: false, error: { message: "Only patients can view notifications" } });
        return;
      }

      const client = await getClient();
      try {
        await ensurePatientNotificationsTable(client);
        const result = await client.query<{
          id: string;
          type: string;
          title: string;
          message: string;
          metadata: unknown;
          created_at: string;
        }>(
          `SELECT id, type, title, message, metadata, created_at
           FROM patient_notifications
           WHERE patient_user_id = $1
           ORDER BY created_at DESC
           LIMIT 20`,
          [req.user.sub],
        );

        res.status(200).json({
          success: true,
          data: {
            notifications: result.rows,
          },
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Get patient notifications error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to load notifications" } });
    }
  },
);

router.get(
  "/access-requests/my",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      if (req.user.role !== "patient") {
        res.status(403).json({ success: false, error: { message: "Only patients can view their access requests" } });
        return;
      }

      const result = await query(
        `SELECT par.id,
                par.status,
                par.created_at,
                par.updated_at,
                o.id AS organization_id,
                o.name AS organization_name,
                o.type AS organization_type,
                o.address AS organization_address,
                o.city AS organization_city,
                o.state AS organization_state,
                o.zip_code AS organization_zip_code,
                o.phone AS organization_phone,
                o.website AS organization_website,
                o.email AS organization_email,
                o.is_verified AS organization_is_verified,
                o.created_at AS organization_created_at,
                u.id AS requested_by,
                u.name AS requested_by_name,
                u.email AS requested_by_email,
                u.phone AS requested_by_phone,
                u.role AS requested_by_role,
                om.member_role AS requested_by_member_role,
                om.status AS requested_by_member_status
         FROM patient_access_requests par
         INNER JOIN organizations o ON o.id = par.organization_id
         INNER JOIN users u ON u.id = par.requested_by
         LEFT JOIN organization_members om
           ON om.organization_id = par.organization_id
          AND om.user_id = par.requested_by
         WHERE par.patient_user_id = $1
         ORDER BY
           CASE WHEN par.status = 'pending' THEN 0 ELSE 1 END,
           par.created_at DESC`,
        [req.user.sub],
      );

      res.status(200).json({
        success: true,
        data: {
          requests: result.rows,
        },
      });
    } catch (error) {
      console.error("Get patient access requests error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to load access requests" } });
    }
  },
);

router.post(
  "/access-requests/:requestId/respond",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      if (req.user.role !== "patient") {
        res.status(403).json({ success: false, error: { message: "Only patients can respond to access requests" } });
        return;
      }

      const action = String(req.body?.action ?? "").trim().toLowerCase();
      if (!["approve", "reject"].includes(action)) {
        res.status(400).json({ success: false, error: { message: "Action must be approve or reject" } });
        return;
      }

      const { requestId } = req.params;
      const client = await getClient();
      try {
        await client.query("BEGIN");

        const requestResult = await client.query<{
          id: string;
          patient_id: string;
          organization_id: string;
          requested_by: string;
          status: string;
        }>(
          `SELECT id, patient_id, organization_id, requested_by, status
           FROM patient_access_requests
           WHERE id = $1 AND patient_user_id = $2
           LIMIT 1`,
          [requestId, req.user.sub],
        );

        if (requestResult.rows.length === 0) {
          await client.query("ROLLBACK");
          res.status(404).json({ success: false, error: { message: "Access request not found" } });
          return;
        }

        const accessRequest = requestResult.rows[0];
        if (accessRequest.status !== "pending") {
          await client.query("ROLLBACK");
          res.status(409).json({ success: false, error: { message: "This access request has already been handled" } });
          return;
        }

        const nextStatus = action === "approve" ? "approved" : "rejected";
        await client.query(
          `UPDATE patient_access_requests
           SET status = $1,
               updated_at = CURRENT_TIMESTAMP,
               responded_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [nextStatus, requestId],
        );

        if (action === "approve") {
          await ensurePatientOrganizationLink(client, accessRequest.patient_id, accessRequest.organization_id, accessRequest.requested_by);
        }

        await client.query("COMMIT");

        res.status(200).json({
          success: true,
          data: {
            requestId,
            status: nextStatus,
            message: action === "approve" ? "Access request approved." : "Access request rejected.",
          },
        });
      } catch (dbError) {
        await client.query("ROLLBACK");
        throw dbError;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Respond patient access request error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to respond to access request" } });
    }
  },
);

// ---------------------------------------------------------------------------
// POST /api/patients/:id/medications – add medication to patient
// ---------------------------------------------------------------------------
router.post(
  "/:id/medications",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { sub, role } = req.user;
      const { id } = req.params;

      // Verify patient exists and user has access
      const patientResult = await query(
        `SELECT id, user_id, created_by FROM patients WHERE id = $1`,
        [id],
      );

      if (patientResult.rows.length === 0) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      const hasAccess = role === "admin" ? true : await canAccessPatient(req.user, id);
      if (!hasAccess) {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }

      const { drugId, dosageLevel, dosageAmount, startDate, endDate, notes } = req.body;

      if (!drugId) {
        res.status(400).json({ success: false, error: { message: "drugId is required" } });
        return;
      }

      // Verify the drug exists
      const drugResult = await query(`SELECT id FROM drugs WHERE id = $1`, [drugId]);
      if (drugResult.rows.length === 0) {
        res.status(400).json({ success: false, error: { message: "Drug not found" } });
        return;
      }

      const safeDosageLevel = dosageLevel || null;
      if (safeDosageLevel && !["none", "low", "medium", "high"].includes(safeDosageLevel)) {
        res.status(400).json({ success: false, error: { message: "Invalid dosage level. Must be none, low, medium, or high" } });
        return;
      }

      const safeStartDate = startDate ? String(startDate) : null;
      if (safeStartDate) {
        const parsed = new Date(safeStartDate);
        if (Number.isNaN(parsed.getTime())) {
          res.status(400).json({ success: false, error: { message: "Invalid start date" } });
          return;
        }
      }

      const safeEndDate = endDate ? String(endDate) : null;
      if (safeEndDate) {
        const parsed = new Date(safeEndDate);
        if (Number.isNaN(parsed.getTime())) {
          res.status(400).json({ success: false, error: { message: "Invalid end date" } });
          return;
        }
      }

      const result = await query(
        `INSERT INTO patient_medications (patient_id, drug_id, dosage_level, dosage_amount, start_date, end_date, notes, prescribed_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, patient_id, drug_id, dosage_level, dosage_amount, start_date, end_date, notes, prescribed_by, created_at`,
        [id, drugId, safeDosageLevel, dosageAmount || null, safeStartDate, safeEndDate, notes || null, sub],
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Add medication error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to add medication" } });
    }
  },
);

// ---------------------------------------------------------------------------
// PUT /api/patients/:id/medications/:medicationId – update medication
// ---------------------------------------------------------------------------
router.put(
  "/:id/medications/:medicationId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { role } = req.user;
      const { id, medicationId } = req.params;
      const { drugId, dosageLevel, dosageAmount, startDate, endDate, notes } = req.body;

      const patientResult = await query(
        `SELECT id, user_id, created_by FROM patients WHERE id = $1`,
        [id],
      );

      if (patientResult.rows.length === 0) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      const hasAccess = role === "admin" ? true : await canAccessPatient(req.user, id);
      if (!hasAccess) {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }

      if (!drugId) {
        res.status(400).json({ success: false, error: { message: "drugId is required" } });
        return;
      }

      const drugResult = await query(`SELECT id FROM drugs WHERE id = $1`, [drugId]);
      if (drugResult.rows.length === 0) {
        res.status(400).json({ success: false, error: { message: "Drug not found" } });
        return;
      }

      const safeDosageLevel = dosageLevel || null;
      if (safeDosageLevel && !["none", "low", "medium", "high"].includes(safeDosageLevel)) {
        res.status(400).json({ success: false, error: { message: "Invalid dosage level. Must be none, low, medium, or high" } });
        return;
      }

      const safeStartDate = startDate ? String(startDate) : null;
      if (safeStartDate) {
        const parsed = new Date(safeStartDate);
        if (Number.isNaN(parsed.getTime())) {
          res.status(400).json({ success: false, error: { message: "Invalid start date" } });
          return;
        }
      }

      const safeEndDate = endDate ? String(endDate) : null;
      if (safeEndDate) {
        const parsed = new Date(safeEndDate);
        if (Number.isNaN(parsed.getTime())) {
          res.status(400).json({ success: false, error: { message: "Invalid end date" } });
          return;
        }
      }

      const result = await query(
        `UPDATE patient_medications
         SET drug_id = $1,
             dosage_level = $2,
             dosage_amount = $3,
             start_date = $4,
             end_date = $5,
             notes = $6
         WHERE id = $7 AND patient_id = $8
         RETURNING id, patient_id, drug_id, dosage_level, dosage_amount, start_date, end_date, notes, prescribed_by, created_at`,
        [drugId, safeDosageLevel, dosageAmount || null, safeStartDate, safeEndDate, notes || null, medicationId, id],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: { message: "Medication not found" } });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Update medication error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to update medication" } });
    }
  },
);

// ---------------------------------------------------------------------------
// DELETE /api/patients/:id/medications/:medicationId – remove medication
// ---------------------------------------------------------------------------
router.delete(
  "/:id/medications/:medicationId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { role } = req.user;
      const { id, medicationId } = req.params;

      // Verify patient exists and user has access
      const patientResult = await query(
        `SELECT id, user_id, created_by FROM patients WHERE id = $1`,
        [id],
      );

      if (patientResult.rows.length === 0) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      const hasAccess = role === "admin" ? true : await canAccessPatient(req.user, id);
      if (!hasAccess) {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }

      const result = await query(
        `DELETE FROM patient_medications WHERE id = $1 AND patient_id = $2 RETURNING id`,
        [medicationId, id],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: { message: "Medication not found" } });
        return;
      }

      res.status(200).json({
        success: true,
        data: { message: "Medication removed successfully" },
      });
    } catch (error) {
      console.error("Remove medication error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to remove medication" } });
    }
  },
);

router.post(
  "/:id/prescriptions",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { id } = req.params;
      const patient = await getAccessiblePatientOrThrow(req.user, id);
      if (!patient) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      const client = await getClient();
      try {
        await client.query("BEGIN");
        await savePrescription(client, id, req.body, req.user.sub);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

      const detail = await getPatientDetail(id, req.user);
      res.status(201).json({ success: true, data: detail });
    } catch (error) {
      console.error("Create prescription error:", error);
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      if (error instanceof Error && (error.message.includes("required") || error.message.startsWith("Invalid "))) {
        res.status(400).json({ success: false, error: { message: error.message } });
        return;
      }
      res.status(500).json({ success: false, error: { message: "Failed to save prescription" } });
    }
  },
);

router.put(
  "/:id/prescriptions/:prescriptionId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { id, prescriptionId } = req.params;
      const patient = await getAccessiblePatientOrThrow(req.user, id);
      if (!patient) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      const client = await getClient();
      try {
        await client.query("BEGIN");
        await savePrescription(client, id, req.body, req.user.sub, prescriptionId);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

      const detail = await getPatientDetail(id, req.user);
      res.status(200).json({ success: true, data: detail });
    } catch (error) {
      console.error("Update prescription error:", error);
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      if (error instanceof Error && error.message === "Prescription not found") {
        res.status(404).json({ success: false, error: { message: error.message } });
        return;
      }
      if (error instanceof Error && (error.message.includes("required") || error.message.startsWith("Invalid "))) {
        res.status(400).json({ success: false, error: { message: error.message } });
        return;
      }
      res.status(500).json({ success: false, error: { message: "Failed to save prescription" } });
    }
  },
);

router.delete(
  "/:id/prescriptions/:prescriptionId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { id, prescriptionId } = req.params;
      const patient = await getAccessiblePatientOrThrow(req.user, id);
      if (!patient) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      await query(`DELETE FROM patient_medications WHERE prescription_id = $1`, [prescriptionId]);
      const result = await query(`DELETE FROM prescriptions WHERE id = $1 AND patient_id = $2 RETURNING id`, [
        prescriptionId,
        id,
      ]);

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: { message: "Prescription not found" } });
        return;
      }

      const detail = await getPatientDetail(id, req.user);
      res.status(200).json({ success: true, data: detail });
    } catch (error) {
      console.error("Delete prescription error:", error);
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      res.status(500).json({ success: false, error: { message: "Failed to delete prescription" } });
    }
  },
);

export default router;
