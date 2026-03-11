import dotenv from "dotenv";
import pool, { query } from "../db/index.js";

dotenv.config();

const ensureDrugsOpenFdaTable = async () => {
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
    ALTER TABLE drugs_openfda
      ADD COLUMN IF NOT EXISTS set_id TEXT,
      ADD COLUMN IF NOT EXISTS version TEXT,
      ADD COLUMN IF NOT EXISTS effective_time TEXT,
      ADD COLUMN IF NOT EXISTS route TEXT[],
      ADD COLUMN IF NOT EXISTS brand_name TEXT[],
      ADD COLUMN IF NOT EXISTS generic_name TEXT[],
      ADD COLUMN IF NOT EXISTS manufacturer_name TEXT[],
      ADD COLUMN IF NOT EXISTS active_ingredient TEXT[],
      ADD COLUMN IF NOT EXISTS inactive_ingredient TEXT[],
      ADD COLUMN IF NOT EXISTS pregnancy TEXT[],
      ADD COLUMN IF NOT EXISTS overdosage TEXT[],
      ADD COLUMN IF NOT EXISTS description TEXT[],
      ADD COLUMN IF NOT EXISTS how_supplied TEXT[],
      ADD COLUMN IF NOT EXISTS geriatric_use TEXT[],
      ADD COLUMN IF NOT EXISTS pediatric_use TEXT[],
      ADD COLUMN IF NOT EXISTS clinical_studies TEXT[],
      ADD COLUMN IF NOT EXISTS pharmacodynamics TEXT[],
      ADD COLUMN IF NOT EXISTS pharmacokinetics TEXT[],
      ADD COLUMN IF NOT EXISTS adverse_reactions TEXT[],
      ADD COLUMN IF NOT EXISTS mechanism_of_action TEXT[],
      ADD COLUMN IF NOT EXISTS recent_major_changes TEXT[],
      ADD COLUMN IF NOT EXISTS clinical_pharmacology TEXT[],
      ADD COLUMN IF NOT EXISTS indications_and_usage TEXT[],
      ADD COLUMN IF NOT EXISTS warnings_and_cautions TEXT[],
      ADD COLUMN IF NOT EXISTS nonclinical_toxicology TEXT[],
      ADD COLUMN IF NOT EXISTS information_for_patients TEXT[],
      ADD COLUMN IF NOT EXISTS spl_unclassified_section TEXT[],
      ADD COLUMN IF NOT EXISTS purpose TEXT[],
      ADD COLUMN IF NOT EXISTS dosage_and_administration TEXT[],
      ADD COLUMN IF NOT EXISTS spl_product_data_elements TEXT[],
      ADD COLUMN IF NOT EXISTS dosage_forms_and_strengths TEXT[],
      ADD COLUMN IF NOT EXISTS use_in_specific_populations TEXT[],
      ADD COLUMN IF NOT EXISTS package_label_principal_display_panel TEXT[],
      ADD COLUMN IF NOT EXISTS carcinogenesis_and_mutagenesis_and_impairment_of_fertility TEXT[],
      ADD COLUMN IF NOT EXISTS contraindications TEXT[],
      ADD COLUMN IF NOT EXISTS drug_interactions TEXT[],
      ADD COLUMN IF NOT EXISTS dependence TEXT[],
      ADD COLUMN IF NOT EXISTS do_not_use TEXT[],
      ADD COLUMN IF NOT EXISTS stop_use TEXT[],
      ADD COLUMN IF NOT EXISTS warnings TEXT[],
      ADD COLUMN IF NOT EXISTS general_precautions TEXT[],
      ADD COLUMN IF NOT EXISTS product_type TEXT[],
      ADD COLUMN IF NOT EXISTS fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  `);

  await query(`
    ALTER TABLE drugs_openfda
      DROP COLUMN IF EXISTS raw_payload,
      DROP COLUMN IF EXISTS clinical_studies_table,
      DROP COLUMN IF EXISTS pharmacokinetics_table,
      DROP COLUMN IF EXISTS adverse_reactions_table,
      DROP COLUMN IF EXISTS drug_interactions_table,
      DROP COLUMN IF EXISTS clinical_pharmacology_table,
      DROP COLUMN IF EXISTS spl_unclassified_section_table,
      DROP COLUMN IF EXISTS dosage_and_administration_table,
      DROP COLUMN IF EXISTS ask_doctor_table,
      DROP COLUMN IF EXISTS boxed_warning_table
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

const ensureDrugsTable = async () => {
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
      DROP COLUMN IF EXISTS raw_payload,
      DROP COLUMN IF EXISTS clinical_studies_table,
      DROP COLUMN IF EXISTS pharmacokinetics_table,
      DROP COLUMN IF EXISTS adverse_reactions_table,
      DROP COLUMN IF EXISTS drug_interactions_table,
      DROP COLUMN IF EXISTS clinical_pharmacology_table,
      DROP COLUMN IF EXISTS spl_unclassified_section_table,
      DROP COLUMN IF EXISTS dosage_and_administration_table,
      DROP COLUMN IF EXISTS ask_doctor_table,
      DROP COLUMN IF EXISTS boxed_warning_table
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

const run = async () => {
  try {
    await ensureDrugsOpenFdaTable();
    await ensureDrugsTable();
    console.log("Database migration complete.");
  } finally {
    await pool.end();
  }
};

void run();
