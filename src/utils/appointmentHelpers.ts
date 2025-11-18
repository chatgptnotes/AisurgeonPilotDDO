import { format } from 'date-fns';

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'pending_payment';

interface StatusConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

/**
 * Get color scheme for appointment status badge
 */
export const getStatusColor = (status: AppointmentStatus): string => {
  const statusColors: Record<AppointmentStatus, string> = {
    scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-gray-100 text-gray-800 border-gray-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    no_show: 'bg-orange-100 text-orange-800 border-orange-200',
    pending_payment: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Get icon name for appointment status (using Google Material Icons)
 */
export const getStatusIcon = (status: AppointmentStatus): string => {
  const statusIcons: Record<AppointmentStatus, string> = {
    scheduled: 'schedule',
    confirmed: 'check_circle',
    in_progress: 'play_circle',
    completed: 'check_circle_outline',
    cancelled: 'cancel',
    no_show: 'error_outline',
    pending_payment: 'payment',
  };

  return statusIcons[status] || 'schedule';
};

/**
 * Validate if status transition is allowed
 */
export const canChangeStatus = (
  currentStatus: AppointmentStatus,
  newStatus: AppointmentStatus
): boolean => {
  const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
    pending_payment: ['scheduled', 'cancelled'],
    scheduled: ['confirmed', 'cancelled'],
    confirmed: ['in_progress', 'cancelled', 'no_show'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: ['scheduled'], // Allow rebooking
    no_show: ['scheduled'], // Allow rebooking
  };

  return allowedTransitions[currentStatus]?.includes(newStatus) || false;
};

/**
 * Get next possible statuses for workflow
 */
export const getNextPossibleStatuses = (
  currentStatus: AppointmentStatus
): Array<{ value: AppointmentStatus; label: string }> => {
  const transitions: Record<AppointmentStatus, Array<{ value: AppointmentStatus; label: string }>> = {
    pending_payment: [
      { value: 'scheduled', label: 'Mark as Scheduled' },
      { value: 'cancelled', label: 'Cancel' },
    ],
    scheduled: [
      { value: 'confirmed', label: 'Confirm' },
      { value: 'cancelled', label: 'Cancel' },
    ],
    confirmed: [
      { value: 'in_progress', label: 'Start Consultation' },
      { value: 'no_show', label: 'Mark as No-Show' },
      { value: 'cancelled', label: 'Cancel' },
    ],
    in_progress: [
      { value: 'completed', label: 'Complete' },
      { value: 'cancelled', label: 'Cancel' },
    ],
    completed: [],
    cancelled: [
      { value: 'scheduled', label: 'Rebook' },
    ],
    no_show: [
      { value: 'scheduled', label: 'Rebook' },
    ],
  };

  return transitions[currentStatus] || [];
};

/**
 * Format appointment time range
 */
export const formatAppointmentTime = (startAt: string, endAt: string): string => {
  const start = new Date(startAt);
  const end = new Date(endAt);

  const startTime = format(start, 'h:mm a');
  const endTime = format(end, 'h:mm a');

  return `${startTime} - ${endTime}`;
};

/**
 * Check if appointment is upcoming (in the future)
 */
export const isUpcoming = (appointment: { start_at: string; status: AppointmentStatus }): boolean => {
  const startTime = new Date(appointment.start_at);
  const now = new Date();

  return startTime > now && !['cancelled', 'no_show', 'completed'].includes(appointment.status);
};

/**
 * Check if user can join meeting (15 minutes before appointment)
 */
export const canJoinMeeting = (appointment: { start_at: string; status: AppointmentStatus }): boolean => {
  const startTime = new Date(appointment.start_at);
  const now = new Date();
  const fifteenMinutesBefore = new Date(startTime.getTime() - 15 * 60 * 1000);

  return (
    now >= fifteenMinutesBefore &&
    now <= startTime &&
    ['confirmed', 'in_progress'].includes(appointment.status)
  );
};

/**
 * Get human-readable status label
 */
export const getStatusLabel = (status: AppointmentStatus): string => {
  const labels: Record<AppointmentStatus, string> = {
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
    pending_payment: 'Pending Payment',
  };

  return labels[status] || status;
};

/**
 * Get appointment type label
 */
export const getAppointmentTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    standard: 'Standard Consultation',
    followup: 'Follow-up Consultation',
    emergency: 'Emergency Consultation',
  };

  return labels[type] || type;
};

/**
 * Calculate appointment duration in minutes
 */
export const getAppointmentDuration = (startAt: string, endAt: string): number => {
  const start = new Date(startAt);
  const end = new Date(endAt);

  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
};

/**
 * Check if appointment is today
 */
export const isToday = (appointmentDate: string): boolean => {
  const appointment = new Date(appointmentDate);
  const today = new Date();

  return (
    appointment.getDate() === today.getDate() &&
    appointment.getMonth() === today.getMonth() &&
    appointment.getFullYear() === today.getFullYear()
  );
};

/**
 * Format date for display
 */
export const formatAppointmentDate = (date: string): string => {
  const appointmentDate = new Date(date);
  return format(appointmentDate, 'EEEE, MMMM d, yyyy');
};

/**
 * Generate meeting link (placeholder for video consultation)
 */
export const generateMeetingLink = (appointmentId: string): string => {
  // In production, integrate with video conferencing API (Zoom, Google Meet, etc.)
  return `https://meet.aisurgeon.com/appointment/${appointmentId}`;
};

/**
 * Check if appointment can be edited
 */
export const canEditAppointment = (appointment: { start_at: string; status: AppointmentStatus }): boolean => {
  const startTime = new Date(appointment.start_at);
  const now = new Date();

  // Can't edit past appointments or completed/cancelled ones
  if (startTime < now || ['completed', 'cancelled'].includes(appointment.status)) {
    return false;
  }

  return true;
};

/**
 * Check if appointment can be cancelled
 */
export const canCancelAppointment = (appointment: { start_at: string; status: AppointmentStatus }): boolean => {
  return !['completed', 'cancelled', 'no_show'].includes(appointment.status);
};

/**
 * Get icon for appointment mode/type
 */
export const getModeIcon = (mode: string): string => {
  const modeIcons: Record<string, string> = {
    video: 'videocam',
    audio: 'phone',
    in_person: 'person',
    chat: 'chat',
  };

  return modeIcons[mode] || 'event';
};

/**
 * Get label for appointment mode/type
 */
export const getModeLabel = (mode: string): string => {
  const modeLabels: Record<string, string> = {
    video: 'Video Consultation',
    audio: 'Phone Consultation',
    in_person: 'In-Person Visit',
    chat: 'Chat Consultation',
  };

  return modeLabels[mode] || mode;
};
