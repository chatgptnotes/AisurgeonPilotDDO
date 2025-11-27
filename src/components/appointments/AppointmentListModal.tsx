import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Clock, User, Phone, Mail, Video, MapPin, Calendar } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
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
  patient?: Patient;
  patients?: Patient;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
}

export function AppointmentListModal({ open, onClose, title, appointments, onAppointmentClick }: Props) {
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
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {appointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No appointments found</p>
            </div>
          ) : (
            appointments.map((appointment) => {
              const patientData = appointment.patient || appointment.patients;
              const patientName = patientData?.name || 'Unknown Patient';

              return (
                <Card
                  key={appointment.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-l-blue-500"
                  onClick={() => {
                    onAppointmentClick(appointment);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold text-lg">{patientName}</span>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 ml-7">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(appointment.start_at), 'PPP')}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {format(new Date(appointment.start_at), 'p')} - {format(new Date(appointment.end_at), 'p')}
                        </div>
                        {patientData?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {patientData.phone}
                          </div>
                        )}
                        {patientData?.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {patientData.email}
                          </div>
                        )}
                        {appointment.mode && (
                          <div className="flex items-center gap-2">
                            {appointment.mode === 'video' ? (
                              <Video className="h-4 w-4" />
                            ) : appointment.mode === 'phone' ? (
                              <Phone className="h-4 w-4" />
                            ) : (
                              <MapPin className="h-4 w-4" />
                            )}
                            <span className="capitalize">{appointment.mode}</span>
                          </div>
                        )}
                      </div>

                      {(appointment.symptoms || appointment.reason) && (
                        <div className="mt-3 ml-7 text-sm">
                          {appointment.symptoms && (
                            <p className="text-gray-700">
                              <span className="font-medium">Symptoms:</span> {appointment.symptoms}
                            </p>
                          )}
                          {appointment.reason && (
                            <p className="text-gray-700">
                              <span className="font-medium">Reason:</span> {appointment.reason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
