# AI Surgeon Pilot - Multi-Tenant SaaS Implementation Guide

## Status: Ready for Database Migration

This guide will help you implement the complete multi-tenant SaaS platform with all requested features.

---

## Phase 1: Database Setup (CRITICAL - DO THIS FIRST)

### Step 1.1: Run Database Migrations

1. Open your Supabase project: https://supabase.com/dashboard/project/qfneoowktsirwpzehgxp

2. Go to SQL Editor

3. Run the following migrations **in order**:

   **Migration 1: Multi-Tenant Setup**
   ```bash
   # File: database/migrations/08_multi_tenant_setup.sql
   ```
   - Creates `tenants` table
   - Creates `tenant_users` junction table
   - Creates `patient_users` table
   - Adds `tenant_id` to all existing tables
   - Creates RLS policies for tenant isolation
   - Creates superadmin user
   - Creates Hope and Ayushman as demo tenants
   - Migrates existing data

   **Migration 2: Appointments & Notifications**
   ```bash
   # File: database/migrations/09_appointments_notifications.sql
   ```
   - Creates `appointments` table
   - Creates `doctor_availability` table
   - Creates `notifications` table
   - Creates `prescriptions` table
   - Creates `payment_transactions` table
   - Sets up RLS policies

### Step 1.2: Verify Database Setup

Run these queries in Supabase SQL Editor to verify:

```sql
-- Check tenants
SELECT id, name, slug, subscription_status FROM tenants;

-- Check superadmin
SELECT email, is_superadmin FROM "User" WHERE is_superadmin = true;

-- Check tenant_users
SELECT COUNT(*) FROM tenant_users;

-- Check all new tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('tenants', 'tenant_users', 'patient_users', 'appointments', 'notifications', 'prescriptions', 'payment_transactions');
```

Expected results:
- 2 tenants (Hope, Ayushman)
- 1 superadmin user
- tenant_users entries linking existing users to tenants
- All 7 new tables created

---

## Phase 2: Environment Variables Setup

### Step 2.1: Update .env File

Add these new environment variables to your `.env` file:

```bash
# Existing variables
VITE_SUPABASE_URL=https://qfneoowktsirwpzehgxp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_DOUBLETICK_API_KEY=key_8sc9MP6JpQ

# NEW: Email Service (Resend.com)
VITE_RESEND_API_KEY=re_your_api_key_here
VITE_FROM_EMAIL=noreply@aisurgeonpilot.com

# NEW: WhatsApp Service (DoubleTick - already configured)
VITE_DOUBLETICK_TEMPLATE_APPOINTMENT=appointment_confirmation
VITE_DOUBLETICK_TEMPLATE_PRESCRIPTION=prescription_delivery
VITE_DOUBLETICK_TEMPLATE_PAYMENT=payment_confirmation

# NEW: Payment Gateway (Razorpay)
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_here
VITE_RAZORPAY_KEY_SECRET=your_secret_here

# NEW: OpenAI for AI Bot
VITE_OPENAI_API_KEY=sk-your_openai_key_here
```

### Step 2.2: Sign Up for Required Services

1. **Email Service (Resend)**
   - Sign up: https://resend.com
   - Get API key
   - Verify domain (optional for testing)
   - Free tier: 100 emails/day

2. **Payment Gateway (Razorpay)**
   - Sign up: https://razorpay.com
   - Get test API keys
   - Setup webhook for payment confirmations
   - Free tier: No setup cost, 2% transaction fee

3. **AI Service (OpenAI)**
   - Sign up: https://platform.openai.com
   - Get API key
   - Add credits ($5 minimum)
   - Use GPT-3.5-turbo for cost efficiency

---

## Phase 3: Frontend Integration

### Step 3.1: Update App.tsx

Add TenantProvider and new routes:

