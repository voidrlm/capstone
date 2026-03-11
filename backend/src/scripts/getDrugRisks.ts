import pool, { query } from "../db/index.js";
import { analyzeInteractionsFromText } from "../services/interactionDetection.js";

async function run() {
    const targetDrug = process.argv[2] || "metformin";

    try {
        console.log(`Looking up ${targetDrug}...`);
        const drugRes = await query(`
      SELECT id, name FROM drugs 
      WHERE name ILIKE $1 OR generic_name ILIKE $1
      LIMIT 1
    `, [`%${targetDrug}%`]);

        if (drugRes.rows.length === 0) {
            console.log(`${targetDrug} not found in the database.`);
            return;
        }

        const drugId = drugRes.rows[0].id;
        const drugName = drugRes.rows[0].name;
        console.log(`\nFound: ${drugName} (${drugId})`);

        console.log("\n=== STORED INTERACTIONS ===");
        const interactionsQuery = `
      SELECT 
        d1.name as drug1, 
        d2.name as drug2, 
        di.severity, 
        di.description
      FROM drug_interactions di
      JOIN drugs d1 ON d1.id = di.drug_id_1
      JOIN drugs d2 ON d2.id = di.drug_id_2
      WHERE (di.drug_id_1 = $1 OR di.drug_id_2 = $1)
      ORDER BY 
        CASE severity 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
          ELSE 4 
        END
      LIMIT 10
    `;

        const stored = await query(interactionsQuery, [drugId]);
        if (stored.rows.length > 0) {
            stored.rows.forEach(row => {
                const otherDrug = row.drug1 === drugName ? row.drug2 : row.drug1;
                console.log(`- ${otherDrug} [${row.severity}]: ${row.description.substring(0, 150)}...`);
            });
        } else {
            console.log("No pre-calculated interactions stored in DB.");

            console.log("\n=== DYNAMICALLY ANALYZING TEXT FOR INTERACTIONS (This may take a moment) ===");
            const dynamicInteractions = await analyzeInteractionsFromText(drugId);

            if (dynamicInteractions.length > 0) {
                const highRisk = dynamicInteractions.filter(i => i.severity === 'high');
                console.log(`\nFound ${dynamicInteractions.length} total interactions (${highRisk.length} high severity)`);

                console.log("\n--- High Severity Combinations to Avoid ---");
                highRisk.slice(0, 10).forEach(i => {
                    const other = i.drug1Id === drugId ? i.drug2Name : i.drug1Name;
                    console.log(`\nAvoid combining with: ${other}`);
                    console.log(`Reason: ${i.description.substring(0, 200)}...`);
                });

                if (highRisk.length === 0) {
                    console.log("\n--- Top Medium/Low Severity Combinations ---");
                    dynamicInteractions.slice(0, 5).forEach(i => {
                        const other = i.drug1Id === drugId ? i.drug2Name : i.drug1Name;
                        console.log(`\nDrug: ${other} [${i.severity}]`);
                        console.log(`Details: ${i.description.substring(0, 200)}...`);
                    });
                }
            } else {
                console.log("No dynamic interactions found from text analysis.");
            }
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

void run();
