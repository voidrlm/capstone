import dotenv from "dotenv";
import pool, { query } from "../db/index.js";

dotenv.config();

type OpenFdaDrugRow = {
  id: string;
  set_id: string | null;
  version: string | null;
  effective_time: string | null;
  route: string[] | null;
  brand_name: string[] | null;
  generic_name: string[] | null;
  manufacturer_name: string[] | null;
  active_ingredient: string[] | null;
  inactive_ingredient: string[] | null;
  pregnancy: string[] | null;
  overdosage: string[] | null;
  description: string[] | null;
  how_supplied: string[] | null;
  geriatric_use: string[] | null;
  pediatric_use: string[] | null;
  clinical_studies: string[] | null;
  pharmacodynamics: string[] | null;
  pharmacokinetics: string[] | null;
  adverse_reactions: string[] | null;
  mechanism_of_action: string[] | null;
  recent_major_changes: string[] | null;
  clinical_pharmacology: string[] | null;
  indications_and_usage: string[] | null;
  warnings_and_cautions: string[] | null;
  nonclinical_toxicology: string[] | null;
  information_for_patients: string[] | null;
  spl_unclassified_section: string[] | null;
  purpose: string[] | null;
  dosage_and_administration: string[] | null;
  spl_product_data_elements: string[] | null;
  dosage_forms_and_strengths: string[] | null;
  use_in_specific_populations: string[] | null;
  package_label_principal_display_panel: string[] | null;
  carcinogenesis_and_mutagenesis_and_impairment_of_fertility: string[] | null;
  contraindications: string[] | null;
  drug_interactions: string[] | null;
  dependence: string[] | null;
  do_not_use: string[] | null;
  stop_use: string[] | null;
  warnings: string[] | null;
  general_precautions: string[] | null;
  product_type: string[] | null;
  fetched_at: Date | null;
};

const toTrimmedArray = (value: string[] | null): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => item.trim()).filter((item) => item.length > 0);
};

const toJoinedText = (value: string[] | null): string | null => {
  const parts = toTrimmedArray(value);
  if (parts.length === 0) {
    return null;
  }

  return parts.join("\n\n");
};

const toInlineText = (value: string[] | null): string | null => {
  const parts = toTrimmedArray(value);
  if (parts.length === 0) {
    return null;
  }

  return parts.join("; ");
};

const firstNonEmpty = (...values: Array<string | null>): string | null =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

const firstArrayValue = (value: string[] | null): string | null => {
  const parts = toTrimmedArray(value);
  return parts[0] ?? null;
};

