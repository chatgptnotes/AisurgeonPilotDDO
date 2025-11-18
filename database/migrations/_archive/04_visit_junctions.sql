-- ============================================
-- AI SURGEON PILOT - VISIT JUNCTION TABLES
-- ============================================
-- This script creates junction tables linking visits to other entities
-- Run this AFTER 03_medical_reference_data.sql
-- Version: 1.1
-- Date: 2025-10-26
-- ============================================

-- ============================================
-- 1. VISIT_DIAGNOSES (Many-to-Many)
-- ============================================
-- Links visits to multiple diagnoses

CREATE TABLE IF NOT EXISTS public.visit_diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    diagnosis_id UUID NOT NULL REFERENCES public.diagnoses(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(visit_id, diagnosis_id)
);

CREATE INDEX IF NOT EXISTS idx_visit_diagnoses_visit_id ON public.visit_diagnoses(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_diagnoses_diagnosis_id ON public.visit_diagnoses(diagnosis_id);

-- ============================================
-- 2. VISIT_COMPLICATIONS (Many-to-Many)
-- ============================================
-- Links visits to complications experienced

CREATE TABLE IF NOT EXISTS public.visit_complications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    complication_id UUID NOT NULL REFERENCES public.complications(id) ON DELETE CASCADE,
    severity VARCHAR(50) NULL, -- mild, moderate, severe
    onset_date DATE NULL,
    resolution_date DATE NULL,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(visit_id, complication_id)
);

