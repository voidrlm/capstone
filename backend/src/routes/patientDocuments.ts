import { Router, Response } from "express";
import { query, getClient } from "../db/index.js";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.js";
import { parseUploadedDocument } from "../services/documentParser.js";
import { getAccessiblePatientOrThrow } from "./patientHelpers.js";

const router = Router();

// POST /api/patients/:id/documents/preview
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
      const patient = await getAccessiblePatientOrThrow(req.user, id);
      if (!patient) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      const { uploaded_file_content } = req.body;

      if (!uploaded_file_content) {
        res.status(400).json({ success: false, error: { message: "uploaded_file_content is required" } });
        return;
      }

      const parsedData = await parseUploadedDocument(uploaded_file_content);
      res.json({ success: true, data: parsedData });
    } catch (error) {
      console.error("Preview document error:", error);
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      res.status(500).json({ success: false, error: { message: "Failed to preview document" } });
    }
  },
);

// POST /api/patients/:id/documents
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
      const patient = await getAccessiblePatientOrThrow(req.user, id);
      if (!patient) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      const { title, document_type, uploaded_file_name, uploaded_file_mime_type, uploaded_file_content } = req.body;

      if (!uploaded_file_content) {
        res.status(400).json({ success: false, error: { message: "uploaded_file_content is required" } });
        return;
      }

      const client = await getClient();
      try {
        await client.query("BEGIN");

        // Parse document
        let parsedData: Awaited<ReturnType<typeof parseUploadedDocument>> | null = null;
        let resolvedDocumentType = document_type;
        try {
          parsedData = await parseUploadedDocument(uploaded_file_content);
          resolvedDocumentType = document_type || parsedData.type || "patient_document";
        } catch {
          resolvedDocumentType = document_type || "patient_document";
        }

        // Save document
        await client.query(
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
            title || "Uploaded document",
            resolvedDocumentType,
            uploaded_file_name || "document",
            uploaded_file_mime_type || "application/octet-stream",
            uploaded_file_content,
            req.user.sub,
          ],
        );

        // Extract and save data based on document type
        let extractedMedications = 0;
        let extractedLabResults = 0;
        let extractedVaccinations = 0;
        let extractedVisits = 0;
        let extractedInsuranceEOBs = 0;

        if (parsedData) {
          // Save prescription and medications
          if (parsedData.type === "prescription" && parsedData.medications && parsedData.medications.length > 0) {
            // Create prescription record
            const prescriptionResult = await client.query(
              `INSERT INTO prescriptions (patient_id, prescription_date, instructions, approval_status, uploaded_file_name)
               VALUES ($1, CURRENT_DATE, $2, 'approved', $3)
               RETURNING id`,
              [id, `Extracted from uploaded document: ${uploaded_file_name || "prescription"}`, uploaded_file_name || null],
            );
            const prescriptionId = prescriptionResult.rows[0].id;

            // Create prescription medications
            for (const med of parsedData.medications) {
              await client.query(
                `INSERT INTO prescription_medications (prescription_id, drug_id, medication_name, dosage_level, dosage_amount, notes)
                 VALUES ($1, NULL, $2, 'medium', $3, $4)
                 ON CONFLICT DO NOTHING`,
                [prescriptionId, med.name, med.dosageAmount || null, med.instructions || med.frequency || null],
              );

              // Also add to patient medications for tracking
              await client.query(
                `INSERT INTO patient_medications (patient_id, drug_id, dosage_level, dosage_amount, start_date, notes, prescribed_by, prescription_id)
                 VALUES ($1, NULL, 'medium', $2, CURRENT_DATE, $3, $4, $5)
                 ON CONFLICT DO NOTHING`,
                [id, med.dosageAmount || null, med.instructions || `${med.name} ${med.frequency || ""}`.trim(), req.user.sub, prescriptionId],
              );
            }
            extractedMedications = parsedData.medications.length;
          } else if (parsedData.medications && parsedData.medications.length > 0) {
            // For non-prescription documents with medications, just save to patient_medications
            for (const med of parsedData.medications) {
              await client.query(
                `INSERT INTO patient_medications (patient_id, drug_id, dosage_level, dosage_amount, start_date, notes, prescribed_by)
                 VALUES ($1, NULL, 'medium', $2, CURRENT_DATE, $3, $4)
                 ON CONFLICT DO NOTHING`,
                [id, med.dosageAmount || null, med.instructions || `${med.name} ${med.frequency || ""}`.trim(), req.user.sub],
              );
            }
            extractedMedications = parsedData.medications.length;
          }

          // Save lab results
          if (parsedData.labResults && parsedData.labResults.length > 0) {
            for (const lab of parsedData.labResults) {
              await client.query(
                `INSERT INTO patient_lab_results (patient_id, test_name, result, date, reference_range)
                 VALUES ($1, $2, $3, CURRENT_DATE, $4)
                 ON CONFLICT DO NOTHING`,
                [id, lab.testName, lab.result, lab.referenceRange || null],
              );
            }
            extractedLabResults = parsedData.labResults.length;
          }

          // Save vaccinations
          if (parsedData.vaccinations && parsedData.vaccinations.length > 0) {
            for (const vax of parsedData.vaccinations) {
              const vaxDate = vax.date ? new Date(vax.date) : null;
              await client.query(
                `INSERT INTO patient_vaccinations (patient_id, vaccine_name, administered_date, dose)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT DO NOTHING`,
                [id, vax.vaccineName, (vaxDate && !isNaN(vaxDate.getTime())) ? vaxDate.toISOString() : null, vax.dose || null],
              );
            }
            extractedVaccinations = parsedData.vaccinations.length;
          }

          // Save visits
          if (parsedData.visits && parsedData.visits.length > 0) {
            for (const visit of parsedData.visits) {
              const visitDate = visit.visitDate ? new Date(visit.visitDate) : null;
              await client.query(
                `INSERT INTO patient_visits (patient_id, visit_date, reason)
                 VALUES ($1, $2, $3)
                 ON CONFLICT DO NOTHING`,
                [id, (visitDate && !isNaN(visitDate.getTime())) ? visitDate.toISOString() : null, visit.reason || null],
              );
            }
            extractedVisits = parsedData.visits.length;
          }

          // Save insurance EOB
          if (parsedData.insuranceEOB) {
            try {
              const eob = parsedData.insuranceEOB;
              const statementDate = eob.statementDate ? new Date(eob.statementDate) : null;
              const serviceDate = eob.serviceDate ? new Date(eob.serviceDate) : null;
              await client.query(
                `INSERT INTO patient_insurance_eobs (
                   patient_id, insurer_name, plan_name, statement_date, service_date,
                   total_billed, plan_paid, your_responsibility, claim_reference
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT DO NOTHING`,
                [
                  id,
                  eob.insurerName || null,
                  eob.planName || null,
                  (statementDate && !isNaN(statementDate.getTime())) ? statementDate.toISOString() : null,
                  (serviceDate && !isNaN(serviceDate.getTime())) ? serviceDate.toISOString() : null,
                  eob.totalBilled ? parseFloat(eob.totalBilled.replace(/[$,]/g, "")) : null,
                  eob.planPaid ? parseFloat(eob.planPaid.replace(/[$,]/g, "")) : null,
                  eob.yourResponsibility ? parseFloat(eob.yourResponsibility.replace(/[$,]/g, "")) : null,
                  eob.claimReference || null,
                ],
              );
              extractedInsuranceEOBs = 1;
            } catch (eobError) {
              console.warn("Failed to save insurance EOB (table may not exist):", eobError);
            }
          }
        }

        await client.query("COMMIT");

        const detail = await getAccessiblePatientOrThrow(req.user, id);
        res.status(201).json({
          success: true,
          data: detail,
          extractedType: resolvedDocumentType,
          extractedMedications,
          extractedLabResults,
          extractedVaccinations,
          extractedVisits,
          extractedInsuranceEOBs,
        });
      } catch (error) {
        console.error("Transaction error during document upload:", error);
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Upload document error:", error);
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, error: { message: "Failed to upload document", details: errorMessage } });
    }
  },
);

// DELETE /api/patients/:id/documents/:documentId
router.delete(
  "/:id/documents/:documentId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { id, documentId } = req.params;
      const patient = await getAccessiblePatientOrThrow(req.user, id);
      if (!patient) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      await query(
        `DELETE FROM patient_documents WHERE id = $1 AND patient_id = $2 RETURNING id`,
        [documentId, id],
      );

      const detail = await getAccessiblePatientOrThrow(req.user, id);
      res.json({ success: true, data: detail });
    } catch (error) {
      console.error("Delete document error:", error);
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
      res.status(500).json({ success: false, error: { message: "Failed to delete document" } });
    }
  },
);

export default router;
