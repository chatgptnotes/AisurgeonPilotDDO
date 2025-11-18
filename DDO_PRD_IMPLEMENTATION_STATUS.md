# DDO (Digital Doctor Office) - PRD Implementation Status & Roadmap

## Executive Summary

**Current Status**: Early implementation phase with core authentication and booking foundation in place.

**Completion**: ~15% of PRD requirements implemented
**Priority Focus**: Booking engine and doctor dashboard improvements needed

---

## Implementation Status by Epic

### ✅ Epic 1: Foundation & Infrastructure (60% Complete)

| Story | Description | Status | Notes |
|-------|-------------|--------|-------|
| DDO-S1.1 | Backend/frontend setup, CI/CD | ✅ DONE | Vite + React + TypeScript, Vercel deployment ready |
| DDO-S1.2 | Multi-tenant data model with RLS | ⚠️ PARTIAL | Tables exist, RLS policies partially implemented |
| DDO-S1.3 | Authentication (OTP, TOTP) | ⚠️ PARTIAL | Email/password works, OTP not implemented, TOTP missing |
| DDO-S1.4 | Multiple patient profiles (Household) | ❌ NOT STARTED | HouseholdMember model doesn't exist |

**Blockers**:
- RLS policies need comprehensive audit
- Mobile OTP for patients not implemented
- TOTP for doctors/admins missing
- Household member model needs creation

---

### ❌ Epic 2: Doctor Onboarding & Configuration (10% Complete)

| Story | Description | Status | Notes |
|-------|-------------|--------|-------|
| DDO-S2.1 | Doctor onboarding wizard | ⚠️ PARTIAL | Basic doctor signup exists, no wizard flow |
| DDO-S2.2 | Office configuration (fees, follow-up, types) | ❌ NOT STARTED | No fee configuration UI |
| DDO-S2.3 | Branding, letterhead, signature | ❌ NOT STARTED | No upload functionality |
| DDO-S2.4 | Subscription plan model | ❌ NOT STARTED | No plan limits or tiers |
| DDO-S2.5 | TenantSetting & FeatureFlag | ❌ NOT STARTED | Tables may exist but no UI |

**Priority Actions**:
1. Create doctor onboarding wizard with steps
2. Add fee configuration UI
3. Implement letterhead/signature uploads
4. Add subscription plan selection

---

### ⚠️ Epic 3: Availability & Slot Management (30% Complete)

| Story | Description | Status | Notes |
|-------|-------------|--------|-------|
| DDO-S3.1 | Working hours, slots, buffers, blackouts | ⚠️ PARTIAL | `doctor_availability` table exists, UI incomplete |
| DDO-S3.2 | Slot generation & availability API | ⚠️ PARTIAL | Basic booking works, needs optimization |

**Current Issues**:
- No UI for doctors to set working hours
- No blackout date management
- No daily cap settings
- Slot generation logic needs review

**Files to Check**:
- `src/services/slotGenerationService.ts` - Exists but needs verification
- `database/ADD_DOCTOR_AVAILABILITY.sql` - Schema exists

---

### ⚠️ Epic 4: Booking, Payment & Lifecycle (40% Complete)

| Story | Description | Status | Notes |
|-------|-------------|--------|-------|
| DDO-S4.1 | Core checkout with idempotency | ⚠️ PARTIAL | Basic booking works, race conditions not handled |
| DDO-S4.2 | Payment provider integration | ❌ NOT STARTED | No payment gateway integrated |
| DDO-S4.3 | Reschedule flow | ❌ NOT STARTED | No reschedule functionality |
| DDO-S4.4 | Cancel & refund flow | ❌ NOT STARTED | No cancellation UI |
| DDO-S4.5 | No-show handling | ❌ NOT STARTED | No no-show marking |

**Critical Gaps**:
- No payment integration (Razorpay/Stripe)
- No refund handling
- No appointment modification flows
- No idempotency keys for preventing double booking

---

### ⚠️ Epic 5: Patient Experience (35% Complete)

| Story | Description | Status | Notes |
|-------|-------------|--------|-------|
| DDO-S5.1 | Public doctor profile page | ⚠️ PARTIAL | Exists but needs enhancement |
| DDO-S5.2 | Availability & consult type selection | ⚠️ PARTIAL | Basic UI exists (`BookAppointment.tsx`) |
| DDO-S5.3 | Checkout with price breakdown | ⚠️ PARTIAL | Shows price, no coupons/follow-up pricing |
| DDO-S5.4 | "My Appointments" view | ⚠️ PARTIAL | Patient dashboard exists, needs household filter |

