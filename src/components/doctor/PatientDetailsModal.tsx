import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { UploadDocumentModal } from './UploadDocumentModal';
import { WritePrescriptionModal } from './WritePrescriptionModal';
import { WriteLabReportModal } from './WriteLabReportModal';
import { OpdSummaryModal } from './OpdSummaryModal';
import { PatientDocumentsView } from './PatientDocumentsView';
import { whatsappService } from '@/services/whatsappService';
import { emailService } from '@/services/emailService';
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Droplet,
  AlertCircle,
  FileText,
  Clock,
  CalendarClock,
  Receipt,
  FlaskConical,
  History,
  Pill,
  MessageSquare,
  Video,
  XCircle,
  Edit,
  Send,
  Upload,
  ClipboardList,
  CheckCircle,
  Stethoscope,
  Plus,
  Save,
} from 'lucide-react';
import { useDiagnoses } from '@/hooks/useDiagnoses';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  date_of_birth?: string;
  created_at: string;
  gender?: string;
  address?: string;
  blood_group?: string;
  allergies?: string;
  primary_diagnosis?: string;
}

interface PatientWithAppointment extends Patient {
  nextAppointment?: {
    id: string;
    start_at: string;
    status: string;
    appointment_type?: string;
    mode?: string;
  };
}

interface Appointment {
  id: string;
  start_at: string;
  end_at?: string;
  status: string;
  appointment_type?: string;
  mode?: string;
  symptoms?: string;
  notes?: string;
  meeting_link?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  patient: PatientWithAppointment;
  doctorId: string;
  onPatientUpdated?: () => void;
}

