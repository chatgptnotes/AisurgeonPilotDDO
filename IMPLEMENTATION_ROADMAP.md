# AI Surgeon Pilot - Complete Implementation Roadmap

## Executive Summary

Transform current fragmented system into a **production-ready, end-to-end telemedicine platform** where:
- Doctors onboard and go live in **< 30 minutes**
- Patients book, pay, and confirm in **< 3 minutes**
- All workflows are automated, audited, and compliant

---

## Current State Analysis

### ✅ What We Have (Clinic/Staff Side):
- Complete hospital management dashboard
- Staff authentication system
- Patient records management
- Billing and invoicing
- Lab reports and prescriptions
- OPD/IPD management
- Pharmacy integration
- 100+ features for hospital operations

### ❌ What's Missing (Patient Side):
- Modern patient signup/login (currently requires manual creation)
- Real-time appointment booking
- Payment gateway integration
- Slot availability calendar
- Pre-visit intake forms
- File upload system
- Automated reminders (email/SMS)
- Video consultation integration
- AI transcription and notes
- Prescription generation
- Follow-up booking workflow
- Feedback/NPS system
- Support escalation

### 🔧 What Needs Fixing:
- Patient login is complex (requires admin to create credentials)
- No self-service registration
- No booking flow
- No payment processing
- No automated communications
- Dashboard is placeholder only

---

## Implementation Phases

### **PHASE 1: Foundation (Week 1-2)** 🏗️
**Goal:** Working patient signup → login → dashboard

#### 1.1 Modern Patient Authentication
- [ ] **Simple signup form** (name, email, mobile, password)
  - Email verification via OTP
  - Mobile verification via SMS OTP
  - No admin approval needed
  - Auto-create patient profile

- [ ] **Streamlined login**
  - Email/password OR mobile OTP
  - "Remember me" functionality
  - Password reset flow
  - Session management

- [ ] **Profile completion**
  - Basic info (DOB, gender, address)
  - Medical history (optional at signup)
  - Emergency contact
  - ID document upload (optional)

**Files to Create:**
- `src/pages/PatientSignup.tsx`
- `src/pages/PatientLogin.tsx` (replace current)
- `src/components/auth/OTPVerification.tsx`
- `src/components/auth/PasswordReset.tsx`
- `src/contexts/PatientAuthContext.tsx` (enhance current)

**Database Changes:**
```sql
-- Add OTP table
CREATE TABLE patient_otp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  mobile VARCHAR(20),
  email VARCHAR(255),
  otp_code VARCHAR(6),
  purpose VARCHAR(20), -- 'signup', 'login', 'reset'
  expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_patient_otp_mobile ON patient_otp(mobile);
CREATE INDEX idx_patient_otp_email ON patient_otp(email);
CREATE INDEX idx_patient_otp_expires ON patient_otp(expires_at);

-- Update patients table
ALTER TABLE patients
  ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN email_verified_at TIMESTAMPTZ,
  ADD COLUMN mobile_verified_at TIMESTAMPTZ,
  ADD COLUMN password_hash VARCHAR(255),
  ADD COLUMN last_login_at TIMESTAMPTZ,
  ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Dubai';
```

#### 1.2 Enhanced Patient Dashboard
- [ ] **Dashboard sections:**
  - Welcome banner with patient name
  - Upcoming appointments (with countdown)
  - Quick actions (Book, Upload, Messages)
  - Recent activity timeline
  - Health summary cards

- [ ] **Navigation menu:**
  - Book Appointment
  - My Appointments
  - Medical Records
  - Prescriptions
  - Profile & Settings
  - Help & Support

**Files to Create:**
- `src/pages/patient/Dashboard.tsx`
- `src/components/patient/UpcomingAppointments.tsx`
- `src/components/patient/QuickActions.tsx`
- `src/components/patient/HealthSummary.tsx`
- `src/components/patient/ActivityTimeline.tsx`

---

### **PHASE 2: Booking & Payment (Week 3-4)** 💳
**Goal:** Patient can discover doctor → select slot → pay → confirm

#### 2.1 Doctor Discovery
- [ ] **Public doctor directory**
  - Search by specialty, name, language
  - Filter by availability, price, rating
  - Doctor profile page (public URL)

