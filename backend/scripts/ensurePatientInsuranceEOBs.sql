-- Ensure patient_insurance_eobs table exists
CREATE TABLE IF NOT EXISTS patient_insurance_eobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    insurer_name VARCHAR(255),
    plan_name VARCHAR(255),
    member_id VARCHAR(255),
    statement_date DATE,
    service_date DATE,
    total_billed NUMERIC(12,2),
    total_allowed NUMERIC(12,2),
    plan_paid NUMERIC(12,2),
    your_responsibility NUMERIC(12,2),
    claim_reference VARCHAR(255),
    document_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patient_insurance_eobs_patient ON patient_insurance_eobs(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_eobs_statement_date ON patient_insurance_eobs(statement_date);
