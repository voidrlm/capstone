import { Router, Response } from "express";
import { query } from "../db/index.js";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.js";

const router = Router();

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
  return role === "provider" || role === "admin";
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
      } else if (role === "provider") {
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
        `SELECT p.id, p.name, p.date_of_birth, p.age_group, p.medical_history, p.created_at
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
        `SELECT p.id, p.user_id, p.name, p.date_of_birth, p.age_group,
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
      if (role === "provider" && patient.created_by !== sub) {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      // admin: allowed

      const medicationsResult = await query(
        `SELECT pm.id, pm.drug_id, d.name AS drug_name, pm.dosage_level,
                pm.dosage_amount, pm.start_date, pm.end_date, pm.notes,
                pm.prescribed_by, pm.created_at
         FROM patient_medications pm
         LEFT JOIN drugs d ON d.id = pm.drug_id
         WHERE pm.patient_id = $1
         ORDER BY pm.start_date DESC`,
        [id],
      );

      res.status(200).json({
        success: true,
        data: {
          ...patient,
          medications: medicationsResult.rows,
        },
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

      const { name, dateOfBirth, ageGroup, medicalHistory } = req.body;

      if (!name || typeof name !== "string" || !name.trim()) {
        res.status(400).json({ success: false, error: { message: "Name is required" } });
        return;
      }

      const safeName = name.trim();
      const safeDob = dateOfBirth ? String(dateOfBirth) : null;

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

      const safeMedicalHistory: string[] | null =
        Array.isArray(medicalHistory) ? medicalHistory.map(String) : null;

      const result = await query(
        `INSERT INTO patients (name, date_of_birth, age_group, medical_history, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, date_of_birth, age_group, medical_history, created_by, created_at`,
        [safeName, safeDob, resolvedAgeGroup, safeMedicalHistory, sub],
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
      });
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
      if (role === "provider" && patient.created_by !== sub) {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }

      const { name, dateOfBirth, ageGroup, medicalHistory } = req.body;

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

      if (medicalHistory !== undefined) {
        setClauses.push(`medical_history = $${paramIdx++}`);
        params.push(Array.isArray(medicalHistory) ? medicalHistory.map(String) : null);
      }

      if (setClauses.length === 0) {
        res.status(400).json({ success: false, error: { message: "No fields to update" } });
        return;
      }

      setClauses.push(`updated_at = NOW()`);
      params.push(id);

      const result = await query(
        `UPDATE patients
         SET ${setClauses.join(", ")}
         WHERE id = $${paramIdx}
         RETURNING id, name, date_of_birth, age_group, medical_history, created_by, created_at, updated_at`,
        params,
      );

      res.status(200).json({
        success: true,
        data: result.rows[0],
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
      if (role === "provider") {
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
      if (role === "provider" && patient.created_by !== sub) {
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
      if (role === "provider" && patient.created_by !== sub) {
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
