# AI Surgeon Pilot - Complete Architecture Analysis

## Executive Summary

AI Surgeon Pilot is a comprehensive hospital management system built with React + TypeScript + Vite. Currently supports 2 hospitals (Hope & Ayushman) with basic hospital-level separation. **Requires multi-tenant architecture for SaaS transformation.**

---

## Current Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **UI**: TailwindCSS, shadcn-ui (Radix UI), Lucide icons
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6
- **PDF**: jsPDF, html2canvas
- **Integrations**: DoubleTick WhatsApp API

### Database Schema (Current)

#### Core Tables
1. **User** - Authentication (bcrypt hashed passwords)
   - Fields: id, email, password, role, hospital_type, created_at, updated_at
   - Roles: admin, doctor, nurse, user
   - Hospital types: hope, ayushman, esic

2. **patients** - Patient demographics
   - 40+ fields including: name, demographics, contact, emergency, insurance, medical info
   - **Current isolation**: `hospital_name` VARCHAR field (weak isolation)

3. **visits** - Patient visits/admissions
   - Links to patients, tracks OPD/IPD/Emergency visits
   - Visit lifecycle: admission → treatment → discharge → billing

4. **Medical Reference Data**
   - diagnoses, complications, medications
   - cghs_surgery_masters, hope_surgery_masters
   - labs, radiology_tests

5. **Junction Tables**
   - visit_diagnoses, visit_complications
   - visit_medications, visit_labs, visit_radiology
   - visit_surgeries

6. **Billing & Finance**
   - bills, final_bills, corporate_bills
   - accounting_entries, ledger_entries
   - direct_sale_bills (pharmacy)

7. **AI Features (Minimal)**
   - patient_education_videos
   - patient_voice_calls
   - patient_whatsapp_messages
   - patient_followup_automations

### Authentication System

#### Current Implementation
- **Dual auth system** (problematic):
  1. Supabase Auth (database `users` table)
  2. Custom User table (bcrypt passwords)
- **Hospital selection**: User selects Hope or Ayushman
- **No tenant isolation**: Users can switch hospitals freely
- **Roles**: admin, doctor, nurse, user (no superadmin)

#### Auth Flow
```
1. Landing Page → Hospital Selection
2. Hospital Selected → Login with credentials
3. Login Success → Dashboard with hospital-specific features
4. localStorage stores user + hospital
```

### Current Hospital Separation

#### Method
- **Configuration-based**: `HOSPITAL_CONFIGS` object with 2 hospitals
- **UI-level separation**: Feature flags per hospital
- **Data-level**: `hospital_name` VARCHAR field (NOT enforced)

#### Issues
- No true multi-tenancy
- Data not isolated at database level
- No RLS policies for tenant separation
- Admins can see all hospitals' data
- No superadmin role
- No tenant management

---

## Gaps for Multi-Tenant SaaS

### Critical Gaps

1. **No Tenant Table**
   - Missing: tenants/organizations table
   - Missing: tenant subscriptions, billing, settings

2. **Weak Data Isolation**
   - Current: VARCHAR hospital_name (can be modified)
   - Needed: Foreign key to tenants table + RLS policies

3. **No Tenant-Scoped Authentication**
   - Users not tied to specific tenants
   - No tenant selection on login
   - No cross-tenant access prevention

4. **No Superadmin Role**
   - All admins have same privileges
   - No platform-level administration
   - Can't manage tenants

5. **No Tenant Onboarding**
   - No registration flow for new hospitals
   - No setup wizard
   - No demo/trial management

### Missing Features

1. **Patient Portal** (requested)
   - Self-registration
   - Appointment booking
   - View medical records
   - Payment history

2. **Email System** (requested)
   - Appointment confirmations
   - Prescription delivery
   - Billing notifications
   - No email service configured

3. **WhatsApp Integration** (partial)
   - DoubleTick API configured
   - Only emergency template
   - No AI bot
   - No conversational flows

