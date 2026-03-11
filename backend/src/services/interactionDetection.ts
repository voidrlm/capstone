import { query } from "../db/index.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DrugInteraction {
  drug1Id: string;
  drug1Name: string;
  drug2Id: string;
  drug2Name: string;
  severity: "high" | "medium" | "low";
  description: string;
  recommendation: string;
}

type Severity = DrugInteraction["severity"];

interface DrugRecord {
  id: string;
  name: string;
  generic_name: string | null;
  drug_interactions: string | null;
  drug_contraindications: string | null;
}

// ---------------------------------------------------------------------------
// Severity classification helpers
// ---------------------------------------------------------------------------

const HIGH_KEYWORDS = [
  "contraindicated",
  "contraindication",
  "do not use",
  "avoid",
  "never",
  "prohibited",
  "serious",
  "fatal",
  "life-threatening",
  "life threatening",
  "black box",
  "boxed warning",
];

const MEDIUM_KEYWORDS = [
  "caution",
  "monitor",
  "careful",
  "closely",
  "adjust dose",
  "dose adjustment",
  "reduce dose",
  "significant",
  "moderate",
  "watch",
  "use with caution",
];

const LOW_KEYWORDS = [
  "minor",
  "mild",
  "slight",
  "unlikely",
  "minimal",
  "negligible",
  "weak",
  "low risk",
];

/**
 * Classify the severity of an interaction based on keyword analysis of the
 * surrounding text context.  Falls back to "medium" when no keywords match.
 */
function classifySeverity(text: string): Severity {
  const lower = text.toLowerCase();

  for (const kw of HIGH_KEYWORDS) {
    if (lower.includes(kw)) return "high";
  }
  for (const kw of MEDIUM_KEYWORDS) {
    if (lower.includes(kw)) return "medium";
  }
  for (const kw of LOW_KEYWORDS) {
    if (lower.includes(kw)) return "low";
  }

  // Default to medium when we cannot determine severity from context.
  return "medium";
}

/** Numeric weight so we can sort high > medium > low. */
const SEVERITY_ORDER: Record<Severity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

// ---------------------------------------------------------------------------
// Text analysis helpers
// ---------------------------------------------------------------------------

/**
 * Build a case-insensitive regex that matches any of the supplied drug names.
 * Names shorter than 3 characters are skipped to avoid false positives.
 * Word boundaries are enforced so partial matches inside longer words are ignored.
 */
function buildDrugNamePattern(names: string[]): RegExp | null {
  const escaped = names
    .filter((n) => n.length >= 3)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (escaped.length === 0) return null;

  return new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
}

/**
 * Extract a context window of up to `radius` characters around every match
 * of `pattern` within `text`.  Returns the concatenated context snippets
 * separated by " ... ".
 */
function extractContext(
  text: string,
  pattern: RegExp,
  radius = 200,
): string | null {
  const snippets: string[] = [];
  let match: RegExpExecArray | null;

  // Reset the regex index in case it was previously used.
  pattern.lastIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    const start = Math.max(0, match.index - radius);
    const end = Math.min(text.length, match.index + match[0].length + radius);
    snippets.push(text.slice(start, end).trim());
  }

  return snippets.length > 0 ? snippets.join(" ... ") : null;
}

/**
 * Generate a default recommendation string for a given severity level.
 */
