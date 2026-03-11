import dotenv from "dotenv";
import pool, { query } from "../db/index.js";

dotenv.config();

type OpenFdaSection = {
  route?: string[];
  product_type?: string[];
  brand_name?: string[];
  generic_name?: string[];
  manufacturer_name?: string[];
};

type OpenFdaResult = {
  id?: string;
  set_id?: string;
  openfda?: OpenFdaSection;
  version?: string;
  pregnancy?: string[];
  overdosage?: string[];
  active_ingredient?: string[];
  inactive_ingredient?: string[];
  description?: string[];
  how_supplied?: string[];
  geriatric_use?: string[];
  pediatric_use?: string[];
  effective_time?: string;
  clinical_studies?: string[];
  pharmacodynamics?: string[];
  pharmacokinetics?: string[];
  adverse_reactions?: string[];
  indications_and_usage?: string[];
  mechanism_of_action?: string[];
  recent_major_changes?: string[];
  clinical_pharmacology?: string[];
  purpose?: string[];
  dosage_and_administration?: string[];
  warnings_and_cautions?: string[];
  nonclinical_toxicology?: string[];
  information_for_patients?: string[];
  spl_unclassified_section?: string[];
  spl_product_data_elements?: string[];
  dosage_forms_and_strengths?: string[];
  use_in_specific_populations?: string[];
  package_label_principal_display_panel?: string[];
  carcinogenesis_and_mutagenesis_and_impairment_of_fertility?: string[];
  contraindications?: string[];
  drug_interactions?: string[];
  dependence?: string[];
  do_not_use?: string[];
  stop_use?: string[];
  warnings?: string[];
  general_precautions?: string[];
  [key: string]: unknown;
};

type OpenFdaResponse = {
  results?: OpenFdaResult[];
};

