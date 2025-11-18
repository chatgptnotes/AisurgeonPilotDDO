-- ============================================
-- SIMPLE DIAGNOSTIC - Saves results to tables
-- ============================================
-- Run this, then tell me the answers to these questions
-- ============================================

-- Question 1: Does patients table have hospital_name column?
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients'
    AND column_name = 'hospital_name'
) as patients_has_hospital_name;

-- Question 2: Does patients table have tenant_id column?
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients'
    AND column_name = 'tenant_id'
) as patients_has_tenant_id;

-- Question 3: Does visits table have tenant_id column?
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits'
    AND column_name = 'tenant_id'
) as visits_has_tenant_id;

-- Question 4: Does tenants table exist?
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'tenants'
) as tenants_table_exists;

-- Question 5: Does auth.users table exist?
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
) as auth_users_exists;

-- Question 6: How many patients exist?
SELECT COUNT(*) as patient_count FROM patients;

-- Question 7: How many visits exist?
SELECT COUNT(*) as visit_count FROM visits;

-- ============================================
-- Just tell me TRUE/FALSE for each question!
-- ============================================
