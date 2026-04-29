import { Router, Response } from "express";
import { query } from "../db/index.js";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.js";
import {
  getAccessiblePatientOrThrow,
  getPatientVisitColumns,
  getPatientDiagnosisColumns,
  getPatientLabResultColumns,
  getLegacyLabResultColumns,
} from "./patientHelpers.js";

const router = Router();

// ─── GET /api/patients/:id/medications ───────────────────────────────────────
router.get(
  "/:id/medications",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ success: false, error: { message: "Unauthorized" } }); return; }
      const patient = await getAccessiblePatientOrThrow(req.user, req.params.id);
      if (!patient) { res.status(404).json({ success: false, error: { message: "Patient not found" } }); return; }

      const result = await query(
        `SELECT pm.id, pm.drug_id, d.name AS drug_name, pm.dosage_level, pm.dosage_amount,
                pm.start_date, pm.end_date, pm.notes, pm.created_at
         FROM patient_medications pm
         LEFT JOIN drugs d ON d.id = pm.drug_id
         WHERE pm.patient_id = $1
         ORDER BY pm.created_at DESC`,
        [req.params.id],
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      if (error instanceof Error && error.message === "Forbidden") { res.status(403).json({ success: false, error: { message: "Forbidden" } }); return; }
      console.error("Get medications error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to get medications" } });
    }
  },
);

// ─── GET /api/patients/:id/visits ────────────────────────────────────────────
router.get(
  "/:id/visits",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ success: false, error: { message: "Unauthorized" } }); return; }
      const patient = await getAccessiblePatientOrThrow(req.user, req.params.id);
      if (!patient) { res.status(404).json({ success: false, error: { message: "Patient not found" } }); return; }

      const visitColumns = await getPatientVisitColumns();
      const doctorNameSelect = visitColumns.has("doctor_name") ? "v.doctor_name" : "d.name AS doctor_name";
      const doctorSpecialtySelect = visitColumns.has("doctor_specialty") ? "v.doctor_specialty" : "d.specialty AS doctor_specialty";
      const doctorJoin = visitColumns.has("doctor_name") || visitColumns.has("doctor_specialty") ? "" : "LEFT JOIN doctors d ON d.id = v.doctor_id";

      const result = await query(
        `SELECT v.id, v.visit_date, v.reason, ${doctorNameSelect}, ${doctorSpecialtySelect}, v.created_at
         FROM patient_visits v
         ${doctorJoin}
         WHERE v.patient_id = $1
         ORDER BY v.visit_date DESC`,
        [req.params.id],
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      if (error instanceof Error && error.message === "Forbidden") { res.status(403).json({ success: false, error: { message: "Forbidden" } }); return; }
      console.error("Get visits error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to get visits" } });
    }
  },
);

// ─── GET /api/patients/:id/lab-results ───────────────────────────────────────
router.get(
  "/:id/lab-results",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ success: false, error: { message: "Unauthorized" } }); return; }
      const patient = await getAccessiblePatientOrThrow(req.user, req.params.id);
      if (!patient) { res.status(404).json({ success: false, error: { message: "Patient not found" } }); return; }

      const [labResultColumns, legacyLabResultColumns] = await Promise.all([
        getPatientLabResultColumns(),
        getLegacyLabResultColumns(),
      ]);
      const hasModernLabTable = labResultColumns.size > 0;
      const labTableName = hasModernLabTable ? "patient_lab_results" : "lab_results";
      const labDateColumn = hasModernLabTable ? (labResultColumns.has("date") ? "lr.date" : "lr.result_date") : "lr.result_date";
      const referenceRangeSelect = hasModernLabTable && labResultColumns.has("reference_range") ? "lr.reference_range" : "NULL::text AS reference_range";
      const fileNameSelect = hasModernLabTable
        ? (labResultColumns.has("uploaded_file_name") ? "lr.uploaded_file_name" : "NULL::text AS uploaded_file_name")
        : (legacyLabResultColumns.has("uploaded_file_name") ? "lr.uploaded_file_name" : "NULL::text AS uploaded_file_name");
      const fileMimeSelect = hasModernLabTable
        ? (labResultColumns.has("uploaded_file_mime_type") ? "lr.uploaded_file_mime_type" : "NULL::text AS uploaded_file_mime_type")
        : (legacyLabResultColumns.has("uploaded_file_mime_type") ? "lr.uploaded_file_mime_type" : "NULL::text AS uploaded_file_mime_type");
      const fileContentSelect = hasModernLabTable
        ? (labResultColumns.has("uploaded_file_content") ? "lr.uploaded_file_content" : "NULL::text AS uploaded_file_content")
        : (legacyLabResultColumns.has("uploaded_file_content") ? "lr.uploaded_file_content" : "NULL::text AS uploaded_file_content");

      const result = await query(
        `SELECT lr.id, lr.test_name, lr.result, ${labDateColumn} AS date, ${referenceRangeSelect},
                ${fileNameSelect}, ${fileMimeSelect}, ${fileContentSelect}, lr.created_at
         FROM ${labTableName} lr
         WHERE lr.patient_id = $1
         ORDER BY ${labDateColumn} DESC`,
        [req.params.id],
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      if (error instanceof Error && error.message === "Forbidden") { res.status(403).json({ success: false, error: { message: "Forbidden" } }); return; }
      console.error("Get lab results error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to get lab results" } });
    }
  },
);

