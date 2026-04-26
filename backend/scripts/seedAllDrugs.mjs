import pg from "pg";

const { Pool } = pg;

const API_BASE = "https://api.fda.gov/drug/label.json";
const API_LIMIT = 1000;
const FETCH_DELAY_MS = 300;
const BATCH_INSERT_SIZE = 100;
const SKIP_LIMIT = 25000;
const MAX_RECORDS = Number(process.env.MAX_RECORDS || "0");
const INCLUDE_OPENFDA_ARCHIVE = process.env.INCLUDE_OPENFDA_ARCHIVE === "true";

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "pharmalogs",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  max: 4,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function firstString(value) {
  if (Array.isArray(value)) {
    const first = value.find((entry) => typeof entry === "string" && entry.trim());
    return first ? first.trim() : null;
  }

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringArray(value) {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value
    .flatMap((entry) => (typeof entry === "string" ? [entry.trim()] : []))
    .filter(Boolean);

  return normalized.length > 0 ? normalized : null;
}

function joinedText(value) {
  const arr = stringArray(value);
  return arr ? arr.join("\n\n") : null;
}

function truncateText(value, maxLength) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function primaryName(result) {
  return (
    firstString(result?.openfda?.brand_name) ||
    firstString(result?.openfda?.generic_name) ||
    firstString(result?.substance_name) ||
    firstString(result?.active_ingredient) ||
    result?.set_id ||
    result?.id ||
    "Unknown Drug"
  );
}

function normalizeOpenFdaRow(result) {
  return {
    id: result.id,
    set_id: result.set_id ?? null,
    version: result.version ?? null,
    effective_time: result.effective_time ?? null,
    route: stringArray(result?.openfda?.route),
    brand_name: stringArray(result?.openfda?.brand_name),
    generic_name: stringArray(result?.openfda?.generic_name),
    manufacturer_name: stringArray(result?.openfda?.manufacturer_name),
    active_ingredient: stringArray(result.active_ingredient),
    inactive_ingredient: stringArray(result.inactive_ingredient),
    pregnancy: stringArray(result.pregnancy),
    overdosage: stringArray(result.overdosage),
    description: stringArray(result.description),
    how_supplied: stringArray(result.how_supplied),
    geriatric_use: stringArray(result.geriatric_use),
    pediatric_use: stringArray(result.pediatric_use),
    clinical_studies: stringArray(result.clinical_studies),
    pharmacodynamics: stringArray(result.pharmacodynamics),
    pharmacokinetics: stringArray(result.pharmacokinetics),
    adverse_reactions: stringArray(result.adverse_reactions),
    mechanism_of_action: stringArray(result.mechanism_of_action),
    recent_major_changes: stringArray(result.recent_major_changes),
    clinical_pharmacology: stringArray(result.clinical_pharmacology),
    indications_and_usage: stringArray(result.indications_and_usage),
    warnings_and_cautions: stringArray(result.warnings_and_cautions),
    nonclinical_toxicology: stringArray(result.nonclinical_toxicology),
    information_for_patients: stringArray(result.information_for_patients),
    spl_unclassified_section: stringArray(result.spl_unclassified_section),
    purpose: stringArray(result.purpose),
    dosage_and_administration: stringArray(result.dosage_and_administration),
    spl_product_data_elements: stringArray(result.spl_product_data_elements),
    dosage_forms_and_strengths: stringArray(result.dosage_forms_and_strengths),
    use_in_specific_populations: stringArray(result.use_in_specific_populations),
    package_label_principal_display_panel: stringArray(result.package_label_principal_display_panel),
    carcinogenesis_and_mutagenesis_and_impairment_of_fertility: stringArray(
      result.carcinogenesis_and_mutagenesis_and_impairment_of_fertility,
    ),
    contraindications: stringArray(result.contraindications),
    drug_interactions: stringArray(result.drug_interactions),
    dependence: stringArray(result.dependence),
    do_not_use: stringArray(result.do_not_use),
    stop_use: stringArray(result.stop_use),
    warnings: stringArray(result.warnings),
    general_precautions: stringArray(result.general_precautions),
    product_type: stringArray(result?.openfda?.product_type),
  };
}

function normalizeDrugRow(result, lastUpdated) {
  const openfdaId = result.set_id || result.id;

  return {
    openfda_id: openfdaId,
    name: truncateText(primaryName(result), 255),
    generic_name: truncateText(firstString(result?.openfda?.generic_name), 255),
    category: truncateText(firstString(result?.openfda?.product_type), 120),
    manufacturer_name: truncateText(firstString(result?.openfda?.manufacturer_name), 255),
    route: truncateText(firstString(result?.openfda?.route), 120),
    product_type: truncateText(firstString(result?.openfda?.product_type), 120),
    set_id: truncateText(result.set_id ?? null, 255),
    version: truncateText(result.version ?? null, 50),
    effective_time: truncateText(result.effective_time ?? null, 32),
    uses: stringArray(result.indications_and_usage) || stringArray(result.purpose),
    warnings: stringArray(result.warnings),
    dosage_info: joinedText(result.dosage_and_administration),
    active_ingredients: joinedText(result.active_ingredient),
    inactive_ingredients: joinedText(result.inactive_ingredient),
    pregnancy: joinedText(result.pregnancy || result.pregnancy_or_breast_feeding),
    overdosage: joinedText(result.overdosage),
    description: joinedText(result.description),
    how_supplied: joinedText(result.how_supplied),
    geriatric_use: joinedText(result.geriatric_use),
    pediatric_use: joinedText(result.pediatric_use),
    clinical_studies: joinedText(result.clinical_studies),
    pharmacodynamics: joinedText(result.pharmacodynamics),
    pharmacokinetics: joinedText(result.pharmacokinetics),
    adverse_reactions: joinedText(result.adverse_reactions),
    mechanism_of_action: joinedText(result.mechanism_of_action),
    recent_major_changes: joinedText(result.recent_major_changes),
    clinical_pharmacology: joinedText(result.clinical_pharmacology),
    indications_and_usage: joinedText(result.indications_and_usage),
    warnings_and_cautions: joinedText(result.warnings_and_cautions),
    nonclinical_toxicology: joinedText(result.nonclinical_toxicology),
    information_for_patients: joinedText(result.information_for_patients),
    spl_unclassified_section: joinedText(result.spl_unclassified_section),
    purpose: joinedText(result.purpose),
    dosage_and_administration: joinedText(result.dosage_and_administration),
    spl_product_data_elements: joinedText(result.spl_product_data_elements),
    dosage_forms_and_strengths: joinedText(result.dosage_forms_and_strengths),
    use_in_specific_populations: joinedText(result.use_in_specific_populations),
    package_label_principal_display_panel: joinedText(result.package_label_principal_display_panel),
    carcinogenesis_and_mutagenesis_and_impairment_of_fertility: joinedText(
      result.carcinogenesis_and_mutagenesis_and_impairment_of_fertility,
    ),
    drug_contraindications: joinedText(result.contraindications),
    drug_interactions: joinedText(result.drug_interactions),
    dependence: joinedText(result.dependence),
    do_not_use: joinedText(result.do_not_use),
    stop_use: joinedText(result.stop_use),
    general_precautions: joinedText(result.general_precautions),
    openfda_fetched_at: lastUpdated ? new Date(lastUpdated) : new Date(),
  };
}

async function insertBatch(client, table, columns, rows, conflictClause) {
  if (rows.length === 0) {
    return;
  }

  const values = [];
  const placeholders = rows.map((row, rowIndex) => {
    const start = rowIndex * columns.length;
    const rowPlaceholders = columns.map((_, colIndex) => `$${start + colIndex + 1}`);
    values.push(...columns.map((column) => row[column]));
    return `(${rowPlaceholders.join(", ")})`;
  });

  const sql = `
    INSERT INTO ${table} (${columns.join(", ")})
    VALUES ${placeholders.join(", ")}
    ${conflictClause}
  `;

  await client.query(sql, values);
}

async function insertRows(client, table, columns, rows, conflictClause) {
  for (let i = 0; i < rows.length; i += BATCH_INSERT_SIZE) {
    const batch = rows.slice(i, i + BATCH_INSERT_SIZE);
    await insertBatch(client, table, columns, batch, conflictClause);
  }
}

async function fetchBatch(skip) {
  return fetchPartitionBatch({ start: "18000101", end: "20991231" }, skip);
}

function formatDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function parseDate(value) {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6)) - 1;
  const day = Number(value.slice(6, 8));
  return new Date(Date.UTC(year, month, day));
}

