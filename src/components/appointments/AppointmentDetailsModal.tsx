import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Clock,
  Calendar as CalendarIcon,
  User,
  Phone,
  Mail,
  Video,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  Send,
  AlertCircle,
  Stethoscope,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { whatsappService } from '@/services/whatsappService';
import { emailService } from '@/services/emailService';
import { ConsultationWorkspace } from '@/components/consultation/ConsultationWorkspace';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  start_at: string;
  end_at: string;
  status: string;
  appointment_type?: string;
  mode?: string;
  symptoms?: string;
  reason?: string;
  notes?: string;
  meeting_link?: string;
  meeting_platform?: string;
  patient?: Patient;
  patients?: Patient;
}

interface Props {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function AppointmentDetailsModal({ appointment, open, onClose, onUpdate }: Props) {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConsultationWorkspaceOpen, setIsConsultationWorkspaceOpen] = useState(false);

  if (!appointment) return null;

  const patientData = appointment.patient || appointment.patients;
  const patientName = patientData ? `${patientData.first_name} ${patientData.last_name}` : 'Unknown Patient';

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Get doctor's Zoom link if this is a video consultation and link not already stored
      let meetingLink = appointment.meeting_link;
      if (appointment.mode === 'video' && !meetingLink) {
        const { data: doctorData } = await supabase
          .from('doctors')
          .select('zoom_meeting_link')
          .eq('id', appointment.doctor_id)
          .single();

        meetingLink = doctorData?.zoom_meeting_link || '';

        // Update appointment with meeting link
        if (meetingLink) {
          await supabase
            .from('appointments')
            .update({ meeting_link: meetingLink })
            .eq('id', appointment.id);
        }
      }

