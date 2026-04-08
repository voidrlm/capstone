import { Router, Request, Response } from "express";
import { query } from "../db/index.js";
import { classifySideEffects } from "../services/riskClassification.js";
import { checkInteractions } from "../services/interactionDetection.js";

const router = Router();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DrugSearchRow {
  id: string;
  name: string;
  generic_name: string;
  manufacturer_name: string;
  route: string;
  category: string;
}

interface SideEffectRow {
  id: string;
  drug_id: string;
  effect_name: string;
  risk_level: "high" | "medium" | "low";
  frequency: "common" | "uncommon" | "rare";
  description: string;
}

interface SideEffectEntry {
  effectName: string;
  riskLevel: "high" | "medium" | "low";
  frequency: string;
  description: string;
}

interface GroupedSideEffects {
  high: SideEffectEntry[];
  medium: SideEffectEntry[];
  low: SideEffectEntry[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupSideEffects(rows: SideEffectRow[]): GroupedSideEffects {
  const grouped: GroupedSideEffects = { high: [], medium: [], low: [] };

  for (const row of rows) {
    const entry: SideEffectEntry = {
      effectName: row.effect_name,
      riskLevel: row.risk_level,
      frequency: row.frequency,
      description: row.description,
    };
    if (row.risk_level in grouped) {
      grouped[row.risk_level].push(entry);
    }
  }

  return grouped;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_ID_REGEX = /^\d+$/;

function normalizeDrugId(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function isValidDrugId(value: unknown): boolean {
  const normalized = normalizeDrugId(value);
  if (!normalized) {
    return false;
  }

  return UUID_REGEX.test(normalized) || NUMERIC_ID_REGEX.test(normalized);
}

// ---------------------------------------------------------------------------
// 1. GET /search?q=term&limit=20&offset=0
// ---------------------------------------------------------------------------

router.get(
  "/search",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const q = String(req.query.q || "").trim();

      if (!q) {
        res.status(400).json({
          success: false,
          error: { message: "Query parameter 'q' is required" },
        });
        return;
      }

      const limit = Math.min(Math.max(parseInt(String(req.query.limit), 10) || 20, 1), 100);
      const offset = Math.max(parseInt(String(req.query.offset), 10) || 0, 0);

      const searchPattern = `%${q}%`;

      const result = await query(
        `SELECT id, name, generic_name, manufacturer_name, route, category
         FROM drugs
         WHERE name ILIKE $1 OR generic_name ILIKE $1
         ORDER BY
           CASE WHEN name ILIKE $2 THEN 0 ELSE 1 END,
           name ASC
         LIMIT $3 OFFSET $4`,
        [searchPattern, `${q}%`, limit, offset],
      );

      const countResult = await query(
        `SELECT COUNT(*) AS total
         FROM drugs
         WHERE name ILIKE $1 OR generic_name ILIKE $1`,
        [searchPattern],
      );

      const total = parseInt(countResult.rows[0]?.total, 10) || 0;

      res.status(200).json({
        success: true,
        data: {
          drugs: result.rows as DrugSearchRow[],
          pagination: { total, limit, offset },
        },
      });
    } catch (error) {
      console.error("Drug search error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to search drugs" },
      });
    }
  },
);

// ---------------------------------------------------------------------------
// 2. GET /autocomplete?q=term
// ---------------------------------------------------------------------------

router.get(
  "/autocomplete",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const q = String(req.query.q || "").trim();

      if (q.length < 2) {
        res.status(200).json({ success: true, data: { suggestions: [] } });
        return;
      }

      const searchPattern = `${q}%`;

      const result = await query(
        `SELECT DISTINCT ON (name, generic_name) id, name, generic_name
         FROM drugs
         WHERE name ILIKE $1 OR generic_name ILIKE $1
         ORDER BY name, generic_name, id
         LIMIT 10`,
        [searchPattern],
      );

      res.status(200).json({
        success: true,
        data: { suggestions: result.rows },
      });
    } catch (error) {
      console.error("Drug autocomplete error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to fetch autocomplete suggestions" },
      });
    }
  },
);

// ---------------------------------------------------------------------------
// 3. GET /:id  — full drug profile
// ---------------------------------------------------------------------------

router.get(
  "/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!isValidDrugId(id)) {
        res.status(400).json({
          success: false,
          error: { message: "Invalid drug ID format" },
        });
        return;
      }

      const drugResult = await query("SELECT * FROM drugs WHERE id = $1", [id]);

      if (drugResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: { message: "Drug not found" },
        });
        return;
      }

      const drug = drugResult.rows[0];

      // Fetch side effects from the database
      const sideEffectsResult = await query(
        `SELECT id, drug_id, effect_name, risk_level, frequency, description
         FROM drug_side_effects
         WHERE drug_id = $1
         ORDER BY
           CASE risk_level WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END,
           effect_name ASC`,
        [id],
      );

      let sideEffects: GroupedSideEffects;

      if (sideEffectsResult.rows.length > 0) {
        sideEffects = groupSideEffects(sideEffectsResult.rows as SideEffectRow[]);
      } else if (drug.adverse_reactions) {
        // Dynamically classify from adverse_reactions text
        const classified = classifySideEffects(drug.adverse_reactions, {
          warnings: drug.warnings ?? undefined,
        });

        sideEffects = { high: [], medium: [], low: [] };
        for (const entry of classified) {
          const mapped: SideEffectEntry = {
            effectName: entry.effectName,
            riskLevel: entry.riskLevel as "high" | "medium" | "low",
            frequency: entry.frequency,
            description: entry.description,
          };
          if (mapped.riskLevel in sideEffects) {
            sideEffects[mapped.riskLevel].push(mapped);
          }
        }
      } else {
        sideEffects = { high: [], medium: [], low: [] };
      }

      // Fetch basic interaction info
      const interactionsResult = await query(
        `SELECT
           di.id,
           di.drug_id_1,
           di.drug_id_2,
           di.severity,
           di.description,
           di.recommendation,
           COALESCE(d2.name, 'Unknown') AS other_drug_name
         FROM drug_interactions di
         LEFT JOIN drugs d2 ON d2.id = di.drug_id_2
         WHERE di.drug_id_1 = $1
         ORDER BY
           CASE di.severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END,
           COALESCE(d2.name, 'Unknown') ASC
         LIMIT 20`,
        [id],
      );

      res.status(200).json({
        success: true,
        data: {
          drug,
          sideEffects,
          interactions: interactionsResult.rows,
        },
      });
    } catch (error) {
      console.error("Drug detail error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to fetch drug details" },
      });
    }
  },
);