const ensureDrugsColumns = async () => {
  await query(`
    ALTER TABLE drugs
      ADD COLUMN IF NOT EXISTS openfda_id TEXT,
      ADD COLUMN IF NOT EXISTS manufacturer_name TEXT,
      ADD COLUMN IF NOT EXISTS route TEXT,
      ADD COLUMN IF NOT EXISTS product_type TEXT,
      ADD COLUMN IF NOT EXISTS set_id TEXT,
      ADD COLUMN IF NOT EXISTS version TEXT,
      ADD COLUMN IF NOT EXISTS effective_time TEXT,
      ADD COLUMN IF NOT EXISTS active_ingredients TEXT,
      ADD COLUMN IF NOT EXISTS inactive_ingredients TEXT,
      ADD COLUMN IF NOT EXISTS pregnancy TEXT,
      ADD COLUMN IF NOT EXISTS overdosage TEXT,
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS how_supplied TEXT,
      ADD COLUMN IF NOT EXISTS geriatric_use TEXT,
      ADD COLUMN IF NOT EXISTS pediatric_use TEXT,
      ADD COLUMN IF NOT EXISTS clinical_studies TEXT,
      ADD COLUMN IF NOT EXISTS pharmacodynamics TEXT,
      ADD COLUMN IF NOT EXISTS pharmacokinetics TEXT,
      ADD COLUMN IF NOT EXISTS adverse_reactions TEXT,
      ADD COLUMN IF NOT EXISTS mechanism_of_action TEXT,
      ADD COLUMN IF NOT EXISTS recent_major_changes TEXT,
      ADD COLUMN IF NOT EXISTS clinical_pharmacology TEXT,
      ADD COLUMN IF NOT EXISTS indications_and_usage TEXT,
      ADD COLUMN IF NOT EXISTS warnings_and_cautions TEXT,
      ADD COLUMN IF NOT EXISTS nonclinical_toxicology TEXT,
      ADD COLUMN IF NOT EXISTS information_for_patients TEXT,
      ADD COLUMN IF NOT EXISTS spl_unclassified_section TEXT,
      ADD COLUMN IF NOT EXISTS purpose TEXT,
      ADD COLUMN IF NOT EXISTS dosage_and_administration TEXT,
      ADD COLUMN IF NOT EXISTS spl_product_data_elements TEXT,
      ADD COLUMN IF NOT EXISTS dosage_forms_and_strengths TEXT,
      ADD COLUMN IF NOT EXISTS use_in_specific_populations TEXT,
      ADD COLUMN IF NOT EXISTS package_label_principal_display_panel TEXT,
      ADD COLUMN IF NOT EXISTS carcinogenesis_and_mutagenesis_and_impairment_of_fertility TEXT,
      ADD COLUMN IF NOT EXISTS drug_contraindications TEXT,
      ADD COLUMN IF NOT EXISTS drug_interactions TEXT,
      ADD COLUMN IF NOT EXISTS dependence TEXT,
      ADD COLUMN IF NOT EXISTS do_not_use TEXT,
      ADD COLUMN IF NOT EXISTS stop_use TEXT,
      ADD COLUMN IF NOT EXISTS general_precautions TEXT,
      ADD COLUMN IF NOT EXISTS openfda_fetched_at TIMESTAMP WITH TIME ZONE
  `);

  await query(`
    ALTER TABLE drugs
      ALTER COLUMN name TYPE TEXT,
      ALTER COLUMN generic_name TYPE TEXT,
      ALTER COLUMN category TYPE TEXT;
  `);

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'drugs_openfda_id_key'
      ) THEN
        ALTER TABLE drugs
        ADD CONSTRAINT drugs_openfda_id_key UNIQUE (openfda_id);
      END IF;
    END $$;
  `);
};

const fetchOpenFdaDrugs = async (): Promise<OpenFdaDrugRow[]> => {
  const result = await query(`
    SELECT
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
      product_type,
      fetched_at
    FROM drugs_openfda
    ORDER BY id
  `);

  return result.rows as OpenFdaDrugRow[];
};

const upsertDrug = async (drug: OpenFdaDrugRow): Promise<void> => {
  const brandName = firstArrayValue(drug.brand_name);
  const genericName = firstArrayValue(drug.generic_name);
  const name = firstNonEmpty(brandName, genericName, drug.id);

  if (!name) {
    return;
  }

  await query(
    `INSERT INTO drugs (
      openfda_id,
      name,
      generic_name,
      category,
      manufacturer_name,
      route,
      product_type,
      set_id,
      version,
      effective_time,
      uses,
      warnings,
      dosage_info,
      active_ingredients,
      inactive_ingredients,
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
      drug_contraindications,
      drug_interactions,
      dependence,
      do_not_use,
      stop_use,
      general_precautions,
      openfda_fetched_at,
      scraped_date
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
      $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
      $41, $42, $43, $44, $45, $46, $47, CURRENT_TIMESTAMP
    )
    ON CONFLICT (openfda_id) DO UPDATE SET
      name = EXCLUDED.name,
      generic_name = EXCLUDED.generic_name,
      category = EXCLUDED.category,
      manufacturer_name = EXCLUDED.manufacturer_name,
      route = EXCLUDED.route,
      product_type = EXCLUDED.product_type,
      set_id = EXCLUDED.set_id,
      version = EXCLUDED.version,
      effective_time = EXCLUDED.effective_time,
      uses = EXCLUDED.uses,
      warnings = EXCLUDED.warnings,
      dosage_info = EXCLUDED.dosage_info,
      active_ingredients = EXCLUDED.active_ingredients,
      inactive_ingredients = EXCLUDED.inactive_ingredients,
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
      drug_contraindications = EXCLUDED.drug_contraindications,
      drug_interactions = EXCLUDED.drug_interactions,
      dependence = EXCLUDED.dependence,
      do_not_use = EXCLUDED.do_not_use,
      stop_use = EXCLUDED.stop_use,
      general_precautions = EXCLUDED.general_precautions,
      openfda_fetched_at = EXCLUDED.openfda_fetched_at,
      scraped_date = CURRENT_TIMESTAMP`,
    [
      drug.id,
      name,
      genericName,
      firstArrayValue(drug.product_type),
      firstArrayValue(drug.manufacturer_name),
      toInlineText(drug.route),
      toInlineText(drug.product_type),
      drug.set_id,
      drug.version,
      drug.effective_time,
      toTrimmedArray(drug.indications_and_usage),
      toTrimmedArray(drug.warnings),
      toJoinedText(drug.dosage_and_administration),
      toJoinedText(drug.active_ingredient),
      toJoinedText(drug.inactive_ingredient),
      toJoinedText(drug.pregnancy),
      toJoinedText(drug.overdosage),
      toJoinedText(drug.description),
      toJoinedText(drug.how_supplied),
      toJoinedText(drug.geriatric_use),
      toJoinedText(drug.pediatric_use),
      toJoinedText(drug.clinical_studies),
      toJoinedText(drug.pharmacodynamics),
      toJoinedText(drug.pharmacokinetics),
      toJoinedText(drug.adverse_reactions),
      toJoinedText(drug.mechanism_of_action),
      toJoinedText(drug.recent_major_changes),
      toJoinedText(drug.clinical_pharmacology),
      toJoinedText(drug.indications_and_usage),
      toJoinedText(drug.warnings_and_cautions),
      toJoinedText(drug.nonclinical_toxicology),
      toJoinedText(drug.information_for_patients),
      toJoinedText(drug.spl_unclassified_section),
      toJoinedText(drug.purpose),
      toJoinedText(drug.dosage_and_administration),
      toJoinedText(drug.spl_product_data_elements),
      toJoinedText(drug.dosage_forms_and_strengths),
      toJoinedText(drug.use_in_specific_populations),
      toJoinedText(drug.package_label_principal_display_panel),
      toJoinedText(
        drug.carcinogenesis_and_mutagenesis_and_impairment_of_fertility,
      ),
      toJoinedText(drug.contraindications),
      toJoinedText(drug.drug_interactions),
      toJoinedText(drug.dependence),
      toJoinedText(drug.do_not_use),
      toJoinedText(drug.stop_use),
      toJoinedText(drug.general_precautions),
      drug.fetched_at,
    ],
  );
};

const run = async () => {
  let totalUpserted = 0;

  try {
    await ensureDrugsColumns();

    const openFdaDrugs = await fetchOpenFdaDrugs();

    for (const drug of openFdaDrugs) {
      await upsertDrug(drug);
      totalUpserted += 1;
    }

    console.log(
      `Normalized drugs import complete. Upserted ${totalUpserted} rows from drugs_openfda.`,
    );
  } finally {
    await pool.end();
  }
};

void run();