      // Update status to confirmed
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointment.id);

      if (error) throw error;

      // Send confirmation email
      const doctorName = await getDoctorName(appointment.doctor_id);
      if (patientData?.email) {
        await emailService.sendAppointmentConfirmation({
          tenant_id: appointment.doctor_id,
          patient_id: appointment.patient_id,
          appointment_id: appointment.id,
          patient_name: patientName,
          patient_email: patientData.email,
          appointment_date: format(new Date(appointment.start_at), 'PPP'),
          appointment_time: format(new Date(appointment.start_at), 'p'),
          doctor_name: `Dr. ${doctorName}`,
          hospital_name: 'AI Surgeon Pilot',
          consultation_mode: (appointment.mode as 'in_person' | 'video' | 'phone') || 'in_person',
          meeting_link: meetingLink || undefined,
        });
      }

      // Send WhatsApp notification
      if (patientData?.phone) {
        await whatsappService.sendAppointmentConfirmation(
          patientName,
          patientData.phone,
          format(new Date(appointment.start_at), 'PPP'),
          format(new Date(appointment.start_at), 'p'),
          doctorName,
          'AI Surgeon Pilot',
          appointment.mode === 'in-person' ? 'Visit our clinic' : appointment.mode === 'video' ? 'Video Call' : 'Phone Call',
          meetingLink || 'N/A',
          '+91-XXX-XXX-XXXX'
        );
      }

      toast.success('Appointment confirmed and notifications sent!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error confirming appointment:', error);
      toast.error('Failed to confirm appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error('Please select both date and time');
      return;
    }

    setLoading(true);
    try {
      const [hours, minutes] = rescheduleTime.split(':');
      const newStartAt = new Date(rescheduleDate);
      newStartAt.setHours(parseInt(hours), parseInt(minutes), 0);

      const newEndAt = new Date(newStartAt);
      newEndAt.setMinutes(newEndAt.getMinutes() + 30); // 30-minute appointments

      const { error } = await supabase
        .from('appointments')
        .update({
          start_at: newStartAt.toISOString(),
          end_at: newEndAt.toISOString(),
          status: 'rescheduled',
        })
        .eq('id', appointment.id);

      if (error) throw error;

      // Send WhatsApp notification
      if (patientData?.phone) {
        const doctorName = await getDoctorName(appointment.doctor_id);
        await whatsappService.sendAppointmentConfirmation(
          patientName,
          patientData.phone,
          format(newStartAt, 'PPP'),
          format(newStartAt, 'p'),
          doctorName,
          'AI Surgeon Pilot',
          appointment.mode === 'in-person' ? 'Visit our clinic' : appointment.mode === 'video' ? 'Video Call' : 'Phone Call',
          appointment.meeting_link || 'N/A',
          '+91-XXX-XXX-XXXX'
        );
      }

      toast.success('Appointment rescheduled and notifications sent!');
      setIsRescheduling(false);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      toast.error('Failed to reschedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          notes: `Cancelled: ${cancelReason}`,
        })
        .eq('id', appointment.id);

      if (error) throw error;

      // Send cancellation notification via email service
      const doctorName = await getDoctorName(appointment.doctor_id);
      if (patientData?.email) {
        await emailService.sendAppointmentCancellation({
          tenant_id: appointment.doctor_id,
          patient_id: appointment.patient_id,
          appointment_id: appointment.id,
          patient_name: patientName,
          patient_email: patientData.email,
          original_date: format(new Date(appointment.start_at), 'PPP'),
          original_time: format(new Date(appointment.start_at), 'p'),
          doctor_name: `Dr. ${doctorName}`,
          hospital_name: 'AI Surgeon Pilot',
          cancellation_reason: cancelReason,
          cancelled_by: 'doctor',
        });
      }

      // Send WhatsApp notification
      if (patientData?.phone) {
        await whatsappService.sendAppointmentCancelled(
          patientName,
          patientData.phone,
          doctorName,
          `${format(new Date(appointment.start_at), 'PPP')} at ${format(new Date(appointment.start_at), 'p')}`,
          cancelReason,
          'AI Surgeon Pilot',
          '+91-XXX-XXX-XXXX'
        );
      }

      toast.success('Appointment cancelled and notifications sent!');
      setIsCancelling(false);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    } finally {
      setLoading(false);
    }
  };

  const getDoctorName = async (doctorId: string): Promise<string> => {
    const { data } = await supabase
      .from('doctors')
      .select('full_name')
      .eq('id', doctorId)
      .single();
    return data?.full_name || 'Doctor';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'rescheduled':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Appointment Details</span>
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Patient Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{patientName}</span>
              </div>
              {patientData?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{patientData.phone}</span>
                </div>
              )}
              {patientData?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{patientData.email}</span>
                </div>
              )}
              {patientData?.date_of_birth && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    DOB: {format(new Date(patientData.date_of_birth), 'PP')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Appointment Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Appointment Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">
                  {format(new Date(appointment.start_at), 'PPPP')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">
                  {format(new Date(appointment.start_at), 'p')} - {format(new Date(appointment.end_at), 'p')}
                </span>
              </div>
              {appointment.mode && (
                <div className="flex items-center gap-2">
                  {appointment.mode === 'video' ? (
                    <Video className="h-4 w-4 text-gray-500" />
                  ) : (
                    <MapPin className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="text-sm capitalize">{appointment.mode} Consultation</span>
                </div>
              )}
              {appointment.meeting_link && (
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-gray-500" />
                  <a
                    href={appointment.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {appointment.meeting_platform || 'Join Meeting'}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Symptoms/Reason */}
          {(appointment.symptoms || appointment.reason) && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Chief Complaint</h3>
                <div className="space-y-2">
                  {appointment.symptoms && (
                    <div>
                      <Label className="text-xs text-gray-500">Symptoms</Label>
                      <p className="text-sm">{appointment.symptoms}</p>
                    </div>
                  )}
                  {appointment.reason && (
                    <div>
                      <Label className="text-xs text-gray-500">Reason for Visit</Label>
                      <p className="text-sm">{appointment.reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {appointment.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Notes</h3>
                <p className="text-sm text-gray-600">{appointment.notes}</p>
              </div>
            </>
          )}

          {/* Reschedule Section */}
          {isRescheduling && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Reschedule Appointment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>New Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {rescheduleDate ? format(rescheduleDate, 'PP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={rescheduleDate}
                          onSelect={setRescheduleDate}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>New Time</Label>
                    <input
                      type="time"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Cancel Section */}
          {isCancelling && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Cancel Appointment</h3>
                <div>
                  <Label>Cancellation Reason *</Label>
                  <Textarea
                    placeholder="Please provide a reason for cancellation..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {!isRescheduling && !isCancelling && (
            <>
              {appointment.status === 'scheduled' && (
                <Button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm
                </Button>
              )}
              {(appointment.status === 'confirmed' || appointment.status === 'completed') && (
                <Button
                  onClick={() => setIsConsultationWorkspaceOpen(true)}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Start Consultation
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setIsRescheduling(true)}
                disabled={loading || appointment.status === 'cancelled'}
              >
                <Edit className="h-4 w-4 mr-2" />
                Reschedule
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCancelling(true)}
                disabled={loading || appointment.status === 'cancelled'}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}

          {isRescheduling && (
            <>
              <Button variant="outline" onClick={() => setIsRescheduling(false)} disabled={loading}>
                Back
              </Button>
              <Button onClick={handleReschedule} disabled={loading}>
                <Send className="h-4 w-4 mr-2" />
                Confirm Reschedule
              </Button>
            </>
          )}

          {isCancelling && (
            <>
              <Button variant="outline" onClick={() => setIsCancelling(false)} disabled={loading}>
                Back
              </Button>
              <Button
                onClick={handleCancel}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Confirm Cancellation
              </Button>
            </>
          )}

          {!isRescheduling && !isCancelling && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Consultation Workspace Modal */}
      <ConsultationWorkspace
        appointment={appointment}
        open={isConsultationWorkspaceOpen}
        onClose={() => setIsConsultationWorkspaceOpen(false)}
        onUpdate={onUpdate}
      />
    </Dialog>
  );
}
