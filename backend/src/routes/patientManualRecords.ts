import { Router, Response } from "express";
import { query } from "../db/index.js";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.js";
import { getAccessiblePatientOrThrow } from "./patientHelpers.js";

const router = Router();

// POST /api/patients/:id/lab-results
router.post(
  "/:id/lab-results",
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

      const { test_name, result, date, reference_range } = req.body;

      if (!test_name || !result || !date) {
        res.status(400).json({ success: false, error: { message: "test_name, result, and date are required" } });
        return;
      }

      const parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) {
        res.status(400).json({ success: false, error: { message: "Invalid date" } });
        return;
      }

      await query(
        `INSERT INTO patient_lab_results (patient_id, test_name, result, date, reference_range)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, patient_id, test_name, result, date, reference_range`,
        [id, test_name, result, parsedDate.toISOString(), reference_range || null],
      );

      const detail = await getAccessiblePatientOrThrow(req.user, id);
      res.status(201).json({ success: true, data: detail });
    } catch (error) {
      console.error("Add lab result error:", error);
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      if (error instanceof Error && (error.message.includes("required") || error.message.startsWith("Invalid "))) {
        res.status(400).json({ success: false, error: { message: error.message } });
        return;
      }
      res.status(500).json({ success: false, error: { message: "Failed to add lab result" } });
    }
  },
);

// POST /api/patients/:id/visits
router.post(
  "/:id/visits",
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

      const { reason, visit_date, doctor_name, doctor_specialty } = req.body;

      if (!visit_date) {
        res.status(400).json({ success: false, error: { message: "visit_date is required" } });
        return;
      }

      const parsedDate = new Date(visit_date);
      if (Number.isNaN(parsedDate.getTime())) {
        res.status(400).json({ success: false, error: { message: "Invalid visit date" } });
        return;
      }

      await query(
        `INSERT INTO patient_visits (patient_id, visit_date, reason, doctor_name, doctor_specialty)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, patient_id, visit_date, reason, doctor_name, doctor_specialty`,
        [id, parsedDate.toISOString(), reason || null, doctor_name || null, doctor_specialty || null],
      );

      const detail = await getAccessiblePatientOrThrow(req.user, id);
      res.status(201).json({ success: true, data: detail });
    } catch (error) {
      console.error("Add visit error:", error);
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      if (error instanceof Error && (error.message.includes("required") || error.message.startsWith("Invalid "))) {
        res.status(400).json({ success: false, error: { message: error.message } });
        return;
      }
      res.status(500).json({ success: false, error: { message: "Failed to add visit" } });
    }
  },
);

// POST /api/patients/:id/vaccinations
router.post(
  "/:id/vaccinations",
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

      const { vaccine_name, administered_date, dose } = req.body;

      if (!vaccine_name || !administered_date) {
        res.status(400).json({ success: false, error: { message: "vaccine_name and administered_date are required" } });
        return;
      }

      const parsedDate = new Date(administered_date);
      if (Number.isNaN(parsedDate.getTime())) {
        res.status(400).json({ success: false, error: { message: "Invalid administered date" } });
        return;
      }

      await query(
        `INSERT INTO patient_vaccinations (patient_id, vaccine_name, administered_date, dose)
         VALUES ($1, $2, $3, $4)
         RETURNING id, patient_id, vaccine_name, administered_date, dose`,
        [id, vaccine_name, parsedDate.toISOString(), dose || null],
      );

      const detail = await getAccessiblePatientOrThrow(req.user, id);
      res.status(201).json({ success: true, data: detail });
    } catch (error) {
      console.error("Add vaccination error:", error);
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      if (error instanceof Error && (error.message.includes("required") || error.message.startsWith("Invalid "))) {
        res.status(400).json({ success: false, error: { message: error.message } });
        return;
      }
      res.status(500).json({ success: false, error: { message: "Failed to add vaccination" } });
    }
  },
);

