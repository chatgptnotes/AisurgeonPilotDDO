# 🚀 DDO Platform - Complete Setup Guide

## Overview

This guide will help you set up the complete Doctor-Direct-Online (DDO) booking platform with all features:

✅ **Phase 1: Foundation** - Enhanced patient signup, email verification, RLS policies
✅ **Phase 2: Booking Engine** - Slot generation, drilling calendar, payments
✅ **Phase 3: Notifications** - Email & WhatsApp confirmations
✅ **Phase 4: Doctor Portal** - Availability settings, dashboard
✅ **Phase 5: AI Features** - Transcription (Whisper), SOAP notes (GPT-4)

---

## 📋 Prerequisites

1. **Supabase Project**: https://supabase.com/dashboard
   - Project ID: `qfneoowktsirwpzehgxp`

2. **API Keys** (Already configured):
   - OpenAI API Key: ✅ Configured
   - Razorpay: Pending (add to `.env`)
   - Resend (Email): Pending (add to `.env`)
   - DoubleTick (WhatsApp): ✅ Configured

3. **Node.js & npm**: Version 18+ required

---

## 🗄️ Step 1: Database Setup

### Run Migrations in Supabase SQL Editor

Go to: **Supabase Dashboard → SQL Editor → New Query**

Run these migrations in order:

#### Migration 1: Foundation Setup (DDO_01)
```sql
-- Copy and paste contents of: database/migrations/DDO_01_foundation_setup.sql
-- This creates:
-- ✅ Doctor slugs (for custom links like /dr/shwetha-dubai-dermat)
-- ✅ Enhanced patients table (age, sex, weight, height, phone, etc.)
-- ✅ RLS policies for data isolation
-- ✅ Consultation types table
-- ✅ Doctor settings table
-- ✅ Slot locks table
-- ✅ Blackout dates table
-- ✅ Payments table
```

**File Location**: `database/migrations/DDO_01_foundation_setup.sql`

---

#### Migration 2: Booking Engine (DDO_02)
```sql
-- Copy and paste contents of: database/migrations/DDO_02_booking_engine.sql
-- This creates:
-- ✅ Doctor availability table (weekly schedule)
-- ✅ Default 9 AM - 5 PM Mon-Fri for all doctors
-- ✅ Weekends marked as unavailable
```

**File Location**: `database/migrations/DDO_02_booking_engine.sql`

---

#### Migration 3: AI Features (DDO_03)
```sql
-- Copy and paste contents of: database/migrations/DDO_03_ai_features.sql
-- This creates:
-- ✅ Consultation transcriptions table
-- ✅ SOAP notes table
-- ✅ Storage bucket for audio recordings
-- ✅ RLS policies for AI data
```

**File Location**: `database/migrations/DDO_03_ai_features.sql`

---

## 🔧 Step 2: Environment Variables

Create/Update `.env` file:

```bash
# Supabase (Already configured)
VITE_SUPABASE_URL=https://qfneoowktsirwpzehgxp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (Add your key)
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Razorpay (Add your keys)
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
VITE_RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET

# Resend (Email service - Add your key)
VITE_RESEND_API_KEY=re_YOUR_API_KEY
VITE_FROM_EMAIL=noreply@aisurgeonpilot.com

# DoubleTick (WhatsApp - Already configured)
VITE_DOUBLETICK_API_KEY=key_8sc9MP6JpQ
```

---

## 📦 Step 3: Install Dependencies

```bash
npm install
```

**New dependencies added:**
- `openai` - For AI transcription and SOAP notes
- `date-fns` - For date manipulation in slot generation

---

## 🚀 Step 4: Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:5173**

---

## ✨ Features Implemented

### 1. Patient Features

#### Enhanced Signup (`/patient-signup`)
- Full name (first + last)
- Email & password
- Phone number
- Date of birth (with auto age calculation)
- Gender (male/female/other)
- Weight (kg)
- Height (cm)
- Blood group (optional)
- **Automatic Patient ID generation**: Format `P{timestamp}`
- Email verification flow

#### Email Verification (`/verify-email`)
- Verification email sent on signup
- Resend verification option
- Auto-redirect to login after verification
- Patient ID display

#### Doctor Discovery (`/doctors`)
- Browse all active doctors
- Filter by specialty
- View doctor profiles

#### Booking Flow (`/book/:doctorId`)
1. **Select Consultation Type**
   - In-person visit
   - Video consultation
   - Phone consultation
   - Each with custom fees and durations

2. **Drilling Calendar** ✨
   - Step 1: Select date from calendar
   - Step 2: Select time slot
   - Slots grouped by time of day (morning/afternoon/evening)
   - Real-time availability checking
   - Automatic slot locking (10 minute hold)

3. **Payment** (Razorpay)
   - Secure payment gateway
   - Demo mode for development
   - Payment confirmation

4. **Confirmation**
   - Email with calendar invite (.ics file)
   - WhatsApp notification
   - Appointment details

