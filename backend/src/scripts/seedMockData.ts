import pool from '../db/index';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Starting seed process...');

  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create Users
    console.log('Seeding users...');
    await pool.query(`
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
      INSERT INTO organizations (name, type)
      VALUES ('MediRisk Memorial Hospital', 'hospital')
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
        INSERT INTO organization_members (organization_id, user_id, member_role)
        VALUES ($1, $2, 'admin')
        ON CONFLICT (organization_id, user_id) DO NOTHING;
      `, [orgId, drSmith.id]);
    }

    // 3. Create Patients
    console.log('Seeding patients...');
    if (janeDoe && drSmith) {
      const existing = await pool.query('SELECT id FROM patients WHERE user_id = $1', [janeDoe.id]);
      if (existing.rowCount === 0) {
        await pool.query(`
          INSERT INTO patients (user_id, name, date_of_birth, gender, age_group, medical_history, created_by)
          VALUES ($1, 'Jane Doe', '1985-04-12', 'Female', 'middle', ARRAY['Hypertension', 'Type 2 Diabetes'], $2)
        `, [janeDoe.id, drSmith.id]);
      }
    }

    if (johnSmith && drSmith) {
      const existing = await pool.query('SELECT id FROM patients WHERE user_id = $1', [johnSmith.id]);
      if (existing.rowCount === 0) {
        await pool.query(`
          INSERT INTO patients (user_id, name, date_of_birth, gender, age_group, medical_history, created_by)
          VALUES ($1, 'John Smith', '1970-11-20', 'Male', 'middle', ARRAY['Hyperlipidemia'], $2)
        `, [johnSmith.id, drSmith.id]);
      }
    }

    // 4. Determine Patient IDs
    const patientJane = await pool.query('SELECT id FROM patients WHERE user_id = $1', [janeDoe?.id]);
    const patientJohn = await pool.query('SELECT id FROM patients WHERE user_id = $1', [johnSmith?.id]);

    const janePatientId = patientJane.rows[0]?.id;
    const johnPatientId = patientJohn.rows[0]?.id;

    // 5. Create Drugs (If not existing, use fake IDs or just dummy medications if drugs table ignores foreign keys or has a loose structure)
    // We will insert dummy drugs just so that risk assessments can relate to them
    console.log('Seeding base drugs for assessments...');
    await pool.query(`
      INSERT INTO drugs (name, generic_name, mechanism_of_action, drug_contraindications, openfda_id)
      VALUES 
        ('Lisinopril', 'Lisinopril', 'Inhibits ACE', 'Pregnancy', 'lisinopril_123'),
        ('Metformin', 'Metformin', 'Decreases hepatic glucose production', 'Severe renal impairment', 'metformin_123'),
        ('Atorvastatin', 'Atorvastatin', 'Inhibits HMG-CoA reductase', 'Active liver disease', 'atorvastatin_123')
      ON CONFLICT (openfda_id) DO NOTHING;
    `);

    const allDrugs = await pool.query(`SELECT id, name FROM drugs WHERE name IN ('Lisinopril', 'Metformin', 'Atorvastatin')`);
    const drugIds = allDrugs.rows.map((d: any) => d.id);

    // 6. Create Risk Assessments
    console.log('Seeding risk assessments...');
    if (janePatientId && drSmith && drugIds.length > 0) {
      await pool.query(`
        INSERT INTO risk_assessments (patient_id, assessed_by, nausea_risk, fatigue_risk, kidney_risk, combo_therapy_risk, overall_risk, outcome, notes)
        VALUES ($1, $2, 40, 80, 20, 85, 'high', 'Monitored closely', 'High risk due to combination of ACE inhibitors and Biguanides in patients with hypertension history')
      `, [janePatientId, drSmith.id]);
    }

    if (johnPatientId && drSmith && drugIds.length > 0) {
      await pool.query(`
        INSERT INTO risk_assessments (patient_id, assessed_by, nausea_risk, fatigue_risk, kidney_risk, combo_therapy_risk, overall_risk, outcome, notes)
        VALUES ($1, $2, 10, 15, 5, 30, 'low', 'Standard observation', 'Standard statin therapy, low interaction risk')
      `, [johnPatientId, drSmith.id]);
    }

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Failed to seed:', error);
  } finally {
    await pool.end();
  }
}

seed();
