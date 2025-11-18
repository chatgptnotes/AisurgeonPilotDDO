# 🎯 MASTER TODO: Digital Doctor Office (DDO) Implementation

## Project Overview
Building a multi-doctor appointment booking platform where:
- Each doctor gets a unique shareable link
- Patients register once, book with multiple doctors
- Full booking flow: Calendar → Payment → Notifications → AI-assisted consultations

**OpenAI API Key**: Add to `.env` file

---

## 📊 Implementation Strategy

### Phases Overview:
1. **Foundation (Week 1)**: Database, Auth, Core Models
2. **Booking Engine (Week 2)**: Calendar, Slots, Availability
3. **Payments & Notifications (Week 3)**: Payment gateway, Email, WhatsApp
4. **Doctor Features (Week 4)**: Onboarding, Dashboard, Settings
5. **AI Features (Week 5)**: Transcription, SOAP notes, Prescriptions
6. **Advanced Features (Week 6)**: Analytics, Admin, Support

---

## 🏗️ PHASE 1: FOUNDATION & CORE SETUP (Priority: CRITICAL)

### Epic DDO-E1: Foundation

#### ✅ DDO-S1.1: Infrastructure Setup
**Status**: Mostly Done ✅
- [x] Frontend repo with Vite + React + TypeScript
- [x] Supabase backend
- [x] Environment variables setup
- [ ] Add OpenAI API key to environment variables
- [ ] CI/CD pipeline (optional for now)

**Files to Update**:
```bash
.env.local
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

---

#### 🔴 DDO-S1.2: Multi-Tenant Data Model with RLS
**Status**: Partially Done 🟡
**Priority**: HIGH

**Database Tasks**:
- [x] Create `tenants` table (doctors are tenants)
- [x] Create `doctors` table with tenant_id
- [x] Create `patients` table (universal, no tenant_id)
- [x] Create `appointments` table with tenant_id
- [ ] Add `slug` column to doctors table (for custom links)
- [ ] Add RLS policies for all tables
- [ ] Test cross-tenant isolation

**SQL Script to Run**:
```sql
-- Add slug for custom doctor links
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_doctors_slug ON doctors(slug);

-- RLS Policies
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Doctors can only see their own data
CREATE POLICY "Doctors see own profile"
ON doctors FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Patients can only see their own appointments
CREATE POLICY "Patients see own appointments"
ON appointments FOR SELECT
TO authenticated
USING (patient_id IN (
  SELECT id FROM patients WHERE auth.uid() = user_id
));

-- Doctors see appointments for their tenant
CREATE POLICY "Doctors see own appointments"
ON appointments FOR SELECT
TO authenticated
USING (doctor_id IN (
  SELECT id FROM doctors WHERE auth.uid() = user_id
));
```

**Acceptance Criteria**:
- [ ] Each doctor has unique slug (e.g., "shwetha-dubai-dermat")
- [ ] RLS prevents cross-tenant data access
- [ ] Test: Doctor A cannot see Doctor B's appointments
- [ ] Test: Patient A cannot see Patient B's data

---

#### 🔴 DDO-S1.3: Authentication (OTP + Email/Password + TOTP)
**Status**: Partially Done 🟡
**Priority**: HIGH

**Tasks**:
- [x] Doctor login with email + password (Done)
- [ ] Patient login with Mobile OTP
- [ ] Email verification for patient signup
- [ ] TOTP (2FA) for doctors and admins (optional for MVP)

**Implementation**:

**1. Patient Mobile OTP Login** (`src/pages/PatientLogin.tsx`):
```typescript
// Use Supabase Phone Auth
const handleOTPLogin = async (phone: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: phone,
    options: {
      channel: 'sms', // or 'whatsapp'
    }
  });

  if (error) {
    toast.error('Failed to send OTP');
    return;
  }

  // Show OTP input screen
  setShowOTPInput(true);
};

const handleVerifyOTP = async (phone: string, otp: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phone,
    token: otp,
    type: 'sms'
  });

  if (error) {
    toast.error('Invalid OTP');
    return;
  }

  // Redirect to patient dashboard
  navigate('/patient-dashboard');
};
```

**2. Email Verification** (Update `PatientSignup.tsx`):
```typescript
const { data, error } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    emailRedirectTo: `${window.location.origin}/verify-email`,
  }
});

// Show: "Verification email sent. Please check your inbox."
```

**3. Better Email Template** (Supabase Dashboard → Auth → Email Templates):
```html
<h2>Welcome to AI Surgeon Pilot!</h2>
<p>Hi {{ .Name }},</p>
<p>Your unique Patient ID: <strong>{{ .PatientID }}</strong></p>
<p>Please verify your email to complete registration:</p>
<a href="{{ .ConfirmationURL }}">Verify Email</a>
<p>This link expires in 24 hours.</p>
```

**Files to Create/Update**:
- [ ] `src/pages/PatientLogin.tsx` - Add OTP flow
- [ ] `src/pages/PatientSignup.tsx` - Add email verification
- [ ] `src/pages/VerifyEmail.tsx` - Email verification success page
- [ ] Email templates in Supabase

**Acceptance Criteria**:
- [ ] Patients can login with phone OTP
- [ ] Email verification link works
- [ ] Verification email has custom template
- [ ] Unverified users cannot book appointments

---

#### 🔴 DDO-S1.4: Household Member Management
**Status**: Not Started ❌
**Priority**: MEDIUM (Can be Phase 2)

**Database Tasks**:
```sql
CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_user_id UUID REFERENCES auth.users(id) NOT NULL, -- The main account holder

  -- Member details
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20),
  relationship VARCHAR(50), -- 'self', 'spouse', 'child', 'parent', 'other'

  -- Medical info (stored separately per member)
  medical_history JSONB DEFAULT '[]'::jsonb,
  allergies TEXT[],
  current_medications TEXT[],

  -- Metadata
  is_primary BOOLEAN DEFAULT false, -- The account holder
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Each household member gets own patient record
ALTER TABLE patients ADD COLUMN household_member_id UUID REFERENCES household_members(id);
```

**UI Components**:
- [ ] `src/components/patient/HouseholdMemberSelector.tsx`
- [ ] `src/components/patient/AddFamilyMemberDialog.tsx`
- [ ] Update `PatientDashboardNew.tsx` to show member selector

**Acceptance Criteria**:
- [ ] One login manages multiple patient profiles
- [ ] "My Appointments" shows which member each booking is for
- [ ] Each member has separate medical history
- [ ] Can add child/parent/spouse profiles

---

## 🏗️ PHASE 2: DOCTOR ONBOARDING & SETUP

### Epic DDO-E2: Doctor Setup & Configuration

#### 🔴 DDO-S2.1: Doctor Onboarding Wizard
**Status**: Not Started ❌
**Priority**: HIGH

**Tasks**:
- [ ] Create multi-step onboarding wizard
- [ ] Basic info: Name, specialization, registration number
- [ ] Light KYC: Upload license, credentials
- [ ] Profile photo upload
- [ ] Generate unique slug for shareable link

**Files to Create**:
```
src/pages/doctor/DoctorOnboarding.tsx
src/components/doctor/OnboardingWizard.tsx
  ├── Step1BasicInfo.tsx
  ├── Step2Specialization.tsx
  ├── Step3KYC.tsx
  ├── Step4ProfilePhoto.tsx
  └── Step5Complete.tsx