- [ ] **Doctor profile display:**
  - Photo, credentials, specialties
  - Languages spoken
  - Consultation fees (standard/follow-up)
  - Average rating & review count
  - Next available slot
  - "Book Now" CTA

**Files to Create:**
- `src/pages/DoctorDirectory.tsx`
- `src/pages/DoctorProfile.tsx`
- `src/components/doctor/DoctorCard.tsx`
- `src/components/doctor/DoctorSearch.tsx`

**Database:**
```sql
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  full_name VARCHAR(255),
  specialties TEXT[],
  languages TEXT[],
  bio TEXT,
  consultation_fee_standard DECIMAL(10,2),
  consultation_fee_followup DECIMAL(10,2),
  followup_window_days INTEGER DEFAULT 7,
  profile_photo_url TEXT,
  credentials JSONB,
  rating_avg DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_accepting_patients BOOLEAN DEFAULT TRUE,
  tele_link TEXT,
  timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.2 Real-Time Slot Booking
- [ ] **Availability calendar**
  - Week/month view
  - Show only available slots
  - Refresh on selection
  - Handle timezone conversion

- [ ] **Slot selection UX:**
  - Visual calendar (react-big-calendar or custom)
  - Slot duration display (30/45/60 min)
  - Price shown per slot type
  - "Next available" quick select

**Files to Create:**
- `src/components/booking/AvailabilityCalendar.tsx`
- `src/components/booking/SlotSelector.tsx`
- `src/hooks/useAvailability.ts`

**Database:**
```sql
CREATE TABLE doctor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id),
  day_of_week INTEGER, -- 0=Sunday, 6=Saturday
  start_time TIME,
  end_time TIME,
  slot_duration_minutes INTEGER DEFAULT 30,
  buffer_minutes INTEGER DEFAULT 10,
  max_patients_per_day INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE availability_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id),
  exception_date DATE,
  exception_type VARCHAR(20), -- 'blocked', 'custom_hours'
  custom_start TIME,
  custom_end TIME,
  reason TEXT
);
```

#### 2.3 Payment Integration
- [ ] **Payment gateway abstraction**
  - Support multiple providers (Stripe, Razorpay, PayTabs)
  - Doctor configures own merchant account
  - Return-to-confirm flow
  - Webhook handling

- [ ] **Checkout flow:**
  - Summary page (doctor, slot, price)
  - Coupon code entry
  - Redirect to payment provider
  - Return URL processing
  - Slot re-validation after payment

- [ ] **Race condition handling:**
  - Lock slot before redirect
  - TTL on lock (10 minutes)
  - Re-check availability on return
  - Auto-refund if slot taken
  - Show alternative slots

**Files to Create:**
- `src/services/payment/PaymentGatewayFactory.ts`
- `src/services/payment/providers/StripeProvider.ts`
- `src/services/payment/providers/RazorpayProvider.ts`
- `src/pages/booking/Checkout.tsx`
- `src/pages/booking/PaymentReturn.tsx`
- `src/api/webhooks/payment.ts`

**Database:**
```sql
CREATE TABLE payment_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id),
  provider VARCHAR(50), -- 'stripe', 'razorpay', 'paytabs'
  publishable_key TEXT,
  secret_key_encrypted TEXT,
  webhook_secret TEXT,
  currency VARCHAR(3) DEFAULT 'AED',
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id),
  provider VARCHAR(50),
  provider_payment_id TEXT,
  status VARCHAR(20), -- 'pending', 'paid', 'failed', 'refunded'
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  refund_amount DECIMAL(10,2) DEFAULT 0,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id),
  patient_id UUID REFERENCES patients(id),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  status VARCHAR(20), -- 'pending_payment', 'confirmed', 'cancelled', 'completed', 'no_show'
  appointment_type VARCHAR(20), -- 'standard', 'followup'
  price DECIMAL(10,2),
  coupon_id UUID REFERENCES coupons(id),
  payment_id UUID REFERENCES payments(id),
  meet_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Lock table for slot reservations
