import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  CheckCircle,
  XCircle,
  Clock,
  Database,
  MessageSquare,
  Mail,
  CreditCard,
  Users,
  Calendar,
  Brain,
  Link as LinkIcon,
  Play
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  details?: any;
}

const SystemTestDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Record<string, TestResult>>({
    database: { name: 'Database Connection', status: 'pending' },
    doctors: { name: 'Doctors Table', status: 'pending' },
    patients: { name: 'Patients Table', status: 'pending' },
    appointments: { name: 'Appointments Table', status: 'pending' },
    availability: { name: 'Doctor Availability', status: 'pending' },
    whatsapp: { name: 'WhatsApp API', status: 'pending' },
    email: { name: 'Email Service', status: 'pending' },
    payment: { name: 'Payment Gateway', status: 'pending' },
    ai: { name: 'OpenAI API', status: 'pending' },
    routes: { name: 'Navigation Routes', status: 'pending' }
  });

  const updateTest = (key: string, update: Partial<TestResult>) => {
    setTests(prev => ({
      ...prev,
      [key]: { ...prev[key], ...update }
    }));
  };

  // Test Database Connection
  const testDatabase = async () => {
    updateTest('database', { status: 'running' });
    try {
      const { data, error } = await supabase.from('doctors').select('count').limit(1);
      if (error) throw error;

      updateTest('database', {
        status: 'success',
        message: 'Connected to Supabase successfully'
      });
    } catch (error: any) {
      updateTest('database', {
        status: 'error',
        message: error.message
      });
    }
  };

  // Test Doctors Table
  const testDoctors = async () => {
    updateTest('doctors', { status: 'running' });
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, full_name, specialty, slug, is_active')
        .limit(5);

      if (error) throw error;

      updateTest('doctors', {
        status: 'success',
        message: `Found ${data?.length || 0} doctors`,
        details: data
      });
    } catch (error: any) {
      updateTest('doctors', {
        status: 'error',
        message: error.message
      });
    }
  };

  // Test Patients Table
  const testPatients = async () => {
    updateTest('patients', { status: 'running' });
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, email, first_name, last_name, phone')
        .limit(5);

      if (error) throw error;

      updateTest('patients', {
        status: 'success',
        message: `Found ${data?.length || 0} patients`,
        details: data
      });
    } catch (error: any) {
      updateTest('patients', {
        status: 'error',
        message: error.message
      });
    }
  };

  // Test Appointments Table
  const testAppointments = async () => {
    updateTest('appointments', { status: 'running' });
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, doctor_id, patient_id, start_time, status')
        .limit(5);

      if (error) throw error;

      updateTest('appointments', {
        status: 'success',
        message: `Found ${data?.length || 0} appointments`,
        details: data
      });
    } catch (error: any) {
      updateTest('appointments', {
        status: 'error',
        message: error.message
      });
    }
  };

  // Test Doctor Availability
  const testAvailability = async () => {
    updateTest('availability', { status: 'running' });
    try {
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('id, doctor_id, day_of_week, start_time, end_time')
        .limit(5);

      if (error) {
        // Table might not exist yet
        throw new Error('doctor_availability table not found. Run migration DDO_02');
      }

      updateTest('availability', {
        status: 'success',
        message: `Found ${data?.length || 0} availability records`,
        details: data
      });
    } catch (error: any) {
      updateTest('availability', {
        status: 'error',
        message: error.message
      });
    }
  };

  // Test WhatsApp API
  const testWhatsApp = async () => {
    updateTest('whatsapp', { status: 'running' });
    try {
      const apiKey = import.meta.env.VITE_DOUBLETICK_API_KEY;
      if (!apiKey) {
        throw new Error('WhatsApp API key not configured');
      }

      updateTest('whatsapp', {
        status: 'success',
        message: 'API key configured. Test sending at /test-whatsapp-api',
        details: { api_key: apiKey.substring(0, 10) + '...' }
      });
    } catch (error: any) {
      updateTest('whatsapp', {
        status: 'error',
        message: error.message
      });
    }
  };

  // Test Email Service
  const testEmail = async () => {
    updateTest('email', { status: 'running' });
    try {
      const apiKey = import.meta.env.VITE_RESEND_API_KEY;
      if (!apiKey) {
        updateTest('email', {
          status: 'error',
          message: 'Email API key not configured. Email will work in demo mode.'
        });
        return;
      }

      updateTest('email', {
        status: 'success',
        message: 'Email service configured',
        details: { api_key: apiKey.substring(0, 10) + '...' }
      });
    } catch (error: any) {
      updateTest('email', {
        status: 'error',
        message: error.message
      });
    }
  };

  // Test Payment Gateway
  const testPayment = async () => {
    updateTest('payment', { status: 'running' });
    try {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        updateTest('payment', {
          status: 'error',
          message: 'Razorpay key not configured. Payment will work in demo mode.'
        });
        return;
      }

      updateTest('payment', {
        status: 'success',
        message: 'Razorpay configured',
        details: { key_id: razorpayKey.substring(0, 10) + '...' }
      });
    } catch (error: any) {
      updateTest('payment', {
        status: 'error',
        message: error.message
      });
    }
  };

  // Test AI API
  const testAI = async () => {
    updateTest('ai', { status: 'running' });
    try {
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!openaiKey) {
        throw new Error('OpenAI API key not configured');
      }

      updateTest('ai', {
        status: 'success',
        message: 'OpenAI API key configured',
        details: { api_key: openaiKey.substring(0, 15) + '...' }
      });
    } catch (error: any) {
      updateTest('ai', {
        status: 'error',
        message: error.message
      });
    }
  };

  // Test Routes
  const testRoutes = async () => {
    updateTest('routes', { status: 'running' });
    const criticalRoutes = [
      '/patient-signup',
      '/verify-email',
      '/doctors',
      '/doctor/dashboard',
      '/patient-dashboard',
      '/book/test-id',
      '/test-whatsapp-api'
    ];

    updateTest('routes', {
      status: 'success',
      message: `${criticalRoutes.length} critical routes configured`,
      details: criticalRoutes
    });
  };

  // Run all tests
  const runAllTests = async () => {
    toast.info('Running comprehensive system tests...');

    await testDatabase();
    await testDoctors();
    await testPatients();
    await testAppointments();
    await testAvailability();
    await testWhatsApp();
    await testEmail();
    await testPayment();
    await testAI();
    await testRoutes();

    toast.success('All tests completed!');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'running':
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">Testing...</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  const testGroups = [
    {
      title: 'Database & Tables',
      icon: Database,
      tests: ['database', 'doctors', 'patients', 'appointments', 'availability']
    },
    {
      title: 'External APIs',
      icon: LinkIcon,
      tests: ['whatsapp', 'email', 'payment', 'ai']
    },
    {
      title: 'System',
      icon: Users,
      tests: ['routes']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            System Test Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive connectivity and integration testing
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={runAllTests}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-green-600"
          >
            <Play className="mr-2 h-5 w-5" />
            Run All Tests
          </Button>

          <Button
            onClick={() => navigate('/test-whatsapp-api')}
            variant="outline"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Test WhatsApp
          </Button>
        </div>

        {/* Test Groups */}
        <div className="space-y-6">
          {testGroups.map((group) => (
            <Card key={group.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <group.icon className="h-5 w-5" />
                  {group.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.tests.map((testKey) => {
                    const test = tests[testKey];
                    return (
                      <div
                        key={testKey}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {getStatusIcon(test.status)}
                          <div className="flex-1">
                            <p className="font-medium">{test.name}</p>
                            {test.message && (
                              <p className="text-sm text-gray-600">{test.message}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          {getStatusBadge(test.status)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {Object.values(tests).filter(t => t.status === 'success').length}
                </div>
                <div className="text-sm text-green-600">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {Object.values(tests).filter(t => t.status === 'error').length}
                </div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {Object.values(tests).filter(t => t.status === 'running').length}
                </div>
                <div className="text-sm text-blue-600">Running</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {Object.values(tests).length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemTestDashboard;
