import { supabase } from '@/integrations/supabase/client';
import { addDays, addMinutes, format, isSameDay, isWithinInterval, parse, setHours, setMinutes } from 'date-fns';

export interface TimeSlot {
  start: Date;
  end: Date;
  startTime: string; // "09:00 AM"
  endTime: string;   // "09:30 AM"
  available: boolean;
  locked: boolean;
}

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  start_time: string;  // "09:00:00"
  end_time: string;    // "17:00:00"
  is_available: boolean;
}

export interface ConsultationType {
  id: string;
  doctor_id: string;
  type: string;
  name: string;
  duration_minutes: number;
  fee: number;
  is_active: boolean;
}

export interface SlotLock {
  id: string;
  doctor_id: string;
  start_at: string;
  end_at: string;
  locked_by_session: string;
  expires_at: string;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  start_time: string;
  end_time: string;
  status: string;
}

export interface BlackoutDate {
  date: string;
  reason: string;
}

/**
 * Slot Generation Service
 *
 * Generates available time slots for doctor appointments based on:
 * 1. Doctor availability schedule
 * 2. Existing appointments
 * 3. Slot locks (temporary holds during booking)
 * 4. Blackout dates
 * 5. Consultation type duration
 */
export class SlotGenerationService {
  private doctorId: string;

  constructor(doctorId: string) {
    this.doctorId = doctorId;
  }

  /**
   * Get available slots for a specific date
   */
  async getAvailableSlots(
    date: Date,
    consultationTypeId: string
  ): Promise<TimeSlot[]> {
    try {
      // 1. Get consultation type details
      const consultationType = await this.getConsultationType(consultationTypeId);
      if (!consultationType) {
        throw new Error('Consultation type not found');
      }

      // 2. Check if date is a blackout date
      const isBlackedOut = await this.isBlackoutDate(date);
      if (isBlackedOut) {
        return [];
      }

      // 3. Get doctor availability for this day of week
      const dayOfWeek = date.getDay();
      const availability = await this.getDoctorAvailability(dayOfWeek);
      if (!availability || !availability.is_available) {
        return [];
      }

      // 4. Generate time slots based on availability and duration
      const slots = this.generateTimeSlots(
        date,
        availability.start_time,
        availability.end_time,
        consultationType.duration_minutes
      );

      // 5. Get existing appointments for this date
      const appointments = await this.getAppointments(date);

      // 6. Get active slot locks
      const locks = await this.getSlotLocks(date);

      // 7. Mark slots as unavailable/locked
      const slotsWithAvailability = slots.map(slot => {
        const isBooked = appointments.some(apt =>
          this.isTimeOverlapping(slot.start, slot.end, new Date(apt.start_time), new Date(apt.end_time))
        );

        const isLocked = locks.some(lock =>
          this.isTimeOverlapping(slot.start, slot.end, new Date(lock.start_at), new Date(lock.end_at))
        );

        return {
          ...slot,
          available: !isBooked && !isLocked,
          locked: isLocked
        };
      });

      return slotsWithAvailability;
    } catch (error) {
      console.error('Error generating slots:', error);
      throw error;
    }
  }

  /**
   * Get multiple days of available slots (for calendar view)
   */
  async getAvailableSlotsForRange(
    startDate: Date,
    endDate: Date,
    consultationTypeId: string
  ): Promise<Map<string, TimeSlot[]>> {
    const slotsMap = new Map<string, TimeSlot[]>();
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      const slots = await this.getAvailableSlots(currentDate, consultationTypeId);
      slotsMap.set(dateKey, slots);
      currentDate = addDays(currentDate, 1);
    }

