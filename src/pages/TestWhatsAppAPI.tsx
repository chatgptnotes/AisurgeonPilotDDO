import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MessageSquare, Send, CheckCircle, XCircle } from 'lucide-react';

const TestWhatsAppAPI: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('+919876543210');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testDoubleTick = async () => {
    setTesting(true);
    setResult(null);

    try {
      const apiKey = import.meta.env.VITE_DOUBLETICK_API_KEY || 'key_8sc9MP6JpQ';
      const apiUrl = 'https://api.doubletick.io/whatsapp/message/template';

      console.log('Testing DoubleTick API...');
      console.log('API Key:', apiKey);
      console.log('Phone:', phoneNumber);

      const payload = {
        messages: [
          {
            to: phoneNumber,
            template: {
              name: 'emergency_location_alert',
              languageCode: 'en',
              bodyValues: [
                'Test Hospital',
                'Test Location, Dubai',
                phoneNumber
              ]
            }
          }
        ]
      };

      console.log('Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Response:', data);

      setResult({
        success: response.ok,
        status: response.status,
        data: data
      });

      if (response.ok) {
        toast.success('WhatsApp API Test Successful!', {
          description: 'Message sent successfully'
        });
      } else {
        toast.error('WhatsApp API Test Failed', {
          description: data.message || 'Check console for details'
        });
      }
    } catch (error: any) {
      console.error('WhatsApp API Error:', error);
      setResult({
        success: false,
        error: error.message
      });
      toast.error('WhatsApp API Error', {
        description: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-green-600" />
              WhatsApp API Connectivity Test
            </CardTitle>
            <CardDescription>
              Test DoubleTick WhatsApp API integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API Configuration */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold mb-2">API Configuration</h3>
              <div className="space-y-1 text-sm">
                <p><strong>API Key:</strong> {import.meta.env.VITE_DOUBLETICK_API_KEY || 'key_8sc9MP6JpQ'}</p>
                <p><strong>Endpoint:</strong> https://api.doubletick.io/whatsapp/message/template</p>
                <p><strong>Template:</strong> emergency_location_alert</p>
              </div>
            </div>

            {/* Phone Number Input */}
            <div>
              <Label htmlFor="phone">Test Phone Number (with country code)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+919876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Include country code (e.g., +91 for India)
              </p>
            </div>

            {/* Test Button */}
            <Button
              onClick={testDoubleTick}
              disabled={testing || !phoneNumber}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Test Message...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test WhatsApp Message
                </>
              )}
            </Button>

            {/* Result Display */}
            {result && (
              <div className={`p-4 border rounded-lg ${
                result.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-900">Success!</h3>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <h3 className="font-semibold text-red-900">Failed</h3>
                    </>
                  )}
                </div>

                <div className="text-sm space-y-2">
                  <p><strong>Status:</strong> {result.status || 'Error'}</p>
                  {result.data && (
                    <div>
                      <strong>Response:</strong>
                      <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {result.error && (
                    <p className="text-red-700"><strong>Error:</strong> {result.error}</p>
                  )}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold mb-2">Instructions</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Enter your phone number with country code</li>
                <li>Click "Send Test WhatsApp Message"</li>
                <li>Check your WhatsApp for the test message</li>
                <li>Message template: "Emergency Location Alert"</li>
              </ol>
            </div>

            {/* API Docs */}
            <div className="text-sm text-gray-600">
              <p><strong>DoubleTick API Documentation:</strong></p>
              <a
                href="https://docs.doubletick.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://docs.doubletick.io
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TestWhatsAppAPI;
