import dotenv from "dotenv";
import pool, { query } from "../db/index.js";

dotenv.config();

const dbHost = process.env.DB_HOST || "localhost";
const dbPort = process.env.DB_PORT || "5433";
const maxRetries = Number(process.env.DB_MIGRATE_RETRIES ?? 20);
const retryDelayMs = Number(process.env.DB_MIGRATE_RETRY_DELAY_MS ?? 2000);

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const waitForDatabase = async () => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await query("SELECT 1");
      if (attempt > 1) {
        console.log(`Database connection established on attempt ${attempt}.`);
      }
      return;
    } catch (error) {
      lastError = error;
      console.log(
        `Waiting for database at ${dbHost}:${dbPort} (attempt ${attempt}/${maxRetries})...`,
      );
      await sleep(retryDelayMs);
    }
  }

  throw lastError;
};

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

const ensurePatientsTable = async () => {
  await query(`
    ALTER TABLE patients
      ADD COLUMN IF NOT EXISTS gender VARCHAR(50)
  `);

  await query(`
    ALTER TABLE patients
      DROP COLUMN IF EXISTS contact
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS doctors (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      specialty VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    ALTER TABLE patient_medications
      ADD COLUMN IF NOT EXISTS prescription_id UUID
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS patient_visits (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
      visit_date DATE NOT NULL,
      reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS lab_results (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      test_name VARCHAR(255) NOT NULL,
      result TEXT,
      result_date DATE NOT NULL,
      uploaded_file_name TEXT,
      uploaded_file_mime_type TEXT,
      uploaded_file_content TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    ALTER TABLE lab_results
      ADD COLUMN IF NOT EXISTS uploaded_file_name TEXT,
      ADD COLUMN IF NOT EXISTS uploaded_file_mime_type TEXT,
      ADD COLUMN IF NOT EXISTS uploaded_file_content TEXT
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS patient_diagnoses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      diagnosis_name VARCHAR(255) NOT NULL,
      diagnosis_date DATE NOT NULL,
      uploaded_file_name TEXT,
      uploaded_file_mime_type TEXT,
      uploaded_file_content TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    ALTER TABLE patient_diagnoses
      ADD COLUMN IF NOT EXISTS uploaded_file_name TEXT,
      ADD COLUMN IF NOT EXISTS uploaded_file_mime_type TEXT,
      ADD COLUMN IF NOT EXISTS uploaded_file_content TEXT
  `);

  const drugIdColumnResult = await query(
    `SELECT data_type, udt_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'drugs'
       AND column_name = 'id'
     LIMIT 1`,
  );

  const drugIdColumn = drugIdColumnResult.rows[0] as
    | { data_type: string; udt_name: string }
    | undefined;
  const drugIdType =
    drugIdColumn?.data_type === "bigint"
      ? "BIGINT"
      : drugIdColumn?.data_type === "integer"
        ? "INTEGER"
        : drugIdColumn?.udt_name === "uuid"
          ? "UUID"
          : "TEXT";

  await query(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
      drug_id ${drugIdType} REFERENCES drugs(id) ON DELETE SET NULL,
      medication VARCHAR(255),
      medications TEXT[] DEFAULT '{}',
      prescription_date DATE,
      instructions TEXT,
      approval_status VARCHAR(20) NOT NULL DEFAULT 'draft',
      approved_at TIMESTAMP WITH TIME ZONE,
      uploaded_file_name TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    ALTER TABLE prescriptions
      ADD COLUMN IF NOT EXISTS medications TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS prescription_date DATE,
      ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'draft',
      ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS uploaded_file_name TEXT
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS prescription_medications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
      drug_id ${drugIdType} REFERENCES drugs(id) ON DELETE SET NULL,
      medication_name VARCHAR(255) NOT NULL,
      dosage_level VARCHAR(20),
      dosage_amount TEXT,
      start_date DATE,
      end_date DATE,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    ALTER TABLE prescription_medications
      ADD COLUMN IF NOT EXISTS dosage_level VARCHAR(20),
      ADD COLUMN IF NOT EXISTS dosage_amount TEXT,
      ADD COLUMN IF NOT EXISTS start_date DATE,
      ADD COLUMN IF NOT EXISTS end_date DATE,
      ADD COLUMN IF NOT EXISTS notes TEXT
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS patient_allergies (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      allergy_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const run = async () => {
  try {
    await waitForDatabase();
    await ensureDrugsOpenFdaTable();
    await ensureDrugsTable();
    await ensurePatientsTable();
    console.log("Database migration complete.");
  } finally {
    await pool.end();
  }
};

void run();
