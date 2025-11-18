# AI Surgeon Pilot - Quick Database Setup

## The Problem You're Facing

You created a Supabase Auth user with UUID: `Aad9d006-23ea-4667-b670-67246500b228`

But when you tried to run `07_create_admin_user.sql`, you got this error:
```
ERROR: 42P01: relation "public.users" does not exist
```

This is because the `users` table hasn't been created yet!

---

## Solution: 3 Simple Steps

### Step 1: Create the Database Tables

1. Go to Supabase Dashboard: **https://qfneoowktsirwpzehgxp.supabase.co**
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Open the file: `database/SIMPLE_SETUP_FOR_AUTH.sql`
5. Copy the ENTIRE contents
6. Paste into SQL Editor
7. Click **"Run"** (or press Cmd/Ctrl + Enter)
8. Wait for **"Success"** message (should take ~5 seconds)

### Step 2: Link Your Auth User to the Users Table

1. In SQL Editor, create another new query
2. Open the file: `database/migrations/07_create_admin_user.sql`
3. The UUID is already set to: `Aad9d006-23ea-4667-b670-67246500b228`
4. Copy the ENTIRE contents
5. Paste into SQL Editor
6. Click **"Run"**
7. You should see **1 row inserted**

### Step 3: Verify Everything Works

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

You should see:
- **Email:** admin@aisurgeonpilot.com
- **Full Name:** AI Surgeon Pilot Admin
- **Role:** admin
- **Is Active:** true

---

## Test Login

1. Go to: **https://aisurgeonpilot-com.vercel.app/login**
2. You'll see the test credentials in a blue box
3. Click **"Click to auto-fill credentials"**
4. Click **"Sign In"**
5. You should be logged in successfully!

---

## What Each File Does

### `SIMPLE_SETUP_FOR_AUTH.sql`
- Creates `users` table (links to Supabase Auth)
- Creates `contact_form_submissions` table (for landing page)
- Sets up security policies
- Takes ~5 seconds to run

### `07_create_admin_user.sql`
- Links your Supabase Auth user to the users table
- Sets role to "admin"
- Sets full_name to "AI Surgeon Pilot Admin"
- Takes ~1 second to run

---

## Troubleshooting

### "User already exists" error when running Step 2
**Solution:** The user is already linked! Skip to Step 3 to verify.

### Login shows "Invalid email or password"
**Cause:** Auth user not created in Supabase Dashboard
**Solution:**
1. Go to Authentication → Users
2. Verify `admin@aisurgeonpilot.com` exists
3. If not, click "Add User" and create it with password `Admin@123`

### Login succeeds but shows blank page
**Cause:** User not linked to users table
**Solution:** Run Step 2 again

---

## Files Structure

```
database/
├── SIMPLE_SETUP_FOR_AUTH.sql      ← Run this FIRST
├── migrations/
│   ├── 07_create_admin_user.sql   ← Run this SECOND
│   └── 06_contact_form.sql        ← Already included in SIMPLE_SETUP
└── README_ADMIN_SETUP.md          ← Detailed documentation
```

---

## After Setup

Once login works, you can:
- ✅ Access the admin dashboard
- ✅ View contact form submissions
- ✅ Add more features
- ✅ Create additional users

---

## Your Current Status

- ✅ Supabase project created
- ✅ Landing page deployed to aisurgeonpilot-com.vercel.app
- ✅ Login page with test credentials
- ✅ Contact form integrated
- ✅ Auth user created (UUID: Aad9d006-23ea-4667-b670-67246500b228)
- ⏳ **NEXT:** Run SIMPLE_SETUP_FOR_AUTH.sql
- ⏳ **THEN:** Run 07_create_admin_user.sql
- ⏳ **FINALLY:** Test login!

---

**Ready to proceed? Start with Step 1 above!**
