import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  CheckCircle,
  Calendar,
  Clock,
  DollarSign,
  User,
  Video,
  Phone,
  MapPin,
  ArrowLeft,
  FileText,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { getModeIcon, getModeLabel, formatAppointmentTime } from '@/utils/appointmentHelpers';
import PatientDocumentUpload from '@/components/patient/PatientDocumentUpload';

interface Doctor {
  id: string;
  full_name: string;
  specialties: string[];
  profile_photo_url: string;
  consultation_fee_standard: number;
  consultation_fee_followup: number;
  currency: string;
  zoom_meeting_link?: string;
  zoom_password?: string;
  zoom_meeting_id?: string;
  zoom_instructions?: string;
}

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  start_at: string;
  end_at: string;
  appointment_type: string;
  mode: string;
  status: string;
  payment_amount: number;
  payment_status: string;
  currency: string;
  discount_amount?: number;
  symptoms?: string;
  reason_for_visit?: string;
  reason?: string;
  meeting_link?: string;
  doctors: Doctor;
  patients: Patient;
}

export default function AppointmentConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const loadAppointment = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors (
            id,
            full_name,
            specialties,
            profile_photo_url,
            consultation_fee_standard,
            consultation_fee_followup,
            currency,
            zoom_meeting_link,
            zoom_password,
            zoom_meeting_id,
            zoom_instructions
          ),
          patients (
            id,
            name,
            phone,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setAppointment(data);
    } catch (error) {
      console.error('Error loading appointment:', error);
      toast.error('Failed to load appointment');
      navigate('/patient-dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!appointment) return;

    setConfirming(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'confirmed',
          payment_status: 'pending' // Will be 'paid' after payment integration
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Appointment confirmed successfully!');

      // TODO: Send WhatsApp confirmation
      // await whatsappService.sendAppointmentConfirmation({
      //   patientPhone: appointment.patients.phone,
      //   patientName: appointment.patients.name,
      //   doctorName: appointment.doctors.full_name,
      //   appointmentDate: appointment.start_at,
      //   appointmentTime: formatAppointmentTime(appointment.start_at, appointment.end_at),
      //   mode: appointment.mode,
      //   meetingLink: appointment.meeting_link
      // });

      setTimeout(() => {
        navigate('/patient-dashboard');
      }, 1500);

    } catch (error) {
      console.error('Error confirming appointment:', error);
      toast.error('Failed to confirm appointment');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Appointment Not Found</h2>
              <p className="text-gray-600 mb-4">The appointment you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/patient-dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Map mode to Lucide icons
  const getModeIconComponent = (mode: string) => {
    switch (mode) {
      case 'video':
        return Video;
      case 'phone':
      case 'audio':
        return Phone;
      case 'in-person':
        return MapPin;
      default:
        return Calendar;
    }
  };

  const ModeIcon = getModeIconComponent(appointment.mode);
  const originalFee = appointment.appointment_type === 'followup'
    ? appointment.doctors.consultation_fee_followup
    : appointment.doctors.consultation_fee_standard;


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/patient-dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Appointment Booked Successfully!
          </h1>
          <p className="text-gray-600">
            Your appointment has been scheduled. Please review the details below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Doctor Info */}
            <Card>
              <CardHeader>
                <CardTitle>Doctor Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <img
                    src={appointment.doctors.profile_photo_url || 'https://via.placeholder.com/80'}
                    alt={appointment.doctors.full_name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">{appointment.doctors.full_name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {appointment.doctors.specialties?.map((specialty: string) => (
                        <Badge key={specialty} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Appointment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-gray-600">
                      {format(new Date(appointment.start_at), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-gray-600">
                      {formatAppointmentTime(appointment.start_at, appointment.end_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ModeIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Consultation Mode</p>
                    <p className="text-gray-600">{getModeLabel(appointment.mode)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Appointment Type</p>
                    <p className="text-gray-600 capitalize">{appointment.appointment_type}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Meeting Details - Only shown when doctor has shared the meeting link */}
            {appointment.mode === 'video' && appointment.meeting_link && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-green-600" />
                    Video Meeting Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm text-gray-600 mb-2">Meeting Link</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm break-all">
                        {appointment.meeting_link}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(appointment.meeting_link || '');
                          toast.success('Link copied!');
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                    onClick={() => window.open(appointment.meeting_link, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Join Video Meeting
                  </Button>

                  <div className="pt-3 border-t text-sm text-green-800">
                    <p className="font-medium mb-2">Before joining:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Ensure you have a stable internet connection</li>
                      <li>Join 5 minutes early to test camera and microphone</li>
                      <li>Find a quiet, well-lit space</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {appointment.mode === 'phone' && (
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <Phone className="h-5 w-5" />
                    Phone Consultation Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-purple-800">
                  <ul className="list-disc list-inside space-y-2">
                    <li>The doctor will call you at your registered phone number</li>
                    <li>Ensure your phone is charged and has good signal</li>
                    <li>Be available 5 minutes before the scheduled time</li>
                    <li>Keep your medical records handy for reference</li>
                  </ul>
                </CardContent>
              </Card>
            )}

            {appointment.mode === 'in-person' && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <MapPin className="h-5 w-5" />
                    In-Person Visit Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-blue-800">
                  <ul className="list-disc list-inside space-y-2">
                    <li>Arrive 10 minutes before your scheduled time</li>
                    <li>Bring any relevant medical records or test results</li>
                    <li>Bring a valid photo ID and insurance card (if applicable)</li>
                    <li>Wear a mask and follow clinic safety protocols</li>
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Medical Information */}
            {(appointment.symptoms || appointment.reason || appointment.reason_for_visit) && (
              <Card>
                <CardHeader>
                  <CardTitle>Medical Information Provided</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {appointment.symptoms && (
                    <div>
                      <p className="font-medium text-sm text-gray-600 mb-1">Symptoms</p>
                      <p className="text-gray-800">{appointment.symptoms}</p>
                    </div>
                  )}
                  {(appointment.reason || appointment.reason_for_visit) && (
                    <div>
                      <p className="font-medium text-sm text-gray-600 mb-1">Reason for Visit</p>
                      <p className="text-gray-800">{appointment.reason || appointment.reason_for_visit}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Patient Document Upload Section */}
            <PatientDocumentUpload
              appointmentId={appointment.id}
              patientId={appointment.patient_id}
              doctorId={appointment.doctor_id}
            />
          </div>

          {/* Payment Summary Sidebar */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
                <CardDescription>Appointment #{appointment.id.slice(0, 8)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Consultation Fee</span>
                    <span className="font-medium">
                      {appointment.currency} {originalFee.toFixed(2)}
                    </span>
                  </div>

                  {appointment.discount_amount && appointment.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount Applied</span>
                      <span>-{appointment.currency} {appointment.discount_amount.toFixed(2)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <span className={appointment.payment_amount === 0 ? 'text-green-600' : 'text-blue-600'}>
                      {appointment.payment_amount === 0 ? 'FREE' : `${appointment.currency} ${appointment.payment_amount.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                    onClick={handleConfirm}
                    disabled={confirming || appointment.status === 'confirmed'}
                  >
                    {confirming ? (
                      <>Processing...</>
                    ) : appointment.status === 'confirmed' ? (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Already Confirmed
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Confirm Appointment
                      </>
                    )}
                  </Button>

                  {appointment.payment_amount === 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs text-green-700 text-center font-medium">
                        Free Booking - No Payment Required
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center">
                      Payment will be processed separately. You will receive payment instructions via email.
                    </p>
                  )}
                </div>

                <Separator />

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2 font-medium">Important Notes:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Cancellation allowed up to 24 hours before appointment</li>
                    <li>• Rescheduling is subject to availability</li>
                    <li>• You will receive reminders via WhatsApp and email</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
