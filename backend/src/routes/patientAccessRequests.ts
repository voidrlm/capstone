import { Router, Response } from "express";
import { query, getClient } from "../db/index.js";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.js";
import {
  findPatientByEmail,
  ensurePatientNotificationsTable,
  ensurePatientOrganizationLink,
  canRequestPatientAccess,
  getUserOrganizationIds,
  getPatientOrganizationIds,
  getOrganizationMemberColumns,
} from "./patientHelpers.js";

const router = Router();

// GET /api/patients/access-requests/search
router.get(
  "/access-requests/search",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { sub, role } = req.user;
      const { email } = req.query;

      if (!email) {
        res.status(400).json({ success: false, error: { message: "email is required" } });
        return;
      }

      if (!canRequestPatientAccess(role)) {
        res.status(403).json({ success: false, error: { message: "Only doctors and nurses can search for patients" } });
        return;
      }

      const client = await getClient();
      try {
        const patientResult = await findPatientByEmail(client, String(email));

        if (patientResult.rows.length === 0) {
          res.json({ success: true, data: null });
          return;
        }

        const patient = patientResult.rows[0];

        const userOrganizationIds = await getUserOrganizationIds(client, sub);
        const patientOrganizationIds = await getPatientOrganizationIds(client, patient.patient_id);

        const hasSharedOrganization = userOrganizationIds.some((orgId) =>
          patientOrganizationIds.includes(orgId),
        );

        res.json({
          success: true,
          data: {
            patient_id: patient.patient_id,
            patient_name: patient.patient_name,
            patient_email: patient.patient_email,
            has_shared_organization: hasSharedOrganization,
          },
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Search patient error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to search for patient" } });
    }
  },
);

// POST /api/patients/access-requests
router.post(
  "/access-requests",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { sub, role } = req.user;
      const { patient_id, organization_id } = req.body;

      if (!patient_id) {
        res.status(400).json({ success: false, error: { message: "patient_id is required" } });
        return;
      }

      if (!canRequestPatientAccess(role)) {
        res.status(403).json({ success: false, error: { message: "Only doctors and nurses can request patient access" } });
        return;
      }

      const client = await getClient();
      try {
        await client.query("BEGIN");

        // Check if request already exists
        const existingRequest = await client.query(
          `SELECT id FROM patient_access_requests WHERE patient_id = $1 AND requested_by = $2 AND status = 'pending'`,
          [patient_id, sub],
        );

        if (existingRequest.rows.length > 0) {
          await client.query("ROLLBACK");
          res.status(400).json({ success: false, error: { message: "Access request already pending" } });
          return;
        }

        // Insert access request
        await client.query(
          `INSERT INTO patient_access_requests (patient_id, requested_by, organization_id, status)
           VALUES ($1, $2, $3, 'pending')
           RETURNING id`,
          [patient_id, sub, organization_id || null],
        );

        // Create notification for patient
        await ensurePatientNotificationsTable(client);

        const patientUserResult = await client.query(
          `SELECT user_id FROM patients WHERE id = $1`,
          [patient_id],
        );

        if (patientUserResult.rows.length > 0) {
          const patientUserId = patientUserResult.rows[0].user_id;
          const requesterResult = await client.query(
            `SELECT name FROM users WHERE id = $1`,
            [sub],
          );

          const requesterName = requesterResult.rows[0]?.name || "A healthcare provider";

          await client.query(
            `INSERT INTO patient_notifications (patient_user_id, patient_id, type, title, message, created_by)
             VALUES ($1, $2, 'access_request', 'New Access Request', $3, $4)`,
            [
              patientUserId,
              patient_id,
              `${requesterName} has requested access to your medical records.`,
              sub,
            ],
          );
        }

        await client.query("COMMIT");

        res.status(201).json({ success: true, message: "Access request created successfully" });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Create access request error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to create access request" } });
    }
  },
);

