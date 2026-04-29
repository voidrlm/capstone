-- Ensure patient_lab_results table exists
CREATE TABLE IF NOT EXISTS patient_lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    result TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_range TEXT,
    document_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_lab_results_patient ON patient_lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_lab_results_date ON patient_lab_results(date);
