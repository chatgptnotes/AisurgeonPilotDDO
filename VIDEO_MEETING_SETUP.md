# Video Meeting Integration - Daily.co Setup Guide

## Overview

The AI Surgeon Pilot platform integrates Daily.co for secure video consultations between doctors and patients. This guide covers setup, configuration, testing, and troubleshooting.

## Features

- **Automatic Meeting Room Creation**: Rooms are generated when video appointments are booked
- **Secure Private Rooms**: Each appointment gets a unique, private meeting room
- **7-Day Expiration**: Rooms automatically expire after 7 days
- **Screen Share & Chat**: Built-in features enabled by default
- **Mock Mode**: Development-friendly fallback when API key is not configured
- **Smart Join Button**: Only active 15 minutes before appointment time

## Getting Started

### 1. Sign Up for Daily.co

1. Visit [https://dashboard.daily.co/](https://dashboard.daily.co/)
2. Create a free account (Free tier includes 1000 meeting minutes/month)
3. Verify your email address
4. Navigate to **Developers** > **API Keys**
5. Copy your API key

### 2. Configure Environment Variables

Add to your `.env` file:

```env
VITE_DAILY_API_KEY=your_actual_api_key_here
```

**Important**:
- Replace `your_daily_api_key_here` with your actual API key
- Never commit your real API key to version control
- Keep `.env` in `.gitignore`

### 3. Verify Configuration

The system will automatically detect if Daily.co is configured:

- **With API Key**: Real Daily.co rooms are created
- **Without API Key**: Mock links are generated (format: `https://meet.aisurgeonpilot.com/{appointmentId}`)

## How It Works

### Booking Flow

1. **Patient selects "Video" mode** when booking appointment
2. **Appointment is created** in database
3. **Meeting room is generated**:
   - API call to Daily.co creates private room
   - Room name: `appointment-{appointmentId}`
   - Expiration: 7 days from creation
   - Features: Screen share, chat, cloud recording enabled
4. **Meeting link is stored** in `appointments.meeting_link` field
5. **Link is shared** with both patient and doctor

### Meeting Room Configuration

```typescript
{
  name: "appointment-{appointmentId}",
  privacy: "private",
  properties: {
    exp: 7 days from now,
    enable_screenshare: true,
    enable_chat: true,
    enable_recording: "cloud",
    max_participants: 10,
    eject_at_room_exp: true
  }
}
```

### Join Button Logic

The "Join Video Call" button has smart timing:

- **More than 15 minutes before**: Button disabled, shows "Video Link Available"
- **15 minutes before to 60 minutes after**: Button active, shows "Join Video Call"
- **More than 60 minutes after**: Button hidden (appointment likely over)

### Patient Experience

1. Books appointment with "Video Call" mode
2. Receives confirmation with meeting link (via email/WhatsApp)
3. Views upcoming appointments on dashboard
4. Clicks "Join Video Call" when active (15 min before)
5. Opens in new window (1200x800)

### Doctor Experience

1. Sees video appointments in dashboard
2. Meeting link displayed next to appointment details
3. Can join the same way as patients
4. Can start consultation slightly early if needed

## API Reference

### createMeetingRoom(appointmentId: string)

Creates a Daily.co meeting room for an appointment.

**Parameters**:
- `appointmentId` (string): The UUID of the appointment

**Returns**:
- Promise<string>: Meeting room URL

**Behavior**:
- If API key configured: Creates real Daily.co room
- If no API key: Returns mock link and logs warning
- On error: Falls back to mock link gracefully

**Example**:
```typescript
import { createMeetingRoom } from '@/services/videoService';

const meetingLink = await createMeetingRoom(appointment.id);
// Returns: https://yourteam.daily.co/appointment-123abc
```

### deleteMeetingRoom(meetingLink: string)

Deletes a Daily.co meeting room when appointment is cancelled.

**Parameters**:
- `meetingLink` (string): The full meeting URL

**Returns**:
- Promise<void>

**Behavior**:
- Skips deletion for mock links
- Silently handles errors (room may already be expired)

**Example**:
```typescript
import { deleteMeetingRoom } from '@/services/videoService';

await deleteMeetingRoom('https://yourteam.daily.co/appointment-123abc');
```

### getMeetingRoomInfo(meetingLink: string)

Retrieves meeting room details from Daily.co.

**Parameters**:
- `meetingLink` (string): The full meeting URL

**Returns**:
- Promise<MeetingRoom | null>: Room information or null

**Example**:
```typescript
import { getMeetingRoomInfo } from '@/services/videoService';

const roomInfo = await getMeetingRoomInfo(meetingLink);
console.log(roomInfo.config.exp); // Expiration timestamp
```

## Testing

### Test in Development Mode

1. **Without API Key** (Mock Mode):
```bash
# Remove or comment out VITE_DAILY_API_KEY in .env
npm run dev
```

2. **Book a Video Appointment**:
   - Navigate to `/doctors`
   - Select a doctor
   - Choose "Video Call" mode
   - Complete booking

3. **Verify Mock Link**:
   - Check console for: "Using mock meeting link (no Daily.co API key)"
   - Link format: `https://meet.aisurgeonpilot.com/{appointmentId}`

4. **Test Join Button**:
   - Create appointment for current time + 10 minutes
   - Check that button is disabled with message
   - Wait until 15 minutes before (or modify appointment time)
   - Verify button becomes active

### Test in Production Mode

1. **With Real API Key**:
```bash
# Add to .env
VITE_DAILY_API_KEY=your_real_api_key_here
npm run dev
```

2. **Book Video Appointment**:
   - Follow same steps as above

3. **Verify Real Room**:
   - Check console for room creation confirmation
   - Link format: `https://yourteam.daily.co/appointment-{id}`
   - Visit Daily.co dashboard to see room listed

4. **Test Video Call**:
   - Click "Join Video Call" when active
   - Should open Daily.co interface in new window
   - Test camera, microphone, screen share

### Test Cancellation Flow

```typescript
// When appointment is cancelled
import { deleteMeetingRoom } from '@/services/videoService';

await deleteMeetingRoom(appointment.meeting_link);
```

## Database Schema

The `meeting_link` column is already added to the `appointments` table:

```sql
ALTER TABLE appointments ADD COLUMN meeting_link TEXT;
```

**Field Details**:
- **Type**: TEXT
- **Nullable**: Yes (only video appointments have links)
- **Indexed**: Not required (low query frequency)

## UI Components

### MeetingLinkButton Component

Located at: `src/components/appointments/MeetingLinkButton.tsx`

**Props**:
```typescript
interface Props {
  appointment: {
    mode: string;           // 'video' | 'phone' | 'in-person'
    meeting_link?: string;  // Daily.co URL or mock link
    start_at: string;       // ISO date string
  };
}
```

**Rendering Logic**:
- **Video mode**: Shows join button with timing logic
- **Phone mode**: Shows badge "Doctor will call you"
- **In-person mode**: Shows nothing
- **No meeting_link**: Shows nothing

## Troubleshooting

### Issue: Meeting link not generated

**Symptoms**: Appointment created but `meeting_link` is null

**Solutions**:
1. Check console for errors
2. Verify API key is correctly set in `.env`
3. Check Daily.co API status
4. Verify database permissions (UPDATE on appointments table)

### Issue: "Join Video Call" button disabled

**Symptoms**: Button shows but is not clickable

**Causes**:
- Appointment is more than 15 minutes away
- System clock is incorrect
- Appointment time is in the past (>60 minutes)

**Solution**:
- Verify appointment `start_at` time
- Check system time is correct
- Button activates 15 minutes before appointment

### Issue: API key not working

**Symptoms**: Console shows "Using mock meeting link"

**Solutions**:
1. Verify `.env` file has correct key
2. Restart dev server (`npm run dev`)
3. Check key hasn't expired in Daily.co dashboard
4. Ensure key starts with correct format (Daily provides specific prefixes)

### Issue: Video call window doesn't open

**Symptoms**: Click join button but nothing happens

**Solutions**:
1. Check browser popup blocker settings
2. Try different browser
3. Check browser console for errors
4. Verify meeting link is valid URL

### Issue: Meeting room expired

**Symptoms**: "Room not found" when joining

**Causes**:
- Room was created >7 days ago
- Room was manually deleted

**Solution**:
- Rooms auto-expire after 7 days
- For old appointments, consider recreating room
- Or adjust expiration in `videoService.ts`:

```typescript
exp: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days instead of 7
```

## Security Considerations

### Private Rooms

All rooms are created with `privacy: "private"` which means:
- Only people with the link can join
- No public listing
- Room name is not guessable

### Link Sharing

Meeting links should only be shared with:
- The patient who booked the appointment
- The assigned doctor
- Via secure channels (email, WhatsApp)

### Recording

Cloud recording is enabled by default:
```typescript
enable_recording: "cloud"
```

**Important**:
- Recordings are stored in your Daily.co account
- Check Daily.co's data retention policies
- Inform patients about recording (HIPAA compliance)
- Consider disabling if not needed:

```typescript
enable_recording: "off" // Disable recording
```

### HIPAA Compliance

Daily.co offers HIPAA-compliant plans:
1. Upgrade to Daily.co Enterprise plan
2. Sign Business Associate Agreement (BAA)
3. Enable end-to-end encryption
4. Configure audit logs

For HIPAA compliance, update configuration:
```typescript
properties: {
  enable_network_ui: false,
  enable_prejoin_ui: true,
  enable_recording: "local", // Local only, not cloud
  // ... other settings
}
```

## Advanced Configuration

### Custom Domain

Daily.co allows custom domains for branded experience:

1. Purchase/verify domain in Daily.co dashboard
2. Update DNS records
3. Meeting links become: `https://meet.yourcompany.com/...`

### Webhook Events

Set up webhooks to track meeting events:

```typescript
// In Daily.co dashboard, add webhook URL
https://your-backend.com/webhooks/daily

// Events:
// - room.created
// - participant.joined
// - participant.left
// - recording.started
// - recording.ready
```

### Room Templates

Create reusable room configurations:

```typescript
// Create template in Daily.co dashboard
// Then use template name instead of inline config

await fetch(`${DAILY_API_URL}/rooms`, {
  method: 'POST',
  body: JSON.stringify({
    name: `appointment-${appointmentId}`,
    properties: {
      // Reference template instead
      preset: "medical-consultation-template"
    }
  })
});
```

## Cost Estimation

### Daily.co Free Tier
- **Included**: 1000 participant minutes/month
- **Overage**: $0.004/minute
- **Example**:
  - Average consultation: 30 minutes
  - Free tier: ~33 consultations/month
  - Cost for 100 consultations: ~$20/month

### Scaling Considerations

**100 appointments/month**:
- Total minutes: 3000 (assuming 30 min avg)
- Cost: ~$8/month (2000 overage minutes × $0.004)

**500 appointments/month**:
- Total minutes: 15,000
- Cost: ~$56/month

**Enterprise Plan**:
- Custom pricing for >10,000 minutes/month
- Includes HIPAA compliance
- Dedicated support

## Monitoring

### Track Meeting Usage

Query appointments with video mode:

```sql
SELECT
  COUNT(*) as total_video_appointments,
  COUNT(CASE WHEN meeting_link IS NOT NULL THEN 1 END) as with_links,
  COUNT(CASE WHEN meeting_link LIKE '%daily.co%' THEN 1 END) as real_rooms,
  COUNT(CASE WHEN meeting_link LIKE '%aisurgeonpilot.com%' THEN 1 END) as mock_rooms
FROM appointments
WHERE mode = 'video'
AND start_at >= NOW() - INTERVAL '30 days';
```

### Daily.co Dashboard Analytics

Monitor in Daily.co dashboard:
- Total minutes used
- Peak concurrent participants
- Average call duration
- Quality metrics

## Future Enhancements

### Planned Features

1. **Embedded Video Player**: Use Daily.co's prebuilt UI or React SDK
2. **Waiting Room**: Patient joins waiting room, doctor admits
3. **In-Call Features**:
   - Virtual background
   - Beauty filters
   - Hand raise
   - Reactions
4. **Recording Management**: Auto-upload to patient records
5. **Analytics Dashboard**: Track video consultation metrics
6. **Mobile App Support**: Deep linking for native app

### Integration Opportunities

1. **AI Scribe**: Integrate with OpenAI Whisper for transcription
2. **Auto-Notes**: Generate SOAP notes from recording
3. **Screen Annotation**: For explaining X-rays, diagrams
4. **File Sharing**: Upload reports during call
5. **Language Translation**: Real-time translation for non-English patients

## Support

### Daily.co Resources
- **Documentation**: https://docs.daily.co/
- **API Reference**: https://docs.daily.co/reference/rest-api
- **Support Email**: help@daily.co
- **Community Forum**: https://community.daily.co/

### Internal Support
- **Code Location**: `src/services/videoService.ts`
- **Component**: `src/components/appointments/MeetingLinkButton.tsx`
- **Database Migration**: `database/migrations/CORRECT_04_fix_appointments_columns.sql`

## Changelog

### Version 1.0 (2025-11-15)
- Initial implementation
- Mock mode for development
- Smart join button with timing logic
- Integration with BookAppointment flow
- Patient and Doctor dashboard display
- Automatic room expiration (7 days)
- Screen share and chat enabled
- Cloud recording enabled

---

**Last Updated**: 2025-11-15
**Maintained By**: AI Surgeon Pilot Development Team
**License**: Proprietary
