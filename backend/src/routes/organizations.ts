import { Router, Request, Response } from "express";
import { query } from "../db/index.js";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.js";

const router = Router();
const OPENALEX_API = "https://api.openalex.org/institutions";

interface DirectoryOrganization {
  externalId: string;
  name: string;
  countryCode: string | null;
  directoryType: string | null;
  homepageUrl: string | null;
  source: string;
}

function truncate(value: string | null | undefined, maxLength: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function mapOpenAlexInstitution(result: Record<string, unknown>): DirectoryOrganization | null {
  const id = typeof result.id === "string" ? result.id : null;
  const displayName = typeof result.display_name === "string" ? result.display_name : null;

  if (!id || !displayName) {
    return null;
  }

  return {
    externalId: id,
    name: truncate(displayName, 255) ?? displayName,
    countryCode:
      typeof result.country_code === "string" ? truncate(result.country_code.toUpperCase(), 2) : null,
    directoryType: typeof result.type === "string" ? truncate(result.type, 64) : null,
    homepageUrl: typeof result.homepage_url === "string" ? truncate(result.homepage_url, 255) : null,
    source: "openalex",
  };
}

async function upsertDirectoryOrganizations(orgs: DirectoryOrganization[]) {
  if (orgs.length === 0) {
    return;
  }

  const values: unknown[] = [];
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

  await query(
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

async function fetchOpenAlexOrganizations(searchTerm: string, limit: number) {
  const params = new URLSearchParams({
    search: searchTerm,
    per_page: String(Math.min(limit, 25)),
  });

  const response = await fetch(`${OPENALEX_API}?${params.toString()}`, {
    headers: {
      "user-agent": "pharmalogs-organization-autocomplete/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`OpenAlex organization search failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { results?: Record<string, unknown>[] };
  const mapped = (payload.results ?? [])
    .map(mapOpenAlexInstitution)
    .filter((org): org is DirectoryOrganization => !!org);

  await upsertDirectoryOrganizations(mapped);
  return mapped;
}

router.get("/me", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: "Unauthorized" } });
      return;
    }

    const organizationResult = await query(
      `SELECT DISTINCT
         o.id,
         o.name,
         o.type,
         o.address,
         o.city,
         o.state,
         o.zip_code,
         o.phone,
         o.website,
         o.email,
         o.is_verified,
         o.created_at,
         COALESCE(om.member_role, 'staff') AS current_user_member_role,
         COALESCE(om.status, 'active') AS current_user_member_status
       FROM organizations o
       LEFT JOIN organization_members om
         ON om.organization_id = o.id
        AND om.user_id = $1
       LEFT JOIN users u
         ON u.id = $1
       WHERE o.id = u.organization_id
          OR om.user_id = $1
       ORDER BY o.created_at DESC
       LIMIT 1`,
      [req.user.sub],
    );

    if (organizationResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "No organization is linked to this account" },
      });
      return;
    }

    const organization = organizationResult.rows[0];
    const membersResult = await query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.role,
         om.member_role,
         om.status,
         om.joined_at,
         om.created_at
       FROM organization_members om
       JOIN users u ON u.id = om.user_id
       WHERE om.organization_id = $1
       ORDER BY
         CASE om.status WHEN 'active' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
         u.name ASC`,
      [organization.id],
    );

    res.status(200).json({
      success: true,
      data: {
        organization,
        members: membersResult.rows,
      },
    });
  } catch (error) {
    console.error("Fetch current organization error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Failed to fetch organization" },
    });
  }
});

router.get("/autocomplete", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(Math.max(parseInt(String(req.query.limit), 10) || 10, 1), 25);

    if (q.length < 2) {
      res.status(200).json({ success: true, data: { organizations: [] } });
      return;
    }

    const exactPrefix = `${q}%`;
    const fuzzy = `%${q}%`;

    const localResult = await query(
      `SELECT
         external_id AS "externalId",
         name,
         country_code AS "countryCode",
         directory_type AS "directoryType",
         homepage_url AS "homepageUrl",
         source
       FROM organization_directory
       WHERE name ILIKE $1
       ORDER BY
         CASE WHEN name ILIKE $2 THEN 0 ELSE 1 END,
         similarity(name, $3) DESC,
         name ASC
       LIMIT $4`,
      [fuzzy, exactPrefix, q, limit],
    );

    let organizations = localResult.rows;

    if (organizations.length < limit && q.length >= 3) {
      try {
        const remoteOrganizations = await fetchOpenAlexOrganizations(q, limit);
        const merged = new Map<string, (typeof organizations)[number]>();

        for (const org of organizations) {
          merged.set(String(org.externalId), org);
        }

        for (const org of remoteOrganizations) {
          merged.set(org.externalId, {
            externalId: org.externalId,
            name: org.name,
            countryCode: org.countryCode,
            directoryType: org.directoryType,
            homepageUrl: org.homepageUrl,
            source: org.source,
          });
        }

        organizations = Array.from(merged.values())
          .sort((a, b) => a.name.localeCompare(b.name))
          .slice(0, limit);
      } catch (remoteError) {
        console.error("Organization remote autocomplete fallback error:", remoteError);
      }
    }

    res.status(200).json({
      success: true,
      data: { organizations },
    });
  } catch (error) {
    console.error("Organization autocomplete error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Failed to fetch organization suggestions" },
    });
  }
});

export default router;