```

**Implementation**:
```typescript
// src/pages/doctor/DoctorOnboarding.tsx
const steps = [
  {
    title: 'Basic Information',
    component: <Step1BasicInfo />,
    fields: ['full_name', 'email', 'phone', 'registration_number']
  },
  {
    title: 'Specialization',
    component: <Step2Specialization />,
    fields: ['specialties', 'qualifications', 'experience_years']
  },
  {
    title: 'KYC & Verification',
    component: <Step3KYC />,
    fields: ['license_upload', 'credentials_upload']
  },
  {
    title: 'Profile & Branding',
    component: <Step4ProfilePhoto />,
    fields: ['profile_photo', 'bio', 'slug']
  }
];

// Generate slug from name
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};
// "Dr. Shwetha Dubai Dermat" → "dr-shwetha-dubai-dermat"
```

**Database**:
```sql
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS kyc_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
```

**Acceptance Criteria**:
- [ ] Wizard completable in under 5 minutes
- [ ] Incomplete onboarding is resumable
- [ ] Slug is auto-generated from name (editable)
- [ ] Admin can view KYC status
- [ ] Shareable link: `https://yourdomain.com/dr/{slug}`

---

#### 🔴 DDO-S2.2: Doctor Office Configuration
**Status**: Not Started ❌
**Priority**: HIGH

**Tasks**:
- [ ] Configure fees per consultation type
- [ ] Set follow-up window and fee
- [ ] Define consultation types (Tele/Clinic/Home)

**Database**:
```sql
CREATE TABLE consultation_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id) NOT NULL,

  type VARCHAR(50) NOT NULL, -- 'teleconsult', 'in_person', 'home_visit'
  name VARCHAR(255), -- Display name
  description TEXT,

  -- Pricing
  fee DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',

  -- Duration
  duration_minutes INTEGER DEFAULT 30,

  -- Availability
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(doctor_id, type)
);

-- Doctor settings
CREATE TABLE doctor_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id) NOT NULL UNIQUE,

  -- Follow-up
  followup_window_days INTEGER DEFAULT 7, -- Free follow-up within 7 days
  followup_fee DECIMAL(10,2) DEFAULT 0,

  -- Payment
  payment_provider VARCHAR(50) DEFAULT 'razorpay',
  payment_account_id VARCHAR(255),

  -- Refund policy
  cancellation_hours INTEGER DEFAULT 24, -- Can cancel up to 24h before
  refund_percentage INTEGER DEFAULT 100, -- 100% refund if within policy

  -- Timezone
  timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',

  settings JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**UI Component**:
```
src/pages/doctor/DoctorSettings.tsx
  ├── ConsultationTypeSettings.tsx
  ├── PricingSettings.tsx
  └── PolicySettings.tsx
```

**Acceptance Criteria**:
- [ ] Doctor can set different fees per consultation type
- [ ] Follow-up window applies automatically in booking
- [ ] Correct fee used through booking and invoicing
- [ ] Settings persisted and loaded correctly

---

#### 🔴 DDO-S2.3: Branding, Letterhead & Digital Signature
**Status**: Not Started ❌
**Priority**: MEDIUM

**Database**:
```sql
ALTER TABLE doctors ADD COLUMN letterhead_url TEXT;
ALTER TABLE doctors ADD COLUMN signature_url TEXT;
ALTER TABLE doctors ADD COLUMN clinic_logo_url TEXT;
```

**Files to Create**:
```
src/components/doctor/BrandingUpload.tsx
src/utils/pdfGenerator.ts
```

**Implementation**:
```typescript
// Upload to Supabase Storage
const uploadLetterhead = async (file: File, doctorId: string) => {
  const { data, error } = await supabase.storage
    .from('doctor-branding')
    .upload(`${doctorId}/letterhead.pdf`, file);

  if (!error) {
    // Update doctor record
    await supabase
      .from('doctors')
      .update({ letterhead_url: data.path })
      .eq('id', doctorId);
  }
};
```

**Acceptance Criteria**:
- [ ] Doctor can upload letterhead PDF
- [ ] Doctor can upload signature image (PNG/JPG)
- [ ] PDFs render with correct header/footer/signature
- [ ] Default template used if no custom letterhead

---

#### 🔴 DDO-S2.4: Subscription Plans (Optional for MVP)
**Status**: Not Started ❌
**Priority**: LOW (Can skip for MVP)

---

#### 🔴 DDO-S2.5: Tenant Settings & Feature Flags (Optional)
**Status**: Not Started ❌
**Priority**: LOW (Can skip for MVP)

---

## 🏗️ PHASE 3: AVAILABILITY & SLOT MANAGEMENT

### Epic DDO-E3: Doctor Availability & Slots

#### 🔴 DDO-S3.1: Working Hours, Slots, Buffers, Blackouts
**Status**: Partially Done (Table exists) 🟡
**Priority**: CRITICAL

**Database** (Already exists, needs enhancements):
```sql
-- Enhance doctor_availability table
ALTER TABLE doctor_availability ADD COLUMN IF NOT EXISTS slot_duration_minutes INTEGER DEFAULT 30;
ALTER TABLE doctor_availability ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER DEFAULT 5;
ALTER TABLE doctor_availability ADD COLUMN IF NOT EXISTS max_appointments_per_day INTEGER;

-- Create blackout dates table
CREATE TABLE doctor_blackout_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id) NOT NULL,

  date DATE NOT NULL,
  reason VARCHAR(255),
  is_recurring BOOLEAN DEFAULT false, -- For holidays

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(doctor_id, date)
);

CREATE INDEX idx_blackout_doctor_date ON doctor_blackout_dates(doctor_id, date);
```

**UI Components**:
```
src/pages/doctor/AvailabilitySettings.tsx
  ├── WeeklySchedule.tsx        // Set working hours per day
  ├── SlotConfiguration.tsx     // Duration, buffer
  ├── BlackoutDates.tsx          // Mark unavailable dates
  └── DailyCapSettings.tsx       // Max appointments per day
```

**Implementation**:
```typescript
// src/pages/doctor/AvailabilitySettings.tsx
interface WeeklySchedule {
  monday: { enabled: boolean; slots: TimeSlot[] };
  tuesday: { enabled: boolean; slots: TimeSlot[] };
  // ... other days
}

interface TimeSlot {
  start_time: string; // "09:00"
  end_time: string;   // "17:00"
  slot_duration: number; // 30 minutes
  buffer: number; // 5 minutes
}

const saveAvailability = async (schedule: WeeklySchedule) => {
  // Save to doctor_availability table
  for (const [day, config] of Object.entries(schedule)) {
    await supabase
      .from('doctor_availability')
      .upsert({
        doctor_id: doctorId,
        day_of_week: day,
        is_available: config.enabled,
        start_time: config.slots[0].start_time,
        end_time: config.slots[0].end_time,
        slot_duration_minutes: config.slots[0].slot_duration,
        buffer_minutes: config.slots[0].buffer
      });
  }
};
```

**Acceptance Criteria**:
- [ ] Doctor can set working hours for each day
- [ ] Slot duration configurable (15/30/45/60 minutes)
- [ ] Buffer time between appointments
- [ ] Blackout dates appear as unavailable
- [ ] Daily cap limits number of bookings
- [ ] Preview calendar shows generated slots

---

#### 🔴 DDO-S3.2: Slot Generation & Availability API
**Status**: Not Started ❌
**Priority**: CRITICAL

**Create API Endpoint**:
```
src/services/slotGenerationService.ts
```

**Implementation**:
```typescript
// src/services/slotGenerationService.ts
interface GenerateSlotParams {
  doctorId: string;
  date: Date;
  consultationType: 'teleconsult' | 'in_person' | 'home_visit';
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  appointment_id?: string; // If booked
}

