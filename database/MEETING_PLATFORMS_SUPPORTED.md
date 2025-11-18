# Meeting Platforms Supported

## Overview
AI Surgeon Pilot supports multiple video conferencing platforms for online consultations. Doctors can configure their permanent meeting room links in the system.

---

## Supported Platforms

### 1. Zoom
**Platform Code:** `zoom`

**URL Formats:**
- Personal Meeting Room: `https://zoom.us/j/{meeting_id}`
- With password: `https://zoom.us/j/{meeting_id}?pwd={encoded_password}`
- Webinar: `https://zoom.us/w/{webinar_id}`

**Fields Required:**
- `meeting_link`: Full Zoom URL
- `meeting_id`: Numeric meeting ID (9-11 digits)
- `meeting_password`: Optional passcode
- `meeting_instructions`: Custom instructions

**Validation Rules:**
- Must contain `zoom.us`
- Meeting ID must be numeric
- Password max 10 characters

**Example:**
```sql
meeting_platform = 'zoom'
meeting_link = 'https://zoom.us/j/1234567890'
meeting_password = 'doctor123'
meeting_id = '1234567890'
```

---

### 2. Google Meet
**Platform Code:** `google_meet`

**URL Formats:**
- Standard Meet: `https://meet.google.com/{meeting_code}`
- With workspace: `https://meet.google.com/lookup/{lookup_code}`

**Fields Required:**
- `meeting_link`: Full Google Meet URL
- `meeting_password`: Not applicable (Meet uses link-based security)
- `meeting_id`: Not applicable
- `meeting_instructions`: Custom instructions

**Validation Rules:**
- Must contain `meet.google.com`
- Meeting code format: xxx-xxxx-xxx

**Example:**
```sql
meeting_platform = 'google_meet'
meeting_link = 'https://meet.google.com/abc-defg-hij'
meeting_password = NULL
meeting_id = NULL
```

---

### 3. Microsoft Teams
**Platform Code:** `microsoft_teams`

**URL Formats:**
- Meeting join: `https://teams.microsoft.com/l/meetup-join/{encoded_params}`
- Channel meeting: `https://teams.microsoft.com/l/channel/{channel_id}`

**Fields Required:**
- `meeting_link`: Full Teams URL
- `meeting_password`: Optional if required
- `meeting_id`: Optional conference ID
- `meeting_instructions`: Custom instructions

**Validation Rules:**
- Must contain `teams.microsoft.com`
- URL must be valid Teams meeting link

**Example:**
```sql
meeting_platform = 'microsoft_teams'
meeting_link = 'https://teams.microsoft.com/l/meetup-join/xyz123'
meeting_password = 'TeamsMeet456'
meeting_id = NULL
```

---

### 4. Webex
**Platform Code:** `webex`

**URL Formats:**
- Personal room: `https://{company}.webex.com/meet/{username}`
- Scheduled meeting: `https://{company}.webex.com/j/{meeting_number}`

**Fields Required:**
- `meeting_link`: Full Webex URL
- `meeting_password`: Optional password
- `meeting_id`: Meeting number
- `meeting_instructions`: Custom instructions

**Validation Rules:**
- Must contain `webex.com`
- Meeting number must be numeric

**Example:**
```sql
meeting_platform = 'webex'
meeting_link = 'https://company.webex.com/meet/drsmith'
meeting_password = 'webex789'
meeting_id = '1234567890'
```

---

### 5. Skype
**Platform Code:** `skype`

**URL Formats:**
- Meeting join: `https://join.skype.com/{meeting_code}`
- Personal call: `skype:{username}?call`

**Fields Required:**
- `meeting_link`: Full Skype URL
- `meeting_password`: Not applicable
- `meeting_id`: Meeting code
- `meeting_instructions`: Custom instructions

**Validation Rules:**
- Must contain `join.skype.com` or start with `skype:`

**Example:**
```sql
meeting_platform = 'skype'
meeting_link = 'https://join.skype.com/AbCdEfGhIjKl'
meeting_password = NULL
meeting_id = 'AbCdEfGhIjKl'
```

---

### 6. Custom/Other
**Platform Code:** `other`

**URL Formats:**
- Any valid HTTPS URL

**Fields Required:**
- `meeting_link`: Full URL to meeting platform
- `meeting_password`: Optional password
- `meeting_id`: Optional meeting ID
- `meeting_instructions`: **Required** - Must explain which platform

**Validation Rules:**
- Must be valid HTTPS URL
- Instructions must specify the platform name

**Example:**
```sql
meeting_platform = 'other'
meeting_link = 'https://jitsi.example.com/DrSmithRoom'
meeting_password = 'jitsi123'
meeting_id = 'DrSmithRoom'
meeting_instructions = 'Join via Jitsi Meet. No account required.'
```

---

## Database Schema

### Column Specifications

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `meeting_platform` | VARCHAR(50) | NO | 'zoom' | Platform identifier |
| `meeting_link` | TEXT | YES | NULL | Full meeting room URL |
| `meeting_password` | VARCHAR(100) | YES | NULL | Meeting password/passcode |
| `meeting_id` | VARCHAR(100) | YES | NULL | Platform-specific meeting ID |
| `meeting_instructions` | TEXT | NO | Default message | Custom patient instructions |

