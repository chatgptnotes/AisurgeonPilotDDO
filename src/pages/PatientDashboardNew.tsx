import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  Calendar,
  FileText,
  CreditCard,
  LogOut,
  User,
  UserPlus,
  ClipboardList,
  Clock,
  Phone,
  Mail,
  MapPin,
  Search,
  Stethoscope,
  Tag,
  ArrowRight,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import RealtimeStatus from '@/components/RealtimeStatus';
import { MeetingLinkButton } from '@/components/appointments/MeetingLinkButton';

const PatientDashboardNew: React.FC = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to get status badge styling
  const getStatusBadge = (status: string, startAt: string) => {
    const isUpcoming = new Date(startAt) > new Date();

    switch(status) {
      case 'completed':
        return { label: 'Completed', color: 'bg-green-100 text-green-800', Icon: CheckCircle };
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-red-100 text-red-800', Icon: XCircle };
      case 'no_show':
        return { label: 'No Show', color: 'bg-gray-100 text-gray-800', Icon: AlertCircle };
      case 'in_progress':
        return { label: 'In Progress', color: 'bg-purple-100 text-purple-800', Icon: PlayCircle };
      case 'confirmed':
      case 'scheduled':
        return isUpcoming
          ? { label: 'Upcoming', color: 'bg-blue-100 text-blue-800', Icon: Clock }
          : { label: 'Missed', color: 'bg-orange-100 text-orange-800', Icon: AlertCircle };
      case 'pending_payment':
        return { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800', Icon: Clock };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800', Icon: Clock };
    }
  };

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  // Real-time subscription for appointments
  useEffect(() => {
    const patientId = localStorage.getItem('patient_id');
    if (!patientId) return;

    console.log('[Real-time] Setting up patient appointments subscription for patient:', patientId);

    const channel = supabase
      .channel('patient-appointments-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `patient_id=eq.${patientId}`
      }, async (payload) => {
        console.log('[Real-time] Appointment change detected:', payload);

        if (payload.eventType === 'INSERT') {
          // New appointment created - fetch full details
          const { data: newAppointment, error } = await supabase
            .from('appointments')
            .select(`
              *,
              doctors(
                full_name,
                specialties,
                profile_photo_url,
                zoom_meeting_link,
                zoom_password,
                zoom_meeting_id
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error('[Real-time] Error fetching new appointment:', error);
            return;
          }

          if (newAppointment) {
            setAppointments(prev => {
              // Check if appointment already exists
              const exists = prev.some(apt => apt.id === newAppointment.id);
              if (exists) return prev;

              // Add and sort by start time (most recent first)
              return [newAppointment, ...prev].sort((a, b) =>
                new Date(b.start_at).getTime() - new Date(a.start_at).getTime()
              );
            });

            toast.success('New appointment booked successfully!', {
              description: `${format(new Date(newAppointment.start_at), 'EEEE, MMM d • h:mm a')}`
            });
          }
        } else if (payload.eventType === 'UPDATE') {
          // Appointment updated - check what changed
          const oldStatus = (payload.old as any).status;
          const newStatus = (payload.new as any).status;

          // Fetch updated appointment with doctor details
          const { data: updatedAppointment, error } = await supabase
            .from('appointments')
            .select(`
              *,
              doctors(
                full_name,
                specialties,
                profile_photo_url,
                zoom_meeting_link,
                zoom_password,
                zoom_meeting_id
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error('[Real-time] Error fetching updated appointment:', error);
            return;
          }

          if (updatedAppointment) {
            setAppointments(prev =>
              prev.map(apt => apt.id === payload.new.id ? updatedAppointment : apt)
            );

            // Show appropriate notification based on status change
            if (oldStatus !== newStatus) {
              const doctorName = updatedAppointment.doctors?.full_name || 'Doctor';

              switch (newStatus) {
                case 'confirmed':
                  toast.success(`Appointment confirmed by Dr. ${doctorName}`, {
                    description: 'Your appointment has been confirmed'
                  });
                  break;
                case 'cancelled':
                  toast.error(`Appointment cancelled`, {
                    description: 'This appointment has been cancelled'
                  });
                  break;
                case 'completed':
                  toast.info('Appointment completed', {
                    description: 'Your consultation has been completed'
                  });
                  break;
                case 'in_progress':
                  toast.info('Appointment in progress', {
                    description: 'Your consultation is starting'
                  });
                  break;
                case 'no_show':
                  toast.warning('Appointment marked as no-show', {
                    description: 'Please contact the clinic'
                  });
                  break;
                default:
                  toast.info('Appointment updated');
              }
            }
          }
        } else if (payload.eventType === 'DELETE') {
          // Appointment deleted
          setAppointments(prev => prev.filter(apt => apt.id !== payload.old.id));
          toast.warning('Appointment removed', {
            description: 'An appointment has been removed from your schedule'
          });
        }
      })
      .subscribe((status) => {
        console.log('[Real-time] Subscription status:', status);
      });

    return () => {
      console.log('[Real-time] Cleaning up patient appointments subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      // Check if patient is authenticated
      const patientId = localStorage.getItem('patient_id');
      const isAuth = localStorage.getItem('patient_auth');

      if (!patientId || !isAuth) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      // Load patient data
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError || !patientData) {
        console.error('Error loading patient:', patientError);
        toast.error('Failed to load patient data');
        handleLogout();
        return;
      }

      setPatient(patientData);

      // Load patient's visits (completed appointments as visits)
      const { data: visitsData } = await supabase
        .from('appointments')
        .select(`
          id,
          start_at,
          end_at,
          status,
          reason,
          symptoms,
          doctors(
            full_name,
            specialties
          )
        `)
        .eq('patient_id', patientId)
        .eq('status', 'completed')
        .order('start_at', { ascending: false })
        .limit(5);

      setVisits(visitsData || []);

      // Load ALL patient appointments (upcoming, completed, cancelled, etc.)
      console.log('[Dashboard] Fetching all appointments for patient:', patientId);
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors(
            full_name,
            specialties,
            profile_photo_url,
            zoom_meeting_link,
            zoom_password,
            zoom_meeting_id
          )
        `)
        .eq('patient_id', patientId)
        .in('status', ['pending_payment', 'confirmed', 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'])
        .order('start_at', { ascending: false })
        .limit(15);

      console.log('[Dashboard] Appointments query result:', {
        count: appointmentsData?.length || 0,
        error: appointmentsError,
        data: appointmentsData
      });

      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('patient_id');
      localStorage.removeItem('patient_auth');
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const handleFirstTimeRegistration = () => {
    navigate('/patient-register?type=first-time');
  };

  const handleRegularAppointment = () => {
    navigate('/patient-register?type=regular');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {patient?.name?.charAt(0)?.toUpperCase() || 'P'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Welcome, {patient?.name}!</h1>
                <p className="text-sm text-gray-600">{patient?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RealtimeStatus />
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Profile
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/patient/settings')}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{patient?.email || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{patient?.phone || patient?.phone_number || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{patient?.address || 'Not provided'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Doctor Discovery & Booking */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Book an Appointment</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Browse Doctors */}
            <Card
              className="border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer"
              onClick={() => navigate('/doctors')}
            >
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Search className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-center text-xl">Browse Doctors</CardTitle>
                <CardDescription className="text-center">
                  Search and filter by specialty
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate('/doctors')}
                >
                  Find a Doctor
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>View doctor profiles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Real-time slot selection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Apply coupon codes</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Standard Consultation */}
            <Card className="border-2 border-green-200 hover:border-green-400 hover:shadow-xl transition-all cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Stethoscope className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-center text-xl">Standard Consultation</CardTitle>
                <CardDescription className="text-center">
                  Book new consultation with any doctor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => navigate('/doctors')}
                >
                  Book Standard
                </Button>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Choose your preferred doctor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Select convenient time slot</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Instant confirmation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Follow-up Consultation */}
            <Card className="border-2 border-purple-200 hover:border-purple-400 hover:shadow-xl transition-all cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <Tag className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <CardTitle className="text-center text-xl">Follow-up Visit</CardTitle>
                <CardDescription className="text-center">
                  Discounted rates for returning patients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => navigate('/doctors')}
                >
                  Book Follow-up
                </Button>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Lower consultation fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Continuity of care</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Quick rebooking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* My Appointments - All appointments with status badges */}
        <Card className="mb-6" data-section="appointments">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              My Appointments
            </CardTitle>
            <CardDescription>All your appointments (upcoming, completed, cancelled)</CardDescription>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No appointments yet</p>
                <Button onClick={() => navigate('/doctors')}>
                  Book an Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => {
                  const statusBadge = getStatusBadge(appointment.status, appointment.start_at);
                  const StatusIcon = statusBadge.Icon;
                  const isCompleted = appointment.status === 'completed';
                  const isCancelled = appointment.status === 'cancelled' || appointment.status === 'no_show';

                  return (
                    <div
                      key={appointment.id}
                      className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                        isCompleted ? 'bg-green-50/50 border-green-200' :
                        isCancelled ? 'bg-gray-50/50 border-gray-200 opacity-75' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={appointment.doctors?.profile_photo_url || 'https://via.placeholder.com/48'}
                          alt={appointment.doctors?.full_name}
                          className={`w-12 h-12 rounded-full ${isCancelled ? 'grayscale' : ''}`}
                        />
                        <div>
                          <p className={`font-semibold ${isCancelled ? 'text-gray-500' : ''}`}>
                            {appointment.doctors?.full_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {appointment.doctors?.specialties?.[0] || 'Specialist'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(appointment.start_at), 'EEEE, MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-2 items-end">
                          <Badge className={`${statusBadge.color} flex items-center gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusBadge.label}
                          </Badge>
                          {!isCompleted && !isCancelled && (
                            <MeetingLinkButton appointment={appointment} />
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/appointment/confirm/${appointment.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Grid */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                // Scroll to Recent Visits section
                document.querySelector('[data-section="recent-visits"]')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <CardContent className="pt-6 text-center">
                <ClipboardList className="h-10 w-10 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold">My Records</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {visits.length > 0 ? `${visits.length} completed visit${visits.length > 1 ? 's' : ''}` : 'No records yet'}
                </p>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate('/patient/prescriptions')}
            >
              <CardContent className="pt-6 text-center">
                <FileText className="h-10 w-10 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold">Prescriptions</h3>
                <p className="text-xs text-gray-500 mt-1">
                  View past prescriptions
                </p>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                toast.info('Billing history will be available soon');
              }}
            >
              <CardContent className="pt-6 text-center">
                <CreditCard className="h-10 w-10 text-orange-600 mx-auto mb-2" />
                <h3 className="font-semibold">Billing</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {appointments.length > 0 ? `${appointments.length} pending payment${appointments.length > 1 ? 's' : ''}` : 'No bills'}
                </p>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                document.querySelector('[data-section="appointments"]')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <CardContent className="pt-6 text-center">
                <Calendar className="h-10 w-10 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold">Appointments</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {appointments.length > 0 ? `${appointments.length} total` : 'Book new appointment'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Visits */}
        <Card data-section="recent-visits">
          <CardHeader>
            <CardTitle>Recent Visits</CardTitle>
            <CardDescription>Your recent appointments and consultations</CardDescription>
          </CardHeader>
          <CardContent>
            {visits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>No completed visits yet</p>
                <p className="text-sm mt-2">Your completed consultations will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {visits.map((visit: any) => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Stethoscope className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {visit.doctors?.full_name || 'Doctor'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {visit.doctors?.specialties?.[0] || 'Consultation'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(visit.start_at), 'PPP • p')}
                        </p>
                        {visit.reason && (
                          <p className="text-xs text-gray-400 mt-1">
                            Reason: {visit.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Completed
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast.info('Visit details will be available soon');
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientDashboardNew;