const endpoint = "/drug/label.json";
const batchSize = Number(process.env.OPENFDA_BATCH_SIZE ?? 100);
const targetTotal = Number(process.env.OPENFDA_TARGET_TOTAL ?? 5000000);
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
      set_id TEXT,
      version TEXT,
      effective_time TEXT,
      route TEXT[],
      brand_name TEXT[],
      generic_name TEXT[],
      manufacturer_name TEXT[],
      active_ingredient TEXT[],
      inactive_ingredient TEXT[],
      pregnancy TEXT[],
      overdosage TEXT[],
      description TEXT[],
      how_supplied TEXT[],
      geriatric_use TEXT[],
      pediatric_use TEXT[],
      clinical_studies TEXT[],
      pharmacodynamics TEXT[],
      pharmacokinetics TEXT[],
      adverse_reactions TEXT[],
      mechanism_of_action TEXT[],
      recent_major_changes TEXT[],
      clinical_pharmacology TEXT[],
      indications_and_usage TEXT[],
      warnings_and_cautions TEXT[],
      nonclinical_toxicology TEXT[],
      information_for_patients TEXT[],
      spl_unclassified_section TEXT[],
      purpose TEXT[],
      dosage_and_administration TEXT[],
      spl_product_data_elements TEXT[],
      dosage_forms_and_strengths TEXT[],
      use_in_specific_populations TEXT[],
      package_label_principal_display_panel TEXT[],
      carcinogenesis_and_mutagenesis_and_impairment_of_fertility TEXT[],
      contraindications TEXT[],
      drug_interactions TEXT[],
      dependence TEXT[],
      do_not_use TEXT[],
      stop_use TEXT[],
      warnings TEXT[],
      general_precautions TEXT[],
      product_type TEXT[],
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
      set_id,
      version,
      effective_time,
      route,
      brand_name,
      generic_name,
      manufacturer_name,
      active_ingredient,
      inactive_ingredient,
      pregnancy,
      overdosage,
      description,
      how_supplied,
      geriatric_use,
      pediatric_use,
      clinical_studies,
      pharmacodynamics,
      pharmacokinetics,
      adverse_reactions,
      mechanism_of_action,
      recent_major_changes,
      clinical_pharmacology,
      indications_and_usage,
      warnings_and_cautions,
      nonclinical_toxicology,
      information_for_patients,
      spl_unclassified_section,
      purpose,
      dosage_and_administration,
      spl_product_data_elements,
      dosage_forms_and_strengths,
      use_in_specific_populations,
      package_label_principal_display_panel,
      carcinogenesis_and_mutagenesis_and_impairment_of_fertility,
      contraindications,
      drug_interactions,
      dependence,
      do_not_use,
      stop_use,
      warnings,
      general_precautions,
      product_type
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
      $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
      $41, $42, $43
    )
    ON CONFLICT (id) DO UPDATE SET
      set_id = EXCLUDED.set_id,
      version = EXCLUDED.version,
      effective_time = EXCLUDED.effective_time,
      route = EXCLUDED.route,
      brand_name = EXCLUDED.brand_name,
      generic_name = EXCLUDED.generic_name,
      manufacturer_name = EXCLUDED.manufacturer_name,
      active_ingredient = EXCLUDED.active_ingredient,
      inactive_ingredient = EXCLUDED.inactive_ingredient,
      pregnancy = EXCLUDED.pregnancy,
      overdosage = EXCLUDED.overdosage,
      description = EXCLUDED.description,
      how_supplied = EXCLUDED.how_supplied,
      geriatric_use = EXCLUDED.geriatric_use,
      pediatric_use = EXCLUDED.pediatric_use,
      clinical_studies = EXCLUDED.clinical_studies,
      pharmacodynamics = EXCLUDED.pharmacodynamics,
      pharmacokinetics = EXCLUDED.pharmacokinetics,
      adverse_reactions = EXCLUDED.adverse_reactions,
      mechanism_of_action = EXCLUDED.mechanism_of_action,
      recent_major_changes = EXCLUDED.recent_major_changes,
      clinical_pharmacology = EXCLUDED.clinical_pharmacology,
      indications_and_usage = EXCLUDED.indications_and_usage,
      warnings_and_cautions = EXCLUDED.warnings_and_cautions,
      nonclinical_toxicology = EXCLUDED.nonclinical_toxicology,
      information_for_patients = EXCLUDED.information_for_patients,
      spl_unclassified_section = EXCLUDED.spl_unclassified_section,
      purpose = EXCLUDED.purpose,
      dosage_and_administration = EXCLUDED.dosage_and_administration,
      spl_product_data_elements = EXCLUDED.spl_product_data_elements,
      dosage_forms_and_strengths = EXCLUDED.dosage_forms_and_strengths,
      use_in_specific_populations = EXCLUDED.use_in_specific_populations,
      package_label_principal_display_panel = EXCLUDED.package_label_principal_display_panel,
      carcinogenesis_and_mutagenesis_and_impairment_of_fertility = EXCLUDED.carcinogenesis_and_mutagenesis_and_impairment_of_fertility,
      contraindications = EXCLUDED.contraindications,
      drug_interactions = EXCLUDED.drug_interactions,
      dependence = EXCLUDED.dependence,
      do_not_use = EXCLUDED.do_not_use,
      stop_use = EXCLUDED.stop_use,
      warnings = EXCLUDED.warnings,
      general_precautions = EXCLUDED.general_precautions,
      product_type = EXCLUDED.product_type,
      fetched_at = CURRENT_TIMESTAMP`,
    [
      item.id,
      item.set_id ?? null,
      item.version ?? null,
      item.effective_time ?? null,
      toTextArray(item.openfda?.route),
      toTextArray(item.openfda?.brand_name),
      toTextArray(item.openfda?.generic_name),
      toTextArray(item.openfda?.manufacturer_name),
      toTextArray(item.active_ingredient),
      toTextArray(item.inactive_ingredient),
      toTextArray(item.pregnancy),
      toTextArray(item.overdosage),
      toTextArray(item.description),
      toTextArray(item.how_supplied),
      toTextArray(item.geriatric_use),
      toTextArray(item.pediatric_use),
      toTextArray(item.clinical_studies),
      toTextArray(item.pharmacodynamics),
      toTextArray(item.pharmacokinetics),
      toTextArray(item.adverse_reactions),
      toTextArray(item.mechanism_of_action),
      toTextArray(item.recent_major_changes),
      toTextArray(item.clinical_pharmacology),
      toTextArray(item.indications_and_usage),
      toTextArray(item.warnings_and_cautions),
      toTextArray(item.nonclinical_toxicology),
      toTextArray(item.information_for_patients),
      toTextArray(item.spl_unclassified_section),
      toTextArray(item.purpose),
      toTextArray(item.dosage_and_administration),
      toTextArray(item.spl_product_data_elements),
      toTextArray(item.dosage_forms_and_strengths),
      toTextArray(item.use_in_specific_populations),
      toTextArray(item.package_label_principal_display_panel),
      toTextArray(item.carcinogenesis_and_mutagenesis_and_impairment_of_fertility),
      toTextArray(item.contraindications),
      toTextArray(item.drug_interactions),
      toTextArray(item.dependence),
      toTextArray(item.do_not_use),
      toTextArray(item.stop_use),
      toTextArray(item.warnings),
      toTextArray(item.general_precautions),
      toTextArray(item.openfda?.product_type),
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

      // OpenFDA API restricts the `skip` parameter to a maximum of 25000.
      if (skip > 25000) {
        console.warn(`OpenFDA API limits skip to 25000. Stopping fetch at iteration ${iteration}.`);
        break;
      }

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
