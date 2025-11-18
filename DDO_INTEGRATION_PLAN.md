# DDO Integration Plan - Digital Doctor Office for Multi-Hospital Practice

## Overview

This application serves doctors who work across multiple hospitals and manage patients in various facilities. We need to integrate DDO features while maintaining the existing hospital management system.

## Current System Analysis

**Existing Dashboard Features:**
- Multi-hospital support (Hope, Ayushman, ESIC, CGHS)
- Patient Management across hospitals
- Operation Theatre Management
- IPD/OPD tracking
- Lab, Radiology, Pharmacy
- Billing and Accounting
- Multiple surgeon/consultant tracking

**New DDO Features Built:**
- Patient-facing appointment booking
- Doctor directory and profiles
- WhatsApp notifications (9 templates)
- Patient dashboard
- Appointment management
- Email notifications
- Patient settings

## Integration Strategy

### Phase 1: Doctor Dashboard Enhancement (CURRENT PRIORITY)

#### 1.1 Create Unified Doctor Dashboard
**File:** `src/pages/doctor/DoctorDashboard.tsx`

**Features to Include:**
- Overview of all appointments across all hospitals
- Quick stats: Today's appointments, This week, This month
- Revenue analytics across all practices
- Patient follow-up tracking
- WhatsApp message history
- Upcoming appointments with patient details

#### 1.2 Appointment Management View
**File:** `src/pages/doctor/AppointmentManagement.tsx`

**Features:**
- List view with filters (date, hospital, status, type)
- Quick actions: Reschedule, Cancel, Mark No-show
- Patient intake form review
- Consultation notes entry
- Prescription generation
- Generate summary PDF

#### 1.3 Multi-Hospital Schedule Management
**File:** `src/pages/doctor/ScheduleManagement.tsx`

**Features:**
- Set working hours per hospital
- Configure slot duration, buffers per location
- Blackout dates management
- Hospital-specific fee configuration
- Auto-sync with existing hospital systems

### Phase 2: Patient Integration

#### 2.1 Link Hospital Patients to DDO Patients
- Create mapping table: `patient_mappings`
  ```sql
  CREATE TABLE patient_mappings (
    id UUID PRIMARY KEY,
    ddo_patient_id UUID REFERENCES patients(id),
    hospital VARCHAR,
    hospital_patient_id VARCHAR,
    hospital_mrn VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

#### 2.2 Patient Portal Enhancement
- Show hospital-specific medical records
- Access to previous visits across all hospitals
- Download reports from all practices
- Unified prescription history

### Phase 3: Analytics & Reporting

#### 3.1 Multi-Practice Analytics
**File:** `src/pages/doctor/Analytics.tsx`

**Metrics:**
- Revenue by hospital
- Patient distribution across hospitals
- Consultation type breakdown (tele/clinic/home)
- Follow-up conversion rates
- No-show rates by location
- Popular time slots per hospital

#### 3.2 Export & Compliance
- CSV export for appointments by hospital
- Tax reporting per practice location
- Patient consent tracking
- AI usage logs (when implemented)

### Phase 4: Billing Integration

#### 4.1 Unified Billing Dashboard
- Combine DDO appointment billing with hospital billing
- Show pending payments across all practices
- Payment reconciliation
- Invoice generation per hospital

#### 4.2 Multi-Currency Support
- Different fee structures per hospital
- Currency conversion for international patients
- Tax handling per region

### Phase 5: AI Features (Future)

#### 5.1 Consultation Workspace
- Live transcription during consult
- AI-generated SOAP notes
- Draft prescription with drug interaction checks
- Clinical decision support

#### 5.2 Patient Education
- Automated follow-up content via WhatsApp
- Surgery-specific education materials
- Pre/post-op instructions

## Database Schema Extensions

### New Tables Required

```sql
-- Doctor Hospital Associations
CREATE TABLE doctor_hospital_associations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id),
  hospital_name VARCHAR NOT NULL,
  hospital_id VARCHAR,
  is_primary BOOLEAN DEFAULT FALSE,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctor Working Hours Per Hospital
CREATE TABLE doctor_hospital_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id),
  hospital_name VARCHAR NOT NULL,
  day_of_week INTEGER, -- 1=Monday, 7=Sunday
  start_time TIME,
  end_time TIME,
  slot_duration_minutes INTEGER DEFAULT 30,
  buffer_minutes INTEGER DEFAULT 5,
  max_appointments INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hospital-Specific Fee Configuration
