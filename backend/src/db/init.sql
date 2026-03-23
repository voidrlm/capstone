-- MediRisk Database Initialization Script
-- PostgreSQL

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('doctor', 'nurse', 'admin', 'patient', 'org_admin');
CREATE TYPE organization_type AS ENUM ('hospital', 'clinic', 'pharmacy', 'nursing_home', 'urgent_care', 'specialty', 'other');
CREATE TYPE member_role AS ENUM ('admin', 'doctor', 'nurse', 'pharmacist', 'technician', 'staff');
CREATE TYPE member_status AS ENUM ('active', 'inactive', 'pending', 'suspended');
CREATE TYPE risk_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE frequency_type AS ENUM ('common', 'uncommon', 'rare');
CREATE TYPE age_group AS ENUM ('young', 'middle', 'elderly');
CREATE TYPE dosage_level AS ENUM ('none', 'low', 'medium', 'high');

-- Organizations table (Healthcare Providers like hospitals)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type organization_type NOT NULL DEFAULT 'hospital',
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    phone VARCHAR(50),
    website VARCHAR(255),
    email VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table (updated to link with organizations)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role user_role NOT NULL DEFAULT 'patient',
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Organization members table (for role-based access within organizations)
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_role member_role NOT NULL DEFAULT 'staff',
    status member_status NOT NULL DEFAULT 'active',
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, user_id)
);

-- Organization invitations table (for inviting new members)
CREATE TABLE IF NOT EXISTS organization_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    member_role member_role NOT NULL DEFAULT 'staff',
    invited_by UUID NOT NULL REFERENCES users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, email)
);

-- Drugs table
CREATE TABLE IF NOT EXISTS drugs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    openfda_id TEXT UNIQUE,
    generic_name TEXT,
    category TEXT,
    manufacturer_name TEXT,
    route TEXT,
    product_type TEXT,
    set_id TEXT,
    version TEXT,
    effective_time TEXT,
    uses TEXT[],
    warnings TEXT[],
    dosage_info TEXT,
    active_ingredients TEXT,
    inactive_ingredients TEXT,
    pregnancy TEXT,
    overdosage TEXT,
    description TEXT,
    how_supplied TEXT,
    geriatric_use TEXT,
    pediatric_use TEXT,
    clinical_studies TEXT,
    pharmacodynamics TEXT,
    pharmacokinetics TEXT,
    adverse_reactions TEXT,
    mechanism_of_action TEXT,
    recent_major_changes TEXT,
    clinical_pharmacology TEXT,
    indications_and_usage TEXT,
    warnings_and_cautions TEXT,
    nonclinical_toxicology TEXT,
    information_for_patients TEXT,
    spl_unclassified_section TEXT,
    purpose TEXT,
    dosage_and_administration TEXT,
    spl_product_data_elements TEXT,
    dosage_forms_and_strengths TEXT,
    use_in_specific_populations TEXT,
    package_label_principal_display_panel TEXT,
    carcinogenesis_and_mutagenesis_and_impairment_of_fertility TEXT,
    drug_contraindications TEXT,
    drug_interactions TEXT,
    dependence TEXT,
    do_not_use TEXT,
    stop_use TEXT,
    general_precautions TEXT,
    openfda_fetched_at TIMESTAMP WITH TIME ZONE,
    scraped_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Drug side effects table
CREATE TABLE IF NOT EXISTS drug_side_effects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drug_id UUID REFERENCES drugs(id) ON DELETE CASCADE,
    effect_name VARCHAR(255) NOT NULL,
    risk_level risk_level NOT NULL,
    frequency frequency_type NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Drug interactions table
CREATE TABLE IF NOT EXISTS drug_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drug_id_1 UUID REFERENCES drugs(id) ON DELETE CASCADE,
    drug_id_2 UUID REFERENCES drugs(id) ON DELETE CASCADE,
    severity risk_level NOT NULL,
    description TEXT NOT NULL,
    recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(drug_id_1, drug_id_2)
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Optional link to user account
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(50),
    age_group age_group,
    medical_history TEXT[],
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patient medications table
CREATE TABLE IF NOT EXISTS patient_medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    drug_id UUID REFERENCES drugs(id) ON DELETE CASCADE,
    dosage_level dosage_level NOT NULL DEFAULT 'medium',
    dosage_amount VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    notes TEXT,
    prescribed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patient visits / appointments
CREATE TABLE IF NOT EXISTS patient_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    visit_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lab results
CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    result TEXT,
    result_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Diagnoses
CREATE TABLE IF NOT EXISTS patient_diagnoses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    diagnosis_name VARCHAR(255) NOT NULL,
    diagnosis_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    drug_id UUID REFERENCES drugs(id) ON DELETE SET NULL,
    medication VARCHAR(255) NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Allergies
