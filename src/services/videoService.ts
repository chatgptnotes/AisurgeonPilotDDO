/**
 * @deprecated This service is no longer used for auto-generating meeting rooms.
 *
 * MIGRATION NOTE (2024):
 * - We now use doctor's permanent meeting links instead of generating per-appointment rooms
 * - Meeting links are stored in doctors table: meeting_link, meeting_platform, meeting_password, meeting_id
 * - Appointments reference the doctor's permanent meeting room settings
 * - This file is kept for reference and potential future use
 *
 * See MIGRATION_GUIDE.md for details on the new approach.
 */

import { supabase } from '@/integrations/supabase/client';

const DAILY_API_KEY = import.meta.env.VITE_DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

export interface MeetingRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
  config: {
    exp?: number;
    enable_screenshare?: boolean;
    enable_chat?: boolean;
  };
}

/**
 * Create a Daily.co meeting room for an appointment
 */
export async function createMeetingRoom(appointmentId: string): Promise<string> {
  try {
    // If no API key, return mock link for development
    if (!DAILY_API_KEY || DAILY_API_KEY === 'your_daily_api_key_here') {
      const mockLink = `https://meet.aisurgeonpilot.com/${appointmentId}`;
      console.warn('Using mock meeting link (no Daily.co API key):', mockLink);

      // Still update database
      await supabase
        .from('appointments')
        .update({ meeting_link: mockLink })
        .eq('id', appointmentId);

      return mockLink;
    }

    // Create room via Daily.co API
    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `appointment-${appointmentId}`,
        privacy: 'private',
        properties: {
          exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days expiry
          enable_screenshare: true,
          enable_chat: true,
          enable_recording: 'cloud', // Optional: record sessions
          max_participants: 10,
          eject_at_room_exp: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Daily.co API error: ${response.statusText}`);
    }

    const room: MeetingRoom = await response.json();

    // Update appointment with meeting link
    const { error } = await supabase
      .from('appointments')
      .update({ meeting_link: room.url })
      .eq('id', appointmentId);

    if (error) {
      console.error('Failed to update appointment with meeting link:', error);
    }

    return room.url;

  } catch (error) {
    console.error('Error creating meeting room:', error);

    // Fallback to mock link
    const fallbackLink = `https://meet.aisurgeonpilot.com/${appointmentId}`;
    await supabase
      .from('appointments')
      .update({ meeting_link: fallbackLink })
      .eq('id', appointmentId);

    return fallbackLink;
  }
}

/**
 * Delete a meeting room (when appointment is cancelled)
 */
export async function deleteMeetingRoom(meetingLink: string): Promise<void> {
  if (!DAILY_API_KEY || !meetingLink.includes('daily.co')) {
    return; // Skip for mock links
  }

  try {
    const roomName = meetingLink.split('/').pop();

    await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });
  } catch (error) {
    console.error('Error deleting meeting room:', error);
  }
}

/**
 * Get meeting room details
 */
export async function getMeetingRoomInfo(meetingLink: string): Promise<MeetingRoom | null> {
  if (!DAILY_API_KEY || !meetingLink.includes('daily.co')) {
    return null;
  }

  try {
    const roomName = meetingLink.split('/').pop();

    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.error('Error getting meeting info:', error);
    return null;
  }
}
