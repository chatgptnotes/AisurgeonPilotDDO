# Appointment Workflow Documentation

## Complete Appointment Lifecycle

This document describes the complete appointment workflow system, from booking to completion, including status transitions, doctor actions, and patient experiences.

## Appointment Status Flow

```
pending_payment → scheduled → confirmed → in_progress → completed
                      ↓           ↓            ↓
                  cancelled   cancelled    cancelled
                      ↓
                  no_show
```

### Status Definitions

1. **pending_payment** - Appointment created, awaiting payment confirmation
2. **scheduled** - Payment confirmed, appointment scheduled
3. **confirmed** - Doctor has confirmed the appointment
4. **in_progress** - Consultation is currently happening
5. **completed** - Consultation finished successfully
6. **cancelled** - Appointment was cancelled by doctor or patient
7. **no_show** - Patient did not show up for the appointment

## Doctor Actions at Each Stage

### 1. Scheduled Status
**Available Actions:**
- Confirm Appointment
- Cancel Appointment
- Mark as No Show

**What happens when confirmed:**
- Status changes to "confirmed"
- Patient receives WhatsApp confirmation
- Meeting link is activated (for video appointments)

### 2. Confirmed Status
**Available Actions:**
- Start Consultation
- Move back to Scheduled
- Cancel Appointment

**What happens when started:**
- Status changes to "in_progress"
- Timer starts for consultation duration
- Patient can join video meeting (if video mode)

### 3. In Progress Status
**Available Actions:**
- Complete Consultation
- Cancel Appointment (rare, for emergencies)

**What happens when completed:**
- Status changes to "completed"
- Consultation notes can be added
- Follow-up can be scheduled
- Patient receives completion notification

### 4. Completed/Cancelled Status
**No actions available** - These are terminal states

## Patient Experience

### 1. Booking Process

**Step 1: Select Doctor**
- Browse doctor directory
- View doctor profile and specialties
- Check availability

**Step 2: Choose Date & Time**
- View weekly calendar
- Select available time slots
- Slots are color-coded (available/booked)

**Step 3: Select Mode**
- In-Person Visit
- Video Call
- Phone Call

**Step 4: Provide Medical Information**
- Enter symptoms (optional)
- Describe reason for visit (optional)
- Helps doctor prepare for consultation

**Step 5: Apply Coupon (if applicable)**
- Enter coupon code
- View discount applied

**Step 6: Review & Confirm**
- Review booking summary
- See total price
- Proceed to payment

### 2. Confirmation Page

After booking, patient sees:
- Doctor information with photo
- Appointment date, time, and mode
- Mode-specific instructions
- Medical information provided
- Payment summary
- Confirm button

### 3. Dashboard View

Patients can view:
- Upcoming appointments
- Past appointments
- Appointment status badges
- Meeting links (when available)
- Reschedule/cancel options

## Consultation Modes

### Video Consultation

**For Patients:**
- Receive meeting link via email and WhatsApp
- Link becomes active 15 minutes before appointment
- Can join up to 60 minutes after start time
- Need stable internet and working camera/microphone

**For Doctors:**
- Generate meeting link when confirming appointment
- Start video session from dashboard
- Screen sharing available
- Record session (with patient consent)

### Phone Consultation

**For Patients:**
- Doctor calls at scheduled time
- Ensure phone is charged and has signal
- Keep medical records handy

**For Doctors:**
- Patient phone number displayed
- One-click call feature
- Call duration tracked

### In-Person Visit

**For Patients:**
- Arrive 10 minutes early
- Bring ID and insurance card
- Bring relevant medical records
- Follow clinic safety protocols

**For Doctors:**
- Patient check-in notification
- View patient history before meeting
- Access to all medical records

## Real-Time Notifications

### WhatsApp Notifications (via DoubleTick)

**Patients receive notifications for:**
1. Appointment booked confirmation
2. Doctor confirmed appointment
3. Reminder 24 hours before
4. Reminder 1 hour before
5. Meeting link shared (video appointments)
6. Appointment started
7. Appointment completed
8. Appointment cancelled/rescheduled

**Doctors receive notifications for:**
1. New appointment booked
2. Patient cancelled appointment
3. Upcoming appointment reminder
4. Patient joined waiting room (for video)

### Email Notifications

Same events as WhatsApp, plus:
- Detailed appointment summary
- Calendar invite (.ics file)
- Pre-consultation questionnaire
- Post-consultation survey

## Meeting Link Access

### Video Appointments Only

**Link Generation:**
- Created when appointment is confirmed
- Uses integration with video platform (Zoom/Google Meet/custom)
- Unique link per appointment
- Expires after appointment end time + 1 hour