4. **Payment Gateway** (missing)
   - No payment integration
   - No online payment flow
   - No razorpay/stripe

5. **Online Prescriptions** (partial)
   - Can generate prescriptions
   - No automated delivery
   - No email/WhatsApp sending

---

## Proposed Multi-Tenant Architecture

### Database Changes

#### 1. New Tables

```sql
-- Tenants (Hospitals/Clinics)
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50), -- hospital, clinic, diagnostic_center
    subscription_plan VARCHAR(50), -- free, basic, pro, enterprise
    subscription_status VARCHAR(50), -- trial, active, suspended, cancelled
    trial_ends_at TIMESTAMP,
    settings JSONB,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Tenant Users (Many-to-Many)
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50), -- tenant_admin, doctor, nurse, receptionist, patient
    is_primary BOOLEAN DEFAULT false,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- Patient Users (for patient portal)
CREATE TABLE patient_users (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    verified_email BOOLEAN DEFAULT false,
    verified_phone BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Appointments (for patient portal)
CREATE TABLE appointments (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id),
    appointment_date TIMESTAMP NOT NULL,
    appointment_type VARCHAR(50), -- opd, online, followup
    status VARCHAR(50), -- scheduled, confirmed, completed, cancelled
    reason TEXT,
    notes TEXT,
    zoom_link TEXT,
    payment_status VARCHAR(50),
    payment_amount DECIMAL(10,2),
    payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    patient_id UUID REFERENCES patients(id),
    type VARCHAR(50), -- email, whatsapp, sms, push
    channel VARCHAR(50), -- appointment, prescription, billing, general
    subject VARCHAR(255),
    message TEXT,
    data JSONB,
    status VARCHAR(50), -- pending, sent, failed, delivered
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Prescriptions
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id),
    prescription_date DATE NOT NULL,
    medications JSONB, -- Array of medications
    instructions TEXT,
    follow_up_date DATE,
    pdf_url TEXT,
    email_sent BOOLEAN DEFAULT false,
    whatsapp_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Modify Existing Tables

```sql
-- Add tenant_id to all major tables
ALTER TABLE patients ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE visits ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE bills ADD COLUMN tenant_id UUID REFERENCES tenants(id);
-- ... repeat for all tables

-- Create indexes
CREATE INDEX idx_patients_tenant_id ON patients(tenant_id);
CREATE INDEX idx_visits_tenant_id ON visits(tenant_id);
-- ... repeat for all tables

-- Update users table
ALTER TABLE users ADD COLUMN user_type VARCHAR(50) DEFAULT 'staff'; -- staff, patient, superadmin
ALTER TABLE users ADD COLUMN is_superadmin BOOLEAN DEFAULT false;
```

#### 3. Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tables

-- Superadmin can see everything
CREATE POLICY "Superadmin full access" ON patients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_superadmin = true
        )
    );

-- Tenant users can only see their tenant's data
CREATE POLICY "Tenant users access" ON patients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tenant_users
            WHERE tenant_users.user_id = auth.uid()
            AND tenant_users.tenant_id = patients.tenant_id
        )
    );

-- Patients can only see their own data
CREATE POLICY "Patients self access" ON patients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patient_users
            WHERE patient_users.user_id = auth.uid()
            AND patient_users.patient_id = patients.id
        )
    );
```

### Authentication Changes

#### New Auth Flow

```
STAFF LOGIN:
1. Enter email + password
2. Backend checks user type
3. If user belongs to multiple tenants → show tenant selection
4. Set session with tenant_id
5. All queries scoped to tenant_id

PATIENT LOGIN:
1. Toggle to "Patient Login"
2. Enter email/phone + OTP
3. Backend verifies patient_users table
4. Set session with patient_id + tenant_id
5. Redirect to patient portal

SUPERADMIN LOGIN:
1. Special email domain (e.g., @aisurgeonpilot.com)
2. Elevated privileges
3. Can impersonate tenants
4. Access to platform dashboard
```

