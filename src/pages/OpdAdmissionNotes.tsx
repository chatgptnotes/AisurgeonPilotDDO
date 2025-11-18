import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Printer, Loader2, FileText, Mic, Download, RefreshCw, Upload, Stethoscope } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { useToast } from '@/hooks/use-toast';
import DocumentUpload, { DocumentCategory } from '@/components/DocumentUpload';
import PatientReportsDisplay from '@/components/PatientReportsDisplay';
import MultiConsultantNotes from '@/components/MultiConsultantNotes';

interface PatientData {
  id: string;
  visit_id?: string;
  patient_id?: string;
  patients?: {
    id: string;
    name: string;
    gender?: string;
    age?: number;
    date_of_birth?: string;
    patients_id?: string;
    address?: string;
    phone?: string;
    corporate?: string;
  };
  visit_type?: string;
  appointment_with?: string;
  diagnosis?: string;
  reason_for_visit?: string;
  created_at?: string;
}

interface OpdAdmissionNotesData {
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
}

const OpdAdmissionNotes = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showPatientReports, setShowPatientReports] = useState(false);
  const [useMultiConsultant, setUseMultiConsultant] = useState(false);

  // Voice agent conversation state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationStatus, setConversationStatus] = useState<'idle' | 'listening' | 'active' | 'completed'>('idle');
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isProcessingSummary, setIsProcessingSummary] = useState(false);

  // Form state
  const [formData, setFormData] = useState<OpdAdmissionNotesData>({
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
    doctor_signature: '',
    review: 'N/A',
  });

  // Debounce form data for auto-save
  const [debouncedFormData] = useDebounce(formData, 1500);

  // Load ElevenLabs ConvAI script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';

    script.onload = () => {
      setScriptLoaded(true);
      console.log('ElevenLabs ConvAI script loaded successfully');

      // Wait for the widget to initialize and then add event listeners
      setTimeout(() => {
        // Check if ElevenLabs ConvAI widget is available
        const convaiWidget = document.querySelector('elevenlabs-convai');

        if (convaiWidget) {
          console.log('ConvAI widget found, setting up event listeners and positioning');

          // Apply positioning styles directly to the widget
          (convaiWidget as HTMLElement).style.position = 'fixed';
          (convaiWidget as HTMLElement).style.bottom = '120px';
          (convaiWidget as HTMLElement).style.right = '20px';
          (convaiWidget as HTMLElement).style.zIndex = '1000';

          // Also check for any child elements that might be the actual widget
          const widgetElements = [
            convaiWidget.querySelector('.elevenlabs-widget'),
            convaiWidget.querySelector('.chat-widget'),
            convaiWidget.querySelector('[class*="widget"]'),
            convaiWidget.shadowRoot?.querySelector('*')
          ].filter(Boolean);

          widgetElements.forEach(element => {
            if (element) {
              (element as HTMLElement).style.position = 'fixed';
              (element as HTMLElement).style.bottom = '120px';
              (element as HTMLElement).style.right = '20px';
              (element as HTMLElement).style.zIndex = '1000';
            }
          });

          // Listen for conversation events on the widget itself
          convaiWidget.addEventListener('conversationStarted', (event: any) => {
            console.log('Conversation started:', event.detail);
            setConversationId(event.detail?.conversationId || Date.now().toString());
            setConversationStatus('listening');
            toast({
              title: "ANOHRA Activated",
              description: "Voice assistant is now listening to the conversation.",
            });
          });

          convaiWidget.addEventListener('conversationEnded', (event: any) => {
            console.log('Conversation ended:', event.detail);
            setConversationStatus('completed');
            toast({
              title: "Conversation Complete",
              description: "Use 'Capture Summary' to extract ANOHRA's notes.",
            });
          });

          convaiWidget.addEventListener('agentSpeaking', () => {
            setConversationStatus('active');
          });

          convaiWidget.addEventListener('userSpeaking', () => {
            setConversationStatus('listening');
          });

          // Alternative: Check for global ElevenLabs events
          if (window.ElevenLabs) {
            console.log('ElevenLabs SDK available');
          }
        } else {
          console.log('ConvAI widget not found, will retry...');
          // Retry after another delay
          setTimeout(() => {
            const retryWidget = document.querySelector('elevenlabs-convai');
            if (retryWidget) {
              console.log('ConvAI widget found on retry, applying positioning');
              (retryWidget as HTMLElement).style.position = 'fixed';
              (retryWidget as HTMLElement).style.bottom = '120px';
              (retryWidget as HTMLElement).style.right = '20px';
              (retryWidget as HTMLElement).style.zIndex = '1000';
            }
          }, 2000);
        }
      }, 1000);

      // Additional positioning check after longer delay
      setTimeout(() => {
        const allPossibleSelectors = [
          'elevenlabs-convai',
          '.elevenlabs-widget',
          '.elevenlabs-chat-widget',
          '.convai-widget',
          '[class*="elevenlabs"]',
          '[id*="elevenlabs"]'
        ];

        allPossibleSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            if (element && (element as HTMLElement).style) {
              (element as HTMLElement).style.position = 'fixed';
              (element as HTMLElement).style.bottom = '120px';
              (element as HTMLElement).style.right = '20px';
              (element as HTMLElement).style.zIndex = '1000';
              console.log('Applied positioning to:', selector);
            }
          });
        });
      }, 3000);
    };

    script.onerror = () => {
      console.error('Failed to load ElevenLabs ConvAI script');
      toast({
        title: "Voice Assistant Error",
        description: "Failed to load voice assistant. Please refresh the page.",
        variant: "destructive",
      });
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script when component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [toast]);

  // Fetch patient and visit data
  useEffect(() => {
    const fetchData = async () => {
      if (!visitId) {
        toast({
          title: "Error",
          description: "Visit ID is missing",
          variant: "destructive",
        });
        navigate(-1);
        return;
      }

      try {
        // Fetch visit data with patient details
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select(`
            *,
            patients!inner (
              id,
              name,
              gender,
              age,
              date_of_birth,
              patients_id,
              address,
              phone,
              corporate
            )
          `)
          .eq('visit_id', visitId)
          .single();

        if (visitError) {
          console.error('Error fetching visit data:', visitError);
          throw visitError;
        }

        setPatientData(visitData);

        // Load existing OPD admission notes if available
        if (visitData.opd_admission_notes) {
          setFormData(visitData.opd_admission_notes as OpdAdmissionNotesData);
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        toast({
          title: "Error",
          description: "Failed to load patient data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [visitId, navigate, toast]);

  // Auto-save when debounced data changes
  useEffect(() => {
    const saveData = async () => {
      if (!visitId || !patientData || loading) return;

      // Check if there's actual data to save (not all empty)
      const hasData = Object.values(debouncedFormData).some(val => val.trim() !== '');
      if (!hasData) return;

      setSaving(true);

      try {
        const { error } = await supabase
          .from('visits')
          .update({
            opd_admission_notes: debouncedFormData,
            updated_at: new Date().toISOString()
          })
          .eq('visit_id', visitId);

        if (error) {
          console.error('Error saving OPD admission notes:', error);
          toast({
            title: "Save Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setLastSaved(new Date());
        }
      } catch (error) {
        console.error('Exception while saving:', error);
      } finally {
        setSaving(false);
      }
    };

    saveData();
  }, [debouncedFormData, visitId, patientData, loading, toast]);

  const handleInputChange = (field: keyof OpdAdmissionNotesData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleManualSave = async () => {
    if (!visitId) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('visits')
        .update({
          opd_admission_notes: formData,
          updated_at: new Date().toISOString()
        })
        .eq('visit_id', visitId);

      if (error) {
        toast({
          title: "Save Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setLastSaved(new Date());
        toast({
          title: "Saved",
          description: "OPD admission notes saved successfully",
        });
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: "Error",
        description: "Failed to save OPD admission notes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Function to fetch conversation data from ElevenLabs
  const fetchConversationData = async (conversationId: string) => {
    try {
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;

      if (!apiKey) {
        throw new Error('ElevenLabs API key not configured. Please add VITE_ELEVENLABS_API_KEY to your environment.');
      }

      console.log('=== FETCH CONVERSATION START ===');
      console.log('Conversation ID:', conversationId);
      console.log('API Key status:', apiKey ? `Set (${apiKey.substring(0, 8)}...)` : 'Missing');

      // Use the exact endpoint specified by the user
      const endpoint = `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`;
      console.log('Endpoint URL:', endpoint);

      const headers = {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      console.log('Request headers:', headers);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers,
      });

      console.log('Response status:', response.status);
      console.log('Response statusText:', response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);

        let errorMessage = `HTTP ${response.status} - ${response.statusText}`;

        try {
          const errorData = JSON.parse(errorText);
          console.error('Parsed error data:', errorData);
          errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = errorText || errorMessage;
        }

        throw new Error(`API Error: ${errorMessage}`);
      }

      const responseText = await response.text();
      console.log('Raw response text:', responseText.substring(0, 500));

      let conversationData;
      try {
        conversationData = JSON.parse(responseText);
        console.log('Parsed conversation data keys:', Object.keys(conversationData));
        console.log('Full conversation data structure:', conversationData);
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
      }

      console.log('=== FETCH CONVERSATION SUCCESS ===');
      return conversationData;

    } catch (error) {
      console.error('=== FETCH CONVERSATION ERROR ===');
      console.error('Error details:', error);
      throw error;
    }
  };

  // Function to parse AI summary and populate form fields
  const parseAndPopulateSummary = (summary: string) => {
    try {
      // Parse the AI-generated summary and extract relevant sections
      const sections = {
        diagnosis: '',
        complaints: '',
        vitals: '',
        advice: '',
        rx: '',
        procedures: '',
        pathology_rbs: '',
        pathology_xray: '',
        pathology_ct_mri_usg: '',
        dressing: '',
        stitch_removal: '',
        doctor_signature: '',
      };

      // Simple parsing logic - you can enhance this based on ANOHRA's output format
      const lines = summary.split('\n').map(line => line.trim()).filter(Boolean);

      let currentSection = '';
      let currentContent = '';

      for (const line of lines) {
        if (line.toLowerCase().includes('diagnosis') || line.toLowerCase().includes('condition')) {
          if (currentSection && currentContent) {
            sections[currentSection] = currentContent.trim();
          }
          currentSection = 'diagnosis';
          currentContent = line.replace(/^[^:]*:?\s*/, '');
        } else if (line.toLowerCase().includes('complaint') || line.toLowerCase().includes('symptom')) {
          if (currentSection && currentContent) {
            sections[currentSection] = currentContent.trim();
          }
          currentSection = 'complaints';
          currentContent = line.replace(/^[^:]*:?\s*/, '');
        } else if (line.toLowerCase().includes('vital') || line.toLowerCase().includes('bp') || line.toLowerCase().includes('blood pressure')) {
          if (currentSection && currentContent) {
            sections[currentSection] = currentContent.trim();
          }
          currentSection = 'vitals';
          currentContent = line.replace(/^[^:]*:?\s*/, '');
        } else if (line.toLowerCase().includes('advice') || line.toLowerCase().includes('recommendation')) {
          if (currentSection && currentContent) {
            sections[currentSection] = currentContent.trim();
          }
          currentSection = 'advice';
          currentContent = line.replace(/^[^:]*:?\s*/, '');
        } else if (line.toLowerCase().includes('prescription') || line.toLowerCase().includes('medication') || line.toLowerCase().includes('rx')) {
          if (currentSection && currentContent) {
            sections[currentSection] = currentContent.trim();
          }
          currentSection = 'rx';
          currentContent = line.replace(/^[^:]*:?\s*/, '');
        } else if (line.toLowerCase().includes('procedure')) {
          if (currentSection && currentContent) {
            sections[currentSection] = currentContent.trim();
          }
          currentSection = 'procedures';
          currentContent = line.replace(/^[^:]*:?\s*/, '');
        } else if (currentSection) {
          currentContent += ' ' + line;
        }
      }

      // Handle the last section
      if (currentSection && currentContent) {
        sections[currentSection] = currentContent.trim();
      }

      // Update form data with parsed sections
      setFormData(prev => ({
        ...prev,
        diagnosis: sections.diagnosis || prev.diagnosis,
        relevance_complaints: sections.complaints || prev.relevance_complaints,
        vital_bp: sections.vitals || prev.vital_bp,
        advice: sections.advice || prev.advice,
        rx: sections.rx || prev.rx,
        speciality_injectable: sections.procedures || prev.speciality_injectable,
      }));

      toast({
        title: "Summary Applied",
        description: "ANOHRA's summary has been populated into the form fields.",
      });

    } catch (error) {
      console.error('Error parsing summary:', error);
      toast({
        title: "Parsing Error",
        description: "Failed to parse ANOHRA's summary. Please review manually.",
        variant: "destructive",
      });
    }
  };

  // Function to handle conversation completion
  const handleConversationComplete = async () => {
    if (!conversationId) {
      toast({
        title: "No Conversation",
        description: "No conversation ID available to fetch summary.",
        variant: "destructive",
      });
      return;
    }

    // Check if this is a simulated conversation
    if (conversationId.startsWith('simulated-')) {
      toast({
        title: "Test Summary Already Applied",
        description: "The simulated summary has already been populated. No API fetch needed.",
      });
      return;
    }

    setIsProcessingSummary(true);

    try {
      // Wait a moment for the conversation to be processed on ElevenLabs servers
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('Fetching conversation data for ID:', conversationId);
      const conversationData = await fetchConversationData(conversationId);

      console.log('Full conversation data:', conversationData);

      // Look for conversation transcript and summary in different possible locations
      let summaryContent = '';
      let fullTranscript = '';

      if (conversationData) {
        console.log('Full conversation data structure:', JSON.stringify(conversationData, null, 2));

        // Check for transcript field (most common in ElevenLabs API)
        if (conversationData.transcript) {
          fullTranscript = conversationData.transcript;
          summaryContent = conversationData.transcript;
          console.log('Found transcript field:', fullTranscript);
        }

        // Check for messages array
        if (conversationData.messages && Array.isArray(conversationData.messages)) {
          const allMessages = conversationData.messages.map((msg: any) => {
            const role = msg.role || msg.speaker || 'unknown';
            const content = msg.content || msg.text || msg.message || '';
            return `${role.toUpperCase()}: ${content}`;
          }).join('\\n\\n');

          if (allMessages) {
            fullTranscript = allMessages;
            if (!summaryContent) summaryContent = allMessages;
            console.log('Found messages array, created transcript:', fullTranscript);
          }

          // Find the last assistant message for summary
          const assistantMessages = conversationData.messages.filter(
            (msg: any) => (msg.role === 'assistant' || msg.speaker === 'assistant') && (msg.content || msg.text)
          );

          if (assistantMessages.length > 0) {
            const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
            const assistantContent = lastAssistantMessage.content || lastAssistantMessage.text;
            if (assistantContent) {
              summaryContent = assistantContent;
              console.log('Found assistant message for summary:', assistantContent);
            }
          }
        }

        // Check for other possible fields
        if (!summaryContent && conversationData.summary) {
          summaryContent = conversationData.summary;
          console.log('Found summary field:', summaryContent);
        }

        if (!summaryContent && conversationData.conversation_text) {
          fullTranscript = conversationData.conversation_text;
          summaryContent = conversationData.conversation_text;
          console.log('Found conversation_text field:', conversationData.conversation_text);
        }

        if (!summaryContent && conversationData.conversation) {
          fullTranscript = conversationData.conversation;
          summaryContent = conversationData.conversation;
          console.log('Found conversation field:', conversationData.conversation);
        }

        // If we have a full transcript, extract structured summary
        if (fullTranscript && !summaryContent.includes('DIAGNOSIS') && !summaryContent.includes('CONSULTATION')) {
          const summaryMatch = fullTranscript.match(/(?:summary|opd summary|consultation summary|diagnosis)[:\s]*([\s\S]*)/i);
          if (summaryMatch) {
            summaryContent = summaryMatch[1].trim();
            console.log('Extracted structured summary from transcript:', summaryContent);
          }
        }
      }

      if (summaryContent) {
        setAiSummary(summaryContent);
        parseAndPopulateSummary(summaryContent);

        toast({
          title: "Summary Captured",
          description: "ANOHRA's summary has been extracted and populated into the form.",
        });
      } else {
        console.warn('No summary content found in conversation data');
        toast({
          title: "No Summary Found",
          description: "Could not extract summary from conversation. The conversation may still be processing.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error processing conversation:', error);
      toast({
        title: "Processing Error",
        description: `Failed to retrieve ANOHRA's summary: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessingSummary(false);
    }
  };

  // Function to manually trigger summary capture
  const captureCurrentSummary = () => {
    if (conversationId) {
      // Check if this is a simulated conversation
      if (conversationId.startsWith('simulated-')) {
        // For simulated conversations, the summary is already captured
        toast({
          title: "Summary Already Applied",
          description: "The test summary has already been populated into the form fields.",
        });
        return;
      }

      // For real conversations, fetch from API
      handleConversationComplete();
    } else {
      // If no conversation ID, try to simulate or provide manual input
      toast({
        title: "No Active Conversation",
        description: "Start a conversation with ANOHRA first, or use the manual summary input.",
        variant: "destructive",
      });
    }
  };

  // Test function to simulate a conversation (for development/testing)
  const simulateConversation = () => {
    const mockSummary = `
CONSULTATION SUMMARY

DIAGNOSIS: Hypertension with Type 2 Diabetes Mellitus
Patient presents with elevated blood pressure readings and blood glucose levels.

COMPLAINTS:
Patient reports frequent headaches, fatigue, and excessive thirst for the past 2 weeks.
Also experiencing blurred vision occasionally.

VITALS:
BP: 150\\/95 mmHg
Pulse: 88\\/min
Temperature: 98.6°F
Weight: 75 kg

PRESCRIPTION:
1. Amlodipine 5mg - Once daily after breakfast
2. Metformin 500mg - Twice daily before meals
3. Aspirin 75mg - Once daily after dinner

ADVICE:
- Regular blood pressure monitoring
- Diabetic diet with reduced carbohydrates
- Daily 30-minute walk
- Follow-up after 2 weeks

PROCEDURES:
Blood glucose testing performed
Blood pressure monitoring
    `;

    setAiSummary(mockSummary);
    setConversationId('simulated-' + Date.now());
    setConversationStatus('completed');
    parseAndPopulateSummary(mockSummary);

    toast({
      title: "Test Summary Applied",
      description: "Simulated ANOHRA summary has been populated for testing.",
    });
  };

  // Function to manually input conversation ID
  const handleManualConversationId = async () => {
    const conversationIdInput = prompt('Enter the conversation ID to fetch transcript:');
    if (!conversationIdInput || !conversationIdInput.trim()) {
      return;
    }

    const trimmedId = conversationIdInput.trim();
    setConversationId(trimmedId);
    setConversationStatus('active');
    setIsProcessingSummary(true);

    try {
      console.log('Fetching conversation data for ID:', trimmedId);

      // Fetch the conversation data using the exact endpoint
      const conversationData = await fetchConversationData(trimmedId);

      console.log('Raw conversation data received:', conversationData);

      if (!conversationData) {
        throw new Error('No conversation data received from the API');
      }

      // Extract transcript content from various possible fields
      let transcriptContent = '';
      let displayContent = '';

      // First, check for ElevenLabs specific transcript array format
      if (conversationData.transcript && Array.isArray(conversationData.transcript)) {
        console.log('Found ElevenLabs transcript array with', conversationData.transcript.length, 'turns');

        const transcriptMessages = conversationData.transcript.map((turn: any) => {
          const role = turn.role || 'speaker';
          const message = turn.message || turn.content || turn.text || '';

          // Skip empty messages
          if (!message || message.trim().length === 0) {
            return '';
          }

          return `${role.toUpperCase()}: ${message}`;
        }).filter(msg => msg.length > 0);

        if (transcriptMessages.length > 0) {
          transcriptContent = transcriptMessages.join('\n\n');
          displayContent = transcriptContent;
          console.log('Built transcript from ElevenLabs transcript array:', transcriptContent.substring(0, 200));
        }
      }

      // Try different possible field names for string content
      if (!transcriptContent) {
        const possibleFields = [
          'conversation_text',
          'conversation',
          'text',
          'content',
          'summary'
        ];

        for (const field of possibleFields) {
          if (conversationData[field] && typeof conversationData[field] === 'string') {
            transcriptContent = conversationData[field];
            displayContent = transcriptContent;
            console.log(`Found transcript in field '${field}':`, transcriptContent.substring(0, 200));
            break;
          }
        }
      }

      // Check for generic messages array format
      if (!transcriptContent && conversationData.messages && Array.isArray(conversationData.messages)) {
        const messages = conversationData.messages.map((msg: any) => {
          const role = msg.role || msg.speaker || msg.type || 'speaker';
          const content = msg.content || msg.text || msg.message || '';
          return `${role.toUpperCase()}: ${content}`;
        }).filter(msg => msg.length > 10); // Filter out empty messages

        if (messages.length > 0) {
          transcriptContent = messages.join('\n\n');
          displayContent = transcriptContent;
          console.log('Built transcript from messages array:', transcriptContent.substring(0, 200));
        }
      }

      // Check for nested structures
      if (!transcriptContent && conversationData.data) {
        console.log('Checking nested data structure:', conversationData.data);
        for (const field of possibleFields) {
          if (conversationData.data[field]) {
            transcriptContent = conversationData.data[field];
            displayContent = transcriptContent;
            console.log(`Found transcript in data.${field}:`, transcriptContent.substring(0, 200));
            break;
          }
        }
      }

      if (transcriptContent && transcriptContent.trim()) {
        setAiSummary(displayContent);
        setConversationStatus('completed');

        // Try to parse and populate the form
        parseAndPopulateSummary(transcriptContent);

        toast({
          title: "Transcript Fetched",
          description: `Successfully loaded conversation transcript (${transcriptContent.length} characters)`,
        });
      } else {
        console.warn('No transcript content found. Available fields:', Object.keys(conversationData));

        // Show available fields for debugging
        const availableFields = Object.keys(conversationData).join(', ');

        throw new Error(`No transcript content found in response. Available fields: ${availableFields}`);
      }

    } catch (error) {
      console.error('Error in handleManualConversationId:', error);
      setConversationStatus('idle');
      setConversationId(null);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      toast({
        title: "Failed to Fetch Transcript",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessingSummary(false);
    }
  };

  // Function to reset conversation state
  const resetConversation = () => {
    setConversationId(null);
    setConversationStatus('idle');
    setAiSummary('');
    setIsProcessingSummary(false);
    toast({
      title: "Conversation Reset",
      description: "Ready for a new conversation or test.",
    });
  };

  // Function to handle extracted text from document uploads
  const handleDocumentTextExtracted = (category: DocumentCategory, extractedData: Record<string, string>) => {
    try {
      // Map extracted data to form fields based on category
      const updatedFormData = { ...formData };

      Object.entries(extractedData).forEach(([key, value]) => {
        if (value && value.trim()) {
          // Map the extracted data to the appropriate form fields
          if (key in updatedFormData) {
            // If the field already has content, append to it
            const currentValue = updatedFormData[key as keyof OpdAdmissionNotesData];
            if (currentValue && currentValue.trim()) {
              updatedFormData[key as keyof OpdAdmissionNotesData] = `${currentValue}\n\n[From ${category} report]:\n${value}`;
            } else {
              updatedFormData[key as keyof OpdAdmissionNotesData] = value;
            }
          }
        }
      });

      setFormData(updatedFormData);

      toast({
        title: "Document Text Extracted",
        description: `Successfully extracted and populated data from ${category} report.`,
      });

    } catch (error) {
      console.error('Error handling extracted text:', error);
      toast({
        title: "Error",
        description: "Failed to process extracted text from document.",
        variant: "destructive",
      });
    }
  };

  // Function to handle lab result selection
  const handleLabResultSelection = (formattedText: string, category: string) => {
    try {
      const updatedFormData = { ...formData };

      // Determine which field to populate based on category
      let targetField: keyof OpdAdmissionNotesData;

      if (category.toLowerCase().includes('blood') || category.toLowerCase().includes('hematology')) {
        targetField = 'pathology_other_blood';
      } else {
        targetField = 'pathology_rbs';
      }

      // Append to existing content
      const currentValue = updatedFormData[targetField];
      if (currentValue && currentValue.trim()) {
        updatedFormData[targetField] = `${currentValue}\n\n[Lab Report - ${new Date().toLocaleDateString()}]:\n${formattedText}`;
      } else {
        updatedFormData[targetField] = formattedText;
      }

      setFormData(updatedFormData);

    } catch (error) {
      console.error('Error handling lab result selection:', error);
      toast({
        title: "Error",
        description: "Failed to add lab result to form.",
        variant: "destructive",
      });
    }
  };

  // Function to handle radiology result selection
  const handleRadiologyResultSelection = (formattedText: string, category: string) => {
    try {
      const updatedFormData = { ...formData };

      // Determine which field to populate based on category
      let targetField: keyof OpdAdmissionNotesData;

      if (category.toLowerCase().includes('x-ray') || category.toLowerCase().includes('chest')) {
        targetField = 'pathology_xray';
      } else if (category.toLowerCase().includes('ct') ||
                 category.toLowerCase().includes('mri') ||
                 category.toLowerCase().includes('usg') ||
                 category.toLowerCase().includes('ultrasound')) {
        targetField = 'pathology_ct_mri_usg';
      } else {
        targetField = 'pathology_other_investigations';
      }

      // Append to existing content
      const currentValue = updatedFormData[targetField];
      if (currentValue && currentValue.trim()) {
        updatedFormData[targetField] = `${currentValue}\n\n[Radiology Report - ${new Date().toLocaleDateString()}]:\n${formattedText}`;
      } else {
        updatedFormData[targetField] = formattedText;
      }

      setFormData(updatedFormData);

    } catch (error) {
      console.error('Error handling radiology result selection:', error);
      toast({
        title: "Error",
        description: "Failed to add radiology result to form.",
        variant: "destructive",
      });
    }
  };

  // Function to handle multiple results selection
  const handleMultipleResultsSelection = (labSummary: string, radiologySummary: string) => {
    try {
      const updatedFormData = { ...formData };

      // Add lab summary to other blood reports
      if (labSummary && labSummary.trim() !== 'No lab results available.') {
        const currentLabValue = updatedFormData.pathology_other_blood;
        if (currentLabValue && currentLabValue.trim()) {
          updatedFormData.pathology_other_blood = `${currentLabValue}\n\n[Recent Lab Results Summary]:\n${labSummary}`;
        } else {
          updatedFormData.pathology_other_blood = labSummary;
        }
      }

      // Add radiology summary to other investigations
      if (radiologySummary && radiologySummary.trim() !== 'No radiology results available.') {
        const currentRadiologyValue = updatedFormData.pathology_other_investigations;
        if (currentRadiologyValue && currentRadiologyValue.trim()) {
          updatedFormData.pathology_other_investigations = `${currentRadiologyValue}\n\n[Recent Radiology Results Summary]:\n${radiologySummary}`;
        } else {
          updatedFormData.pathology_other_investigations = radiologySummary;
        }
      }

      setFormData(updatedFormData);

    } catch (error) {
      console.error('Error handling multiple results selection:', error);
      toast({
        title: "Error",
        description: "Failed to add results to form.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Patient data not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header with Actions */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-sm text-gray-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {saving && (
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </div>
          )}
          {conversationStatus !== 'idle' && (
            <Button
              onClick={captureCurrentSummary}
              disabled={isProcessingSummary || !conversationId}
              variant="outline"
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
            >
              {isProcessingSummary ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Capture ANOHRA Summary
                </>
              )}
            </Button>
          )}
          <Button
            onClick={handleManualSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Now
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={() => setShowDocumentUpload(!showDocumentUpload)}
            variant="outline"
            className={`flex items-center gap-2 ${showDocumentUpload ? 'bg-blue-50 border-blue-300' : ''}`}
          >
            <Upload className="h-4 w-4" />
            {showDocumentUpload ? 'Hide Upload' : 'Upload Reports'}
          </Button>
          <Button
            onClick={() => setShowPatientReports(!showPatientReports)}
            variant="outline"
            className={`flex items-center gap-2 ${showPatientReports ? 'bg-green-50 border-green-300' : ''}`}
          >
            <FileText className="h-4 w-4" />
            {showPatientReports ? 'Hide Reports' : 'Patient Reports'}
          </Button>
          <Button
            onClick={() => setUseMultiConsultant(!useMultiConsultant)}
            variant={useMultiConsultant ? "default" : "outline"}
            className={`flex items-center gap-2 ${useMultiConsultant ? 'bg-purple-600 text-white' : 'hover:bg-purple-50'}`}
          >
            <Stethoscope className="h-4 w-4" />
            {useMultiConsultant ? 'Single Consultant' : 'Multi-Consultant'}
          </Button>
        </div>
      </div>

      {/* Multi-Consultant or Single Consultant Notes */}
      {useMultiConsultant ? (
        <MultiConsultantNotes
          visitId={visitId || ''}
          patientId={patientData?.patients?.id || ''}
          className="shadow-lg"
        />
      ) : (
        <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 print:bg-white">
          {/* Voice Agent Widget - Hidden in print */}
          <div className="print:hidden mb-4 p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${scriptLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <div className={`absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-75 ${scriptLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                </div>
                <Mic className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">ANOHRA Voice Assistant</h3>
                  <p className="text-xs text-gray-600">
                    {scriptLoaded ? 'Ready to assist with consultation documentation' : 'Loading voice assistant...'}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Say "ANOHRA" to activate
              </div>
            </div>

            {/* Conversation Status */}
            <div className="bg-blue-50 p-3 rounded-lg mb-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-blue-800">Conversation Status:</h4>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  conversationStatus === 'idle' ? 'bg-gray-200 text-gray-700' :
                  conversationStatus === 'listening' ? 'bg-yellow-200 text-yellow-800' :
                  conversationStatus === 'active' ? 'bg-green-200 text-green-800' :
                  'bg-blue-200 text-blue-800'
                }`}>
                  {conversationStatus === 'idle' && 'Ready'}
                  {conversationStatus === 'listening' && 'Listening...'}
                  {conversationStatus === 'active' && 'Active'}
                  {conversationStatus === 'completed' && 'Completed'}
                </div>
              </div>

              {conversationStatus === 'idle' && (
                <ol className="text-xs text-blue-700 space-y-1">
                  <li>1. Start your patient consultation normally</li>
                  <li>2. ANOHRA listens silently to the conversation</li>
                  <li>3. When finished, say "ANOHRA" to activate</li>
                  <li>4. Answer ANOHRA's 3 clarifying questions</li>
                  <li>5. Use "Capture Summary" to populate notes</li>
                </ol>
              )}

              {conversationStatus === 'completed' && aiSummary && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-green-700 font-medium">✓ Summary Generated</p>
                      {conversationId?.startsWith('simulated-') && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">TEST</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={captureCurrentSummary}
                      disabled={isProcessingSummary}
                      className="h-6 px-2 text-xs"
                    >
                      {isProcessingSummary ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Processing...
                        </>
                      ) : conversationId?.startsWith('simulated-') ? (
                        <>
                          <Download className="h-3 w-3 mr-1" />
                          Already Applied
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3 mr-1" />
                          Capture Summary
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="bg-white p-3 rounded border text-xs text-gray-700 max-h-32 overflow-y-auto">
                    <div className="text-xs text-gray-500 mb-1 font-medium">
                      Conversation Transcript (ID: {conversationId}):
                    </div>
                    <div className="whitespace-pre-wrap">
                      {aiSummary.length > 300 ? aiSummary.substring(0, 300) + '...' : aiSummary}
                    </div>
                    {aiSummary.length > 300 && (
                      <div className="text-xs text-blue-600 mt-1 cursor-pointer" onClick={() => {
                        const fullText = prompt('Full Conversation Transcript:', aiSummary);
                      }}>
                        Click to view full transcript ({aiSummary.length} characters)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Debug/Testing Controls */}
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-800 font-medium mb-2">Debug Controls:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={simulateConversation}
                    className="h-6 px-2 text-xs bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700"
                  >
                    Test Summary
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleManualConversationId}
                    className="h-6 px-2 text-xs bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
                  >
                    Fetch Transcript
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const envVars = {
                        VITE_ELEVENLABS_API_KEY: import.meta.env.VITE_ELEVENLABS_API_KEY ? 'Set' : 'Missing',
                        VITE_ELEVENLABS_AGENT_ID: import.meta.env.VITE_ELEVENLABS_AGENT_ID ? 'Set' : 'Missing',
                      };
                      console.log('Environment Variables:', envVars);
                      console.log('Current state:', {
                        conversationId,
                        conversationStatus,
                        scriptLoaded,
                        aiSummary: aiSummary.substring(0, 100)
                      });
                      toast({
                        title: "Debug Info Logged",
                        description: "Check browser console for environment and state details.",
                      });
                    }}
                    className="h-6 px-2 text-xs bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                  >
                    Debug Info
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resetConversation}
                    className="h-6 px-2 text-xs bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            {/* ElevenLabs Voice Widget */}
            <div className="flex justify-center bg-gray-50 p-3 rounded-lg">
              {scriptLoaded ? (
                <elevenlabs-convai agent-id={import.meta.env.VITE_ELEVENLABS_AGENT_ID}></elevenlabs-convai>
              ) : (
                <div className="text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-xs">Loading voice assistant...</p>
                </div>
              )}
            </div>
          </div>

          {/* Document Upload Section */}
          {showDocumentUpload && (
            <div className="print:hidden mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Document Upload & AI Text Extraction
                </h3>
                <p className="text-sm text-gray-600">
                  Upload medical reports (PDFs, images) and automatically extract text to populate form fields.
                </p>
              </div>

              <DocumentUpload
                onTextExtracted={handleDocumentTextExtracted}
                className="w-full"
              />
            </div>
          )}

          {/* Patient Reports Section */}
          {showPatientReports && patientData?.patients?.id && (
            <div className="print:hidden mb-6">
              <PatientReportsDisplay
                patientId={patientData.patients.id}
                onSelectLabResult={handleLabResultSelection}
                onSelectRadiologyResult={handleRadiologyResultSelection}
                onSelectMultipleResults={handleMultipleResultsSelection}
                className="w-full"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl font-bold text-blue-900">
                  NOTES
                </CardTitle>
                {/* Pulsating mic icon next to header */}
                <div className="flex items-center gap-2 print:hidden">
                  <div className="relative">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <Mic className="h-4 w-4 text-gray-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Visit ID: {patientData.visit_id} | Date: {formatDate(patientData.created_at)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Patient Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg print:border print:border-gray-300">
            <div>
              <Label className="text-xs font-semibold text-gray-600">Name</Label>
              <p className="text-sm font-medium mt-1">{patientData.patients?.name || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Age/Sex</Label>
              <p className="text-sm font-medium mt-1">
                {patientData.patients?.age || 'N/A'} / {patientData.patients?.gender || 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Reg. No</Label>
              <p className="text-sm font-medium mt-1">{patientData.patients?.patients_id || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Visit ID</Label>
              <p className="text-sm font-medium mt-1">{patientData.visit_id || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Date</Label>
              <p className="text-sm font-medium mt-1">{formatDate(patientData.created_at)}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Address</Label>
              <p className="text-sm font-medium mt-1">{patientData.patients?.address || 'nagpur'}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Name of Consultant</Label>
              <p className="text-sm font-medium mt-1">{patientData.appointment_with || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Corporate</Label>
              <p className="text-sm font-medium mt-1">{patientData.patients?.corporate || 'private'}</p>
            </div>
          </div>

          {/* conclusion */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold text-gray-800">conclusion</Label>
            <Textarea
              value={formData.diagnosis}
              onChange={(e) => handleInputChange('diagnosis', e.target.value)}
              placeholder="Enter detailed diagnosis notes, symptoms, examination findings..."
              className="min-h-[100px] resize-vertical print:border-gray-400"
            />
          </div>

          {/* Complaints */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold text-gray-800">Complaints</Label>
            <Textarea
              value={formData.relevance_complaints}
              onChange={(e) => handleInputChange('relevance_complaints', e.target.value)}
              placeholder="Enter complaints..."
              className="min-h-[80px] resize-vertical print:border-gray-400"
            />
          </div>

          {/* Two Column Layout for Vital and RX */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-two-column">
            {/* Left Column: Vital, Advice, Pathology */}
            <div className="space-y-6">
              {/* Vitals */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold text-gray-800">Vitals</Label>
                <Input
                  value={formData.vital_bp}
                  onChange={(e) => handleInputChange('vital_bp', e.target.value)}
                  placeholder="e.g., BP: 120\\/80 mmHg, Pulse: 72\\/min, Temp: 98.6°F"
                  className="print:border-gray-400"
                />
              </div>

              {/* OPD summary */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold text-gray-800">OPD summary</Label>
                <Textarea
                  value={formData.advice}
                  onChange={(e) => handleInputChange('advice', e.target.value)}
                  placeholder="Enter medical advice..."
                  className="min-h-[100px] resize-vertical print:border-gray-400"
                />
              </div>

              {/* Pathology */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-gray-800">Pathology</Label>
                <div className="space-y-3 pl-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">1. RBS</Label>
                    <Input
                      value={formData.pathology_rbs}
                      onChange={(e) => handleInputChange('pathology_rbs', e.target.value)}
                      placeholder="Random Blood Sugar value"
                      className="mt-1 print:border-gray-400"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">2. X-Ray</Label>
                    <Input
                      value={formData.pathology_xray}
                      onChange={(e) => handleInputChange('pathology_xray', e.target.value)}
                      placeholder="X-Ray details"
                      className="mt-1 print:border-gray-400"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">3. CT/MRI/USG</Label>
                    <Input
                      value={formData.pathology_ct_mri_usg}
                      onChange={(e) => handleInputChange('pathology_ct_mri_usg', e.target.value)}
                      placeholder="CT/MRI/USG details"
                      className="mt-1 print:border-gray-400"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">4. Other Blood Reports</Label>
                    <Textarea
                      value={formData.pathology_other_blood}
                      onChange={(e) => handleInputChange('pathology_other_blood', e.target.value)}
                      placeholder="Other blood investigations, CBC, liver function tests, etc."
                      className="mt-1 min-h-[80px] resize-vertical print:border-gray-400"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">5. Other Investigations</Label>
                    <Textarea
                      value={formData.pathology_other_investigations}
                      onChange={(e) => handleInputChange('pathology_other_investigations', e.target.value)}
                      placeholder="Other radiology reports, ECG, Echo, etc."
                      className="mt-1 min-h-[80px] resize-vertical print:border-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Stitch Removal */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold text-gray-800">Stitch Removal</Label>
                <Input
                  value={formData.stitches_removal}
                  onChange={(e) => handleInputChange('stitches_removal', e.target.value)}
                  placeholder="Stitch removal details"
                  className="print:border-gray-400"
                />
              </div>

              {/* Dressing */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold text-gray-800">Dressing</Label>
                <Input
                  value={formData.dressing}
                  onChange={(e) => handleInputChange('dressing', e.target.value)}
                  placeholder="Dressing details"
                  className="print:border-gray-400"
                />
              </div>

              {/* Procedures */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold text-gray-800">Procedures</Label>
                <Input
                  value={formData.speciality_injectable}
                  onChange={(e) => handleInputChange('speciality_injectable', e.target.value)}
                  placeholder="Procedures performed"
                  className="print:border-gray-400"
                />
              </div>
            </div>

            {/* Right Column: conversation with patient */}
            <div className="space-y-2">
              <Label className="text-lg font-semibold text-gray-800">conversation with patient</Label>
              <Textarea
                value={formData.rx}
                onChange={(e) => handleInputChange('rx', e.target.value)}
                placeholder="Enter prescription details..."
                className="min-h-[500px] resize-vertical print:border-gray-400"
              />
            </div>
          </div>

          {/* Footer Information */}
          <div className="border-t-2 border-gray-300 pt-2 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="space-y-1">
                <div>
                  <Label className="text-xs font-semibold text-gray-600">Signature:</Label>
                  <div className="border-b-2 border-gray-400 h-6 mt-1 print:h-4"></div>
                </div>
              </div>
              <div className="space-y-1">
                <div>
                  <Label className="text-xs font-semibold text-gray-600">Name of Doctor:</Label>
                  <Input
                    value={formData.doctor_signature}
                    onChange={(e) => handleInputChange('doctor_signature', e.target.value)}
                    placeholder="Enter doctor name..."
                    className="print:border-none print:bg-transparent"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600">Review:</p>
                  <Input
                    value={formData.review}
                    onChange={(e) => handleInputChange('review', e.target.value)}
                    className="print:border-none print:bg-transparent"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div>
                  <p className="text-xs font-semibold text-gray-600">Date And Time:</p>
                  <p className="text-sm font-medium">
                    {formatDate(new Date().toISOString())} {new Date().toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600">Date:</p>
                  <p className="text-sm font-medium">{formatDate(new Date().toISOString())}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600">Time:</p>
                  <p className="text-sm font-medium">
                    {new Date().toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        </Card>
      )}

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body {
              font-size: 8pt;
              margin: 0;
              padding: 0;
            }
            @page {
              size: A4;
              margin: 0.5cm;
            }
            .print\\:hidden,
            button,
            .no-print {
              display: none !important;
            }
            .container {
              max-width: 100% !important;
              padding: 0 !important;
            }
            .shadow-lg {
              box-shadow: none !important;
              border: 1px solid #000 !important;
            }
            input,
            textarea {
              border: 1px solid #000 !important;
              background: white !important;
              font-size: 7pt !important;
            }
            .text-xs { font-size: 6pt !important; }
            .text-sm { font-size: 7pt !important; }
            .text-lg { font-size: 8pt !important; }
            .text-2xl { font-size: 10pt !important; }
          }
          elevenlabs-convai,
          .elevenlabs-widget,
          .convai-widget {
            position: fixed !important;
            bottom: 120px !important;
            right: 20px !important;
            z-index: 1000 !important;
          }
        `
      }} />

    </div>
  );
};

export default OpdAdmissionNotes;
