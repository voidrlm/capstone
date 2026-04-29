-- Ensure patient_vaccinations table exists
CREATE TABLE IF NOT EXISTS patient_vaccinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(255) NOT NULL,
    administered_date DATE,
    dose VARCHAR(100),
    document_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_vaccinations_patient ON patient_vaccinations(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_vaccinations_date ON patient_vaccinations(administered_date);