CREATE TABLE doctor_hospital_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id),
  hospital_name VARCHAR NOT NULL,
  consultation_type VARCHAR, -- 'standard', 'followup', 'emergency'
  mode VARCHAR, -- 'in-person', 'video', 'phone'
  fee_amount DECIMAL(10,2),
  currency VARCHAR DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, hospital_name, consultation_type, mode)
);
```

## File Structure

```
src/
├── pages/
│   ├── doctor/
│   │   ├── DoctorDashboard.tsx           (NEW - Main dashboard)
│   │   ├── AppointmentManagement.tsx     (NEW - Manage appointments)
│   │   ├── ScheduleManagement.tsx        (NEW - Multi-hospital schedules)
│   │   ├── Analytics.tsx                 (NEW - Practice analytics)
│   │   ├── PatientRecords.tsx            (NEW - Unified patient view)
│   │   ├── Settings.tsx                  (NEW - Doctor settings)
│   │   └── ...
│   ├── patient/
│   │   ├── PatientDashboardNew.tsx       (EXISTS - Current dashboard)
│   │   ├── PatientSettings.tsx           (EXISTS - Settings page)
│   │   └── ...
│   └── ...
├── components/
│   ├── doctor/
│   │   ├── AppointmentCard.tsx
│   │   ├── QuickStats.tsx
│   │   ├── UpcomingAppointments.tsx
│   │   ├── RevenueChart.tsx
│   │   └── HospitalSelector.tsx
│   └── ...
└── services/
    ├── whatsappService.ts               (EXISTS - WhatsApp integration)
    ├── emailService.ts                   (EXISTS - Email integration)
    ├── appointmentService.ts             (NEW - Appointment logic)
    └── analyticsService.ts               (NEW - Analytics logic)
```

## Implementation Priority

### IMMEDIATE (Week 1)
1. ✅ Fix current issues (Settings icon, WhatsApp templates) - DONE
2. 🔄 Create Doctor Dashboard with basic stats
3. 🔄 Appointment Management view with filters
4. 🔄 Hospital selector component

### SHORT TERM (Week 2-3)
5. Multi-hospital schedule configuration
6. Fee configuration per hospital
7. Patient-hospital mapping
8. Analytics dashboard

### MEDIUM TERM (Week 4-6)
9. AI transcription integration
10. Prescription generation
11. Billing reconciliation
12. Export functionality

### LONG TERM (Month 2+)
13. Advanced analytics
14. Patient education automation
15. Compliance reporting
16. Mobile app integration

## Migration Path

### Step 1: Doctor Association
- Map existing doctors to hospitals
- Import working hours from current system
- Set up fee structures

### Step 2: Patient Linking
- Link existing patients to DDO patients
- Maintain backward compatibility
- Gradual migration of records

### Step 3: Appointment Sync
- Sync existing appointments to new system
- Dual-write during transition
- Validate data consistency

### Step 4: Feature Rollout
- Enable DDO features per doctor
- Feature flags for gradual rollout
- Collect feedback and iterate

## Key Decisions Needed

1. **Primary Hospital Designation**
   - Should each doctor have a primary hospital?
   - How to handle conflicting schedules?

2. **Fee Structure**
   - Different fees per hospital or unified pricing?
   - How to handle discounts/coupons across hospitals?

3. **Patient Records**
   - Separate records per hospital or unified view?
   - Data sharing permissions between hospitals?

4. **Billing**
   - Separate billing per hospital?
   - Consolidated statements?

5. **Analytics**
   - Hospital-wise reporting required?
   - Aggregate across all practices?

## Success Metrics

1. Doctor can view all appointments across hospitals in one dashboard
2. Patients can book appointments at any doctor's practice location
3. WhatsApp notifications sent for all appointment types
4. Revenue tracking across all hospitals
5. Zero double-bookings across practices
6. <2 second load time for dashboard
7. >90% appointment reminder delivery rate

---

**Status:** Planning phase complete
**Next Action:** Create DoctorDashboard.tsx with basic features
**Owner:** Development team
**Timeline:** 6 weeks to MVP
