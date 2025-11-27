import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Stethoscope,
  User,
  Clock,
  Download,
  FolderOpen,
  Eye,
  ExternalLink,
  Pill,
  FlaskConical,
  AlertCircle,
  CheckCircle
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

interface PublishedDocument {
  id: string;
  document_name: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  document_type_id: number;
  published_at: string;
  remarks?: string;
}

interface Prescription {
  id: string;
  visit_id: string;
  prescription_date: string;
  doctor_id: string | null;
  doctor_name: string | null;
  diagnosis: string | null;
  notes: string | null;
  is_published: boolean;
  published_at: string | null;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }> | null;
  created_at: string | null;
}

interface LabReport {
  id: string;
  visit_id: string;
  report_date: string | null;
  doctor_name: string | null;
  report_name: string | null;
  category: string | null;
  lab_name: string | null;
  tests: Array<{
    test_name: string;
    result: string;
    unit: string;
    normal_range: string;
    status: string;
  }> | null;
  notes: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string | null;
}

const documentTypeLabels: Record<number, string> = {
  1: 'Referral Letter',
  2: 'ESIC e-Pehchaan Card',
  3: 'Identity Document',
  4: 'Medical Report',
  5: 'Insurance Document',
  6: 'Prescription',
  7: 'Discharge Summary',
  8: 'X-Ray/Scan Report',
  9: 'Lab Report',
  10: 'Other Document',
};

