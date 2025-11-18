/**
 * WhatsApp Service Test Page
 * Demonstrates all WhatsApp template functions
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import whatsappService from '@/services/whatsappService';

export default function WhatsAppServiceTest() {
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('+919876543210');

  // Configuration status
  const configStatus = whatsappService.getConfigStatus();

  // Test API connection
  const handleTestConnection = async () => {
    setLoading(true);
    const result = await whatsappService.testConnection();
    setLoading(false);

    if (result.success) {
      toast.success('API connection successful!');
    } else {
      toast.error(`Connection failed: ${result.error}`);
    }
  };

  // 1. Appointment Confirmation
  const handleAppointmentConfirmation = async () => {
    setLoading(true);
    const result = await whatsappService.sendAppointmentConfirmation(
      'John Doe',
      phone,
      '2025-11-20',
      '10:00 AM',
      'Dr. Smith'
    );
    setLoading(false);

    if (result.success) {
      toast.success(`Message sent! ID: ${result.messageId}`);
    } else {
      toast.error(`Failed: ${result.error}`);
    }
  };

  // 2. 24h Reminder
  const handleReminder24h = async () => {
    setLoading(true);
    const result = await whatsappService.sendAppointmentReminder24h(
      'Jane Smith',
      phone,
      '2025-11-21',
      '2:30 PM',
      'Dr. Johnson',
      'Please bring your medical records'
    );
    setLoading(false);

    if (result.success) {
      toast.success(`Message sent! ID: ${result.messageId}`);
    } else {
      toast.error(`Failed: ${result.error}`);
    }
  };

  // 3. 3h Reminder
  const handleReminder3h = async () => {
    setLoading(true);
    const result = await whatsappService.sendAppointmentReminder3h(
      'Bob Wilson',
      phone,
      '3:00 PM',
      'Dr. Brown'
    );
    setLoading(false);

    if (result.success) {
      toast.success(`Message sent! ID: ${result.messageId}`);
    } else {
      toast.error(`Failed: ${result.error}`);
    }
  };

  // 4. Prescription Ready
  const handlePrescriptionReady = async () => {
    setLoading(true);
    const result = await whatsappService.sendPrescriptionReady(
      'Alice Cooper',
      phone,
      'Dr. Davis'
    );
    setLoading(false);

    if (result.success) {
      toast.success(`Message sent! ID: ${result.messageId}`);
    } else {
      toast.error(`Failed: ${result.error}`);
    }
  };

  // 5. Follow-up Reminder
  const handleFollowupReminder = async () => {
    setLoading(true);
    const result = await whatsappService.sendFollowupReminder(
      'Charlie Brown',
      phone,
      'Dr. White',
      '2025-10-15',
      '6 months'
    );
    setLoading(false);

    if (result.success) {
      toast.success(`Message sent! ID: ${result.messageId}`);
    } else {
      toast.error(`Failed: ${result.error}`);
    }
  };

  // 6. Appointment Cancelled
  const handleAppointmentCancelled = async () => {
    setLoading(true);
    const result = await whatsappService.sendAppointmentCancelled(
      'David Lee',
      phone,
      '2025-11-22',
      '11:00 AM',
      'Dr. Green',
      'Doctor emergency'
    );
    setLoading(false);

    if (result.success) {
      toast.success(`Message sent! ID: ${result.messageId}`);
    } else {
      toast.error(`Failed: ${result.error}`);
    }
  };

  // 7. Welcome Message
  const handleWelcomeMessage = async () => {
    setLoading(true);
    const result = await whatsappService.sendWelcomeMessage(
      'Emma Watson',
      phone,
      'emma@example.com',
      'PAT-12345'
    );
    setLoading(false);

    if (result.success) {
      toast.success(`Message sent! ID: ${result.messageId}`);
    } else {
      toast.error(`Failed: ${result.error}`);
    }
  };

  // 8. Payment Receipt
  const handlePaymentReceipt = async () => {
    setLoading(true);
    const result = await whatsappService.sendPaymentReceipt(
      'Frank Miller',
      phone,
      '₹2,500',
      'REC-2025-001',
      '2025-11-15',
      'Consultation'
    );
    setLoading(false);

    if (result.success) {
      toast.success(`Message sent! ID: ${result.messageId}`);
    } else {
      toast.error(`Failed: ${result.error}`);
    }
  };

  // 9. Emergency Alert
  const handleEmergencyAlert = async () => {
    setLoading(true);
    const result = await whatsappService.sendEmergencyLocationAlert(
      phone,
      'MG Road, Bangalore',
      'Apollo Hospital, 2km away',
      '+919876543219'
    );
    setLoading(false);

    if (result.success) {
      toast.success(`Emergency alert sent! ID: ${result.messageId}`);
    } else {
      toast.error(`Failed: ${result.error}`);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">WhatsApp Service Test</h1>
        <p className="text-muted-foreground">
          Test DoubleTick API integration with all template functions
        </p>
      </div>

      {/* Configuration Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuration Status</CardTitle>
          <CardDescription>Check your DoubleTick API setup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>API Key Configured</Label>
              <p className={configStatus.apiKeyConfigured ? 'text-green-600' : 'text-red-600'}>
                {configStatus.apiKeyConfigured ? '✓ Yes' : '✗ No'}
              </p>
            </div>
            <div>
              <Label>Phone Number Configured</Label>
              <p className={configStatus.phoneNumberConfigured ? 'text-green-600' : 'text-red-600'}>
                {configStatus.phoneNumberConfigured ? '✓ Yes' : '✗ No'}
              </p>
            </div>
            <div className="col-span-2">
              <Label>API URL</Label>
              <p className="text-sm text-muted-foreground">{configStatus.apiUrl}</p>
            </div>
          </div>
          <Button onClick={handleTestConnection} disabled={loading}>
            {loading ? 'Testing...' : 'Test API Connection'}
          </Button>
        </CardContent>
      </Card>

      {/* Phone Input */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Phone Number</CardTitle>
          <CardDescription>Enter the phone number to receive test messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (with country code)</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
            />
          </div>
        </CardContent>
      </Card>

      {/* Template Tests */}
      <Tabs defaultValue="appointments">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Confirmation</CardTitle>
              <CardDescription>Send appointment confirmation message</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleAppointmentConfirmation} disabled={loading}>
                {loading ? 'Sending...' : 'Send Confirmation'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>24-Hour Reminder</CardTitle>
              <CardDescription>Send reminder 24 hours before appointment</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleReminder24h} disabled={loading}>
                {loading ? 'Sending...' : 'Send 24h Reminder'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3-Hour Reminder</CardTitle>
              <CardDescription>Send reminder 3 hours before appointment</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleReminder3h} disabled={loading}>
                {loading ? 'Sending...' : 'Send 3h Reminder'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appointment Cancelled</CardTitle>
              <CardDescription>Send appointment cancellation notice</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleAppointmentCancelled} disabled={loading} variant="destructive">
                {loading ? 'Sending...' : 'Send Cancellation'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Tab */}
        <TabsContent value="medical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prescription Ready</CardTitle>
              <CardDescription>Notify patient that prescription is ready</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handlePrescriptionReady} disabled={loading}>
                {loading ? 'Sending...' : 'Send Prescription Notice'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow-up Reminder</CardTitle>
              <CardDescription>Send follow-up appointment reminder</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleFollowupReminder} disabled={loading}>
                {loading ? 'Sending...' : 'Send Follow-up Reminder'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Location Alert</CardTitle>
              <CardDescription>Send emergency alert with location details</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleEmergencyAlert} disabled={loading} variant="destructive">
                {loading ? 'Sending...' : 'Send Emergency Alert'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Tab */}
        <TabsContent value="other" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Message</CardTitle>
              <CardDescription>Send welcome message to new patient</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleWelcomeMessage} disabled={loading}>
                {loading ? 'Sending...' : 'Send Welcome Message'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Receipt</CardTitle>
              <CardDescription>Send payment confirmation and receipt</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handlePaymentReceipt} disabled={loading}>
                {loading ? 'Sending...' : 'Send Payment Receipt'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Documentation Link */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            For detailed usage instructions, see WHATSAPP_SERVICE_USAGE.md in the project root.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