    return slotsMap;
  }

  /**
   * Lock a time slot temporarily during booking process
   */
  async lockSlot(
    startTime: Date,
    endTime: Date,
    sessionId: string,
    expiryMinutes: number = 10
  ): Promise<SlotLock | null> {
    try {
      // Clean up expired locks first
      await this.cleanupExpiredLocks();

      const expiresAt = addMinutes(new Date(), expiryMinutes);

      const { data, error } = await supabase
        .from('slot_locks')
        .insert({
          doctor_id: this.doctorId,
          start_at: startTime.toISOString(),
          end_at: endTime.toISOString(),
          locked_by_session: sessionId,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error locking slot:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error locking slot:', error);
      return null;
    }
  }

  /**
   * Release a locked slot
   */
  async unlockSlot(lockId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('slot_locks')
        .delete()
        .eq('id', lockId);

      return !error;
    } catch (error) {
      console.error('Error unlocking slot:', error);
      return false;
    }
  }

  /**
   * Cleanup expired slot locks
   */
  async cleanupExpiredLocks(): Promise<void> {
    try {
      await supabase
        .from('slot_locks')
        .delete()
        .lt('expires_at', new Date().toISOString());
    } catch (error) {
      console.error('Error cleaning up locks:', error);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async getConsultationType(id: string): Promise<ConsultationType | null> {
    const { data, error } = await supabase
      .from('consultation_types')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching consultation type:', error);
      return null;
    }

    return data;
  }

  private async getDoctorAvailability(dayOfWeek: number): Promise<DoctorAvailability | null> {
    const { data, error } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', this.doctorId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching availability:', error);
      return null;
    }

    return data;
  }

  private async isBlackoutDate(date: Date): Promise<boolean> {
    const dateStr = format(date, 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('doctor_blackout_dates')
      .select('*')
      .eq('doctor_id', this.doctorId)
      .eq('date', dateStr)
      .maybeSingle();

    if (error) {
      console.error('Error checking blackout date:', error);
      return false;
    }

    return !!data;
  }

  private async getAppointments(date: Date): Promise<Appointment[]> {
    const startOfDay = setHours(setMinutes(date, 0), 0);
    const endOfDay = setHours(setMinutes(date, 59), 23);

    const { data, error } = await supabase
      .from('appointments')
      .select('id, doctor_id, start_time, end_time, status')
      .eq('doctor_id', this.doctorId)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .in('status', ['scheduled', 'confirmed']); // Only consider active appointments

    if (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }

    return data || [];
  }

  private async getSlotLocks(date: Date): Promise<SlotLock[]> {
    const startOfDay = setHours(setMinutes(date, 0), 0);
    const endOfDay = setHours(setMinutes(date, 59), 23);

    const { data, error } = await supabase
      .from('slot_locks')
      .select('*')
      .eq('doctor_id', this.doctorId)
      .gte('start_at', startOfDay.toISOString())
      .lte('start_at', endOfDay.toISOString())
      .gt('expires_at', new Date().toISOString()); // Only active locks

    if (error) {
      console.error('Error fetching slot locks:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Generate time slots between start and end time with specified duration
   */
  private generateTimeSlots(
    date: Date,
    startTime: string,  // "09:00:00"
    endTime: string,    // "17:00:00"
    durationMinutes: number
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];

    // Parse start and end times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let currentSlotStart = setMinutes(setHours(date, startHour), startMinute);
    const slotEnd = setMinutes(setHours(date, endHour), endMinute);

    while (currentSlotStart < slotEnd) {
      const currentSlotEnd = addMinutes(currentSlotStart, durationMinutes);

      // Don't create slot if it extends beyond end time
      if (currentSlotEnd > slotEnd) {
        break;
      }

      slots.push({
        start: currentSlotStart,
        end: currentSlotEnd,
        startTime: format(currentSlotStart, 'hh:mm a'),
        endTime: format(currentSlotEnd, 'hh:mm a'),
        available: true, // Will be updated later
        locked: false
      });

      currentSlotStart = currentSlotEnd;
    }

    return slots;
  }

  /**
   * Check if two time ranges overlap
   */
  private isTimeOverlapping(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && end1 > start2;
  }
}

/**
 * Utility function to create a session ID for slot locking
 */
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};
