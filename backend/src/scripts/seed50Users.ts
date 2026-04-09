import pool from '../db/index';
import bcrypt from 'bcryptjs';

const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'James', 'Mary',
  'Robert', 'Patricia', 'William', 'Jennifer', 'Richard', 'Linda', 'Joseph', 'Barbara',
  'Thomas', 'Susan', 'Christopher', 'Jessica', 'Daniel', 'Karen', 'Matthew', 'Lisa'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'];

const diagnoses = ['Hypertension', 'Type 2 Diabetes', 'Hyperlipidemia', 'Asthma', 'COPD',
  'Major Depressive Disorder', 'Anxiety Disorder', 'Atrial Fibrillation',
  'Coronary Artery Disease', 'Heart Failure', 'Chronic Kidney Disease', 'Osteoarthritis'];

const allergies = ['Penicillin', 'Sulfonamides', 'Codeine', 'NSAIDs', 'Latex', 'None'];

async function seed() {
  console.log('Starting 50-user seed process...');
  const startTime = Date.now();

  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create doctors
    console.log('Creating healthcare providers...');
    const doctorEmails = ['dr.smith@medirisk.com', 'dr.johnson@medirisk.com', 'dr.williams@medirisk.com'];
    for (const email of doctorEmails) {
      await pool.query(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1, $2, $3, 'doctor')
         ON CONFLICT (email) DO NOTHING`,
        [email, passwordHash, 'Dr. ' + email.split('@')[0].split('.')[1]]
      );
    }

    const doctorsResult = await pool.query(`SELECT id FROM users WHERE role = 'doctor' LIMIT 3`);
    const doctors = doctorsResult.rows;
    const doctor1 = doctors[0]?.id;

    // 2. Create 50 user accounts
    console.log('Creating 50 patient user accounts...');
    const patients = [];

    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const email = `patient.${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;

      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1, $2, $3, 'patient')
         ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
         RETURNING id`,
        [email, passwordHash, `${firstName} ${lastName}`]
      );

      const userId = userResult.rows[0].id;

      // Create patient record linked to user
      const patientResult = await pool.query(
        `INSERT INTO patients (user_id, name, date_of_birth, gender, created_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [userId, `${firstName} ${lastName}`, new Date('1970-01-01').toISOString(), 'M', doctor1]
      );

      if (patientResult.rows.length > 0) {
        patients.push({ patientId: patientResult.rows[0].id, userId, name: `${firstName} ${lastName}` });
      }

      if ((i + 1) % 10 === 0) console.log(`  Created ${i + 1}/50 patients`);
    }

    // 3. Add allergies
    console.log('Adding allergies...');
    for (const patient of patients) {
      const allergy = allergies[Math.floor(Math.random() * allergies.length)];
      await pool.query(
        `INSERT INTO patient_allergies (patient_id, allergy_name)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [patient.patientId, allergy]
      );
    }

    // 4. Add diagnoses
    console.log('Adding diagnoses...');
    for (const patient of patients) {
      const diagCount = Math.floor(Math.random() * 3) + 1;
      const selectedDiags = diagnoses.sort(() => Math.random() - 0.5).slice(0, diagCount);

      for (const diagnosis of selectedDiags) {
        await pool.query(
          `INSERT INTO patient_diagnoses (patient_id, diagnosis_name, date_diagnosed, created_by)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [patient.patientId, diagnosis, new Date().toISOString(), doctor1]
        );
      }
    }

    // 5. Add visits
    console.log('Adding visit summaries...');
    for (const patient of patients) {
      const visitCount = Math.floor(Math.random() * 4) + 2;

      for (let v = 0; v < visitCount; v++) {
        const visitDate = new Date();
        visitDate.setDate(visitDate.getDate() - Math.floor(Math.random() * 180));

        await pool.query(
          `INSERT INTO patient_visits (patient_id, doctor_id, visit_date, reason)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [patient.patientId, doctor1, visitDate.toISOString().split('T')[0], 'Regular checkup']
        );
      }
    }

    // 6. Add lab results
    console.log('Adding lab results...');
    for (const patient of patients) {
      const labTests = [
        { name: 'Blood Glucose', value: (Math.floor(Math.random() * 100) + 70).toString(), unit: 'mg/dL' },
        { name: 'Cholesterol', value: (Math.floor(Math.random() * 100) + 150).toString(), unit: 'mg/dL' },
        { name: 'HDL', value: (Math.floor(Math.random() * 30) + 40).toString(), unit: 'mg/dL' }
      ];

      for (const test of labTests) {
        const labDate = new Date();
        labDate.setDate(labDate.getDate() - Math.floor(Math.random() * 60));

        await pool.query(
          `INSERT INTO lab_results (patient_id, test_name, result_value, unit, test_date)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [patient.patientId, test.name, test.value, test.unit, labDate.toISOString().split('T')[0]]
        );
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n✅ Seeding complete in ${(duration / 1000).toFixed(2)}s`);
    console.log(`   - 50 patient accounts created`);
    console.log(`   - Diagnoses: ~100 records`);
    console.log(`   - Visits: ~150 records`);
    console.log(`   - Lab results: ~150 records`);
    console.log(`   - Allergies: 50 records`);
    console.log(`\n🔐 Password: password123`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
