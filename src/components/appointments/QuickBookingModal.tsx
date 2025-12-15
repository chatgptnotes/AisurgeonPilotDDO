import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock, User, Phone, Mail, Video, MapPin, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { whatsappService } from '@/services/whatsappService';
import { emailService } from '@/services/emailService';
import { useTenant } from '@/contexts/TenantContext';

interface Props {
  doctorId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuickBookingModal({ doctorId, open, onClose, onSuccess }: Props) {
  const { currentTenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);

  // Patient form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Appointment fields
  const [appointmentDate, setAppointmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [appointmentTime, setAppointmentTime] = useState(format(new Date(), 'HH:mm'));
  const [duration, setDuration] = useState('30');
  const [mode, setMode] = useState('in-person');
  const [symptoms, setSymptoms] = useState('');
  const [reason, setReason] = useState('');

  const handleSearchPatient = async () => {
    if (!searchPhone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('phone', searchPhone.trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Patient not found
          setShowNewPatientForm(true);
          setPhone(searchPhone.trim());
          toast.info('Patient not found. Please create a new patient.');
        } else {
          throw error;
        }
      } else {
        setSelectedPatient(data);
        setShowNewPatientForm(false);
        toast.success('Patient found!');
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      toast.error('Failed to search patient');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async () => {
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      toast.error('Please fill in required fields (name and phone)');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          date_of_birth: dateOfBirth || null,
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedPatient(data);
      setShowNewPatientForm(false);
      toast.success('Patient created successfully!');
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error('Failed to create patient');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedPatient) {
      toast.error('Please select or create a patient first');
      return;
    }

    if (!appointmentDate || !appointmentTime) {
      toast.error('Please select date and time');
      return;
    }

    setLoading(true);
    try {
      // Create start and end times
      const [hours, minutes] = appointmentTime.split(':');
      const startAt = new Date(appointmentDate);
      startAt.setHours(parseInt(hours), parseInt(minutes), 0);

      const endAt = new Date(startAt);
      endAt.setMinutes(endAt.getMinutes() + parseInt(duration));

      // Get doctor meeting link if video consultation
      let meetingLink = '';
      if (mode === 'video') {
        const { data: doctorData } = await supabase
          .from('doctors')
          .select('zoom_meeting_link, zoom_password')
          .eq('id', doctorId)
          .single();

        meetingLink = doctorData?.zoom_meeting_link || '';
      }

      // Calculate duration in minutes
      const durationMinutes = Math.round((endAt.getTime() - startAt.getTime()) / (1000 * 60));

      // Get tenant_id from context or doctor's tenant
      let tenantId = currentTenant?.id;
      if (!tenantId) {
        // Fallback: get tenant_id from doctor
        const { data: doctorTenantData } = await supabase
          .from('doctors')
          .select('tenant_id')
          .eq('id', doctorId)
          .single();
        tenantId = doctorTenantData?.tenant_id;
      }

      // Create appointment with 'scheduled' status - doctor must confirm manually
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          doctor_id: doctorId,
          patient_id: selectedPatient.id,
          tenant_id: tenantId,
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          appointment_date: format(startAt, 'yyyy-MM-dd'),
          duration_minutes: durationMinutes,
          appointment_type: mode === 'video' ? 'video_consultation' : 'in_person',
          status: 'scheduled', // Changed from 'confirmed' - requires doctor confirmation
          mode,
          symptoms: symptoms.trim() || null,
          reason: reason.trim() || null,
          meeting_link: meetingLink || null,
          booked_by: 'staff', // Indicates this was booked by staff via QuickBookingModal
        })
        .select()
        .single();

      if (error) throw error;

      // Get doctor name
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('full_name')
        .eq('id', doctorId)
        .single();

      const doctorName = doctorData?.full_name || 'Doctor';

      // Send WhatsApp notification to patient
      try {
        const location = mode === 'video'
          ? 'Video Consultation'
          : currentTenant?.address || 'Visit our clinic';

        await whatsappService.sendAppointmentConfirmation(
          selectedPatient.name,                          // patientName
          selectedPatient.phone,                         // phone
          format(startAt, 'dd MMM yyyy'),               // date
          format(startAt, 'hh:mm a'),                   // time
          doctorName,                                    // doctorName
          currentTenant?.name || 'AI Surgeon Pilot',    // clinicName
          location,                                      // location
          meetingLink || 'N/A'                          // meetingLink
        );
        console.log('[WhatsApp] Appointment confirmation sent');
      } catch (whatsappError) {
        console.error('[WhatsApp] Failed to send:', whatsappError);
        // Don't block appointment creation if WhatsApp fails
      }

      // Send Email notification to patient (if email exists)
      if (selectedPatient.email && appointment) {
        try {
          await emailService.sendAppointmentConfirmation({
            tenant_id: tenantId || '',
            patient_id: selectedPatient.id,
            appointment_id: appointment.id,
            patient_name: selectedPatient.name,
            patient_email: selectedPatient.email,
            appointment_date: format(startAt, 'dd MMM yyyy'),
            appointment_time: format(startAt, 'hh:mm a'),
            doctor_name: doctorName,
            hospital_name: currentTenant?.name || 'AI Surgeon Pilot',
            consultation_mode: mode === 'video' ? 'video' : 'in_person',
            meeting_link: meetingLink || undefined,
          });
          console.log('[Email] Appointment confirmation sent');
        } catch (emailError) {
          console.error('[Email] Failed to send:', emailError);
          // Don't block appointment creation if email fails
        }
      }

      toast.success('Appointment booked! WhatsApp & Email sent to patient.');
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSearchPhone('');
    setSelectedPatient(null);
    setShowNewPatientForm(false);
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setDateOfBirth('');
    setAppointmentDate(format(new Date(), 'yyyy-MM-dd'));
    setAppointmentTime(format(new Date(), 'HH:mm'));
    setDuration('30');
    setMode('in-person');
    setSymptoms('');
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Book Appointment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Search */}
          {!selectedPatient && !showNewPatientForm && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Find Patient</h3>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="search-phone">Phone Number</Label>
                  <Input
                    id="search-phone"
                    type="tel"
                    placeholder="Enter patient's phone number"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchPatient()}
                  />
                </div>
                <Button
                  onClick={handleSearchPatient}
                  disabled={loading || !searchPhone.trim()}
                  className="mt-6"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewPatientForm(true);
                  setPhone(searchPhone);
                }}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Patient
              </Button>
            </div>
          )}

          {/* New Patient Form */}
          {showNewPatientForm && !selectedPatient && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">New Patient Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first-name">First Name *</Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="last-name">Last Name *</Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewPatientForm(false);
                    setFirstName('');
                    setLastName('');
                    setPhone('');
                    setEmail('');
                    setDateOfBirth('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreatePatient} disabled={loading}>
                  Create Patient
                </Button>
              </div>
            </div>
          )}

          {/* Selected Patient Info */}
          {selectedPatient && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900">
                    {selectedPatient.name}
                  </h3>
                  <p className="text-sm text-green-700">{selectedPatient.phone}</p>
                  {selectedPatient.email && (
                    <p className="text-sm text-green-700">{selectedPatient.email}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedPatient(null);
                    setShowNewPatientForm(false);
                  }}
                >
                  Change
                </Button>
              </div>
            </div>
          )}

          {/* Appointment Details */}
          {selectedPatient && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Appointment Details</h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="apt-date">Date</Label>
                  <Input
                    id="apt-date"
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <div>
                  <Label htmlFor="apt-time">Time</Label>
                  <Input
                    id="apt-time"
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="mode">Consultation Mode</Label>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-person">In-Person</SelectItem>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="symptoms">Symptoms</Label>
                <Textarea
                  id="symptoms"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Brief description of symptoms..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="reason">Reason for Visit</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Follow-up, Routine checkup..."
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onClose(); }}>
            Cancel
          </Button>
          {selectedPatient && (
            <Button onClick={handleBookAppointment} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
