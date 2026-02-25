import dotenv from "dotenv";
import pool, { query } from "../db/index.js";

dotenv.config();

type OpenFdaSection = {
  product_type?: string[];
  brand_name?: string[];
  generic_name?: string[];
  manufacturer_name?: string[];
};

type OpenFdaResult = {
  id?: string;
  openfda?: OpenFdaSection;
  active_ingredient?: string[];
  inactive_ingredient?: string[];
  description?: string[];
  indications_and_usage?: string[];
  purpose?: string[];
  dosage_and_administration?: string[];
  contraindications?: string[];
  drug_interactions?: string[];
  dependence?: string[];
  do_not_use?: string[];
  stop_use?: string[];
  warnings?: string[];
  general_precautions?: string[];
  ask_doctor_table?: string[];
  boxed_warning_table?: string[];
  [key: string]: unknown;
};

type OpenFdaResponse = {
  results?: OpenFdaResult[];
};

const endpoint = "/drug/label.json";
const batchSize = Number(process.env.OPENFDA_BATCH_SIZE ?? 100);
const targetTotal = Number(process.env.OPENFDA_TARGET_TOTAL ?? 3000);
const maxIterations = Number(
  process.env.OPENFDA_MAX_ITERATIONS ?? Math.ceil(targetTotal / batchSize),
);
const baseUrl = process.env.OPENFDA_BASE_URL ?? "https://api.fda.gov";
const search =
  '(openfda.product_type:"HUMAN OTC DRUG" OR openfda.product_type:"HUMAN PRESCRIPTION DRUG" OR openfda.product_type:"CELLULAR THERAPY")';

const toTextArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const fetchOpenFda = async (skip: number): Promise<OpenFdaResult[]> => {
  const params = new URLSearchParams({
    search,
    limit: String(batchSize),
    skip: String(skip),
  });

  const response = await fetch(`${baseUrl}${endpoint}?${params.toString()}`);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenFDA request failed (${response.status}): ${errorBody.slice(0, 400)}`,
    );
  }

  const json = (await response.json()) as OpenFdaResponse;
  return json.results ?? [];
};

const ensureOpenFdaTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS drugs_openfda (
      id TEXT PRIMARY KEY,
      brand_name TEXT[],
      generic_name TEXT[],
      manufacturer_name TEXT[],
      active_ingredient TEXT[],
      inactive_ingredient TEXT[],
      description TEXT[],
      indications_and_usage TEXT[],
      purpose TEXT[],
      dosage_and_administration TEXT[],
      contraindications TEXT[],
      drug_interactions TEXT[],
      dependence TEXT[],
      do_not_use TEXT[],
      stop_use TEXT[],
      warnings TEXT[],
      general_precautions TEXT[],
      ask_doctor_table TEXT[],
      boxed_warning_table TEXT[],
      product_type TEXT[],
      raw_payload JSONB,
      fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_drugs_openfda_brand_name
    ON drugs_openfda USING GIN (brand_name)
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_drugs_openfda_generic_name
    ON drugs_openfda USING GIN (generic_name)
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_drugs_openfda_manufacturer_name
    ON drugs_openfda USING GIN (manufacturer_name)
  `);
};

const upsertDrug = async (item: OpenFdaResult): Promise<boolean> => {
  if (!item.id) {
    return false;
  }

  await query(
    `INSERT INTO drugs_openfda (
      id,
      brand_name,
      generic_name,
      manufacturer_name,
      active_ingredient,
      inactive_ingredient,
      description,
      indications_and_usage,
      purpose,
      dosage_and_administration,
      contraindications,
      drug_interactions,
      dependence,
      do_not_use,
      stop_use,
      warnings,
      general_precautions,
      ask_doctor_table,
      boxed_warning_table,
      product_type,
      raw_payload
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
    )
    ON CONFLICT (id) DO UPDATE SET
      brand_name = EXCLUDED.brand_name,
      generic_name = EXCLUDED.generic_name,
      manufacturer_name = EXCLUDED.manufacturer_name,
      active_ingredient = EXCLUDED.active_ingredient,
      inactive_ingredient = EXCLUDED.inactive_ingredient,
      description = EXCLUDED.description,
      indications_and_usage = EXCLUDED.indications_and_usage,
      purpose = EXCLUDED.purpose,
      dosage_and_administration = EXCLUDED.dosage_and_administration,
      contraindications = EXCLUDED.contraindications,
      drug_interactions = EXCLUDED.drug_interactions,
      dependence = EXCLUDED.dependence,
      do_not_use = EXCLUDED.do_not_use,
      stop_use = EXCLUDED.stop_use,
      warnings = EXCLUDED.warnings,
      general_precautions = EXCLUDED.general_precautions,
      ask_doctor_table = EXCLUDED.ask_doctor_table,
      boxed_warning_table = EXCLUDED.boxed_warning_table,
      product_type = EXCLUDED.product_type,
      raw_payload = EXCLUDED.raw_payload,
      fetched_at = CURRENT_TIMESTAMP`,
    [
      item.id,
      toTextArray(item.openfda?.brand_name),
      toTextArray(item.openfda?.generic_name),
      toTextArray(item.openfda?.manufacturer_name),
      toTextArray(item.active_ingredient),
      toTextArray(item.inactive_ingredient),
      toTextArray(item.description),
      toTextArray(item.indications_and_usage),
      toTextArray(item.purpose),
      toTextArray(item.dosage_and_administration),
      toTextArray(item.contraindications),
      toTextArray(item.drug_interactions),
      toTextArray(item.dependence),
      toTextArray(item.do_not_use),
      toTextArray(item.stop_use),
      toTextArray(item.warnings),
      toTextArray(item.general_precautions),
      toTextArray(item.ask_doctor_table),
      toTextArray(item.boxed_warning_table),
      toTextArray(item.openfda?.product_type),
      JSON.stringify(item),
    ],
  );

  return true;
};

const run = async () => {
  let totalFetched = 0;
  let totalInserted = 0;

  try {
    await ensureOpenFdaTable();

    for (let iteration = 0; iteration < maxIterations; iteration += 1) {
      if (totalFetched >= targetTotal) {
        break;
      }

      const skip = iteration * batchSize;
      const results = await fetchOpenFda(skip);

      if (results.length === 0) {
        console.log(`No more data at iteration ${iteration + 1}. Stopping.`);
        break;
      }

      const remaining = targetTotal - totalFetched;
      const currentBatch = results.slice(0, remaining);

      let insertedThisBatch = 0;
      for (const item of currentBatch) {
        const inserted = await upsertDrug(item);
        if (inserted) {
          insertedThisBatch += 1;
        }
      }

      totalFetched += currentBatch.length;
      totalInserted += insertedThisBatch;

      console.log(
        `Iteration ${iteration + 1}/${maxIterations}: fetched=${currentBatch.length}, upserted=${insertedThisBatch}, total=${totalInserted}`,
      );
    }

    console.log(
      `OpenFDA import complete. Requested=${targetTotal}, fetched=${totalFetched}, upserted=${totalInserted}`,
    );
  } finally {
    await pool.end();
  }
};

void run();
