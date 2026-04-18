CREATE TABLE IF NOT EXISTS patient_access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    patient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(patient_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_access_requests_patient_user_id ON patient_access_requests(patient_user_id);
CREATE INDEX IF NOT EXISTS idx_patient_access_requests_requested_by ON patient_access_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_patient_access_requests_organization_id ON patient_access_requests(organization_id);