// ---------------------------------------------------------------------------
// 4. GET /:id/side-effects
// ---------------------------------------------------------------------------

router.get(
  "/:id/side-effects",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!isValidDrugId(id)) {
        res.status(400).json({
          success: false,
          error: { message: "Invalid drug ID format" },
        });
        return;
      }

      // Verify drug exists
      const drugResult = await query(
        "SELECT id, adverse_reactions, warnings FROM drugs WHERE id = $1",
        [id],
      );

      if (drugResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: { message: "Drug not found" },
        });
        return;
      }

      const drug = drugResult.rows[0];

      const sideEffectsResult = await query(
        `SELECT id, drug_id, effect_name, risk_level, frequency, description
         FROM drug_side_effects
         WHERE drug_id = $1
         ORDER BY
           CASE risk_level WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END,
           effect_name ASC`,
        [id],
      );

      let sideEffects: GroupedSideEffects;

      if (sideEffectsResult.rows.length > 0) {
        sideEffects = groupSideEffects(sideEffectsResult.rows as SideEffectRow[]);
      } else if (drug.adverse_reactions) {
        const classified = classifySideEffects(drug.adverse_reactions, {
          warnings: drug.warnings ?? undefined,
        });

        sideEffects = { high: [], medium: [], low: [] };
        for (const entry of classified) {
          const mapped: SideEffectEntry = {
            effectName: entry.effectName,
            riskLevel: entry.riskLevel as "high" | "medium" | "low",
            frequency: entry.frequency,
            description: entry.description,
          };
          if (mapped.riskLevel in sideEffects) {
            sideEffects[mapped.riskLevel].push(mapped);
          }
        }
      } else {
        sideEffects = { high: [], medium: [], low: [] };
      }

      res.status(200).json({
        success: true,
        data: { sideEffects },
      });
    } catch (error) {
      console.error("Drug side effects error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to fetch side effects" },
      });
    }
  },
);

// ---------------------------------------------------------------------------
// 5. POST /check-interactions
// ---------------------------------------------------------------------------

router.post(
  "/check-interactions",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { drugIds } = req.body;

      if (!Array.isArray(drugIds) || drugIds.length < 2) {
        res.status(400).json({
          success: false,
          error: { message: "At least two drug IDs are required in 'drugIds' array" },
        });
        return;
      }

      if (drugIds.length > 20) {
        res.status(400).json({
          success: false,
          error: { message: "Maximum of 20 drug IDs allowed per request" },
        });
        return;
      }

      const normalizedDrugIds = drugIds.map(normalizeDrugId);

      for (let index = 0; index < normalizedDrugIds.length; index += 1) {
        const drugId = normalizedDrugIds[index];
        if (!drugId || !isValidDrugId(drugId)) {
          res.status(400).json({
            success: false,
            error: { message: `Invalid drug ID format: ${String(drugIds[index])}` },
          });
          return;
        }
      }

      const interactions = await checkInteractions(normalizedDrugIds as string[]);

      res.status(200).json({
        success: true,
        data: { interactions },
      });
    } catch (error) {
      console.error("Check interactions error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to check drug interactions" },
      });
    }
  },
);

// ---------------------------------------------------------------------------
// 6. GET /:id/interactions
// ---------------------------------------------------------------------------

router.get(
  "/:id/interactions",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!isValidDrugId(id)) {
        res.status(400).json({
          success: false,
          error: { message: "Invalid drug ID format" },
        });
        return;
      }

      // Verify drug exists
      const drugResult = await query("SELECT id FROM drugs WHERE id = $1", [id]);

      if (drugResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: { message: "Drug not found" },
        });
        return;
      }

      const interactionsResult = await query(
        `SELECT
           di.id,
           di.drug_id_1,
           di.drug_id_2 AS other_drug_id,
           di.severity,
           di.description,
           di.recommendation,
           COALESCE(d2.name, 'Unknown') AS other_drug_name
         FROM drug_interactions di
         LEFT JOIN drugs d2 ON d2.id = di.drug_id_2
         WHERE di.drug_id_1 = $1
         ORDER BY
           CASE di.severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END,
           COALESCE(d2.name, 'Unknown') ASC`,
        [id],
      );

      res.status(200).json({
        success: true,
        data: { interactions: interactionsResult.rows },
      });
    } catch (error) {
      console.error("Drug interactions error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to fetch drug interactions" },
      });
    }
  },
);

export default router;
