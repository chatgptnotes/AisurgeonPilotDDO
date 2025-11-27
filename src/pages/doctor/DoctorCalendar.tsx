import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, User, Video, MapPin, Phone, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DoctorSidebar } from '@/components/doctor/DoctorSidebar';
import { AppointmentDetailsModal } from '@/components/appointments/AppointmentDetailsModal';

interface Appointment {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  meeting_link?: string;
  mode?: string;
  symptoms?: string;
  reason?: string;
  patient?: {
    name: string;
    email: string;
    phone: string;
  };
  patients?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface DoctorProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  profile_photo_url?: string;
}

export default function DoctorCalendar() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchDoctorProfile();
    fetchAppointments();
  }, [currentDate]);

  const fetchDoctorProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: doctor, error } = await supabase
        .from('doctors')
        .select('id, user_id, full_name, email, profile_photo_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching doctor profile:', error);
        throw error;
      }

      if (!doctor) {
        toast.error('Doctor profile not found');
        navigate('/login');
        return;
      }

      setDoctorProfile(doctor);
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      toast.error('Failed to load doctor profile');
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Get doctor ID
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (doctorError) {
        console.error('Error fetching doctor ID:', doctorError);
        throw doctorError;
      }

      if (!doctor) {
        toast.error('Doctor profile not found');
        throw new Error('Doctor profile not found');
      }

      // Get start and end of month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Fetch appointments for the month
      const startOfMonthISO = `${startOfMonth.toISOString().split('T')[0]}T00:00:00`;
      const endOfMonthISO = `${endOfMonth.toISOString().split('T')[0]}T23:59:59`;

      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          doctor_id,
          start_at,
          end_at,
          status,
          meeting_link,
          meeting_platform,
          mode,
          symptoms,
          reason,
          notes,
          appointment_type,
          patients (
            id,
            name,
            email,
            phone,
            date_of_birth
          )
        `)
        .eq('doctor_id', doctor.id)
        .gte('start_at', startOfMonthISO)
        .lte('start_at', endOfMonthISO)
        .order('start_at', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getAppointmentsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_at).toISOString().split('T')[0];
      return aptDate === dateStr;
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsDetailsModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleAppointmentUpdate = () => {
    fetchAppointments();
  };

  return (
    <SidebarProvider>
      <DoctorSidebar
        doctorName={doctorProfile?.full_name}
        doctorEmail={doctorProfile?.email}
        doctorPhoto={doctorProfile?.profile_photo_url}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
            <p className="text-gray-600">View and manage your appointments</p>
          </div>

          {/* Calendar Controls */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPreviousMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-xl font-semibold">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNextMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={goToToday}>Today</Button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day names header */}
                {dayNames.map(day => (
                  <div key={day} className="text-center font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {loading ? (
                  <div className="col-span-7 py-12 text-center text-gray-500">
                    Loading calendar...
                  </div>
                ) : (
                  getDaysInMonth().map((date, index) => {
                    const dayAppointments = getAppointmentsForDate(date);
                    const today = isToday(date);

                    return (
                      <div
                        key={index}
                        className={`min-h-[100px] border rounded-lg p-2 ${
                          !date ? 'bg-gray-50' : today ? 'bg-blue-50 border-blue-300' : 'bg-white'
                        }`}
                      >
                        {date && (
                          <>
                            <div className={`text-sm font-semibold mb-1 ${today ? 'text-blue-600' : 'text-gray-700'}`}>
                              {date.getDate()}
                            </div>
                            {dayAppointments.length > 0 && (
                              <div className="space-y-1">
                                {dayAppointments.slice(0, 3).map(apt => {
                                  const patientData = apt.patient || apt.patients;
                                  const patientName = patientData?.name || 'Unknown Patient';
                                  const timeStr = new Date(apt.start_at).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  });

                                  return (
                                    <div
                                      key={apt.id}
                                      className={`text-xs p-1 rounded ${getStatusColor(apt.status)} cursor-pointer hover:opacity-80`}
                                      onClick={() => handleAppointmentClick(apt)}
                                    >
                                      <div className="font-medium truncate">{timeStr}</div>
                                      <div className="truncate">{patientName}</div>
                                    </div>
                                  );
                                })}
                                {dayAppointments.length > 3 && (
                                  <div className="text-xs text-gray-600 font-medium">
                                    +{dayAppointments.length - 3} more
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Appointments List */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No appointments scheduled for this month</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.slice(0, 10).map(apt => {
                    const patientData = apt.patient || apt.patients;
                    const patientName = patientData?.name || 'Unknown Patient';

                    return (
                      <div
                        key={apt.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleAppointmentClick(apt)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="font-semibold">{patientName}</span>
                              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(apt.status)}`}>
                                {apt.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                {new Date(apt.start_at).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {new Date(apt.start_at).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
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
                              {apt.meeting_link && (
                                <div className="flex items-center gap-2 col-span-2">
                                  <Video className="h-4 w-4" />
                                  <a
                                    href={apt.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline truncate"
                                  >
                                    Video Call: {apt.meeting_link}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        appointment={selectedAppointment}
        open={isDetailsModalOpen}
        onClose={handleModalClose}
        onUpdate={handleAppointmentUpdate}
      />
    </SidebarProvider>
  );
}
