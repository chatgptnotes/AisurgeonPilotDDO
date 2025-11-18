import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  Save,
  CheckCircle,
  RefreshCw,
  Download,
  Upload,
  FileText,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { useToast } from '@/hooks/use-toast';
import DocumentUpload, { DocumentCategory } from './DocumentUpload';
import PatientReportsDisplay from './PatientReportsDisplay';
import type { ConsultantVisit } from './MultiConsultantNotes';

interface ConsultantNotesData {
  diagnosis: string;
  relevance_complaints: string;
  vital_bp: string;
  rx: string;
  advice: string;
  pathology_rbs: string;
  pathology_xray: string;
  pathology_ct_mri_usg: string;
  pathology_other_blood: string;
  pathology_other_investigations: string;
  stitches_removal: string;
  dressing: string;
  speciality_injectable: string;
  doctor_signature: string;
  review: string;
  consultant_specific_notes: string; // Additional field for consultant-specific observations
}

interface VoiceAgentState {
  conversationId: string | null;
  status: 'idle' | 'listening' | 'active' | 'completed';
  summary: string;
  isProcessing: boolean;
  scriptLoaded: boolean;
}

interface ConsultantNotesFormProps {
  visitId: string;
  consultantVisit: ConsultantVisit;
  patientId: string;
  onNotesChange: (notes: ConsultantNotesData) => void;
  onMarkComplete: () => void;
}

