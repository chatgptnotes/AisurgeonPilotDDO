import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Phone, MapPin, Calendar, Heart, FileText, ArrowLeft } from 'lucide-react';

interface PatientFormData {
  // Personal Information
  name: string;
  date_of_birth: string;
  age: number;
  gender: string;
  blood_group: string;

  // Contact Information
  phone: string;
  email: string;
  address: string;
  city_town: string;
  state: string;
  pin_code: string;

  // Emergency Contact
  emergency_contact_name: string;
  emergency_contact_mobile: string;

  // Medical Information
  allergies: string;
  current_medications: string;
  medical_history: string;

  // Visit Information
  reason_for_visit: string;
  preferred_appointment_date: string;
  preferred_time_slot: string;
}

export const PatientSelfRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    date_of_birth: '',
    age: 0,
    gender: '',
    blood_group: '',
    phone: '',
    email: '',
    address: '',
    city_town: '',
    state: '',
    pin_code: '',
    emergency_contact_name: '',
    emergency_contact_mobile: '',
    allergies: '',
    current_medications: '',
    medical_history: '',
    reason_for_visit: '',
    preferred_appointment_date: '',
    preferred_time_slot: ''
  });

  const handleInputChange = (field: keyof PatientFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Calculate age from date of birth
    if (field === 'date_of_birth' && value) {
      const dob = new Date(value as string);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      setFormData(prev => ({ ...prev, age }));
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.name || !formData.date_of_birth || !formData.gender) {
          toast.error('Please fill all required personal information fields');
          return false;
        }
        break;
      case 2:
        if (!formData.phone || !formData.email || !formData.address) {
          toast.error('Please fill all required contact information fields');
          return false;
        }
        // Validate phone number
        if (!/^\+?[1-9]\d{9,14}$/.test(formData.phone.replace(/\s/g, ''))) {
          toast.error('Please enter a valid phone number');
          return false;
        }
        // Validate email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          toast.error('Please enter a valid email address');
          return false;
        }
        break;
      case 3:
        if (!formData.emergency_contact_name || !formData.emergency_contact_mobile) {
          toast.error('Please fill emergency contact information');
          return false;
        }
        break;
      case 4:
        if (!formData.reason_for_visit) {
          toast.error('Please enter the reason for your visit');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(4)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Select tenant based on hospital selection
      // For now, use the first tenant (Hope Hospital)
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', 'hope')
        .single();

      if (!tenants) {
        toast.error('Hospital not found. Please contact support.');
        setIsSubmitting(false);
        return;
      }

      // Insert patient
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert([
          {
            tenant_id: tenants.id,
            name: formData.name,
            date_of_birth: formData.date_of_birth,
            age: formData.age,
            gender: formData.gender,
            blood_group: formData.blood_group,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            city_town: formData.city_town,
            state: formData.state,
            pin_code: formData.pin_code,
            emergency_contact_name: formData.emergency_contact_name,
            emergency_contact_mobile: formData.emergency_contact_mobile,
            allergies: formData.allergies || null,
            hospital_name: 'hope' // TODO: Make this dynamic
          }
        ])
        .select()
        .single();

      if (patientError) {
        console.error('Patient creation error:', patientError);
        toast.error('Failed to register. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Create appointment if preferred date is selected
      if (formData.preferred_appointment_date && patient) {
        const appointmentDateTime = new Date(formData.preferred_appointment_date);
        if (formData.preferred_time_slot) {
          const [hours, minutes] = formData.preferred_time_slot.split(':');
          appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));
        }

        await supabase
          .from('appointments')
          .insert([
            {
              tenant_id: tenants.id,
              patient_id: patient.id,
              appointment_date: appointmentDateTime.toISOString(),
              appointment_type: 'opd',
              consultation_mode: 'in_person',
              status: 'scheduled',
              reason: formData.reason_for_visit,
              booking_source: 'patient_portal',
              payment_required: true,
              payment_amount: 500.00 // Default consultation fee
            }
          ]);
      }

      // TODO: Send confirmation email and WhatsApp message

      toast.success('Registration successful! We will contact you shortly.');
      setCurrentStep(5);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred during registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/login')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Button>

        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-800 text-center">
              Patient Registration
            </CardTitle>
            <CardDescription className="text-center text-base">
              Step {currentStep} of 4
            </CardDescription>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </CardHeader>

          <CardContent>
            {currentStep < 5 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <User className="h-5 w-5 text-green-600" />
                      Personal Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth *</Label>
                        <Input
                          id="dob"
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          value={formData.age || ''}
                          disabled
                          placeholder="Auto-calculated"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender *</Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(value) => handleInputChange('gender', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="blood_group">Blood Group</Label>
                        <Select
                          value={formData.blood_group}
                          onValueChange={(value) => handleInputChange('blood_group', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select blood group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A-">A-</SelectItem>
                            <SelectItem value="B+">B+</SelectItem>
                            <SelectItem value="B-">B-</SelectItem>
                            <SelectItem value="AB+">AB+</SelectItem>
                            <SelectItem value="AB-">AB-</SelectItem>
                            <SelectItem value="O+">O+</SelectItem>
                            <SelectItem value="O-">O-</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Contact Information */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-green-600" />
                      Contact Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Mobile Number *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="+91 98765 43210"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="your@email.com"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Address *</Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Enter your full address"
                          rows={3}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={formData.city_town}
                          onChange={(e) => handleInputChange('city_town', e.target.value)}
                          placeholder="City"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          placeholder="State"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pin_code">PIN Code</Label>
                        <Input
                          id="pin_code"
                          value={formData.pin_code}
                          onChange={(e) => handleInputChange('pin_code', e.target.value)}
                          placeholder="PIN Code"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Emergency Contact & Medical History */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Phone className="h-5 w-5 text-green-600" />
                        Emergency Contact
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="emergency_name">Contact Name *</Label>
                          <Input
                            id="emergency_name"
                            value={formData.emergency_contact_name}
                            onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                            placeholder="Emergency contact name"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="emergency_mobile">Contact Mobile *</Label>
                          <Input
                            id="emergency_mobile"
                            type="tel"
                            value={formData.emergency_contact_mobile}
                            onChange={(e) => handleInputChange('emergency_contact_mobile', e.target.value)}
                            placeholder="+91 98765 43210"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Heart className="h-5 w-5 text-green-600" />
                        Medical History
                      </h3>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="allergies">Allergies (if any)</Label>
                          <Textarea
                            id="allergies"
                            value={formData.allergies}
                            onChange={(e) => handleInputChange('allergies', e.target.value)}
                            placeholder="List any allergies to medications, foods, etc."
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="current_medications">Current Medications</Label>
                          <Textarea
                            id="current_medications"
                            value={formData.current_medications}
                            onChange={(e) => handleInputChange('current_medications', e.target.value)}
                            placeholder="List any medications you are currently taking"
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="medical_history">Medical History</Label>
                          <Textarea
                            id="medical_history"
                            value={formData.medical_history}
                            onChange={(e) => handleInputChange('medical_history', e.target.value)}
                            placeholder="Any past surgeries, chronic conditions, etc."
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Appointment Details */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      Appointment Details
                    </h3>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Visit *</Label>
                        <Textarea
                          id="reason"
                          value={formData.reason_for_visit}
                          onChange={(e) => handleInputChange('reason_for_visit', e.target.value)}
                          placeholder="Please describe your symptoms or reason for visit"
                          rows={4}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="preferred_date">Preferred Appointment Date</Label>
                          <Input
                            id="preferred_date"
                            type="date"
                            value={formData.preferred_appointment_date}
                            onChange={(e) => handleInputChange('preferred_appointment_date', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="preferred_time">Preferred Time Slot</Label>
                          <Select
                            value={formData.preferred_time_slot}
                            onValueChange={(value) => handleInputChange('preferred_time_slot', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="09:00">09:00 AM</SelectItem>
                              <SelectItem value="10:00">10:00 AM</SelectItem>
                              <SelectItem value="11:00">11:00 AM</SelectItem>
                              <SelectItem value="12:00">12:00 PM</SelectItem>
                              <SelectItem value="14:00">02:00 PM</SelectItem>
                              <SelectItem value="15:00">03:00 PM</SelectItem>
                              <SelectItem value="16:00">04:00 PM</SelectItem>
                              <SelectItem value="17:00">05:00 PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> Your appointment is subject to availability.
                          Our staff will contact you to confirm the appointment and share payment details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                    >
                      Previous
                    </Button>
                  )}

                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="ml-auto bg-green-600 hover:bg-green-700"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="ml-auto bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? 'Submitting...' : 'Complete Registration'}
                    </Button>
                  )}
                </div>
              </form>
            )}

            {/* Success Message */}
            {currentStep === 5 && (
              <div className="text-center py-8 space-y-6">
                <div className="flex justify-center">
                  <div className="bg-green-100 rounded-full p-6">
                    <FileText className="h-16 w-16 text-green-600" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-800">
                    Registration Successful!
                  </h3>
                  <p className="text-gray-600">
                    Thank you for registering. We have received your information.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-left">
                  <h4 className="font-semibold text-green-800 mb-2">What's Next?</h4>
                  <ul className="space-y-2 text-sm text-green-700">
                    <li>✓ You will receive a confirmation email and WhatsApp message shortly</li>
                    <li>✓ Our staff will contact you to confirm your appointment</li>
                    <li>✓ Payment details will be shared with you</li>
                    <li>✓ You can now log in to the patient portal to track your appointment</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Go to Login
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentStep(1);
                      setFormData({
                        name: '',
                        date_of_birth: '',
                        age: 0,
                        gender: '',
                        blood_group: '',
                        phone: '',
                        email: '',
                        address: '',
                        city_town: '',
                        state: '',
                        pin_code: '',
                        emergency_contact_name: '',
                        emergency_contact_mobile: '',
                        allergies: '',
                        current_medications: '',
                        medical_history: '',
                        reason_for_visit: '',
                        preferred_appointment_date: '',
                        preferred_time_slot: ''
                      });
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Register Another Patient
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientSelfRegistration;
