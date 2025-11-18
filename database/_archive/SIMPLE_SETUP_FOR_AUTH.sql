/**
 * AI SURGEON PILOT - SIMPLE DATABASE SETUP FOR SUPABASE AUTH
 * ===========================================================
 * Version: 1.0
 * Date: 2025-10-26
 *
 * PURPOSE:
 * Create minimal tables needed for authentication and contact form
 *
 * INSTRUCTIONS:
 * 1. Go to Supabase Dashboard: https://qfneoowktsirwpzehgxp.supabase.co
 * 2. Navigate to SQL Editor
 * 3. Copy and paste this ENTIRE file
 * 4. Click "Run"
 * 5. Wait for "Success" message
 * 6. Then run 07_create_admin_user.sql with your auth user UUID
 *
 * ESTIMATED TIME: 30 seconds
 */

BEGIN;

-- ============================================
-- EXTENSION SETUP
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (linked to Supabase Auth)
-- ============================================

-- Create users table (lowercase - Supabase Auth convention)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,  -- This will match auth.users.id
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Allow authenticated users to view users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow users to update their own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Create update trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- CONTACT FORM SUBMISSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.contact_form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    practice_name VARCHAR(255) NULL,
    specialty VARCHAR(100) NULL,
    message TEXT NOT NULL,
    interested_in VARCHAR(100) NULL, -- Options: starter, professional, enterprise, other
    status VARCHAR(50) DEFAULT 'new', -- Options: new, contacted, qualified, converted, not_interested
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for contact_form_submissions
CREATE INDEX IF NOT EXISTS idx_contact_form_email ON public.contact_form_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_form_status ON public.contact_form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_form_created_at ON public.contact_form_submissions(created_at DESC);

-- Enable RLS
ALTER TABLE public.contact_form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_form_submissions
-- Allow anyone to insert (submit form)
CREATE POLICY "Allow public to submit contact form"
    ON public.contact_form_submissions
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow authenticated users to view all submissions
CREATE POLICY "Allow authenticated users to view submissions"
    ON public.contact_form_submissions
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to update submissions (for status/notes)
CREATE POLICY "Allow authenticated users to update submissions"
    ON public.contact_form_submissions
    FOR UPDATE
    TO authenticated
    USING (true);

-- Create trigger for contact_form_submissions
CREATE TRIGGER update_contact_form_submissions_updated_at
    BEFORE UPDATE ON public.contact_form_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify tables were created
SELECT
    'Tables created successfully!' as status,
    COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'contact_form_submissions');

COMMIT;

-- ============================================
-- NEXT STEPS
-- ============================================
/**
 * After running this script:
 *
 * 1. ✅ Verify you see "Success" message
 * 2. ✅ Run this verification query:
 *
 *    SELECT table_name FROM information_schema.tables
 *    WHERE table_schema = 'public'
 *    AND table_name IN ('users', 'contact_form_submissions');
 *
 * 3. ✅ Then run: database/migrations/07_create_admin_user.sql
 *    (Make sure you've replaced YOUR_AUTH_USER_ID_HERE with your actual UUID)
 *
 * 4. ✅ Test login at: http://localhost:8080/login
 *    Email: admin@aisurgeonpilot.com
 *    Password: Admin@123
 *
 * 5. ✅ Test contact form at: http://localhost:8080
 */
