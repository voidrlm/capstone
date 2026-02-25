import { Router, Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import multer from "multer";
import pdfParse from "pdf-parse";
import { Resend } from "resend";
import { getClient } from "../db/index.js";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.js";
import { signAccessToken } from "../utils/jwt.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/auth/parse-medical-report
router.post(
  "/parse-medical-report",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { message: "No file uploaded" },
        });
        return;
      }

      if (req.file.mimetype !== "application/pdf") {
        res.status(400).json({
          success: false,
          error: { message: "Only PDF files are accepted" },
        });
        return;
      }

      const pdfData = await pdfParse(req.file.buffer);
      const text = pdfData.text;

      // Extract Full Name
      const nameMatch = text.match(/Full\s*Name:\s*(.+)/i);
      const fullName = nameMatch ? nameMatch[1].trim() : "";
      const nameParts = fullName.split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Extract Date of Birth
      const dobMatch = text.match(/Date\s*of\s*Birth:\s*(.+)/i);
      let dateOfBirth = "";
      if (dobMatch) {
        const rawDob = dobMatch[1].trim();
        const parsed = new Date(rawDob);
        if (!Number.isNaN(parsed.getTime())) {
          dateOfBirth = parsed.toISOString().split("T")[0];
        }
      }

      // Extract Patient ID
      const idMatch = text.match(/Patient\s*ID:\s*(\S+)/i);
      const patientId = idMatch ? idMatch[1].trim() : "";

      // Extract Gender
      const genderMatch = text.match(/Gender:\s*(.+)/i);
      const gender = genderMatch ? genderMatch[1].trim() : "";

      // Extract Blood Type
      const bloodMatch = text.match(/Blood\s*Type:\s*(.+)/i);
      const bloodType = bloodMatch ? bloodMatch[1].trim() : "";

      // Extract Age
      const ageMatch = text.match(/Age:\s*(\d+)/i);
      const age = ageMatch ? parseInt(ageMatch[1], 10) : null;

      res.status(200).json({
        success: true,
        data: {
          firstName,
          lastName,
          dateOfBirth,
          patientId,
          gender,
          bloodType,
          age,
        },
      });
    } catch (error) {
      console.error("PDF parse error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to parse medical report" },
      });
    }
  },
);

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

        const verificationToken = crypto.randomBytes(32).toString("hex");

        const insertUserColumns = hasPhoneColumn
          ? `(email, password_hash, ${nameColumn}, phone, role, email_verified, verification_token)`
          : `(email, password_hash, ${nameColumn}, role, email_verified, verification_token)`;
        const insertUserValues = hasPhoneColumn
          ? `($1, $2, $3, $4, 'patient', FALSE, $${hasPhoneColumn ? 5 : 4})`
          : `($1, $2, $3, 'patient', FALSE, $4)`;
        const insertUserParams = hasPhoneColumn
          ? [normalizedEmail, hashedPassword, fullName, safePhone, verificationToken]
          : [normalizedEmail, hashedPassword, fullName, verificationToken];

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

        // Send verification email via Resend
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const verifyLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

        try {
          await resend.emails.send({
            from: "MediRisk <onboarding@resend.dev>",
            to: [normalizedEmail],
            subject: "Verify your MediRisk account",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
                <h2 style="color: #3b82f6;">Welcome to MediRisk!</h2>
                <p>Hi ${safeFirstName},</p>
                <p>Thanks for signing up. Please verify your email address to activate your account.</p>
                <a href="${verifyLink}"
                   style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 28px;
                          border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
                  Verify Email
                </a>
                <p style="color: #6b7280; font-size: 13px;">
                  Or copy this link into your browser:<br/>
                  <a href="${verifyLink}" style="color: #3b82f6;">${verifyLink}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">
                  If you didn't create this account, you can safely ignore this email.
                </p>
              </div>
            `,
          });
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
        }

        res.status(201).json({
          success: true,
          data: {
            message: "Account created. Please check your email to verify your account.",
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

// GET /api/auth/verify-email
router.get(
  "/verify-email",
  async (req: Request, res: Response): Promise<void> => {
    const token = String(req.query.token || "").trim();

    if (!token) {
      res.status(400).json({
        success: false,
        error: { message: "Verification token is required" },
      });
      return;
    }

    const client = await getClient();
    try {
      const result = await client.query(
        `UPDATE users
         SET email_verified = TRUE, verification_token = NULL
         WHERE verification_token = $1 AND email_verified = FALSE
         RETURNING id, email`,
        [token],
      );

      if (result.rows.length === 0) {
        res.status(400).json({
          success: false,
          error: { message: "Invalid or expired verification link" },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { message: "Email verified successfully. You can now sign in." },
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Verification failed" },
      });
    } finally {
      client.release();
    }
  },
);

// POST /api/auth/resend-verification
router.post(
  "/resend-verification",
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      res.status(400).json({
        success: false,
        error: { message: "Email is required" },
      });
      return;
    }

    const client = await getClient();
    try {
      const userResult = await client.query(
        `SELECT id, name, email_verified, verification_token
         FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [normalizedEmail],
      );

      if (userResult.rows.length === 0) {
        // Don't reveal whether email exists
        res.status(200).json({
          success: true,
          data: { message: "If that email is registered, a verification link has been sent." },
        });
        return;
      }

      const user = userResult.rows[0];

      if (user.email_verified) {
        res.status(200).json({
          success: true,
          data: { message: "Email is already verified. You can sign in." },
        });
        return;
      }

      // Generate new token
      const newToken = crypto.randomBytes(32).toString("hex");
      await client.query(
        `UPDATE users SET verification_token = $1 WHERE id = $2`,
        [newToken, user.id],
      );

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const verifyLink = `${frontendUrl}/verify-email?token=${newToken}`;
      const firstName = String(user.name || "").split(" ")[0];

      try {
        await resend.emails.send({
          from: "MediRisk <onboarding@resend.dev>",
          to: [normalizedEmail],
          subject: "Verify your MediRisk account",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
              <h2 style="color: #3b82f6;">Verify your MediRisk account</h2>
              <p>Hi ${firstName},</p>
              <p>Click below to verify your email address.</p>
              <a href="${verifyLink}"
                 style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 28px;
                        border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
                Verify Email
              </a>
              <p style="color: #6b7280; font-size: 13px;">
                Or copy this link:<br/>
                <a href="${verifyLink}" style="color: #3b82f6;">${verifyLink}</a>
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to resend verification email:", emailError);
      }

      res.status(200).json({
        success: true,
        data: { message: "If that email is registered, a verification link has been sent." },
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to resend verification email" },
      });
    } finally {
      client.release();
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

    const hasEmailVerified = userColumns.has("email_verified");

    const selectCols = `id, email, password_hash, role, ${nameColumn} AS name${hasEmailVerified ? ", email_verified" : ""}`;
    const userResult = await client.query(
      `SELECT ${selectCols}
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

    // Block login if email is not verified
    if (hasEmailVerified && !user.email_verified) {
      res.status(403).json({
        success: false,
        error: {
          message: "Please verify your email before signing in. Check your inbox for the verification link.",
          code: "EMAIL_NOT_VERIFIED",
        },
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
