-- ============================================
-- DIAGNOSTIC SCRIPT - RUN THIS FIRST!
-- ============================================
-- This will tell us EXACTLY what exists in your database
-- Copy the OUTPUT and share it with me
-- ============================================

-- 1. Check if patients table exists and its columns
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'patients'
ORDER BY ordinal_position;

-- 2. Check if visits table exists and its columns
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'visits'
ORDER BY ordinal_position;

-- 3. Check if tenants table already exists
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'tenants'
) as tenants_exists;

-- 4. Check if user_profiles table already exists
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
) as user_profiles_exists;

-- 5. Check auth.users (Supabase Auth)
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- 6. List ALL tables in public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- PLEASE SHARE THE OUTPUT OF ALL THESE QUERIES
-- ============================================
