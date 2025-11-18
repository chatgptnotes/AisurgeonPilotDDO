/**
 * Create Admin User for AI Surgeon Pilot
 * Version: 1.0
 * Created: 2025-10-26
 *
 * Purpose: Create test admin user for development and demo purposes
 *
 * IMPORTANT: This creates a user in Supabase Auth and links it to the users table
 *
 * Steps to create admin user:
 * 1. Go to Supabase Dashboard: https://qfneoowktsirwpzehgxp.supabase.co
 * 2. Navigate to Authentication > Users
 * 3. Click "Add User" > "Create new user"
 * 4. Email: admin@aisurgeonpilot.com
 * 5. Password: Admin@123
 * 6. Click "Create user"
 * 7. Copy the User ID (UUID) from the created user
 * 8. Replace 'YOUR_AUTH_USER_ID_HERE' below with the actual UUID
 * 9. Run this SQL script in SQL Editor
 */

-- First, create user in Supabase Auth via Dashboard (steps above)
-- Then run the following SQL to link the auth user to users table:

-- Insert admin user record
-- REPLACE 'YOUR_AUTH_USER_ID_HERE' with the actual UUID from Supabase Auth
INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    'Aad9d006-23ea-4667-b670-67246500b228'::uuid,  -- Replace with actual auth user ID
    'admin@aisurgeonpilot.com',
    'AI Surgeon Pilot Admin',
    'admin',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Verify the admin user was created
SELECT
    id,
    email,
    full_name,
    role,
    is_active,
    created_at
FROM public.users
WHERE email = 'admin@aisurgeonpilot.com';

/**
 * Alternative Method: Create user programmatically
 *
 * If you prefer to create the user via SQL (requires admin privileges):
 */

-- This requires Supabase Admin API or Dashboard access
-- You cannot create auth users directly via SQL for security reasons

/**
 * Test Login Credentials:
 *
 * Email: admin@aisurgeonpilot.com
 * Password: Admin@123
 *
 * Use these credentials to test the authentication flow
 */

-- Add comment
COMMENT ON TABLE public.users IS 'User accounts linked to Supabase Auth. Admin user: admin@aisurgeonpilot.com';
