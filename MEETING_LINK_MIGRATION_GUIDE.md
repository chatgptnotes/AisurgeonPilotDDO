# Meeting Link Migration Guide

## Overview

This guide documents the migration from auto-generated Daily.co meeting rooms to using doctor's permanent meeting links.

## What Changed?

### Before (Old Approach)
- **Per-appointment room generation**: Each video appointment automatically created a new Daily.co room
- **Stored in appointments table**: `meeting_link` column in `appointments` table
- **Auto-generation on booking**: `createMeetingRoom()` called during appointment creation
- **One-time use**: Links were specific to each appointment

### After (New Approach)
- **Permanent doctor rooms**: Each doctor has their own permanent meeting link
- **Stored in doctors table**: Meeting settings in `doctors` table (see schema below)
- **Pre-configured**: Doctors set up their meeting link once in profile settings
- **Reusable**: Same link used for all video appointments
- **Platform agnostic**: Supports Zoom, Google Meet, Teams, etc.

## Database Schema Changes

### Doctors Table (New Fields)
```sql
doctors:
  - meeting_platform: string (zoom, google_meet, microsoft_teams, daily_co, custom)
  - meeting_link: string (permanent video conference URL)
  - meeting_password: string (optional, meeting password)
  - meeting_id: string (optional, meeting ID for platforms like Zoom)
  - meeting_instructions: text (optional, custom instructions for patients)
```

### Appointments Table
- No longer stores per-appointment `meeting_link`
- References doctor's meeting settings via relationship

## Code Changes

### 1. BookAppointment.tsx
**Removed:**
```typescript
import { createMeetingRoom } from '@/services/videoService';

// Auto-generation logic removed
if (appointmentMode === 'video') {
  const meetingLink = await createMeetingRoom(appointment.id);
}
```

**Changed to:**
```typescript
// Meeting link will be doctor's permanent meeting room (no generation needed)
// Doctor's meeting settings are fetched on confirmation page
```

### 2. AppointmentConfirmation.tsx
**Updated query to include doctor's meeting settings:**
```typescript
const { data, error } = await supabase
  .from('appointments')
  .select(`
    *,
    doctors (
      id,
      full_name,
      specialties,
      profile_photo_url,
      consultation_fee_standard,
      consultation_fee_followup,
      currency,
      meeting_platform,      // NEW
      meeting_link,          // NEW
      meeting_password,      // NEW
      meeting_id,            // NEW
      meeting_instructions   // NEW
    ),
    patients (
      id,
      name,
      phone,
      email
    )
  `)
  .eq('id', id)
  .single();
```

**Added comprehensive meeting details UI:**
- Platform badge
- Copy-able meeting link
- Show/hide password toggle
- Meeting ID display
- Custom instructions
- Direct "Open Meeting Link" button

### 3. MeetingLinkButton.tsx
**Updated interface to reference doctor's meeting settings:**
```typescript
interface Props {
  appointment: {
    mode: string;
    start_at: string;
    doctors?: {
      meeting_platform?: string;
      meeting_link?: string;
      meeting_password?: string;
      meeting_id?: string;
    };
  };
}
```

**Changed logic:**
- Checks for `appointment.doctors?.meeting_link` instead of `appointment.meeting_link`
- Shows password hint if available
- Opens doctor's permanent link

### 4. Dashboard Queries
**PatientDashboardNew.tsx** and **DoctorDashboard.tsx** both updated to include:
```typescript
doctors(
  full_name,
  specialties,
  profile_photo_url,
  meeting_platform,
  meeting_link,
  meeting_password,
  meeting_id
)
```

### 5. videoService.ts
**Marked as deprecated:**
```typescript
/**
 * @deprecated This service is no longer used for auto-generating meeting rooms.
 * See MIGRATION_GUIDE.md for details on the new approach.
 */
```

## Benefits of New Approach

### 1. Simplified Flow
- No API calls to Daily.co during booking
- Faster appointment creation
- Less error handling needed

### 2. Platform Flexibility
- Doctors can use any video platform (Zoom, Meet, Teams, etc.)
- No vendor lock-in to Daily.co
- Easier for doctors who already have preferred platforms

### 3. Cost Reduction
- No per-meeting room creation costs
- No Daily.co API limits to worry about
- Reduced API usage

### 4. User Experience
- Consistent meeting link for all appointments
- Patients can bookmark doctor's link
- Familiar platform for doctors

### 5. Reliability
- No dependency on external API during booking
- Doctor controls their own meeting platform
- Fewer points of failure

## Migration Checklist

- [x] Remove Daily.co auto-generation from BookAppointment.tsx
- [x] Update AppointmentConfirmation.tsx to show doctor's meeting settings
- [x] Update MeetingLinkButton component
- [x] Update PatientDashboardNew query
- [x] Update DoctorDashboard query
- [x] Mark videoService.ts as deprecated
- [x] Create migration documentation

## Doctor Setup Requirements

For doctors to use video consultations, they must:

1. Navigate to **Doctor Settings** → **Meeting Configuration**
2. Select their preferred platform
3. Enter their permanent meeting link
4. (Optional) Add meeting password
5. (Optional) Add meeting ID
6. (Optional) Add custom instructions for patients

## Patient Experience

When booking a video appointment:
1. Patient selects "Video Call" mode during booking
2. Appointment is created (no meeting link generated)
3. On confirmation page, patient sees doctor's meeting details
4. Patient can copy link, see password, and view instructions
5. 15 minutes before appointment, "Join" button becomes active
6. Clicking join opens doctor's permanent meeting link

## Backward Compatibility

### Existing Appointments
- Old appointments with per-appointment links still work
- No data migration needed
- Old links remain valid until their expiration

### Transition Period
- Both approaches can coexist
- System checks for `appointment.doctors?.meeting_link` first
- Falls back gracefully if doctor hasn't configured permanent link

## Testing Scenarios

1. **New appointment with configured doctor**
   - Book video appointment
   - Verify confirmation page shows doctor's meeting link
   - Verify join button appears 15 min before
   - Verify link opens in new window

2. **Doctor without meeting link**
   - System should handle gracefully
   - Show appropriate message to configure link
   - Still allow booking (for later configuration)

3. **Different platforms**
   - Test with Zoom link
   - Test with Google Meet link
   - Test with Teams link
   - Verify platform badge displays correctly

4. **Password protection**
   - Verify password field shows/hides correctly
   - Verify copy functionality
   - Verify password displayed in meeting button hint

## Future Enhancements

1. **Meeting Link Validation**
   - Add URL validation in doctor settings
   - Verify platform-specific link formats

2. **Calendar Integration**
   - Add meeting link to calendar invites
   - Include in WhatsApp notifications

3. **Meeting Analytics**
   - Track join times
   - Monitor no-shows
   - Platform preference statistics

4. **Admin Features**
   - Bulk configure meeting links for doctors
   - Template links by department
   - Platform recommendations

## Support

For questions or issues:
- See doctor settings documentation
- Check platform-specific setup guides
- Contact support for migration assistance

---

**Last Updated:** 2024-11-15
**Migration Version:** 1.0
**Breaking Changes:** None (backward compatible)
