import pg from "pg";

const { Pool } = pg;

const TARGET_COUNT = Number(process.env.ORGANIZATION_SEED_TARGET || "12000");
const OPENALEX_URL = "https://api.openalex.org/institutions";
const PAGE_SIZE = 200;

const MANUAL_ORGANIZATIONS = [
  {
    externalId: "manual:umass-memorial-health",
    name: "UMass Memorial Health",
    countryCode: "US",
    directoryType: "healthcare",
    homepageUrl: "https://www.ummhealth.org/",
    source: "manual",
  },
];

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "medirisk",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  max: 4,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

function truncate(value, maxLength) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function mapInstitution(item) {
  if (!item?.id || !item?.display_name) {
    return null;
  }

  return {
    externalId: item.id,
    name: truncate(item.display_name, 255),
    countryCode: truncate(item.country_code?.toUpperCase?.() ?? null, 2),
    directoryType: truncate(item.type ?? null, 64),
    homepageUrl: truncate(item.homepage_url ?? null, 255),
    source: "openalex",
  };
}

async function upsertOrganizations(client, orgs) {
  if (orgs.length === 0) {
    return;
  }

  const values = [];
  const placeholders = orgs.map((org, index) => {
    const offset = index * 6;
    values.push(
      org.externalId,
      org.name,
      org.countryCode,
      org.directoryType,
      org.homepageUrl,
      org.source,
    );

    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
  });

  await client.query(
    `INSERT INTO organization_directory (
       external_id,
       name,
       country_code,
       directory_type,
       homepage_url,
       source
     )
     VALUES ${placeholders.join(", ")}
     ON CONFLICT (external_id) DO UPDATE SET
       name = EXCLUDED.name,
       country_code = EXCLUDED.country_code,
       directory_type = EXCLUDED.directory_type,
       homepage_url = EXCLUDED.homepage_url,
       source = EXCLUDED.source`,
    values,
  );
}

async function fetchPage(cursor) {
  const params = new URLSearchParams({
    per_page: String(PAGE_SIZE),
    cursor,
  });

  const response = await fetch(`${OPENALEX_URL}?${params.toString()}`, {
    headers: {
      "user-agent": "medirisk-organization-seeder/1.0",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAlex request failed (${response.status}): ${body.slice(0, 400)}`);
  }

  return response.json();
}

async function main() {
  const client = await pool.connect();

  try {
    console.log(`Seeding at least ${TARGET_COUNT} organizations into organization_directory...`);

    await upsertOrganizations(client, MANUAL_ORGANIZATIONS);

    let cursor = "*";
    let inserted = 0;

    while (inserted < TARGET_COUNT && cursor) {
      const payload = await fetchPage(cursor);
      const results = Array.isArray(payload.results) ? payload.results : [];

      if (results.length === 0) {
        break;
      }

      const mapped = results
        .map(mapInstitution)
        .filter((item) => !!item);

      await upsertOrganizations(client, mapped);
      inserted += mapped.length;

      console.log(`Seeded ${inserted}/${TARGET_COUNT} organizations...`);
      cursor = payload?.meta?.next_cursor || null;
    }

    const countResult = await client.query("SELECT COUNT(*)::int AS count FROM organization_directory");
    console.log(`Organization seed complete. Stored ${countResult.rows[0]?.count ?? 0} rows.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Organization seed failed:", error);
  process.exit(1);
});