export const generateAvailableSlots = async ({
  doctorId,
  date,
  consultationType
}: GenerateSlotParams): Promise<TimeSlot[]> => {

  // 1. Get doctor availability for this day
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });

  const { data: availability } = await supabase
    .from('doctor_availability')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true)
    .single();

  if (!availability) return []; // Doctor not available this day

  // 2. Check for blackout dates
  const { data: blackout } = await supabase
    .from('doctor_blackout_dates')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('date', date.toISOString().split('T')[0])
    .single();

  if (blackout) return []; // Doctor blocked this date

  // 3. Get existing appointments for this date
  const { data: existingAppointments } = await supabase
    .from('appointments')
    .select('start_at, end_at, status')
    .eq('doctor_id', doctorId)
    .gte('start_at', `${date.toISOString().split('T')[0]}T00:00:00`)
    .lte('start_at', `${date.toISOString().split('T')[0]}T23:59:59`)
    .in('status', ['confirmed', 'scheduled', 'in_progress']);

  // 4. Generate slots
  const slots: TimeSlot[] = [];
  const slotDuration = availability.slot_duration_minutes;
  const buffer = availability.buffer_minutes || 0;

  let currentTime = parseTime(availability.start_time);
  const endTime = parseTime(availability.end_time);

  while (currentTime < endTime) {
    const slotStart = currentTime;
    const slotEnd = addMinutes(currentTime, slotDuration);

    // Check if slot is booked
    const isBooked = existingAppointments?.some(apt => {
      const aptStart = new Date(apt.start_at);
      const aptEnd = new Date(apt.end_at);
      return (slotStart >= aptStart && slotStart < aptEnd) ||
             (slotEnd > aptStart && slotEnd <= aptEnd);
    });

    slots.push({
      start_time: formatTime(slotStart),
      end_time: formatTime(slotEnd),
      is_available: !isBooked
    });

    // Move to next slot (with buffer)
    currentTime = addMinutes(slotEnd, buffer);
  }

  return slots;
};

// Helper functions
const parseTime = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60000);
};

const formatTime = (date: Date): string => {
  return date.toTimeString().slice(0, 5); // "HH:MM"
};
```

**Acceptance Criteria**:
- [ ] API returns only free slots
- [ ] Performance P95 < 300ms for one-day range
- [ ] Overlapping bookings prevented
- [ ] Unit tests cover edge cases
- [ ] Works for all consultation types

---

## 🏗️ PHASE 4: BOOKING FLOW & PATIENT UX

### Epic DDO-E4: Booking Core

#### 🔴 DDO-S4.1: Checkout & Booking with Slot Locking
**Status**: Partially Done (Basic booking exists) 🟡
**Priority**: CRITICAL

**Database** (Add optimistic locking):
```sql
-- Add slot locking mechanism
CREATE TABLE slot_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id) NOT NULL,
  start_at TIMESTAMP NOT NULL,
  end_at TIMESTAMP NOT NULL,

  locked_by_session VARCHAR(255) NOT NULL, -- Session ID
  locked_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL, -- Lock expires in 10 minutes

  UNIQUE(doctor_id, start_at)
);

CREATE INDEX idx_slot_locks_expires ON slot_locks(expires_at);

-- Add idempotency key to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255) UNIQUE;
```

**Implementation**:
```typescript
// src/services/bookingService.ts

// Step 1: Lock the slot (when user clicks on time)
export const lockSlot = async (
  doctorId: string,
  startAt: Date,
  endAt: Date,
  sessionId: string
): Promise<{ success: boolean; lockId?: string }> => {

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    const { data, error } = await supabase
      .from('slot_locks')
      .insert({
        doctor_id: doctorId,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        locked_by_session: sessionId,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      // Slot already locked
      return { success: false };
    }

    return { success: true, lockId: data.id };
  } catch (err) {
    return { success: false };
  }
};

// Step 2: Create appointment (after payment)
export const createAppointment = async (
  appointmentData: AppointmentData,
  idempotencyKey: string
): Promise<{ success: boolean; appointmentId?: string }> => {

  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        ...appointmentData,
        idempotency_key: idempotencyKey,
        status: 'confirmed' // Only after payment
      })
      .select()
      .single();

    if (error) {
      // Duplicate idempotency key = already created
      if (error.code === '23505') {
        return { success: true, appointmentId: 'duplicate' };
      }
      return { success: false };
    }

    // Release the lock
    await supabase
      .from('slot_locks')
      .delete()
      .eq('doctor_id', appointmentData.doctor_id)
      .eq('start_at', appointmentData.start_at);

    return { success: true, appointmentId: data.id };
  } catch (err) {
    return { success: false };
  }
};

// Cleanup expired locks (run via cron)
export const cleanupExpiredLocks = async () => {
  await supabase
    .from('slot_locks')
    .delete()
    .lt('expires_at', new Date().toISOString());
};
```

**Acceptance Criteria**:
- [ ] No double booking for same slot
- [ ] Double-click doesn't create duplicate appointments
- [ ] Failed payments don't create confirmed appointments
- [ ] Slots locked for 10 minutes during checkout
- [ ] Idempotency prevents duplicate submissions

---

#### 🔴 DDO-S4.2: Payment Integration (Razorpay)
**Status**: Not Started ❌
**Priority**: CRITICAL

**Setup**:
1. Sign up for Razorpay: https://razorpay.com/
2. Get API keys (Test mode first)
3. Add to environment

**Install Package**:
```bash
npm install razorpay
```

**Backend Service** (`src/services/paymentService.ts` - already exists, enhance it):
```typescript
// src/services/paymentService.ts
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: import.meta.env.VITE_RAZORPAY_KEY_ID,
  key_secret: import.meta.env.VITE_RAZORPAY_KEY_SECRET,
});

interface CreateOrderParams {
  amount: number; // in paise (100 = ₹1)
  currency: string;
  appointmentId: string;
  patientEmail: string;
}

export const createPaymentOrder = async ({
  amount,
  currency = 'INR',
  appointmentId,
  patientEmail
}: CreateOrderParams) => {

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `apt_${appointmentId}`,
      notes: {
        appointment_id: appointmentId,
        patient_email: patientEmail
      }
    });

    // Store payment record
    const { data: payment } = await supabase
      .from('payments')
      .insert({
        appointment_id: appointmentId,
        provider: 'razorpay',
        provider_order_id: order.id,
        amount: amount,
        currency: currency,
        status: 'pending'
      })
      .select()
      .single();

    return { success: true, order, paymentId: payment.id };
  } catch (error) {
    console.error('Payment order creation failed:', error);
    return { success: false, error };
  }
};

export const verifyPayment = async (
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string,
  paymentId: string
) => {

  // Verify signature
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', import.meta.env.VITE_RAZORPAY_KEY_SECRET);
  hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
  const generatedSignature = hmac.digest('hex');

  if (generatedSignature !== razorpaySignature) {
    return { success: false, error: 'Invalid signature' };
  }

  // Update payment status
  const { data: payment, error } = await supabase
    .from('payments')
    .update({
      provider_payment_id: razorpayPaymentId,
      status: 'paid',
      paid_at: new Date().toISOString()
    })
    .eq('id', paymentId)
    .select()
    .single();

  if (error) return { success: false, error };

  // Confirm appointment
  await supabase
    .from('appointments')
    .update({ status: 'confirmed' })
    .eq('id', payment.appointment_id);

  return { success: true, payment };
};
```

**Database**:
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) NOT NULL,

  -- Provider details
  provider VARCHAR(50) NOT NULL, -- 'razorpay', 'stripe'
  provider_order_id VARCHAR(255),
  provider_payment_id VARCHAR(255),

  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',

  -- Status
  status VARCHAR(50) NOT NULL, -- 'pending', 'paid', 'failed', 'refunded'
  paid_at TIMESTAMP,

  -- Raw data
  provider_response JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_appointment ON payments(appointment_id);
CREATE INDEX idx_payments_status ON payments(status);
```

