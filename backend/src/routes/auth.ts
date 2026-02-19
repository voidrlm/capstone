import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getClient } from "../db/index.js";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.js";
import { signAccessToken } from "../utils/jwt.js";

const router = Router();

// POST /api/auth/register/patient
router.post(
  "/register/patient",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstName, lastName, dateOfBirth, phone } =
        req.body;
      const normalizedEmail = String(email || "").trim().toLowerCase();
      const safePassword = String(password || "");
      const safeFirstName = String(firstName || "").trim();
      const safeLastName = String(lastName || "").trim();
      const safeDateOfBirth = String(dateOfBirth || "");
      const safePhone = String(phone || "").trim() || null;
      const fullName = `${safeFirstName} ${safeLastName}`.trim();

      if (
        !normalizedEmail ||
        !safePassword ||
        !safeFirstName ||
        !safeLastName ||
        !safeDateOfBirth
      ) {
        res.status(400).json({
          success: false,
          error: {
            message:
              "Email, password, first name, last name, and date of birth are required",
          },
        });
        return;
      }

      if (!normalizedEmail.includes("@")) {
        res.status(400).json({
          success: false,
          error: { message: "Please provide a valid email address" },
        });
        return;
      }

      if (safePassword.length < 8) {
        res.status(400).json({
          success: false,
          error: { message: "Password must be at least 8 characters long" },
        });
        return;
      }

      const parsedDob = new Date(safeDateOfBirth);
      if (Number.isNaN(parsedDob.getTime())) {
        res.status(400).json({
          success: false,
          error: { message: "Invalid date of birth" },
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(safePassword, 10);
      const client = await getClient();

      try {
        await client.query("BEGIN");

        const existingUserResult = await client.query(
          "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
          [normalizedEmail],
        );

        if (existingUserResult.rows.length > 0) {
          await client.query("ROLLBACK");
          res.status(409).json({
            success: false,
            error: { message: "Email already registered" },
          });
          return;
        }

        const userColumnsResult = await client.query<{ column_name: string }>(
          `SELECT column_name
           FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'users'`,
        );

        const userColumns = new Set(
          userColumnsResult.rows.map((row) => row.column_name),
        );
        const nameColumn = userColumns.has("name") ? "name" : "full_name";
        const hasPhoneColumn = userColumns.has("phone");

        const insertUserColumns = hasPhoneColumn
          ? `(email, password_hash, ${nameColumn}, phone, role)`
          : `(email, password_hash, ${nameColumn}, role)`;
        const insertUserValues = hasPhoneColumn
          ? `($1, $2, $3, $4, 'patient')`
          : `($1, $2, $3, 'patient')`;
        const insertUserParams = hasPhoneColumn
          ? [normalizedEmail, hashedPassword, fullName, safePhone]
          : [normalizedEmail, hashedPassword, fullName];

        const createdUserResult = await client.query(
          `INSERT INTO users ${insertUserColumns}
           VALUES ${insertUserValues}
           RETURNING id, email, ${nameColumn} AS name, role`,
          insertUserParams,
        );

        const createdUser = createdUserResult.rows[0];

        let createdPatientId: string | null = null;
        const patientsTableResult = await client.query<{ exists: string | null }>(
          `SELECT to_regclass('public.patients') AS exists`,
        );
        const patientsTableExists = !!patientsTableResult.rows[0]?.exists;

        if (patientsTableExists) {
          const patientColumnsResult = await client.query<{ column_name: string }>(
            `SELECT column_name
             FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'patients'`,
          );
          const patientColumns = new Set(
            patientColumnsResult.rows.map((row) => row.column_name),
          );

          const patientNameColumn = patientColumns.has("name")
            ? "name"
            : "full_name";
          const createdPatientResult = await client.query(
            `INSERT INTO patients (user_id, ${patientNameColumn}, date_of_birth)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [createdUser.id, fullName, safeDateOfBirth],
          );
          createdPatientId = createdPatientResult.rows[0]?.id ?? null;
        }

        await client.query("COMMIT");

        res.status(201).json({
          success: true,
          data: {
            token: signAccessToken({
              sub: String(createdUser.id),
              email: createdUser.email,
              role: createdUser.role,
            }),
            user: {
              id: createdUser.id,
              email: createdUser.email,
              name: createdUser.name,
              role: createdUser.role,
            },
            patient: createdPatientId ? { id: createdPatientId } : null,
          },
        });
      } catch (dbError) {
        await client.query("ROLLBACK");
        throw dbError;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Patient registration error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Registration failed" },
      });
    }
  },
);

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const safePassword = String(password || "");

  if (!normalizedEmail || !safePassword) {
    res.status(400).json({
      success: false,
      error: { message: "Email and password are required" },
    });
    return;
  }

  const client = await getClient();

  try {
    const userColumnsResult = await client.query<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'users'`,
    );

    const userColumns = new Set(
      userColumnsResult.rows.map((row) => row.column_name),
    );
    const nameColumn = userColumns.has("name") ? "name" : "full_name";

    const userResult = await client.query(
      `SELECT id, email, password_hash, role, ${nameColumn} AS name
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [normalizedEmail],
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: { message: "Invalid email or password" },
      });
      return;
    }

    const user = userResult.rows[0];
    const passwordMatches = await bcrypt.compare(
      safePassword,
      user.password_hash,
    );

    if (!passwordMatches) {
      res.status(401).json({
        success: false,
        error: { message: "Invalid email or password" },
      });
      return;
    }

    const token = signAccessToken({
      sub: String(user.id),
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Login failed" },
    });
  } finally {
    client.release();
  }
});

// GET /api/auth/me
router.get(
  "/me",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
      return;
    }

    const client = await getClient();
    try {
      const userColumnsResult = await client.query<{ column_name: string }>(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'users'`,
      );

      const userColumns = new Set(
        userColumnsResult.rows.map((row) => row.column_name),
      );
      const nameColumn = userColumns.has("name") ? "name" : "full_name";

      const userResult = await client.query(
        `SELECT id, email, role, ${nameColumn} AS name
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [req.user.sub],
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: { message: "User not found" },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: userResult.rows[0],
        },
      });
    } catch (error) {
      console.error("Me endpoint error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Unable to fetch user profile" },
      });
    } finally {
      client.release();
    }
  },
);

export default router;