**Access Control:**
```typescript
function canJoinMeeting(appointment) {
  if (appointment.mode !== 'video') return false;

  const appointmentTime = new Date(appointment.start_at);
  const now = new Date();
  const minutesUntil = (appointmentTime.getTime() - now.getTime()) / 1000 / 60;

  // Allow joining 15 minutes before and up to 60 minutes after
  return minutesUntil <= 15 && minutesUntil >= -60;
}
```

**Link Display:**
- Not shown until 15 minutes before appointment
- Highlighted in green when active
- Shows countdown timer
- One-click join button

## Status Transition Rules

### From Pending Payment
- **To Scheduled**: When payment is confirmed
- **To Cancelled**: If payment not received in 30 minutes

### From Scheduled
- **To Confirmed**: Doctor confirms manually
- **To Cancelled**: Doctor/patient cancels
- **To No Show**: Patient doesn't arrive within 15 minutes of start time

### From Confirmed
- **To In Progress**: Doctor clicks "Start Consultation"
- **To Scheduled**: Doctor moves back (before appointment time)
- **To Cancelled**: Doctor/patient cancels

### From In Progress
- **To Completed**: Doctor clicks "Complete Consultation"
- **To Cancelled**: Emergency cancellation only

### Terminal States
- **Completed**: No further transitions
- **Cancelled**: No further transitions
- **No Show**: Can be manually changed to cancelled

## Error Handling

### Double Booking Prevention
- Check for existing appointments in time slot
- Lock slot during booking process (5 minutes)
- Real-time availability updates

### Cancellation Policy
- Free cancellation up to 24 hours before
- 50% charge for 24-6 hours before
- Full charge for less than 6 hours before
- No penalty for doctor-initiated cancellations

### No Show Handling
- Automatic status change after 15 minutes
- Patient charged full amount
- Can dispute within 24 hours
- Doctor can manually override

## Integration Points

### Payment Gateway
- Razorpay/Stripe integration
- Automatic refund for cancellations
- Split payment support (deposits)

### Calendar Sync
- Export to Google Calendar
- iCal format support
- Auto-update on reschedule/cancel

### Video Platform
- Zoom API integration
- Google Meet integration
- Custom WebRTC option

### WhatsApp (DoubleTick)
- Template: appointment_confirmation
- Template: appointment_reminder
- Template: appointment_cancelled
- Template: meeting_link_share

## Database Schema

### Key Fields in appointments Table

```sql
- id (uuid)
- doctor_id (uuid, foreign key)
- patient_id (uuid, foreign key)
- start_at (timestamp)
- end_at (timestamp)
- status (enum)
- appointment_type (standard/followup/emergency)
- mode (video/phone/in-person)
- price (decimal)
- discount_amount (decimal)
- symptoms (text, optional)
- reason_for_visit (text, optional)
- meeting_link (text, for video)
- payment_status (pending/paid/refunded)
- created_at (timestamp)
- updated_at (timestamp)
```

## Analytics & Reporting

### For Doctors
- Appointment completion rate
- Average consultation duration
- No-show rate
- Revenue by period
- Popular time slots
- Patient retention rate

### For Patients
- Appointment history
- Total spend
- Favorite doctors
- Health timeline

## Future Enhancements

1. **AI-Powered Scheduling**
   - Smart slot suggestions
   - Predict no-shows
   - Optimize doctor availability

2. **Telemedicine Features**
   - Digital prescriptions
   - E-lab reports
   - Remote monitoring integration

3. **Group Appointments**
   - Family consultations
   - Support group sessions

4. **Recurring Appointments**
   - Weekly/monthly auto-booking
   - Chronic care management

5. **Waitlist Management**
   - Auto-fill cancelled slots
   - Priority booking for urgent cases

## Testing Checklist

- [ ] Book appointment with all three modes
- [ ] Apply valid and invalid coupons
- [ ] Test status transitions (scheduled → confirmed → in_progress → completed)
- [ ] Cancel appointment at different stages
- [ ] Test meeting link access timing
- [ ] Verify WhatsApp notifications
- [ ] Test double-booking prevention
- [ ] Check payment flow
- [ ] Test reminder notifications
- [ ] Verify doctor dashboard real-time updates
- [ ] Test patient dashboard appointment display
- [ ] Check calendar export functionality

## Support & Troubleshooting

### Common Issues

**Meeting link not showing:**
- Check if status is "confirmed"
- Verify it's within 15 minutes of start time
- Check appointment mode is "video"

**Status not updating:**
- Check real-time subscription is active
- Verify Supabase connection
- Check for database permission errors

**Notifications not received:**
- Verify WhatsApp template approval
- Check DoubleTick API credits
- Verify phone number format

**Double booking occurred:**
- Check availability refresh logic
- Verify transaction isolation
- Review concurrent booking logs

## Contact

For technical support or questions about the appointment workflow:
- Email: support@aisurgeonpilot.com
- WhatsApp: +91-XXXXXXXXXX
- Developer Docs: https://docs.aisurgeonpilot.com