**Frontend Component**:
```typescript
// src/components/booking/PaymentCheckout.tsx
import { useRazorpay, RazorpayOrderOptions } from 'react-razorpay';

const PaymentCheckout = ({ appointment, amount }) => {
  const { Razorpay } = useRazorpay();

  const handlePayment = async () => {
    // Create order
    const { order, paymentId } = await createPaymentOrder({
      amount,
      currency: 'INR',
      appointmentId: appointment.id,
      patientEmail: patient.email
    });

    // Open Razorpay
    const options: RazorpayOrderOptions = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'AI Surgeon Pilot',
      description: `Consultation with ${doctor.name}`,
      order_id: order.id,

      handler: async (response) => {
        // Verify payment
        const result = await verifyPayment(
          response.razorpay_payment_id,
          response.razorpay_order_id,
          response.razorpay_signature,
          paymentId
        );

        if (result.success) {
          toast.success('Payment successful!');
          navigate(`/appointment-confirmation/${appointment.id}`);
        } else {
          toast.error('Payment verification failed');
        }
      },

      prefill: {
        name: patient.name,
        email: patient.email,
        contact: patient.phone
      },

      theme: {
        color: '#3B82F6'
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  };

  return (
    <Button onClick={handlePayment}>
      Pay ₹{amount}
    </Button>
  );
};
```

**Acceptance Criteria**:
- [ ] Successful payment sets status=paid
- [ ] Successful payment confirms appointment
- [ ] Failed payments show errors
- [ ] Provider response stored for audit
- [ ] Razorpay test mode works

---

#### 🔴 DDO-S4.3: Reschedule Flow
**Status**: Not Started ❌
**Priority**: MEDIUM

**Files to Create**:
```
src/components/appointments/RescheduleDialog.tsx
src/services/rescheduleService.ts
```

**Implementation**:
```typescript
// src/services/rescheduleService.ts
export const rescheduleAppointment = async (
  appointmentId: string,
  newStartAt: Date,
  newEndAt: Date
): Promise<{ success: boolean; error?: string }> => {

  // 1. Check if reschedule is allowed (cut-off time)
  const { data: appointment } = await supabase
    .from('appointments')
    .select('*, doctor:doctors(doctor_settings(*))')
    .eq('id', appointmentId)
    .single();

  const cutoffHours = appointment.doctor.doctor_settings.cancellation_hours || 24;
  const hoursUntilAppointment = (new Date(appointment.start_at).getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilAppointment < cutoffHours) {
    return {
      success: false,
      error: `Reschedule not allowed within ${cutoffHours} hours of appointment`
    };
  }

  // 2. Lock new slot
  const sessionId = crypto.randomUUID();
  const lockResult = await lockSlot(
    appointment.doctor_id,
    newStartAt,
    newEndAt,
    sessionId
  );

  if (!lockResult.success) {
    return { success: false, error: 'Selected slot is no longer available' };
  }

  // 3. Update appointment
  const { data: updated, error } = await supabase
    .from('appointments')
    .update({
      start_at: newStartAt.toISOString(),
      end_at: newEndAt.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // 4. Log in audit trail
  await supabase
    .from('audit_log')
    .insert({
      entity_type: 'appointment',
      entity_id: appointmentId,
      action: 'rescheduled',
      old_value: { start_at: appointment.start_at },
      new_value: { start_at: newStartAt.toISOString() }
    });

  // 5. Send notifications
  await sendRescheduleNotification(updated);

  return { success: true };
};
```

**Acceptance Criteria**:
- [ ] Patient can reschedule within cut-off
- [ ] Attempts inside cut-off show error
- [ ] Rescheduled appointments maintain history
- [ ] Reschedule actions logged in AuditLog
- [ ] Email/WhatsApp sent with new time

---

#### 🔴 DDO-S4.4: Cancel & Refund Flow
**Status**: Not Started ❌
**Priority**: MEDIUM

**Implementation**:
```typescript
// src/services/refundService.ts
export const cancelAndRefund = async (
  appointmentId: string,
  cancelledBy: 'patient' | 'doctor'
): Promise<{ success: boolean; refundAmount?: number }> => {

  // 1. Get appointment and payment
  const { data: appointment } = await supabase
    .from('appointments')
    .select('*, payment:payments(*), doctor:doctors(doctor_settings(*))')
    .eq('id', appointmentId)
    .single();

  // 2. Check refund policy
  const settings = appointment.doctor.doctor_settings;
  const hoursUntilAppointment = (new Date(appointment.start_at).getTime() - Date.now()) / (1000 * 60 * 60);

  let refundPercentage = 0;
  if (hoursUntilAppointment >= settings.cancellation_hours) {
    refundPercentage = settings.refund_percentage || 100;
  }

  const refundAmount = (appointment.payment.amount * refundPercentage) / 100;

  // 3. Process refund via Razorpay
  if (refundAmount > 0 && appointment.payment.provider_payment_id) {
    const refund = await razorpay.payments.refund(
      appointment.payment.provider_payment_id,
      {
        amount: refundAmount * 100, // paise
        notes: {
          reason: `Cancelled by ${cancelledBy}`,
          appointment_id: appointmentId
        }
      }
    );

    // Update payment record
    await supabase
      .from('payments')
      .update({
        status: 'refunded',
        provider_response: refund
      })
      .eq('id', appointment.payment.id);
  }

  // 4. Cancel appointment
  await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
      cancellation_reason: `Cancelled by ${cancelledBy}`
    })
    .eq('id', appointmentId);

  // 5. Send notification
  await sendCancellationNotification(appointment, refundAmount);

  return { success: true, refundAmount };
};
```

**Acceptance Criteria**:
- [ ] Cancellation UI for patient and doctor
- [ ] Refunds executed via Razorpay
- [ ] Cancellation/refund emails sent
- [ ] Actions logged in AuditLog
- [ ] Refund amount shown accurately

---

#### 🔴 DDO-S4.5: No-Show Handling
**Status**: Not Started ❌
**Priority**: LOW

---

### Epic DDO-E5: Patient Experience

#### 🔴 DDO-S5.1: Public Doctor Profile
**Status**: Done ✅
**Priority**: HIGH

- [x] DoctorProfile.tsx exists
- [ ] Add shareable link with slug: `/dr/{slug}`

---

#### 🔴 DDO-S5.2: Drilling Calendar for Slot Selection
**Status**: Not Started ❌
**Priority**: CRITICAL

**Install Calendar Package**:
```bash
npm install react-big-calendar date-fns
```

**Create Component**:
```
src/components/booking/DrillingCalendar.tsx
  ├── DatePicker.tsx (Step 1: Choose date)
  └── TimeSlotPicker.tsx (Step 2: Choose time)
```

