import 'dotenv/config';
import pool, { query, getClient } from '../db/index.js';
import {
  classifySideEffects,
  type ClassificationContext,
  type SideEffectClassification,
} from '../services/riskClassification.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DrugRow {
  id: string;
  brand_name: string | null;
  adverse_reactions: string;
  warnings: string | null;
  warnings_and_cautions: string | null;
  do_not_use: string | null;
  stop_use: string | null;
  geriatric_use: string | null;
  pediatric_use: string | null;
  pregnancy: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of drugs to process in each batch to limit memory usage. */
const BATCH_SIZE = 50;

/** Number of side-effect rows to upsert in a single INSERT statement. */
const UPSERT_CHUNK_SIZE = 100;

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

/**
 * Fetch a batch of drugs that have non-empty adverse_reactions text.
 */
async function fetchDrugBatch(offset: number, limit: number): Promise<DrugRow[]> {
  const result = await query(
    `SELECT id, brand_name, adverse_reactions,
            warnings, warnings_and_cautions, do_not_use, stop_use,
            geriatric_use, pediatric_use, pregnancy
     FROM drugs
     WHERE adverse_reactions IS NOT NULL
       AND TRIM(adverse_reactions) <> ''
     ORDER BY id
     OFFSET $1
     LIMIT $2`,
    [offset, limit],
  );
  return result.rows as DrugRow[];
}

/**
 * Count total drugs with adverse_reactions for progress reporting.
 */
async function countDrugsWithReactions(): Promise<number> {
  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM drugs
     WHERE adverse_reactions IS NOT NULL
       AND TRIM(adverse_reactions) <> ''`,
  );
  return result.rows[0].count;
}

/**
 * Upsert a chunk of classified side effects for a single drug.
 *
 * Uses a single multi-row INSERT … ON CONFLICT to minimise round-trips.
 */
async function upsertSideEffects(
  client: ReturnType<typeof getClient> extends Promise<infer C> ? C : never,
  drugId: string,
  effects: SideEffectClassification[],
): Promise<number> {
  if (effects.length === 0) return 0;

  let upserted = 0;

  for (let i = 0; i < effects.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = effects.slice(i, i + UPSERT_CHUNK_SIZE);

    // Build parameterised multi-row VALUES clause
    const values: unknown[] = [];
    const placeholders: string[] = [];

    for (let j = 0; j < chunk.length; j++) {
      const base = j * 6;
      placeholders.push(
        `(gen_random_uuid(), $${base + 1}, $${base + 2}, $${base + 3}::risk_level, $${base + 4}::frequency_type, $${base + 5}, $${base + 6})`,
      );
      values.push(
        drugId,
        chunk[j].effectName,
        chunk[j].riskLevel,
        chunk[j].frequency,
        chunk[j].description,
        new Date(),
      );
    }

    const sql = `
      INSERT INTO drug_side_effects (id, drug_id, effect_name, risk_level, frequency, description, created_at)
      VALUES ${placeholders.join(',\n             ')}
      ON CONFLICT ON CONSTRAINT uq_drug_side_effects_drug_effect
      DO UPDATE SET
        risk_level   = EXCLUDED.risk_level,
        frequency    = EXCLUDED.frequency,
        description  = EXCLUDED.description,
        created_at   = EXCLUDED.created_at
    `;

    await (client as any).query(sql, values);
    upserted += chunk.length;
  }

  return upserted;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('=== Side Effects Parser ===');
  console.log(`Started at ${new Date().toISOString()}\n`);

  // Ensure unique constraint exists for upsert
  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_drug_side_effects_drug_effect'
      ) THEN
        ALTER TABLE drug_side_effects
          ADD CONSTRAINT uq_drug_side_effects_drug_effect UNIQUE (drug_id, effect_name);
      END IF;
    END $$;
  `);

  const totalDrugs = await countDrugsWithReactions();
  console.log(`Found ${totalDrugs} drugs with adverse_reactions text.\n`);

  if (totalDrugs === 0) {
    console.log('Nothing to process. Exiting.');
    return;
  }

  let processed = 0;
  let totalEffects = 0;
  let offset = 0;

  while (offset < totalDrugs) {
    const batch = await fetchDrugBatch(offset, BATCH_SIZE);
    if (batch.length === 0) break;

    // Use a single client (connection) for the batch to allow transactional upserts.
    const client = await getClient();

    try {
      await (client as any).query('BEGIN');

      for (const drug of batch) {
        const context: ClassificationContext = {
          warnings: drug.warnings ?? undefined,
          warningsAndCautions: drug.warnings_and_cautions ?? undefined,
          doNotUse: drug.do_not_use ?? undefined,
          stopUse: drug.stop_use ?? undefined,
          geriatricUse: drug.geriatric_use ?? undefined,
          pediatricUse: drug.pediatric_use ?? undefined,
          pregnancy: drug.pregnancy ?? undefined,
        };

        const classifications = classifySideEffects(drug.adverse_reactions, context);

        const count = await upsertSideEffects(client as any, drug.id, classifications);
        totalEffects += count;
        processed++;

        const drugLabel = drug.brand_name ?? drug.id;
        const pct = ((processed / totalDrugs) * 100).toFixed(1);
        console.log(
          `[${processed}/${totalDrugs}] (${pct}%) ${drugLabel} — ${count} side effects classified`,
        );
      }

      await (client as any).query('COMMIT');
    } catch (err) {
      await (client as any).query('ROLLBACK');
      console.error(`Error processing batch at offset ${offset}:`, err);
      throw err;
    } finally {
      (client as any).release();
    }

    offset += batch.length;
  }

  console.log(`\n=== Complete ===`);
  console.log(`Processed ${processed} drugs, upserted ${totalEffects} side effect records.`);
  console.log(`Finished at ${new Date().toISOString()}`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
