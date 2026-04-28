import { Router } from "express";
import { query } from "../db/index.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();
const organizationScopedRoles = new Set(["provider", "doctor", "nurse", "org_admin"]);

function getOrganizationScopeSql(userRole: string, organizationColumn: string) {
  if (userRole === "admin") {
    return "TRUE";
  }

  return `${organizationColumn} IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = $1 AND status = 'active'
      UNION
      SELECT organization_id
      FROM users
      WHERE id = $1 AND organization_id IS NOT NULL
    )`;
}

router.get("/dashboard", authMiddleware, async (req: AuthenticatedRequest, res: any, next) => {
  try {
    const user = req.user;
    if (!user?.sub) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (user.role === "patient") {
      res.status(403).json({
        success: false,
        error: { message: "Patient accounts do not have provider dashboard access" },
      });
      return;
    }

    const isOrganizationScoped = organizationScopedRoles.has(user.role);
    const patientScopeSql = isOrganizationScoped
      ? `po.organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = $1 AND status = 'active'
          UNION
          SELECT organization_id
          FROM users
          WHERE id = $1 AND organization_id IS NOT NULL
        )`
      : "TRUE";
    const organizationScopeSql = getOrganizationScopeSql(user.role, "par.organization_id");
    const scopeParams = isOrganizationScoped ? [user.sub] : [];

    const overviewResult = await query(
      `
        WITH accessible_patients AS (
          SELECT DISTINCT p.id
          FROM patients p
          LEFT JOIN patient_organizations po ON po.patient_id = p.id
          WHERE ${patientScopeSql}
        )
        SELECT
          (SELECT COUNT(*)::int FROM accessible_patients) AS total_patients,
          (
            SELECT COUNT(*)::int
            FROM patient_medications pm
            JOIN accessible_patients ap ON ap.id = pm.patient_id
            WHERE pm.end_date IS NULL OR pm.end_date >= CURRENT_DATE
          ) AS active_medications,
          (
            SELECT COUNT(*)::int
            FROM patient_documents pd
            JOIN accessible_patients ap ON ap.id = pd.patient_id
          ) AS stored_documents,
          (
            SELECT COUNT(*)::int
            FROM patient_access_requests par
            WHERE par.status = 'pending' AND ${organizationScopeSql}
          ) AS pending_access_requests
      `,
      scopeParams,
    );

    const recentPatientsResult = await query(
      `
        WITH accessible_patients AS (
          SELECT DISTINCT p.id, p.name, p.date_of_birth, p.created_at
          FROM patients p
          LEFT JOIN patient_organizations po ON po.patient_id = p.id
          WHERE ${patientScopeSql}
        )
        SELECT
          ap.id,
          ap.name,
          ap.date_of_birth,
          ap.created_at,
          COALESCE(latest_risk.overall_risk::text, 'unknown') AS risk_level,
          latest_risk.assessment_date AS last_assessment,
          COALESCE(med_counts.medication_count, 0)::int AS medications
        FROM accessible_patients ap
        LEFT JOIN LATERAL (
          SELECT ra.overall_risk, ra.assessment_date
          FROM risk_assessments ra
          WHERE ra.patient_id = ap.id
          ORDER BY ra.assessment_date DESC
          LIMIT 1
        ) latest_risk ON TRUE
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS medication_count
          FROM patient_medications pm
          WHERE pm.patient_id = ap.id
            AND (pm.end_date IS NULL OR pm.end_date >= CURRENT_DATE)
        ) med_counts ON TRUE
        ORDER BY COALESCE(latest_risk.assessment_date, ap.created_at) DESC, ap.created_at DESC
        LIMIT 12
      `,
      scopeParams,
    );

    const riskDistributionResult = await query(
      `
        WITH accessible_patients AS (
          SELECT DISTINCT p.id
          FROM patients p
          LEFT JOIN patient_organizations po ON po.patient_id = p.id
          WHERE ${patientScopeSql}
        ),
        latest_risk AS (
          SELECT DISTINCT ON (ra.patient_id)
            ra.patient_id,
            ra.overall_risk
          FROM risk_assessments ra
          JOIN accessible_patients ap ON ap.id = ra.patient_id
          WHERE ra.overall_risk IS NOT NULL
          ORDER BY ra.patient_id, ra.assessment_date DESC
        )
        SELECT
          CONCAT(INITCAP(latest_risk.overall_risk::text), ' Risk') AS name,
          COUNT(*)::int AS value
        FROM latest_risk
        GROUP BY latest_risk.overall_risk
        ORDER BY CASE latest_risk.overall_risk
          WHEN 'low' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'high' THEN 3
          ELSE 4
        END
      `,
      scopeParams,
    );

    const medicationCategoriesResult = await query(
      `
        WITH accessible_patients AS (
          SELECT DISTINCT p.id
          FROM patients p
          LEFT JOIN patient_organizations po ON po.patient_id = p.id
          WHERE ${patientScopeSql}
        )
        SELECT
          COALESCE(NULLIF(d.category, ''), 'Uncategorized') AS name,
          COUNT(*)::int AS value
        FROM patient_medications pm
        JOIN accessible_patients ap ON ap.id = pm.patient_id
        LEFT JOIN drugs d ON d.id = pm.drug_id
        GROUP BY COALESCE(NULLIF(d.category, ''), 'Uncategorized')
        ORDER BY COUNT(*) DESC, name ASC
        LIMIT 5
      `,
      scopeParams,
    );

    const pendingRequestsResult = await query(
      `
        SELECT
          par.id,
          p.name AS patient_name,
          COALESCE(requester.name, requester.email) AS requested_by_name,
          org.name AS organization_name,
          par.created_at
        FROM patient_access_requests par
        JOIN patients p ON p.id = par.patient_id
        JOIN organizations org ON org.id = par.organization_id
        JOIN users requester ON requester.id = par.requested_by
        WHERE par.status = 'pending'
          AND ${organizationScopeSql}
        ORDER BY par.created_at DESC
        LIMIT 5
      `,
      scopeParams,
    );

    res.status(200).json({
      status: "success",
      data: {
        overview: {
          totalPatients: overviewResult.rows[0]?.total_patients ?? 0,
          activeMedications: overviewResult.rows[0]?.active_medications ?? 0,
          storedDocuments: overviewResult.rows[0]?.stored_documents ?? 0,
          pendingAccessRequests: overviewResult.rows[0]?.pending_access_requests ?? 0,
        },
        recentPatients: recentPatientsResult.rows,
        riskDistribution: riskDistributionResult.rows,
        medicationCategories: medicationCategoriesResult.rows,
        pendingRequests: pendingRequestsResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", authMiddleware, async (req: AuthenticatedRequest, res: any, next) => {
  try {
    const user = req.user;
    if (!user || !user.sub) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (user.role === "patient") {
      res.status(403).json({
        success: false,
        error: { message: "Patient accounts do not have analytics access" },
      });
      return;
    }

    const isOrganizationScoped = organizationScopedRoles.has(user.role);
    const patientScopeSql = isOrganizationScoped
      ? `po.organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = $1 AND status = 'active'
          UNION
          SELECT organization_id
          FROM users
          WHERE id = $1 AND organization_id IS NOT NULL
        )`
      : "TRUE";
    const scopeParams = isOrganizationScoped ? [user.sub] : [];

    const activePatientsRes = await query(
      `
        WITH accessible_patients AS (
          SELECT DISTINCT p.id
          FROM patients p
          LEFT JOIN patient_organizations po ON po.patient_id = p.id
          WHERE ${patientScopeSql}
        )
        SELECT COUNT(*)::int AS count
        FROM accessible_patients
      `,
      scopeParams,
    );

    const assessmentTrendRes = await query(
      `
        WITH accessible_patients AS (
          SELECT DISTINCT p.id
          FROM patients p
          LEFT JOIN patient_organizations po ON po.patient_id = p.id
          WHERE ${patientScopeSql}
        )
        SELECT
          DATE_TRUNC('month', ra.assessment_date)::date AS month_start,
          ra.overall_risk::text AS risk,
          COUNT(*)::int AS count
        FROM risk_assessments ra
        JOIN accessible_patients ap ON ap.id = ra.patient_id
        WHERE ra.overall_risk IS NOT NULL
          AND ra.assessment_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY DATE_TRUNC('month', ra.assessment_date)::date, ra.overall_risk
        ORDER BY month_start ASC
      `,
      scopeParams,
    );

    const sideEffectsRes = await query(
      `
        WITH accessible_patients AS (
          SELECT DISTINCT p.id
          FROM patients p
          LEFT JOIN patient_organizations po ON po.patient_id = p.id
          WHERE ${patientScopeSql}
        )
        SELECT adr.reaction AS name, COUNT(*)::int AS value
        FROM adverse_drug_reactions adr
        JOIN accessible_patients ap ON ap.id = adr.patient_id
        GROUP BY adr.reaction
        ORDER BY COUNT(*) DESC, adr.reaction ASC
        LIMIT 5
      `,
      scopeParams,
    );

    const medicationQualityRes = await query(
      `
        WITH accessible_patients AS (
          SELECT DISTINCT p.id
          FROM patients p
          LEFT JOIN patient_organizations po ON po.patient_id = p.id
          WHERE ${patientScopeSql}
        ),
        active_medications AS (
          SELECT pm.*
          FROM patient_medications pm
          JOIN accessible_patients ap ON ap.id = pm.patient_id
          WHERE pm.end_date IS NULL OR pm.end_date >= CURRENT_DATE
        )
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (
            WHERE pm.dosage_level IS NOT NULL
              AND pm.start_date IS NOT NULL
              AND COALESCE(NULLIF(pm.dosage_amount, ''), NULL) IS NOT NULL
          )::int AS complete
        FROM active_medications pm
      `,
      scopeParams,
    );

    const criticalRiskRes = await query(
      `
        WITH accessible_patients AS (
          SELECT DISTINCT p.id
          FROM patients p
          LEFT JOIN patient_organizations po ON po.patient_id = p.id
          WHERE ${patientScopeSql}
        ),
        latest_risk AS (
          SELECT DISTINCT ON (ra.patient_id)
            ra.patient_id,
            ra.overall_risk
          FROM risk_assessments ra
          JOIN accessible_patients ap ON ap.id = ra.patient_id
          WHERE ra.overall_risk IS NOT NULL
          ORDER BY ra.patient_id, ra.assessment_date DESC
        )
        SELECT COUNT(*)::int AS count
        FROM latest_risk
        WHERE overall_risk = 'high'
      `,
      scopeParams,
    );

    const dischargeTableRes = await query(
      `SELECT to_regclass('public.patient_discharge_summaries') AS table_name`,
      [],
    );
    const recentAdmissionsRes = dischargeTableRes.rows[0]?.table_name
      ? await query(
          `
            WITH accessible_patients AS (
              SELECT DISTINCT p.id
              FROM patients p
              LEFT JOIN patient_organizations po ON po.patient_id = p.id
              WHERE ${patientScopeSql}
            )
            SELECT COUNT(*)::int AS count
            FROM patient_discharge_summaries pds
            JOIN accessible_patients ap ON ap.id = pds.patient_id
            WHERE pds.admission_date >= CURRENT_DATE - INTERVAL '30 days'
          `,
          scopeParams,
        )
      : { rows: [{ count: 0 }] };

    const activePatientsCount = Number(activePatientsRes.rows[0]?.count ?? 0);

    const today = new Date();
    const populationTrend: Array<{ month: string; "Low Risk": number; "Med Risk": number; "High Risk": number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = d.toISOString().slice(0, 7);
      const month = d.toLocaleString("en-US", { month: "short" });
      const counts = { low: 0, medium: 0, high: 0 };

      for (const row of assessmentTrendRes.rows) {
        const rowMonth = new Date(row.month_start).toISOString().slice(0, 7);
        const risk = String(row.risk || "").toLowerCase();
        if (rowMonth === monthKey && risk in counts) {
          counts[risk as keyof typeof counts] = Number(row.count) || 0;
        }
      }

      populationTrend.push({
        month,
        "Low Risk": counts.low,
        "Med Risk": counts.medium,
        "High Risk": counts.high,
      });
    }

    const medicationTotal = Number(medicationQualityRes.rows[0]?.total ?? 0);
    const medicationComplete = Number(medicationQualityRes.rows[0]?.complete ?? 0);
    const avgAdherenceRate = medicationTotal > 0
      ? `${((medicationComplete / medicationTotal) * 100).toFixed(1)}%`
      : "N/A";
    
    res.status(200).json({
      status: "success",
      data: {
        populationTrend,
        sideEffectsDist: sideEffectsRes.rows,
        activePatients: activePatientsCount.toString(),
        avgAdherenceRate,
        criticalRiskAlerts: String(criticalRiskRes.rows[0]?.count ?? 0),
        predictedAdmissions: String(recentAdmissionsRes.rows[0]?.count ?? 0),
      }
    });

  } catch (error) {
    next(error);
  }
});

export default router;