// ─── GET /api/patients/:id/diagnoses ─────────────────────────────────────────
router.get(
  "/:id/diagnoses",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ success: false, error: { message: "Unauthorized" } }); return; }
      const patient = await getAccessiblePatientOrThrow(req.user, req.params.id);
      if (!patient) { res.status(404).json({ success: false, error: { message: "Patient not found" } }); return; }

      const diagnosisColumns = await getPatientDiagnosisColumns();
      const dateSelect = diagnosisColumns.has("date") ? "pd.date" : "pd.diagnosis_date AS date";
      const fileNameSelect = diagnosisColumns.has("uploaded_file_name") ? "pd.uploaded_file_name" : "NULL::text AS uploaded_file_name";
      const fileMimeSelect = diagnosisColumns.has("uploaded_file_mime_type") ? "pd.uploaded_file_mime_type" : "NULL::text AS uploaded_file_mime_type";
      const fileContentSelect = diagnosisColumns.has("uploaded_file_content") ? "pd.uploaded_file_content" : "NULL::text AS uploaded_file_content";
      const orderBy = diagnosisColumns.has("date") ? "pd.date" : "pd.diagnosis_date";

      const result = await query(
        `SELECT pd.id, pd.diagnosis_name, ${dateSelect}, ${fileNameSelect}, ${fileMimeSelect}, ${fileContentSelect}, pd.created_at
         FROM patient_diagnoses pd
         WHERE pd.patient_id = $1
         ORDER BY ${orderBy} DESC`,
        [req.params.id],
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      if (error instanceof Error && error.message === "Forbidden") { res.status(403).json({ success: false, error: { message: "Forbidden" } }); return; }
      console.error("Get diagnoses error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to get diagnoses" } });
    }
  },
);

// ─── GET /api/patients/:id/allergies ─────────────────────────────────────────
router.get(
  "/:id/allergies",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ success: false, error: { message: "Unauthorized" } }); return; }
      const patient = await getAccessiblePatientOrThrow(req.user, req.params.id);
      if (!patient) { res.status(404).json({ success: false, error: { message: "Patient not found" } }); return; }

      const result = await query(
        `SELECT pa.id, pa.allergy_name, pa.created_at
         FROM patient_allergies pa
         WHERE pa.patient_id = $1
         ORDER BY pa.created_at DESC`,
        [req.params.id],
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      if (error instanceof Error && error.message === "Forbidden") { res.status(403).json({ success: false, error: { message: "Forbidden" } }); return; }
      console.error("Get allergies error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to get allergies" } });
    }
  },
);

// ─── GET /api/patients/:id/vaccinations ──────────────────────────────────────
router.get(
  "/:id/vaccinations",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ success: false, error: { message: "Unauthorized" } }); return; }
      const patient = await getAccessiblePatientOrThrow(req.user, req.params.id);
      if (!patient) { res.status(404).json({ success: false, error: { message: "Patient not found" } }); return; }

      const result = await query(
        `SELECT pv.id, pv.vaccine_name, pv.administered_date, pv.dose, pv.created_at
         FROM patient_vaccinations pv
         WHERE pv.patient_id = $1
         ORDER BY pv.administered_date DESC`,
        [req.params.id],
      ).catch(() => ({ rows: [] }));
      res.json({ success: true, data: result.rows });
    } catch (error) {
      if (error instanceof Error && error.message === "Forbidden") { res.status(403).json({ success: false, error: { message: "Forbidden" } }); return; }
      console.error("Get vaccinations error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to get vaccinations" } });
    }
  },
);

// ─── GET /api/patients/:id/prescriptions ─────────────────────────────────────
router.get(
  "/:id/prescriptions",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ success: false, error: { message: "Unauthorized" } }); return; }
      const patient = await getAccessiblePatientOrThrow(req.user, req.params.id);
      if (!patient) { res.status(404).json({ success: false, error: { message: "Patient not found" } }); return; }

      const result = await query(
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
        [req.params.id],
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      if (error instanceof Error && error.message === "Forbidden") { res.status(403).json({ success: false, error: { message: "Forbidden" } }); return; }
      console.error("Get prescriptions error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to get prescriptions" } });
    }
  },
);

export default router;
