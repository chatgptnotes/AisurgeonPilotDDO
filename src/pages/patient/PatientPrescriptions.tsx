import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Pill,
  Download,
  Filter,
  Search,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface Prescription {
  id: string;
  visit_id: string;
  prescription_date: string;
  doctor_name?: string;
  diagnosis?: string;
  notes?: string;
  medications: Medication[];
}

interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

const PatientPrescriptions: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const visitId = searchParams.get('visit');

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'all' | '1m' | '3m' | '6m'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPrescriptions();
  }, [dateFilter]);

  const loadPrescriptions = async () => {
    try {
      const patientId = localStorage.getItem('patient_id');

      if (!patientId) {
        toast.error('Please login to view your prescriptions');
        navigate('/patient-dashboard');
        return;
      }

      console.log('[Prescriptions] Loading for patient:', patientId);

      let query = supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_published', true)
        .order('prescription_date', { ascending: false });

      // Apply date filter
      if (dateFilter !== 'all') {
        const months = dateFilter === '1m' ? 1 : dateFilter === '3m' ? 3 : 6;
        const startDate = subMonths(new Date(), months);
        query = query.gte('prescription_date', startDate.toISOString());
      }

      const { data, error } = await query;

      console.log('[Prescriptions] Query result:', { data, error });

      if (error) {
        console.error('Error loading prescriptions:', error);
        toast.error('Failed to load prescriptions');
        return;
      }

      // Transform data into prescription format
      const formattedPrescriptions: Prescription[] = (data || []).map((prescription: any) => ({
        id: prescription.id,
        visit_id: prescription.visit_id,
        prescription_date: prescription.prescription_date,
        doctor_name: prescription.doctor_name,
        diagnosis: prescription.diagnosis,
        notes: prescription.notes,
        medications: prescription.medications || []
      }));

      setPrescriptions(formattedPrescriptions);

      // If visitId is provided, scroll to that prescription
      if (visitId) {
        setTimeout(() => {
          const element = document.getElementById(`prescription-${visitId}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while loading prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPrescription = (prescriptionId: string) => {
    toast.info('Download feature coming soon');
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      prescription.medications.some(med =>
        med.name.toLowerCase().includes(searchLower)
      ) ||
      prescription.doctor_name?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/patient-dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">My Prescriptions</h1>
              <p className="text-sm text-gray-600">View and download your prescriptions</p>
            </div>
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
                  <p className="text-sm text-gray-600">Total Prescriptions</p>
                  <p className="text-3xl font-bold text-green-600">{prescriptions.length}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Medications</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {prescriptions.reduce((sum, p) => sum + p.medications.length, 0)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Pill className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last Prescription</p>
                  <p className="text-lg font-bold text-purple-600">
                    {prescriptions.length > 0
                      ? format(new Date(prescriptions[0].prescription_date), 'MMM d')
                      : 'None'}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search medications or doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Time</option>
                  <option value="1m">Last Month</option>
                  <option value="3m">Last 3 Months</option>
                  <option value="6m">Last 6 Months</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prescriptions List */}
        {filteredPrescriptions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">
                  {searchTerm ? 'No prescriptions found' : 'No prescriptions yet'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {searchTerm
                    ? 'Try adjusting your search criteria'
                    : 'Your prescriptions will appear here after consultations'}
                </p>
                {!searchTerm && (
                  <Button
                    className="mt-4"
                    onClick={() => navigate('/doctors')}
                  >
                    Book an Appointment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredPrescriptions.map((prescription) => (
              <Card
                key={prescription.id}
                id={`prescription-${prescription.id}`}
                className={`${
                  visitId === prescription.id ? 'border-green-500 border-2' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Prescription
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(prescription.prescription_date), 'EEEE, MMMM d, yyyy')}
                      </CardDescription>
                      {prescription.doctor_name && (
                        <p className="text-sm text-gray-600 mt-1">
                          Dr. {prescription.doctor_name}
                        </p>
                      )}
                      {prescription.diagnosis && (
                        <p className="text-sm text-blue-600 mt-1">
                          <span className="font-medium">Diagnosis:</span> {prescription.diagnosis}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPrescription(prescription.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      Prescribed Medications ({prescription.medications.length})
                    </p>
                    <div className="space-y-3">
                      {prescription.medications.map((medication, index) => (
                        <div
                          key={`${prescription.id}-med-${index}`}
                          className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border"
                        >
                          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Pill className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {index + 1}. {medication.name}
                                </p>
                                {medication.dosage && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    Dosage: {medication.dosage}
                                  </p>
                                )}
                              </div>
                            </div>
                            {(medication.frequency || medication.duration) && (
                              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                {medication.frequency && (
                                  <div>
                                    <span className="text-gray-500">Frequency:</span>
                                    <span className="ml-2 font-medium">{medication.frequency.replace(/_/g, ' ')}</span>
                                  </div>
                                )}
                                {medication.duration && (
                                  <div>
                                    <span className="text-gray-500">Duration:</span>
                                    <span className="ml-2 font-medium">{medication.duration.replace(/_/g, ' ')}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {medication.instructions && (
                              <p className="text-xs text-gray-600 mt-2 italic">
                                Instructions: {medication.instructions}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    {prescription.notes && (
                      <p className="text-sm text-gray-600 mb-3 italic">
                        <span className="font-medium not-italic">Notes:</span> {prescription.notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Prescribed on {format(new Date(prescription.prescription_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPrescriptions;
