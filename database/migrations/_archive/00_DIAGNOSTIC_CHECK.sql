-- ============================================
-- DIAGNOSTIC CHECK - RUN THIS FIRST
-- ============================================
-- This checks what tables actually exist in your database
-- Run this in Supabase SQL Editor BEFORE any migrations
-- ============================================

-- 1. List all tables in public schema
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check if User table exists (case-sensitive)
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'User'
) as "User_exists";

-- 3. Check if users table exists (lowercase)
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'users'
) as "users_exists";

-- 4. Check patients table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'patients'
ORDER BY ordinal_position;

-- 5. Check if tenants table already exists
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'tenants'
) as "tenants_exists";

-- 6. Check auth.users (Supabase Auth)
SELECT
    COUNT(*) as auth_users_count
FROM auth.users;

-- 7. Count records in key tables
SELECT
    'patients' as table_name,
    COUNT(*) as record_count
FROM patients
UNION ALL
SELECT
    'visits',
    COUNT(*)
FROM visits
UNION ALL
SELECT
    'bills',
    COUNT(*)
FROM bills;

-- ============================================
-- RESULTS TO SHARE:
-- ============================================
-- Please share the output of these queries
-- This will help me create the correct migration
-- ============================================
