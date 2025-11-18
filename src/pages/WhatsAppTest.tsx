/**
 * WhatsApp Test Page
 * Version: 1.0
 *
 * Test page for DoubleTick WhatsApp API integration
 * Allows sending test messages to verify API configuration
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send, CheckCircle2, XCircle } from 'lucide-react';

const WhatsAppTest = () => {
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [victimLocation, setVictimLocation] = useState('');
  const [nearbyHospital, setNearbyHospital] = useState('');
  const [phoneNumber2, setPhoneNumber2] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSendTest = async () => {
    // Validate inputs
    if (!phoneNumber || phoneNumber === '+91') {
      toast({
        title: 'Error',
        description: 'Please enter a valid phone number',
        variant: 'destructive',
      });
      return;
    }

    if (!victimLocation || !nearbyHospital || !phoneNumber2) {
      toast({
        title: 'Error',
        description: 'Please fill in all template variables',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const apiKey = import.meta.env.VITE_DOUBLETICK_API_KEY;
      const templateName = import.meta.env.VITE_DOUBLETICK_TEMPLATE_NAME;

      if (!apiKey || !templateName) {
        throw new Error('WhatsApp API configuration missing. Check environment variables.');
      }

      // DoubleTick API endpoint
      const apiUrl = 'https://api.doubletick.io/whatsapp/api/sendTemplateMessage';

      const payload = {
        messages: [
          {
            to: phoneNumber.replace(/\s/g, ''),
            template: {
              name: templateName,
              languageCode: 'en',
              bodyValues: [
                victimLocation,
                nearbyHospital,
                phoneNumber2,
              ],
            },
          },
        ],
      };

      console.log('Sending WhatsApp message:', payload);

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log('WhatsApp API Response:', data);

      if (res.ok) {
        setResponse(data);
        toast({
          title: 'Success',
          description: 'WhatsApp message sent successfully!',
        });
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (err: any) {
      console.error('WhatsApp send error:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">WhatsApp Integration Test</h1>
        <p className="text-muted-foreground mt-2">
          Test DoubleTick WhatsApp API integration
        </p>
      </div>

      <div className="grid gap-6">
        {/* API Configuration Info */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>Current DoubleTick API settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Key:</span>
              <span className="text-sm text-muted-foreground font-mono">
                {import.meta.env.VITE_DOUBLETICK_API_KEY ? '✓ Configured' : '✗ Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Template Name:</span>
              <span className="text-sm text-muted-foreground font-mono">
                {import.meta.env.VITE_DOUBLETICK_TEMPLATE_NAME || 'Not set'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Test Message Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send Test Message</CardTitle>
            <CardDescription>
              Fill in the details to send a test WhatsApp message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Recipient Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+919876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +91 for India)
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Template Variables</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Template: emergency_location_alert
              </p>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="location">Victim Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., MG Road, Bangalore"
                    value={victimLocation}
                    onChange={(e) => setVictimLocation(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hospital">Nearby Hospital</Label>
                  <Input
                    id="hospital"
                    placeholder="e.g., Apollo Hospital, 2.5 km away"
                    value={nearbyHospital}
                    onChange={(e) => setNearbyHospital(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone2">Contact Phone Number</Label>
                  <Input
                    id="phone2"
                    placeholder="e.g., +919876543210"
                    value={phoneNumber2}
                    onChange={(e) => setPhoneNumber2(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSendTest}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Message
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Response Display */}
        {response && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Success
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-white p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(response, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ol className="list-decimal list-inside space-y-2">
              <li>Enter a valid phone number with country code (e.g., +919876543210)</li>
              <li>Fill in all three template variables</li>
              <li>Click "Send Test Message"</li>
              <li>Check the recipient's WhatsApp for the message</li>
              <li>Verify the API response shows success status</li>
            </ol>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 text-xs">
                <strong>Note:</strong> Make sure you have WhatsApp API credits in your DoubleTick account.
                The message will be sent using the configured template.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WhatsAppTest;
