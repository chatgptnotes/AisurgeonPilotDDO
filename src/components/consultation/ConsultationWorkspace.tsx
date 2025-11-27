import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Mic,
  MicOff,
  Save,
  Send,
  Plus,
  Trash2,
  Pill,
  User,
  Calendar as CalendarIcon,
  Clock,
  Stethoscope,
  Activity,
  Brain,
  ClipboardList,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { whatsappService } from '@/services/whatsappService';
import { emailService } from '@/services/emailService';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  start_at: string;
  end_at: string;
  status: string;
  mode?: string;
  symptoms?: string;
  reason?: string;
  patient?: Patient;
  patients?: Patient;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface ConsultationNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  medications: Medication[];
  follow_up?: string;
  additional_notes?: string;
}

interface Props {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ConsultationWorkspace({ appointment, open, onClose, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // SOAP Notes
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');

  // Prescription
  const [medications, setMedications] = useState<Medication[]>([]);

  // Additional
  const [followUp, setFollowUp] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Voice recording
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const patientData = appointment?.patient || appointment?.patients;
  const patientName = patientData?.name || 'Unknown Patient';

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!autoSaveEnabled || !appointment) return;

    const interval = setInterval(() => {
      handleAutoSave();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoSaveEnabled, appointment, subjective, objective, assessment, plan, medications, followUp, additionalNotes]);

  // Load existing consultation notes
  useEffect(() => {
    if (appointment && open) {
      loadConsultationNotes();
    }
  }, [appointment, open]);

  const loadConsultationNotes = async () => {
    if (!appointment) return;

    try {
      const { data, error } = await supabase
        .from('consultation_notes')
        .select('*')
        .eq('appointment_id', appointment.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSubjective(data.subjective || '');
        setObjective(data.objective || '');
        setAssessment(data.assessment || '');
        setPlan(data.plan || '');
        setMedications(data.medications || []);
        setFollowUp(data.follow_up || '');
        setAdditionalNotes(data.additional_notes || '');
      }
    } catch (error) {
      console.error('Error loading consultation notes:', error);
    }
  };

  const handleAutoSave = async () => {
    if (!appointment) return;

    try {
      const consultationData = {
        appointment_id: appointment.id,
        doctor_id: appointment.doctor_id,
        patient_id: appointment.patient_id,
        subjective,
        objective,
        assessment,
        plan,
        medications,
        follow_up: followUp,
        additional_notes: additionalNotes,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('consultation_notes')
        .upsert(consultationData, { onConflict: 'appointment_id' });

      if (error) throw error;

      console.log('Auto-saved consultation notes');
    } catch (error) {
      console.error('Error auto-saving:', error);
    }
  };

  const handleManualSave = async () => {
    setLoading(true);
    try {
      await handleAutoSave();
      toast.success('Consultation notes saved successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save consultation notes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    const newMedication: Medication = {
      id: crypto.randomUUID(),
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    };
    setMedications([...medications, newMedication]);
  };

  const handleUpdateMedication = (id: string, field: keyof Medication, value: string) => {
    setMedications(medications.map(med =>
      med.id === id ? { ...med, [field]: value } : med
    ));
  };

  const handleRemoveMedication = (id: string) => {
    setMedications(medications.filter(med => med.id !== id));
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        setAudioChunks((chunks) => [...chunks, event.data]);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        // TODO: Send to transcription service (e.g., OpenAI Whisper)
        // For now, just notify user
        toast.info('Voice recording feature will transcribe audio in future updates');
        setAudioChunks([]);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success('Recording started...');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setMediaRecorder(null);
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  };

  const handleSendToPatient = async () => {
    if (!appointment || !patientData) {
      toast.error('Patient information not available');
      return;
    }

    if (!subjective && !objective && !assessment && !plan && medications.length === 0) {
      toast.error('Please add consultation notes or prescriptions before sending');
      return;
    }

    setLoading(true);
    try {
      // First, save the consultation notes
      await handleAutoSave();

      // Update appointment status to completed
      await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointment.id);

      // Get doctor name
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('full_name')
        .eq('id', appointment.doctor_id)
        .single();

      const doctorName = doctorData?.full_name || 'Doctor';

      // Prepare consultation summary
      const consultationSummary = {
        patientName,
        doctorName,
        appointmentDate: format(new Date(appointment.start_at), 'PPP'),
        subjective: subjective || 'N/A',
        objective: objective || 'N/A',
        assessment: assessment || 'N/A',
        plan: plan || 'N/A',
        medications,
        followUp: followUp || 'N/A',
        additionalNotes: additionalNotes || 'N/A',
      };

      let emailSent = false;
      let whatsappSent = false;

      // Send via Email (may fail due to CORS - gracefully handle)
      if (patientData.email) {
        try {
          await emailService.sendConsultationSummary({
            tenant_id: appointment.doctor_id,
            patient_id: appointment.patient_id,
            appointment_id: appointment.id,
            patient_name: patientName,
            patient_email: patientData.email,
            doctor_name: `Dr. ${doctorName}`,
            hospital_name: 'AI Surgeon Pilot',
            consultation_date: format(new Date(appointment.start_at), 'PPP'),
            subjective: subjective || 'N/A',
            objective: objective || 'N/A',
            assessment: assessment || 'N/A',
            plan: plan || 'N/A',
            medications: medications.map(med => ({
              name: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration,
              instructions: med.instructions || '',
            })),
            follow_up: followUp || 'N/A',
            additional_notes: additionalNotes || 'N/A',
          });
          emailSent = true;
        } catch (emailError) {
          console.warn('Email sending failed (CORS issue):', emailError);
          // Continue - WhatsApp is primary notification method
        }
      }

      // Send via WhatsApp (using prescription_ready_ddo template)
      if (patientData.phone) {
        try {
          // Format medications for WhatsApp
          const medicationsList = medications.length > 0
            ? medications.map(med =>
                `${med.name} - ${med.dosage}, ${med.frequency} for ${med.duration}`
              ).join('\n')
            : 'No medications prescribed';

          // Use prescription_ready_ddo template (9 variables)
          // Template variables: patient_name, doctor_name, date, diagnosis, prescription_id, download_link, instructions, follow_up, hospital_name
          await whatsappService.sendPrescriptionReady(
            patientName,
            patientData.phone,
            doctorName,
            format(new Date(appointment.start_at), 'PPP'),
            assessment || 'See consultation notes',
            appointment.id.substring(0, 8), // Prescription ID (first 8 chars of appointment ID)
            'Contact clinic for prescription copy', // Download link placeholder
            `Medications:\n${medicationsList}`, // Instructions with medications
            followUp || 'As needed',
            'AI Surgeon Pilot'
          );
          whatsappSent = true;
        } catch (whatsappError) {
          console.error('WhatsApp sending failed:', whatsappError);
        }
      }

      // Show appropriate success message
      if (emailSent && whatsappSent) {
        toast.success('Consultation summary sent via Email and WhatsApp!');
      } else if (whatsappSent) {
        toast.success('Consultation summary sent via WhatsApp! (Email pending)');
      } else if (emailSent) {
        toast.success('Consultation summary sent via Email!');
      } else {
        toast.warning('Consultation notes saved. Notifications pending setup.');
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error sending consultation summary:', error);
      toast.error('Failed to send consultation summary');
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              <span>Consultation Workspace</span>
            </div>
            <Badge variant="outline" className="ml-2">
              Auto-save {autoSaveEnabled ? 'ON' : 'OFF'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Patient Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-700" />
                <span className="font-semibold text-blue-900">{patientName}</span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-blue-700">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {format(new Date(appointment.start_at), 'PPP')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(appointment.start_at), 'p')}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={isRecording ? 'destructive' : 'outline'}
                size="sm"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Record Voice
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Chief Complaint */}
        {(appointment.symptoms || appointment.reason) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-yellow-900 mb-1">Chief Complaint</h4>
            <p className="text-sm text-yellow-800">
              {appointment.symptoms || appointment.reason}
            </p>
          </div>
        )}

        {/* Tabs for SOAP Notes and Prescription */}
        <Tabs defaultValue="soap" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="soap">
              <FileText className="h-4 w-4 mr-2" />
              SOAP Notes
            </TabsTrigger>
            <TabsTrigger value="prescription">
              <Pill className="h-4 w-4 mr-2" />
              Prescription
            </TabsTrigger>
          </TabsList>

          {/* SOAP Notes Tab */}
          <TabsContent value="soap" className="space-y-4 mt-4">
            {/* Subjective */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-600" />
                <Label className="font-semibold">Subjective (Patient's Account)</Label>
              </div>
              <Textarea
                placeholder="What the patient tells you: symptoms, concerns, history of present illness, past medical history..."
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <Separator />

            {/* Objective */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-gray-600" />
                <Label className="font-semibold">Objective (Clinical Findings)</Label>
              </div>
              <Textarea
                placeholder="What you observe: vital signs, physical examination findings, lab results, imaging..."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <Separator />

            {/* Assessment */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-gray-600" />
                <Label className="font-semibold">Assessment (Diagnosis)</Label>
              </div>
              <Textarea
                placeholder="Your clinical impression: diagnosis, differential diagnosis, problem list..."
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <Separator />

            {/* Plan */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="h-4 w-4 text-gray-600" />
                <Label className="font-semibold">Plan (Treatment)</Label>
              </div>
              <Textarea
                placeholder="Treatment plan: medications (see Prescription tab), procedures, referrals, patient education..."
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <Separator />

            {/* Follow-up */}
            <div>
              <Label>Follow-up Instructions</Label>
              <Textarea
                placeholder="When to return, warning signs to watch for, lifestyle modifications..."
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <Label>Additional Notes</Label>
              <Textarea
                placeholder="Any additional information, special considerations..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          </TabsContent>

          {/* Prescription Tab */}
          <TabsContent value="prescription" className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="font-semibold">Medications</Label>
              <Button onClick={handleAddMedication} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Medication
              </Button>
            </div>

            {medications.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                <Pill className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No medications prescribed yet</p>
                <Button onClick={handleAddMedication} size="sm" variant="outline" className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Medication
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {medications.map((med, index) => (
                  <div key={med.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        Medication {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMedication(med.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Medicine Name *</Label>
                        <Input
                          placeholder="e.g., Amoxicillin"
                          value={med.name}
                          onChange={(e) => handleUpdateMedication(med.id, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Dosage *</Label>
                        <Input
                          placeholder="e.g., 500mg"
                          value={med.dosage}
                          onChange={(e) => handleUpdateMedication(med.id, 'dosage', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Frequency *</Label>
                        <Input
                          placeholder="e.g., Twice daily"
                          value={med.frequency}
                          onChange={(e) => handleUpdateMedication(med.id, 'frequency', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Duration *</Label>
                        <Input
                          placeholder="e.g., 7 days"
                          value={med.duration}
                          onChange={(e) => handleUpdateMedication(med.id, 'duration', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Instructions</Label>
                        <Input
                          placeholder="e.g., Take with food"
                          value={med.instructions || ''}
                          onChange={(e) => handleUpdateMedication(med.id, 'instructions', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" onClick={handleManualSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Notes
          </Button>
          <Button onClick={handleSendToPatient} disabled={loading} className="bg-green-600 hover:bg-green-700">
            <Send className="h-4 w-4 mr-2" />
            Send to Patient
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