CREATE INDEX IF NOT EXISTS idx_visit_complications_visit_id ON public.visit_complications(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_complications_complication_id ON public.visit_complications(complication_id);

-- ============================================
-- 3. VISIT_MEDICATIONS (Many-to-Many)
-- ============================================
-- Medications prescribed during visits

CREATE TABLE IF NOT EXISTS public.visit_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES public.medication(id) ON DELETE CASCADE,
    dosage VARCHAR(100) NULL,
    frequency VARCHAR(100) NULL,
    duration VARCHAR(100) NULL,
    route VARCHAR(50) NULL, -- oral, IV, IM, etc
    start_date DATE NULL,
    end_date DATE NULL,
    prescribed_by VARCHAR(255) NULL,
    notes TEXT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visit_medications_visit_id ON public.visit_medications(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_medications_medication_id ON public.visit_medications(medication_id);
CREATE INDEX IF NOT EXISTS idx_visit_medications_is_active ON public.visit_medications(is_active);

-- ============================================
-- 4. LAB TABLE (Master Lab Tests)
-- ============================================
-- Master list of lab tests

CREATE TABLE IF NOT EXISTS public.lab (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NULL,
    description TEXT NULL,
    normal_range VARCHAR(255) NULL,
    unit VARCHAR(50) NULL,
    cost DECIMAL(10,2) NULL,
    turnaround_time VARCHAR(50) NULL, -- 2 hours, 24 hours, etc
    sample_type VARCHAR(50) NULL, -- blood, urine, etc
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_name ON public.lab(name);
CREATE INDEX IF NOT EXISTS idx_lab_category ON public.lab(category);
CREATE INDEX IF NOT EXISTS idx_lab_is_active ON public.lab(is_active);

-- ============================================
-- 5. VISIT_LABS (Many-to-Many)
-- ============================================
-- Lab tests ordered for visits

CREATE TABLE IF NOT EXISTS public.visit_labs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    lab_id UUID NOT NULL REFERENCES public.lab(id) ON DELETE CASCADE,
    ordered_date DATE NULL,
    sample_collected_date DATE NULL,
    result_date DATE NULL,
    result_value TEXT NULL,
    result_status VARCHAR(50) NULL, -- pending, completed, abnormal
    ordered_by VARCHAR(255) NULL,
    reported_by VARCHAR(255) NULL,
    quantity INTEGER DEFAULT 1,
    unit_rate DECIMAL(10,2) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visit_labs_visit_id ON public.visit_labs(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_labs_lab_id ON public.visit_labs(lab_id);
CREATE INDEX IF NOT EXISTS idx_visit_labs_result_status ON public.visit_labs(result_status);

-- ============================================
-- 6. RADIOLOGY TABLE (Master Radiology Procedures)
-- ============================================
-- Master list of radiology procedures

CREATE TABLE IF NOT EXISTS public.radiology (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NULL, -- X-Ray, CT, MRI, Ultrasound
    description TEXT NULL,
    cost DECIMAL(10,2) NULL,
    body_part VARCHAR(100) NULL,
    radiation_dose VARCHAR(50) NULL,
    contrast_required BOOLEAN DEFAULT false,
    preparation_instructions TEXT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radiology_name ON public.radiology(name);
CREATE INDEX IF NOT EXISTS idx_radiology_category ON public.radiology(category);
CREATE INDEX IF NOT EXISTS idx_radiology_is_active ON public.radiology(is_active);

-- ============================================
-- 7. VISIT_RADIOLOGY (Many-to-Many)
-- ============================================
-- Radiology procedures ordered for visits

CREATE TABLE IF NOT EXISTS public.visit_radiology (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    radiology_id UUID NOT NULL REFERENCES public.radiology(id) ON DELETE CASCADE,
    ordered_date DATE NULL,
    performed_date DATE NULL,
    report_date DATE NULL,
    findings TEXT NULL,
    impression TEXT NULL,
    status VARCHAR(50) NULL, -- pending, completed, cancelled
    ordered_by VARCHAR(255) NULL,
    performed_by VARCHAR(255) NULL,
    reported_by VARCHAR(255) NULL,
    quantity INTEGER DEFAULT 1,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visit_radiology_visit_id ON public.visit_radiology(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_radiology_radiology_id ON public.visit_radiology(radiology_id);
CREATE INDEX IF NOT EXISTS idx_visit_radiology_status ON public.visit_radiology(status);

-- ============================================
-- 8. VISIT_SURGERIES (One-to-Many)
-- ============================================
-- Surgeries performed during visits

CREATE TABLE IF NOT EXISTS public.visit_surgeries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    surgery_name VARCHAR(255) NOT NULL,
    surgery_date DATE NULL,
    surgery_time TIME NULL,
    duration_minutes INTEGER NULL,
    surgeon_name VARCHAR(255) NULL,
    assistant_surgeon VARCHAR(255) NULL,
    anesthetist VARCHAR(255) NULL,
    anesthesia_type VARCHAR(100) NULL,
    operation_theatre VARCHAR(100) NULL,
    procedure_notes TEXT NULL,
    complications TEXT NULL,
    blood_loss_ml INTEGER NULL,
    specimens_sent TEXT NULL,
    implants_used TEXT NULL,
    status VARCHAR(50) NULL, -- scheduled, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visit_surgeries_visit_id ON public.visit_surgeries(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_surgeries_surgery_date ON public.visit_surgeries(surgery_date);
CREATE INDEX IF NOT EXISTS idx_visit_surgeries_status ON public.visit_surgeries(status);

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Visit Diagnoses
ALTER TABLE public.visit_diagnoses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visit_diagnoses" ON public.visit_diagnoses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage visit_diagnoses" ON public.visit_diagnoses FOR ALL USING (true);

-- Visit Complications
ALTER TABLE public.visit_complications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visit_complications" ON public.visit_complications FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage visit_complications" ON public.visit_complications FOR ALL USING (true);

-- Visit Medications
ALTER TABLE public.visit_medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visit_medications" ON public.visit_medications FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage visit_medications" ON public.visit_medications FOR ALL USING (true);

-- Lab
ALTER TABLE public.lab ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lab" ON public.lab FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage lab" ON public.lab FOR ALL USING (true);

-- Visit Labs
ALTER TABLE public.visit_labs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visit_labs" ON public.visit_labs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage visit_labs" ON public.visit_labs FOR ALL USING (true);

-- Radiology
ALTER TABLE public.radiology ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view radiology" ON public.radiology FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage radiology" ON public.radiology FOR ALL USING (true);

-- Visit Radiology
ALTER TABLE public.visit_radiology ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visit_radiology" ON public.visit_radiology FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage visit_radiology" ON public.visit_radiology FOR ALL USING (true);

-- Visit Surgeries
ALTER TABLE public.visit_surgeries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visit_surgeries" ON public.visit_surgeries FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage visit_surgeries" ON public.visit_surgeries FOR ALL USING (true);

-- ============================================
-- 10. TRIGGERS
-- ============================================

CREATE TRIGGER update_visit_medications_updated_at
    BEFORE UPDATE ON public.visit_medications FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_updated_at
    BEFORE UPDATE ON public.lab FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visit_labs_updated_at
    BEFORE UPDATE ON public.visit_labs FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_radiology_updated_at
    BEFORE UPDATE ON public.radiology FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visit_radiology_updated_at
    BEFORE UPDATE ON public.visit_radiology FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visit_surgeries_updated_at
    BEFORE UPDATE ON public.visit_surgeries FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. SAMPLE DATA
-- ============================================

-- Sample lab tests
INSERT INTO public.lab (name, category, unit, cost, sample_type) VALUES
    ('Complete Blood Count (CBC)', 'Hematology', 'cells/mcL', 300.00, 'Blood'),
    ('Blood Sugar Fasting', 'Biochemistry', 'mg/dL', 150.00, 'Blood'),
    ('Lipid Profile', 'Biochemistry', 'mg/dL', 500.00, 'Blood'),
    ('Urine Routine', 'Clinical Pathology', '-', 100.00, 'Urine'),
    ('X-Ray Chest PA', 'Radiology', '-', 400.00, 'X-Ray')
ON CONFLICT (name) DO NOTHING;

-- Sample radiology procedures
INSERT INTO public.radiology (name, category, cost, body_part) VALUES
    ('X-Ray Chest PA View', 'X-Ray', 400.00, 'Chest'),
    ('CT Scan Head', 'CT Scan', 3000.00, 'Head'),
    ('MRI Spine', 'MRI', 6000.00, 'Spine'),
    ('Ultrasound Abdomen', 'Ultrasound', 800.00, 'Abdomen')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 12. VERIFICATION QUERIES
-- ============================================

SELECT 'Visit junction tables created' as status;
SELECT 'Lab tests count:' as info, COUNT(*) as count FROM public.lab;
SELECT 'Radiology procedures count:' as info, COUNT(*) as count FROM public.radiology;

-- ============================================
-- DONE!
-- ============================================
-- Visit junction tables created successfully
-- ============================================
