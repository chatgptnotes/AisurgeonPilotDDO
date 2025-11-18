import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, FileText, CreditCard, LogOut, User } from 'lucide-react';

const PatientPortal: React.FC = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      const patientId = localStorage.getItem('patient_id');

      if (!patientId) {
        navigate('/unified-login');
        return;
      }

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error || !data) {
        console.error('Error loading patient:', error);
        navigate('/unified-login');
        return;
      }

      setPatient(data);
    } catch (error) {
      console.error('Error:', error);
      navigate('/unified-login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('patient_id');
    navigate('/unified-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {patient?.name?.charAt(0)?.toUpperCase() || 'P'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Welcome, {patient?.name}!</h1>
                <p className="text-gray-600">{patient?.email || patient?.phone_number}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/patient-register')}>
            <CardHeader>
              <Calendar className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Book Appointment</CardTitle>
              <CardDescription>Schedule a new appointment</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader>
              <FileText className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>My Records</CardTitle>
              <CardDescription>View medical history</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader>
              <FileText className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Prescriptions</CardTitle>
              <CardDescription>View prescriptions</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader>
              <CreditCard className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Billing</CardTitle>
              <CardDescription>View bills & payments</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent appointments and consultations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
              <Button
                className="mt-4 bg-green-600 hover:bg-green-700"
                onClick={() => navigate('/patient-register')}
              >
                Book Your First Appointment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientPortal;