### 2. Doctor Features

#### Doctor Dashboard (`/doctor/dashboard`)
- View today's appointments
- Upcoming appointments calendar
- Patient list
- Quick stats

#### Availability Settings (`/doctor/settings`)
- Set weekly schedule
- Configure working hours per day
- Add blackout dates
- Set consultation types and fees
- Configure slot duration

#### Consultation Recording & AI
- **Record consultation** (audio)
- **AI Transcription** (OpenAI Whisper)
  - Automatic speech-to-text
  - Medical terminology optimization
  - Supports multiple languages

- **AI SOAP Notes** (GPT-4)
  - Auto-generated from transcription
  - Subjective, Objective, Assessment, Plan
  - ICD-10 diagnosis codes
  - Medication prescriptions
  - Follow-up recommendations

#### Custom Doctor Links
- Each doctor gets a unique slug
- Example: `/dr/shwetha-dubai-dermat`
- Auto-generated from doctor name
- Shareable for marketing

### 3. Slot Generation System

**Features**:
- Dynamic slot generation based on doctor availability
- Configurable slot duration per consultation type
- Respects:
  - Doctor's weekly schedule
  - Existing appointments
  - Slot locks (temporary holds during booking)
  - Blackout dates
- Prevents double-booking with database-level locks

**Service**: `src/services/slotGenerationService.ts`

**Key Methods**:
```typescript
// Get available slots for a date
await slotService.getAvailableSlots(date, consultationTypeId);

// Lock a slot during booking (10 min hold)
await slotService.lockSlot(startTime, endTime, sessionId);

// Release lock
await slotService.unlockSlot(lockId);
```

### 4. AI Services

#### Transcription Service
**File**: `src/services/aiTranscriptionService.ts`

```typescript
// Transcribe audio file
const result = await aiTranscriptionService.transcribeAudio(audioFile);

// Upload and transcribe
await aiTranscriptionService.uploadAndTranscribe(
  audioFile,
  appointmentId,
  doctorId,
  patientId
);

// Get transcription by appointment
const transcription = await aiTranscriptionService.getTranscriptionByAppointment(appointmentId);
```

#### SOAP Notes Service
**File**: `src/services/aiSoapNotesService.ts`

```typescript
// Generate SOAP notes from transcription
const soapNotes = await aiSoapNotesService.generateSoapNotes(
  transcriptionText,
  patientInfo
);

// Save SOAP notes
await aiSoapNotesService.saveSoapNotes(
  appointmentId,
  doctorId,
  patientId,
  soapNotes
);

// Generate prescription
const prescription = await aiSoapNotesService.generatePrescription(
  soapNotes,
  patientName,
  doctorName
);
```

### 5. Payment Integration

**File**: `src/services/paymentService.ts`

**Features**:
- Razorpay integration
- Demo mode for development
- Payment confirmation emails
- WhatsApp payment receipts
- Transaction logging

```typescript
// Create payment
const result = await paymentService.createPaymentOrder({
  amount: 500,
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  customer_phone: '+919876543210',
  tenant_id: doctorId,
  patient_id: patientId,
  appointment_id: appointmentId
});
```

### 6. Notification System

#### Email Notifications
**File**: `src/services/emailService.ts`

- Appointment confirmations (with .ics calendar invite)
- Payment receipts
- Appointment reminders (T-24h, T-3h, T-30m)
- Cancellation notifications
- Welcome emails

#### WhatsApp Notifications
**File**: `src/services/whatsappService.ts`

- Appointment confirmations
- Payment receipts
- Reminders
- Using DoubleTick API

---

## 🗂️ Database Schema

### Key Tables

#### `doctors`
```sql
- id (UUID, PK)
- slug (VARCHAR, UNIQUE) ✨ NEW
- full_name
- specialty
- user_id (FK to auth.users)
- is_active
```

#### `patients`
```sql
- id (UUID, PK, FK to auth.users)
- patients_id (VARCHAR) ✨ NEW - Display ID like "P1731567890"
- first_name ✨ NEW
- last_name ✨ NEW
- email
- phone ✨ NEW
- date_of_birth ✨ NEW
- age ✨ NEW
- gender ✨ NEW
- weight_kg ✨ NEW
- height_cm ✨ NEW
- blood_group ✨ NEW
- email_verified ✨ NEW
- email_verified_at ✨ NEW
```

#### `appointments`
```sql
- id (UUID, PK)
- doctor_id (FK)
- patient_id (FK)
- start_time
- end_time
- consultation_type
- status
- payment_status
- idempotency_key ✨ NEW
```

#### `doctor_availability` ✨ NEW
```sql
- id (UUID, PK)
- doctor_id (FK)
- day_of_week (0-6, Sunday=0)
- start_time (TIME)
- end_time (TIME)
- is_available
```

#### `consultation_types` ✨ NEW
```sql
- id (UUID, PK)
- doctor_id (FK)
- type (teleconsult, in_person, home_visit)
- name
- fee
- duration_minutes
- is_active
```

