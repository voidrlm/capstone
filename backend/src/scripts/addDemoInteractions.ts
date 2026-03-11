import pool, { query } from "../db/index.js";

async function addDemoPair(drug1Name: string, drug2Name: string, description: string, recommendation: string) {
    const res = await query(`
    INSERT INTO drug_interactions (drug_id_1, drug_id_2, severity, description, recommendation)
    SELECT d1.id, d2.id, 'high', $1, $2
    FROM drugs d1
    JOIN drugs d2 ON (d1.name ILIKE $3 AND d2.name ILIKE $4)
    ON CONFLICT (drug_id_1, drug_id_2) DO NOTHING;
  `, [description, recommendation, `%${drug1Name}%`, `%${drug2Name}%`]);

    console.log(`Matched and added interactions between ${drug1Name} and ${drug2Name}: inserted ${res.rowCount} rows.`);
}

async function run() {
    console.log("Adding demo drug interactions to the database...\n");
    try {
        // Pair 1: Sildenafil + Nitroglycerin
        await addDemoPair(
            'Sildenafil',
            'Nitroglycerin',
            'Concurrent use of Sildenafil and Nitroglycerin is strictly contraindicated. Sildenafil amplifies the vasodilatory effects of nitrates, which can result in severe, life-threatening hypotension, syncope, or myocardial ischemia.',
            'Avoid concurrent use completely. Do not administer nitrates to any patient who has taken Sildenafil within the past 24 hours.'
        );

        // Pair 2: Lisinopril + Spironolactone
        await addDemoPair(
            'Lisinopril',
            'Spironolactone',
            'Coadministration of Lisinopril (an ACE inhibitor) and Spironolactone (a potassium-sparing diuretic) significantly increases the risk of severe hyperkalemia, which can lead to life-threatening cardiac arrhythmias.',
            'Use combination with extreme caution. Frequently monitor serum potassium concentration and renal function, particularly when initiating or adjusting doses.'
        );

        console.log("\nDemo interactions successfully added!");
        console.log("You can now test these combinations in the UI:");
        console.log("1. Sildenafil + Nitroglycerin");
        console.log("2. Lisinopril + Spironolactone");

    } catch (err) {
        console.error("Error adding demo interactions:", err);
    } finally {
        await pool.end();
    }
}

void run();