export function PatientDetailsModal({ open, onClose, patient, doctorId, onPatientUpdated }: Props) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isLabReportModalOpen, setIsLabReportModalOpen] = useState(false);
  const [isOpdSummaryModalOpen, setIsOpdSummaryModalOpen] = useState(false);
  const [isSendingMeetingLink, setIsSendingMeetingLink] = useState(false);

  // Diagnosis state
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string>(patient.primary_diagnosis || '');
  const [isAddingNewDiagnosis, setIsAddingNewDiagnosis] = useState(false);
  const [newDiagnosisName, setNewDiagnosisName] = useState('');
  const [isSavingDiagnosis, setIsSavingDiagnosis] = useState(false);

  const { diagnoses, isLoading: diagnosesLoading, addDiagnosis, isAddingDiagnosis } = useDiagnoses();

  const patientName = patient.name || 'Unknown Patient';

  // Reset diagnosis state when patient changes
  useEffect(() => {
    setSelectedDiagnosis(patient.primary_diagnosis || '');
    setIsAddingNewDiagnosis(false);
    setNewDiagnosisName('');
  }, [patient.id, patient.primary_diagnosis]);

  useEffect(() => {
    if (open && patient?.id) {
      fetchPatientAppointments();
    }
  }, [open, patient?.id]);

  const fetchPatientAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patient.id)
        .eq('doctor_id', doctorId)
        .order('start_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointment history');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (appointmentId: string) => {
    // TODO: Implement reschedule modal
    toast.info('Reschedule feature coming soon');
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('Appointment cancelled');
      fetchPatientAppointments();
      onPatientUpdated?.();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  const handleMarkAsDone = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('Appointment marked as completed');
      fetchPatientAppointments();
      onPatientUpdated?.();
    } catch (error) {
      console.error('Error marking appointment as done:', error);
      toast.error('Failed to mark appointment as done');
    }
  };

  const handleSendBill = () => {
    // Navigate to billing or open bill modal
    toast.info('Opening billing...');
    window.open(`/final-bill/${patient.id}`, '_blank');
  };

  const handleViewLabReports = () => {
    toast.info('Opening lab reports...');
    window.open(`/lab?patient_id=${patient.id}`, '_blank');
  };

  const handleViewPrescriptions = () => {
    toast.info('Opening prescriptions...');
    window.open(`/prescriptions?patient_id=${patient.id}`, '_blank');
  };

  const handleSendWhatsApp = () => {
    const phone = patient.phone?.replace(/[^0-9]/g, '') || '';
    const message = encodeURIComponent(`Hello ${patientName}, this is a message from your doctor.`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Medical Consultation - Dr. Office`);
    const body = encodeURIComponent(`Dear ${patientName},\n\nThank you for your visit.\n\nBest regards`);
    window.location.href = `mailto:${patient.email}?subject=${subject}&body=${body}`;
  };

  const handleSendMeetingLink = async () => {
    setIsSendingMeetingLink(true);
    try {
      // 1. Fetch doctor's meeting link
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('zoom_meeting_link, full_name')
        .eq('id', doctorId)
        .single();

      if (doctorError) {
        console.error('Error fetching doctor data:', doctorError);
        toast.error('Failed to fetch doctor information');
        return;
      }

      if (!doctorData?.zoom_meeting_link) {
        toast.error('No meeting link configured for this doctor');
        return;
      }

      // 2. Validate patient contact info
      if (!patient.phone && !patient.email) {
        toast.error('Patient has no phone or email');
        return;
      }

      const doctorName = doctorData.full_name || 'Doctor';
      const meetingLink = doctorData.zoom_meeting_link;
      const currentDate = format(new Date(), 'dd MMM yyyy');
      const currentTime = format(new Date(), 'hh:mm a');

      let whatsappSuccess = false;
      let emailSuccess = false;

      // 3. Send WhatsApp (if phone exists)
      if (patient.phone) {
        try {
          const result = await whatsappService.sendVideoConsultationReminder15min(
            patient.phone,
            patientName,
            doctorName,
            currentDate,
            currentTime,
            meetingLink,
            'AI Surgeon Pilot'
          );
          whatsappSuccess = result.success;
          if (!result.success) {
            console.error('WhatsApp send failed:', result.error);
          }
        } catch (error) {
          console.error('WhatsApp error:', error);
        }
      }

      // 4. Send Email (if email exists)
      if (patient.email) {
        try {
          const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .highlight { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Video Consultation Link</h1>
    </div>
    <div class="content">
      <p>Dear ${patientName},</p>
      <p>Here is your video consultation link with <strong>Dr. ${doctorName}</strong>.</p>
      <div class="highlight">
        <p><strong>Date:</strong> ${currentDate}</p>
        <p><strong>Time:</strong> ${currentTime}</p>
      </div>
      <p>Please click the button below to join your consultation:</p>
      <a href="${meetingLink}" class="button">Join Video Consultation</a>
      <p>Or copy this link: <a href="${meetingLink}">${meetingLink}</a></p>
      <p><strong>Tips for a smooth consultation:</strong></p>
      <ul>
        <li>Ensure you have a stable internet connection</li>
        <li>Test your camera and microphone beforehand</li>
        <li>Find a quiet, well-lit space</li>
        <li>Have your medical records ready if needed</li>
      </ul>
      <div class="footer">
        <p>Best regards,<br>AI Surgeon Pilot</p>
      </div>
    </div>
  </div>
</body>
</html>`;

          const result = await emailService.sendEmail({
            to: patient.email,
            subject: `Video Consultation Link - Dr. ${doctorName}`,
            html: emailHtml
          });
          emailSuccess = result.success;
          if (!result.success) {
            console.error('Email send failed:', result.error);
          }
        } catch (error) {
          console.error('Email error:', error);
        }
      }

      // 5. Show result
      if (whatsappSuccess && emailSuccess) {
        toast.success('Meeting link sent via WhatsApp and Email!');
      } else if (whatsappSuccess) {
        toast.success('Meeting link sent via WhatsApp!');
      } else if (emailSuccess) {
        toast.success('Meeting link sent via Email!');
      } else {
        toast.error('Failed to send meeting link');
      }
    } catch (error) {
      console.error('Error sending meeting link:', error);
      toast.error('Failed to send meeting link');
    } finally {
      setIsSendingMeetingLink(false);
    }
  };

  const handleSaveDiagnosis = async () => {
    if (!selectedDiagnosis || selectedDiagnosis === patient.primary_diagnosis) return;

    setIsSavingDiagnosis(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({ primary_diagnosis: selectedDiagnosis })
        .eq('id', patient.id);

      if (error) throw error;

      toast.success('Diagnosis saved successfully');
      onPatientUpdated?.();
    } catch (error) {
      console.error('Error saving diagnosis:', error);
      toast.error('Failed to save diagnosis');
    } finally {
      setIsSavingDiagnosis(false);
    }
  };

  const handleAddNewDiagnosis = () => {
    if (!newDiagnosisName.trim()) return;

    addDiagnosis({ name: newDiagnosisName.trim() }, {
      onSuccess: (data) => {
        setSelectedDiagnosis(newDiagnosisName.trim());
        setNewDiagnosisName('');
        setIsAddingNewDiagnosis(false);
      }
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      scheduled: { variant: 'outline', label: 'Scheduled' },
      confirmed: { variant: 'default', label: 'Confirmed' },
      completed: { variant: 'secondary', label: 'Completed' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
      no_show: { variant: 'destructive', label: 'No Show' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {patientName}
              </h2>
              <p className="text-sm text-gray-500 font-normal">
                Patient since {format(new Date(patient.created_at), 'MMMM yyyy')}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="medical">Medical History</TabsTrigger>
              <TabsTrigger value="actions">Quick Actions</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[60vh] px-6 py-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-4">
              {/* Contact Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{patient.phone}</p>
                    </div>
                  </div>
                  {patient.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{patient.email}</p>
                      </div>
                    </div>
                  )}
                  {patient.address && (
                    <div className="flex items-center gap-3 md:col-span-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">{patient.address}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {patient.date_of_birth && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Date of Birth</p>
                        <p className="font-medium">{format(new Date(patient.date_of_birth), 'PP')}</p>
                      </div>
                    </div>
                  )}
                  {patient.gender && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Gender</p>
                        <p className="font-medium capitalize">{patient.gender}</p>
                      </div>
                    </div>
                  )}
                  {patient.blood_group && (
                    <div className="flex items-center gap-3">
                      <Droplet className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-sm text-gray-500">Blood Group</p>
                        <p className="font-medium">{patient.blood_group}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Patient Uploaded Documents */}
              <PatientDocumentsView patientId={patient.id} />

              {/* Diagnosis */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-blue-600" />
                    Diagnosis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!isAddingNewDiagnosis ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedDiagnosis}
                          onValueChange={setSelectedDiagnosis}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a diagnosis..." />
                          </SelectTrigger>
                          <SelectContent>
                            {diagnosesLoading ? (
                              <div className="px-2 py-1.5 text-sm text-gray-500">Loading...</div>
                            ) : diagnoses.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-gray-500">No diagnoses available</div>
                            ) : (
                              diagnoses.map((diagnosis) => (
                                <SelectItem key={diagnosis.id} value={diagnosis.name}>
                                  {diagnosis.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingNewDiagnosis(true)}
                          className="text-blue-600"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add New
                        </Button>
                        {selectedDiagnosis && selectedDiagnosis !== patient.primary_diagnosis && (
                          <Button
                            size="sm"
                            onClick={handleSaveDiagnosis}
                            disabled={isSavingDiagnosis}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            {isSavingDiagnosis ? 'Saving...' : 'Save'}
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Enter new diagnosis name..."
                        value={newDiagnosisName}
                        onChange={(e) => setNewDiagnosisName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddNewDiagnosis();
                          if (e.key === 'Escape') {
                            setIsAddingNewDiagnosis(false);
                            setNewDiagnosisName('');
                          }
                        }}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleAddNewDiagnosis}
                          disabled={isAddingDiagnosis || !newDiagnosisName.trim()}
                        >
                          {isAddingDiagnosis ? 'Adding...' : 'Add Diagnosis'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsAddingNewDiagnosis(false);
                            setNewDiagnosisName('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  {patient.primary_diagnosis && (
                    <p className="text-sm text-gray-500">
                      Current: <span className="font-medium text-gray-700">{patient.primary_diagnosis}</span>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Next Appointment */}
              {patient.nextAppointment && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Next Appointment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-green-800">
                          {format(new Date(patient.nextAppointment.start_at), 'EEEE, MMMM d, yyyy')}
                        </p>
                        <p className="text-green-700">
                          {format(new Date(patient.nextAppointment.start_at), 'h:mm a')}
                          {patient.nextAppointment.mode && ` - ${patient.nextAppointment.mode}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleMarkAsDone(patient.nextAppointment!.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Done
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReschedule(patient.nextAppointment!.id)}
                        >
                          <CalendarClock className="h-4 w-4 mr-1" />
                          Reschedule
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelAppointment(patient.nextAppointment!.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

            </TabsContent>

            {/* Appointments Tab */}
            <TabsContent value="appointments" className="mt-0 space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading appointments...</div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No appointment history</p>
                </div>
              ) : (
                appointments.map((apt) => (
                  <Card key={apt.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {format(new Date(apt.start_at), 'EEEE, MMMM d, yyyy')}
                          </p>
                          {getStatusBadge(apt.status)}
                        </div>
                        <p className="text-sm text-gray-500">
                          {format(new Date(apt.start_at), 'h:mm a')}
                          {apt.mode && ` - ${apt.mode}`}
                          {apt.appointment_type && ` (${apt.appointment_type})`}
                        </p>
                        {apt.symptoms && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Symptoms:</span> {apt.symptoms}
                          </p>
                        )}
                        {apt.notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Notes:</span> {apt.notes}
                          </p>
                        )}
                      </div>
                      {['scheduled', 'confirmed', 'in_progress'].includes(apt.status) && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleMarkAsDone(apt.id)}
                            title="Mark appointment as completed"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Done
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReschedule(apt.id)}>
                            <CalendarClock className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelAppointment(apt.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Medical History Tab */}
            <TabsContent value="medical" className="mt-0 space-y-4">
              {/* Allergies */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    Allergies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.allergies ? (
                    <p className="text-gray-700">{patient.allergies}</p>
                  ) : (
                    <p className="text-gray-400 italic">No allergies recorded</p>
                  )}
                </CardContent>
              </Card>

              {/* Medical History */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Medical History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 italic">View detailed medical history in the patient's records</p>
                </CardContent>
              </Card>

              {/* Quick links to detailed records */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto py-4" onClick={() => setIsLabReportModalOpen(true)}>
                  <div className="flex flex-col items-center gap-2">
                    <FlaskConical className="h-6 w-6 text-purple-600" />
                    <span>Add Lab Report</span>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4" onClick={() => setIsPrescriptionModalOpen(true)}>
                  <div className="flex flex-col items-center gap-2">
                    <Pill className="h-6 w-6 text-blue-600" />
                    <span>Write Prescription</span>
                  </div>
                </Button>
              </div>
            </TabsContent>

            {/* Quick Actions Tab */}
            <TabsContent value="actions" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Communication Actions */}
                <Card className="p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Communication
                  </h3>
                  <div className="space-y-2">
                    <Button className="w-full justify-start" variant="outline" onClick={handleSendWhatsApp}>
                      <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
                      Send WhatsApp Message
                    </Button>
                    <Button className="w-full justify-start" variant="outline" onClick={handleSendEmail}>
                      <Mail className="h-4 w-4 mr-2 text-blue-600" />
                      Send Email
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={handleSendMeetingLink}
                      disabled={isSendingMeetingLink}
                    >
                      <Video className="h-4 w-4 mr-2 text-purple-600" />
                      {isSendingMeetingLink ? 'Sending...' : 'Send Meeting Link'}
                    </Button>
                    <Button className="w-full justify-start" variant="outline" onClick={() => window.open(`tel:${patient.phone}`)}>
                      <Phone className="h-4 w-4 mr-2 text-gray-600" />
                      Call Patient
                    </Button>
                  </div>
                </Card>

                {/* Billing & Documents Actions */}
                <Card className="p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Billing & Documents
                  </h3>
                  <div className="space-y-2">
                    <Button className="w-full justify-start" variant="outline" onClick={handleSendBill}>
                      <Receipt className="h-4 w-4 mr-2 text-yellow-600" />
                      Generate Bill
                    </Button>
                    <Button className="w-full justify-start" variant="outline" onClick={() => setIsUploadModalOpen(true)}>
                      <Upload className="h-4 w-4 mr-2 text-blue-600" />
                      Upload Document
                    </Button>
                    <Button className="w-full justify-start" variant="outline" onClick={() => setIsOpdSummaryModalOpen(true)}>
                      <ClipboardList className="h-4 w-4 mr-2 text-green-600" />
                      OPD Summary
                    </Button>
                  </div>
                </Card>

                {/* Medical Records Actions */}
                <Card className="p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Medical Records
                  </h3>
                  <div className="space-y-2">
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => setActiveTab('medical')}
                    >
                      <History className="h-4 w-4 mr-2 text-blue-600" />
                      View Medical History
                    </Button>
                    <Button className="w-full justify-start" variant="outline" onClick={() => toast.info('Discharge summary feature')}>
                      <FileText className="h-4 w-4 mr-2 text-purple-600" />
                      Discharge Summary
                    </Button>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer Actions */}
        <div className="border-t p-4 bg-gray-50 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Upload Document Modal */}
    <UploadDocumentModal
      open={isUploadModalOpen}
      onClose={() => setIsUploadModalOpen(false)}
      patientId={patient.id}
      patientName={patientName}
      doctorId={doctorId}
      onUploadComplete={onPatientUpdated}
    />

    {/* Write Prescription Modal */}
    <WritePrescriptionModal
      open={isPrescriptionModalOpen}
      onClose={() => setIsPrescriptionModalOpen(false)}
      patientId={patient.id}
      patientName={patientName}
      doctorId={doctorId}
      onPrescriptionSaved={onPatientUpdated}
    />

    {/* Write Lab Report Modal */}
    <WriteLabReportModal
      open={isLabReportModalOpen}
      onClose={() => setIsLabReportModalOpen(false)}
      patientId={patient.id}
      patientName={patientName}
      doctorId={doctorId}
      onReportSaved={onPatientUpdated}
    />

    {/* OPD Summary Modal */}
    <OpdSummaryModal
      open={isOpdSummaryModalOpen}
      onClose={() => setIsOpdSummaryModalOpen(false)}
      patientId={patient.id}
      patientName={patientName}
      doctorId={doctorId}
      onSummaryPublished={onPatientUpdated}
    />
    </>
  );
}
