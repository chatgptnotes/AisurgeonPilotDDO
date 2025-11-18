# Meeting Room Quick Start Guide

## 3-Minute Setup

### Step 1: Run Migration (1 minute)
```bash
cd database/migrations
psql "YOUR_SUPABASE_CONNECTION_STRING" -f CORRECT_05_add_doctor_meeting_settings.sql
```

### Step 2: Add Meeting Links (1 minute)
```sql
-- Update a doctor's Zoom meeting room
UPDATE doctors SET
  meeting_platform = 'zoom',
  meeting_link = 'https://zoom.us/j/YOUR_MEETING_ID',
  meeting_password = 'YOUR_PASSWORD',
  meeting_id = 'YOUR_MEETING_ID',
  meeting_instructions = 'Join 5 minutes early. Camera on preferred.'
WHERE email = 'your.email@example.com';
```

### Step 3: Verify (1 minute)
```bash
psql "YOUR_SUPABASE_CONNECTION_STRING" -f ../MEETING_ROOM_VERIFICATION.sql
```

---

## What You Get

### Database Columns Added
- `meeting_platform` - zoom, google_meet, microsoft_teams, webex, skype, other
- `meeting_link` - Full URL to meeting room
- `meeting_password` - Optional password
- `meeting_id` - Platform-specific ID
- `meeting_instructions` - Custom patient instructions

### Supported Platforms
✅ Zoom (zoom.us)
✅ Google Meet (meet.google.com)
✅ Microsoft Teams (teams.microsoft.com)
✅ Webex (webex.com)
✅ Skype (join.skype.com)
✅ Custom/Other (any platform)

---

## Quick Commands

### Check Current Settings
```sql
SELECT full_name, meeting_platform, meeting_link
FROM doctors
WHERE meeting_link IS NOT NULL;
```

### Update Zoom Link
```sql
UPDATE doctors SET
  meeting_platform = 'zoom',
  meeting_link = 'https://zoom.us/j/1234567890',
  meeting_password = 'pass123',
  meeting_id = '1234567890'
WHERE id = 'doctor-uuid';
```

### Update Google Meet Link
```sql
UPDATE doctors SET
  meeting_platform = 'google_meet',
  meeting_link = 'https://meet.google.com/abc-defg-hij',
  meeting_password = NULL,
  meeting_id = NULL
WHERE id = 'doctor-uuid';
```

### Bulk Update All Doctors
```sql
-- Set default Zoom instructions for all doctors
UPDATE doctors
SET meeting_instructions = 'Please join 5 minutes before your appointment. Camera on preferred.'
WHERE meeting_platform = 'zoom';
```

---

## Frontend Usage

### Fetch Appointment with Meeting Info
```typescript
const { data } = await supabase
  .from('appointments')
  .select(`
    *,
    doctor:doctors (
      full_name,
      meeting_platform,
      meeting_link,
      meeting_password,
      meeting_id,
      meeting_instructions
    )
  `)
  .eq('id', appointmentId)
  .single();

console.log(data.doctor.meeting_link); // Doctor's meeting link
```

### Display Meeting Link to Patient
```typescript
function MeetingCard({ appointment }) {
  const { doctor } = appointment;

  return (
    <div className="meeting-card">
      <h3>Join Video Consultation</h3>
      <p>Platform: {doctor.meeting_platform}</p>
      <a href={doctor.meeting_link} target="_blank">
        Join Meeting
      </a>
      {doctor.meeting_password && (
        <p>Password: <code>{doctor.meeting_password}</code></p>
      )}
      <p className="text-sm text-gray-600">
        {doctor.meeting_instructions}
      </p>
    </div>
  );
}
```

---

## Sample Data Included

### 10 Doctors with Different Platforms
- **5 doctors** using Zoom (with passwords)
- **3 doctors** using Google Meet (no passwords needed)
- **1 doctor** using Microsoft Teams
- **1 doctor** using Webex

### Example Doctor Data
```
Dr. Ramesh Kumar
├── Platform: Zoom
├── Link: https://zoom.us/j/1234567890
├── Password: RameshK123
├── ID: 1234567890
└── Instructions: Join 5 minutes before your appointment. Camera on preferred.

Dr. Priya Sharma
├── Platform: Google Meet
├── Link: https://meet.google.com/abc-defg-hij
├── Password: (not needed)
├── ID: (not needed)
└── Instructions: Test your audio/video before the appointment.
```

---

## Email/WhatsApp Template

