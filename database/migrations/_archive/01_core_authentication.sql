-- ============================================
-- AI SURGEON PILOT - CORE AUTHENTICATION SETUP
-- ============================================
-- This script creates the authentication tables for AI Surgeon Pilot
-- Run this in your Supabase SQL Editor
-- Version: 1.1
-- Date: 2025-10-26
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USER TABLE (Authentication)
-- ============================================
-- Stores user authentication and authorization information
-- Uses bcrypt hashed passwords
-- Supports multiple hospitals and roles

CREATE TABLE IF NOT EXISTS public."User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password TEXT NOT NULL, -- bcrypt hashed password
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- admin, doctor, nurse, user
    hospital_type VARCHAR(100) NULL, -- hope, ayushman, esic, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_email ON public."User"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON public."User"(role);
CREATE INDEX IF NOT EXISTS idx_user_hospital_type ON public."User"(hospital_type);

-- ============================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on User table
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to read their own data
CREATE POLICY "Users can view their own data"
    ON public."User"
    FOR SELECT
    USING (auth.uid()::text = id::text);

-- Policy: Allow users to update their own data
CREATE POLICY "Users can update their own data"
    ON public."User"
    FOR UPDATE
    USING (auth.uid()::text = id::text);

-- Policy: Allow public registration (INSERT)
CREATE POLICY "Allow public user registration"
    ON public."User"
    FOR INSERT
    WITH CHECK (true);

-- Policy: Only admins can delete users
CREATE POLICY "Only admins can delete users"
    ON public."User"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE id = auth.uid()::uuid
            AND role = 'admin'
        )
    );

-- ============================================
-- 3. TRIGGERS
-- ============================================
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON public."User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. SAMPLE DATA (Optional - for testing)
-- ============================================
-- Insert default admin user (password: admin123)
-- Note: In production, use a secure password and proper bcrypt hashing
INSERT INTO public."User" (email, password, role, hospital_type)
VALUES
    ('admin@aisurgeonpilot.com', '$2a$10$rOYz3YZKe6qHLqN3n8F7Z.xLV5QYJ2YqxJzDxHmT8V0xY6Z9K0Xqi', 'admin', 'hope'),
    ('doctor@aisurgeonpilot.com', '$2a$10$rOYz3YZKe6qHLqN3n8F7Z.xLV5QYJ2YqxJzDxHmT8V0xY6Z9K0Xqi', 'doctor', 'hope'),
    ('nurse@aisurgeonpilot.com', '$2a$10$rOYz3YZKe6qHLqN3n8F7Z.xLV5QYJ2YqxJzDxHmT8V0xY6Z9K0Xqi', 'nurse', 'ayushman')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 5. VERIFICATION QUERIES
-- ============================================
-- Verify table creation
SELECT
    'User table created successfully' as status,
    COUNT(*) as user_count
FROM public."User";

-- Show table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'User'
ORDER BY ordinal_position;

-- ============================================
-- DONE!
-- ============================================
-- Authentication setup complete
-- Default login credentials (for testing):
--   Email: admin@aisurgeonpilot.com
--   Password: admin123
-- ============================================
