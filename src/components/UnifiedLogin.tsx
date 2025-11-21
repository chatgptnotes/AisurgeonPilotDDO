import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Hospital } from 'lucide-react';
import { toast } from 'sonner';
import { TOTPService } from '@/services/totpService';
import { TOTPVerify } from '@/components/auth/TOTPVerify';

const UnifiedLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Staff login state
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  // Patient login state
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPassword, setPatientPassword] = useState('');
  const [showPatientPassword, setShowPatientPassword] = useState(false);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);

  // Doctor login state
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');
  const [showDoctorPassword, setShowDoctorPassword] = useState(false);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorError, setDoctorError] = useState<string | null>(null);

  // TOTP verification state
  const [showTOTPVerify, setShowTOTPVerify] = useState(false);
  const [totpUserId, setTotpUserId] = useState<string>('');
  const [totpUserRole, setTotpUserRole] = useState<'doctor' | 'staff'>('doctor');
  const [pendingDoctorData, setPendingDoctorData] = useState<any>(null);

  // Generate device fingerprint for trusted device functionality
  const getDeviceFingerprint = (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Hello', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('World', 4, 17);
    }
    const canvasData = canvas.toDataURL();
    const screenInfo = `${screen.width}x${screen.height}x${screen.colorDepth}`;
    const navigatorInfo = `${navigator.userAgent}${navigator.language}${navigator.platform}`;
    const combined = `${canvasData}${screenInfo}${navigatorInfo}`;

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!staffEmail || !staffPassword) {
      setStaffError('Please enter both email and password');
      return;
    }

    setStaffLoading(true);
    setStaffError(null);

    try {
      const success = await login({
        email: staffEmail,
        password: staffPassword
      });

      if (success) {
        toast.success('Login successful!');
        // Auth context will redirect automatically
      } else {
        setStaffError('Invalid email or password');
      }
    } catch (err) {
      setStaffError('Login failed. Please try again.');
    } finally {
      setStaffLoading(false);
    }
  };

  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientEmail || !patientPassword) {
      setPatientError('Please enter both email and password');
      return;
    }

    setPatientLoading(true);
    setPatientError(null);

    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: patientEmail.toLowerCase(),
        password: patientPassword
      });

      if (error || !data.user) {
        setPatientError('Invalid credentials. Please check your email and password.');
        return;
      }

      // Find patient by email
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('email', patientEmail.toLowerCase())
        .single();

      if (patientError || !patient) {
        setPatientError('Patient profile not found. Please register first.');
        await supabase.auth.signOut();
        return;
      }

      // Store patient_id for the session
      localStorage.setItem('patient_id', patient.id);
      localStorage.setItem('patient_name', `${patient.first_name} ${patient.last_name}`);
      localStorage.setItem('patient_phone', patient.phone);
      localStorage.setItem('patient_auth', 'true');

      toast.success('Login successful!');

      // Check if there's a return URL from session timeout
      const returnUrl = localStorage.getItem('returnUrl');
      if (returnUrl) {
        localStorage.removeItem('returnUrl');
        navigate(returnUrl);
      } else {
        navigate('/patient-dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setPatientError('An error occurred during login');
    } finally {
      setPatientLoading(false);
    }
  };

  const handleDoctorLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!doctorEmail || !doctorPassword) {
      setDoctorError('Please enter both email and password');
      return;
    }

    setDoctorLoading(true);
    setDoctorError(null);

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: doctorEmail.toLowerCase(),
        password: doctorPassword
      });

      if (authError || !authData.user) {
        console.error('Auth error:', authError);
        setDoctorError('Invalid credentials. Please check your email and password.');
        return;
      }

      console.log('Auth successful, user ID:', authData.user.id);

      // Find doctor by email first (more reliable)
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id, full_name, email, profile_photo_url, specialties, user_id')
        .eq('email', doctorEmail.toLowerCase())
        .single();

      if (doctorError || !doctor) {
        console.error('Doctor lookup error:', doctorError);
        setDoctorError('Doctor profile not found. Please contact administrator.');
        await supabase.auth.signOut();
        return;
      }

      console.log('Doctor found:', doctor.full_name, 'Doctor user_id:', doctor.user_id);

      // Check if user requires 2FA
      const requires2FA = await TOTPService.requiresTOTP(authData.user.id);

      if (requires2FA) {
        // Check if device is trusted
        const deviceFingerprint = getDeviceFingerprint();
        const isTrusted = await TOTPService.isTrustedDevice(authData.user.id, deviceFingerprint);

        if (!isTrusted) {
          // Show TOTP verification screen
          setTotpUserId(authData.user.id);
          setTotpUserRole('doctor');
          setPendingDoctorData(doctor);
          setShowTOTPVerify(true);
          setDoctorLoading(false);
          return;
        }
      }

      // Complete login (no 2FA or trusted device)
      completeDoctorLogin(doctor, authData.user.id);
    } catch (error) {
      console.error('Doctor login error:', error);
      setDoctorError('An error occurred during login');
    } finally {
      setDoctorLoading(false);
    }
  };

  const completeDoctorLogin = (doctor: any, userId: string) => {
    // Store doctor info
    localStorage.setItem('doctor_id', doctor.id);
    localStorage.setItem('doctor_name', doctor.full_name);
    localStorage.setItem('doctor_email', doctor.email);
    localStorage.setItem('user_id', userId);
    localStorage.setItem('user_role', 'doctor');

    toast.success(`Welcome back, ${doctor.full_name}!`);

    // Check if there's a return URL from session timeout
    const returnUrl = localStorage.getItem('returnUrl');
    if (returnUrl) {
      localStorage.removeItem('returnUrl');
      navigate(returnUrl);
    } else {
      navigate('/doctor/dashboard');
    }
  };

  const handleTOTPSuccess = () => {
    // TOTP verified successfully, complete login
    if (totpUserRole === 'doctor' && pendingDoctorData) {
      completeDoctorLogin(pendingDoctorData, totpUserId);
    } else {
      // Staff login completion would go here
      toast.success('Login successful!');
      navigate('/dashboard');
    }
    setShowTOTPVerify(false);
  };

  const handleTOTPCancel = async () => {
    // User cancelled TOTP verification, sign them out
    await supabase.auth.signOut();
    setShowTOTPVerify(false);
    setTotpUserId('');
    setPendingDoctorData(null);
    setDoctorError('Authentication cancelled');
    toast.info('Authentication cancelled');
  };

  // If showing TOTP verification, render that instead
  if (showTOTPVerify) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-6">
            <TOTPVerify
              userId={totpUserId}
              onSuccess={handleTOTPSuccess}
              onCancel={handleTOTPCancel}
              deviceFingerprint={getDeviceFingerprint()}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center">
              <Hospital className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            AI Surgeon Pilot
          </CardTitle>
          <CardDescription className="text-base">
            Your Digital Healthcare Platform
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="doctor" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="doctor" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Doctor
              </TabsTrigger>
              <TabsTrigger value="patient" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Patient
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex items-center gap-2">
                <Hospital className="h-4 w-4" />
                Staff
              </TabsTrigger>
            </TabsList>

            {/* Doctor Login Tab */}
            <TabsContent value="doctor">
              <form onSubmit={handleDoctorLogin} className="space-y-4">
                {doctorError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">{doctorError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="doctor-email">Email</Label>
                  <Input
                    id="doctor-email"
                    type="email"
                    value={doctorEmail}
                    onChange={(e) => {
                      setDoctorEmail(e.target.value);
                      setDoctorError(null);
                    }}
                    placeholder="doctor@aisurgeonpilot.com"
                    required
                    disabled={doctorLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctor-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="doctor-password"
                      type={showDoctorPassword ? 'text' : 'password'}
                      value={doctorPassword}
                      onChange={(e) => {
                        setDoctorPassword(e.target.value);
                        setDoctorError(null);
                      }}
                      placeholder="Enter your password"
                      required
                      disabled={doctorLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowDoctorPassword(!showDoctorPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={doctorLoading}
                    >
                      {showDoctorPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={doctorLoading}
                >
                  {doctorLoading ? 'Signing In...' : 'Sign In as Doctor'}
                </Button>

                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="font-semibold text-green-900">Dr. Priya Sharma:</p>
                    <p><span className="font-medium">Email:</span> priya.sharma@aisurgeonpilot.com</p>
                    <p><span className="font-medium">Password:</span> Doctor@123</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDoctorEmail('priya.sharma@aisurgeonpilot.com');
                      setDoctorPassword('Doctor@123');
                    }}
                    className="w-full mt-2 text-xs text-green-600 hover:text-green-700 font-medium hover:underline"
                  >
                    Click to auto-fill
                  </button>
                </div>
              </form>
            </TabsContent>

            {/* Staff Login Tab */}
            <TabsContent value="staff">
              <form onSubmit={handleStaffLogin} className="space-y-4">
                {staffError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">{staffError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="staff-email">Email</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    value={staffEmail}
                    onChange={(e) => {
                      setStaffEmail(e.target.value);
                      setStaffError(null);
                    }}
                    placeholder="staff@hospital.com"
                    required
                    disabled={staffLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="staff-password"
                      type={showStaffPassword ? 'text' : 'password'}
                      value={staffPassword}
                      onChange={(e) => {
                        setStaffPassword(e.target.value);
                        setStaffError(null);
                      }}
                      placeholder="Enter your password"
                      required
                      disabled={staffLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={staffLoading}
                    >
                      {showStaffPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={staffLoading}
                >
                  {staffLoading ? 'Signing In...' : 'Sign In as Staff'}
                </Button>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="font-semibold text-blue-900">Demo Credentials:</p>
                    <p><span className="font-medium">Email:</span> admin@aisurgeonpilot.com</p>
                    <p><span className="font-medium">Password:</span> Admin@123</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStaffEmail('admin@aisurgeonpilot.com');
                      setStaffPassword('Admin@123');
                    }}
                    className="w-full mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    Click to auto-fill
                  </button>
                </div>
              </form>
            </TabsContent>

            {/* Patient Login Tab */}
            <TabsContent value="patient">
              <form onSubmit={handlePatientLogin} className="space-y-4">
                {patientError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">{patientError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="patient-email">Email</Label>
                  <Input
                    id="patient-email"
                    type="email"
                    value={patientEmail}
                    onChange={(e) => {
                      setPatientEmail(e.target.value);
                      setPatientError(null);
                    }}
                    placeholder="patient@example.com"
                    required
                    disabled={patientLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patient-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="patient-password"
                      type={showPatientPassword ? 'text' : 'password'}
                      value={patientPassword}
                      onChange={(e) => {
                        setPatientPassword(e.target.value);
                        setPatientError(null);
                      }}
                      placeholder="Enter your password"
                      required
                      disabled={patientLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPatientPassword(!showPatientPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={patientLoading}
                    >
                      {showPatientPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={patientLoading}
                >
                  {patientLoading ? 'Signing In...' : 'Sign In as Patient'}
                </Button>

                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <a
                      href="/patient-signup"
                      className="text-green-600 hover:text-green-700 font-medium hover:underline"
                    >
                      Sign Up
                    </a>
                  </p>
                </div>

                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="font-semibold text-green-900">Test Credentials:</p>
                    <p><span className="font-medium">Email:</span> patient@test.com</p>
                    <p><span className="font-medium">Password:</span> patient123</p>
                    <p className="text-xs text-gray-500 mt-2 italic">
                      (Create this user in Supabase first)
                    </p>
                  </div>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="text-center">
          <p className="text-xs text-gray-500 w-full">
            For support, contact admin@aisurgeonpilot.com
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UnifiedLogin;
