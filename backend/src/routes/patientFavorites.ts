import { Router, Response } from "express";
import { query } from "../db/index.js";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.js";
import { canAccessPatient, canFavoritePatients } from "./patientHelpers.js";

const router = Router();

// POST /api/patients/:id/favorite
router.post(
  "/:id/favorite",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { sub, role } = req.user;
      const { id } = req.params;

      if (!canFavoritePatients(role)) {
        res.status(403).json({ success: false, error: { message: "Only doctors and nurses can favorite patients" } });
        return;
      }

      const hasAccess = await canAccessPatient(req.user, id);
      if (!hasAccess) {
        res.status(403).json({ success: false, error: { message: "Forbidden" } });
        return;
      }

      await query(
        `INSERT INTO patient_favorites (patient_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (patient_id, user_id) DO NOTHING`,
        [id, sub],
      );

      res.json({ success: true, message: "Patient favorited successfully" });
    } catch (error) {
      console.error("Favorite patient error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to favorite patient" } });
    }
  },
);

// DELETE /api/patients/:id/favorite
router.delete(
  "/:id/favorite",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }

      const { sub, role } = req.user;
      const { id } = req.params;

      if (!canFavoritePatients(role)) {
        res.status(403).json({ success: false, error: { message: "Only doctors and nurses can unfavorite patients" } });
        return;
      }

      await query(
        `DELETE FROM patient_favorites WHERE patient_id = $1 AND user_id = $2`,
        [id, sub],
      );

      res.json({ success: true, message: "Patient unfavorited successfully" });
    } catch (error) {
      console.error("Unfavorite patient error:", error);
      res.status(500).json({ success: false, error: { message: "Failed to unfavorite patient" } });
    }
  },
);

export default router;
