import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { User, Phone, Mail, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  created_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  doctorId: string;
}

export function PatientListModal({ open, onClose, doctorId }: Props) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
        (patient) =>
          patient.first_name.toLowerCase().includes(query) ||
          patient.last_name.toLowerCase().includes(query) ||
          patient.phone.includes(query) ||
          (patient.email && patient.email.toLowerCase().includes(query))
      );
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      // Get all unique patients who have appointments with this doctor
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('doctor_id', doctorId);

      if (appointmentsError) throw appointmentsError;

      // Get unique patient IDs
      const patientIds = [...new Set(appointments?.map((apt) => apt.patient_id) || [])];

      if (patientIds.length === 0) {
        setPatients([]);
        setFilteredPatients([]);
        setLoading(false);
        return;
      }

      // Fetch patient details
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .in('id', patientIds)
        .order('created_at', { ascending: false });

      if (patientsError) throw patientsError;

      setPatients(patientsData || []);
      setFilteredPatients(patientsData || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  return (
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
                          {patient.first_name} {patient.last_name}
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
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