// POST /api/patients/:id/diagnoses
router.post(
  "/:id/diagnoses",
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

      const { diagnosis_name, date } = req.body;

      if (!diagnosis_name || !date) {
        res.status(400).json({ success: false, error: { message: "diagnosis_name and date are required" } });
        return;
      }

      const parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) {
        res.status(400).json({ success: false, error: { message: "Invalid date" } });
        return;
      }

      await query(
        `INSERT INTO patient_diagnoses (patient_id, diagnosis_name, date)
         VALUES ($1, $2, $3)
         RETURNING id, patient_id, diagnosis_name, date`,
        [id, diagnosis_name, parsedDate.toISOString()],
      );

      const detail = await getAccessiblePatientOrThrow(req.user, id);
      res.status(201).json({ success: true, data: detail });
    } catch (error) {
      console.error("Add diagnosis error:", error);
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      if (error instanceof Error && (error.message.includes("required") || error.message.startsWith("Invalid "))) {
        res.status(400).json({ success: false, error: { message: error.message } });
        return;
      }
      res.status(500).json({ success: false, error: { message: "Failed to add diagnosis" } });
    }
  },
);

// POST /api/patients/:id/insurance-eobs
router.post(
  "/:id/insurance-eobs",
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

      const { insurer_name, plan_name, statement_date, service_date, total_billed, plan_paid, your_responsibility, claim_reference } = req.body;

      if (!insurer_name || !statement_date) {
        res.status(400).json({ success: false, error: { message: "insurer_name and statement_date are required" } });
        return;
      }

      const parsedStatementDate = new Date(statement_date);
      if (Number.isNaN(parsedStatementDate.getTime())) {
        res.status(400).json({ success: false, error: { message: "Invalid statement date" } });
        return;
      }

      const parsedServiceDate = service_date ? new Date(service_date) : null;
      if (parsedServiceDate && Number.isNaN(parsedServiceDate.getTime())) {
        res.status(400).json({ success: false, error: { message: "Invalid service date" } });
        return;
      }

      await query(
        `INSERT INTO patient_insurance_eobs (patient_id, insurer_name, plan_name, statement_date, service_date, total_billed, plan_paid, your_responsibility, claim_reference)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, patient_id, insurer_name, plan_name, statement_date, service_date, total_billed, plan_paid, your_responsibility, claim_reference`,
        [id, insurer_name, plan_name || null, parsedStatementDate.toISOString(), parsedServiceDate ? parsedServiceDate.toISOString() : null, total_billed || null, plan_paid || null, your_responsibility || null, claim_reference || null],
      );

      const detail = await getAccessiblePatientOrThrow(req.user, id);
      res.status(201).json({ success: true, data: detail });
    } catch (error) {
      console.error("Add insurance EOB error:", error);
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      if (error instanceof Error && (error.message.includes("required") || error.message.startsWith("Invalid "))) {
        res.status(400).json({ success: false, error: { message: error.message } });
        return;
      }
      res.status(500).json({ success: false, error: { message: "Failed to add insurance EOB" } });
    }
  },
);

// POST /api/patients/:id/discharge-summaries
router.post(
  "/:id/discharge-summaries",
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

      const { admission_date, discharge_date, primary_diagnosis, attending_physician, los_days } = req.body;

      if (!discharge_date || !primary_diagnosis) {
        res.status(400).json({ success: false, error: { message: "discharge_date and primary_diagnosis are required" } });
        return;
      }

      const parsedDischargeDate = new Date(discharge_date);
      if (Number.isNaN(parsedDischargeDate.getTime())) {
        res.status(400).json({ success: false, error: { message: "Invalid discharge date" } });
        return;
      }

      const parsedAdmissionDate = admission_date ? new Date(admission_date) : null;
      if (parsedAdmissionDate && Number.isNaN(parsedAdmissionDate.getTime())) {
        res.status(400).json({ success: false, error: { message: "Invalid admission date" } });
        return;
      }

      await query(
        `INSERT INTO patient_discharge_summaries (patient_id, admission_date, discharge_date, primary_diagnosis, attending_physician, los_days)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, patient_id, admission_date, discharge_date, primary_diagnosis, attending_physician, los_days`,
        [id, parsedAdmissionDate ? parsedAdmissionDate.toISOString() : null, parsedDischargeDate.toISOString(), primary_diagnosis, attending_physician || null, los_days || null],
      );

      const detail = await getAccessiblePatientOrThrow(req.user, id);
      res.status(201).json({ success: true, data: detail });
    } catch (error) {
      console.error("Add discharge summary error:", error);
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      if (error instanceof Error && (error.message.includes("required") || error.message.startsWith("Invalid "))) {
        res.status(400).json({ success: false, error: { message: error.message } });
        return;
      }
      res.status(500).json({ success: false, error: { message: "Failed to add discharge summary" } });
    }
  },
);

export default router;
