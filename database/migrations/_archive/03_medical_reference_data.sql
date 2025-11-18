-- ============================================
-- AI SURGEON PILOT - MEDICAL REFERENCE DATA
-- ============================================
-- This script creates medical reference tables
-- Run this AFTER 02_patient_management.sql
-- Version: 1.1
-- Date: 2025-10-26
-- ============================================

-- ============================================
-- 1. DIAGNOSES TABLE
-- ============================================
-- Master list of medical diagnoses

CREATE TABLE IF NOT EXISTS public.diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diagnoses_name ON public.diagnoses(name);

-- ============================================
-- 2. COMPLICATIONS TABLE
-- ============================================
-- Possible complications for various conditions

CREATE TABLE IF NOT EXISTS public.complications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complications_name ON public.complications(name);

-- ============================================
-- 3. MEDICATIONS TABLE (Main)
-- ============================================
-- Medication master list

CREATE TABLE IF NOT EXISTS public.medication (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NULL,
    frequency VARCHAR(100) NULL,
    duration VARCHAR(100) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medication_name ON public.medication(name);

-- ============================================
-- 4. MEDICINES TABLE (Pharmacy Inventory)
-- ============================================
-- Detailed medicine information for pharmacy

CREATE TABLE IF NOT EXISTS public.medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NULL,
    brand_name VARCHAR(255) NULL,
    manufacturer VARCHAR(255) NULL,
    category VARCHAR(100) NULL,
    form VARCHAR(50) NULL, -- tablet, capsule, syrup, injection
    strength VARCHAR(50) NULL, -- 500mg, 10ml, etc
    unit_price DECIMAL(10,2) NULL,
    stock_quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    batch_number VARCHAR(50) NULL,
    expiry_date DATE NULL,
    storage_conditions TEXT NULL,
    prescription_required BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicines_name ON public.medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_generic_name ON public.medicines(generic_name);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON public.medicines(category);
CREATE INDEX IF NOT EXISTS idx_medicines_is_active ON public.medicines(is_active);

-- ============================================
-- 5. REFEREES TABLE (Referring Doctors)
-- ============================================
-- List of referring doctors

CREATE TABLE IF NOT EXISTS public.referees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(100) NULL,
    qualification VARCHAR(255) NULL,
    hospital_affiliation VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(255) NULL,
    address TEXT NULL,
    commission_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referees_name ON public.referees(name);
CREATE INDEX IF NOT EXISTS idx_referees_is_active ON public.referees(is_active);

-- ============================================
-- 6. ADD FOREIGN KEY TO VISITS TABLE
-- ============================================
-- Now that diagnoses table exists, add the foreign key

ALTER TABLE public.visits
ADD CONSTRAINT fk_visits_diagnosis
FOREIGN KEY (diagnosis_id)
REFERENCES public.diagnoses(id)
ON DELETE SET NULL;

ALTER TABLE public.visits
ADD CONSTRAINT fk_visits_referring_doctor
FOREIGN KEY (referring_doctor_id)
REFERENCES public.referees(id)
ON DELETE SET NULL;

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Diagnoses
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view diagnoses"
    ON public.diagnoses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage diagnoses"
    ON public.diagnoses FOR ALL USING (true);

-- Complications
ALTER TABLE public.complications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view complications"
    ON public.complications FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage complications"
    ON public.complications FOR ALL USING (true);

-- Medication
ALTER TABLE public.medication ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view medication"
    ON public.medication FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage medication"
    ON public.medication FOR ALL USING (true);

-- Medicines
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view medicines"
    ON public.medicines FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage medicines"
    ON public.medicines FOR ALL USING (true);

-- Referees
ALTER TABLE public.referees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view referees"
    ON public.referees FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage referees"
    ON public.referees FOR ALL USING (true);

-- ============================================
-- 8. TRIGGERS
-- ============================================

CREATE TRIGGER update_diagnoses_updated_at
    BEFORE UPDATE ON public.diagnoses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complications_updated_at
    BEFORE UPDATE ON public.complications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medication_updated_at
    BEFORE UPDATE ON public.medication
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicines_updated_at
    BEFORE UPDATE ON public.medicines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referees_updated_at
    BEFORE UPDATE ON public.referees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. SAMPLE DATA
-- ============================================

-- Insert sample diagnoses
INSERT INTO public.diagnoses (name, description) VALUES
    ('Inguinal Hernia', 'Hernias occurring in the inguinal region'),
    ('Appendicitis', 'Inflammation of the appendix'),
    ('Gallbladder Disease', 'Various conditions affecting the gallbladder'),
    ('Thyroid Disorders', 'Conditions affecting the thyroid gland'),
    ('Hypertension', 'High blood pressure'),
    ('Diabetes Mellitus', 'Metabolic disorder affecting blood sugar'),
    ('Fracture', 'Broken bone requiring surgical intervention'),
    ('Hernia', 'Protrusion of an organ through tissue')
ON CONFLICT (name) DO NOTHING;

-- Insert sample complications
INSERT INTO public.complications (name, description) VALUES
    ('Infection', 'Bacterial or viral infection at surgical site'),
    ('Bleeding', 'Excessive blood loss'),
    ('Abscess', 'Collection of pus'),
    ('Delayed Healing', 'Wound healing taking longer than expected'),
    ('Nerve Injury', 'Damage to nerves during surgery'),
    ('Pain', 'Post-operative pain'),
    ('Swelling', 'Post-operative edema')
ON CONFLICT DO NOTHING;

-- Insert sample medications
INSERT INTO public.medication (name, dosage, frequency, duration) VALUES
    ('Paracetamol', '500mg', 'Three times daily', '5 days'),
    ('Ibuprofen', '400mg', 'Twice daily', '3 days'),
    ('Amoxicillin', '500mg', 'Three times daily', '7 days'),
    ('Omeprazole', '20mg', 'Once daily', '14 days'),
    ('Metformin', '500mg', 'Twice daily', 'Ongoing')
ON CONFLICT DO NOTHING;

-- Insert sample medicines (pharmacy)
INSERT INTO public.medicines (name, generic_name, form, strength, unit_price, stock_quantity) VALUES
    ('Paracetamol', 'Acetaminophen', 'Tablet', '500mg', 5.00, 1000),
    ('Ibuprofen', 'Ibuprofen', 'Tablet', '400mg', 8.00, 500),
    ('Amoxicillin', 'Amoxicillin', 'Capsule', '500mg', 15.00, 300),
    ('Omeprazole', 'Omeprazole', 'Capsule', '20mg', 12.00, 200),
    ('Metformin', 'Metformin', 'Tablet', '500mg', 10.00, 800)
ON CONFLICT DO NOTHING;

-- Insert sample referees
INSERT INTO public.referees (name, specialty, phone, email) VALUES
    ('Dr. John Smith', 'General Physician', '+91-9876543210', 'john.smith@hospital.com'),
    ('Dr. Sarah Williams', 'Orthopedic Surgeon', '+91-9876543211', 'sarah.w@hospital.com'),
    ('Dr. Michael Brown', 'Cardiologist', '+91-9876543212', 'michael.b@hospital.com')
ON CONFLICT DO NOTHING;

-- ============================================
-- 10. VERIFICATION QUERIES
-- ============================================

SELECT 'Diagnoses count:' as info, COUNT(*) as count FROM public.diagnoses;
SELECT 'Complications count:' as info, COUNT(*) as count FROM public.complications;
SELECT 'Medication count:' as info, COUNT(*) as count FROM public.medication;
SELECT 'Medicines count:' as info, COUNT(*) as count FROM public.medicines;
SELECT 'Referees count:' as info, COUNT(*) as count FROM public.referees;

-- ============================================
-- DONE!
-- ============================================
-- Medical reference data tables created successfully
-- ============================================