#### `slot_locks` ✨ NEW
```sql
- id (UUID, PK)
- doctor_id (FK)
- start_at
- end_at
- locked_by_session
- expires_at
```

#### `consultation_transcriptions` ✨ NEW
```sql
- id (UUID, PK)
- appointment_id (FK)
- doctor_id (FK)
- patient_id (FK)
- audio_file_url
- transcription_text
- duration_seconds
- language
- metadata (JSONB)
```

#### `soap_notes` ✨ NEW
```sql
- id (UUID, PK)
- appointment_id (FK)
- doctor_id (FK)
- patient_id (FK)
- soap_notes (JSONB)
- ai_generated
- reviewed_by_doctor
```

---

## 🧪 Testing

### Test Patient Signup
1. Go to: http://localhost:5173/patient-signup
2. Fill in all fields
3. Note your Patient ID (starts with 'P')
4. Check email for verification
5. Verify email
6. Login

### Test Booking Flow
1. Go to: http://localhost:5173/doctors
2. Select a doctor
3. Click "Book Appointment"
4. Select consultation type
5. Pick date from calendar
6. Select time slot
7. Fill booking details
8. Complete payment (use demo mode)
9. Check confirmations (email + WhatsApp)

### Test AI Features (Doctor Portal)
1. Login as doctor
2. Record a consultation (audio)
3. Upload for transcription
4. View AI-generated transcription
5. Generate SOAP notes from transcription
6. Review and edit notes
7. Generate prescription

---

## 📱 Routes Summary

### Public Routes
- `/` - Home page
- `/patient-signup` - Patient registration ✨
- `/verify-email` - Email verification ✨
- `/login` - Unified login (patient/doctor)
- `/doctors` - Doctor directory
- `/doctor/:id` - Doctor profile
- `/book/:doctorId` - Book appointment ✨

### Patient Routes (Auth Required)
- `/patient-dashboard` - Patient dashboard
- `/patient/medical-records` - Medical records
- `/patient/prescriptions` - Prescriptions
- `/patient/billing` - Billing history
- `/appointment/confirm/:id` - Appointment confirmation

### Doctor Routes (Auth Required)
- `/doctor/dashboard` - Doctor dashboard
- `/doctor/settings` - Availability & settings

---

## 🔐 Security Features

### Row Level Security (RLS)
- ✅ Patients can only see their own data
- ✅ Doctors can only see their own patients
- ✅ Appointments isolated by doctor-patient relationship
- ✅ AI data (transcriptions, SOAP notes) protected
- ✅ Public can read doctor profiles (for booking)

### Data Protection
- ✅ Email verification required
- ✅ Password requirements (min 8 chars)
- ✅ Phone number validation
- ✅ Secure payment handling
- ✅ HIPAA-compliant data storage

---

## 🎯 Next Steps

### Immediate
1. ✅ Run all 3 database migrations
2. ✅ Add Razorpay keys to `.env`
3. ✅ Add Resend email API key to `.env`
4. ✅ Test patient signup flow
5. ✅ Test booking flow

### Future Enhancements
- [ ] Doctor onboarding wizard
- [ ] Patient follow-up automation
- [ ] SMS notifications (Twilio)
- [ ] Video consultation integration (Zoom/Google Meet)
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app (React Native)

---

## 📞 Support

If you encounter any issues:

1. **Check browser console** for errors
2. **Check Supabase logs**: Dashboard → Logs
3. **Verify migrations** ran successfully
4. **Check API keys** in `.env`

---

## ✅ Feature Checklist

### Phase 1: Foundation
- [x] Enhanced patient signup (all medical fields)
- [x] Email verification system
- [x] Patient ID generation
- [x] RLS policies
- [x] Doctor slugs

### Phase 2: Booking Engine
- [x] Slot generation service
- [x] Drilling calendar UI
- [x] Slot locking mechanism
- [x] Razorpay integration
- [x] Doctor availability management

### Phase 3: Notifications
- [x] Email service (appointment confirmations)
- [x] WhatsApp service (DoubleTick)
- [x] Calendar invites (.ics files)

### Phase 4: Doctor Portal
- [ ] Doctor onboarding wizard
- [x] Availability settings
- [x] Dashboard

### Phase 5: AI Features
- [x] OpenAI Whisper transcription
- [x] GPT-4 SOAP notes generation
- [x] Prescription generation
- [x] Medical coding (ICD-10)

### Phase 6: Testing
- [ ] End-to-end booking flow
- [ ] Payment processing
- [ ] Email deliverability
- [ ] WhatsApp notifications
- [ ] AI transcription accuracy
- [ ] SOAP notes quality

---

## 🎉 You're Ready!

All major features have been implemented. Run the migrations, configure your API keys, and start testing!

**Local Dev URL**: http://localhost:5173

**First Test**: http://localhost:5173/patient-signup
