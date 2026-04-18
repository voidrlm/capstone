CREATE TABLE IF NOT EXISTS patient_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, patient_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_favorites_user_id ON patient_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_favorites_patient_id ON patient_favorites(patient_id);