// GET /api/patients/notifications/my
router.get(
  "/notifications/my",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { sub, role } = req.user;

      if (role !== "patient") {
        res.status(403).json({ success: false, error: { message: "Only patients can view their notifications" } });
        return;
      }

      const result = await query(
        `SELECT id, patient_id, type, title, message, metadata, created_by, created_at
         FROM patient_notifications
         WHERE patient_user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [sub],
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to get notifications" } });
    }
  },
);

// GET /api/patients/access-requests/my
router.get(
  "/access-requests/my",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { sub, role } = req.user;

      if (role !== "patient") {
        res.status(403).json({ success: false, error: { message: "Only patients can view their access requests" } });
        return;
      }

      const organizationMemberColumns = await getOrganizationMemberColumns();
      const requestedByMemberRoleField = organizationMemberColumns.has("member_role")
        ? "om.member_role"
        : organizationMemberColumns.has("role")
          ? "om.role"
          : "NULL::text";

      const result = await query(
        `SELECT 
          ar.id,
          ar.status,
          ar.created_at,
          ar.updated_at,
          ar.organization_id,
          o.name AS organization_name,
          o.type AS organization_type,
          o.address AS organization_address,
          o.city AS organization_city,
          o.state AS organization_state,
          o.zip_code AS organization_zip_code,
          o.phone AS organization_phone,
          o.email AS organization_email,
          o.website AS organization_website,
          o.is_verified AS organization_is_verified,
          ar.requested_by,
          u.name AS requested_by_name,
          u.email AS requested_by_email,
          u.phone AS requested_by_phone,
          u.role AS requested_by_role,
          ${requestedByMemberRoleField} AS requested_by_member_role,
          om.status AS requested_by_member_status
         FROM patient_access_requests ar
         LEFT JOIN organizations o ON o.id = ar.organization_id
         LEFT JOIN users u ON u.id = ar.requested_by
         LEFT JOIN organization_members om ON om.organization_id = ar.organization_id AND om.user_id = ar.requested_by
         WHERE ar.patient_id IN (SELECT id FROM patients WHERE user_id = $1)
         ORDER BY ar.created_at DESC`,
        [sub],
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error("Get access requests error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to get access requests" } });
    }
  },
);

// POST /api/patients/access-requests/:requestId/respond
router.post(
  "/access-requests/:requestId/respond",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { sub, role } = req.user;
      const { requestId } = req.params;
      const { action } = req.body;

      if (role !== "patient") {
        res.status(403).json({ success: false, error: { message: "Only patients can respond to access requests" } });
        return;
      }

      if (!["approve", "reject"].includes(action)) {
        res.status(400).json({ success: false, error: { message: "action must be 'approve' or 'reject'" } });
        return;
      }

      const client = await getClient();
      try {
        await client.query("BEGIN");

        // Get the access request
        const requestResult = await client.query(
          `SELECT ar.*, p.user_id AS patient_user_id, p.id AS patient_id
           FROM patient_access_requests ar
           INNER JOIN patients p ON p.id = ar.patient_id
           WHERE ar.id = $1`,
          [requestId],
        );

        if (requestResult.rows.length === 0) {
          await client.query("ROLLBACK");
          res.status(404).json({ success: false, error: { message: "Access request not found" } });
          return;
        }

        const request = requestResult.rows[0];

        if (request.patient_user_id !== sub) {
          await client.query("ROLLBACK");
          res.status(403).json({ success: false, error: { message: "Forbidden" } });
          return;
        }

        if (request.status !== "pending") {
          await client.query("ROLLBACK");
          res.status(400).json({ success: false, error: { message: "Access request has already been processed" } });
          return;
        }

        // Update request status
        await client.query(
          `UPDATE patient_access_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [action, requestId],
        );

        // If approved, link patient to organization
        if (action === "approve" && request.organization_id) {
          await ensurePatientOrganizationLink(client, request.patient_id, request.organization_id, sub);
        }

        await client.query("COMMIT");

        res.json({ success: true, message: `Access request ${action}d successfully` });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Respond to access request error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to respond to access request" } });
    }
  },
);

export default router;
