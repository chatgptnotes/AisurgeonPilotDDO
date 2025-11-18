# Appointment Workflow Testing Guide

## Quick Start

**Local Server:** http://localhost:8084

This guide provides step-by-step instructions for testing the complete appointment workflow system.

## Prerequisites

1. Development server running: `npm run dev`
2. Database connected (Supabase)
3. At least one doctor account in the system
4. At least one patient account in the system

## Test Scenarios

### Scenario 1: Complete Booking Flow (Patient Side)

#### Step 1: Browse Doctors
```
1. Navigate to: http://localhost:8084/doctors
2. Verify:
   - Doctor cards display correctly
   - Profile photos load
   - Specialties shown
   - Consultation fees visible
   - "View Profile" and "Book Now" buttons work
```

#### Step 2: View Doctor Profile
```
1. Click on any doctor card
2. Verify:
   - Full doctor information displays
   - About section shows
   - Qualifications listed
   - Consultation fees for standard and follow-up
   - Availability schedule visible
   - "Book Appointment" button works
```

#### Step 3: Book Appointment
```
URL Pattern: http://localhost:8084/book/{doctorId}

1. Select Date:
   - View current week calendar
   - Past dates are disabled
   - Click on available future date
   - Date highlights in blue

2. Select Time:
   - View available time slots for selected date
   - Booked slots are disabled (grayed out)
   - Click on available slot
   - Slot highlights in blue

3. Choose Mode:
   - Select "In-Person Visit" radio button
   - OR select "Video Call"
   - OR select "Phone Call"
   - Verify instruction box appears below selection

4. Enter Medical Information (Optional):
   - Type symptoms in "Chief Complaint / Symptoms" field
   - Type reason in "Reason for Visit" field
   - Verify both fields accept text

5. Apply Coupon (Optional):
   - Enter valid coupon code
   - Click "Apply" button
   - Verify discount shows in summary
   - Verify total price updates

6. Review Summary:
   - Right sidebar shows:
     - Consultation type
     - Appointment mode with icon
     - Selected date and time
     - Fee breakdown
     - Discount (if applied)
     - Total amount

7. Submit Booking:
   - Click "Proceed to Payment"
   - Verify appointment is created
   - Success toast appears
   - Redirect to confirmation page
```

#### Step 4: Appointment Confirmation
```
URL Pattern: http://localhost:8084/appointment/confirm/{appointmentId}

1. Verify Page Layout:
   - Green success checkmark at top
   - "Appointment Booked Successfully!" heading
   - Doctor information card
   - Appointment details card
   - Mode-specific instructions card
   - Payment summary sidebar

2. Check Doctor Information:
   - Profile photo displays
   - Doctor name correct
   - Specialties shown as badges

3. Check Appointment Details:
   - Date formatted correctly (e.g., "Monday, November 15, 2025")
   - Time range shown (e.g., "2:00 PM - 2:30 PM")
   - Mode icon and label correct
   - Appointment type shown

4. Verify Mode-Specific Instructions:

   FOR VIDEO:
   - Green card displays
   - Lists video requirements
   - Shows meeting link (if available)
   - Can click link to test

   FOR PHONE:
   - Purple card displays
   - Shows phone call instructions
   - Lists preparation steps

   FOR IN-PERSON:
   - Blue card displays
   - Shows arrival instructions
   - Lists what to bring

5. Check Medical Information:
   - If entered, symptoms display
   - If entered, reason for visit displays
   - Section hidden if nothing entered

6. Verify Payment Summary:
   - Consultation fee correct
   - Discount shown (if applied)
   - Total amount matches
   - Important notes listed

7. Confirm Appointment:
   - Click "Confirm Appointment" button
   - Button shows loading state
   - Success toast appears
   - Button changes to "Already Confirmed"
   - Redirect to patient dashboard after 1.5 seconds
```

#### Step 5: View in Patient Dashboard
```
URL: http://localhost:8084/patient-dashboard

1. Verify appointment appears in "Upcoming Appointments"
2. Check status badge shows "Pending Payment" or "Confirmed"
3. Verify all appointment details correct
4. Test "View Details" button
```

### Scenario 2: Doctor Status Management

#### Step 1: Access Doctor Dashboard
```
URL: http://localhost:8084/doctor/dashboard

1. Login as doctor
2. Verify dashboard loads:
   - Stats cards at top
   - Today's appointments section
   - Next 7 days sidebar
```

#### Step 2: View Today's Appointments
```
1. Check appointment cards show:
   - Patient photo and name
   - Appointment time
   - Phone number
   - Status badge
   - Action buttons

2. Verify status badge colors:
   - Scheduled: Blue
   - Confirmed: Green
   - In Progress: Purple
   - Completed: Gray
   - Cancelled: Red
   - No Show: Orange
```

