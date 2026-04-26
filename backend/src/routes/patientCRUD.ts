import { Router, Response } from "express";
import { query } from "../db/index.js";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.js";
import {
  calculateAgeGroup,
  getUserOrganizationIds,
  ensurePatientOrganizationLink,
  canUseOrganizationScopedPatients,
  isProviderOrAdmin,
  getClient,
} from "./patientHelpers.js";

const router = Router();

// GET /api/patients - List patients
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
      const { limit = "20", offset = "0", search, organization_id } = req.query;

      const parsedLimit = Math.min(Number(limit) || 20, 100);
      const parsedOffset = Number(offset) || 0;

      let whereClause = "";
      const params: any[] = [];
      let paramIndex = 1;

      if (role === "patient") {
        whereClause = `WHERE p.user_id = $${paramIndex++}`;
        params.push(sub);
      } else if (canUseOrganizationScopedPatients(role)) {
        const client = await getClient();
        try {
          const orgIds = organization_id
            ? [String(organization_id)]
            : await getUserOrganizationIds(client, sub);

          if (orgIds.length === 0) {
            res.json({ success: true, data: [], total: 0 });
            return;
          }

          whereClause = `WHERE po.organization_id = ANY($${paramIndex++})`;
          params.push(orgIds);
        } finally {
          client.release();
        }
      } else if (role === "admin") {
        whereClause = "";
      } else {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }

      if (search) {
        const searchParam = `%${search}%`;
        whereClause += whereClause ? " AND " : "WHERE ";
        whereClause += `(p.name ILIKE $${paramIndex++} OR u.email ILIKE $${paramIndex++})`;
        params.push(searchParam, searchParam);
      }

      const countResult = await query(
        `SELECT COUNT(*) as total
         FROM patients p
         LEFT JOIN users u ON u.id = p.user_id
         LEFT JOIN patient_organizations po ON po.patient_id = p.id
         ${whereClause}`,
        params,
      );

      const result = await query(
        `SELECT p.id, p.user_id, p.name, p.date_of_birth, p.gender, p.blood_type, p.created_by,
                u.email, u.role as user_role,
                po.organization_id
         FROM patients p
         LEFT JOIN users u ON u.id = p.user_id
         LEFT JOIN patient_organizations po ON po.patient_id = p.id
         ${whereClause}
         ORDER BY p.created_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...params, parsedLimit, parsedOffset],
      );

      const patients = result.rows.map((row: any) => {
        const dob = row.date_of_birth ? new Date(row.date_of_birth) : null;
        return {
          ...row,
          age: dob ? calculateAgeGroup(dob.toISOString()) : null,
        };
      });

      res.json({
        success: true,
        data: patients,
        total: Number(countResult.rows[0]?.total || 0),
      });
    } catch (error) {
      console.error("List patients error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to list patients" } });
    }
  },
);

// GET /api/patients/:id - Get patient details
router.get(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { id } = req.params;
      const result = await query(
        `SELECT p.id, p.user_id, p.name, p.date_of_birth, p.gender, p.blood_type, p.created_by,
                u.email, u.role as user_role
         FROM patients p
         LEFT JOIN users u ON u.id = p.user_id
         WHERE p.id = $1`,
        [id],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      const patient = result.rows[0];
      const dob = patient.date_of_birth ? new Date(patient.date_of_birth) : null;

      res.json({
        success: true,
        data: {
          ...patient,
          age: dob ? calculateAgeGroup(dob.toISOString()) : null,
        },
      });
    } catch (error) {
      console.error("Get patient error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to get patient" } });
    }
  },
);

// POST /api/patients - Create patient
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
      const { name, date_of_birth, gender, blood_type, email, password, organization_id } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ success: false, error: { message: "name, email, and password are required" } });
        return;
      }

      const client = await getClient();
      try {
        await client.query("BEGIN");

        // Check if email already exists
        const existingUser = await client.query(
          `SELECT id FROM users WHERE email = $1`,
          [email.toLowerCase()],
        );

        if (existingUser.rows.length > 0) {
          await client.query("ROLLBACK");
          res.status(400).json({ success: false, error: { message: "Email already exists" } });
          return;
        }

        // Create user
        const userResult = await client.query(
          `INSERT INTO users (email, password, role, name, created_by)
           VALUES ($1, $2, 'patient', $3, $4)
           RETURNING id`,
          [email.toLowerCase(), password, name, sub],
        );

        const userId = userResult.rows[0].id;

        // Create patient
        const patientResult = await client.query(
          `INSERT INTO patients (user_id, name, date_of_birth, gender, blood_type, created_by)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [userId, name, date_of_birth || null, gender || null, blood_type || null, sub],
        );

        const patientId = patientResult.rows[0].id;

        // Link to organization if provided
        if (organization_id && isProviderOrAdmin(role)) {
          await ensurePatientOrganizationLink(client, patientId, organization_id, sub);
        }

        await client.query("COMMIT");

        res.status(201).json({
          success: true,
          data: {
            id: patientId,
            user_id: userId,
            name,
            date_of_birth,
            gender,
            blood_type,
          },
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Create patient error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to create patient" } });
    }
  },
);

// PUT /api/patients/:id - Update patient
router.put(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { id } = req.params;
      const { name, date_of_birth, gender, blood_type } = req.body;

      const result = await query(
        `UPDATE patients
         SET name = COALESCE($1, name),
             date_of_birth = COALESCE($2, date_of_birth),
             gender = COALESCE($3, gender),
             blood_type = COALESCE($4, blood_type)
         WHERE id = $5
         RETURNING id, name, date_of_birth, gender, blood_type`,
        [name, date_of_birth, gender, blood_type, id],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error("Update patient error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to update patient" } });
    }
  },
);

// DELETE /api/patients/:id - Delete patient
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { id } = req.params;

      const result = await query(
        `DELETE FROM patients WHERE id = $1 RETURNING id`,
        [id],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      res.json({ success: true, message: "Patient deleted successfully" });
    } catch (error) {
      console.error("Delete patient error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to delete patient" } });
    }
  },
);

export default router;