function defaultRecommendation(severity: Severity): string {
  switch (severity) {
    case "high":
      return "Avoid concurrent use. Consult prescriber for alternative therapy.";
    case "medium":
      return "Use with caution. Monitor patient closely and consider dose adjustments.";
    case "low":
      return "Generally safe. Be aware of potential minor effects.";
  }
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

/**
 * Fetch a single drug record (id, name, generic_name, interaction/contraindication text).
 */
async function fetchDrug(drugId: string): Promise<DrugRecord | null> {
  const result = await query(
    `SELECT id, name, generic_name, drug_interactions, drug_contraindications
     FROM drugs
     WHERE id = $1`,
    [drugId],
  );

  if (result.rows.length === 0) return null;
  return result.rows[0] as DrugRecord;
}

/**
 * Fetch multiple drug records by their ids.
 */
async function fetchDrugs(drugIds: string[]): Promise<DrugRecord[]> {
  if (drugIds.length === 0) return [];

  const result = await query(
    `SELECT id, name, generic_name, drug_interactions, drug_contraindications
     FROM drugs
     WHERE id = ANY($1)`,
    [drugIds],
  );

  return result.rows as DrugRecord[];
}

/**
 * Fetch all drugs in the database (id, name, generic_name only) for cross-
 * referencing during text analysis.  Results are cached per service call;
 * callers should not hold onto this across requests.
 */
async function fetchAllDrugNames(): Promise<
  Pick<DrugRecord, "id" | "name" | "generic_name">[]
> {
  const result = await query(
    `SELECT id, name, generic_name FROM drugs ORDER BY name`,
  );
  return result.rows as Pick<DrugRecord, "id" | "name" | "generic_name">[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieve previously-stored interactions between two specific drugs from the
 * `drug_interactions` junction table.  The lookup is bidirectional (checks
 * both orderings).
 */
export async function getStoredInteractions(
  drugId1: string,
  drugId2: string,
): Promise<DrugInteraction[]> {
  const result = await query(
    `SELECT
       di.severity,
       di.description,
       di.recommendation,
       di.drug_id_1,
       di.drug_id_2,
       d1.name AS drug1_name,
       d2.name AS drug2_name
     FROM drug_interactions di
     JOIN drugs d1 ON d1.id = di.drug_id_1
     JOIN drugs d2 ON d2.id = di.drug_id_2
     WHERE (di.drug_id_1 = $1 AND di.drug_id_2 = $2)
        OR (di.drug_id_1 = $2 AND di.drug_id_2 = $1)`,
    [drugId1, drugId2],
  );

  return result.rows.map(
    (row: {
      drug_id_1: string;
      drug1_name: string;
      drug_id_2: string;
      drug2_name: string;
      severity: Severity;
      description: string;
      recommendation: string | null;
    }) => ({
      drug1Id: row.drug_id_1,
      drug1Name: row.drug1_name,
      drug2Id: row.drug_id_2,
      drug2Name: row.drug2_name,
      severity: row.severity,
      description: row.description,
      recommendation: row.recommendation ?? defaultRecommendation(row.severity),
    }),
  );
}

/**
 * Analyse the `drug_interactions` and `drug_contraindications` text fields of
 * a single drug, cross-referencing mentions of every other drug stored in the
 * database.  Returns structured interaction objects for each mention found.
 */
export async function analyzeInteractionsFromText(
  drugId: string,
): Promise<DrugInteraction[]> {
  const [drug, allDrugs] = await Promise.all([
    fetchDrug(drugId),
    fetchAllDrugNames(),
  ]);

  if (!drug) {
    throw new Error(`Drug not found: ${drugId}`);
  }

  const interactionsText = drug.drug_interactions ?? "";
  const contraindicationsText = drug.drug_contraindications ?? "";
  const combinedText = [interactionsText, contraindicationsText]
    .filter(Boolean)
    .join(" ");

  if (combinedText.trim().length === 0) {
    return [];
  }

  const interactions: DrugInteraction[] = [];

  for (const otherDrug of allDrugs) {
    // Skip self-matches.
    if (otherDrug.id === drugId) continue;

    const names = [otherDrug.name];
    if (otherDrug.generic_name) {
      names.push(otherDrug.generic_name);
    }

    const pattern = buildDrugNamePattern(names);
    if (!pattern) continue;

    // Check both text fields independently so we can provide field-specific context.
    const interactionCtx = interactionsText
      ? extractContext(interactionsText, pattern)
      : null;
    const contraindicationCtx = contraindicationsText
      ? extractContext(contraindicationsText, pattern)
      : null;

    if (!interactionCtx && !contraindicationCtx) continue;

    const contextParts: string[] = [];
    if (interactionCtx) contextParts.push(interactionCtx);
    if (contraindicationCtx) contextParts.push(contraindicationCtx);

    const fullContext = contextParts.join(" ");
    const severity = classifySeverity(fullContext);

    interactions.push({
      drug1Id: drug.id,
      drug1Name: drug.name,
      drug2Id: otherDrug.id,
      drug2Name: otherDrug.name,
      severity,
      description: fullContext.length > 500
        ? fullContext.slice(0, 497) + "..."
        : fullContext,
      recommendation: defaultRecommendation(severity),
    });
  }

  return interactions.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}

/**
 * Check interactions across a list of drug IDs.  For every unique pair the
 * function:
 *
 * 1. Looks up pre-stored rows in the `drug_interactions` table.
 * 2. Falls back to analysing the raw `drug_interactions` / `drug_contraindications`
 *    text fields when no stored record exists.
 *
 * Results are sorted by severity (high first).
 */
export async function checkInteractions(
  drugIds: string[],
): Promise<DrugInteraction[]> {
  if (drugIds.length < 2) return [];

  // De-duplicate input ids.
  const uniqueIds = [...new Set(drugIds)];
  if (uniqueIds.length < 2) return [];

  // Pre-fetch all requested drugs so text analysis can work without N+1 queries.
  const drugs = await fetchDrugs(uniqueIds);
  const drugMap = new Map(drugs.map((d) => [d.id, d]));

  // Validate that all requested IDs exist.
  const missingIds = uniqueIds.filter((id) => !drugMap.has(id));
  if (missingIds.length > 0) {
    throw new Error(`Drugs not found: ${missingIds.join(", ")}`);
  }

  const allInteractions: DrugInteraction[] = [];
  const seen = new Set<string>();

  // Generate every unique pair.
  for (let i = 0; i < uniqueIds.length; i++) {
    for (let j = i + 1; j < uniqueIds.length; j++) {
      const id1 = uniqueIds[i];
      const id2 = uniqueIds[j];
      const pairKey = [id1, id2].sort().join(":");
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);

      // Step 1: Check stored interactions.
      const stored = await getStoredInteractions(id1, id2);
      if (stored.length > 0) {
        allInteractions.push(...stored);
        continue;
      }

      // Step 2: Analyse raw text fields in both directions.
      const drug1 = drugMap.get(id1)!;
      const drug2 = drugMap.get(id2)!;

      const textInteractions = analyzeTextPair(drug1, drug2);
      allInteractions.push(...textInteractions);
    }
  }

  return allInteractions.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}

// ---------------------------------------------------------------------------
// Internal: pair-wise text analysis (synchronous, no extra DB calls)
// ---------------------------------------------------------------------------

/**
 * Check the text fields of two drugs for mentions of each other and return
 * any interactions found.  Does not hit the database.
 */
function analyzeTextPair(
  drug1: DrugRecord,
  drug2: DrugRecord,
): DrugInteraction[] {
  const results: DrugInteraction[] = [];

  // Check drug1's text for mentions of drug2.
  const drug2Names = [drug2.name];
  if (drug2.generic_name) drug2Names.push(drug2.generic_name);
  const pattern2 = buildDrugNamePattern(drug2Names);

  if (pattern2) {
    const combined1 = [drug1.drug_interactions, drug1.drug_contraindications]
      .filter(Boolean)
      .join(" ");

    if (combined1.length > 0) {
      const ctx = extractContext(combined1, pattern2);
      if (ctx) {
        const severity = classifySeverity(ctx);
        results.push({
          drug1Id: drug1.id,
          drug1Name: drug1.name,
          drug2Id: drug2.id,
          drug2Name: drug2.name,
          severity,
          description:
            ctx.length > 500 ? ctx.slice(0, 497) + "..." : ctx,
          recommendation: defaultRecommendation(severity),
        });
        return results; // One interaction record per pair is sufficient.
      }
    }
  }

  // Check drug2's text for mentions of drug1 (reverse direction).
  const drug1Names = [drug1.name];
  if (drug1.generic_name) drug1Names.push(drug1.generic_name);
  const pattern1 = buildDrugNamePattern(drug1Names);

  if (pattern1) {
    const combined2 = [drug2.drug_interactions, drug2.drug_contraindications]
      .filter(Boolean)
      .join(" ");

    if (combined2.length > 0) {
      const ctx = extractContext(combined2, pattern1);
      if (ctx) {
        const severity = classifySeverity(ctx);
        results.push({
          drug1Id: drug2.id,
          drug1Name: drug2.name,
          drug2Id: drug1.id,
          drug2Name: drug1.name,
          severity,
          description:
            ctx.length > 500 ? ctx.slice(0, 497) + "..." : ctx,
          recommendation: defaultRecommendation(severity),
        });
      }
    }
  }

  return results;
}
