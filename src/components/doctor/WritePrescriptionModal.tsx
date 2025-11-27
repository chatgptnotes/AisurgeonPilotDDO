import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Pill, Plus, Trash2, Save, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  doctorId: string;
  onPrescriptionSaved?: () => void;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const frequencyOptions = [
  { value: 'once_daily', label: 'Once Daily' },
  { value: 'twice_daily', label: 'Twice Daily (BD)' },
  { value: 'thrice_daily', label: 'Thrice Daily (TDS)' },
  { value: 'four_times', label: 'Four Times Daily (QID)' },
  { value: 'every_6_hours', label: 'Every 6 Hours' },
  { value: 'every_8_hours', label: 'Every 8 Hours' },
  { value: 'before_meals', label: 'Before Meals' },
  { value: 'after_meals', label: 'After Meals' },
  { value: 'at_bedtime', label: 'At Bedtime' },
  { value: 'as_needed', label: 'As Needed (PRN)' },
  { value: 'other', label: 'Other' },
];

const durationOptions = [
  { value: '3_days', label: '3 Days' },
  { value: '5_days', label: '5 Days' },
  { value: '7_days', label: '7 Days' },
  { value: '10_days', label: '10 Days' },
  { value: '14_days', label: '14 Days' },
  { value: '1_month', label: '1 Month' },
  { value: '2_months', label: '2 Months' },
  { value: '3_months', label: '3 Months' },
  { value: 'continuous', label: 'Continuous' },
  { value: 'other', label: 'Other' },
];

export function WritePrescriptionModal({
  open,
  onClose,
  patientId,
  patientName,
  doctorId,
  onPrescriptionSaved
}: Props) {
  const [medications, setMedications] = useState<Medication[]>([
    { id: '1', name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const addMedication = () => {
    setMedications([
      ...medications,
      { id: Date.now().toString(), name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
  };

  const removeMedication = (id: string) => {
    if (medications.length > 1) {
      setMedications(medications.filter(m => m.id !== id));
    }
  };

  const updateMedication = (id: string, field: keyof Medication, value: string) => {
    setMedications(medications.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const resetForm = () => {
    setMedications([{ id: '1', name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    setDiagnosis('');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    // Validate at least one medication has a name
    const validMeds = medications.filter(m => m.name.trim());
    if (validMeds.length === 0) {
      toast.error('Please add at least one medication');
      return;
    }

    setSaving(true);

    try {
      // Get doctor name from localStorage
      const doctorName = localStorage.getItem('doctor_name') || 'Doctor';

      // Generate a unique prescription ID
      const prescriptionId = `RX-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Create medications array as JSONB
      const medicationsData = validMeds.map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions,
      }));

      // Debug: Log the patient ID being used
      console.log('[Prescription Save] Patient ID:', patientId, 'Patient Name:', patientName);

      // Save to prescriptions table - always published so patient can see it
      const { error } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          doctor_name: doctorName,
          visit_id: prescriptionId,
          prescription_date: new Date().toISOString(),
          diagnosis: diagnosis || null,
          notes: notes || null,
          medications: medicationsData,
          is_published: true,
          published_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving prescription:', error);
        throw new Error(error.message);
      }

      toast.success('Prescription saved! Patient can now view it in their portal.');

      onPrescriptionSaved?.();
      handleClose();

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-blue-600" />
            Write Prescription for {patientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Diagnosis */}
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Input
              id="diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Enter diagnosis..."
            />
          </div>

          {/* Medications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Medications</Label>
              <Button variant="outline" size="sm" onClick={addMedication}>
                <Plus className="h-4 w-4 mr-1" />
                Add Medication
              </Button>
            </div>

            {medications.map((med, index) => (
              <Card key={med.id} className="p-4">
                <div className="flex items-start gap-2 mb-3">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <Input
                      value={med.name}
                      onChange={(e) => updateMedication(med.id, 'name', e.target.value)}
                      placeholder="Medication name (e.g., Paracetamol 500mg)"
                      className="font-medium"
                    />
                  </div>
                  {medications.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMedication(med.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Dosage</Label>
                    <Input
                      value={med.dosage}
                      onChange={(e) => updateMedication(med.id, 'dosage', e.target.value)}
                      placeholder="e.g., 1 tablet"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Frequency</Label>
                    <Select
                      value={med.frequency}
                      onValueChange={(value) => updateMedication(med.id, 'frequency', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Duration</Label>
                    <Select
                      value={med.duration}
                      onValueChange={(value) => updateMedication(med.id, 'duration', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {durationOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-3">
                  <Label className="text-xs text-gray-500">Special Instructions</Label>
                  <Input
                    value={med.instructions}
                    onChange={(e) => updateMedication(med.id, 'instructions', e.target.value)}
                    placeholder="e.g., Take with food, avoid alcohol"
                    className="mt-1"
                  />
                </div>
              </Card>
            ))}
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes / Advice</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional instructions or advice for the patient..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Prescription
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
