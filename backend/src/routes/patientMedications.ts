import { Router, Response } from "express";
import { query } from "../db/index.js";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.js";
import { getAccessiblePatientOrThrow, canAccessPatient } from "./patientHelpers.js";

const router = Router();

// POST /api/patients/:id/medications
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

// PATCH /api/patients/:id/medications/:medicationId
router.patch(
  "/:id/medications/:medicationId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { id, medicationId } = req.params;
      const patient = await getAccessiblePatientOrThrow(req.user, id);
      if (!patient) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      const { dosageLevel, dosageAmount, startDate, endDate, notes } = req.body;

      const safeDosageLevel = dosageLevel || null;
      if (safeDosageLevel && !["none", "low", "medium", "high"].includes(safeDosageLevel)) {
        res.status(400).json({ success: false, error: { message: "Invalid dosage level" } });
        return;
      }

      const result = await query(
        `UPDATE patient_medications
         SET dosage_level = COALESCE($1, dosage_level),
             dosage_amount = COALESCE($2, dosage_amount),
             start_date = COALESCE($3, start_date),
             end_date = COALESCE($4, end_date),
             notes = COALESCE($5, notes)
         WHERE id = $6 AND patient_id = $7
         RETURNING id, patient_id, drug_id, dosage_level, dosage_amount, start_date, end_date, notes`,
        [safeDosageLevel, dosageAmount || null, startDate || null, endDate || null, notes || null, medicationId, id],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: { message: "Medication not found" } });
        return;
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error("Update medication error:", error);
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      res.status(500).json({ success: false, error: { message: "Failed to update medication" } });
    }
  },
);

// PUT /api/patients/:id/medications/:medicationId
router.put(
  "/:id/medications/:medicationId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { id, medicationId } = req.params;
      const patient = await getAccessiblePatientOrThrow(req.user, id);
      if (!patient) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      const { drugId, dosageLevel, dosageAmount, startDate, endDate, notes } = req.body;

      if (!drugId) {
        res.status(400).json({ success: false, error: { message: "drugId is required" } });
        return;
      }

      const safeDosageLevel = dosageLevel || null;
      if (safeDosageLevel && !["none", "low", "medium", "high"].includes(safeDosageLevel)) {
        res.status(400).json({ success: false, error: { message: "Invalid dosage level" } });
        return;
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
         RETURNING id, patient_id, drug_id, dosage_level, dosage_amount, start_date, end_date, notes`,
        [drugId, safeDosageLevel, dosageAmount || null, startDate || null, endDate || null, notes || null, medicationId, id],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: { message: "Medication not found" } });
        return;
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error("Replace medication error:", error);
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      res.status(500).json({ success: false, error: { message: "Failed to replace medication" } });
    }
  },
);

// DELETE /api/patients/:id/medications/:medicationId
router.delete(
  "/:id/medications/:medicationId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { id, medicationId } = req.params;
      const patient = await getAccessiblePatientOrThrow(req.user, id);
      if (!patient) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
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

      res.json({ success: true, message: "Medication deleted successfully" });
    } catch (error) {
      console.error("Delete medication error:", error);
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      res.status(500).json({ success: false, error: { message: "Failed to delete medication" } });
    }
  },
);

export default router;
