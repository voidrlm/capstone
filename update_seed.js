const fs = require('fs');
let content = fs.readFileSync('backend/src/scripts/seedMockData.ts', 'utf8');

const additionalData = `
    // --- ADDITIONAL DATA FOR PATIENTS (Visits, Diagnoses, Labs, Allergies, Prescriptions) ---
    console.log('Seeding detailed patient history (visits, diagnoses, labs, allergies, prescriptions)...');
    
    // Helper to get doctor ID (using Dr. Smith)
    const doctorId = drSmith?.id;
    
    if (janePatientId && doctorId) {
      // 1. Visits
      await pool.query(\`
        INSERT INTO patient_visits (patient_id, doctor_id, visit_date, reason)
        VALUES 
          ($1, $2, '2023-01-15', 'Annual physical checkup'),
          ($1, $2, '2023-06-20', 'Follow-up for hypertension management'),
          ($1, $2, '2024-02-10', 'Mild chest pain and shortness of breath')
      \`, [janePatientId, doctorId]);

      // 2. Diagnoses
      await pool.query(\`
        INSERT INTO patient_diagnoses (patient_id, diagnosis_name, diagnosis_date)
        VALUES 
          ($1, 'Essential Hypertension', '2019-03-12'),
          ($1, 'Type 2 Diabetes Mellitus', '2021-08-05')
      \`, [janePatientId]);

      // 3. Lab Results
      await pool.query(\`
        INSERT INTO lab_results (patient_id, test_name, result, result_date)
        VALUES 
          ($1, 'HbA1c', '7.2%', '2023-06-18'),
          ($1, 'Comprehensive Metabolic Panel', 'Normal, slightly elevated bun', '2023-06-18'),
          ($1, 'Lipid Panel', 'LDL 110 mg/dL', '2024-02-08')
      \`, [janePatientId]);

      // 4. Allergies
      await pool.query(\`
        INSERT INTO patient_allergies (patient_id, allergy_name)
        VALUES 
          ($1, 'Penicillin'),
          ($1, 'Peanuts')
      \`, [janePatientId]);

      // 5. Prescriptions
      const janeRx = await pool.query(\`
        INSERT INTO prescriptions (patient_id, doctor_id, prescription_date, instructions, approval_status)
        VALUES ($1, $2, '2024-02-10', 'Take as directed with food', 'approved')
        RETURNING id
      \`, [janePatientId, doctorId]);
      
      if (janeRx.rows.length > 0 && drugIds.length >= 2) {
        const rxId = janeRx.rows[0].id;
        await pool.query(\`
          INSERT INTO prescription_medications (prescription_id, drug_id, medication_name, dosage_level, dosage_amount, start_date)
          VALUES 
            ($1, $2, 'Lisinopril', 'medium', '10mg', '2024-02-10'),
            ($1, $3, 'Metformin', 'high', '1000mg', '2024-02-10')
        \`, [rxId, drugIds[0], drugIds[1]]);
      }
    }

    if (johnPatientId && doctorId) {
      // 1. Visits
      await pool.query(\`
        INSERT INTO patient_visits (patient_id, doctor_id, visit_date, reason)
        VALUES 
          ($1, $2, '2023-03-22', 'Routine checkup, cholesterol screening'),
          ($1, $2, '2023-09-05', 'High cholesterol review, start statins'),
          ($1, $2, '2024-03-01', '6-month follow-up for statin therapy')
      \`, [johnPatientId, doctorId]);

      // 2. Diagnoses
      await pool.query(\`
        INSERT INTO patient_diagnoses (patient_id, diagnosis_name, diagnosis_date)
        VALUES 
          ($1, 'Hyperlipidemia', '2023-03-24')
      \`, [johnPatientId]);

      // 3. Lab Results
      await pool.query(\`
        INSERT INTO lab_results (patient_id, test_name, result, result_date)
        VALUES 
          ($1, 'Lipid Panel', 'LDL 160 mg/dL, HDL 45 mg/dL', '2023-03-22'),
          ($1, 'Lipid Panel', 'LDL 120 mg/dL, HDL 48 mg/dL', '2023-09-01'),
          ($1, 'Liver Function Test', 'ALT/AST Normal', '2024-02-28')
      \`, [johnPatientId]);

      // 4. Allergies
      await pool.query(\`
        INSERT INTO patient_allergies (patient_id, allergy_name)
        VALUES 
          ($1, 'Sulfa Drugs')
      \`, [johnPatientId]);

      // 5. Prescriptions
      const johnRx = await pool.query(\`
        INSERT INTO prescriptions (patient_id, doctor_id, prescription_date, instructions, approval_status)
        VALUES ($1, $2, '2023-09-05', 'Take daily at night', 'approved')
        RETURNING id
      \`, [johnPatientId, doctorId]);
      
      if (johnRx.rows.length > 0 && drugIds.length >= 3) {
        const rxId = johnRx.rows[0].id;
        await pool.query(\`
          INSERT INTO prescription_medications (prescription_id, drug_id, medication_name, dosage_level, dosage_amount, start_date)
          VALUES 
            ($1, $2, 'Atorvastatin', 'medium', '20mg', '2023-09-05')
        \`, [rxId, drugIds[2]]);
      }
    }
`;

content = content.replace('// 6. Create Risk Assessments', additionalData + '\n\n    // 6. Create Risk Assessments');
fs.writeFileSync('backend/src/scripts/seedMockData.ts', content);
console.log('Done replacing!');