**Implementation**:
```typescript
// src/components/booking/DrillingCalendar.tsx
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';

const DrillingCalendar = ({ doctorId, consultationType, onSlotSelect }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Step 1: Date Selection
  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);
    setLoading(true);

    // Fetch available slots for this date
    const slots = await generateAvailableSlots({
      doctorId,
      date,
      consultationType
    });

    setAvailableSlots(slots);
    setLoading(false);
  };

  // Step 2: Time Slot Selection
  const handleSlotSelect = async (slot: TimeSlot) => {
    // Lock the slot
    const sessionId = crypto.randomUUID();
    const lockResult = await lockSlot(
      doctorId,
      new Date(`${selectedDate}T${slot.start_time}`),
      new Date(`${selectedDate}T${slot.end_time}`),
      sessionId
    );

    if (lockResult.success) {
      onSlotSelect({
        date: selectedDate,
        startTime: slot.start_time,
        endTime: slot.end_time,
        lockId: lockResult.lockId
      });
    } else {
      toast.error('This slot is no longer available');
      // Refresh slots
      handleDateSelect(selectedDate);
    }
  };

  return (
    <div className="drilling-calendar">
      {!selectedDate ? (
        // Step 1: Choose Date
        <div className="date-picker">
          <h3>Choose a Date</h3>
          <Calendar
            localizer={localizer}
            startAccessor="start"
            endAccessor="end"
            onSelectSlot={handleDateSelect}
            selectable
            views={['month']}
            min={new Date()} // Can't book in past
            max={addMonths(new Date(), 3)} // Can book up to 3 months ahead
          />
        </div>
      ) : (
        // Step 2: Choose Time
        <div className="time-picker">
          <h3>Choose a Time on {format(selectedDate, 'MMMM dd, yyyy')}</h3>
          <Button variant="ghost" onClick={() => setSelectedDate(null)}>
            ← Change Date
          </Button>

          {loading ? (
            <div>Loading available slots...</div>
          ) : availableSlots.length === 0 ? (
            <div>No slots available on this date</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map(slot => (
                <Button
                  key={slot.start_time}
                  variant={slot.is_available ? 'outline' : 'ghost'}
                  disabled={!slot.is_available}
                  onClick={() => handleSlotSelect(slot)}
                  className={cn(
                    'h-12',
                    slot.is_available ? 'hover:bg-blue-50' : 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {slot.start_time}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

**Acceptance Criteria**:
- [ ] Step 1: Choose date from calendar
- [ ] Step 2: See available time slots for chosen date
- [ ] Booked slots shown as unavailable
- [ ] Blackout dates not selectable
- [ ] Smooth transition between steps
- [ ] Mobile responsive

---

#### 🔴 DDO-S5.3: Checkout with Price Breakdown
**Status**: Not Started ❌
**Priority**: HIGH

**Create Component**:
```
src/pages/CheckoutPage.tsx
```

**Implementation**:
```typescript
// src/pages/CheckoutPage.tsx
const CheckoutPage = () => {
  const { appointmentId } = useParams();
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { data: appointment } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*, doctor:doctors(*), consultation_type:consultation_types(*)')
        .eq('id', appointmentId)
        .single();
      return data;
    }
  });

  // Check if follow-up pricing applies
  const isFollowUp = useMemo(() => {
    // Check if patient had appointment with same doctor within follow-up window
    const followupWindow = appointment?.doctor?.doctor_settings?.followup_window_days || 7;
    // ... logic to check previous appointments
    return false; // or true
  }, [appointment]);

  const baseAmount = isFollowUp
    ? appointment?.doctor?.doctor_settings?.followup_fee || 0
    : appointment?.consultation_type?.fee || 0;

  const discountAmount = (baseAmount * discount) / 100;
  const finalAmount = baseAmount - discountAmount;

  const handleApplyCoupon = async () => {
    // Validate coupon
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (coupon) {
      setDiscount(coupon.discount_percentage);
      toast.success(`Coupon applied! ${coupon.discount_percentage}% off`);
    } else {
      toast.error('Invalid coupon code');
    }
  };

  return (
    <div className="checkout-page max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Complete Your Booking</h1>

      {/* Appointment Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Doctor:</span>
              <span className="font-semibold">{appointment?.doctor?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <span>{appointment?.consultation_type?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Date & Time:</span>
              <span>{format(new Date(appointment?.start_at), 'MMM dd, yyyy - h:mm a')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Price Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Consultation Fee:</span>
            <span>₹{baseAmount}</span>
          </div>

          {isFollowUp && (
            <div className="flex justify-between text-green-600">
              <span>Follow-up Discount:</span>
              <span>Applied ✓</span>
            </div>
          )}

          {/* Coupon Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            />
            <Button variant="outline" onClick={handleApplyCoupon}>
              Apply
            </Button>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({discount}%):</span>
              <span>-₹{discountAmount}</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between text-xl font-bold">
            <span>Total Amount:</span>
            <span>₹{finalAmount}</span>
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={setAgreedToTerms}
            />
            <label htmlFor="terms" className="text-sm">
              I agree to the{' '}
              <a href="/terms" className="text-blue-600 underline">
                Terms & Conditions
              </a>{' '}
              and medical disclaimer. I understand this is a consultation and not a diagnosis.
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Payment Button */}
      <PaymentCheckout
        appointment={appointment}
        amount={finalAmount}
        disabled={!agreedToTerms}
      />
    </div>
  );
};
```

**Database** (Coupons):
```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,

  discount_percentage INTEGER NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,

  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW()
);
```

**Acceptance Criteria**:
- [ ] Price breakdown shows all components
- [ ] Coupon codes validate and adjust price
- [ ] Follow-up pricing applies automatically
- [ ] Terms must be accepted to proceed
- [ ] Final amount matches payment

---

#### 🔴 DDO-S5.4: Patient "My Appointments" View
**Status**: Partially Done 🟡
**Priority**: HIGH

- [x] PatientDashboardNew.tsx exists
- [ ] Add household member filter
- [ ] Show upcoming and past appointments
- [ ] Prevent URL tampering (RLS)

---

## 🏗️ PHASE 5: ENHANCED PATIENT SIGNUP

#### 🔴 Enhanced Patient Signup (Your Requirement)
**Status**: Not Started ❌
**Priority**: CRITICAL

**Update PatientSignup.tsx**:
```typescript
// src/pages/PatientSignup.tsx
interface PatientSignupForm {
  // Auth
  email: string;
  password: string;
  confirmPassword: string;

  // Personal Details (Required)
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: Date;

  // Medical Details (Required)
  age: number;
  sex: 'male' | 'female' | 'other';
  weight: number; // kg
  height: number; // cm
  blood_group?: string;

  // Additional
  allergies?: string[];
  current_medications?: string[];
}

