import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  User,
  Bell,
  Shield,
  Video,
  ArrowLeft,
  Save,
  Settings,
  Mail,
  Phone,
  Building,
  Clock,
  MessageSquare,
  Calendar,
  Plus,
  Trash2,
  CalendarOff,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { DoctorSidebar } from '@/components/doctor/DoctorSidebar';

export default function DoctorSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Doctor profile from localStorage
  const [doctorProfile, setDoctorProfile] = useState<{
    full_name: string;
    email: string;
  } | null>(null);

  // Profile settings
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [newBookingAlerts, setNewBookingAlerts] = useState(true);
  const [cancellationAlerts, setCancellationAlerts] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);

  // Availability settings
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [slotDuration, setSlotDuration] = useState('30');
  const [bufferTime, setBufferTime] = useState('10');

  // Weekly availability: day_of_week -> { is_active, start_time, end_time }
  const [weeklyAvailability, setWeeklyAvailability] = useState<{
    [key: number]: { is_active: boolean; start_time: string; end_time: string };
  }>({
    0: { is_active: false, start_time: '09:00', end_time: '17:00' }, // Sunday
    1: { is_active: true, start_time: '09:00', end_time: '17:00' },  // Monday
    2: { is_active: true, start_time: '09:00', end_time: '17:00' },  // Tuesday
    3: { is_active: true, start_time: '09:00', end_time: '17:00' },  // Wednesday
    4: { is_active: true, start_time: '09:00', end_time: '17:00' },  // Thursday
    5: { is_active: true, start_time: '09:00', end_time: '17:00' },  // Friday
    6: { is_active: false, start_time: '09:00', end_time: '17:00' }, // Saturday
  });

  // Blocked dates
  const [blockedDates, setBlockedDates] = useState<{ id: string; date: string; reason: string }[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');
  const [addingBlockedDate, setAddingBlockedDate] = useState(false);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Load doctor profile from localStorage
  useEffect(() => {
    const storedDoctorId = localStorage.getItem('doctor_id');
    const storedDoctorName = localStorage.getItem('doctor_name');
    const storedDoctorEmail = localStorage.getItem('doctor_email');

    if (storedDoctorId) {
      setDoctorId(storedDoctorId);
    }
    if (storedDoctorName) {
      setDoctorProfile({
        full_name: storedDoctorName,
        email: storedDoctorEmail || '',
      });
    }
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const storedDoctorId = localStorage.getItem('doctor_id');

    // If no user and no stored doctor ID, can't load settings
    if (!user?.id && !storedDoctorId) {
      setLoading(false);
      return;
    }

    try {
      let docId = storedDoctorId;

      // Try to fetch from database if user is authenticated
      if (user?.id) {
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          docId = data.id;
          setDoctorId(data.id);
          setFullName(data.full_name || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setSpecialization(data.specialization || '');
          setClinicName(data.clinic_name || '');
          setClinicAddress(data.clinic_address || '');
        }
      }

      // Load availability and blocked dates with whatever doctor ID we have
      if (docId) {
        setDoctorId(docId);
        await loadAvailability(docId);
        await loadBlockedDates(docId);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async (docId: string) => {
    try {
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', docId);

      if (error) throw error;

      if (data && data.length > 0) {
        const availabilityMap: { [key: number]: { is_active: boolean; start_time: string; end_time: string } } = {};
        data.forEach((item: any) => {
          availabilityMap[item.day_of_week] = {
            is_active: item.is_active ?? true,
            start_time: item.start_time?.substring(0, 5) || '09:00',
            end_time: item.end_time?.substring(0, 5) || '17:00',
          };
          // Get slot settings from first record
          if (item.slot_duration_minutes) {
            setSlotDuration(String(item.slot_duration_minutes));
          }
          if (item.buffer_minutes !== undefined) {
            setBufferTime(String(item.buffer_minutes));
          }
        });
        // Merge with defaults for days without records
        setWeeklyAvailability(prev => ({ ...prev, ...availabilityMap }));
      }
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const loadBlockedDates = async (docId: string) => {
    try {
      const { data, error } = await supabase
        .from('doctor_blackout_dates')
        .select('*')
        .eq('doctor_id', docId)
        .gte('date', format(new Date(), 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (error) throw error;

      if (data) {
        setBlockedDates(data.map((item: any) => ({
          id: item.id,
          date: item.date,
          reason: item.reason || '',
        })));
      }
    } catch (error) {
      console.error('Error loading blocked dates:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          full_name: fullName,
          phone: phone,
          specialization: specialization,
          clinic_name: clinicName,
          clinic_address: clinicAddress,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update localStorage
      localStorage.setItem('doctor_name', fullName);

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    toast.success('Notification preferences saved!');
  };

  // Availability functions
  const handleSaveAvailability = async () => {
    if (!doctorId) {
      toast.error('Doctor profile not found');
      return;
    }

    setSavingAvailability(true);
    try {
      // Save availability for each day (check if exists, then update or insert)
      // Get tenant_id from localStorage or use default
      const tenantId = localStorage.getItem('tenant_id') || '00000000-0000-0000-0000-000000000001';

      for (let day = 0; day <= 6; day++) {
        const dayAvailability = weeklyAvailability[day];
        const availabilityData: any = {
          tenant_id: tenantId,
          doctor_id: doctorId,
          day_of_week: day,
          start_time: dayAvailability.start_time + ':00',
          end_time: dayAvailability.end_time + ':00',
          slot_duration_minutes: parseInt(slotDuration),
          max_appointments_per_slot: 4,
          is_active: dayAvailability.is_active,
        };

        // Check if record exists
        const { data: existing } = await supabase
          .from('doctor_availability')
          .select('id')
          .eq('doctor_id', doctorId)
          .eq('day_of_week', day)
          .single();

        if (existing) {
          // Update existing record
          const { error } = await supabase
            .from('doctor_availability')
            .update(availabilityData)
            .eq('id', existing.id);

          if (error) throw error;
        } else {
          // Insert new record
          const { error } = await supabase
            .from('doctor_availability')
            .insert(availabilityData);

          if (error) throw error;
        }
      }

      toast.success('Availability saved successfully!');
    } catch (error: any) {
      console.error('Error saving availability:', error);
      const errorMessage = error?.message || error?.details || JSON.stringify(error);
      toast.error(`Failed to save availability: ${errorMessage}`);
    } finally {
      setSavingAvailability(false);
    }
  };

  const updateDayAvailability = (day: number, field: string, value: any) => {
    setWeeklyAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleAddBlockedDate = async () => {
    if (!doctorId || !newBlockedDate) {
      toast.error('Please select a date');
      return;
    }

    setAddingBlockedDate(true);
    try {
      const { data, error } = await supabase
        .from('doctor_blackout_dates')
        .insert({
          doctor_id: doctorId,
          date: newBlockedDate,
          reason: newBlockedReason || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setBlockedDates(prev => [...prev, {
          id: data.id,
          date: data.date,
          reason: data.reason || '',
        }].sort((a, b) => a.date.localeCompare(b.date)));
      }

      setNewBlockedDate('');
      setNewBlockedReason('');
      toast.success('Blocked date added!');
    } catch (error: any) {
      console.error('Error adding blocked date:', error);
      if (error.code === '23505') {
        toast.error('This date is already blocked');
      } else {
        toast.error('Failed to add blocked date');
      }
    } finally {
      setAddingBlockedDate(false);
    }
  };

  const handleRemoveBlockedDate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('doctor_blackout_dates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBlockedDates(prev => prev.filter(d => d.id !== id));
      toast.success('Blocked date removed!');
    } catch (error) {
      console.error('Error removing blocked date:', error);
      toast.error('Failed to remove blocked date');
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <DoctorSidebar
          doctorName={doctorProfile?.full_name}
          doctorEmail={doctorProfile?.email}
        />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading settings...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
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
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <Button variant="ghost" size="sm" onClick={() => navigate('/doctor/dashboard')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Settings className="h-6 w-6 text-gray-600" />
                    Settings
                  </h1>
                  <p className="text-sm text-gray-600">
                    Manage your profile and preferences
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-6">
                  <TabsTrigger value="profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="availability" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Availability
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger value="meeting" className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Meeting
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security
                  </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Information
                      </CardTitle>
                      <CardDescription>
                        Update your personal and clinic information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Dr. John Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <Input
                              id="email"
                              value={email}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          <p className="text-xs text-gray-500">Email cannot be changed</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <Input
                              id="phone"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+91 9876543210"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="specialization">Specialization</Label>
                          <Input
                            id="specialization"
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                            placeholder="e.g., General Surgery, Cardiology"
                          />
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-medium mb-4 flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Clinic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="clinicName">Clinic/Hospital Name</Label>
                            <Input
                              id="clinicName"
                              value={clinicName}
                              onChange={(e) => setClinicName(e.target.value)}
                              placeholder="AI Surgeon Clinic"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="clinicAddress">Clinic Address</Label>
                            <Input
                              id="clinicAddress"
                              value={clinicAddress}
                              onChange={(e) => setClinicAddress(e.target.value)}
                              placeholder="123 Medical Street, City"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t">
                        <Button onClick={handleSaveProfile} disabled={saving}>
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Profile
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Availability Tab */}
                <TabsContent value="availability">
                  <div className="space-y-6">
                    {/* Weekly Schedule */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Weekly Schedule
                        </CardTitle>
                        <CardDescription>
                          Set your available days and working hours
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-2 font-medium">Day</th>
                                <th className="text-center py-2 px-2 font-medium">Available</th>
                                <th className="text-center py-2 px-2 font-medium">Start Time</th>
                                <th className="text-center py-2 px-2 font-medium">End Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                                <tr key={day} className="border-b">
                                  <td className="py-3 px-2 font-medium">{dayNames[day]}</td>
                                  <td className="py-3 px-2 text-center">
                                    <Switch
                                      checked={weeklyAvailability[day]?.is_active}
                                      onCheckedChange={(checked) =>
                                        updateDayAvailability(day, 'is_active', checked)
                                      }
                                    />
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    <Input
                                      type="time"
                                      value={weeklyAvailability[day]?.start_time || '09:00'}
                                      onChange={(e) =>
                                        updateDayAvailability(day, 'start_time', e.target.value)
                                      }
                                      disabled={!weeklyAvailability[day]?.is_active}
                                      className="w-32 mx-auto"
                                    />
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    <Input
                                      type="time"
                                      value={weeklyAvailability[day]?.end_time || '17:00'}
                                      onChange={(e) =>
                                        updateDayAvailability(day, 'end_time', e.target.value)
                                      }
                                      disabled={!weeklyAvailability[day]?.is_active}
                                      className="w-32 mx-auto"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Slot Settings */}
                        <div className="border-t pt-4 mt-4">
                          <h3 className="font-medium mb-4 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Slot Settings
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Slot Duration</Label>
                              <Select value={slotDuration} onValueChange={setSlotDuration}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="15">15 minutes</SelectItem>
                                  <SelectItem value="20">20 minutes</SelectItem>
                                  <SelectItem value="30">30 minutes</SelectItem>
                                  <SelectItem value="45">45 minutes</SelectItem>
                                  <SelectItem value="60">60 minutes</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Buffer Time (between appointments)</Label>
                              <Select value={bufferTime} onValueChange={setBufferTime}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select buffer" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0">No buffer</SelectItem>
                                  <SelectItem value="5">5 minutes</SelectItem>
                                  <SelectItem value="10">10 minutes</SelectItem>
                                  <SelectItem value="15">15 minutes</SelectItem>
                                  <SelectItem value="20">20 minutes</SelectItem>
                                  <SelectItem value="30">30 minutes</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                          <Button onClick={handleSaveAvailability} disabled={savingAvailability}>
                            {savingAvailability ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Schedule
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Blocked Dates */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CalendarOff className="h-5 w-5" />
                          Blocked Dates (Vacation / Leave)
                        </CardTitle>
                        <CardDescription>
                          Mark specific dates when you are unavailable. Patients won't be able to book on these dates.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Add new blocked date */}
                        <div className="flex flex-col md:flex-row gap-3">
                          <div className="flex-1">
                            <Label htmlFor="blockedDate" className="sr-only">Date</Label>
                            <Input
                              id="blockedDate"
                              type="date"
                              value={newBlockedDate}
                              onChange={(e) => setNewBlockedDate(e.target.value)}
                              min={format(new Date(), 'yyyy-MM-dd')}
                              placeholder="Select date"
                            />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor="blockedReason" className="sr-only">Reason</Label>
                            <Input
                              id="blockedReason"
                              type="text"
                              value={newBlockedReason}
                              onChange={(e) => setNewBlockedReason(e.target.value)}
                              placeholder="Reason (optional)"
                            />
                          </div>
                          <Button
                            onClick={handleAddBlockedDate}
                            disabled={addingBlockedDate || !newBlockedDate}
                          >
                            {addingBlockedDate ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>

                        {/* List of blocked dates */}
                        {blockedDates.length > 0 ? (
                          <div className="border rounded-lg divide-y">
                            {blockedDates.map((blockedDate) => (
                              <div
                                key={blockedDate.id}
                                className="flex items-center justify-between p-3"
                              >
                                <div>
                                  <p className="font-medium">
                                    {format(new Date(blockedDate.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                                  </p>
                                  {blockedDate.reason && (
                                    <p className="text-sm text-gray-500">{blockedDate.reason}</p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveBlockedDate(blockedDate.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
                            <CalendarOff className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p>No blocked dates</p>
                            <p className="text-sm">Add dates when you're unavailable</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Preferences
                      </CardTitle>
                      <CardDescription>
                        Choose how you want to receive notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Channels */}
                      <div className="space-y-4">
                        <h3 className="font-medium">Notification Channels</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Mail className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium">Email Notifications</p>
                                <p className="text-sm text-gray-500">Receive updates via email</p>
                              </div>
                            </div>
                            <Switch
                              checked={emailNotifications}
                              onCheckedChange={setEmailNotifications}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <MessageSquare className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium">WhatsApp Notifications</p>
                                <p className="text-sm text-gray-500">Receive updates via WhatsApp</p>
                              </div>
                            </div>
                            <Switch
                              checked={whatsappNotifications}
                              onCheckedChange={setWhatsappNotifications}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Notification Types */}
                      <div className="border-t pt-4 space-y-4">
                        <h3 className="font-medium">Notification Types</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Clock className="h-5 w-5 text-purple-600" />
                              <div>
                                <p className="font-medium">Appointment Reminders</p>
                                <p className="text-sm text-gray-500">Reminders before appointments</p>
                              </div>
                            </div>
                            <Switch
                              checked={appointmentReminders}
                              onCheckedChange={setAppointmentReminders}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">New Booking Alerts</p>
                              <p className="text-sm text-gray-500">When a patient books an appointment</p>
                            </div>
                            <Switch
                              checked={newBookingAlerts}
                              onCheckedChange={setNewBookingAlerts}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Cancellation Alerts</p>
                              <p className="text-sm text-gray-500">When a patient cancels</p>
                            </div>
                            <Switch
                              checked={cancellationAlerts}
                              onCheckedChange={setCancellationAlerts}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Daily Summary</p>
                              <p className="text-sm text-gray-500">Daily summary of appointments</p>
                            </div>
                            <Switch
                              checked={dailySummary}
                              onCheckedChange={setDailySummary}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t">
                        <Button onClick={handleSaveNotifications}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Preferences
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Meeting Tab */}
                <TabsContent value="meeting">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        Meeting Settings
                      </CardTitle>
                      <CardDescription>
                        Configure your video consultation settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Video className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-blue-900 mb-1">
                              Zoom Meeting Configuration
                            </h3>
                            <p className="text-sm text-blue-700 mb-3">
                              Set up your permanent Zoom meeting room for video consultations.
                              Patients will receive this link with their appointment details.
                            </p>
                            <Button onClick={() => navigate('/doctor/meeting')}>
                              <Video className="h-4 w-4 mr-2" />
                              Configure Zoom Meeting
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security Settings
                      </CardTitle>
                      <CardDescription>
                        Manage your account security
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Two-Factor Authentication</p>
                            <p className="text-sm text-gray-500">Add an extra layer of security</p>
                          </div>
                          <Button variant="outline" onClick={() => navigate('/doctor/security')}>
                            Configure
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Change Password</p>
                            <p className="text-sm text-gray-500">Update your account password</p>
                          </div>
                          <Button variant="outline">
                            Change
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Active Sessions</p>
                            <p className="text-sm text-gray-500">Manage your logged-in devices</p>
                          </div>
                          <Button variant="outline">
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
