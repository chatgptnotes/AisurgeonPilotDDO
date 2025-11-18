import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Stethoscope,
  User,
  Clock,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import RealtimeStatus from '@/components/RealtimeStatus';

interface Visit {
  id: string;
  visit_date: string;
  visit_type?: string;
  chief_complaint?: string;
  diagnosis?: string;
  treatment_plan?: string;
  notes?: string;
  doctor_name?: string;
  created_at: string;
}

const PatientMedicalRecords: React.FC = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  useEffect(() => {
    loadMedicalRecords();
  }, []);

  // Real-time subscription for visits/medical records
  useEffect(() => {
    const patientId = localStorage.getItem('patient_id');
    if (!patientId) return;

    console.log('[Real-time] Setting up patient visits subscription for patient:', patientId);

    const channel = supabase
      .channel('patient-visits-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'visits',
        filter: `patient_id=eq.${patientId}`
      }, async (payload) => {
        console.log('[Real-time] Visit change detected:', payload);

        if (payload.eventType === 'INSERT') {
          // New visit record added
          const newVisit = payload.new as Visit;

          setVisits(prev => {
            // Check if visit already exists
            const exists = prev.some(v => v.id === newVisit.id);
            if (exists) return prev;

            // Add and sort by visit date (newest first)
            return [newVisit, ...prev].sort((a, b) =>
              new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
            );
          });

          toast.success('New medical record added', {
            description: 'A new visit record has been added to your history'
          });
        } else if (payload.eventType === 'UPDATE') {
          // Visit record updated
          const updatedVisit = payload.new as Visit;

          setVisits(prev =>
            prev.map(v => v.id === updatedVisit.id ? updatedVisit : v)
          );

          // Update selected visit if it's the one being viewed
          if (selectedVisit?.id === updatedVisit.id) {
            setSelectedVisit(updatedVisit);
          }

          toast.info('Medical record updated', {
            description: 'Visit details have been updated'
          });
        } else if (payload.eventType === 'DELETE') {
          // Visit record deleted
          setVisits(prev => prev.filter(v => v.id !== payload.old.id));

          // Clear selected visit if it was deleted
          if (selectedVisit?.id === payload.old.id) {
            setSelectedVisit(null);
          }

          toast.warning('Medical record removed', {
            description: 'A visit record has been removed'
          });
        }
      })
      .subscribe((status) => {
        console.log('[Real-time] Visits subscription status:', status);
      });

    return () => {
      console.log('[Real-time] Cleaning up patient visits subscription');
      supabase.removeChannel(channel);
    };
  }, [selectedVisit]);

  const loadMedicalRecords = async () => {
    try {
      const patientId = localStorage.getItem('patient_id');

      if (!patientId) {
        toast.error('Please login to view your medical records');
        navigate('/patient-dashboard');
        return;
      }

      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false });

      if (error) {
        console.error('Error loading medical records:', error);
        toast.error('Failed to load medical records');
        return;
      }

      setVisits(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while loading your records');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadRecord = (visitId: string) => {
    toast.info('Download feature coming soon');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading medical records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/patient-dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">My Medical Records</h1>
                <p className="text-sm text-gray-600">Your consultation history</p>
              </div>
            </div>
            <RealtimeStatus />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Visits</p>
                  <p className="text-3xl font-bold text-green-600">{visits.length}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last Visit</p>
                  <p className="text-lg font-bold text-blue-600">
                    {visits.length > 0
                      ? format(new Date(visits[0].visit_date), 'MMM d, yyyy')
                      : 'No visits'}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Records Available</p>
                  <p className="text-3xl font-bold text-purple-600">{visits.length}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medical Records List */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Records List */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Visit History</h2>
            {visits.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold">No medical records yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Your consultation history will appear here
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => navigate('/doctors')}
                    >
                      Book an Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              visits.map((visit) => (
                <Card
                  key={visit.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedVisit?.id === visit.id ? 'border-green-500 border-2' : ''
                  }`}
                  onClick={() => setSelectedVisit(visit)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {format(new Date(visit.visit_date), 'EEEE, MMM d, yyyy')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {visit.visit_type || 'General Consultation'}
                          </p>
                          {visit.doctor_name && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <User className="h-3 w-3" />
                              {visit.doctor_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(visit.visit_date), 'h:mm a')}
                      </Badge>
                    </div>

                    {visit.chief_complaint && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          Chief Complaint
                        </p>
                        <p className="text-sm text-gray-700">
                          {visit.chief_complaint.substring(0, 100)}
                          {visit.chief_complaint.length > 100 ? '...' : ''}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVisit(visit);
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadRecord(visit.id);
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Visit Details Panel */}
          <div className="lg:sticky lg:top-4 lg:h-fit">
            {selectedVisit ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Visit Details
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(selectedVisit.visit_date), 'EEEE, MMMM d, yyyy • h:mm a')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Visit Type</p>
                    <Badge>{selectedVisit.visit_type || 'General Consultation'}</Badge>
                  </div>

                  {selectedVisit.doctor_name && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Doctor</p>
                      <p className="text-gray-600">{selectedVisit.doctor_name}</p>
                    </div>
                  )}

                  {selectedVisit.chief_complaint && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Chief Complaint</p>
                      <p className="text-gray-600">{selectedVisit.chief_complaint}</p>
                    </div>
                  )}

                  {selectedVisit.diagnosis && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Diagnosis</p>
                      <p className="text-gray-600">{selectedVisit.diagnosis}</p>
                    </div>
                  )}

                  {selectedVisit.treatment_plan && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Treatment Plan</p>
                      <p className="text-gray-600">{selectedVisit.treatment_plan}</p>
                    </div>
                  )}

                  {selectedVisit.notes && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Additional Notes</p>
                      <p className="text-gray-600">{selectedVisit.notes}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => handleDownloadRecord(selectedVisit.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Full Record
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/patient/prescriptions?visit=${selectedVisit.id}`)}
                    >
                      View Prescriptions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Select a visit to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientMedicalRecords;