CREATE TABLE slot_locks (
  slot_key VARCHAR(255) PRIMARY KEY, -- 'doctor_id:start_time'
  locked_by UUID, -- session_id or user_id
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.4 Coupon System
- [ ] **Coupon management (doctor dashboard)**
  - Create/edit/deactivate coupons
  - Set discount type (percent/fixed)
  - Usage limits (total, per-user)
  - Validity period

- [ ] **Patient coupon application**
  - Apply at checkout
  - Validate rules
  - Show savings

**Database:**
```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id),
  code VARCHAR(50) UNIQUE,
  discount_type VARCHAR(10), -- 'percent', 'fixed'
  discount_value DECIMAL(10,2),
  max_uses INTEGER,
  per_user_limit INTEGER DEFAULT 1,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coupon_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupons(id),
  patient_id UUID REFERENCES patients(id),
  appointment_id UUID REFERENCES appointments(id),
  discount_applied DECIMAL(10,2),
  used_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **PHASE 3: Communication & Reminders (Week 5)** 📧
**Goal:** Automated emails, SMS, WhatsApp with perfect timing

#### 3.1 Email System
- [ ] **Email templates (per doctor branding)**
  - Booking confirmation with ICS
  - Pre-visit intake reminder
  - T-24h reminder
  - T-3h reminder
  - T-30m reminder
  - Post-visit summary
  - Feedback request

- [ ] **Email service abstraction**
  - Support SendGrid, SES, Resend
  - Template variables
  - ICS attachment generation
  - Delivery tracking

**Files to Create:**
- `src/services/email/EmailServiceFactory.ts`
- `src/services/email/templates/*.tsx`
- `src/utils/icsGenerator.ts`

**Database:**
```sql
CREATE TABLE email_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id),
  provider VARCHAR(50), -- 'sendgrid', 'ses', 'resend'
  api_key_encrypted TEXT,
  from_email VARCHAR(255),
  from_name VARCHAR(255),
  reply_to VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id),
  recipient_email VARCHAR(255),
  template_type VARCHAR(50),
  subject TEXT,
  status VARCHAR(20), -- 'queued', 'sent', 'delivered', 'failed'
  provider_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.2 Reminder Scheduler
- [ ] **Job queue setup**
  - Bull MQ or similar
  - Schedule reminders at booking confirmation
  - Timezone-aware scheduling
  - Retry logic for failures

- [ ] **Reminder types:**
  - T-24h: Email + SMS (appointment details + Zoom link)
  - T-3h: Email + SMS (join link ready)
  - T-30m: SMS only (urgent reminder)
  - Intake reminder at T-12h if files not uploaded

**Files to Create:**
- `src/jobs/ReminderScheduler.ts`
- `src/jobs/workers/EmailReminderWorker.ts`
- `src/jobs/workers/SMSReminderWorker.ts`

**Database:**
```sql
CREATE TABLE scheduled_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id),
  reminder_type VARCHAR(20), -- '24h', '3h', '30m', 'intake'
  scheduled_for TIMESTAMPTZ,
  status VARCHAR(20), -- 'pending', 'sent', 'failed', 'cancelled'
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.3 SMS/WhatsApp Integration
- [ ] **Setup DoubleTick integration**
  - Use existing API key: `key_8sc9MP6JpQ`
  - Template: `emergency_location_alert`
  - Variables: {victim_location}, {nearby_hospital}, {Phone_number}

- [ ] **Create booking reminder templates**
  - Short message (160 chars)
  - Include meeting link
  - Timezone-aware time display

**Files to Create:**
- `src/services/sms/DoubleTick.ts`
- `src/services/sms/templates.ts`

---

### **PHASE 4: Pre-Visit & Intake (Week 6)** 📋
**Goal:** Patient uploads reports, completes health questionnaire

#### 4.1 File Upload System
- [ ] **Secure file storage**
  - S3-compatible storage
  - Virus scanning (ClamAV)
  - File type validation (PDF, JPG, PNG, DICOM)
  - Size limits (10MB per file, 50MB total)
  - Encryption at rest

- [ ] **Upload UI:**
  - Drag-and-drop
  - Progress indicators
  - Thumbnail previews
  - File management (view, delete)

**Files to Create:**
- `src/components/upload/FileUploader.tsx`
- `src/components/upload/FilePreview.tsx`
- `src/services/storage/FileStorageService.ts`
- `src/utils/fileValidation.ts`

**Database:**
```sql
CREATE TABLE patient_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  appointment_id UUID REFERENCES appointments(id),
  file_type VARCHAR(50), -- 'lab_report', 'scan', 'prescription', 'other'
  file_name TEXT,
  file_url TEXT,
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  checksum VARCHAR(64),
  virus_scan_status VARCHAR(20), -- 'pending', 'clean', 'infected'
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.2 Health Intake Form
- [ ] **Dynamic form builder**
  - Chief complaint
  - Current symptoms
  - Medical history checkboxes
  - Allergies
  - Current medications
  - Previous surgeries
  - Family history

- [ ] **Form management:**
  - Save as draft
  - Edit before appointment
  - Doctor can review before consult

**Files to Create:**
- `src/components/intake/IntakeForm.tsx`
- `src/components/intake/MedicalHistorySection.tsx`
- `src/components/intake/AllergiesSection.tsx`

**Database:**
```sql
CREATE TABLE intake_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id),
  patient_id UUID REFERENCES patients(id),
  chief_complaint TEXT,
  current_symptoms JSONB,
  medical_history JSONB,
  allergies TEXT[],
  current_medications JSONB[],
  previous_surgeries JSONB[],
  family_history TEXT,
  status VARCHAR(20), -- 'draft', 'submitted'
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **PHASE 5: Video Consultation (Week 7)** 🎥
**Goal:** Seamless video calls with AI transcription

#### 5.1 Zoom Integration
- [ ] **Static link support (v1)**
  - Doctor sets permanent Zoom link
  - Link included in all communications
  - Manual meeting start

- [ ] **OAuth integration (v1.1)**
  - Auto-create scheduled meetings
  - Unique link per appointment
  - Auto-admit participants
  - Recording permission

**Files to Create:**
- `src/services/video/ZoomService.ts`
- `src/components/consultation/VideoCallButton.tsx`

**Database:**
```sql
CREATE TABLE video_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id),
  provider VARCHAR(50), -- 'zoom', 'teams', 'custom'
  static_link TEXT,
  oauth_token_encrypted TEXT,
  oauth_refresh_token_encrypted TEXT,
  auto_record BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5.2 AI Transcription
- [ ] **Consent flow**
  - Banner before call starts
  - Patient must agree
  - Doctor can toggle on/off

- [ ] **Transcription service**
  - OpenAI Whisper or Azure Speech
  - Real-time or post-call processing
  - Speaker identification
  - Timestamp annotations

**Files to Create:**
- `src/services/ai/TranscriptionService.ts`
- `src/components/consultation/ConsentBanner.tsx`

**Database:**
```sql
CREATE TABLE consultation_recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id),
  audio_url TEXT,
  transcript_text TEXT,
  transcript_json JSONB, -- with timestamps, speakers
  consent_given_by_patient BOOLEAN,
  consent_given_at TIMESTAMPTZ,
  transcribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5.3 AI Clinical Summary
- [ ] **SOAP note generation**
  - Subjective (patient complaint)
  - Objective (observations)
  - Assessment (diagnosis)
  - Plan (treatment)

- [ ] **Editable interface:**
  - Doctor reviews AI draft
  - Inline editing
  - Add/remove sections
  - Approve to finalize

**Files to Create:**
- `src/services/ai/ClinicalSummaryService.ts`
- `src/components/consultation/SOAPNoteEditor.tsx`

**Database:**
```sql
CREATE TABLE clinical_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id),
  recording_id UUID REFERENCES consultation_recordings(id),
  ai_generated_note JSONB,
  doctor_edited_note JSONB,
  final_note JSONB,
  status VARCHAR(20), -- 'draft', 'approved', 'sent'
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **PHASE 6: Prescription & Outputs (Week 8)** 📄
**Goal:** Doctor-branded PDFs sent to patient

#### 6.1 Prescription Generator
- [ ] **Template system**
  - Doctor letterhead (upload)
  - Header with clinic details
  - Patient details
  - Rx section
  - Doctor signature
  - Footer with disclaimers

- [ ] **Prescription builder:**
  - Medication search (autocomplete)
  - Dosage, frequency, duration
  - Instructions field
  - Common prescriptions templates
  - Drug interaction warnings

**Files to Create:**
- `src/components/prescription/PrescriptionBuilder.tsx`
- `src/components/prescription/MedicationSearch.tsx`
- `src/services/pdf/PrescriptionPDFGenerator.ts`
- `src/templates/prescription-template.html`

**Database:**
```sql
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id),
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES doctors(id),
  medications JSONB[],
  instructions TEXT,
  pdf_url TEXT,
  status VARCHAR(20), -- 'draft', 'issued'
  issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE medications_master (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  generic_name TEXT,
  brand_names TEXT[],
  category VARCHAR(100),
  common_dosages TEXT[],
  interactions TEXT[],
  warnings TEXT
);
```

#### 6.2 Invoice Generation
- [ ] **Auto-invoice after completion**
  - Include consultation fee
  - Applied coupon
  - Tax calculation
  - Payment method

- [ ] **PDF invoice:**
  - Doctor letterhead
  - Invoice number (sequential)
  - Line items
  - Payment status
  - Download link

**Files to Create:**
- `src/services/pdf/InvoicePDFGenerator.ts`
- `src/templates/invoice-template.html`

**Database:**
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id),
  invoice_number VARCHAR(50) UNIQUE,
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES doctors(id),
  subtotal DECIMAL(10,2),
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2),
  pdf_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6.3 Post-Visit Email
- [ ] **Consolidated email**
  - Thank you message
  - Attachments: Summary PDF, Prescription PDF, Invoice PDF
  - Next steps
  - Follow-up booking link
  - Feedback survey link

**Files to Create:**
- `src/services/email/templates/PostVisitEmail.tsx`

---

### **PHASE 7: Follow-Up & Feedback (Week 9)** 🔄
**Goal:** Easy rebooking + quality metrics

#### 7.1 Follow-Up Booking
- [ ] **Auto-apply follow-up pricing**
  - Check if within followup_window_days
  - Apply discounted rate
  - Show savings

- [ ] **Quick rebook:**
  - "Book Follow-Up" button on dashboard
  - Same doctor pre-selected
  - Previous medical history pre-filled
  - Upload new reports only

**Files to Create:**
- `src/components/booking/FollowUpBooking.tsx`
- `src/hooks/useFollowUpPricing.ts`

#### 7.2 Feedback System
- [ ] **NPS survey (0-10 scale)**
  - "How likely are you to recommend?"
  - Categorize: Promoters (9-10), Passives (7-8), Detractors (0-6)
  - Calculate NPS = % Promoters - % Detractors

- [ ] **CSAT survey (1-5 stars)**
  - Overall satisfaction
  - Doctor communication
  - Ease of booking
  - Technical quality
  - Value for money

- [ ] **Free-text feedback**
  - What went well
  - What could improve
  - Report issues

**Files to Create:**
- `src/components/feedback/NPSSurvey.tsx`
- `src/components/feedback/CSATSurvey.tsx`
- `src/pages/FeedbackPage.tsx`

**Database:**
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id),
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES doctors(id),
  nps_score INTEGER, -- 0-10
  csat_overall INTEGER, -- 1-5
  csat_communication INTEGER,
  csat_booking_ease INTEGER,
  csat_tech_quality INTEGER,
  csat_value INTEGER,
  comments TEXT,
  issues_reported TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materialized view for doctor ratings
CREATE MATERIALIZED VIEW doctor_ratings AS
SELECT
  doctor_id,
  COUNT(*) as total_reviews,
  AVG(csat_overall) as avg_rating,
  (COUNT(*) FILTER (WHERE nps_score >= 9) * 100.0 / COUNT(*)) -
   (COUNT(*) FILTER (WHERE nps_score <= 6) * 100.0 / COUNT(*)) as nps_score
FROM feedback
GROUP BY doctor_id;
```

---

### **PHASE 8: Support & Escalation (Week 10)** 🆘
**Goal:** Human help always available

#### 8.1 Help System
- [ ] **Contextual help**
  - FAQs embedded in each page
  - Search help articles
  - Video tutorials
  - Chatbot (optional v1.1)

- [ ] **"Escalate to Human" button**
  - Visible on every page
  - One-click activation
  - Capture current page context

**Files to Create:**
- `src/components/support/HelpWidget.tsx`
- `src/components/support/EscalateButton.tsx`
- `src/pages/HelpCenter.tsx`

#### 8.2 Support Ticketing
- [ ] **Ticket creation**
  - Auto-capture: user, page, browser, time
  - Issue category dropdown
  - Description field
  - File attachments (screenshots)

- [ ] **Live chat (optional)**
  - Integrate Intercom/Crisp/Tawk.to
  - Or custom WebSocket chat

- [ ] **Phone callback**
  - Request callback form
  - Priority queue
  - 5-minute SLA for critical issues

**Files to Create:**
- `src/components/support/CreateTicket.tsx`
- `src/pages/admin/SupportDashboard.tsx`

**Database:**
```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_type VARCHAR(20), -- 'patient', 'doctor'
  actor_id UUID,
  channel VARCHAR(20), -- 'chat', 'phone', 'form'
  category VARCHAR(50),
  subject TEXT,
  description TEXT,
  priority VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(20), -- 'open', 'assigned', 'resolved', 'closed'
  assigned_to UUID REFERENCES users(id),
  context_json JSONB, -- page, browser, etc.
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES support_tickets(id),
  sender_type VARCHAR(20), -- 'user', 'support'
  sender_id UUID,
  message TEXT,
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **PHASE 9: Doctor Dashboard Enhancements (Week 11)** 👨‍⚕️
**Goal:** Doctor can manage entire practice from one place

#### 9.1 Doctor Onboarding
- [ ] **Signup flow**
  - Basic info (name, specialty, qualifications)
  - Upload credentials (medical license, certificates)
  - ID verification (passport/license)
  - Set consultation fees

- [ ] **Practice setup wizard:**
  - Step 1: Profile & branding (photo, bio, letterhead)
  - Step 2: Availability (schedule builder)
  - Step 3: Payment (connect gateway)
  - Step 4: Video (Zoom link)
  - Step 5: Policies (cancellation, refund)
  - Step 6: Go live

**Files to Create:**
- `src/pages/doctor/DoctorSignup.tsx`
- `src/components/doctor/OnboardingWizard.tsx`
- `src/components/doctor/CredentialUpload.tsx`

#### 9.2 Availability Management
- [ ] **Schedule builder**
  - Set weekly hours (drag on calendar)
  - Slot duration (15/30/45/60 min)
  - Buffer between appointments
  - Max patients per day
  - Blackout dates (vacations)
  - Emergency block/unblock

**Files to Create:**
- `src/components/doctor/ScheduleBuilder.tsx`
- `src/components/doctor/AvailabilityCalendar.tsx`

#### 9.3 Today's Appointments
- [ ] **Appointment list view**
  - Chronological order
  - Patient name + age + chief complaint
  - Time until appointment
  - Quick actions: View intake, Start consult, Cancel

- [ ] **Appointment details panel:**
  - Patient demographics
  - Medical history
  - Uploaded files
  - Previous visits with this doctor

**Files to Create:**
- `src/pages/doctor/TodaysAppointments.tsx`
- `src/components/doctor/AppointmentCard.tsx`
- `src/components/doctor/PatientDetailsPanel.tsx`

#### 9.4 Consultation Workspace
- [ ] **During-consult interface**
  - Video call embed
  - Patient info sidebar
  - Clinical notes editor (SOAP)
  - Prescription builder
  - Recording controls

- [ ] **Post-consult actions:**
  - Approve & send summary
  - Issue prescription
  - Schedule follow-up
  - Mark as completed

**Files to Create:**
- `src/pages/doctor/ConsultationWorkspace.tsx`
- `src/components/doctor/VideoConsultEmbed.tsx`
- `src/components/doctor/ClinicalNotesPanel.tsx`

#### 9.5 Financial Dashboard
- [ ] **Revenue overview**
  - Today, this week, this month
  - Chart (line/bar)
  - Breakdown: Standard vs Follow-up

- [ ] **Payment list**
  - All transactions
  - Filter by status, date
  - Export CSV

- [ ] **Payout tracking**
  - Connects to doctor's gateway
  - Show pending, paid
  - Download invoices

**Files to Create:**
- `src/pages/doctor/FinancialDashboard.tsx`
- `src/components/doctor/RevenueChart.tsx`
- `src/components/doctor/PaymentList.tsx`

#### 9.6 Analytics & Quality
- [ ] **KPIs:**
  - Total patients seen
  - Average rating
  - NPS score
  - No-show rate
  - Average consultation duration

- [ ] **Charts:**
  - Bookings trend
  - Feedback trend
  - Peak hours heatmap

- [ ] **Patient reviews:**
  - List all feedback
  - Respond to reviews (optional)

**Files to Create:**
- `src/pages/doctor/Analytics.tsx`
- `src/components/doctor/KPICards.tsx`
- `src/components/doctor/FeedbackList.tsx`

---

### **PHASE 10: Admin & Compliance (Week 12)** 🔐
**Goal:** Platform ops + regulatory compliance

#### 10.1 Admin Dashboard
- [ ] **Tenant management**
  - List all doctors
  - Approve/reject onboarding
  - Suspend/reactivate accounts
  - View KYC documents

- [ ] **Support queue:**
  - All open tickets
  - Assign to agents
  - SLA tracking
  - Canned responses

**Files to Create:**
- `src/pages/admin/TenantManagement.tsx`
- `src/pages/admin/SupportQueue.tsx`

#### 10.2 Audit Logging
- [ ] **Track all actions:**
  - User: Login, logout, profile change
  - Booking: Create, cancel, reschedule
  - Payment: Initiate, success, refund
  - Medical: Upload file, create note, issue prescription
  - Admin: Approve doctor, suspend account

- [ ] **Audit viewer:**
  - Search by user, entity, action
  - Export for compliance

**Database:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_type VARCHAR(20), -- 'patient', 'doctor', 'admin', 'system'
  actor_id UUID,
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
```

#### 10.3 Data Retention & Privacy
- [ ] **GDPR compliance:**
  - Patient data export
  - Right to erasure
  - Consent management
  - Data processing agreements

- [ ] **Retention policies:**
  - Medical records: 7 years
  - Recordings: 30 days (or per doctor policy)
  - Audit logs: 1 year
  - Soft-delete with grace period

**Files to Create:**
- `src/services/privacy/DataExportService.ts`
- `src/services/privacy/DataErasureService.ts`
- `src/jobs/RetentionPolicyWorker.ts`

#### 10.4 Security
- [ ] **Authentication hardening:**
  - Rate limiting (login attempts)
  - TOTP for doctors & admins
  - Session timeout
  - Force password reset on breach

- [ ] **Data security:**
  - Encrypt sensitive fields (payment keys, OAuth tokens)
  - HTTPS only
  - Secure headers (CSP, HSTS)
  - Input validation & sanitization

- [ ] **Monitoring:**
  - Failed login alerts
  - Unusual activity detection
  - Brute-force protection

**Files to Create:**
- `src/middleware/rateLimiter.ts`
- `src/middleware/securityHeaders.ts`
- `src/services/security/EncryptionService.ts`

---

## Database Migration Strategy

### Approach:
1. **Incremental migrations** (one per feature)
2. **No breaking changes** to existing clinic tables
3. **Separate patient-facing tables** from staff tables
4. **Use RLS** for multi-tenancy
5. **Indexes** on all foreign keys and query-heavy columns

### Migration Files to Create:
```
migrations/
├── 001_patient_auth_tables.sql
├── 002_doctors_and_availability.sql
├── 003_appointments_and_bookings.sql
├── 004_payments_and_coupons.sql
├── 005_communications_and_reminders.sql
├── 006_uploads_and_intake.sql
├── 007_consultations_and_ai.sql
├── 008_prescriptions_and_invoices.sql
├── 009_feedback_and_ratings.sql
├── 010_support_and_tickets.sql
├── 011_audit_and_compliance.sql
└── 012_indexes_and_views.sql
```

---

## Tech Stack Additions

### Current:
- React + TypeScript + Vite
- TailwindCSS
- Supabase (PostgreSQL + Auth + Storage)

### New Dependencies:
```json
{
  "dependencies": {
    "@stripe/stripe-js": "^2.0.0",
    "razorpay": "^2.9.0",
    "bull": "^4.11.0",
    "nodemailer": "^6.9.0",
    "@sendgrid/mail": "^7.7.0",
    "twilio": "^4.19.0",
    "ical-generator": "^5.0.0",
    "react-big-calendar": "^1.8.0",
    "react-dropzone": "^14.2.0",
    "pdfkit": "^0.13.0",
    "openai": "^4.20.0",
    "socket.io-client": "^4.6.0",
    "date-fns-tz": "^2.0.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.48.0",
    "recharts": "^2.10.0"
  }
}
```

---

## Testing Strategy

### Unit Tests:
- [ ] Payment gateway interfaces
- [ ] Slot locking logic
- [ ] Coupon validation
- [ ] Timezone conversions
- [ ] PDF generation

### Integration Tests:
- [ ] Booking flow (end-to-end)
- [ ] Payment webhook processing
- [ ] Email delivery
- [ ] File uploads
- [ ] Reminder scheduling

### E2E Tests (Playwright):
- [ ] Patient signup → book → pay → attend → feedback
- [ ] Doctor onboard → set availability → conduct consult → issue prescription
- [ ] Admin approve doctor → handle support ticket

---

## Deployment Checklist

### Infrastructure:
- [ ] Vercel/Netlify for frontend
- [ ] Node.js backend (Render/Railway/Fly.io)
- [ ] Supabase (production instance)
- [ ] S3/Wasabi for file storage
- [ ] Redis for locks & cache
- [ ] SendGrid/SES for emails
- [ ] Twilio for SMS

### Environment Variables:
```env
# Database
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Payment Gateways
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Email
SENDGRID_API_KEY=
EMAIL_FROM=

# SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# WhatsApp
DOUBLETICK_API_KEY=key_8sc9MP6JpQ

# AI
OPENAI_API_KEY=

# Zoom
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=

# Storage
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=

# Security
JWT_SECRET=
ENCRYPTION_KEY=

# Monitoring
SENTRY_DSN=
```

### Pre-Launch:
- [ ] Load testing (100 concurrent bookings)
- [ ] Security audit (OWASP Top 10)
- [ ] GDPR compliance check
- [ ] Penetration testing
- [ ] Backup & disaster recovery plan

---

## Success Metrics (Post-Launch)

### Performance:
- Doctor onboarding: **< 30 minutes** (target: 95th percentile)
- Patient booking: **< 3 minutes** (target: 90th percentile)
- Page load time: **< 2 seconds**
- Uptime: **99.9%**

### Business:
- **Active doctors:** 100+ in 6 months
- **Monthly bookings:** 1000+ in 6 months
- **NPS:** > 50
- **CSAT:** > 4.0/5.0
- **No-show rate:** < 10%

### Technical:
- **Reminder delivery:** > 99%
- **Payment success rate:** > 95%
- **AI transcription accuracy:** > 90%
- **Support ticket resolution:** < 4 hours (avg)

---

## Timeline Summary

| Phase | Weeks | Deliverables |
|-------|-------|--------------|
| 1. Foundation | 1-2 | Patient signup, login, dashboard |
| 2. Booking & Payment | 3-4 | Slot selection, payment, race-condition handling |
| 3. Communication | 5 | Email, SMS, reminders |
| 4. Pre-Visit | 6 | File upload, intake forms |
| 5. Video Consult | 7 | Zoom, AI transcription |
| 6. Outputs | 8 | Prescription, invoice, PDFs |
| 7. Follow-Up | 9 | Rebooking, feedback |
| 8. Support | 10 | Help center, ticketing |
| 9. Doctor Dashboard | 11 | Onboarding, analytics |
| 10. Admin & Compliance | 12 | Audit, security, GDPR |

**Total: 12 weeks (3 months) to MVP**

---

## Next Steps (Immediate)

1. **Review and approve this roadmap**
2. **Start Phase 1: Foundation**
   - Implement modern patient signup
   - Fix patient login flow
   - Build basic dashboard
3. **Set up project tracking**
   - Create GitHub project board
   - Link issues to phases
   - Weekly progress reviews

---

**Ready to start building?** Let's begin with Phase 1! 🚀
