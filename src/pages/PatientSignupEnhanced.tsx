import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Hospital, Mail, Phone, Lock, User, Calendar, Weight, Ruler, Droplet } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sessionManager } from '@/services/sessionManager';
import { welcomeEmailService } from '@/services/welcomeEmailService';

interface PatientSignupForm {
  // Auth
  email: string;
  password: string;
  confirmPassword: string;

  // Personal
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;

  // Medical (Required)
  age: number;
  gender: 'male' | 'female' | 'other';
  weight_kg: string;
  height_cm: string;
  blood_group: string;
}

const FORM_ID = 'patient-signup-form';

const PatientSignupEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PatientSignupForm>({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    age: 0,
    gender: 'male',
    weight_kg: '',
    height_cm: '',
    blood_group: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PatientSignupForm, string>>>({});

  // Auto-restore saved form data on mount
  useEffect(() => {
    const savedData = sessionManager.getSavedFormData(FORM_ID);
    if (savedData) {
      setFormData(savedData.data as PatientSignupForm);
      toast.info('Your previous work has been restored', {
        description: `Saved ${Math.round((Date.now() - savedData.timestamp) / 60000)} minutes ago`
      });
    }
  }, []);

  // Auto-save form data on change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only save if form has some data
      if (formData.email || formData.first_name || formData.last_name) {
        // Don't save passwords for security
        const dataToSave = { ...formData, password: '', confirmPassword: '' };
        sessionManager.saveFormData(FORM_ID, dataToSave);
      }
    }, 2000); // Save 2 seconds after last change

    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Listen for session expiring event
  useEffect(() => {
    const handleSessionExpiring = () => {
      // Save form data before session expires
      const dataToSave = { ...formData, password: '', confirmPassword: '' };
      sessionManager.saveFormData(FORM_ID, dataToSave);
    };

    window.addEventListener('session-expiring', handleSessionExpiring);

    return () => {
      window.removeEventListener('session-expiring', handleSessionExpiring);
    };
  }, [formData]);

  const handleInputChange = (field: keyof PatientSignupForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleDOBChange = (dob: string) => {
    setFormData(prev => ({ ...prev, date_of_birth: dob }));

    // Calculate age
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      setFormData(prev => ({ ...prev, age }));
    }
  };

  const generatePatientId = (): string => {
    // Format: P + Timestamp (e.g., P1731567890)
    const timestamp = Math.floor(Date.now() / 1000);
    return `P${timestamp}`;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PatientSignupForm, string>> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Personal details
    if (!formData.first_name || formData.first_name.length < 2) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name || formData.last_name.length < 2) {
      newErrors.last_name = 'Last name is required';
    }

    // Phone validation
    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    if (!formData.phone || !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Date of birth
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    }

    // Medical details
    const weight = parseFloat(formData.weight_kg);
    if (!formData.weight_kg || isNaN(weight) || weight < 1 || weight > 300) {
      newErrors.weight_kg = 'Please enter a valid weight (1-300 kg)';
    }

    const height = parseFloat(formData.height_cm);
    if (!formData.height_cm || isNaN(height) || height < 1 || height > 300) {
      newErrors.height_cm = 'Please enter a valid height (1-300 cm)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      // Generate unique patient ID
      const patientId = generatePatientId();

      // 1. Create Supabase Auth user (email confirmation disabled in dashboard)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase(),
        password: formData.password,
        options: {
          data: {
            patient_id: patientId,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('This email is already registered. Please login.');
          navigate('/login');
          return;
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create account');
      }

      // 2. Create patient profile
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          id: authData.user.id, // Link to auth user
          patients_id: patientId, // Display ID
          email: formData.email.toLowerCase(),
          name: `${formData.first_name} ${formData.last_name}`, // Full name
          phone: formData.phone,
          date_of_birth: formData.date_of_birth,
          age: formData.age,
          gender: formData.gender,
          blood_group: formData.blood_group || null,
        })
        .select()
        .single();

      if (patientError) {
        console.error('Patient profile creation error:', patientError);
        console.error('Error details:', JSON.stringify(patientError, null, 2));

        // Note: Cannot use admin API from client side to delete auth user
        // User will need to try signup again or contact support

        throw new Error(
          patientError.message || 'Failed to create patient profile. Please try again or contact support.'
        );
      }

      // 3. Send welcome email (non-blocking - won't fail signup if email fails)
      try {
        await welcomeEmailService.sendWelcomeEmail({
          email: formData.email,
          firstName: formData.first_name,
          lastName: formData.last_name,
          patientId,
        });
      } catch (emailError) {
        console.error('Welcome email failed (non-blocking):', emailError);
        // Don't block signup if email fails
      }

      // 4. Clear saved form data on successful signup
      sessionManager.clearSavedFormData(FORM_ID);

      // 5. Auto-login the user since email confirmation is disabled
      // The user is already authenticated from signUp()

      // Store patient info in localStorage for session
      localStorage.setItem('patient_id', patient.id);
      localStorage.setItem('patient_name', `${formData.first_name} ${formData.last_name}`);
      localStorage.setItem('patient_phone', formData.phone);
      localStorage.setItem('patient_auth', 'true');

      // 6. Show success message
      toast.success('Welcome to AI Surgeon Pilot!', {
        description: `Your account has been created successfully. Patient ID: ${patientId}`
      });

      // 7. Navigate to patient dashboard (user is already logged in)
      setTimeout(() => {
        navigate('/patient-dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error('Signup failed', {
        description: error.message || 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center">
              <Hospital className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            Create Your Patient Account
          </h1>
          <p className="text-gray-600">
            Fill in your details to book appointments with doctors
          </p>
        </div>

        <form onSubmit={handleSignup}>
          {/* Login Credentials */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Login Credentials
              </CardTitle>
              <CardDescription>These will be used to access your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address*</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password*</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    minLength={8}
                  />
                  {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password*</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                  />
                  {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name*</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    required
                    placeholder="John"
                  />
                  {errors.first_name && <p className="text-sm text-red-500 mt-1">{errors.first_name}</p>}
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name*</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    required
                    placeholder="Doe"
                  />
                  {errors.last_name && <p className="text-sm text-red-500 mt-1">{errors.last_name}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number*</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    className="pl-10"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <Label htmlFor="date_of_birth">Date of Birth*</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="date_of_birth"
                    type="date"
                    className="pl-10"
                    value={formData.date_of_birth}
                    onChange={(e) => handleDOBChange(e.target.value)}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>
                {formData.age > 0 && (
                  <p className="text-sm text-gray-600 mt-1">Age: {formData.age} years</p>
                )}
                {errors.date_of_birth && <p className="text-sm text-red-500 mt-1">{errors.date_of_birth}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hospital className="h-5 w-5" />
                Medical Information
              </CardTitle>
              <CardDescription>Required for consultations and prescriptions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Gender*</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other" className="font-normal cursor-pointer">Other</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight_kg">Weight (kg)*</Label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="weight_kg"
                      type="number"
                      className="pl-10"
                      placeholder="70"
                      value={formData.weight_kg}
                      onChange={(e) => handleInputChange('weight_kg', e.target.value)}
                      required
                      min="1"
                      max="300"
                      step="0.1"
                    />
                  </div>
                  {errors.weight_kg && <p className="text-sm text-red-500 mt-1">{errors.weight_kg}</p>}
                </div>

                <div>
                  <Label htmlFor="height_cm">Height (cm)*</Label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="height_cm"
                      type="number"
                      className="pl-10"
                      placeholder="170"
                      value={formData.height_cm}
                      onChange={(e) => handleInputChange('height_cm', e.target.value)}
                      required
                      min="1"
                      max="300"
                    />
                  </div>
                  {errors.height_cm && <p className="text-sm text-red-500 mt-1">{errors.height_cm}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="blood_group">Blood Group (Optional)</Label>
                <div className="relative">
                  <Droplet className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Select
                    value={formData.blood_group}
                    onValueChange={(value) => handleInputChange('blood_group', value)}
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            size="lg"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Login here
            </Link>
          </p>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> After signup, you'll receive a verification email. Please verify your email before booking appointments.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientSignupEnhanced;
