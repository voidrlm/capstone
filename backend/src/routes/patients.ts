import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { getClient, query } from "../db/index.js";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.js";

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
  return role === "provider" || role === "admin" || role === "org_admin";
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
};

type DiagnosisInput = {
  diagnosisName?: string | null;
  date?: string | null;
};

type AllergyInput = {
  allergyName?: string | null;
};

type PrescriptionInput = {
  medication?: string | null;
  instructions?: string | null;
  drugId?: string | null;
  doctorId?: string | null;
  doctor?: NestedDoctorInput | null;
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

async function getPatientDetail(patientId: string) {
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
    `SELECT lr.id, lr.test_name, lr.result, lr.result_date AS date
     FROM lab_results lr
     WHERE lr.patient_id = $1
     ORDER BY lr.result_date DESC, lr.created_at DESC`,
    [patientId],
  );

  const diagnoses = await query(
    `SELECT pd.id, pd.diagnosis_name, pd.diagnosis_date AS date
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

  const prescriptions = await query(
    `SELECT pr.id, pr.doctor_id, d.name AS doctor_name, d.specialty AS doctor_specialty,
            pr.drug_id, COALESCE(dr.name, pr.medication) AS medication, pr.instructions
     FROM prescriptions pr
     LEFT JOIN doctors d ON d.id = pr.doctor_id
     LEFT JOIN drugs dr ON dr.id = pr.drug_id
     WHERE pr.patient_id = $1
     ORDER BY pr.created_at DESC`,
    [patientId],
  );

  return {
    ...patientResult.rows[0],
    medications: medicationsResult.rows,
    visits: visitsResult.rows,
    labResults: labResults.rows,
    diagnoses: diagnoses.rows,
    allergies: allergies.rows,
    prescriptions: prescriptions.rows,
  };
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
      if (!testName && !result && !date) {
        continue;
      }
      if (!testName) {
        throw new Error("Lab result test name is required");
      }

      await client.query(
        `INSERT INTO lab_results (patient_id, test_name, result, result_date)
         VALUES ($1, $2, $3, $4)`,
        [patientId, testName, result || null, ensureDate(date, "lab result date")],
      );
    }
  }

  if (Array.isArray(payload.diagnoses)) {
    await client.query(`DELETE FROM patient_diagnoses WHERE patient_id = $1`, [patientId]);

    for (const diagnosis of payload.diagnoses) {
      const diagnosisName = String(diagnosis?.diagnosisName ?? "").trim();
      const date = String(diagnosis?.date ?? "").trim();
      if (!diagnosisName && !date) {
        continue;
      }
      if (!diagnosisName) {
        throw new Error("Diagnosis name is required");
      }

      await client.query(
        `INSERT INTO patient_diagnoses (patient_id, diagnosis_name, diagnosis_date)
         VALUES ($1, $2, $3)`,
        [patientId, diagnosisName, ensureDate(date, "diagnosis date")],
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
    await client.query(`DELETE FROM prescriptions WHERE patient_id = $1`, [patientId]);

    for (const prescription of payload.prescriptions) {
      const medication = String(prescription?.medication ?? "").trim();
      const instructions = String(prescription?.instructions ?? "").trim();
      const drugId = String(prescription?.drugId ?? "").trim() || null;
      if (!medication && !instructions && !drugId) {
        continue;
      }
      if (!medication && !drugId) {
        throw new Error("Prescription medication is required");
      }

      const doctorId = await resolveDoctorId(
        client,
        prescription?.doctor ?? null,
        prescription?.doctorId ?? null,
      );

      await client.query(
        `INSERT INTO prescriptions (patient_id, doctor_id, drug_id, medication, instructions)
         VALUES ($1, $2, $3, $4, $5)`,
        [patientId, doctorId, drugId, medication || "Unknown medication", instructions || null],
      );
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
      } else if (role === "provider" || role === "org_admin") {
        conditions.push(`p.created_by = $${paramIdx++}`);
        params.push(sub);
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

      const dataParams = [...params, limit, offset];
      const rows = await query(
        `SELECT p.id, p.name, p.date_of_birth, p.gender, p.age_group, p.medical_history, p.created_at
         FROM patients p
         ${whereClause}
         ORDER BY p.created_at DESC
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

      const { sub, role } = req.user;
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

      const patient = patientResult.rows[0];

      // Authorization check
      if (role === "patient" && patient.user_id !== sub) {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      if ((role === "provider" || role === "org_admin") && patient.created_by !== sub) {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      // admin: allowed

      const detail = await getPatientDetail(id);

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

      if (safePassword.length < 8) {
        res.status(400).json({ success: false, error: { message: "Password must be at least 8 characters long" } });
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

      const hashedPassword = await bcrypt.hash(safePassword, 10);
      const client = await getClient();

      try {
        await client.query("BEGIN");

        const existingUserResult = await client.query(
          "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
          [normalizedEmail],
        );

        if (existingUserResult.rows.length > 0) {
          await client.query("ROLLBACK");
          res.status(409).json({ success: false, error: { message: "Email already registered" } });
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

        const providerUserResult = await client.query(
          `SELECT organization_id FROM users WHERE id = $1 LIMIT 1`,
          [sub],
        );
        const organizationId = providerUserResult.rows[0]?.organization_id ?? null;
        const hasOrganizationColumn = userColumns.has("organization_id");

        const insertColumns = [
          "email",
          "password_hash",
          nameColumn,
          "role",
          ...(hasPhoneColumn ? ["phone"] : []),
          ...(hasOrganizationColumn ? ["organization_id"] : []),
        ];
        const insertParams: unknown[] = [
          normalizedEmail,
          hashedPassword,
          safeName,
          "patient",
          ...(hasPhoneColumn ? [safePhone] : []),
          ...(hasOrganizationColumn ? [organizationId] : []),
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

        const createdUserId = createdUserResult.rows[0]?.id;

        const result = await client.query(
          `INSERT INTO patients (user_id, name, date_of_birth, gender, age_group, medical_history, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, user_id, name, date_of_birth, gender, age_group, medical_history, created_by, created_at`,
          [createdUserId, safeName, safeDob, safeGender, resolvedAgeGroup, safeMedicalHistory, sub],
        );

        const patientId = result.rows[0].id as string;

        await syncPatientRelatedData(client, patientId, {
          visits: Array.isArray(visits) ? visits : undefined,
          labResults: Array.isArray(labResults) ? labResults : undefined,
          diagnoses: Array.isArray(diagnoses) ? diagnoses : undefined,
          allergies: Array.isArray(allergies) ? allergies : undefined,
          prescriptions: Array.isArray(prescriptions) ? prescriptions : undefined,
        });

        await client.query("COMMIT");

        const detail = await getPatientDetail(patientId);

        res.status(201).json({
          success: true,
          data: detail,
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

      const { sub, role } = req.user;
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

      const patient = existing.rows[0];
      if (role === "patient" && patient.user_id !== sub) {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      if ((role === "provider" || role === "org_admin") && patient.created_by !== sub) {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }

      const { name, dateOfBirth, gender, ageGroup, medicalHistory, visits, labResults, diagnoses, allergies, prescriptions } = req.body;

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

        await client.query("COMMIT");
      } catch (dbError) {
        await client.query("ROLLBACK");
        throw dbError;
      } finally {
        client.release();
      }

      const detail = await getPatientDetail(id);

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

      const { sub, role } = req.user;
      const { id } = req.params;

      if (!isProviderOrAdmin(role)) {
        res.status(403).json({ success: false, error: { message: "Only providers and admins can delete patients" } });
        return;
      }

      // Authorization: providers can only delete patients they created
      if (role === "provider" || role === "org_admin") {
        const existing = await query(
          `SELECT id FROM patients WHERE id = $1 AND created_by = $2`,
          [id, sub],
        );
        if (existing.rows.length === 0) {
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

      const patient = patientResult.rows[0];
      if (role === "patient" && patient.user_id !== sub) {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      if ((role === "provider" || role === "org_admin") && patient.created_by !== sub) {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }

      const { drugId, dosageLevel, dosageAmount, startDate, notes } = req.body;

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

      const result = await query(
        `INSERT INTO patient_medications (patient_id, drug_id, dosage_level, dosage_amount, start_date, notes, prescribed_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, patient_id, drug_id, dosage_level, dosage_amount, start_date, notes, prescribed_by, created_at`,
        [id, drugId, safeDosageLevel, dosageAmount || null, safeStartDate, notes || null, sub],
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

      const { sub, role } = req.user;
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

      const patient = patientResult.rows[0];
      if (role === "patient" && patient.user_id !== sub) {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      if ((role === "provider" || role === "org_admin") && patient.created_by !== sub) {
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

export default router;
