import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Hospital, User, Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react';
import { otpService } from '@/services/otpService';

export const UnifiedLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Staff Login State
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffShowPassword, setStaffShowPassword] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);

  // Patient Login State
  const [patientLoginMethod, setPatientLoginMethod] = useState<'email' | 'phone'>('phone');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientOtp, setPatientOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [patientLoading, setPatientLoading] = useState(false);

  // Staff Login Handler
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!staffEmail || !staffPassword) {
      toast.error('Please enter email and password');
      return;
    }

    setStaffLoading(true);

    try {
      const success = await login({ email: staffEmail, password: staffPassword });

      if (success) {
        toast.success('Login successful!');
        navigate('/');
      } else {
        toast.error('Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
    } finally {
      setStaffLoading(false);
    }
  };

  // Patient OTP Send Handler
  const handleSendOtp = async () => {
    const identifier = patientLoginMethod === 'email' ? patientEmail : patientPhone;

    if (!identifier) {
      toast.error(`Please enter your ${patientLoginMethod}`);
      return;
    }

    setPatientLoading(true);

    try {
      const success = patientLoginMethod === 'email'
        ? await otpService.sendEmailOTP(identifier)
        : await otpService.sendPhoneOTP(identifier);

      if (success) {
        setOtpSent(true);
        toast.success(`OTP sent to your ${patientLoginMethod}`);
      } else {
        toast.error('Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP send error:', error);
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setPatientLoading(false);
    }
  };

  // Patient OTP Verify Handler
  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientOtp) {
      toast.error('Please enter the OTP');
      return;
    }

    setPatientLoading(true);

    try {
      const identifier = patientLoginMethod === 'email' ? patientEmail : patientPhone;
      const result = await otpService.verifyOTP(identifier, patientOtp);

      if (result.success) {
        toast.success('Login successful!');
        // Store patient session
        localStorage.setItem('patient_id', result.userId || '');
        navigate('/patient-portal');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setPatientLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Hospital className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800">
            AI Surgeon Pilot
          </CardTitle>
          <CardDescription className="text-base">
            Your Digital Healthcare Platform
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="staff" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="staff" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Staff Login
              </TabsTrigger>
              <TabsTrigger value="patient" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Patient Login
              </TabsTrigger>
            </TabsList>

            {/* Staff Login Tab */}
            <TabsContent value="staff">
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="staff-email"
                      type="email"
                      placeholder="doctor@hospital.com"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="staff-password"
                      type={staffShowPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setStaffShowPassword(!staffShowPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {staffShowPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-green-600 hover:text-green-700 p-0"
                  >
                    Forgot Password?
                  </Button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={staffLoading}
                >
                  {staffLoading ? 'Signing In...' : 'Sign In as Staff'}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  <p>Demo Credentials:</p>
                  <p className="text-xs">Email: admin@aisurgeonpilot.com</p>
                  <p className="text-xs">Password: admin123</p>
                </div>
              </form>
            </TabsContent>

            {/* Patient Login Tab */}
            <TabsContent value="patient">
              <div className="space-y-4">
                {/* Login Method Selection */}
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant={patientLoginMethod === 'phone' ? 'default' : 'outline'}
                    onClick={() => {
                      setPatientLoginMethod('phone');
                      setOtpSent(false);
                    }}
                    className="flex-1"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Phone
                  </Button>
                  <Button
                    type="button"
                    variant={patientLoginMethod === 'email' ? 'default' : 'outline'}
                    onClick={() => {
                      setPatientLoginMethod('email');
                      setOtpSent(false);
                    }}
                    className="flex-1"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                </div>

                <form onSubmit={handlePatientLogin} className="space-y-4">
                  {/* Phone/Email Input */}
                  {!otpSent && (
                    <>
                      {patientLoginMethod === 'phone' ? (
                        <div className="space-y-2">
                          <Label htmlFor="patient-phone">Mobile Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="patient-phone"
                              type="tel"
                              placeholder="+91 98765 43210"
                              value={patientPhone}
                              onChange={(e) => setPatientPhone(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="patient-email">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="patient-email"
                              type="email"
                              placeholder="patient@example.com"
                              value={patientEmail}
                              onChange={(e) => setPatientEmail(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                      )}

                      <Button
                        type="button"
                        onClick={handleSendOtp}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={patientLoading}
                      >
                        {patientLoading ? 'Sending...' : 'Send OTP'}
                      </Button>
                    </>
                  )}

                  {/* OTP Input */}
                  {otpSent && (
                    <>
                      <div className="text-sm text-gray-600 text-center mb-2">
                        OTP sent to {patientLoginMethod === 'email' ? patientEmail : patientPhone}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="patient-otp">Enter OTP</Label>
                        <Input
                          id="patient-otp"
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={patientOtp}
                          onChange={(e) => setPatientOtp(e.target.value)}
                          maxLength={6}
                          className="text-center text-lg tracking-widest"
                          required
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOtpSent(false)}
                          className="flex-1"
                        >
                          Change Number
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleSendOtp}
                          className="flex-1"
                        >
                          Resend OTP
                        </Button>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={patientLoading}
                      >
                        {patientLoading ? 'Verifying...' : 'Verify & Login'}
                      </Button>
                    </>
                  )}
                </form>

                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">Don't have an account?</p>
                  <Button
                    type="button"
                    variant="link"
                    className="text-blue-600 hover:text-blue-700"
                    onClick={() => navigate('/patient-register')}
                  >
                    Register as New Patient
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedLoginPage;