### Default Instructions
```
"Please join 5 minutes before your appointment time."
```

---

## Usage Examples

### Updating Doctor Meeting Settings

```sql
-- Set Zoom meeting room
UPDATE doctors SET
  meeting_platform = 'zoom',
  meeting_link = 'https://zoom.us/j/1234567890',
  meeting_password = 'secure123',
  meeting_id = '1234567890',
  meeting_instructions = 'Join 5 minutes early. Camera on preferred.'
WHERE email = 'doctor@example.com';

-- Set Google Meet room
UPDATE doctors SET
  meeting_platform = 'google_meet',
  meeting_link = 'https://meet.google.com/abc-defg-hij',
  meeting_password = NULL,
  meeting_id = NULL,
  meeting_instructions = 'Test your audio/video before joining.'
WHERE email = 'doctor@example.com';
```

### Retrieving Meeting Info for Appointments

```sql
SELECT
  d.full_name,
  d.meeting_platform,
  d.meeting_link,
  d.meeting_password,
  d.meeting_instructions,
  a.appointment_date,
  a.start_at
FROM appointments a
JOIN doctors d ON a.doctor_id = d.id
WHERE a.id = 'appointment-uuid'
  AND a.mode = 'video';
```

---

## Best Practices

### For Doctors

1. **Use Permanent Links**: Set up a permanent personal meeting room for consistency
2. **Test Regularly**: Verify your meeting link works before appointments
3. **Clear Instructions**: Provide specific joining instructions for patients
4. **Security**: Use passwords for sensitive consultations
5. **Backup Plan**: Include phone number in instructions for technical issues

### For Developers

1. **Validation**: Always validate meeting URLs before saving
2. **Security**: Never log or expose meeting passwords in plain text
3. **Error Handling**: Gracefully handle platform-specific errors
4. **Testing**: Test meeting link generation for all platforms
5. **User Experience**: Show clear platform icons and instructions to patients

---

## Integration Guidelines

### Frontend Display

```typescript
// Example: Display meeting link to patient
interface MeetingInfo {
  platform: string;
  link: string;
  password?: string;
  meetingId?: string;
  instructions: string;
}

function renderMeetingLink(meeting: MeetingInfo) {
  return (
    <div className="meeting-card">
      <h3>{getPlatformName(meeting.platform)} Consultation</h3>
      <a href={meeting.link} target="_blank">Join Meeting</a>
      {meeting.password && (
        <p>Password: <code>{meeting.password}</code></p>
      )}
      {meeting.meetingId && (
        <p>Meeting ID: <code>{meeting.meetingId}</code></p>
      )}
      <p className="instructions">{meeting.instructions}</p>
    </div>
  );
}
```

### Email/WhatsApp Templates

```
Your upcoming appointment with Dr. {doctor_name}

Date: {appointment_date}
Time: {appointment_time}
Type: Online Video Consultation

Meeting Details:
Platform: {platform_name}
Join Link: {meeting_link}
{if password}Password: {meeting_password}{/if}
{if meeting_id}Meeting ID: {meeting_id}{/if}

Instructions:
{meeting_instructions}

Need help? Contact support at {support_phone}
```

---

## Platform-Specific Features

### Zoom Features
- Waiting room support
- Recording capability
- Screen sharing
- Breakout rooms
- Virtual background

### Google Meet Features
- No app required
- Live captions
- Screen sharing
- Google Calendar integration
- Up to 100 participants

### Microsoft Teams Features
- Office 365 integration
- File sharing
- Meeting notes
- Recording and transcription
- Security and compliance

### Webex Features
- Enterprise-grade security
- Recording capability
- Whiteboarding
- File sharing
- Meeting analytics

---

## Troubleshooting

### Common Issues

1. **Invalid Meeting Link**
   - Verify URL format matches platform requirements
   - Check for typos in meeting ID
   - Ensure link is active and not expired

2. **Password Issues**
   - Verify password meets platform requirements
   - Check for special characters that may need encoding
   - Ensure password is communicated to patient

3. **Platform Not Loading**
   - Verify patient has required app installed
   - Check browser compatibility
   - Test network connectivity

### Support Contact
For technical issues:
- Email: support@aisurgeonpilot.com
- Phone: +91-9876543210

---

## Compliance & Security

### Data Privacy
- Meeting links are encrypted in transit (HTTPS)
- Passwords stored securely in database
- Patient privacy maintained per HIPAA/local regulations

### Access Control
- Only authorized doctors can update meeting settings
- Patients receive meeting links only for confirmed appointments
- Meeting links expire after appointment completion

### Audit Trail
- All meeting setting changes are logged
- Appointment access tracked for security
- Regular security audits recommended

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-15 | Initial platform support documentation |

---

**Last Updated:** 2025-11-15
**Maintained By:** AI Surgeon Pilot Development Team