**Files**:
- `src/pages/BookAppointment.tsx` - Booking flow
- `src/pages/PatientDashboardNew.tsx` - Patient appointments view
- `src/pages/Index.tsx` - Landing page

---

### ⚠️ Epic 6: Tele-Consult Infrastructure (50% Complete)

| Story | Description | Status | Notes |
|-------|-------------|--------|-------|
| DDO-S6.1 | Tele-consult link configuration | ✅ DONE | Zoom meeting links working |
| DDO-S6.2 | Fallback instructions | ⚠️ PARTIAL | Can be added, not tested |

**Current State**:
- Zoom integration works (`videoService.ts`)
- Meeting links stored in appointments table
- MeetingLinkButton component shows join button

**Files**:
- `src/services/videoService.ts` ✅
- `src/components/appointments/MeetingLinkButton.tsx` ✅

---

### ❌ Epic 7: Pre-Visit Intake (0% Complete)

| Story | Description | Status | Notes |
|-------|-------------|--------|-------|
| DDO-S7.1 | Intake form (symptoms, uploads) | ❌ NOT STARTED | No intake form exists |
| DDO-S7.2 | Secure file storage & scanning | ❌ NOT STARTED | Storage setup exists but no UI |

**Required Work**:
- Create pre-visit intake form
- Implement file upload with virus scanning
- Add intake status tracking
- Create doctor view for intake data

---

### ❌ Epic 8: AI Features (Transcription & SOAP Notes) (0% Complete)

| Story | Description | Status | Notes |
|-------|-------------|--------|-------|
| DDO-S8.1 | Consent & recording banner | ❌ NOT STARTED | No AI consent flow |
| DDO-S8.2 | Live transcription integration | ❌ NOT STARTED | `aiTranscriptionService.ts` exists but not integrated |
| DDO-S8.3 | AI draft SOAP notes & prescriptions | ❌ NOT STARTED | `aiSoapNotesService.ts` exists but not used |
| DDO-S8.4 | AI disclaimers & logging | ❌ NOT STARTED | No audit logging for AI |

**Files Exist (Not Integrated)**:
- `src/services/aiTranscriptionService.ts`
- `src/services/aiSoapNotesService.ts`

---

### ⚠️ Epic 9: PDF Generation (40% Complete)

| Story | Description | Status | Notes |
|-------|-------------|--------|-------|
| DDO-S9.1 | Consultation summary PDF | ✅ DONE | `pdfService.ts` works |
| DDO-S9.2 | Prescription PDF | ⚠️ PARTIAL | Service exists, needs testing |
| DDO-S9.3 | Invoice/receipt PDFs | ⚠️ PARTIAL | Basic PDF exists, tax handling incomplete |

**Files**:
- `src/services/pdfService.ts` ✅
- `src/pages/PDFTestPage.tsx` - Test page exists

---

### ⚠️ Epic 10: Email & Notifications (50% Complete)

| Story | Description | Status | Notes |
|-------|-------------|--------|-------|
| DDO-S10.1 | Email infrastructure & templates | ✅ DONE | `emailService.ts` + `welcomeEmailService.ts` work |
| DDO-S10.2 | Reminder scheduling (T-24h, T-3h, T-30m) | ❌ NOT STARTED | No job queue for reminders |

**Current State**:
- Email sending works
- Welcome emails work
- WhatsApp notifications work (`whatsappService.ts`)
- No automated reminder system

**Required**:
- Implement cron job / scheduled task system
- Add reminder job queue
- Test reminder delivery timing

---

### ❌ Epic 11: Analytics & Exports (0% Complete)

| Story | Description | Status | Notes |
|-------|-------------|--------|-------|
| DDO-S11.1 | Doctor analytics dashboard | ❌ NOT STARTED | Dashboard shows counts, no analytics |
| DDO-S11.2 | CSV export functionality | ❌ NOT STARTED | No export feature |

**Needed**:
- Conversion funnel tracking
- No-show rate calculation
- NPS/CSAT surveys
- Revenue analytics
- CSV export for appointments and invoices

---

### ❌ Epic 12: Admin Console (5% Complete)

| Story | Description | Status | Notes |
|-------|-------------|--------|-------|
| DDO-S12.1 | Admin tenant directory & KYC | ❌ NOT STARTED | No admin console |
| DDO-S12.2 | Clinical responsibility statements | ❌ NOT STARTED | No legal disclaimers |
| DDO-S12.3 | Data retention & Right to Erasure | ❌ NOT STARTED | No GDPR compliance features |

---

### ❌ Epic 13: Support System (0% Complete)

