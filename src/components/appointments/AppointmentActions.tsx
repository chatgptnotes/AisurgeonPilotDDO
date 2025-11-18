import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, PlayCircle, XCircle, MoreVertical, Clock } from 'lucide-react';

interface Props {
  appointment: any;
  onUpdate: () => void;
}

export function AppointmentActions({ appointment, onUpdate }: Props) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointment.id);

      if (error) throw error;

      toast.success(`Appointment ${newStatus.replace('_', ' ')}`);
      onUpdate();

      // TODO: Send WhatsApp notification to patient
      // await notificationService.sendAppointmentStatusUpdate({
      //   patientPhone: appointment.patient.phone,
      //   patientName: appointment.patient.name,
      //   doctorName: appointment.doctor.full_name,
      //   status: newStatus,
      //   appointmentDate: appointment.start_at
      // });

    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    await updateStatus('cancelled');
    setShowCancelDialog(false);
  };

  // Don't show actions for completed or cancelled appointments
  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    return null;
  }

  return (
    <>
      <div className="flex gap-2">
        {appointment.status === 'scheduled' && (
          <Button
            size="sm"
            onClick={() => updateStatus('confirmed')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Confirm
          </Button>
        )}

        {appointment.status === 'confirmed' && (
          <Button
            size="sm"
            onClick={() => updateStatus('in_progress')}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <PlayCircle className="h-4 w-4 mr-1" />
            Start
          </Button>
        )}

        {appointment.status === 'in_progress' && (
          <Button
            size="sm"
            onClick={() => updateStatus('completed')}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Complete
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={loading}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {appointment.status !== 'cancelled' && (
              <DropdownMenuItem
                onClick={() => setShowCancelDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Appointment
              </DropdownMenuItem>
            )}
            {appointment.status === 'confirmed' && (
              <DropdownMenuItem onClick={() => updateStatus('scheduled')}>
                <Clock className="h-4 w-4 mr-2" />
                Move to Scheduled
              </DropdownMenuItem>
            )}
            {appointment.status === 'scheduled' && (
              <DropdownMenuItem onClick={() => updateStatus('no_show')}>
                <XCircle className="h-4 w-4 mr-2" />
                Mark as No Show
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? The patient will be notified via WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={loading}
            >
              No, Keep It
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={loading}
            >
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
