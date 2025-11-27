import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { User, Phone, Mail, Calendar, Search, Clock, Eye } from 'lucide-react';
import { format, isFuture, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { PatientDetailsModal } from './PatientDetailsModal';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth?: string;
  created_at: string;
  gender?: string;
  address?: string;
  blood_group?: string;
  allergies?: string;
}

interface PatientWithAppointment extends Patient {
  nextAppointment?: {
    id: string;
    start_at: string;
    status: string;
    appointment_type?: string;
    mode?: string;
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  doctorId: string;
}

export function PatientListModal({ open, onClose, doctorId }: Props) {
  const [patients, setPatients] = useState<PatientWithAppointment[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientWithAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Patient details modal state
  const [selectedPatient, setSelectedPatient] = useState<PatientWithAppointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    if (open && doctorId) {
      fetchPatients();
    }
  }, [open, doctorId]);

  useEffect(() => {
    // Filter patients based on search query
    if (searchQuery.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = patients.filter(
        (patient) => {
          const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown';
          return (
            fullName.toLowerCase().includes(query) ||
            (patient.phone && patient.phone.includes(query)) ||
            (patient.email && patient.email.toLowerCase().includes(query))
          );
        }
      );
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      // Get all appointments with patient data for this doctor
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          start_at,
          status,
          appointment_type,
          mode,
          patients!patient_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            created_at,
            gender,
            address,
            blood_group,
            allergies
          )
        `)
        .eq('doctor_id', doctorId)
        .order('start_at', { ascending: true });

      console.log('[PatientList] Appointments fetched:', appointments?.length, 'Error:', appointmentsError);

      if (appointmentsError) throw appointmentsError;

      // Group appointments by patient and find next appointment
      const patientMap = new Map<string, PatientWithAppointment>();
      const now = new Date();

      appointments?.forEach((apt) => {
        const patient = apt.patients as any;
        if (!patient) return;

        const existingPatient = patientMap.get(patient.id);
        const appointmentDate = parseISO(apt.start_at);
        const isUpcoming = isFuture(appointmentDate) && ['scheduled', 'confirmed'].includes(apt.status);

        if (!existingPatient) {
          patientMap.set(patient.id, {
            ...patient,
            nextAppointment: isUpcoming ? {
              id: apt.id,
              start_at: apt.start_at,
              status: apt.status,
              appointment_type: apt.appointment_type,
              mode: apt.mode,
            } : undefined,
          });
        } else if (isUpcoming && !existingPatient.nextAppointment) {
          existingPatient.nextAppointment = {
            id: apt.id,
            start_at: apt.start_at,
            status: apt.status,
            appointment_type: apt.appointment_type,
            mode: apt.mode,
          };
        }
      });

      const patientsArray = Array.from(patientMap.values()).sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setPatients(patientsArray);
      setFilteredPatients(patientsArray);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (patient: PatientWithAppointment) => {
    setSelectedPatient(patient);
    setIsDetailsModalOpen(true);
  };

  const handleDetailsClose = () => {
    setIsDetailsModalOpen(false);
    setSelectedPatient(null);
  };

  const handlePatientUpdated = () => {
    // Refresh the patient list after an action
    fetchPatients();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              All Patients ({patients.length})
            </DialogTitle>
          </DialogHeader>

          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-3 mt-4">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading patients...</div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No patients found</p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <Card key={patient.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {patient.first_name || patient.last_name
                              ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim()
                              : 'Unknown Patient'}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            Patient since {format(new Date(patient.created_at), 'MMM yyyy')}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 ml-13">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {patient.phone}
                        </div>
                        {patient.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {patient.email}
                          </div>
                        )}
                        {patient.date_of_birth && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            DOB: {format(new Date(patient.date_of_birth), 'PP')}
                          </div>
                        )}

                        {/* Next Appointment */}
                        {patient.nextAppointment ? (
                          <div className="flex items-center gap-2 text-green-600 font-medium">
                            <Clock className="h-4 w-4" />
                            Next: {format(new Date(patient.nextAppointment.start_at), 'MMM d, yyyy h:mm a')}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Clock className="h-4 w-4" />
                            No upcoming appointment
                          </div>
                        )}
                      </div>
                    </div>

                    {/* View Details Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(patient)}
                      className="ml-4 shrink-0"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <PatientDetailsModal
          open={isDetailsModalOpen}
          onClose={handleDetailsClose}
          patient={selectedPatient}
          doctorId={doctorId}
          onPatientUpdated={handlePatientUpdated}
        />
      )}
    </>
  );
}
