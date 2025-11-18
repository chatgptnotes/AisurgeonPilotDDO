import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Mail, CheckCircle, XCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [resending, setResending] = useState(false);

  const email = location.state?.email || '';
  const patientId = location.state?.patientId || '';
  const message = location.state?.message || '';

  // Check for verification token in URL (from email link)
  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    // Auto-verify if token is present in URL
    if (token && type === 'email') {
      verifyEmailToken();
    }
  }, [token, type]);

  const verifyEmailToken = async () => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token!,
        type: 'email'
      });

      if (error) throw error;

      if (data.user) {
        // Update patient profile to mark email as verified
        await supabase
          .from('patients')
          .update({
            email_verified: true,
            email_verified_at: new Date().toISOString()
          })
          .eq('id', data.user.id);

        setVerificationStatus('success');
        toast.success('Email verified successfully!');

        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { state: { email, message: 'Email verified! Please login to continue.' } });
        }, 3000);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      toast.error('Verification failed', {
        description: error.message || 'Please try again or request a new verification email.'
      });
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Email address not found. Please sign up again.');
      navigate('/patient-signup');
      return;
    }

    setResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (error) throw error;

      toast.success('Verification email sent!', {
        description: 'Please check your inbox and spam folder.'
      });
    } catch (error: any) {
      console.error('Resend error:', error);
      toast.error('Failed to resend email', {
        description: error.message || 'Please try again later.'
      });
    } finally {
      setResending(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login', { state: { email } });
  };

  // Render based on verification status
  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Email Verified!</CardTitle>
            <CardDescription>
              Your email has been successfully verified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {patientId && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-900">
                  <strong>Your Patient ID:</strong> {patientId}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Please save this ID for future reference
                </p>
              </div>
            )}

            <p className="text-center text-gray-600">
              Redirecting to login page...
            </p>

            <Button
              onClick={handleGoToLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600"
            >
              Go to Login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">Verification Failed</CardTitle>
            <CardDescription>
              We couldn't verify your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-900">
                The verification link may have expired or is invalid.
              </p>
            </div>

            <Button
              onClick={handleResendEmail}
              disabled={resending}
              className="w-full"
              variant="outline"
            >
              {resending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <Button
              onClick={handleGoToLogin}
              variant="ghost"
              className="w-full"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: Pending verification
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to your email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 text-center">
                <strong>{email}</strong>
              </p>
            </div>
          )}

          {patientId && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">
                <strong>Your Patient ID:</strong> {patientId}
              </p>
              <p className="text-xs text-green-700 mt-1">
                Please save this ID for future reference
              </p>
            </div>
          )}

          {message && (
            <p className="text-center text-gray-600 text-sm">
              {message}
            </p>
          )}

          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Next steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>You'll be redirected to login automatically</li>
              </ol>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-3 text-center">
              Didn't receive the email?
            </p>
            <Button
              onClick={handleResendEmail}
              disabled={resending}
              variant="outline"
              className="w-full"
            >
              {resending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>
          </div>

          <Button
            onClick={handleGoToLogin}
            variant="ghost"
            className="w-full"
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