| Story | Description | Status | Notes |
|-------|-------------|--------|-------|
| DDO-S13.1 | "Escalate to Human" widget | ❌ NOT STARTED | No support ticket system |
| DDO-S13.2 | Support console for ops team | ❌ NOT STARTED | No ticketing system |

---

### ⚠️ Epic 14: Observability & Safety (20% Complete)

| Story | Description | Status | Notes |
|-------|-------------|--------|-------|
| DDO-S14.1 | Structured logging & tracing | ⚠️ PARTIAL | Console.log exists, no correlation IDs |
| DDO-S14.2 | Rate limits & safety caps | ❌ NOT STARTED | No rate limiting |
| DDO-S14.3 | Critical alerts | ❌ NOT STARTED | No alerting system |

---

## Critical Issues Identified

### 1. Console Errors (High Priority)

**404 Errors - Old Hospital Tables**:
```
lab, User, esic_surgeons, complications, hope_anaesthetists,
ayushman_surgeons, hope_consultants, ayushman_consultants,
ayushman_anaesthetists, hope_surgeons, radiology, cghs_surgery,
referees, medication
```

**Cause**: `useCounts.ts` queries old hospital management system tables
**Impact**: Noise in console, potential performance impact
**Fix**: Disable these queries for DDO users or remove entirely

**400 Errors - Schema Mismatches**:
```
- patients table: hospital_name column doesn't exist (RLS issue)
- user_profiles table doesn't exist
```

**Fix Required**:
- Update patient queries to remove hospital_name filter
- Remove TenantContext calls to user_profiles table

### 2. Missing Core Features

**High Priority (Needed for MVP)**:
1. ❌ Payment integration (DDO-S4.2)
2. ❌ Doctor fee configuration UI (DDO-S2.2)
3. ❌ Reschedule/cancel flows (DDO-S4.3, DDO-S4.4)
4. ❌ Automated reminders (DDO-S10.2)
5. ❌ Pre-visit intake forms (DDO-S7.1)

**Medium Priority**:
6. ❌ Doctor onboarding wizard (DDO-S2.1)
7. ❌ Household member management (DDO-S1.4)
8. ❌ Coupon system (DDO-S5.3)
9. ❌ Doctor working hours UI (DDO-S3.1)
10. ❌ Mobile OTP login (DDO-S1.3)

---

## Database Schema Status

### ✅ Tables That Exist & Work:
- `doctors` - Doctor profiles
- `patients` - Patient records
- `appointments` - Appointment bookings
- `doctor_availability` - Availability rules

### ⚠️ Tables That Need Updates:
- `patients` - Remove hospital_name column references
- `appointments` - Add payment_id, refund_status fields
- `doctors` - Add consultation_fee, follow_up_fee fields

### ❌ Tables Missing:
- `household_members` - For multi-patient profiles
- `tenant_settings` - Per-tenant configuration
- `feature_flags` - Dynamic feature toggles
- `subscription_plans` - Plan management
- `support_tickets` - Customer support
- `payments` - Payment transactions
- `refunds` - Refund tracking
- `coupons` - Discount codes
- `audit_logs` - Compliance logging
- `intake_forms` - Pre-visit forms
- `ai_transcripts` - AI session data
- `reminders` - Scheduled reminders queue

---

## Recommended Action Plan

### Phase 1: Fix Critical Issues (1-2 days)

1. **Clean up console errors**
   - Fix useCounts.ts to not query old hospital tables
   - Remove TenantContext user_profiles queries
   - Fix patients table queries (remove hospital_name filter)

2. **Enhance doctor dashboard**
   - ✅ Fix appointment display (DONE)
   - ✅ Show patient details (DONE)
   - Add appointment details modal
   - Add quick actions (mark as completed, no-show)

3. **Improve patient details visibility**
   - Add expandable patient card in appointments
   - Show symptoms/reason for visit
   - Display intake form data (when available)

### Phase 2: Core Booking Enhancements (3-5 days)

4. **Payment Integration (DDO-S4.2)**
   - Integrate Razorpay/Stripe
   - Add payment_id to appointments
   - Create payment success/failure flows
   - Test sandbox payments

5. **Doctor Fee Configuration (DDO-S2.2)**
   - Create settings page for doctors
   - Add consultation fee fields
   - Add follow-up window & fee
   - Store in doctor_settings table

6. **Reschedule & Cancel (DDO-S4.3, DDO-S4.4)**
   - Add reschedule button in patient dashboard
   - Implement cancellation with cut-off rules
   - Add refund processing
   - Send confirmation emails

### Phase 3: Essential Features (1 week)