#### Step 3: Test Status Transitions

**From Scheduled to Confirmed:**
```
1. Find appointment with "Scheduled" status
2. Click "Confirm" button
3. Verify:
   - Button shows loading state
   - Success toast appears: "Appointment confirmed"
   - Status badge changes to "Confirmed" (green)
   - Action buttons update to show "Start" button
```

**From Confirmed to In Progress:**
```
1. Find appointment with "Confirmed" status
2. Click "Start" button
3. Verify:
   - Button shows loading state
   - Success toast appears: "Appointment in progress"
   - Status badge changes to "In Progress" (purple)
   - Action buttons update to show "Complete" button
```

**From In Progress to Completed:**
```
1. Find appointment with "In Progress" status
2. Click "Complete" button
3. Verify:
   - Button shows loading state
   - Success toast appears: "Appointment completed"
   - Status badge changes to "Completed" (gray)
   - Action buttons disappear (terminal state)
```

#### Step 4: Test Additional Actions

**Cancel Appointment:**
```
1. Find any non-completed appointment
2. Click three-dot menu button
3. Click "Cancel Appointment"
4. Dialog appears asking for confirmation
5. Click "Yes, Cancel"
6. Verify:
   - Dialog closes
   - Success toast: "Appointment cancelled"
   - Status changes to "Cancelled" (red)
   - Action buttons disappear
```

**Move Back to Scheduled:**
```
1. Find appointment with "Confirmed" status
2. Click three-dot menu
3. Click "Move to Scheduled"
4. Verify:
   - Status changes back to "Scheduled" (blue)
   - "Confirm" button appears again
```

**Mark as No Show:**
```
1. Find appointment with "Scheduled" status
2. Click three-dot menu
3. Click "Mark as No Show"
4. Verify:
   - Status changes to "No Show" (orange)
   - Action buttons disappear
```

### Scenario 3: Real-Time Updates

#### Setup:
```
1. Open two browser windows side by side
2. Window A: Doctor dashboard (logged in as doctor)
3. Window B: Patient dashboard (logged in as patient)
4. Book an appointment as patient
```

#### Test:
```
1. In Window A (Doctor):
   - New appointment appears automatically
   - Toast notification: "New appointment booked"

2. Change status in Window A:
   - Click "Confirm" on appointment

3. In Window B (Patient):
   - Appointment status updates automatically
   - Status badge changes color
   - No page refresh needed

4. Cancel appointment in Window A:
   - Click cancel in doctor dashboard

5. In Window B (Patient):
   - Status updates to "Cancelled"
   - Updates in real-time
```

### Scenario 4: Error Handling

#### Test Invalid Appointment ID:
```
1. Navigate to: http://localhost:8084/appointment/confirm/invalid-id
2. Verify:
   - Error message displays
   - "Appointment Not Found" shown
   - "Go to Dashboard" button works
```

#### Test Double Booking Prevention:
```
1. Book appointment for specific time slot
2. Try to book same time slot again
3. Verify:
   - Slot shows as unavailable
   - Cannot select grayed-out slot
```

#### Test Network Error:
```
1. Disconnect network
2. Try to update appointment status
3. Verify:
   - Error toast appears
   - Status doesn't change
   - Can retry when network restored
```

### Scenario 5: Responsive Design

#### Mobile View (375px):
```
1. Open Chrome DevTools
2. Toggle device toolbar
3. Select iPhone SE or similar
4. Navigate through all pages
5. Verify:
   - All buttons accessible
   - Text readable without horizontal scroll
   - Forms fill screen width
   - Modals/dialogs fit screen
   - Touch targets at least 44px
```

#### Tablet View (768px):
```
1. Set viewport to iPad
2. Test all pages
3. Verify:
   - Two-column layouts work
   - Sidebars visible
   - Cards stack appropriately
```

#### Desktop View (1920px):
```
1. Full screen browser
2. Verify:
   - Content centered with max-width
   - Cards use grid layout
   - Whitespace appropriate
   - No stretched elements
```

### Scenario 6: Meeting Link Access (Video Appointments)

#### Before Appointment Time:
```
1. Book video appointment for future time (>15 minutes away)
2. View in patient dashboard
3. Verify:
   - Meeting link button disabled or hidden
   - Message: "Link will be available 15 minutes before"
```

#### 15 Minutes Before:
```
1. Wait until 15 minutes before start time
2. Refresh dashboard
3. Verify:
   - Meeting link button enabled
   - Button highlighted/prominent
   - Click button opens link in new tab
```

#### After Appointment End:
```
1. Wait until 60 minutes after appointment end
2. Refresh dashboard
3. Verify:
   - Meeting link no longer accessible
   - Appointment shows as past
```

