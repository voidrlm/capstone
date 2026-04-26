import { Router, Response } from "express";
import { query, getClient } from "../db/index.js";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.js";
import { getAccessiblePatientOrThrow, savePrescription } from "./patientHelpers.js";

const router = Router();

// POST /api/patients/:id/prescriptions
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

      const detail = await getAccessiblePatientOrThrow(req.user, id);
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

// PUT /api/patients/:id/prescriptions/:prescriptionId
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

      const { medications, prescriptionDate, instructions, doctorId, approvalStatus } = req.body;

      const client = await getClient();
      try {
        await client.query("BEGIN");

        // Update prescription
        await client.query(
          `UPDATE prescriptions
           SET prescription_date = COALESCE($1, prescription_date),
               instructions = COALESCE($2, instructions),
               doctor_id = COALESCE($3, doctor_id),
               approval_status = COALESCE($4, approval_status)
           WHERE id = $5 AND patient_id = $6`,
          [prescriptionDate || null, instructions || null, doctorId || null, approvalStatus || null, prescriptionId, id],
        );

        // Delete existing medications
        await client.query(
          `DELETE FROM prescription_medications WHERE prescription_id = $1`,
          [prescriptionId],
        );

        // Add new medications
        if (medications && Array.isArray(medications)) {
          for (const med of medications) {
            await client.query(
              `INSERT INTO prescription_medications (prescription_id, drug_id, medication_name, dosage_level, dosage_amount, start_date, end_date, notes)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                prescriptionId,
                med.drugId || null,
                med.medicationName || "",
                med.dosageLevel || null,
                med.dosageAmount || null,
                med.startDate || null,
                med.endDate || null,
                med.notes || null,
              ],
            );
          }
        }

        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

      const detail = await getAccessiblePatientOrThrow(req.user, id);
      res.json({ success: true, data: detail });
    } catch (error) {
      console.error("Update prescription error:", error);
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      res.status(500).json({ success: false, error: { message: "Failed to update prescription" } });
    }
  },
);

// DELETE /api/patients/:id/prescriptions/:prescriptionId
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

      await query(
        `DELETE FROM prescriptions WHERE id = $1 AND patient_id = $2`,
        [prescriptionId, id],
      );

      const detail = await getAccessiblePatientOrThrow(req.user, id);
      res.json({ success: true, data: detail });
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