7. **Automated Reminders (DDO-S10.2)**
   - Set up Supabase Edge Functions or cron jobs
   - Implement T-24h, T-3h, T-30m reminders
   - Send email + WhatsApp notifications
   - Track reminder delivery status

8. **Pre-Visit Intake (DDO-S7.1)**
   - Create intake form UI
   - Add file upload for documents
   - Show intake status to doctor
   - Allow patient to edit until appointment time

9. **Doctor Onboarding Wizard (DDO-S2.1)**
   - Multi-step onboarding flow
   - Profile → Specialties → Availability → Fees → Review
   - Save progress and resume
   - Admin KYC review workflow

### Phase 4: Advanced Features (2 weeks)

10. **Household Management (DDO-S1.4)**
    - Create household_members table
    - Add "Add Family Member" UI
    - Filter appointments by member
    - Separate medical history per member

11. **AI Integration (DDO-S8.1-8.4)**
    - Add consent flow
    - Integrate transcription service
    - Generate SOAP notes
    - Add approval workflow

12. **Analytics & Admin (DDO-S11, DDO-S12)**
    - Build analytics dashboard
    - Add CSV exports
    - Create admin console
    - Implement data retention policies

---

## Files That Need Attention

### High Priority Fixes:

1. **`src/hooks/useCounts.ts`**
   - Remove all old hospital table queries
   - Keep only DDO-relevant counts

2. **`src/contexts/TenantContext.tsx`**
   - Remove user_profiles table queries
   - Handle DDO tenant context properly

3. **`src/pages/doctor/DoctorDashboard.tsx`**
   - ✅ Schema fixes applied
   - Add patient details modal
   - Add appointment action buttons

4. **`src/pages/doctor/DoctorCalendar.tsx`**
   - ✅ Schema fixes applied
   - Test calendar display
   - Add quick edit for appointments

### New Files Needed:

1. **`src/pages/doctor/DoctorSettings.tsx`**
   - Fee configuration
   - Availability settings
   - Branding uploads

2. **`src/pages/doctor/DoctorOnboarding.tsx`**
   - Step-by-step wizard
   - Profile completion

3. **`src/pages/patient/IntakeForm.tsx`**
   - Pre-visit questionnaire
   - File uploads

4. **`src/pages/admin/AdminConsole.tsx`**
   - Tenant management
   - KYC review
   - Feature flags

5. **`src/services/paymentService.ts`**
   - Razorpay/Stripe integration
   - Payment processing

6. **`src/services/reminderService.ts`**
   - Scheduled reminders
   - Job queue management

---

## Technical Debt

1. **Schema inconsistencies** - Some queries use old column names
2. **No idempotency keys** - Risk of double bookings
3. **No rate limiting** - API can be abused
4. **No correlation IDs** - Hard to trace requests
5. **No audit logging** - Compliance risk
6. **Mixed contexts** - Hospital system code mixed with DDO code

---

## Testing Gaps

1. ❌ No automated tests for booking flow
2. ❌ No payment integration tests
3. ❌ No reminder delivery tests
4. ❌ No RLS policy tests
5. ❌ No race condition tests for slot booking

---

## Next Immediate Steps

### Today:
1. ✅ Fix DoctorDashboard appointment display
2. ✅ Fix DoctorCalendar schema issues
3. 🔄 Clean up console errors (useCounts.ts)
4. 🔄 Remove TenantContext errors

### Tomorrow:
5. Add appointment details modal
6. Create doctor settings page
7. Start payment integration

### This Week:
8. Implement reschedule/cancel flows
9. Add automated reminders
10. Create pre-visit intake form

---

## Success Metrics

**MVP Launch Criteria** (30% PRD completion):
- ✅ Doctor can sign up and configure profile
- ⚠️ Doctor can set availability and fees (Partial)
- ✅ Patient can book appointments (Basic)
- ❌ Payment processing works
- ❌ Automated reminders sent
- ❌ Pre-visit intake collected
- ✅ Video consultation links work
- ❌ Reschedule/cancel works

**Production Ready** (80% PRD completion):
- All MVP criteria met
- Admin console functional
- Analytics dashboard live
- AI features operational
- Full audit logging
- GDPR compliance features
- Comprehensive testing

---

## Questions for Product Owner

1. **Priority**: Should we focus on payment integration or automated reminders first?
2. **Scope**: Are AI features required for MVP or can they wait for v2?
3. **Multi-tenancy**: Do we need tenant isolation or single-tenant deployment initially?
4. **OTP**: Should patient OTP be SMS-based or email-based?
5. **Payment Gateway**: Razorpay, Stripe, or both?

---

Last Updated: 2025-11-16
Version: 1.0