### API Changes

#### Add Middleware for Tenant Scoping

```typescript
// Automatic tenant scoping for all queries
const getTenantId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get tenant_id from session or tenant_users
    const { data } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

    return data?.tenant_id;
};

// All queries automatically filtered
const getPatients = async () => {
    const tenantId = await getTenantId();
    return supabase
        .from('patients')
        .select('*')
        .eq('tenant_id', tenantId); // Auto-added
};
```

---

## Implementation Roadmap

### Phase 1: Database Multi-Tenancy (Days 1-2)
1. Create tenants table
2. Create tenant_users junction
3. Add tenant_id to all tables
4. Create RLS policies
5. Create superadmin user
6. Migration script

### Phase 2: Authentication Overhaul (Day 3)
1. Add user_type to users
2. Implement tenant selection
3. Add patient authentication
4. Create login toggle (staff/patient)
5. Session management with tenant_id

### Phase 3: Superadmin Dashboard (Day 4)
1. Tenant management UI
2. Create/edit/delete tenants
3. Tenant settings
4. Usage analytics
5. Subscription management

### Phase 4: Patient Portal (Days 5-6)
1. Patient registration page
2. Patient dashboard
3. Appointment booking
4. View medical records
5. View prescriptions
6. Payment history

### Phase 5: Email Integration (Day 7)
1. Setup email service (SendGrid/Resend)
2. Email templates
3. Appointment confirmations
4. Prescription delivery
5. Billing notifications

### Phase 6: WhatsApp + AI Bot (Days 8-9)
1. Enhance DoubleTick integration
2. Create conversation flows
3. AI bot with OpenAI
4. Appointment management via WhatsApp
5. Patient education

### Phase 7: Payment Gateway (Day 10)
1. Razorpay/Stripe integration
2. Payment flow for appointments
3. Payment confirmations
4. Refund handling

### Phase 8: Online Prescriptions (Day 11)
1. Prescription generation
2. PDF generation improvements
3. Automated email sending
4. Automated WhatsApp sending
5. Patient access via portal

### Phase 9: Testing & Polish (Days 12-13)
1. End-to-end testing
2. Security audit
3. Performance optimization
4. Documentation
5. Deployment

### Phase 10: Go-Live (Day 14)
1. Production deployment
2. Data migration (if needed)
3. Training materials
4. Support setup

---

## Security Considerations

1. **Data Isolation**: RLS policies enforce tenant boundaries
2. **Authentication**: Supabase Auth + custom user types
3. **Authorization**: Role-based access control per tenant
4. **API Security**: All endpoints check tenant_id
5. **Payment Security**: PCI-compliant payment gateway
6. **Data Encryption**: Sensitive data encrypted at rest
7. **Audit Logs**: Track all data access and modifications

---

## Scalability Considerations

1. **Database**: PostgreSQL can handle 1000+ tenants
2. **Indexing**: All foreign keys and filter columns indexed
3. **Caching**: React Query for client-side caching
4. **CDN**: Static assets served via CDN
5. **Horizontal Scaling**: Stateless frontend, scalable backend

---

## Cost Implications

### Per Tenant
- Database: ~$0.50-2/month (Supabase usage)
- Storage: ~$0.10-1/month (documents, images)
- Email: ~$0.10-1/month (SendGrid/Resend)
- WhatsApp: ~$0.50-2/month (DoubleTick)
- Payment: ~2-3% transaction fee

### Platform Level
- Supabase Pro: $25/month (up to 100k users)
- Email Service: $10-50/month (volume-based)
- WhatsApp API: $10-100/month (volume-based)
- Payment Gateway: Free (transaction-based fees)
- Hosting (Vercel): $20-100/month

---

## Next Steps

1. **Approve architecture** ✓
2. **Start Phase 1** → Create multi-tenant database
3. **Setup development environment**
4. **Begin implementation**

