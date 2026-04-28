import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db/index.js";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.js";
import {
  calculateAgeGroup,
  getUserOrganizationIds,
  ensurePatientOrganizationLink,
  canUseOrganizationScopedPatients,
  isProviderOrAdmin,
  getClient,
  getPrimaryOrganizationId,
  getPatientSelectFields,
  getAccessiblePatientOrThrow,
  getPatientDetail,
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

      const patientSelectFields = await getPatientSelectFields("p");
      const result = await query(
        `SELECT ${patientSelectFields},
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
      const patient = await getAccessiblePatientOrThrow(req.user, id);
      if (!patient) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      const detail = await getPatientDetail(id, req.user);
      if (!detail) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      res.json({
        success: true,
        data: detail,
      });
    } catch (error) {
      console.error("Get patient error:", error);
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
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
      const {
        name,
        date_of_birth,
        dateOfBirth,
        gender,
        blood_type,
        bloodType,
        email,
        password,
        organization_id,
      } = req.body;
      const patientDateOfBirth = date_of_birth || dateOfBirth;
      const patientBloodType = blood_type || bloodType;

      if (!name || !email || !password) {
        res.status(400).json({ success: false, error: { message: "name, email, and password are required" } });
        return;
      }
      if (!patientDateOfBirth) {
        res.status(400).json({ success: false, error: { message: "date_of_birth is required" } });
        return;
      }

      const client = await getClient();
      try {
        await client.query("BEGIN");
        const [userColumnsResult, patientColumnsResult] = await Promise.all([
          client.query<{ column_name: string }>(
            `SELECT column_name
             FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'users'`,
          ),
          client.query<{ column_name: string }>(
            `SELECT column_name
             FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'patients'`,
          ),
        ]);
        const userColumns = new Set(userColumnsResult.rows.map((row) => row.column_name));
        const patientColumns = new Set(patientColumnsResult.rows.map((row) => row.column_name));

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
        const passwordHash = await bcrypt.hash(String(password), 10);
        const userInsertColumns = [
          "email",
          userColumns.has("password_hash") ? "password_hash" : "password",
          "role",
          userColumns.has("name") ? "name" : "full_name",
          ...(userColumns.has("created_by") ? ["created_by"] : []),
        ];
        const userInsertValues = [
          email.toLowerCase(),
          passwordHash,
          "patient",
          name,
          ...(userColumns.has("created_by") ? [sub] : []),
        ];
        const userResult = await client.query(
          `INSERT INTO users (${userInsertColumns.join(", ")})
           VALUES (${userInsertValues.map((_, index) => `$${index + 1}`).join(", ")})
           RETURNING id`,
          userInsertValues,
        );

        const userId = userResult.rows[0].id;

        // Create patient
        const ageGroup = calculateAgeGroup(patientDateOfBirth);
        const patientInsertColumns = [
          "user_id",
          "name",
          "date_of_birth",
          "gender",
          ...(patientColumns.has("blood_type") ? ["blood_type"] : []),
          ...(patientColumns.has("age_group") ? ["age_group"] : []),
          ...(patientColumns.has("created_by") ? ["created_by"] : []),
        ];
        const patientInsertValues = [
          userId,
          name,
          patientDateOfBirth,
          gender || null,
          ...(patientColumns.has("blood_type") ? [patientBloodType || null] : []),
          ...(patientColumns.has("age_group") ? [ageGroup] : []),
          ...(patientColumns.has("created_by") ? [sub] : []),
        ];
        const patientResult = await client.query(
          `INSERT INTO patients (${patientInsertColumns.join(", ")})
           VALUES (${patientInsertValues.map((_, index) => `$${index + 1}`).join(", ")})
           RETURNING id`,
          patientInsertValues,
        );

        const patientId = patientResult.rows[0].id;

        if (isProviderOrAdmin(role)) {
          const organizationId = organization_id || await getPrimaryOrganizationId(client, sub);
          await ensurePatientOrganizationLink(client, patientId, organizationId, sub);
        }

        await client.query("COMMIT");

        res.status(201).json({
          success: true,
          data: {
            id: patientId,
            user_id: userId,
            name,
            date_of_birth: patientDateOfBirth,
            gender,
            blood_type: patientBloodType,
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
      const patient = await getAccessiblePatientOrThrow(req.user, id);
      if (!patient) {
        res.status(404).json({ success: false, error: { message: "Patient not found" } });
        return;
      }

      const client = await getClient();
      try {
        const patientColumnsResult = await client.query<{ column_name: string }>(
          `SELECT column_name
           FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'patients'`,
        );
        const patientColumns = new Set(patientColumnsResult.rows.map((row) => row.column_name));
        const hasBloodType = patientColumns.has("blood_type");
        const hasAgeGroup = patientColumns.has("age_group");
        const updateParams: unknown[] = [name, date_of_birth, gender];
        const setClauses = [
          "name = COALESCE($1, name)",
          "date_of_birth = COALESCE($2, date_of_birth)",
          "gender = COALESCE($3, gender)",
        ];
        if (hasBloodType) {
          updateParams.push(blood_type);
          setClauses.push(`blood_type = COALESCE($${updateParams.length}, blood_type)`);
        }
        if (hasAgeGroup && date_of_birth) {
          updateParams.push(calculateAgeGroup(date_of_birth));
          setClauses.push(`age_group = $${updateParams.length}`);
        }
        updateParams.push(id);
        const idParam = `$${updateParams.length}`;
        const returningColumns = [
          "id",
          "name",
          "date_of_birth",
          "gender",
          hasBloodType ? "blood_type" : "NULL::text AS blood_type",
        ];
        const result = await client.query(
          `UPDATE patients
           SET ${setClauses.join(", ")}
           WHERE id = ${idParam}
           RETURNING ${returningColumns.join(", ")}`,
          updateParams,
        );

        res.json({ success: true, data: result.rows[0] });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Update patient error:", error);
      if (error instanceof Error && error.message === "Forbidden") {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }
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
