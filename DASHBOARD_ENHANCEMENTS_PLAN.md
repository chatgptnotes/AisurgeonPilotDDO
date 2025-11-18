# Dashboard Enhancements Implementation Plan

## Requirements Analysis

### 1. Stats Cards - Make Clickable ✅
- **Total Patients Card** → Opens PatientListModal showing all patients
- **This Week's Appointments Card** → Opens AppointmentListModal with week's appointments
- **Today's Consultations** → Show today's completed consultations (keep as is or make clickable)
- **Revenue This Month** → Add actual revenue calculation from appointments

### 2. Next 7 Days Calendar - Make Clickable ✅
- Each day should be clickable
- Clicking shows appointments for that specific day in AppointmentListModal
- Visual feedback on hover

### 3. Default Appointment Status ✅
- Change from 'confirmed' to 'scheduled' for new appointments
- Doctor must manually confirm
- Files to update:
  - QuickBookingModal.tsx (line 153)
  - Any other booking forms

### 4. Remove WhatsApp Manager ✅
- Remove manual WhatsApp sending button/section
- Make all notifications fully automated
- Keep automated triggers:
  - Confirmation → When doctor confirms
  - Cancellation → When doctor cancels
  - Reschedule → When doctor reschedules

### 5. Automated Reminders System ⚠️ COMPLEX
- **24-hour reminder**:
  - Cron job or scheduled function
  - Runs daily at specific time
  - Finds appointments 24h ahead
  - Sends WhatsApp + Email

- **3-hour reminder**:
  - Runs every hour
  - Finds appointments 3h ahead
  - Sends WhatsApp + Email

- Implementation options:
  - Supabase Edge Functions with cron
  - External cron service
  - Server-side implementation

### 6. Revenue Tracking ✅
- Get doctor's consultation fee from doctors table
- Calculate: completed appointments × consultation fee
- Display in Revenue card
- Consider:
  - Standard vs Follow-up fees
  - Payment status tracking

## Implementation Steps

### Phase 1: UI Enhancements (PRIORITY)
1. ✅ Create AppointmentListModal component
2. ✅ Create PatientListModal component
3. Update DoctorDashboard.tsx:
   - Add modal states
   - Add click handlers for stats cards
   - Make Next 7 Days clickable
   - Fetch and store all week appointments
   - Add revenue calculation

### Phase 2: Status & Automation (PRIORITY)
4. Change default status to 'scheduled'
5. Remove WhatsApp Manager UI
6. Ensure notifications only fire on doctor actions

### Phase 3: Revenue Calculation (PRIORITY)
7. Add consultation_fee_standard to appointments on creation
8. Calculate monthly revenue from completed appointments
9. Update stats display

### Phase 4: Automated Reminders (FUTURE/SEPARATE TASK)
10. Set up Supabase Edge Function for reminders
11. Create cron triggers
12. Test reminder system

## Files to Modify

1. `/src/pages/doctor/DoctorDashboard.tsx` - Main updates
2. `/src/components/appointments/QuickBookingModal.tsx` - Status change
3. `/src/components/appointments/AppointmentDetailsModal.tsx` - Ensure notifications work
4. Create new reminder service (future)

## Testing Checklist

- [ ] Click "Total Patients" → Shows all patients
- [ ] Click "This Week's Appointments" → Shows week appointments
- [ ] Click days in Next 7 Days → Shows day-specific appointments
- [ ] New appointments created with 'scheduled' status
- [ ] Doctor can confirm → sends notifications
- [ ] Doctor can cancel → sends notifications
- [ ] Doctor can reschedule → sends notifications
- [ ] Revenue shows correct calculation
- [ ] No manual WhatsApp buttons visible

## Notes

- Automated reminders require backend/cron setup - should be separate task
- Revenue needs doctor fee configuration - add to Doctor Settings page
- All appointment lists should be sortable/filterable
