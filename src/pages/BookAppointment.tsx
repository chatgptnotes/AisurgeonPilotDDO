import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, startOfWeek, isSameDay, parse, setHours, setMinutes } from 'date-fns';
import { Calendar, Clock, DollarSign, ArrowLeft, Check, Video, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { whatsappService } from '@/services/whatsappService';
import { notificationService } from '@/services/notificationService';
import { sessionManager } from '@/services/sessionManager';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
// Note: Meeting links now use doctor's permanent meeting rooms
// No longer generating per-appointment links via Daily.co

interface Doctor {
  id: string;
  full_name: string;
  profile_photo_url: string;
  consultation_fee_standard: number;
  consultation_fee_followup: number;
  currency: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const BookAppointment: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const appointmentType = searchParams.get('type') || 'standard';
  const FORM_ID = `booking-${doctorId}`;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [appointmentMode, setAppointmentMode] = useState<'in-person' | 'video' | 'phone'>('in-person');
  const [symptoms, setSymptoms] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');

  // Session timeout hook
  const { isSessionValid } = useSessionTimeout({
    showWarning: true,
    redirectOnExpire: true
  });

  // Auto-restore saved form data on mount
  useEffect(() => {
    const savedData = sessionManager.getSavedFormData(FORM_ID);
    if (savedData) {
      const data = savedData.data;
      if (data.selectedDate) setSelectedDate(new Date(data.selectedDate as string));
      if (data.selectedTime) setSelectedTime(data.selectedTime as string);
      if (data.appointmentMode) setAppointmentMode(data.appointmentMode as 'in-person' | 'video' | 'phone');
      if (data.symptoms) setSymptoms(data.symptoms as string);
      if (data.reasonForVisit) setReasonForVisit(data.reasonForVisit as string);
      if (data.couponCode) setCouponCode(data.couponCode as string);

      toast.info('Your booking progress has been restored', {
        description: `Saved ${Math.round((Date.now() - savedData.timestamp) / 60000)} minutes ago`
      });
    }
  }, [FORM_ID]);

  // Auto-save form data on change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedDate || selectedTime || symptoms || reasonForVisit) {
        const dataToSave = {
          selectedDate: selectedDate.toISOString(),
          selectedTime,
          appointmentMode,
          symptoms,
          reasonForVisit,
          couponCode
        };
        sessionManager.saveFormData(FORM_ID, dataToSave);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [FORM_ID, selectedDate, selectedTime, appointmentMode, symptoms, reasonForVisit, couponCode]);

  // Listen for session expiring event
  useEffect(() => {
    const handleSessionExpiring = () => {
      const dataToSave = {
        selectedDate: selectedDate.toISOString(),
        selectedTime,
        appointmentMode,
        symptoms,
        reasonForVisit,
        couponCode
      };
      sessionManager.saveFormData(FORM_ID, dataToSave);
    };

    window.addEventListener('session-expiring', handleSessionExpiring);

    return () => {
      window.removeEventListener('session-expiring', handleSessionExpiring);
    };
  }, [FORM_ID, selectedDate, selectedTime, appointmentMode, symptoms, reasonForVisit, couponCode]);

  useEffect(() => {
    if (doctorId) {
      loadDoctor();
    }
  }, [doctorId]);

  useEffect(() => {
    if (doctor) {
      generateTimeSlots();
    }
  }, [selectedDate, doctor]);

  const loadDoctor = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, full_name, profile_photo_url, consultation_fee_standard, consultation_fee_followup, currency')
        .eq('id', doctorId)
        .single();

      if (error) throw error;
      setDoctor(data);
    } catch (error) {
      console.error('Error loading doctor:', error);
      toast.error('Failed to load doctor information');
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = async () => {
    if (!doctor) return;

    try {
      const dayOfWeek = selectedDate.getDay();

      // Get doctor's availability for this day
      const { data: availabilityData, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .single();

      if (error || !availabilityData) {
        setTimeSlots([]);
        return;
      }

      const availability = availabilityData as any;

      // Check for existing appointments on this date
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('start_at')
        .eq('doctor_id', doctorId)
        .gte('start_at', startOfDay.toISOString())
        .lte('start_at', endOfDay.toISOString())
        .in('status', ['confirmed', 'pending_payment']);

      const bookedTimes = new Set(
        (existingAppointments || []).map(apt => {
          const date = new Date(apt.start_at);
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        })
      );

      // Generate slots
      const slots: TimeSlot[] = [];
      const [startHour, startMin] = availability.start_time.split(':').map(Number);
      const [endHour, endMin] = availability.end_time.split(':').map(Number);
      const slotDuration = availability.slot_duration_minutes || 30;
      const buffer = availability.buffer_minutes || 10;

      let currentTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      while (currentTime < endTime) {
        const hour = Math.floor(currentTime / 60);
        const minute = currentTime % 60;
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        slots.push({
          time: timeStr,
          available: !bookedTimes.has(timeStr)
        });

        currentTime += slotDuration + buffer;
      }

      setTimeSlots(slots);
    } catch (error) {
      console.error('Error generating slots:', error);
      setTimeSlots([]);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode || !doctor) return;

    try {
      const { data: couponData, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('doctor_id', doctorId)
        .eq('is_active', true)
        .single();

      if (error || !couponData) {
        toast.error('Invalid coupon code');
        return;
      }

      const data = couponData as any;

      // Check validity
      const now = new Date();
      if (new Date(data.valid_from) > now || new Date(data.valid_to) < now) {
        toast.error('Coupon has expired');
        return;
      }

      // Check usage limits
      if (data.max_uses && data.current_uses >= data.max_uses) {
        toast.error('Coupon usage limit reached');
        return;
      }

      // Calculate discount
      const fee = appointmentType === 'followup'
        ? doctor.consultation_fee_followup
        : doctor.consultation_fee_standard;

      const discountAmount = data.discount_type === 'percent'
        ? (fee * data.discount_value) / 100
        : data.discount_value;

      setDiscount(Math.min(discountAmount, fee));
      toast.success(`Coupon applied! You save ${doctor.currency} ${discountAmount.toFixed(2)}`);
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error('Failed to apply coupon');
    }
  };

  const handleBooking = async () => {
    if (!selectedTime || !doctor) {
      toast.error('Please select a time slot');
      return;
    }

    const patientId = localStorage.getItem('patient_id');
    if (!patientId) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    try {
      // Fetch patient details from DB to ensure we have email and phone
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError || !patientData) {
        throw new Error('Could not fetch patient details');
      }

      const [hour, minute] = selectedTime.split(':').map(Number);
      const startAt = new Date(selectedDate);
      startAt.setHours(hour, minute, 0, 0);

      const endAt = new Date(startAt);
      endAt.setMinutes(endAt.getMinutes() + 30);

      const fee = appointmentType === 'followup'
        ? doctor.consultation_fee_followup
        : doctor.consultation_fee_standard;

      const finalPrice = fee - discount;

      // Get tenant_id (required for multi-tenant setup)
      const tenantId = '00000000-0000-0000-0000-000000000001'; // Default tenant for testing

      // Create appointment (FREE for testing - payment disabled)
      const { data: appointment, error: aptError } = await supabase
        .from('appointments')
        .insert({
          tenant_id: tenantId,
          doctor_id: doctorId,
          patient_id: patientId,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          duration_minutes: 30,
          appointment_type: appointmentType,
          status: 'confirmed', // Auto-confirm for testing (no payment required)
          payment_status: 'paid', // Mark as paid for testing
          payment_amount: 0, // Free for testing
          currency: doctor.currency,
          mode: appointmentMode,
          symptoms: symptoms || null,
          reason: reasonForVisit || null,
          booked_by: 'patient'
        } as any) // Type assertion to bypass strict type check for now
        .select()
        .single();

      if (aptError || !appointment) throw aptError || new Error('Failed to create appointment');

      // Prepare meeting link based on appointment mode
      let meetingLink = '';
      if (appointmentMode === 'video') {
        // In a real scenario, this might be a generated room URL
        meetingLink = `https://meet.jit.si/AisurgeonPilot-${(appointment as any).id}`;
      }

      // Send notifications via unified service
      try {
        await notificationService.sendAppointmentConfirmation({
          tenant_id: tenantId,
          patient_id: patientId,
          appointment_id: (appointment as any).id,
          patient_name: `${(patientData as any).first_name} ${(patientData as any).last_name}`,
          patient_email: 'cmd@hopehospital.com', // TEMPORARY: Hardcoded for Resend testing mode
          patient_phone: (patientData as any).phone,
          patient_age: (patientData as any).age,
          patient_gender: (patientData as any).gender,
          doctor_name: doctor.full_name,
          appointment_date: format(selectedDate, 'dd MMM yyyy'),
          appointment_time: format(startAt, 'h:mm a'),
          consultation_type: appointmentMode === 'video' ? 'tele-consult' : appointmentMode === 'in-person' ? 'in-person' : 'home-visit', // Mapping to Service types
          hospital_name: 'AI Surgeon Pilot', // This should ideally come from env or tenant config
          meeting_link: meetingLink,
          chief_complaint: symptoms,
          instructions: 'Please arrive 10 minutes early.',
          // Add dummy clinic info if needed, or better, fetch it
          hospital_address: '123 Health St, Tech Park',
          hospital_city: 'Bangalore',
          hospital_phone: '+91-9999999999'
        });
        console.log('✓ Notifications sent successfully');
      } catch (notifyError) {
        console.error('Notification failed:', notifyError);
        // Don't block flow, just log
      }

      // Clear saved form data on successful booking
      sessionManager.clearSavedFormData(FORM_ID);

      toast.success('Appointment booked successfully!');

      // Go directly to confirmation (no payment required for testing)
      setTimeout(() => {
        navigate(`/appointment/confirm/${(appointment as any).id}`);
      }, 1500);

    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Failed to create appointment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Doctor not found</p>
          <Button onClick={() => navigate('/doctors')}>Back to Directory</Button>
        </div>
      </div>
    );
  }

  const fee = appointmentType === 'followup'
    ? doctor.consultation_fee_followup
    : doctor.consultation_fee_standard;
  const finalPrice = fee - discount;

  // Generate next 14 days starting from today (to show only future dates)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekDays = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/doctor/${doctorId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Doctor Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <img
                    src={doctor.profile_photo_url || 'https://via.placeholder.com/64'}
                    alt={doctor.full_name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <CardTitle>{doctor.full_name}</CardTitle>
                    <CardDescription>
                      {appointmentType === 'followup' ? 'Follow-up' : 'Standard'} Consultation
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Date Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3">Select a date for your appointment (next 14 days)</p>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day) => {
                      const isSelected = isSameDay(day, selectedDate);
                      const isToday = isSameDay(day, new Date());

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={`
                            p-3 rounded-lg text-center transition-colors relative
                            ${isSelected ? 'bg-blue-600 text-white shadow-lg' : 'bg-white hover:bg-blue-50 border hover:border-blue-300'}
                          `}
                        >
                          {isToday && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                          <div className="text-xs font-medium">
                            {format(day, 'EEE')}
                          </div>
                          <div className="text-lg font-bold mt-1">
                            {format(day, 'd')}
                          </div>
                          <div className="text-xs">
                            {format(day, 'MMM')}
                          </div>
                          {isToday && <div className="text-xs mt-1 font-medium">Today</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Select Time
                </CardTitle>
                <CardDescription>
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeSlots.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">
                    No available slots for this day
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`
                          p-3 rounded-lg text-center font-medium transition-colors
                          ${!slot.available ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : ''}
                          ${slot.time === selectedTime ? 'bg-blue-600 text-white' : 'bg-white hover:bg-blue-50 border'}
                        `}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Appointment Mode */}
            <Card>
              <CardHeader>
                <CardTitle>Appointment Mode</CardTitle>
                <CardDescription>How would you like to consult?</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={appointmentMode} onValueChange={(value: any) => setAppointmentMode(value)}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="in-person" id="in-person" />
                      <Label htmlFor="in-person" className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">In-Person Visit</div>
                          <div className="text-sm text-gray-500">Visit the clinic in person</div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="video" id="video" />
                      <Label htmlFor="video" className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Video className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Video Call</div>
                          <div className="text-sm text-gray-500">Consult via video conference</div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="phone" id="phone" />
                      <Label htmlFor="phone" className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Phone className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">Phone Call</div>
                          <div className="text-sm text-gray-500">Consult over the phone</div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {appointmentMode === 'video' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      You'll receive a video link via email before your appointment
                    </p>
                  </div>
                )}
                {appointmentMode === 'phone' && (
                  <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-800">
                      The doctor will call you at your registered phone number
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Symptoms & Reason */}
            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
                <CardDescription>Help the doctor prepare for your consultation (optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="symptoms">Chief Complaint / Symptoms</Label>
                  <Textarea
                    id="symptoms"
                    placeholder="E.g., Persistent headache for 3 days, fever, cough..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="mt-2 min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Reason for Visit</Label>
                  <Textarea
                    id="reason"
                    placeholder="E.g., Follow-up for blood pressure, routine checkup, discuss test results..."
                    value={reasonForVisit}
                    onChange={(e) => setReasonForVisit(e.target.value)}
                    className="mt-2 min-h-[100px]"
                  />
                </div>

                <p className="text-xs text-gray-500">
                  This information helps your doctor prepare better for your consultation
                </p>
              </CardContent>
            </Card>

            {/* Coupon - Hidden for testing */}
            {false && (
              <Card>
                <CardHeader>
                  <CardTitle>Have a Coupon Code?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    />
                    <Button onClick={applyCoupon} variant="outline">
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Consultation Type</div>
                  <div className="font-medium capitalize">{appointmentType}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600">Appointment Mode</div>
                  <div className="font-medium flex items-center gap-2">
                    {appointmentMode === 'in-person' && <><MapPin className="h-4 w-4" /> In-Person</>}
                    {appointmentMode === 'video' && <><Video className="h-4 w-4" /> Video Call</>}
                    {appointmentMode === 'phone' && <><Phone className="h-4 w-4" /> Phone Call</>}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600">Date & Time</div>
                  <div className="font-medium">
                    {selectedTime ? (
                      <>
                        {format(selectedDate, 'MMM d, yyyy')}
                        <br />
                        {selectedTime}
                      </>
                    ) : (
                      'Not selected'
                    )}
                  </div>
                </div>

                {/* Pricing hidden for testing - FREE bookings enabled */}
                <div className="border-t pt-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <Check className="h-5 w-5" />
                      <span className="font-semibold">Free Booking (Testing Mode)</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">No payment required during testing</p>
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                  onClick={handleBooking}
                  disabled={!selectedTime}
                >
                  <Check className="h-5 w-5 mr-2" />
                  Confirm Booking (Free)
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By booking, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