const PatientMedicalRecords: React.FC = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [publishedDocuments, setPublishedDocuments] = useState<PublishedDocument[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [activeTab, setActiveTab] = useState('visits');

  useEffect(() => {
    loadMedicalRecords();
    loadPublishedDocuments();
    loadPrescriptions();
    loadLabReports();
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

  const loadPublishedDocuments = async () => {
    try {
      const patientId = localStorage.getItem('patient_id');
      if (!patientId) return;

      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Error loading published documents:', error);
        return;
      }

      setPublishedDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const loadPrescriptions = async () => {
    try {
      const patientId = localStorage.getItem('patient_id');

      // Debug: Log the patient ID being used for query
      console.log('[Prescription Load] Patient ID from localStorage:', patientId);

      if (!patientId) {
        console.log('[Prescription Load] No patient_id in localStorage!');
        return;
      }

      // Query prescriptions table directly - only published ones
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_published', true)
        .order('prescription_date', { ascending: false });

      if (error) {
        console.error('Error loading prescriptions:', error);
        return;
      }

      // Debug: Log results
      console.log('[Prescription Load] Found prescriptions:', data?.length || 0, data);

      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    }
  };

  const loadLabReports = async () => {
    try {
      const patientId = localStorage.getItem('patient_id');
      if (!patientId) return;

      // Query lab_reports table directly - only published ones
      const { data, error } = await supabase
        .from('lab_reports')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_published', true)
        .order('report_date', { ascending: false });

      if (error) {
        console.error('Error loading lab reports:', error);
        return;
      }

      setLabReports(data || []);
    } catch (error) {
      console.error('Error loading lab reports:', error);
    }
  };

  const handleViewDocument = async (doc: PublishedDocument) => {
    try {
      // If file_url is already a public URL, use it directly
      if (doc.file_url && doc.file_url.startsWith('http')) {
        window.open(doc.file_url, '_blank');
        return;
      }

      // Otherwise, try to get a signed URL from storage
      const bucket = doc.file_url?.includes('patient-documents') ? 'patient-documents' : 'medical-documents';
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(doc.file_url || doc.file_name, 3600);

      if (error) {
        toast.error('Unable to access document');
        return;
      }

      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to open document');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

        {/* Tabs for Visit History, Documents, Prescriptions, and Lab Reports */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="visits" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Visits</span> ({visits.length})
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="flex items-center gap-2">
              <Pill className="h-4 w-4" />
              <span className="hidden sm:inline">Prescriptions</span> ({prescriptions.length})
            </TabsTrigger>
            <TabsTrigger value="lab-reports" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">Lab Reports</span> ({labReports.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span> ({publishedDocuments.length})
            </TabsTrigger>
          </TabsList>

          {/* Visit History Tab */}
          <TabsContent value="visits">
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
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">My Prescriptions</h2>
              <p className="text-gray-600 mb-6">
                Prescriptions shared by your doctor will appear here
              </p>

              {prescriptions.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 font-semibold">No prescriptions available</p>
                      <p className="text-sm text-gray-500 mt-2">
                        When your doctor shares prescriptions, they will appear here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {prescriptions.map((prescription) => {
                    const medications = prescription.medications || [];
                    return (
                      <Card key={prescription.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Pill className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">
                                  Prescription #{prescription.visit_id?.slice(-8) || 'N/A'}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                  <Calendar className="h-3 w-3" />
                                  {prescription.prescription_date
                                    ? format(new Date(prescription.prescription_date), 'MMM d, yyyy')
                                    : 'Unknown date'}
                                  {prescription.doctor_name && (
                                    <>
                                      <span className="mx-1">•</span>
                                      <User className="h-3 w-3" />
                                      {prescription.doctor_name}
                                    </>
                                  )}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">
                              {medications.length} medication{medications.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {prescription.diagnosis && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Diagnosis</p>
                              <p className="text-gray-700">{prescription.diagnosis}</p>
                            </div>
                          )}

                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-gray-700">Medications:</p>
                            {medications.map((med, index) => (
                              <div key={index} className="p-3 border rounded-lg bg-white">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-gray-800">{med.name}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {med.dosage && (
                                        <Badge variant="outline" className="text-xs">
                                          {med.dosage}
                                        </Badge>
                                      )}
                                      {med.frequency && (
                                        <Badge variant="outline" className="text-xs">
                                          {med.frequency.replace(/_/g, ' ')}
                                        </Badge>
                                      )}
                                      {med.duration && (
                                        <Badge variant="outline" className="text-xs">
                                          {med.duration.replace(/_/g, ' ')}
                                        </Badge>
                                      )}
                                    </div>
                                    {med.instructions && (
                                      <p className="text-sm text-gray-500 mt-2 italic">
                                        {med.instructions}
                                      </p>
                                    )}
                                  </div>
                                  <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {prescription.notes && (
                            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <p className="text-xs text-yellow-700 uppercase tracking-wide mb-1">Additional Notes</p>
                              <p className="text-gray-700">{prescription.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Lab Reports Tab */}
          <TabsContent value="lab-reports">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">My Lab Reports</h2>
              <p className="text-gray-600 mb-6">
                Lab reports shared by your doctor will appear here
              </p>

              {labReports.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <FlaskConical className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 font-semibold">No lab reports available</p>
                      <p className="text-sm text-gray-500 mt-2">
                        When your doctor shares lab reports, they will appear here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {labReports.map((report) => {
                    const tests = report.tests || [];

                    return (
                      <Card key={report.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <FlaskConical className="h-6 w-6 text-purple-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">
                                  {report.report_name || `Lab Report #${report.visit_id?.slice(-8)}`}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                  <Calendar className="h-3 w-3" />
                                  {report.report_date
                                    ? format(new Date(report.report_date), 'MMM d, yyyy')
                                    : 'Unknown date'}
                                  {report.doctor_name && (
                                    <>
                                      <span className="mx-1">•</span>
                                      <User className="h-3 w-3" />
                                      {report.doctor_name}
                                    </>
                                  )}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {report.category && (
                                <Badge variant="outline">{report.category}</Badge>
                              )}
                              <Badge className="bg-purple-100 text-purple-800">
                                {tests.length} test{tests.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {report.lab_name && (
                            <p className="text-sm text-gray-500 mb-4">
                              Lab: {report.lab_name}
                            </p>
                          )}

                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-gray-700">Test Results:</p>
                            <div className="border rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="text-left p-3 font-medium">Test</th>
                                    <th className="text-left p-3 font-medium">Result</th>
                                    <th className="text-left p-3 font-medium">Normal Range</th>
                                    <th className="text-left p-3 font-medium">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {tests.map((test: any, index: number) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="p-3 font-medium">{test.test_name}</td>
                                      <td className="p-3">
                                        {test.result} {test.unit}
                                      </td>
                                      <td className="p-3 text-gray-500">{test.normal_range || '-'}</td>
                                      <td className="p-3">
                                        {test.status === 'normal' && (
                                          <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                                            <CheckCircle className="h-3 w-3" />
                                            Normal
                                          </Badge>
                                        )}
                                        {test.status === 'abnormal' && (
                                          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
                                            <AlertCircle className="h-3 w-3" />
                                            Abnormal
                                          </Badge>
                                        )}
                                        {test.status === 'critical' && (
                                          <Badge className="bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                                            <AlertCircle className="h-3 w-3" />
                                            Critical
                                          </Badge>
                                        )}
                                        {!test.status && '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {report.notes && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-xs text-blue-700 uppercase tracking-wide mb-1">Interpretation</p>
                              <p className="text-gray-700">{report.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Published Documents</h2>
              <p className="text-gray-600 mb-6">
                Documents shared by your doctor will appear here
              </p>

              {publishedDocuments.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 font-semibold">No documents available</p>
                      <p className="text-sm text-gray-500 mt-2">
                        When your doctor shares documents, they will appear here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {publishedDocuments.map((doc) => (
                    <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate">
                              {doc.document_name || doc.file_name}
                            </p>
                            <Badge variant="outline" className="mt-1">
                              {documentTypeLabels[doc.document_type_id] || 'Document'}
                            </Badge>
                          </div>
                        </div>

                        <div className="text-sm text-gray-500 space-y-1 mb-4">
                          <p className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {doc.published_at ? format(new Date(doc.published_at), 'MMM d, yyyy') : 'Unknown date'}
                          </p>
                          <p>
                            {formatFileSize(doc.file_size || 0)} - {doc.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                          </p>
                        </div>

                        {doc.remarks && (
                          <p className="text-sm text-gray-600 mb-4 italic">
                            "{doc.remarks}"
                          </p>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleViewDocument(doc)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleViewDocument(doc)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PatientMedicalRecords;