const PatientSignup = () => {
  const [formData, setFormData] = useState<PatientSignupForm>({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: new Date(),
    age: 0,
    sex: 'male',
    weight: 0,
    height: 0
  });

  const generatePatientId = (): string => {
    // Format: P + Timestamp (e.g., P1731567890123)
    // OR Format: P + Sequential (e.g., P000001)
    const timestamp = Date.now();
    return `P${timestamp}`;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Generate unique patient ID
    const patientId = generatePatientId();

    try {
      // 1. Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
          data: {
            patient_id: patientId,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone
          }
        }
      });

      if (authError) throw authError;

      // 2. Create patient profile
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          id: authData.user.id, // Link to auth user
          patients_id: patientId, // Display ID
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          date_of_birth: formData.date_of_birth.toISOString(),
          age: formData.age,
          gender: formData.sex,
          weight_kg: formData.weight,
          height_cm: formData.height,
          blood_group: formData.blood_group,
          allergies: formData.allergies,
          current_medications: formData.current_medications
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // 3. Show success message
      toast.success('Account created successfully! Please verify your email.');

      // 4. Navigate to verification page
      navigate('/verify-email', {
        state: { email: formData.email, patientId }
      });

    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Signup failed. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create Your Account</h1>

      <form onSubmit={handleSignup} className="space-y-6">
        {/* Auth Section */}
        <Card>
          <CardHeader>
            <CardTitle>Login Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email*</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password*</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password*</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Personal Details */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name*</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="last_name">Last Name*</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number*</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div>
              <Label htmlFor="dob">Date of Birth*</Label>
              <Input
                id="dob"
                type="date"
                value={format(formData.date_of_birth, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const dob = new Date(e.target.value);
                  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                  setFormData({ ...formData, date_of_birth: dob, age });
                }}
                required
              />
              <p className="text-sm text-gray-500 mt-1">Age: {formData.age} years</p>
            </div>
          </CardContent>
        </Card>

        {/* Medical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Sex*</Label>
              <RadioGroup
                value={formData.sex}
                onValueChange={(value) => setFormData({ ...formData, sex: value as any })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Weight (kg)*</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  required
                  min="1"
                  max="300"
                />
              </div>

              <div>
                <Label htmlFor="height">Height (cm)*</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
                  required
                  min="1"
                  max="300"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="blood_group">Blood Group (Optional)</Label>
              <Select
                value={formData.blood_group}
                onValueChange={(value) => setFormData({ ...formData, blood_group: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button type="submit" className="w-full" size="lg">
          Create Account
        </Button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Login
          </a>
        </p>
      </form>
    </div>
  );
};
```

**Database Updates**:
```sql
-- Update patients table schema
ALTER TABLE patients ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,2);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies TEXT[];
ALTER TABLE patients ADD COLUMN IF NOT EXISTS current_medications TEXT[];
```

**Acceptance Criteria**:
- [ ] All required fields captured (email, password, age, sex, weight, height, phone)
- [ ] Unique patient ID generated (format: P + timestamp)
- [ ] Email verification sent after signup
- [ ] Better email template with patient ID
- [ ] Form validates all inputs
- [ ] Age auto-calculated from DOB

---

## 🏗️ PHASE 6: NOTIFICATIONS

### Epic DDO-E10: Email & WhatsApp

#### 🔴 DDO-S10.1: Email Infrastructure
**Status**: Partially Done (Email service exists) 🟡
**Priority**: HIGH

**Update Email Templates**:

**1. Booking Confirmation Email**:
```html
<!-- Email Template -->
Subject: Appointment Confirmed - {{doctor_name}}

Hi {{patient_name}},

Your appointment has been confirmed!

📅 Date: {{appointment_date}}
🕐 Time: {{appointment_time}}
👨‍⚕️ Doctor: {{doctor_name}}
💊 Type: {{consultation_type}}

📍 {{meeting_link_or_address}}

Your Patient ID: {{patient_id}}
Booking ID: {{appointment_id}}

[Add to Calendar] (ICS attachment)

Need to reschedule? {{reschedule_link}}

Questions? Reply to this email.

Best regards,
{{doctor_name}}'s Office
```

**2. Calendar Invite (ICS)**:
```typescript
// src/services/calendarService.ts
import { createEvents, DateArray } from 'ics';

export const generateICS = (appointment: Appointment): string => {
  const start: DateArray = [
    new Date(appointment.start_at).getFullYear(),
    new Date(appointment.start_at).getMonth() + 1,
    new Date(appointment.start_at).getDate(),
    new Date(appointment.start_at).getHours(),
    new Date(appointment.start_at).getMinutes()
  ];

  const duration = {
    minutes: appointment.duration_minutes || 30
  };

  const event = {
    start,
    duration,
    title: `Consultation with ${appointment.doctor.full_name}`,
    description: `Type: ${appointment.consultation_type}\nPatient: ${appointment.patient.name}`,
    location: appointment.meeting_link || appointment.doctor.clinic_address,
    url: appointment.meeting_link,
    organizer: {
      name: appointment.doctor.full_name,
      email: appointment.doctor.email
    },
    attendees: [
      {
        name: appointment.patient.name,
        email: appointment.patient.email,
        rsvp: true
      }
    ]
  };

  const { error, value } = createEvents([event]);

  if (error) {
    console.error('ICS generation error:', error);
    return '';
  }

  return value;
};
```

**Acceptance Criteria**:
- [ ] Emails deliver reliably
- [ ] Templates support branding
- [ ] ICS attachments work in major calendar apps
- [ ] Doctor is organizer, patient is attendee

---

#### 🔴 DDO-S10.2: Reminder Scheduling
**Status**: Not Started ❌
**Priority**: MEDIUM

**Create Job Queue** (Use Supabase Edge Functions or cron jobs):

```sql
CREATE TABLE scheduled_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) NOT NULL,

  reminder_type VARCHAR(50) NOT NULL, -- 't_24h', 't_3h', 't_30m'
  scheduled_at TIMESTAMP NOT NULL,

  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMP,
  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reminders_scheduled ON scheduled_reminders(scheduled_at, status);
```

**Implementation**:
```typescript
// src/services/reminderService.ts
export const scheduleReminders = async (appointment: Appointment) => {
  const reminders = [
    { type: 't_24h', hours: 24 },
    { type: 't_3h', hours: 3 },
    { type: 't_30m', minutes: 30 }
  ];

  for (const reminder of reminders) {
    const scheduledAt = new Date(appointment.start_at);

    if (reminder.hours) {
      scheduledAt.setHours(scheduledAt.getHours() - reminder.hours);
    } else if (reminder.minutes) {
      scheduledAt.setMinutes(scheduledAt.getMinutes() - reminder.minutes);
    }

    await supabase
      .from('scheduled_reminders')
      .insert({
        appointment_id: appointment.id,
        reminder_type: reminder.type,
        scheduled_at: scheduledAt.toISOString()
      });
  }
};

// Cron job (run every 5 minutes)
export const processPendingReminders = async () => {
  const now = new Date();

  const { data: pendingReminders } = await supabase
    .from('scheduled_reminders')
    .select('*, appointment:appointments(*)')
    .eq('status', 'pending')
    .lte('scheduled_at', now.toISOString())
    .limit(100);

  for (const reminder of pendingReminders || []) {
    try {
      // Send email
      await sendReminderEmail(reminder.appointment);

      // Send WhatsApp
      await sendReminderWhatsApp(reminder.appointment);

      // Mark as sent
      await supabase
        .from('scheduled_reminders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', reminder.id);

    } catch (error) {
      // Mark as failed
      await supabase
        .from('scheduled_reminders')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', reminder.id);
    }
  }
};
```

**Acceptance Criteria**:
- [ ] Reminders sent at correct times
- [ ] Handles time zones correctly
- [ ] Job failures logged and retried
- [ ] No duplicate reminders

---

## 🏗️ PHASE 7: AI FEATURES (Using OpenAI)

### Epic DDO-E8: AI-Assisted Consultations

#### 🔴 DDO-S8.1: AI Consent & Recording Banner
**Status**: Not Started ❌
**Priority**: MEDIUM

**Database**:
```sql
ALTER TABLE appointments ADD COLUMN ai_consent BOOLEAN DEFAULT false;
ALTER TABLE appointments ADD COLUMN ai_consent_at TIMESTAMP;
ALTER TABLE appointments ADD COLUMN recording_url TEXT;
```

**UI Component**:
```typescript
// src/components/consultation/AIConsentBanner.tsx
const AIConsentBanner = ({ appointmentId, onConsent }) => {
  const [agreedToAI, setAgreedToAI] = useState(false);

  const handleConsent = async () => {
    await supabase
      .from('appointments')
      .update({
        ai_consent: true,
        ai_consent_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    onConsent(true);
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div className="flex-1">
            <h3 className="font-semibold mb-2">AI-Assisted Consultation</h3>
            <p className="text-sm mb-4">
              This consultation may use AI to transcribe and generate clinical notes.
              AI is assistive only and does not replace medical judgment.
            </p>

            <div className="flex items-center gap-2">
              <Checkbox
                id="ai-consent"
                checked={agreedToAI}
                onCheckedChange={setAgreedToAI}
              />
              <label htmlFor="ai-consent" className="text-sm">
                I consent to AI-assisted transcription and note generation
              </label>
            </div>

            <Button
              onClick={handleConsent}
              disabled={!agreedToAI}
              className="mt-4"
            >
              Start Consultation
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

**Acceptance Criteria**:
- [ ] AI cannot start without consent
- [ ] Consent status stored and logged
- [ ] UI labels AI as assistive
- [ ] Consent banner shown before every AI feature

---

#### 🔴 DDO-S8.2: Live Transcription with OpenAI Whisper
**Status**: Not Started ❌
**Priority**: MEDIUM

**Install Package**:
```bash
npm install openai
```

**Implementation**:
```typescript
// src/services/openaiService.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY
});

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    // Convert blob to file
    const audioFile = new File([audioBlob], 'consultation.webm', { type: 'audio/webm' });

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // or 'hi' for Hindi, 'auto' for auto-detect
      response_format: 'verbose_json',
      timestamp_granularities: ['word']
    });

    return transcription.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

// Real-time transcription component
export const LiveTranscription = ({ appointmentId }) => {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

      // Transcribe
      const text = await transcribeAudio(audioBlob);
      setTranscript(prev => prev + ' ' + text);

      // Save to database
      await supabase
        .from('consultation_transcripts')
        .insert({
          appointment_id: appointmentId,
          transcript_text: text,
          timestamp: new Date().toISOString()
        });
    };

    mediaRecorder.start();
    setIsRecording(true);

    // Stop after 30 seconds (chunk for real-time)
    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        startRecording(); // Start next chunk
      }
    }, 30000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        {!isRecording ? (
          <Button onClick={startRecording}>
            <Mic className="h-4 w-4 mr-2" />
            Start Recording
          </Button>
        ) : (
          <Button onClick={stopRecording} variant="destructive">
            <Square className="h-4 w-4 mr-2" />
            Stop Recording
          </Button>
        )}
        {isRecording && (
          <span className="flex items-center gap-2 text-red-600">
            <span className="animate-pulse">●</span>
            Recording...
          </span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{transcript || 'Waiting for audio...'}</p>
        </CardContent>
      </Card>
    </div>
  );
};
```

**Database**:
```sql
CREATE TABLE consultation_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) NOT NULL,

  transcript_text TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transcripts_appointment ON consultation_transcripts(appointment_id);
```

**Acceptance Criteria**:
- [ ] Transcript appears in real-time
- [ ] Partial transcripts update progressively
- [ ] Failures fall back to manual notes
- [ ] Transcript saved to database

---

#### 🔴 DDO-S8.3: AI SOAP Notes & Prescription Generation
**Status**: Not Started ❌
**Priority**: MEDIUM

**Implementation**:
```typescript
// src/services/clinicalAIService.ts
export const generateSOAPNotes = async (transcript: string): Promise<string> => {
  const prompt = `Based on the following consultation transcript, generate structured SOAP notes:

Transcript:
${transcript}

Generate:
S (Subjective): Patient's complaints and symptoms
O (Objective): Observable findings
A (Assessment): Diagnosis or medical opinion
P (Plan): Treatment plan and recommendations

Format as professional medical notes.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a medical assistant helping doctors with clinical documentation. Generate accurate SOAP notes.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3 // Low temperature for consistency
  });

  return response.choices[0].message.content || '';
};

export const generatePrescription = async (
  soapNotes: string,
  patientInfo: { age: number; weight: number; allergies: string[] }
): Promise<Prescription> => {
  const prompt = `Based on the following SOAP notes and patient information, suggest a prescription:

SOAP Notes:
${soapNotes}

Patient Info:
- Age: ${patientInfo.age} years
- Weight: ${patientInfo.weight} kg
- Allergies: ${patientInfo.allergies.join(', ') || 'None'}

Generate:
1. Medications with dosage
2. Frequency
3. Duration
4. Precautions

IMPORTANT: This is a draft for doctor review. Flag any high-risk medications.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a medical assistant. Generate prescription drafts for doctor review. Always prioritize patient safety.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.2
  });

  const prescriptionText = response.choices[0].message.content || '';

  // Parse into structured format
  return {
    draft_text: prescriptionText,
    requires_review: true, // Always requires doctor approval
    high_risk_flags: detectHighRiskMedications(prescriptionText)
  };
};

const detectHighRiskMedications = (prescription: string): string[] => {
  const highRiskKeywords = [
    'warfarin', 'insulin', 'chemotherapy', 'opioid',
    'controlled substance', 'high dose'
  ];

  const flags: string[] = [];
  for (const keyword of highRiskKeywords) {
    if (prescription.toLowerCase().includes(keyword)) {
      flags.push(keyword);
    }
  }

  return flags;
};
```

**UI Component**:
```typescript
// src/components/consultation/AIDraftReview.tsx
const AIDraftReview = ({ appointmentId, transcript }) => {
  const [soapNotes, setSOAPNotes] = useState('');
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [approved, setApproved] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      // Generate SOAP notes
      const soap = await generateSOAPNotes(transcript);
      setSOAPNotes(soap);

      // Generate prescription draft
      const rx = await generatePrescription(soap, patientInfo);
      setPrescription(rx);

      toast.success('AI draft generated. Please review carefully.');
    } catch (error) {
      toast.error('AI generation failed. Please write notes manually.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    // High-risk confirmation
    if (prescription?.high_risk_flags.length > 0) {
      const confirmed = confirm(
        `⚠️ HIGH RISK MEDICATIONS DETECTED:\n${prescription.high_risk_flags.join(', ')}\n\nAre you sure you want to approve this prescription?`
      );

      if (!confirmed) return;
    }

    // Save approved version
    await supabase
      .from('clinical_notes')
      .insert({
        appointment_id: appointmentId,
        soap_notes: soapNotes,
        prescription: prescription?.draft_text,
        ai_generated: true,
        approved_by_doctor: true,
        approved_at: new Date().toISOString()
      });

    toast.success('Clinical notes approved and saved');
    setApproved(true);
  };

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription>
          <strong>AI-Generated Draft</strong> - This is an AI-assisted draft.
          Please review and edit as needed before approving.
        </AlertDescription>
      </Alert>

      <Button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate AI Draft'}
      </Button>

      {soapNotes && (
        <Card>
          <CardHeader>
            <CardTitle>SOAP Notes (AI Draft)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={soapNotes}
              onChange={(e) => setSOAPNotes(e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>
      )}

      {prescription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Prescription (AI Draft)
              {prescription.high_risk_flags.length > 0 && (
                <Badge variant="destructive">High Risk</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prescription.high_risk_flags.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  High-risk medications detected: {prescription.high_risk_flags.join(', ')}
                </AlertDescription>
              </Alert>
            )}

            <Textarea
              value={prescription.draft_text}
              onChange={(e) => setPrescription({
                ...prescription,
                draft_text: e.target.value
              })}
              rows={10}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>
      )}

      {soapNotes && prescription && !approved && (
        <Button onClick={handleApprove} size="lg" className="w-full">
          Approve & Save Clinical Notes
        </Button>
      )}
    </div>
  );
};
```

**Database**:
```sql
CREATE TABLE clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) NOT NULL UNIQUE,

  soap_notes TEXT,
  prescription TEXT,

  ai_generated BOOLEAN DEFAULT false,
  ai_draft_text TEXT, -- Original AI output

  approved_by_doctor BOOLEAN DEFAULT false,
  approved_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Acceptance Criteria**:
- [ ] Draft clearly marked as AI-generated
- [ ] Fully editable before approval
- [ ] High-risk medications require confirmation
- [ ] Final version stored separately from AI draft
- [ ] Patients never receive unapproved drafts

---

## 🏗️ PHASE 8: PDF GENERATION

### Epic DDO-E9: Clinical Documents

#### 🔴 DDO-S9.1: Consultation Summary PDF
**Status**: Partially Done (PDF service exists) 🟡
**Priority**: MEDIUM

**Enhance pdfService.ts**:
```typescript
// src/services/pdfService.ts
import jsPDF from 'jspdf';

export const generateConsultationSummaryPDF = (
  appointment: Appointment,
  clinicalNotes: ClinicalNotes,
  doctor: Doctor
): Blob => {
  const doc = new jsPDF();

  // Add letterhead if exists
  if (doctor.letterhead_url) {
    // Load and add letterhead image
    doc.addImage(doctor.letterhead_url, 'PNG', 10, 10, 190, 30);
  } else {
    // Default header
    doc.setFontSize(20);
    doc.text(doctor.full_name, 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(doctor.specialties.join(', '), 105, 28, { align: 'center' });
  }

  // Patient details
  doc.setFontSize(14);
  doc.text('CONSULTATION SUMMARY', 105, 50, { align: 'center' });

  doc.setFontSize(11);
  doc.text(`Patient: ${appointment.patient.name}`, 20, 65);
  doc.text(`Patient ID: ${appointment.patient.patients_id}`, 20, 72);
  doc.text(`Date: ${format(new Date(appointment.start_at), 'MMM dd, yyyy')}`, 20, 79);

  // SOAP Notes
  doc.setFontSize(12);
  doc.text('Clinical Notes:', 20, 95);
  doc.setFontSize(10);
  const soapLines = doc.splitTextToSize(clinicalNotes.soap_notes, 170);
  doc.text(soapLines, 20, 105);

  // Prescription
  const yPos = 105 + (soapLines.length * 5) + 10;
  doc.setFontSize(12);
  doc.text('Prescription:', 20, yPos);
  doc.setFontSize(10);
  const rxLines = doc.splitTextToSize(clinicalNotes.prescription, 170);
  doc.text(rxLines, 20, yPos + 10);

  // Signature
  const sigYPos = yPos + 10 + (rxLines.length * 5) + 20;
  if (doctor.signature_url) {
    doc.addImage(doctor.signature_url, 'PNG', 20, sigYPos, 50, 20);
  }
  doc.text(doctor.full_name, 20, sigYPos + 25);
  doc.text(`Registration No: ${doctor.license_number}`, 20, sigYPos + 32);

  return doc.output('blob');
};
```

**Acceptance Criteria**:
- [ ] PDF includes letterhead
- [ ] Doctor signature rendered
- [ ] Professional layout
- [ ] Generation < 2 seconds

---

#### 🔴 DDO-S9.2: Prescription PDF
**Status**: Not Started ❌
**Priority**: MEDIUM

Similar to S9.1 but with prescription-specific layout.

---

#### 🔴 DDO-S9.3: Invoice/Receipt PDF
**Status**: Not Started ❌
**Priority**: MEDIUM

**Implementation**:
```typescript
export const generateInvoicePDF = (
  appointment: Appointment,
  payment: Payment,
  doctor: Doctor
): Blob => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('INVOICE', 105, 20, { align: 'center' });

  // Doctor details
  doc.setFontSize(11);
  doc.text(doctor.full_name, 20, 40);
  doc.text(doctor.clinic_address, 20, 47);

  // Invoice details
  doc.text(`Invoice No: ${payment.id}`, 140, 40);
  doc.text(`Date: ${format(new Date(payment.paid_at), 'MMM dd, yyyy')}`, 140, 47);

  // Patient details
  doc.text('Billed To:', 20, 65);
  doc.text(appointment.patient.name, 20, 72);
  doc.text(appointment.patient.email, 20, 79);

  // Table
  doc.setFontSize(12);
  doc.text('Description', 20, 100);
  doc.text('Amount', 170, 100, { align: 'right' });
  doc.line(20, 103, 190, 103);

  doc.setFontSize(10);
  doc.text(appointment.consultation_type.name, 20, 112);
  doc.text(`₹${payment.amount.toFixed(2)}`, 170, 112, { align: 'right' });

  // Subtotal
  doc.line(20, 120, 190, 120);
  doc.setFontSize(11);
  doc.text('Subtotal:', 140, 130);
  doc.text(`₹${payment.amount.toFixed(2)}`, 170, 130, { align: 'right' });

  // Tax (if applicable)
  const taxAmount = (payment.amount * 0.18); // 18% GST
  doc.text('GST (18%):', 140, 138);
  doc.text(`₹${taxAmount.toFixed(2)}`, 170, 138, { align: 'right' });

  // Total
  doc.setFontSize(14);
  doc.text('Total:', 140, 150);
  doc.text(`₹${(payment.amount + taxAmount).toFixed(2)}`, 170, 150, { align: 'right' });

  // Payment status
  doc.setFontSize(10);
  doc.text(`Payment Status: PAID`, 20, 170);
  doc.text(`Payment ID: ${payment.provider_payment_id}`, 20, 177);

  return doc.output('blob');
};
```

**Acceptance Criteria**:
- [ ] Invoice total matches payment
- [ ] Tax breakdown included
- [ ] Tax rates configurable
- [ ] Available to patient and doctor

---

## Summary & Priority Order

### IMMEDIATE (Week 1):
1. ✅ Enhanced Patient Signup (Age, Sex, Weight, Height, Phone, Email)
2. ✅ Doctor Slug & Custom Links
3. ✅ Email Verification
4. ✅ RLS Policies for Data Isolation

### CRITICAL (Week 2):
5. ✅ Slot Generation API
6. ✅ Drilling Calendar UI
7. ✅ Slot Locking & Checkout
8. ✅ Payment Integration (Razorpay)

### HIGH PRIORITY (Week 3):
9. ✅ Email Notifications (Confirmation, Reminders)
10. ✅ WhatsApp Notifications
11. ✅ Doctor Onboarding Wizard
12. ✅ Doctor Availability Settings

### MEDIUM PRIORITY (Week 4):
13. ✅ Reschedule/Cancel/Refund
14. ✅ AI Transcription (Whisper)
15. ✅ AI SOAP Notes (GPT-4)
16. ✅ PDF Generation

### OPTIONAL (Week 5+):
17. ⚪ Household Members
18. ⚪ Analytics Dashboard
19. ⚪ Admin Console
20. ⚪ Support Ticketing

---

**Total Features**: ~25 stories across 8 epics
**OpenAI API**: Ready to use for AI features
**Timeline**: 4-6 weeks for full implementation

Let's start building! 🚀
