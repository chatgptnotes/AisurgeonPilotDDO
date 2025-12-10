import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateOpdSummary, PatientOpdData } from '@/services/opdSummaryService';
import ReactMarkdown from 'react-markdown';
import {
  Download,
  FileText,
  FlaskConical,
  Pill,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Loader2,
  Send,
  Sparkles,
  Eye,
  Edit,
} from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  doctorId: string;
  onSummaryPublished?: () => void;
}

interface FetchedData {
  diagnosis: string;
  prescriptions: Array<{
    id: string;
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
    diagnosis: string | null;
    prescription_date: string;
  }>;
  labReports: Array<{
    id: string;
    report_name: string;
    report_date: string;
    tests: Array<{
      test_name: string;
      result: string;
      unit?: string;
      normal_range?: string;
    }>;
  }>;
}

export function OpdSummaryModal({
  open,
  onClose,
  patientId,
  patientName,
  doctorId,
  onSummaryPublished,
}: Props) {
  const [fetchedData, setFetchedData] = useState<FetchedData | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<string>('');
  const [editedSummary, setEditedSummary] = useState<string>('');
  const [isDataSectionOpen, setIsDataSectionOpen] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(true);

  const [isFetching, setIsFetching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleFetchData = async () => {
    setIsFetching(true);
    try {
      // Fetch diagnosis from patient
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('primary_diagnosis')
        .eq('id', patientId)
        .single();

      if (patientError) {
        console.error('Error fetching patient:', patientError);
      }

      // Fetch prescriptions
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select('id, medications, diagnosis, prescription_date')
        .eq('patient_id', patientId)
        .order('prescription_date', { ascending: false })
        .limit(5);

      if (prescriptionsError) {
        console.error('Error fetching prescriptions:', prescriptionsError);
      }

      // Fetch lab reports
      const { data: labReportsData, error: labReportsError } = await supabase
        .from('lab_reports')
        .select('id, report_name, report_date, tests')
        .eq('patient_id', patientId)
        .order('report_date', { ascending: false })
        .limit(5);

      if (labReportsError) {
        console.error('Error fetching lab reports:', labReportsError);
      }

      const data: FetchedData = {
        diagnosis: patientData?.primary_diagnosis || '',
        prescriptions: (prescriptionsData || []).map((p: any) => ({
          id: p.id,
          medications: Array.isArray(p.medications) ? p.medications : [],
          diagnosis: p.diagnosis,
          prescription_date: p.prescription_date,
        })),
        labReports: (labReportsData || []).map((r: any) => ({
          id: r.id,
          report_name: r.report_name || 'Lab Report',
          report_date: r.report_date,
          tests: Array.isArray(r.tests) ? r.tests : [],
        })),
      };

      setFetchedData(data);
      toast.success('Patient data fetched successfully');
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch patient data');
    } finally {
      setIsFetching(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!fetchedData) {
      toast.error('Please fetch patient data first');
      return;
    }

    setIsGenerating(true);
    try {
      // Prepare data for OpenAI
      const opdData: PatientOpdData = {
        diagnosis: fetchedData.diagnosis,
        prescriptions: fetchedData.prescriptions.flatMap((p) =>
          p.medications.map((m) => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            instructions: m.instructions,
          }))
        ),
        labReports: fetchedData.labReports.map((r) => ({
          reportName: r.report_name,
          reportDate: r.report_date,
          tests: r.tests.map((t) => ({
            testName: t.test_name,
            result: t.result,
            unit: t.unit,
            normalRange: t.normal_range,
          })),
        })),
      };

      const summary = await generateOpdSummary(opdData);
      setGeneratedSummary(summary);
      setEditedSummary(summary);
      setIsPreviewMode(true);
      toast.success('OPD Summary generated successfully');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate OPD summary. Please check your API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!editedSummary.trim()) {
      toast.error('No summary to publish');
      return;
    }

    setIsPublishing(true);
    try {
      const doctorName = localStorage.getItem('doctor_name') || 'Doctor';

      const { error } = await supabase
        .from('patients')
        .update({
          opd_summary: editedSummary,
          opd_summary_published_at: new Date().toISOString(),
          opd_summary_published_by: doctorName,
        })
        .eq('id', patientId);

      if (error) throw error;

      toast.success('OPD Summary published successfully');
      onSummaryPublished?.();
      onClose();
    } catch (error) {
      console.error('Error publishing summary:', error);
      toast.error('Failed to publish OPD summary');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setFetchedData(null);
    setGeneratedSummary('');
    setEditedSummary('');
    setIsDataSectionOpen(true);
    setIsPreviewMode(true);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">OPD Summary</h2>
              <p className="text-sm text-gray-500 font-normal">{patientName}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh] px-6 py-4">
          {/* Fetch Data Section */}
          <Collapsible open={isDataSectionOpen} onOpenChange={setIsDataSectionOpen}>
            <Card className="mb-4">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-blue-600" />
                      Patient Data
                    </span>
                    {isDataSectionOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {!fetchedData ? (
                    <div className="text-center py-6 text-gray-500">
                      <p className="mb-4">Click "Fetch Data" to load patient information</p>
                      <Button onClick={handleFetchData} disabled={isFetching}>
                        {isFetching ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Fetching...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Fetch Data
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Diagnosis */}
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <Stethoscope className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">Diagnosis</p>
                          <p className="text-sm text-blue-700">
                            {fetchedData.diagnosis || 'No diagnosis recorded'}
                          </p>
                        </div>
                      </div>

                      {/* Prescriptions */}
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Pill className="h-5 w-5 text-purple-600" />
                          <p className="text-sm font-medium text-purple-800">
                            Medications ({fetchedData.prescriptions.length} prescription(s))
                          </p>
                        </div>
                        {fetchedData.prescriptions.length > 0 ? (
                          <div className="space-y-2">
                            {fetchedData.prescriptions.map((p, idx) => (
                              <div key={p.id || idx} className="text-sm text-purple-700">
                                {p.medications.map((m, mIdx) => (
                                  <div key={mIdx} className="ml-4">
                                    • {m.name} - {m.dosage}, {m.frequency} for {m.duration}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-purple-600 italic">No prescriptions on record</p>
                        )}
                      </div>

                      {/* Lab Reports */}
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <FlaskConical className="h-5 w-5 text-orange-600" />
                          <p className="text-sm font-medium text-orange-800">
                            Lab Reports ({fetchedData.labReports.length})
                          </p>
                        </div>
                        {fetchedData.labReports.length > 0 ? (
                          <div className="space-y-2">
                            {fetchedData.labReports.map((r, idx) => (
                              <div key={r.id || idx} className="text-sm text-orange-700">
                                <p className="font-medium">{r.report_name}</p>
                                {r.tests.map((t, tIdx) => (
                                  <div key={tIdx} className="ml-4">
                                    • {t.test_name}: {t.result} {t.unit || ''}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-orange-600 italic">No lab reports on record</p>
                        )}
                      </div>

                      {/* Warning if no diagnosis */}
                      {!fetchedData.diagnosis && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700 font-medium">
                            Please add a diagnosis before generating OPD Summary
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            Go to patient profile and add a primary diagnosis first.
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleFetchData}
                          variant="outline"
                          size="sm"
                          disabled={isFetching}
                        >
                          {isFetching ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Refresh Data
                        </Button>
                        <Button
                          onClick={handleGenerateSummary}
                          disabled={isGenerating || !fetchedData || !fetchedData.diagnosis}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={!fetchedData?.diagnosis ? 'Please add diagnosis first' : ''}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate Summary
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Generated Summary Section */}
          {(generatedSummary || editedSummary) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    Generated OPD Summary
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant={isPreviewMode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsPreviewMode(true)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant={!isPreviewMode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsPreviewMode(false)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPreviewMode ? (
                  <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg border min-h-[300px]">
                    <ReactMarkdown>{editedSummary}</ReactMarkdown>
                  </div>
                ) : (
                  <Textarea
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    placeholder="Edit the generated summary..."
                    className="min-h-[300px] font-mono text-sm"
                  />
                )}
              </CardContent>
            </Card>
          )}
        </ScrollArea>

        {/* Footer Actions */}
        <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {generatedSummary && (
              <span>
                {editedSummary.split(/\s+/).length} words
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {editedSummary && (
              <Button
                onClick={handlePublish}
                disabled={isPublishing || !editedSummary.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publish Summary
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
