import pool from '../db/index';
import bcrypt from 'bcryptjs';

const firstNames = [
  'John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'James', 'Mary',
  'Robert', 'Patricia', 'William', 'Jennifer', 'Richard', 'Linda', 'Joseph', 'Barbara',
  'Thomas', 'Susan', 'Christopher', 'Jessica', 'Daniel', 'Karen', 'Matthew', 'Lisa',
  'Mark', 'Nancy', 'Donald', 'Betty', 'Steven', 'Margaret', 'Paul', 'Sandra',
  'Andrew', 'Ashley', 'Joshua', 'Kimberly', 'Kenneth', 'Donna', 'Kevin', 'Carol',
  'Brian', 'Michelle', 'George', 'Lauren', 'Edward', 'Melissa', 'Ronald', 'Deborah',
  'Anthony', 'Stephanie', 'Frank', 'Rebecca'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Peterson', 'Phillips', 'Campbell',
  'Parker', 'Evans', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales',
  'Murphy', 'Cook', 'Rogers', 'Morgan'
];

const diagnoses = [
  'Hypertension', 'Type 2 Diabetes', 'Hyperlipidemia', 'Asthma', 'COPD',
  'Major Depressive Disorder', 'Anxiety Disorder', 'Atrial Fibrillation',
  'Coronary Artery Disease', 'Heart Failure', 'Chronic Kidney Disease',
  'Osteoarthritis', 'Rheumatoid Arthritis', 'Thyroid Disorder', 'GERD',
  'Irritable Bowel Syndrome', 'Migraine', 'Sleep Apnea', 'Obesity', 'Gout'
];

const medications = [
  'Metformin', 'Lisinopril', 'Atorvastatin', 'Amlodipine', 'Metoprolol',
  'Omeprazole', 'Albuterol', 'Sertraline', 'Amoxicillin', 'Ibuprofen',
  'Levothyroxine', 'Simvastatin', 'Warfarin', 'Insulin', 'Gabapentin',
  'Fluoxetine', 'Clopidogrel', 'Furosemide', 'Acetaminophen', 'Aspirin'
];

const allergies = [
  'Penicillin', 'Sulfonamides', 'Codeine', 'NSAIDs', 'Latex',
  'Shellfish', 'Peanuts', 'Tree nuts', 'Eggs', 'Dairy',
  'Gluten', 'Soy', 'ACE Inhibitors', 'Statins', 'None'
];

interface SeedResult {
  patients: any[];
  doctors: any[];
  nurses: any[];
}

async function seed() {
  console.log('Starting 50-user seed process...');
  const startTime = Date.now();

  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create doctors and nurses
    console.log('Creating healthcare providers...');
    const doctorEmails = [
      'dr.smith@medirisk.com',
      'dr.johnson@medirisk.com',
      'dr.williams@medirisk.com'
    ];

    for (const email of doctorEmails) {
      await pool.query(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1, $2, $3, 'doctor')
         ON CONFLICT (email) DO NOTHING`,
        [email, passwordHash, email.split('@')[0].split('.').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')]
      );
    }

    const nurseEmails = [
      'nurse.joy@medirisk.com',
      'nurse.sarah@medirisk.com'
    ];

    for (const email of nurseEmails) {
      await pool.query(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1, $2, $3, 'nurse')
         ON CONFLICT (email) DO NOTHING`,
        [email, passwordHash, email.split('@')[0].split('.').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')]
      );
    }

    // 2. Create or get organization
    console.log('Setting up organization...');

    // 3. Create 50 patients with realistic data
    console.log('Creating 50 patients with medical data...');
    const patients: any[] = [];

    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const email = `patient.${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;

      const patientResult = await pool.query(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1, $2, $3, 'patient')
         ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
         RETURNING id, email, name`,
        [email, passwordHash, `${firstName} ${lastName}`]
      );

      const patientId = patientResult.rows[0].id;
      patients.push({
        id: patientId,
        email,
        name: `${firstName} ${lastName}`,
        index: i
      });

      console.log(`  [${i + 1}/50] Created ${firstName} ${lastName}`);
    }

    // 4. Get doctors
    const doctors = await pool.query(`SELECT id FROM users WHERE role = 'doctor' LIMIT 3`);
    const doctor1 = doctors.rows[0]?.id;
    const doctor2 = doctors.rows[1]?.id;

    // 5. Add allergies to patients
    console.log('Adding allergies...');
    for (const patient of patients) {
      const allergyCount = Math.floor(Math.random() * 3) + 1;
      const selectedAllergies = allergies
        .sort(() => Math.random() - 0.5)
        .slice(0, allergyCount);

      for (const allergy of selectedAllergies) {
        await pool.query(
          `INSERT INTO allergies (patient_id, allergy_name, severity, notes)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [
            patient.id,
            allergy,
            ['mild', 'moderate', 'severe'][Math.floor(Math.random() * 3)],
            `Patient reported ${allergy} allergy`
          ]
        );
      }
    }

    // 6. Add diagnoses for patients
    console.log('Adding diagnoses...');
    for (const patient of patients) {
      const diagnosisCount = Math.floor(Math.random() * 4) + 1;
      const selectedDiagnoses = diagnoses
        .sort(() => Math.random() - 0.5)
        .slice(0, diagnosisCount);

      for (const diagnosis of selectedDiagnoses) {
        const diagnosisDate = new Date();
        diagnosisDate.setDate(diagnosisDate.getDate() - Math.floor(Math.random() * 730)); // 0-2 years ago

        await pool.query(
          `INSERT INTO diagnoses (patient_id, diagnosis_name, date_diagnosed, notes, created_by)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [
            patient.id,
            diagnosis,
            diagnosisDate.toISOString(),
            `Patient diagnosed with ${diagnosis}. Ongoing treatment.`,
            doctor1
          ]
        );
      }
    }

    // 7. Add visits to patients
    console.log('Adding visit summaries...');
    for (const patient of patients) {
      const visitCount = Math.floor(Math.random() * 5) + 2; // 2-6 visits

      for (let v = 0; v < visitCount; v++) {
        const visitDate = new Date();
        visitDate.setDate(visitDate.getDate() - Math.floor(Math.random() * 180)); // 0-6 months ago

        const symptoms = ['chest pain', 'shortness of breath', 'fatigue', 'dizziness', 'headache', 'fever'];
        const selectedSymptoms = symptoms
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.floor(Math.random() * 3) + 1);

        await pool.query(
          `INSERT INTO visits (patient_id, visit_date, chief_complaint, findings, assessment, plan, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT DO NOTHING`,
          [
            patient.id,
            visitDate.toISOString(),
            selectedSymptoms.join(', '),
            'Patient vitals stable. Physical exam unremarkable.',
            'Continue current treatment plan',
            'Follow-up in 4 weeks. Continue medications as prescribed.',
            doctor1 || doctor2
          ]
        );
      }
    }

    // 8. Add prescriptions to patients
    console.log('Adding prescriptions...');
    for (const patient of patients) {
      const medCount = Math.floor(Math.random() * 4) + 1; // 1-4 medications

      const selectedMeds = medications
        .sort(() => Math.random() - 0.5)
        .slice(0, medCount);

      for (const med of selectedMeds) {
        const prescriptionDate = new Date();
        prescriptionDate.setDate(prescriptionDate.getDate() - Math.floor(Math.random() * 90));

        await pool.query(
          `INSERT INTO prescriptions (patient_id, medication_name, dosage, frequency, start_date, notes, prescribed_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT DO NOTHING`,
          [
            patient.id,
            med,
            ['10mg', '20mg', '50mg', '100mg', '500mg', '1000mg'][Math.floor(Math.random() * 6)],
            ['Once daily', 'Twice daily', 'Three times daily', 'As needed'][Math.floor(Math.random() * 4)],
            prescriptionDate.toISOString(),
            `Prescribed for ongoing treatment. Patient tolerating well.`,
            doctor1 || doctor2
          ]
        );
      }
    }

    // 9. Add lab results
    console.log('Adding lab results...');
    for (const patient of patients) {
      const labTests = [
        { name: 'Blood Glucose', value: Math.floor(Math.random() * 100) + 70, unit: 'mg/dL', range: '70-100' },
        { name: 'Total Cholesterol', value: Math.floor(Math.random() * 100) + 150, unit: 'mg/dL', range: '<200' },
        { name: 'HDL', value: Math.floor(Math.random() * 30) + 40, unit: 'mg/dL', range: '>40' },
        { name: 'LDL', value: Math.floor(Math.random() * 80) + 50, unit: 'mg/dL', range: '<100' },
        { name: 'Triglycerides', value: Math.floor(Math.random() * 150) + 50, unit: 'mg/dL', range: '<150' },
        { name: 'Hemoglobin A1C', value: Math.floor(Math.random() * 3) + 5, unit: '%', range: '<5.7' }
      ];

      const selectedTests = labTests.sort(() => Math.random() - 0.5).slice(0, 3);

      for (const test of selectedTests) {
        const labDate = new Date();
        labDate.setDate(labDate.getDate() - Math.floor(Math.random() * 60));

        await pool.query(
          `INSERT INTO lab_results (patient_id, test_name, result_value, unit, reference_range, test_date, notes, ordered_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`,
          [
            patient.id,
            test.name,
            test.value.toString(),
            test.unit,
            test.range,
            labDate.toISOString(),
            `${test.name} result. Within normal limits.`,
            doctor1 || doctor2
          ]
        );
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n✅ Seeding complete in ${(duration / 1000).toFixed(2)}s`);
    console.log(`   - 50 patient accounts created`);
    console.log(`   - 3 doctor accounts created`);
    console.log(`   - 2 nurse accounts created`);
    console.log(`   - Diagnoses: ~200 records`);
    console.log(`   - Visits: ~150 records`);
    console.log(`   - Prescriptions: ~200 records`);
    console.log(`   - Lab results: ~150 records`);
    console.log(`   - Allergies: ~75 records`);
    console.log(`\n🔐 All passwords: password123`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