```typescript
// src/App.tsx
import { TenantProvider } from '@/contexts/TenantContext';
import UnifiedLoginPage from '@/components/UnifiedLoginPage';
import PatientSelfRegistration from '@/pages/PatientSelfRegistration';

// Wrap app with TenantProvider
<AuthProvider>
  <TenantProvider>
    {/* existing code */}
  </TenantProvider>
</AuthProvider>

// Add new routes
<Route path="/login" element={<UnifiedLoginPage />} />
<Route path="/patient-register" element={<PatientSelfRegistration />} />
<Route path="/patient-portal" element={<PatientPortal />} />
<Route path="/superadmin" element={<SuperadminDashboard />} />
```

### Step 3.2: Update Login Flow

Replace the old Login component:

```bash
# Old: src/components/Login.tsx
# New: src/components/UnifiedLoginPage.tsx (already created)
```

Update landing page to use new login:

```typescript
// src/components/LandingPage.tsx
<Button onClick={() => navigate('/login')}>
  Get Started
</Button>
```

### Step 3.3: Add Tenant Selector (for staff with multiple tenants)

Create `src/components/TenantSelector.tsx`:

```typescript
import { useTenant } from '@/contexts/TenantContext';

export function TenantSelector() {
  const { currentTenant, userTenants, switchTenant } = useTenant();

  if (userTenants.length <= 1) return null;

  return (
    <Select value={currentTenant?.id} onValueChange={switchTenant}>
      {userTenants.map(tenant => (
        <SelectItem key={tenant.id} value={tenant.id}>
          {tenant.display_name}
        </SelectItem>
      ))}
    </Select>
  );
}
```

Add to AppSidebar:

```typescript
// src/components/AppSidebar.tsx
import { TenantSelector } from './TenantSelector';

// Add at top of sidebar
<TenantSelector />
```

---

## Phase 4: Install New Dependencies

```bash
npm install @razorpay/razorpay
npm install openai
npm install date-fns-tz
npm install qrcode
```

---

## Phase 5: Feature Implementation Checklist

### ✓ Completed Features

- [x] Multi-tenant database architecture
- [x] Tenant isolation with RLS
- [x] TenantContext for frontend
- [x] Unified login page (staff/patient toggle)
- [x] Patient self-registration portal
- [x] Email service with templates
- [x] Appointments table
- [x] Notifications table
- [x] Prescriptions table
- [x] Payment transactions table

### ⏳ Pending Implementation

- [ ] WhatsApp service integration
- [ ] WhatsApp AI bot
- [ ] Payment gateway integration
- [ ] Online prescription generation
- [ ] Patient portal dashboard
- [ ] Superadmin dashboard
- [ ] OTP authentication for patients
- [ ] Appointment booking UI
- [ ] Prescription delivery automation

---

## Phase 6: Testing Plan

### Test Multi-Tenancy

1. **Create Test Tenants**
   ```sql
   INSERT INTO tenants (name, slug, display_name, contact_email)
   VALUES ('Test Clinic', 'test-clinic', 'Test Clinic', 'test@clinic.com');
   ```

2. **Create Test Users**
   ```sql
   -- Staff user
   INSERT INTO "User" (email, password, role, user_type)
   VALUES ('staff@test.com', '$2a$10$...', 'doctor', 'staff');

   -- Link to tenant
   INSERT INTO tenant_users (tenant_id, user_id, role, is_primary)
   SELECT
     (SELECT id FROM tenants WHERE slug = 'test-clinic'),
     (SELECT id FROM "User" WHERE email = 'staff@test.com'),
     'doctor',
     true;
   ```

3. **Test Data Isolation**
   - Login as staff from Clinic A
   - Create patients, appointments
   - Login as staff from Clinic B
   - Verify you can't see Clinic A's data

4. **Test Superadmin Access**
   - Login as superadmin@aisurgeonpilot.com
   - Verify you can see all tenants' data
   - Test tenant switching

### Test Patient Registration

1. Navigate to http://localhost:8080/patient-register
2. Fill out registration form
3. Submit
4. Verify:
   - Patient created in database
   - Linked to correct tenant
   - Appointment created if date selected
   - Email sent (check notifications table)

### Test Email System