CREATE TABLE IF NOT EXISTS patient_allergies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergy_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Adverse Drug Reactions (ADR) table
CREATE TABLE IF NOT EXISTS adverse_drug_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    drug_id UUID REFERENCES drugs(id) ON DELETE CASCADE,
    reaction VARCHAR(255) NOT NULL,
    severity risk_level NOT NULL,
    notes TEXT,
    occurred_date DATE NOT NULL,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Risk assessments table
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    assessment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    nausea_risk INTEGER CHECK (nausea_risk >= 0 AND nausea_risk <= 100),
    fatigue_risk INTEGER CHECK (fatigue_risk >= 0 AND fatigue_risk <= 100),
    kidney_risk INTEGER CHECK (kidney_risk >= 0 AND kidney_risk <= 100),
    combo_therapy_risk INTEGER CHECK (combo_therapy_risk >= 0 AND combo_therapy_risk <= 100),
    overall_risk risk_level,
    outcome VARCHAR(100),
    notes TEXT,
    assessed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- OpenFDA drug labels table
CREATE TABLE IF NOT EXISTS drugs_openfda (
    id TEXT PRIMARY KEY,
    set_id TEXT,
    version TEXT,
    effective_time TEXT,
    route TEXT[],
    brand_name TEXT[],
    generic_name TEXT[],
    manufacturer_name TEXT[],
    active_ingredient TEXT[],
    inactive_ingredient TEXT[],
    pregnancy TEXT[],
    overdosage TEXT[],
    description TEXT[],
    how_supplied TEXT[],
    geriatric_use TEXT[],
    pediatric_use TEXT[],
    clinical_studies TEXT[],
    pharmacodynamics TEXT[],
    pharmacokinetics TEXT[],
    adverse_reactions TEXT[],
    mechanism_of_action TEXT[],
    recent_major_changes TEXT[],
    clinical_pharmacology TEXT[],
    indications_and_usage TEXT[],
    warnings_and_cautions TEXT[],
    nonclinical_toxicology TEXT[],
    information_for_patients TEXT[],
    spl_unclassified_section TEXT[],
    purpose TEXT[],
    dosage_and_administration TEXT[],
    spl_product_data_elements TEXT[],
    dosage_forms_and_strengths TEXT[],
    use_in_specific_populations TEXT[],
    package_label_principal_display_panel TEXT[],
    carcinogenesis_and_mutagenesis_and_impairment_of_fertility TEXT[],
    contraindications TEXT[],
    drug_interactions TEXT[],
    dependence TEXT[],
    do_not_use TEXT[],
    stop_use TEXT[],
    warnings TEXT[],
    general_precautions TEXT[],
    product_type TEXT[],
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_invitations_org ON organization_invitations(organization_id);
CREATE INDEX idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX idx_drugs_name ON drugs(name);
CREATE INDEX idx_drugs_generic_name ON drugs(generic_name);
CREATE INDEX idx_drug_side_effects_drug_id ON drug_side_effects(drug_id);
CREATE INDEX idx_drug_side_effects_risk ON drug_side_effects(risk_level);
CREATE INDEX idx_patients_name ON patients(name);
CREATE INDEX idx_patient_medications_patient ON patient_medications(patient_id);
CREATE INDEX idx_patient_medications_drug ON patient_medications(drug_id);
CREATE INDEX idx_risk_assessments_patient ON risk_assessments(patient_id);
CREATE INDEX idx_risk_assessments_date ON risk_assessments(assessment_date);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
CREATE INDEX idx_drugs_openfda_brand_name ON drugs_openfda USING GIN (brand_name);
CREATE INDEX idx_drugs_openfda_generic_name ON drugs_openfda USING GIN (generic_name);
CREATE INDEX idx_drugs_openfda_manufacturer_name ON drugs_openfda USING GIN (manufacturer_name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_members_updated_at BEFORE UPDATE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role) VALUES
    ('admin@medirisk.com', '$2a$10$rQZ9QxQzG8XKwBU9Jj6LkO9NfQVHhZQrUzQUZQK0V6T3Q9Q1Q2Q3Q', 'System Admin', 'admin'),
    ('doctor@medirisk.com', '$2a$10$rQZ9QxQzG8XKwBU9Jj6LkO9NfQVHhZQrUzQUZQK0V6T3Q9Q1Q2Q3Q', 'Dr. Demo', 'doctor'),
    ('nurse@medirisk.com', '$2a$10$rQZ9QxQzG8XKwBU9Jj6LkO9NfQVHhZQrUzQUZQK0V6T3Q9Q1Q2Q3Q', 'Nurse Demo', 'nurse')
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE organizations IS 'Healthcare organizations (hospitals, clinics, etc.)';
COMMENT ON TABLE users IS 'User accounts for the MediRisk platform';
COMMENT ON TABLE organization_members IS 'Members belonging to healthcare organizations with their roles';
COMMENT ON TABLE organization_invitations IS 'Pending invitations to join organizations';
COMMENT ON TABLE drugs IS 'Drug information scraped from Drugs.com';
COMMENT ON TABLE drug_side_effects IS 'Side effects associated with each drug';
COMMENT ON TABLE patients IS 'Patient records managed by healthcare providers';
COMMENT ON TABLE risk_assessments IS 'Risk assessment results for patients';
COMMENT ON TABLE drugs_openfda IS 'OpenFDA drug label records for OTC/prescription/cellular therapy products';
