import pool from '../db/index';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Starting seed process...');

  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create Users
    console.log('Seeding users...');
    const usersResult = await pool.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES 
        ('doctor@medirisk.com', $1, 'Dr. Smith', 'doctor'),
        ('Nurse.Joy@medirisk.com', $1, 'Nurse Joy', 'nurse'),
        ('jane.doe@example.com', $1, 'Jane Doe', 'patient'),
        ('john.smith@example.com', $1, 'John Smith', 'patient'),
        ('emily.chen@example.com', $1, 'Emily Chen', 'patient')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, role;
    `, [passwordHash]);

    // Fetch users if they already exist
    const allUsers = await pool.query('SELECT id, email, role FROM users');
    
    const drSmith = allUsers.rows.find(u => u.email === 'doctor@medirisk.com');
    const janeDoe = allUsers.rows.find(u => u.email === 'jane.doe@example.com');
    const johnSmith = allUsers.rows.find(u => u.email === 'john.smith@example.com');

    // 2. Create Organization
    console.log('Seeding organizations...');
    const orgResult = await pool.query(`
      INSERT INTO organizations (name, type, settings)
      VALUES ('MediRisk Memorial Hospital', 'hospital', '{"region": "US-East"}')
      ON CONFLICT DO NOTHING
      RETURNING id;
    `);

    let orgId;
    if (orgResult.rows.length > 0) {
      orgId = orgResult.rows[0].id;
    } else {
      const existingOrg = await pool.query('SELECT id FROM organizations LIMIT 1');
      orgId = existingOrg.rows[0].id;
    }

    if (drSmith && orgId) {
      await pool.query(`
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES ($1, $2, 'admin')
        ON CONFLICT (organization_id, user_id) DO NOTHING;
      `, [orgId, drSmith.id]);
    }

    // 3. Create Patients
    console.log('Seeding patients...');
    if (janeDoe && drSmith) {
      await pool.query(`
        INSERT INTO patients (user_id, organization_id, primary_provider_id, mrn, date_of_birth, gender, medical_history)
        VALUES ($1, $2, $3, 'MRN-10001', '1985-04-12', 'Female', '{"conditions": ["Hypertension", "Type 2 Diabetes"], "allergies": ["Penicillin"]}')
        ON CONFLICT (user_id) DO NOTHING;
      `, [janeDoe.id, orgId, drSmith.id]);
    }

    if (johnSmith && drSmith) {
      await pool.query(`
        INSERT INTO patients (user_id, organization_id, primary_provider_id, mrn, date_of_birth, gender, medical_history)
        VALUES ($1, $2, $3, 'MRN-10002', '1970-11-20', 'Male', '{"conditions": ["Hyperlipidemia"], "allergies": []}')
        ON CONFLICT (user_id) DO NOTHING;
      `, [johnSmith.id, orgId, drSmith.id]);
    }

    // 4. Determine Patient IDs
    const patientJane = await pool.query('SELECT id FROM patients WHERE user_id = $1', [janeDoe?.id]);
    const patientJohn = await pool.query('SELECT id FROM patients WHERE user_id = $1', [johnSmith?.id]);

    const janePatientId = patientJane.rows[0]?.id;
    const johnPatientId = patientJohn.rows[0]?.id;

    // 5. Create Drugs (If not existing, use fake IDs or just dummy medications if drugs table ignores foreign keys or has a loose structure)
    // We will insert dummy drugs just so that risk assessments can relate to them
    console.log('Seeding base drugs for assessments...');
    const drugsResult = await pool.query(`
      INSERT INTO drugs (name, generic_name, brand_names, drug_classes, mechanism_of_action, contraindications)
      VALUES 
        ('Lisinopril', 'Lisinopril', ARRAY['Prinivil', 'Zestril'], ARRAY['ACE Inhibitors'], 'Inhibits ACE', 'Pregnancy'),
        ('Metformin', 'Metformin', ARRAY['Glucophage'], ARRAY['Biguanides'], 'Decreases hepatic glucose production', 'Severe renal impairment'),
        ('Atorvastatin', 'Atorvastatin', ARRAY['Lipitor'], ARRAY['Statins'], 'Inhibits HMG-CoA reductase', 'Active liver disease')
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name;
    `);

    const allDrugs = await pool.query(`SELECT id, name FROM drugs WHERE name IN ('Lisinopril', 'Metformin', 'Atorvastatin')`);
    const drugIds = allDrugs.rows.map(d => d.id);

    // 6. Create Risk Assessments
    console.log('Seeding risk assessments...');
    if (janePatientId && drSmith && drugIds.length > 0) {
      await pool.query(`
        INSERT INTO risk_assessments (patient_id, provider_id, drug_ids, risk_score, risk_level, predicted_side_effects, analysis_details)
        VALUES (
          $1, $2, $3, 85, 'high',
          '{"effects": [{"name":"Dizziness","probability":0.8}, {"name":"Nausea","probability":0.4}]}',
          '{"reasoning":"High risk due to combination of ACE inhibitors and Biguanides in patients with hypertension history"}'
        )
      `, [janePatientId, drSmith.id, [drugIds[0], drugIds[1]]]);
    }

    if (johnPatientId && drSmith && drugIds.length > 0) {
      await pool.query(`
        INSERT INTO risk_assessments (patient_id, provider_id, drug_ids, risk_score, risk_level, predicted_side_effects, analysis_details)
        VALUES (
          $1, $2, $3, 30, 'low',
          '{"effects": [{"name":"Muscle ache","probability":0.1}]}',
          '{"reasoning":"Standard statin therapy, low interaction risk"}'
        )
      `, [johnPatientId, drSmith.id, [drugIds[2]]]);
    }

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Failed to seed:', error);
  } finally {
    await pool.end();
  }
}

seed();
