-- First, let's check what foreign key constraint exists
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'doctors'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_id';

-- Now let's see what's in the users table vs auth.users
SELECT 'users table' as source, id, email FROM users WHERE email = 'priya.sharma@aisurgeonpilot.com'
UNION ALL
SELECT 'auth.users table' as source, id, email FROM auth.users WHERE email = 'priya.sharma@aisurgeonpilot.com';

-- Create a user in the users table linked to auth.users
INSERT INTO users (id, email, created_at, updated_at)
VALUES (
  '4d64f912-2219-435a-8cde-6784e9cccd9c',
  'priya.sharma@aisurgeonpilot.com',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Now update the doctor profile
UPDATE doctors
SET user_id = '4d64f912-2219-435a-8cde-6784e9cccd9c'
WHERE email = 'priya.sharma@aisurgeonpilot.com';

-- Verify the complete setup
SELECT
  d.id as doctor_id,
  d.full_name,
  d.email as doctor_email,
  d.user_id,
  u.email as users_email,
  au.email as auth_email
FROM doctors d
LEFT JOIN users u ON d.user_id = u.id
LEFT JOIN auth.users au ON u.id = au.id
WHERE d.email = 'priya.sharma@aisurgeonpilot.com';
