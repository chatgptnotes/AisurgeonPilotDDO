import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, startOfDay, endOfDay, addDays, isToday, isSameDay } from 'date-fns';
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  DollarSign,
  Video,
  FileText,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  XCircle,
  Settings,
  Building2,
  Stethoscope,
  MessageSquare,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { AppointmentActions } from '@/components/appointments/AppointmentActions';
import { AppointmentDetailsModal } from '@/components/appointments/AppointmentDetailsModal';
import { QuickBookingModal } from '@/components/appointments/QuickBookingModal';
import { AppointmentListModal } from '@/components/appointments/AppointmentListModal';
import { PatientListModal } from '@/components/doctor/PatientListModal';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { DoctorSidebar } from '@/components/doctor/DoctorSidebar';

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
  patient?: Patient;
  patients?: Patient; // Supabase returns this way
}

interface AppointmentStats {
  totalPatients: number;
  todayConsultations: number;
  weekAppointments: number;
  monthRevenue: number;
}

interface UpcomingDay {
  date: Date;
  count: number;
}

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingDays, setUpcomingDays] = useState<UpcomingDay[]>([]);
  const [stats, setStats] = useState<AppointmentStats>({
    totalPatients: 0,
    todayConsultations: 0,
    weekAppointments: 0,
    monthRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch doctor ID from database based on logged-in user
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<{
    full_name: string;
    email: string;
  } | null>(null);

  // Hospital stats state
  const [hospitalStats, setHospitalStats] = useState({
    hope: 0,
    ayushman: 0,
    esic: 0,
    cghs: 0,
  });

  // Appointment details modal state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);

  // List modals state
  const [isPatientListOpen, setIsPatientListOpen] = useState(false);
  const [isWeekAppointmentsOpen, setIsWeekAppointmentsOpen] = useState(false);
  const [isDayAppointmentsOpen, setIsDayAppointmentsOpen] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);

  // Store all week appointments for modals
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([]);
  const [dayAppointments, setDayAppointments] = useState<Appointment[]>([]);

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsDetailsModalOpen(false);
    setSelectedAppointment(null);
  };

  // Handler for clicking on day in Next 7 Days
  const handleDayClick = async (date: Date) => {
    if (!doctorId) return;

    try {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients!patient_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth
          )
        `)
        .eq('doctor_id', doctorId)
        .gte('start_at', dayStart.toISOString())
        .lte('start_at', dayEnd.toISOString())
        .order('start_at', { ascending: true });

      if (error) throw error;

      setDayAppointments(data || []);
      setSelectedDayDate(date);
      setIsDayAppointmentsOpen(true);
    } catch (error) {
      console.error('Error fetching day appointments:', error);
      toast.error('Failed to load appointments');
    }
  };

  const handleQuickBookingSuccess = () => {
    // Refresh appointments after successful booking
    fetchTodayAppointments();
    fetchUpcomingAppointments();
    fetchStats();
  };

  useEffect(() => {
    if (user?.id) {
      fetchDoctorProfile();
    }
  }, [user]);

  useEffect(() => {
    if (doctorId) {
      fetchDashboardData();
      subscribeToAppointments();
    }
  }, [doctorId]);

  useEffect(() => {
    fetchHospitalStats();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No active session, redirecting to login');
        localStorage.clear();
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('doctors')
        .select('id, full_name, email')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Doctor profile error:', error);
        // If doctor not found, could be auth issue
        if (error.code === 'PGRST116') {
          toast.error('Doctor profile not found. Please contact administrator.');
          setTimeout(() => {
            localStorage.clear();
            navigate('/login');
          }, 2000);
        }
        return;
      }

      if (data) {
        setDoctorId(data.id);
        setDoctorProfile({
          full_name: data.full_name || 'Dr. User',
          email: data.email || user?.email || 'doctor@example.com',
        });
      }
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
      setError('Failed to load doctor profile');
      toast.error('Session expired. Please login again.');
      // Auto-redirect after 2 seconds
      setTimeout(() => {
        localStorage.clear();
        navigate('/login');
      }, 2000);
    }
  };

  const fetchDashboardData = async () => {
    if (!doctorId) return;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchTodayAppointments(),
        fetchUpcomingAppointments(),
        fetchStats(),
      ]);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAppointments = async () => {
    if (!doctorId) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const startOfToday = `${today}T00:00:00`;
      const endOfToday = `${today}T23:59:59`;

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients!patient_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth
          )
        `)
        .eq('doctor_id', doctorId)
        .gte('start_at', startOfToday)
        .lte('start_at', endOfToday)
        .in('status', ['scheduled', 'confirmed', 'in_progress', 'completed'])
        .order('start_at', { ascending: true });

      if (error) throw error;
      setTodayAppointments(data || []);
    } catch (err) {
      console.error('Error fetching today appointments:', err);
      throw err;
    }
  };

  const fetchUpcomingAppointments = async () => {
    if (!doctorId) return;

    try {
      const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      const weekEnd = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      const startOfTomorrow = `${tomorrow}T00:00:00`;
      const endOfWeek = `${weekEnd}T23:59:59`;

      const { data, error } = await supabase
        .from('appointments')
        .select('start_at')
        .eq('doctor_id', doctorId)
        .gte('start_at', startOfTomorrow)
        .lte('start_at', endOfWeek)
        .in('status', ['scheduled', 'confirmed']);

      if (error) throw error;

      // Group by date
      const grouped = new Map<string, number>();
      (data || []).forEach((apt) => {
        const dateKey = format(new Date(apt.start_at), 'yyyy-MM-dd');
        grouped.set(dateKey, (grouped.get(dateKey) || 0) + 1);
      });

      const upcomingDaysList: UpcomingDay[] = [];
      for (let i = 1; i <= 7; i++) {
        const date = addDays(new Date(), i);
        const dateKey = format(date, 'yyyy-MM-dd');
        upcomingDaysList.push({
          date,
          count: grouped.get(dateKey) || 0,
        });
      }

      setUpcomingDays(upcomingDaysList);
    } catch (err) {
      console.error('Error fetching upcoming appointments:', err);
      throw err;
    }
  };

  const fetchStats = async () => {
    if (!doctorId) return;

    try {
      // Total unique patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('doctor_id', doctorId);

      if (patientsError) {
        console.error('Error fetching patients:', patientsError);
        throw patientsError;
      }

      const uniquePatients = new Set((patientsData || []).map((p: any) => p.patient_id));

      // Today's consultations count
      const today = format(new Date(), 'yyyy-MM-dd');
      const startOfToday = `${today}T00:00:00`;
      const endOfToday = `${today}T23:59:59`;

      const { count: todayCount, error: todayError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .gte('start_at', startOfToday)
        .lte('start_at', endOfToday)
        .in('status', ['completed']);

      if (todayError) throw todayError;

      // This week's appointments count and fetch full data
      const weekEnd = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      const endOfWeek = `${weekEnd}T23:59:59`;

      const { data: weekData, error: weekError, count: weekCount } = await supabase
        .from('appointments')
        .select(`
          *,
          patients!patient_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth
          )
        `, { count: 'exact' })
        .eq('doctor_id', doctorId)
        .gte('start_at', startOfToday)
        .lte('start_at', endOfWeek)
        .in('status', ['scheduled', 'confirmed']);

      if (weekError) throw weekError;

      // Store week appointments for modal
      setWeekAppointments(weekData || []);

      // Calculate month revenue from completed appointments
      const startOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
      const endOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd');

      // Get doctor's consultation fee
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('consultation_fee_standard, consultation_fee_followup')
        .eq('id', doctorId)
        .single();

      if (doctorError) {
        console.error('Error fetching doctor fees:', doctorError);
      }

      const consultationFee = doctorData?.consultation_fee_standard || 0;

      // Get completed appointments count for this month
      const { count: completedCount, error: revenueError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .eq('status', 'completed')
        .gte('start_at', `${startOfMonth}T00:00:00`)
        .lte('start_at', `${endOfMonth}T23:59:59`);

      if (revenueError) {
        console.error('Error calculating revenue:', revenueError);
      }

      const monthRevenue = (completedCount || 0) * consultationFee;

      setStats({
        totalPatients: uniquePatients.size,
        todayConsultations: todayCount || 0,
        weekAppointments: weekCount || 0,
        monthRevenue,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      throw err;
    }
  };

  const fetchHospitalStats = async () => {
    // Hospital stats are disabled - old schema tables don't exist
    // Just set to zero for now
    setHospitalStats({
      hope: 0,
      ayushman: 0,
      esic: 0,
      cghs: 0,
    });
  };

  const subscribeToAppointments = () => {
    if (!doctorId) return;

    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${doctorId}`,
        },
        async (payload) => {
          console.log('Appointment change detected:', payload);

          if (payload.eventType === 'INSERT') {
            const newAppointment = payload.new as Appointment;

            // Fetch patient data for the new appointment
            const { data: patientData } = await supabase
              .from('patients')
              .select('id, first_name, last_name, phone')
              .eq('id', newAppointment.patient_id)
              .single();

            newAppointment.patient = patientData || undefined;

            // Check if it's today's appointment
            const today = format(new Date(), 'yyyy-MM-dd');
            const appointmentDate = format(new Date(newAppointment.start_at), 'yyyy-MM-dd');
            if (appointmentDate === today) {
              setTodayAppointments((prev) => [...prev, newAppointment].sort((a, b) =>
                new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
              ));

              toast.success(`New appointment booked: ${format(new Date(newAppointment.start_at), 'h:mm a')}`);
            }

            // Refresh stats and upcoming
            fetchUpcomingAppointments();
            fetchStats();
          } else if (payload.eventType === 'UPDATE') {
            const updatedAppointment = payload.new as Appointment;

            setTodayAppointments((prev) =>
              prev.map((apt) =>
                apt.id === updatedAppointment.id ? { ...apt, ...updatedAppointment } : apt
              )
            );

            toast.info('Appointment updated');
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;

            setTodayAppointments((prev) =>
              prev.filter((apt) => apt.id !== deletedId)
            );

            toast.info('Appointment cancelled');
            fetchUpcomingAppointments();
            fetchStats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };


  const getStatusIcon = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'no_show':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleStartConsultation = (appointmentId: string) => {
    navigate(`/doctor/consultation/${appointmentId}`);
  };

  const handleViewPatientHistory = (patientId: string) => {
    navigate(`/doctor/patient/${patientId}/history`);
  };

  const handleViewCalendar = () => {
    navigate('/doctor/calendar');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Session Expired</h2>
              <p className="text-gray-600 mb-6">
                Your session has expired or there was an error loading your dashboard.
                Please log in again to continue.
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  Go to Home
                </Button>
                <Button
                  onClick={() => {
                    localStorage.clear();
                    navigate('/login');
                  }}
                  className="flex-1"
                >
                  Login Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <DoctorSidebar
        doctorName={doctorProfile?.full_name}
        doctorEmail={doctorProfile?.email}
      />
      <SidebarInset>
        <div className="min-h-screen bg-gray-50">
          {/* Header with Sidebar Trigger */}
          <div className="sticky top-0 z-10 bg-white border-b">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
                  <p className="text-sm text-gray-600">
                    {format(new Date(), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsQuickBookingOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Take Appointment Now
                </Button>
                <Button variant="outline" onClick={() => navigate('/doctor/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button onClick={handleViewCalendar}>
                  <Calendar className="h-4 w-4 mr-2" />
                  View Calendar
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setIsPatientListOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Patients
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats.totalPatients}</div>
              )}
              <p className="text-xs text-gray-500 mt-1">Click to view all</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today's Consultations
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats.todayConsultations}</div>
              )}
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setIsWeekAppointmentsOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                This Week's Appointments
              </CardTitle>
              <Calendar className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats.weekAppointments}</div>
              )}
              <p className="text-xs text-gray-500 mt-1">Click to view details</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Revenue This Month
              </CardTitle>
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {stats.monthRevenue.toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Hospital Management Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Hospital Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Hope Hospital */}
              <div
                onClick={() => navigate('/')}
                className="cursor-pointer p-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all hover:shadow-md group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <ArrowRight className="h-4 w-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-2xl font-bold text-blue-900">{hospitalStats.hope}</div>
                <div className="text-sm text-blue-700 font-medium">Hope Hospital</div>
                <div className="text-xs text-blue-600 mt-1">patients</div>
              </div>

              {/* Ayushman Hospital */}
              <div
                onClick={() => navigate('/')}
                className="cursor-pointer p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-all hover:shadow-md group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Building2 className="h-6 w-6 text-green-600" />
                  <ArrowRight className="h-4 w-4 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-2xl font-bold text-green-900">{hospitalStats.ayushman}</div>
                <div className="text-sm text-green-700 font-medium">Ayushman</div>
                <div className="text-xs text-green-600 mt-1">patients</div>
              </div>

              {/* ESIC */}
              <div
                onClick={() => navigate('/esic-surgeons')}
                className="cursor-pointer p-4 rounded-lg border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 transition-all hover:shadow-md group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Stethoscope className="h-6 w-6 text-purple-600" />
                  <ArrowRight className="h-4 w-4 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-2xl font-bold text-purple-900">{hospitalStats.esic}</div>
                <div className="text-sm text-purple-700 font-medium">ESIC</div>
                <div className="text-xs text-purple-600 mt-1">patients</div>
              </div>

              {/* CGHS */}
              <div
                onClick={() => navigate('/cghs-surgery')}
                className="cursor-pointer p-4 rounded-lg border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 transition-all hover:shadow-md group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Stethoscope className="h-6 w-6 text-orange-600" />
                  <ArrowRight className="h-4 w-4 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-2xl font-bold text-orange-900">{hospitalStats.cghs}</div>
                <div className="text-sm text-orange-700 font-medium">CGHS</div>
                <div className="text-xs text-orange-600 mt-1">patients</div>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => navigate('/operation-theatre')}
              >
                <Stethoscope className="h-4 w-4 mr-2" />
                Operation Theatre
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => navigate('/accounting')}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Accounting
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => navigate('/pharmacy')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Pharmacy
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => navigate('/lab')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Lab
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => navigate('/radiology')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Radiology
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => navigate('/bill-management')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Bill Management
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* DDO Features Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Digital Doctor Office (DDO)
              <Badge className="ml-2 bg-green-500 text-white">NEW</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="justify-start relative"
                onClick={() => navigate('/whatsapp-service-test')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                WhatsApp Manager
                <Badge className="ml-auto bg-green-500 text-white text-xs">NEW</Badge>
              </Button>
              <Button
                variant="outline"
                className="justify-start relative"
                onClick={() => navigate('/patient-followup')}
              >
                <Users className="h-4 w-4 mr-2" />
                Patient Follow-up
                <Badge className="ml-auto bg-green-500 text-white text-xs">NEW</Badge>
              </Button>
              <Button
                variant="outline"
                className="justify-start relative"
                onClick={() => navigate('/patient-education')}
              >
                <Video className="h-4 w-4 mr-2" />
                Patient Education
                <Badge className="ml-auto bg-green-500 text-white text-xs">NEW</Badge>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Appointments */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Today's Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : todayAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No appointments scheduled for today</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todayAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleAppointmentClick(appointment)}
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>
                              {appointment.patient?.first_name?.[0]}
                              {appointment.patient?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-semibold">
                              {appointment.patient?.first_name}{' '}
                              {appointment.patient?.last_name}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {format(new Date(appointment.start_at), 'h:mm a')}
                            </div>
                            {appointment.patient?.phone && (
                              <div className="text-xs text-gray-500 mt-1">
                                {appointment.patient.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mt-3 md:mt-0">
                          <div className="flex flex-col gap-2">
                            <Badge className="flex items-center gap-1">
                              {getStatusIcon(appointment.status)}
                              {appointment.status}
                            </Badge>
                            {appointment.meeting_link && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(appointment.meeting_link, '_blank')}
                              >
                                <Video className="h-4 w-4 mr-1" />
                                Join Meeting
                              </Button>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <AppointmentActions
                              appointment={appointment}
                              onUpdate={fetchTodayAppointments}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleViewPatientHistory(appointment.patient_id)
                              }
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              History
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Appointments */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Next 7 Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingDays.map((day) => (
                      <div
                        key={day.date.toISOString()}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          day.count > 0
                            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:shadow-md'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => day.count > 0 && handleDayClick(day.date)}
                      >
                        <div>
                          <div className="font-medium">
                            {format(day.date, 'EEEE')}
                          </div>
                          <div className="text-xs text-gray-600">
                            {format(day.date, 'MMM d')}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Badge
                            variant={day.count > 0 ? 'default' : 'outline'}
                            className="ml-2"
                          >
                            {day.count} {day.count === 1 ? 'appointment' : 'appointments'}
                          </Badge>
                          {day.count > 0 && (
                            <ArrowRight className="h-4 w-4 ml-2 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
      </SidebarInset>

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        appointment={selectedAppointment}
        open={isDetailsModalOpen}
        onClose={handleModalClose}
        onUpdate={fetchTodayAppointments}
      />

      {/* Quick Booking Modal */}
      {doctorId && (
        <QuickBookingModal
          doctorId={doctorId}
          open={isQuickBookingOpen}
          onClose={() => setIsQuickBookingOpen(false)}
          onSuccess={handleQuickBookingSuccess}
        />
      )}

      {/* Patient List Modal */}
      {doctorId && (
        <PatientListModal
          open={isPatientListOpen}
          onClose={() => setIsPatientListOpen(false)}
          doctorId={doctorId}
        />
      )}

      {/* Week Appointments Modal */}
      <AppointmentListModal
        open={isWeekAppointmentsOpen}
        onClose={() => setIsWeekAppointmentsOpen(false)}
        title="This Week's Appointments"
        appointments={weekAppointments}
        onAppointmentClick={handleAppointmentClick}
      />

      {/* Day Appointments Modal */}
      <AppointmentListModal
        open={isDayAppointmentsOpen}
        onClose={() => setIsDayAppointmentsOpen(false)}
        title={selectedDayDate ? `Appointments for ${format(selectedDayDate, 'EEEE, MMMM d')}` : 'Appointments'}
        appointments={dayAppointments}
        onAppointmentClick={handleAppointmentClick}
      />
    </SidebarProvider>
  );
};

export default DoctorDashboard;
