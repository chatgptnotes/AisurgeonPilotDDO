import { useState } from 'react';
import { emailService } from '@/services/emailService';

export default function WelcomeEmailTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Test data
  const testPatient = {
    tenant_id: '00000000-0000-0000-0000-000000000001',
    patient_id: 'test-patient-id-123',
    patient_name: 'Kirtan Rajesh',
    patient_email: 'kirtanrajesh@gmail.com',
    hospital_name: 'AI Surgeon Pilot Hospital'
  };

  const testDoctor = {
    tenant_id: '00000000-0000-0000-0000-000000000001',
    doctor_id: 'test-doctor-id-456',
    doctor_name: 'Dr. Priya Sharma',
    doctor_email: 'priya.sharma@aisurgeonpilot.com',
    hospital_name: 'AI Surgeon Pilot Hospital',
    specialties: ['Cardiology', 'Internal Medicine']
  };

  const sendPatientWelcome = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Sending patient welcome email:', testPatient);
      const success = await emailService.sendPatientWelcomeEmail(testPatient);

      if (success) {
        setResult({
          success: true,
          message: `Welcome email sent successfully to ${testPatient.patient_email}`
        });
      } else {
        setResult({
          success: false,
          message: 'Failed to send welcome email. Check console for details.'
        });
      }
    } catch (error) {
      console.error('Error sending patient welcome email:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendDoctorWelcome = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Sending doctor welcome email:', testDoctor);
      const success = await emailService.sendDoctorWelcomeEmail(testDoctor);

      if (success) {
        setResult({
          success: true,
          message: `Welcome email sent successfully to ${testDoctor.doctor_email}`
        });
      } else {
        setResult({
          success: false,
          message: 'Failed to send welcome email. Check console for details.'
        });
      }
    } catch (error) {
      console.error('Error sending doctor welcome email:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Email Testing
          </h1>
          <p className="text-gray-600 mb-8">
            Test the welcome email functionality for patient and doctor registrations
          </p>

          {/* Configuration Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">📧 Email Configuration</h3>
            <p className="text-sm text-blue-800 mb-2">
              Emails are sent using Resend API. Make sure you have configured:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>VITE_RESEND_API_KEY in your .env file</li>
              <li>VITE_FROM_EMAIL (optional, defaults to noreply@aisurgeonpilot.com)</li>
            </ul>
          </div>

          {/* Test Buttons */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Patient Welcome Email */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Patient Welcome Email
              </h2>
              <div className="bg-gray-50 rounded p-4 mb-4 text-sm">
                <p className="font-medium text-gray-700 mb-2">Test Data:</p>
                <p><strong>Name:</strong> {testPatient.patient_name}</p>
                <p><strong>Email:</strong> {testPatient.patient_email}</p>
                <p><strong>Hospital:</strong> {testPatient.hospital_name}</p>
              </div>
              <button
                onClick={sendPatientWelcome}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Sending...' : 'Send Patient Welcome Email'}
              </button>
            </div>

            {/* Doctor Welcome Email */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Doctor Welcome Email
              </h2>
              <div className="bg-gray-50 rounded p-4 mb-4 text-sm">
                <p className="font-medium text-gray-700 mb-2">Test Data:</p>
                <p><strong>Name:</strong> {testDoctor.doctor_name}</p>
                <p><strong>Email:</strong> {testDoctor.doctor_email}</p>
                <p><strong>Specialties:</strong> {testDoctor.specialties.join(', ')}</p>
                <p><strong>Hospital:</strong> {testDoctor.hospital_name}</p>
              </div>
              <button
                onClick={sendDoctorWelcome}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Sending...' : 'Send Doctor Welcome Email'}
              </button>
            </div>
          </div>

          {/* Result Display */}
          {result && (
            <div
              className={`rounded-lg p-4 mb-6 ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <h3
                className={`font-semibold mb-2 ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {result.success ? '✓ Success' : '✗ Error'}
              </h3>
              <p
                className={`text-sm ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {result.message}
              </p>
            </div>
          )}

          {/* Features Info */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Email Features:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <h4 className="font-medium mb-2">Patient Welcome Email Includes:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Personalized greeting</li>
                  <li>Platform features overview</li>
                  <li>Book appointments</li>
                  <li>Video consultations</li>
                  <li>Access medical records</li>
                  <li>Digital prescriptions</li>
                  <li>Dashboard link</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Doctor Welcome Email Includes:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Professional welcome</li>
                  <li>Specialty confirmation</li>
                  <li>Platform features for doctors</li>
                  <li>Appointment management</li>
                  <li>Video consultation setup</li>
                  <li>Digital prescription tools</li>
                  <li>Next steps checklist</li>
                  <li>Dashboard access link</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Testing Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Make sure you have a valid Resend API key configured in .env</li>
              <li>Update the test email addresses above to your own email</li>
              <li>Click the test buttons to send welcome emails</li>
              <li>Check your email inbox for the welcome messages</li>
              <li>Verify that emails are also logged in the notifications table</li>
              <li>Open browser console to see detailed logs</li>
            </ol>
          </div>

          {/* Integration Info */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">🔗 Integration</h3>
            <p className="text-sm text-yellow-800">
              To automatically send welcome emails when profiles are created, add these calls to your registration/signup flows:
            </p>
            <pre className="mt-2 bg-yellow-100 p-3 rounded text-xs overflow-x-auto">
{`// After creating patient profile
await emailService.sendPatientWelcomeEmail({
  tenant_id: tenantId,
  patient_id: newPatient.id,
  patient_name: newPatient.name,
  patient_email: newPatient.email,
  hospital_name: 'AI Surgeon Pilot Hospital'
});

// After creating doctor profile
await emailService.sendDoctorWelcomeEmail({
  tenant_id: tenantId,
  doctor_id: newDoctor.id,
  doctor_name: newDoctor.full_name,
  doctor_email: newDoctor.email,
  hospital_name: 'AI Surgeon Pilot Hospital',
  specialties: newDoctor.specialties
});`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
