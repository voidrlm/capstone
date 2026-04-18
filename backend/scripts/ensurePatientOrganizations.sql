CREATE TABLE IF NOT EXISTS patient_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    linked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_organizations_patient
    ON patient_organizations(patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_organizations_organization
    ON patient_organizations(organization_id);

COMMENT ON TABLE patient_organizations IS
    'Join table linking patients to one or more healthcare organizations';

INSERT INTO patient_organizations (patient_id, organization_id, linked_by)
SELECT DISTINCT
    p.id,
    source.organization_id,
    p.created_by
FROM patients p
JOIN (
    SELECT p1.id AS patient_id, u.organization_id
    FROM patients p1
    JOIN users u ON u.id = p1.user_id
    WHERE u.organization_id IS NOT NULL

    UNION

    SELECT p2.id AS patient_id, creator.organization_id
    FROM patients p2
    JOIN users creator ON creator.id = p2.created_by
    WHERE creator.organization_id IS NOT NULL
) AS source
    ON source.patient_id = p.id
ON CONFLICT (patient_id, organization_id) DO NOTHING;
