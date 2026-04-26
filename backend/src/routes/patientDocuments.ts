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

        // Resolve document type
        let resolvedDocumentType = document_type;
        if (!resolvedDocumentType) {
          try {
            const parsedData = await parseUploadedDocument(uploaded_file_content);
            resolvedDocumentType = parsedData.type || "patient_document";
          } catch {
            resolvedDocumentType = "patient_document";
          }
        }

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

        await client.query("COMMIT");

        const detail = await getAccessiblePatientOrThrow(req.user, id);
        res.status(201).json({ success: true, data: detail });
      } catch (error) {
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
      res.status(500).json({ success: false, error: { message: "Failed to upload document" } });
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