```
🏥 Appointment Confirmation

Date: {date}
Time: {time}
Doctor: Dr. {doctor_name}

📹 VIDEO CONSULTATION

Platform: {meeting_platform}
Join: {meeting_link}
Password: {meeting_password}
Meeting ID: {meeting_id}

Instructions:
{meeting_instructions}

Questions? Call +91-9876543210
```

---

## Common Tasks

### 1. Doctor Updates Their Meeting Link
```sql
UPDATE doctors
SET meeting_link = 'https://zoom.us/j/NEW_MEETING_ID',
    meeting_password = 'NEW_PASSWORD',
    meeting_id = 'NEW_MEETING_ID'
WHERE email = 'doctor@example.com';
```

### 2. Admin Sets Up New Doctor
```sql
INSERT INTO doctors (
  tenant_id, full_name, email, phone,
  specialties, meeting_platform, meeting_link,
  meeting_password, meeting_id, meeting_instructions
) VALUES (
  'tenant-uuid', 'Dr. New Doctor', 'new@example.com', '+91-1234567890',
  ARRAY['Cardiology'], 'zoom', 'https://zoom.us/j/9999999999',
  'newdoc123', '9999999999',
  'Join 5 minutes early. Have your reports ready.'
);
```

### 3. Get Meeting Info for Appointment Reminder
```sql
SELECT
  p.name AS patient_name,
  d.full_name AS doctor_name,
  d.meeting_platform,
  d.meeting_link,
  d.meeting_password,
  d.meeting_id,
  d.meeting_instructions,
  a.appointment_date,
  a.start_at
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
WHERE a.id = 'appointment-uuid';
```

---

## Troubleshooting

### Migration Already Run?
```sql
-- Check if columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'doctors' AND column_name LIKE 'meeting%';
```
If columns exist, you're good! Migration uses `IF NOT EXISTS`.

### No Meeting Links Showing?
```sql
-- Check if any doctors have meeting links
SELECT COUNT(*) FROM doctors WHERE meeting_link IS NOT NULL;
```
If 0, run the seed data update to add sample links.

### Verify Everything Works
```bash
cd database
psql "YOUR_CONNECTION_STRING" -f MEETING_ROOM_VERIFICATION.sql
```

---

## Platform-Specific Tips

### Zoom
- Get your Personal Meeting ID from Zoom settings
- Format: `https://zoom.us/j/YOUR_PMI`
- Always set a password for security

### Google Meet
- Create a permanent meeting code in Google Calendar
- Format: `https://meet.google.com/xxx-xxxx-xxx`
- No password needed (secure by default)

### Microsoft Teams
- Get meeting link from Teams calendar
- Format: `https://teams.microsoft.com/l/meetup-join/...`
- May require password depending on settings

### Webex
- Use your personal room URL
- Format: `https://yourcompany.webex.com/meet/username`
- Password optional but recommended

---

## Files Reference

📄 **Migration:** `migrations/CORRECT_05_add_doctor_meeting_settings.sql`
📄 **Verification:** `MEETING_ROOM_VERIFICATION.sql`
📄 **Full Docs:** `MEETING_PLATFORMS_SUPPORTED.md`
📄 **Summary:** `MEETING_ROOM_IMPLEMENTATION_SUMMARY.md`
📄 **This Guide:** `MEETING_ROOM_QUICK_START.md`

---

## Need Help?

### Documentation
- Full platform details: `MEETING_PLATFORMS_SUPPORTED.md`
- Complete implementation guide: `MEETING_ROOM_IMPLEMENTATION_SUMMARY.md`

### Verification
```bash
psql "CONNECTION_STRING" -f MEETING_ROOM_VERIFICATION.sql
```

### Support
- Email: support@aisurgeonpilot.com
- Phone: +91-9876543210

---

## Quick Status Check

```sql
-- How many doctors have meeting links?
SELECT
  COUNT(*) AS total_doctors,
  COUNT(meeting_link) AS configured,
  ROUND(COUNT(meeting_link)::NUMERIC / COUNT(*) * 100, 1) AS percentage
FROM doctors;

-- Which platforms are being used?
SELECT meeting_platform, COUNT(*) AS count
FROM doctors
WHERE meeting_link IS NOT NULL
GROUP BY meeting_platform
ORDER BY count DESC;
```

---

**Setup Time:** 3 minutes
**Complexity:** Low
**Status:** ✅ Production Ready

**Last Updated:** 2025-11-15