## Data Validation Tests

### Booking Form Validation:
```
1. Try to submit without selecting time
   - Error: "Please select a time slot"

2. Try to submit without selecting mode
   - Form should require mode selection

3. Try very long text in symptoms field
   - Should accept up to reasonable limit
   - No character limit errors

4. Try invalid coupon code
   - Error toast: "Invalid coupon code"
   - Discount not applied
```

### Status Transition Validation:
```
1. Try to complete appointment without starting
   - Should not be possible (button not shown)

2. Try to start already completed appointment
   - Should not be possible (button not shown)

3. Try to confirm cancelled appointment
   - Should not be possible (no actions shown)
```

## Performance Tests

### Page Load Time:
```
1. Open Network tab in DevTools
2. Navigate to confirmation page
3. Verify:
   - Initial load < 2 seconds
   - No unnecessary API calls
   - Images lazy load
```

### Status Update Speed:
```
1. Click status action button
2. Measure time to UI update
3. Verify:
   - Optimistic UI update (immediate)
   - Toast appears within 500ms
   - Database update confirmed
```

## Accessibility Tests

### Keyboard Navigation:
```
1. Use only keyboard (Tab, Enter, Escape)
2. Navigate through booking flow
3. Verify:
   - All interactive elements focusable
   - Focus indicators visible
   - Can complete entire flow without mouse
```

### Screen Reader:
```
1. Enable screen reader (VoiceOver/NVDA)
2. Navigate through pages
3. Verify:
   - All content announced
   - Buttons have descriptive labels
   - Form fields have labels
   - Status changes announced
```

### Color Contrast:
```
1. Check status badge colors
2. Verify WCAG AA compliance
3. Test with color blindness simulator
4. Ensure information not conveyed by color alone
```

## Integration Readiness Tests

### WhatsApp Notification Points:
```
Check TODO comments in:
1. AppointmentActions.tsx (line ~45)
2. AppointmentConfirmation.tsx (line ~115)

Verify placeholders exist for:
- Appointment confirmation
- Status updates
- Cancellation notifications
```

### Payment Gateway Points:
```
Check in BookAppointment.tsx:
1. After appointment creation (line ~248)
2. Verify TODO comment for payment redirect
3. Confirm payment_status field set correctly
```

### Video Platform Points:
```
Check in AppointmentConfirmation.tsx:
1. meeting_link field displayed (line ~280)
2. Verify link formatting
3. Check canJoinMeeting logic
```

## Bug Report Template

If you find any issues, document them as:

```markdown
### Bug Title: [Short description]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Screenshots:**
[Attach if relevant]

**Environment:**
- Browser: [Chrome/Firefox/Safari]
- Device: [Desktop/Mobile/Tablet]
- Screen size: [1920x1080 / etc]
- User role: [Doctor/Patient]

**Console Errors:**
[Copy any console errors]
```

## Success Criteria

All tests pass when:
- [ ] Booking flow completes successfully
- [ ] Confirmation page displays all information
- [ ] Doctor can manage appointment statuses
- [ ] Real-time updates work
- [ ] Mobile/tablet/desktop responsive
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] All buttons/links functional
- [ ] Forms validate correctly
- [ ] Loading states display
- [ ] Error messages clear and helpful
- [ ] Status badges color-coded correctly
- [ ] Meeting link access control works
- [ ] Keyboard navigation functional
- [ ] Screen reader accessible

## Quick Test Checklist

For rapid testing, use this quick checklist:

```
Patient Flow:
[ ] Browse doctors
[ ] View doctor profile
[ ] Book appointment (all modes)
[ ] View confirmation page
[ ] Confirm appointment
[ ] See in dashboard

Doctor Flow:
[ ] View today's appointments
[ ] Confirm appointment
[ ] Start appointment
[ ] Complete appointment
[ ] Cancel appointment

Real-Time:
[ ] New booking appears
[ ] Status updates sync
[ ] Cancellation syncs

Responsive:
[ ] Mobile (375px)
[ ] Tablet (768px)
[ ] Desktop (1920px)

Error Handling:
[ ] Invalid appointment ID
[ ] Network error
[ ] Validation errors
```

## Support

For questions or issues during testing:
1. Check APPOINTMENT_WORKFLOW.md for detailed workflow
2. Review APPOINTMENT_WORKFLOW_IMPLEMENTATION_SUMMARY.md
3. Check console for error messages
4. Verify database connectivity
5. Ensure all environment variables set

## Notes

- Test with real dates/times to ensure proper time zone handling
- Clear browser cache if UI doesn't update
- Check Supabase logs for database errors
- Use browser DevTools Network tab to debug API calls
- Enable React DevTools for component debugging

Happy Testing!