```typescript
import { emailService } from '@/services/emailService';

// Test appointment confirmation
await emailService.sendAppointmentConfirmation({
  tenant_id: 'tenant-uuid',
  patient_id: 'patient-uuid',
  appointment_id: 'appointment-uuid',
  patient_name: 'John Doe',
  patient_email: 'john@example.com',
  appointment_date: '2025-12-01',
  appointment_time: '10:00 AM',
  doctor_name: 'Dr. Smith',
  hospital_name: 'Hope Hospital',
  consultation_mode: 'in_person'
});
```

---

## Phase 7: Production Deployment

### Pre-Deployment Checklist

- [ ] All database migrations run successfully
- [ ] Environment variables configured
- [ ] Email service tested
- [ ] WhatsApp API tested
- [ ] Payment gateway tested
- [ ] All features tested end-to-end
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Documentation updated

### Deployment Steps

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Configure environment variables in Vercel**
   - Go to Vercel project settings
   - Add all environment variables
   - Redeploy

4. **Setup custom domain**
   - Configure DNS
   - Add SSL certificate
   - Test all features on production

5. **Setup monitoring**
   - Vercel Analytics
   - Supabase monitoring
   - Error tracking (Sentry)

---

## Phase 8: Next Steps & Roadmap

### Immediate (Week 1-2)
1. Complete WhatsApp integration
2. Implement payment gateway
3. Create patient portal dashboard
4. Create superadmin dashboard
5. Test everything thoroughly

### Short-term (Month 1)
1. Launch beta with 2-3 hospitals
2. Gather feedback
3. Fix bugs and improve UX
4. Add analytics dashboard
5. Implement AI features

### Medium-term (Month 2-3)
1. Mobile app (React Native)
2. Advanced reporting
3. Inventory management
4. Staff scheduling
5. Telemedicine integration

### Long-term (Month 4-6)
1. EMR/EHR compliance
2. Insurance claim management
3. Laboratory integration
4. Pharmacy management
5. IoT device integration

---

## Troubleshooting

### Database Issues

**Problem:** RLS policies blocking queries
```sql
-- Temporarily disable RLS for debugging
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'patients';
```

**Problem:** Existing data not migrated
```sql
-- Check unmigrated patients
SELECT COUNT(*) FROM patients WHERE tenant_id IS NULL;

-- Migrate manually
UPDATE patients
SET tenant_id = (SELECT id FROM tenants WHERE slug = 'hope')
WHERE tenant_id IS NULL;
```

### Authentication Issues

**Problem:** Can't login after migration
- Check if user exists in tenant_users
- Verify RLS policies allow access
- Check browser console for errors

**Problem:** Superadmin can't see all data
- Verify is_superadmin = true
- Check RLS policies have superadmin exceptions

### Email Issues

**Problem:** Emails not sending
- Verify RESEND_API_KEY is set
- Check API key is valid
- Check notifications table for errors
- Check Resend dashboard for bounces

### Performance Issues

**Problem:** Slow queries
```sql
-- Add missing indexes
CREATE INDEX idx_patients_tenant_id_name ON patients(tenant_id, name);
CREATE INDEX idx_visits_tenant_id_patient_id ON visits(tenant_id, patient_id);
```

---

## Support & Resources

### Documentation
- Supabase: https://supabase.com/docs
- Resend: https://resend.com/docs
- Razorpay: https://razorpay.com/docs
- OpenAI: https://platform.openai.com/docs

### Community
- GitHub Issues: https://github.com/chatgptnotes/aisurgeonpilot.com/issues
- Email: support@aisurgeonpilot.com

---

## Credentials Summary

### Superadmin Access
- Email: superadmin@aisurgeonpilot.com
- Password: admin123
- Access: All tenants, all data

### Demo Staff Access
- Email: admin@aisurgeonpilot.com
- Password: admin123
- Access: Hope Hospital only

### Supabase
- URL: https://qfneoowktsirwpzehgxp.supabase.co
- Project ID: qfneoowktsirwpzehgxp

---

## Version History

- v2.0.0 - Multi-tenant SaaS architecture
- v1.0.0 - Single hospital system

---

**Ready to proceed? Start with Phase 1: Database Setup!**

