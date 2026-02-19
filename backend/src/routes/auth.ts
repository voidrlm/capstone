import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const router = Router();

// Temporary in-memory store — replace with DB queries
const registeredUsers: {
  id: string;
  email: string;
  password: string;
  role: string;
  name: string;
  phone?: string;
  dateOfBirth?: string;
}[] = [];

// POST /api/auth/register/patient
router.post(
  "/register/patient",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstName, lastName, dateOfBirth, phone } =
        req.body;

      if (!email || !password || !firstName || !lastName || !dateOfBirth) {
        res.status(400).json({
          success: false,
          error: {
            message:
              "Email, password, first name, last name, and date of birth are required",
          },
        });
        return;
      }

      const existingUser = registeredUsers.find((u) => u.email === email);
      if (existingUser) {
        res.status(400).json({
          success: false,
          error: { message: "Email already registered" },
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        id: crypto.randomUUID(),
        email,
        password: hashedPassword,
        role: "patient",
        name: `${firstName} ${lastName}`,
        phone,
        dateOfBirth,
      };

      registeredUsers.push(newUser);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
          },
        },
      });
    } catch (error) {
      console.error("Patient registration error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Registration failed" },
      });
    }
  },
);

export default router;