function nextDay(value) {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return formatDate(date);
}

function previousDay(value) {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() - 1);
  return formatDate(date);
}

function midpointDate(start, end) {
  const startMs = parseDate(start).getTime();
  const endMs = parseDate(end).getTime();
  const midMs = Math.floor((startMs + endMs) / 2);
  return formatDate(new Date(midMs));
}

function rangeSearch(range) {
  return `effective_time:[${range.start} TO ${range.end}]`;
}

async function fetchJson(params) {
  const response = await fetch(`${API_BASE}?${params.toString()}`, {
    headers: {
      "user-agent": "pharmalogs-drug-seeder/1.0",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`openFDA request failed (${response.status}): ${body.slice(0, 500)}`);
  }

  return response.json();
}

async function fetchPartitionCount(range) {
  const params = new URLSearchParams({
    limit: "1",
    search: rangeSearch(range),
  });

  if (process.env.OPENFDA_API_KEY) {
    params.set("api_key", process.env.OPENFDA_API_KEY);
  }

  try {
    const payload = await fetchJson(params);
    return Number(payload?.meta?.results?.total || 0);
  } catch (error) {
    if (String(error?.message || "").includes("No matches found")) {
      return 0;
    }
    throw error;
  }
}

async function fetchPartitionBatch(range, skip) {
  const params = new URLSearchParams({
    limit: String(API_LIMIT),
    skip: String(skip),
    search: rangeSearch(range),
  });

  if (process.env.OPENFDA_API_KEY) {
    params.set("api_key", process.env.OPENFDA_API_KEY);
  }

  return fetchJson(params);
}

async function buildPartitions(range) {
  const total = await fetchPartitionCount(range);
  if (total === 0) {
    return [];
  }

  if (total <= SKIP_LIMIT || range.start >= range.end) {
    return [{ ...range, total }];
  }

  const midpoint = midpointDate(range.start, range.end);
  const leftEnd = midpoint;
  const rightStart = nextDay(midpoint);

  if (rightStart > range.end) {
    return [{ ...range, total }];
  }

  const left = await buildPartitions({ start: range.start, end: leftEnd });
  const right = await buildPartitions({ start: rightStart, end: range.end });
  return [...left, ...right];
}

async function main() {
  const client = await pool.connect();

  try {
    console.log("Starting openFDA drug import...");

    let imported = 0;
    let lastUpdated = null;
    const partitions = await buildPartitions({ start: "18000101", end: "20991231" });
    const total = partitions.reduce((sum, part) => sum + part.total, 0);

    console.log(
      `Using ${partitions.length} date partition(s) to cover ${total} openFDA label records...`,
    );

    const openFdaColumns = [
      "id",
      "set_id",
      "version",
      "effective_time",
      "route",
      "brand_name",
      "generic_name",
      "manufacturer_name",
      "active_ingredient",
      "inactive_ingredient",
      "pregnancy",
      "overdosage",
      "description",
      "how_supplied",
      "geriatric_use",
      "pediatric_use",
      "clinical_studies",
      "pharmacodynamics",
      "pharmacokinetics",
      "adverse_reactions",
      "mechanism_of_action",
      "recent_major_changes",
      "clinical_pharmacology",
      "indications_and_usage",
      "warnings_and_cautions",
      "nonclinical_toxicology",
      "information_for_patients",
      "spl_unclassified_section",
      "purpose",
      "dosage_and_administration",
      "spl_product_data_elements",
      "dosage_forms_and_strengths",
      "use_in_specific_populations",
      "package_label_principal_display_panel",
      "carcinogenesis_and_mutagenesis_and_impairment_of_fertility",
      "contraindications",
      "drug_interactions",
      "dependence",
      "do_not_use",
      "stop_use",
      "warnings",
      "general_precautions",
      "product_type",
    ];

    const drugColumns = [
      "openfda_id",
      "name",
      "generic_name",
      "category",
      "manufacturer_name",
      "route",
      "product_type",
      "set_id",
      "version",
      "effective_time",
      "warnings",
      "active_ingredients",
      "pregnancy",
      "description",
      "geriatric_use",
      "pediatric_use",
      "adverse_reactions",
      "indications_and_usage",
      "dosage_and_administration",
      "drug_contraindications",
      "drug_interactions",
      "openfda_fetched_at",
    ];

    for (const partition of partitions) {
      let skip = 0;

      while (skip < partition.total && (!MAX_RECORDS || imported < MAX_RECORDS)) {
        const payload = await fetchPartitionBatch(partition, skip);
        const results = Array.isArray(payload.results) ? payload.results : [];

        if (results.length === 0) {
          break;
        }

        lastUpdated = payload?.meta?.last_updated || lastUpdated;

        const limitPharmaLogsults = MAX_RECORDS
          ? results.slice(0, Math.max(0, MAX_RECORDS - imported))
          : results;

        const drugRows = limitPharmaLogsults
          .filter((result) => result?.id || result?.set_id)
          .map((result) => normalizeDrugRow(result, lastUpdated));

        await client.query("BEGIN");
        try {
          if (INCLUDE_OPENFDA_ARCHIVE) {
            const openFdaRows = limitPharmaLogsults
              .filter((result) => result?.id)
              .map(normalizeOpenFdaRow);

            await insertRows(
              client,
              "drugs_openfda",
              openFdaColumns,
              openFdaRows,
              `ON CONFLICT (id) DO UPDATE SET
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
            product_type = EXCLUDED.product_type`,
            );
          }

          await insertRows(
            client,
            "drugs",
            drugColumns,
            drugRows,
            `ON CONFLICT (openfda_id) DO UPDATE SET
            name = EXCLUDED.name,
            generic_name = EXCLUDED.generic_name,
            category = EXCLUDED.category,
            manufacturer_name = EXCLUDED.manufacturer_name,
            route = EXCLUDED.route,
            product_type = EXCLUDED.product_type,
            set_id = EXCLUDED.set_id,
            version = EXCLUDED.version,
            effective_time = EXCLUDED.effective_time,
            warnings = EXCLUDED.warnings,
            active_ingredients = EXCLUDED.active_ingredients,
            pregnancy = EXCLUDED.pregnancy,
            description = EXCLUDED.description,
            geriatric_use = EXCLUDED.geriatric_use,
            pediatric_use = EXCLUDED.pediatric_use,
            adverse_reactions = EXCLUDED.adverse_reactions,
            indications_and_usage = EXCLUDED.indications_and_usage,
            dosage_and_administration = EXCLUDED.dosage_and_administration,
            drug_contraindications = EXCLUDED.drug_contraindications,
            drug_interactions = EXCLUDED.drug_interactions,
            openfda_fetched_at = EXCLUDED.openfda_fetched_at
          WHERE
            COALESCE(EXCLUDED.effective_time, '') >= COALESCE(drugs.effective_time, '')`,
          );

          await client.query("COMMIT");
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }

        imported += limitPharmaLogsults.length;
        skip += results.length;

        console.log(
          `Imported ${imported}/${MAX_RECORDS || total} label records... (range ${partition.start}-${partition.end})`,
        );

        if (skip < partition.total && (!MAX_RECORDS || imported < MAX_RECORDS)) {
          await sleep(FETCH_DELAY_MS);
        }
      }
    }

    const counts = await client.query(
      "SELECT (SELECT COUNT(*) FROM drugs) AS drugs_count, (SELECT COUNT(*) FROM drugs_openfda) AS openfda_count",
    );

    console.log("Import complete.", counts.rows[0]);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Drug import failed:", error);
  process.exit(1);
});
