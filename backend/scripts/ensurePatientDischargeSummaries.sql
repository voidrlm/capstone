-- Ensure patient_discharge_summaries table exists
CREATE TABLE IF NOT EXISTS patient_discharge_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    admission_date DATE,
    discharge_date DATE,
    primary_diagnosis TEXT,
    attending_physician VARCHAR(255),
    los_days INTEGER,
    discharge_diagnoses TEXT[],
    document_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_discharge_summaries_patient ON patient_discharge_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_discharge_summaries_discharge_date ON patient_discharge_summaries(discharge_date);
