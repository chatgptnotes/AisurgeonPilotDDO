# Admin User Setup Guide

**Version:** 1.0
**Date:** 2025-10-26
**Purpose:** Create test admin user for AI Surgeon Pilot development

---

## Quick Start

### Test Login Credentials

```
Email:    admin@aisurgeonpilot.com
Password: Admin@123
```

These credentials are displayed on the login page with an auto-fill button for easy testing.

---

## Step-by-Step Setup

### 1. Access Supabase Dashboard

Go to: **https://qfneoowktsirwpzehgxp.supabase.co**

### 2. Create Auth User

1. Navigate to **Authentication** → **Users**
2. Click **"Add User"** button (top right)
3. Select **"Create new user"**
4. Fill in the details:
   - **Email:** `admin@aisurgeonpilot.com`
   - **Password:** `Admin@123`
   - **Auto Confirm User:** ✅ Check this box (important!)
5. Click **"Create user"**
6. Copy the **User ID (UUID)** from the newly created user

### 3. Link Auth User to Users Table

1. Navigate to **SQL Editor** in Supabase
2. Open the file: `database/migrations/07_create_admin_user.sql`
3. Find the line: `'YOUR_AUTH_USER_ID_HERE'::uuid`
4. Replace `YOUR_AUTH_USER_ID_HERE` with the actual UUID from step 2
5. Click **"Run"** to execute the SQL
6. Verify the user was created successfully

### 4. Verify Setup

Run this query in SQL Editor:

```sql
SELECT
    id,
    email,
    full_name,
    role,
    is_active,
    created_at
FROM public.users
WHERE email = 'admin@aisurgeonpilot.com';
```

You should see one row with the admin user details.

### 5. Test Login

1. Go to the application: http://localhost:8080/login
2. You'll see the test credentials displayed in a blue box
3. Click **"Click to auto-fill credentials"** button
4. Or manually enter:
   - Email: `admin@aisurgeonpilot.com`
   - Password: `Admin@123`
5. Click **"Sign In"**

---

## Alternative: Supabase CLI Method

If you have Supabase CLI installed:

```bash
# Create user via CLI
supabase auth create-user \
  --email admin@aisurgeonpilot.com \
  --password Admin@123 \
  --confirm true

# Get the user ID
supabase auth list-users --filter "email=admin@aisurgeonpilot.com"

# Then run the SQL script with the UUID
```

---

## Troubleshooting

### Issue: "Invalid email or password" error

**Cause:** User not created in Supabase Auth
**Solution:** Complete steps 1-2 above to create the auth user

### Issue: Login succeeds but shows empty dashboard

**Cause:** User not linked to users table
**Solution:** Complete step 3 above to link the auth user

### Issue: "Email not confirmed" error

**Cause:** User not auto-confirmed during creation
**Solution:**
1. Go to Authentication → Users
2. Find the user
3. Click on the user
4. Click "Confirm Email" button

### Issue: Cannot find user in database

**Cause:** SQL script not run or UUID mismatch
**Solution:**
1. Verify the UUID matches between auth.users and public.users
2. Re-run the SQL script with correct UUID

---

## Security Notes

### Development vs Production

- **Development:** Test credentials are displayed on login page
- **Production:** Remove or hide the test credentials section

### Changing Password

To change the admin password:

1. Go to Authentication → Users
2. Find `admin@aisurgeonpilot.com`
3. Click on the user
4. Click "Reset Password"
5. Enter new password
6. Update the login page credentials section

### Creating Additional Users

To create more test users, repeat the process with different emails:

```
- Email: doctor@aisurgeonpilot.com
- Email: nurse@aisurgeonpilot.com
- Email: receptionist@aisurgeonpilot.com
```

---

## User Roles

The system supports these roles (set in users table):

- `admin` - Full system access
- `doctor` - Clinical features access
- `nurse` - Patient care features
- `receptionist` - Front desk features
- `user` - Basic access

The default admin user has role: `admin`

---

## Next Steps

After setting up the admin user:

1. ✅ Test login at: http://localhost:8080/login
2. ✅ Explore the dashboard
3. ✅ Test patient follow-up features
4. ✅ Try creating educational content
5. ✅ Configure WhatsApp automation

---

## Support

If you encounter issues:
1. Check Supabase Dashboard → Logs for errors
2. Check browser console for authentication errors
3. Verify environment variables are set correctly
4. Ensure Supabase project is active

---

**Happy Testing! 🚀**

*AI Surgeon Pilot - Empowering Surgeons with AI*