export const ConsultantNotesForm: React.FC<ConsultantNotesFormProps> = ({
  visitId,
  consultantVisit,
  patientId,
  onNotesChange,
  onMarkComplete
}) => {
  const [formData, setFormData] = useState<ConsultantNotesData>({
    diagnosis: '',
    relevance_complaints: '',
    vital_bp: '',
    rx: '',
    advice: '',
    pathology_rbs: '',
    pathology_xray: '',
    pathology_ct_mri_usg: '',
    pathology_other_blood: '',
    pathology_other_investigations: '',
    stitches_removal: '',
    dressing: '',
    speciality_injectable: '',
    doctor_signature: consultantVisit.consultant.name,
    review: 'N/A',
    consultant_specific_notes: ''
  });

  const [voiceAgent, setVoiceAgent] = useState<VoiceAgentState>({
    conversationId: null,
    status: 'idle',
    summary: '',
    isProcessing: false,
    scriptLoaded: false
  });

  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showPatientReports, setShowPatientReports] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { toast } = useToast();

  // Debounce form data for auto-save
  const [debouncedFormData] = useDebounce(formData, 1500);

  // Load voice agent script
  useEffect(() => {
    const consultantId = `${consultantVisit.consultant.id}-${consultantVisit.id}`;
    loadVoiceAgentScript(consultantId);
  }, [consultantVisit]);

  // Auto-save notes
  useEffect(() => {
    if (debouncedFormData && Object.values(debouncedFormData).some(val => val.trim() !== '')) {
      saveNotes();
    }
  }, [debouncedFormData]);

  // Notify parent of changes
  useEffect(() => {
    onNotesChange(formData);
  }, [formData, onNotesChange]);

  const loadVoiceAgentScript = (consultantId: string) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    script.id = `voice-agent-${consultantId}`;

    script.onload = () => {
      setVoiceAgent(prev => ({ ...prev, scriptLoaded: true }));
      initializeVoiceAgent(consultantId);
    };

    script.onerror = () => {
      console.error(`Failed to load voice agent for ${consultantId}`);
      toast({
        title: "Voice Assistant Error",
        description: `Failed to load voice assistant for ${consultantVisit.consultant.name}`,
        variant: "destructive",
      });
    };

    // Remove existing script if any
    const existingScript = document.getElementById(`voice-agent-${consultantId}`);
    if (existingScript) {
      existingScript.remove();
    }

    document.head.appendChild(script);
  };

  const initializeVoiceAgent = (consultantId: string) => {
    setTimeout(() => {
      const widgetId = `voice-widget-${consultantId}`;
      const widget = document.getElementById(widgetId);

      if (widget) {
        // Setup event listeners for this specific consultant's voice agent
        widget.addEventListener('conversationStarted', handleConversationStarted);
        widget.addEventListener('conversationEnded', handleConversationEnded);
        widget.addEventListener('agentSpeaking', () => setVoiceAgent(prev => ({ ...prev, status: 'active' })));
        widget.addEventListener('userSpeaking', () => setVoiceAgent(prev => ({ ...prev, status: 'listening' })));
      }
    }, 1000);
  };

  const handleConversationStarted = (event: any) => {
    const conversationId = event.detail?.conversationId || Date.now().toString();
    setVoiceAgent(prev => ({
      ...prev,
      conversationId,
      status: 'listening'
    }));

    toast({
      title: `${consultantVisit.consultant.name} Voice Assistant`,
      description: "Voice assistant is now listening to the consultation.",
    });
  };

  const handleConversationEnded = (event: any) => {
    setVoiceAgent(prev => ({
      ...prev,
      status: 'completed'
    }));

    toast({
      title: "Conversation Complete",
      description: `Use 'Capture Summary' to extract notes for ${consultantVisit.consultant.name}.`,
    });
  };

  const captureVoiceSummary = async () => {
    if (!voiceAgent.conversationId) {
      toast({
        title: "No Conversation",
        description: "No active conversation to capture",
        variant: "destructive",
      });
      return;
    }

    setVoiceAgent(prev => ({ ...prev, isProcessing: true }));

    try {
      // Simulate voice summary capture - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockSummary = generateMockSummary();
      setVoiceAgent(prev => ({ ...prev, summary: mockSummary, isProcessing: false }));
      populateFormFromVoiceSummary(mockSummary);

      toast({
        title: "Summary Captured",
        description: `Voice notes for ${consultantVisit.consultant.name} have been processed.`,
      });

    } catch (error) {
      setVoiceAgent(prev => ({ ...prev, isProcessing: false }));
      toast({
        title: "Processing Error",
        description: "Failed to capture voice summary",
        variant: "destructive",
      });
    }
  };

  const generateMockSummary = (): string => {
    // Generate consultant-specific mock summary based on specialty
    const specialty = consultantVisit.consultant.specialty.toLowerCase();

    if (specialty.includes('cardio')) {
      return `
CARDIOLOGY CONSULTATION

CHIEF COMPLAINT: Chest pain and shortness of breath
DIAGNOSIS: Angina pectoris, possible coronary artery disease
VITAL SIGNS: BP: 150/90 mmHg, Pulse: 88/min, regular
EXAMINATION: Heart sounds S1, S2 heard, no murmurs
INVESTIGATIONS: ECG shows ST-T changes, Echo recommended
TREATMENT: Aspirin 75mg OD, Atorvastatin 20mg HS
ADVICE: Low salt diet, regular exercise, follow-up in 2 weeks
      `;
    } else if (specialty.includes('ortho')) {
      return `
ORTHOPEDIC CONSULTATION

CHIEF COMPLAINT: Knee pain and stiffness
DIAGNOSIS: Osteoarthritis right knee
EXAMINATION: Tenderness over medial joint line, limited ROM
INVESTIGATIONS: X-ray shows joint space narrowing
TREATMENT: Diclofenac 50mg BD, Calcium + Vitamin D
PHYSIOTHERAPY: Quadriceps strengthening exercises
ADVICE: Weight reduction, avoid stairs, hot fomentation
      `;
    } else if (specialty.includes('ophthal')) {
      return `
OPHTHALMOLOGY CONSULTATION

CHIEF COMPLAINT: Blurred vision and eye strain
DIAGNOSIS: Refractive error, possible early cataract
EXAMINATION: Visual acuity 6/12 OD, 6/9 OS
INVESTIGATIONS: Refraction test, Fundus examination normal
TREATMENT: Spectacles prescribed, Lubricating drops
ADVICE: Regular eye check-ups, avoid eye strain
      `;
    } else {
      return `
GENERAL MEDICINE CONSULTATION

CHIEF COMPLAINT: Fever and body ache
DIAGNOSIS: Viral fever
VITAL SIGNS: Temperature: 101°F, BP: 120/80 mmHg
EXAMINATION: Throat congestion, no lymphadenopathy
TREATMENT: Paracetamol 500mg TDS, adequate rest
ADVICE: Increase fluid intake, return if symptoms worsen
      `;
    }
  };

  const populateFormFromVoiceSummary = (summary: string) => {
    // Simple parsing logic - can be enhanced with AI
    const lines = summary.split('\n').filter(line => line.trim());

    let diagnosis = '';
    let complaints = '';
    let vitals = '';
    let treatment = '';
    let advice = '';

    lines.forEach(line => {
      const upperLine = line.toUpperCase();
      if (upperLine.includes('DIAGNOSIS:')) {
        diagnosis = line.replace(/.*DIAGNOSIS:\s*/i, '');
      } else if (upperLine.includes('CHIEF COMPLAINT:') || upperLine.includes('COMPLAINT:')) {
        complaints = line.replace(/.*COMPLAINT:\s*/i, '');
      } else if (upperLine.includes('VITAL') || upperLine.includes('BP:')) {
        vitals = line.replace(/.*(?:VITAL SIGNS:|BP:)\s*/i, '');
      } else if (upperLine.includes('TREATMENT:')) {
        treatment = line.replace(/.*TREATMENT:\s*/i, '');
      } else if (upperLine.includes('ADVICE:')) {
        advice = line.replace(/.*ADVICE:\s*/i, '');
      }
    });

    setFormData(prev => ({
      ...prev,
      diagnosis: diagnosis || prev.diagnosis,
      relevance_complaints: complaints || prev.relevance_complaints,
      vital_bp: vitals || prev.vital_bp,
      rx: treatment || prev.rx,
      advice: advice || prev.advice,
      consultant_specific_notes: summary
    }));
  };

  const handleInputChange = (field: keyof ConsultantNotesData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      // TODO: Implement actual database save
      await new Promise(resolve => setTimeout(resolve, 500));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentTextExtracted = (category: DocumentCategory, extractedData: Record<string, string>) => {
    const updatedFormData = { ...formData };

    Object.entries(extractedData).forEach(([key, value]) => {
      if (value && value.trim()) {
        if (key in updatedFormData) {
          const currentValue = updatedFormData[key as keyof ConsultantNotesData];
          if (currentValue && currentValue.trim()) {
            updatedFormData[key as keyof ConsultantNotesData] = `${currentValue}\n\n[${consultantVisit.consultant.name} - ${category}]:\n${value}`;
          } else {
            updatedFormData[key as keyof ConsultantNotesData] = value;
          }
        }
      }
    });

    setFormData(updatedFormData);
    toast({
      title: "Document Processed",
      description: `Document text extracted for ${consultantVisit.consultant.name}`,
    });
  };

  const handleLabResultSelection = (formattedText: string, category: string) => {
    const targetField = category.toLowerCase().includes('blood') ? 'pathology_other_blood' : 'pathology_rbs';
    const currentValue = formData[targetField];
    const newValue = currentValue ? `${currentValue}\n\n[${consultantVisit.consultant.name}]:\n${formattedText}` : formattedText;
    setFormData(prev => ({ ...prev, [targetField]: newValue }));
  };

  const handleRadiologyResultSelection = (formattedText: string, category: string) => {
    let targetField: keyof ConsultantNotesData;
    if (category.toLowerCase().includes('x-ray')) {
      targetField = 'pathology_xray';
    } else if (category.toLowerCase().includes('ct') || category.toLowerCase().includes('mri')) {
      targetField = 'pathology_ct_mri_usg';
    } else {
      targetField = 'pathology_other_investigations';
    }

    const currentValue = formData[targetField];
    const newValue = currentValue ? `${currentValue}\n\n[${consultantVisit.consultant.name}]:\n${formattedText}` : formattedText;
    setFormData(prev => ({ ...prev, [targetField]: newValue }));
  };

  const handleMultipleResultsSelection = (labSummary: string, radiologySummary: string) => {
    const updates: Partial<ConsultantNotesData> = {};

    if (labSummary && labSummary.trim() !== 'No lab results available.') {
      updates.pathology_other_blood = formData.pathology_other_blood
        ? `${formData.pathology_other_blood}\n\n[${consultantVisit.consultant.name} - Lab Summary]:\n${labSummary}`
        : labSummary;
    }

    if (radiologySummary && radiologySummary.trim() !== 'No radiology results available.') {
      updates.pathology_other_investigations = formData.pathology_other_investigations
        ? `${formData.pathology_other_investigations}\n\n[${consultantVisit.consultant.name} - Radiology Summary]:\n${radiologySummary}`
        : radiologySummary;
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

  const consultantId = `${consultantVisit.consultant.id}-${consultantVisit.id}`;

  return (
    <div className="space-y-6">
      {/* Voice Agent Section */}
      <Card className="border-l-4" style={{ borderLeftColor: `var(--${consultantVisit.consultant.color}-500)` }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Mic className="h-4 w-4" />
            {consultantVisit.consultant.name} Voice Assistant
            {voiceAgent.scriptLoaded && (
              <Badge variant="secondary" className="text-xs">Ready</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                voiceAgent.status === 'idle' ? 'bg-gray-400' :
                voiceAgent.status === 'listening' ? 'bg-yellow-500 animate-pulse' :
                voiceAgent.status === 'active' ? 'bg-green-500 animate-pulse' :
                'bg-blue-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                Status: {voiceAgent.status.charAt(0).toUpperCase() + voiceAgent.status.slice(1)}
              </span>
            </div>

            {voiceAgent.status === 'completed' && (
              <Button
                size="sm"
                onClick={captureVoiceSummary}
                disabled={voiceAgent.isProcessing}
                className="flex items-center gap-2"
              >
                {voiceAgent.isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Capture Summary
              </Button>
            )}
          </div>

          {/* Voice Widget Container */}
          <div className="flex justify-center bg-gray-50 p-3 rounded-lg">
            {voiceAgent.scriptLoaded ? (
              <div id={`voice-widget-${consultantId}`}>
                <elevenlabs-convai
                  agent-id={import.meta.env.VITE_ELEVENLABS_AGENT_ID}
                  style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
                />
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-xs">Loading voice assistant...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 print:hidden">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowDocumentUpload(!showDocumentUpload)}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {showDocumentUpload ? 'Hide Upload' : 'Upload Docs'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowPatientReports(!showPatientReports)}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          {showPatientReports ? 'Hide Reports' : 'Patient Reports'}
        </Button>
        <Button
          size="sm"
          onClick={() => onMarkComplete()}
          disabled={consultantVisit.status === 'completed'}
          className="flex items-center gap-2 ml-auto"
        >
          <CheckCircle className="h-4 w-4" />
          Mark Complete
        </Button>
      </div>

      {/* Document Upload */}
      {showDocumentUpload && (
        <DocumentUpload
          onTextExtracted={handleDocumentTextExtracted}
          className="w-full"
        />
      )}

      {/* Patient Reports */}
      {showPatientReports && (
        <PatientReportsDisplay
          patientId={patientId}
          onSelectLabResult={handleLabResultSelection}
          onSelectRadiologyResult={handleRadiologyResultSelection}
          onSelectMultipleResults={handleMultipleResultsSelection}
          className="w-full"
        />
      )}

      {/* Notes Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {consultantVisit.consultant.name} - Clinical Notes
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {saving && (
                <div className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Saving...
                </div>
              )}
              {lastSaved && (
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Consultant-specific notes */}
          <div>
            <Label className="text-sm font-medium text-gray-700">
              {consultantVisit.consultant.specialty} Specific Notes
            </Label>
            <Textarea
              value={formData.consultant_specific_notes}
              onChange={(e) => handleInputChange('consultant_specific_notes', e.target.value)}
              placeholder={`Specific observations and notes from ${consultantVisit.consultant.name}...`}
              className="mt-1 min-h-[100px]"
            />
          </div>

          {/* Diagnosis */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Diagnosis</Label>
            <Textarea
              value={formData.diagnosis}
              onChange={(e) => handleInputChange('diagnosis', e.target.value)}
              placeholder="Diagnosis from this consultation..."
              className="mt-1 min-h-[80px]"
            />
          </div>

          {/* Complaints */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Complaints</Label>
            <Textarea
              value={formData.relevance_complaints}
              onChange={(e) => handleInputChange('relevance_complaints', e.target.value)}
              placeholder="Patient complaints relevant to this specialty..."
              className="mt-1 min-h-[60px]"
            />
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left column */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Vitals</Label>
                <Input
                  value={formData.vital_bp}
                  onChange={(e) => handleInputChange('vital_bp', e.target.value)}
                  placeholder="BP, Pulse, Temperature..."
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Advice</Label>
                <Textarea
                  value={formData.advice}
                  onChange={(e) => handleInputChange('advice', e.target.value)}
                  placeholder="Medical advice and recommendations..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Treatment/Rx</Label>
                <Textarea
                  value={formData.rx}
                  onChange={(e) => handleInputChange('rx', e.target.value)}
                  placeholder="Medications and treatment plan..."
                  className="min-h-[120px]"
                />
              </div>
            </div>
          </div>

          {/* Doctor signature */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Doctor Name</Label>
            <Input
              value={formData.doctor_signature}
              onChange={(e) => handleInputChange('doctor_signature', e.target.value)}
              placeholder="Doctor name..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsultantNotesForm;