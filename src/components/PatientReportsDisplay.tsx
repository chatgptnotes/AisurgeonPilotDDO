import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Stethoscope,
  Copy,
  Calendar,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getPatientLabResults,
  getPatientRadiologyResults,
  getRecentLabResults,
  getRecentRadiologyResults,
  formatLabResult,
  formatRadiologyResult,
  groupLabResultsByCategory,
  groupRadiologyResultsByCategory,
  generateLabResultsSummary,
  generateRadiologyResultsSummary,
  type LabResult,
  type RadiologyResult,
  type GroupedLabResults,
  type GroupedRadiologyResults
} from '@/utils/patientReportsHelper';

interface PatientReportsDisplayProps {
  patientId: string;
  onSelectLabResult: (formattedText: string, category: string) => void;
  onSelectRadiologyResult: (formattedText: string, category: string) => void;
  onSelectMultipleResults: (labSummary: string, radiologySummary: string) => void;
  className?: string;
}

export const PatientReportsDisplay: React.FC<PatientReportsDisplayProps> = ({
  patientId,
  onSelectLabResult,
  onSelectRadiologyResult,
  onSelectMultipleResults,
  className = ''
}) => {
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [radiologyResults, setRadiologyResults] = useState<RadiologyResult[]>([]);
  const [recentLabResults, setRecentLabResults] = useState<LabResult[]>([]);
  const [recentRadiologyResults, setRecentRadiologyResults] = useState<RadiologyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('recent');
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      if (!patientId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch all results in parallel
        const [allLab, allRadiology, recentLab, recentRadiology] = await Promise.all([
          getPatientLabResults(patientId),
          getPatientRadiologyResults(patientId),
          getRecentLabResults(patientId, 30),
          getRecentRadiologyResults(patientId, 30)
        ]);

        setLabResults(allLab);
        setRadiologyResults(allRadiology);
        setRecentLabResults(recentLab);
        setRecentRadiologyResults(recentRadiology);

      } catch (err) {
        console.error('Error fetching patient reports:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch reports');

        toast({
          title: "Error",
          description: "Failed to load patient reports",
          variant: "destructive",
        });

      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [patientId, toast]);

  const handleCopyLabResult = (result: LabResult) => {
    const formattedText = formatLabResult(result);
    const category = result.test_category || 'blood';

    onSelectLabResult(formattedText, category);

    toast({
      title: "Lab Result Added",
      description: `${result.test_name} has been added to the form`,
    });
  };

  const handleCopyRadiologyResult = (result: RadiologyResult) => {
    const formattedText = formatRadiologyResult(result);
    const category = result.radiology?.category || 'radiology';

    onSelectRadiologyResult(formattedText, category);

    toast({
      title: "Radiology Result Added",
      description: `${result.radiology?.name} has been added to the form`,
    });
  };

  const handleCopyAllRecent = () => {
    const labSummary = generateLabResultsSummary(recentLabResults);
    const radiologySummary = generateRadiologyResultsSummary(recentRadiologyResults);

    onSelectMultipleResults(labSummary, radiologySummary);

    toast({
      title: "Recent Reports Added",
      description: "All recent lab and radiology results have been added to the form",
    });
  };

  const renderLabResults = (results: LabResult[]) => {
    const grouped = groupLabResultsByCategory(results);

    return (
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, categoryResults]) => (
          <Card key={category} className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-600" />
                {category}
                <Badge variant="secondary" className="text-xs">
                  {categoryResults.length} result{categoryResults.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categoryResults.map((result) => (
                <div key={result.id} className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-gray-900">
                          {result.test_name}
                        </p>
                        {result.is_abnormal && (
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                        )}
                        <Badge variant={result.result_status === 'Final' ? 'default' : 'secondary'} className="text-xs">
                          {result.result_status}
                        </Badge>
                      </div>

                      {result.result_value && (
                        <p className="text-sm text-gray-700 mb-1">
                          <span className="font-medium">Result:</span> {result.result_value}
                          {result.result_unit && ` ${result.result_unit}`}
                          {result.reference_range && (
                            <span className="text-gray-500 ml-2">
                              (Ref: {result.reference_range})
                            </span>
                          )}
                        </p>
                      )}

                      {result.comments && (
                        <p className="text-xs text-gray-600 mb-2">
                          <span className="font-medium">Comments:</span> {result.comments}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(result.created_at).toLocaleDateString()}
                        </span>
                        {result.pathologist_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {result.pathologist_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyLabResult(result)}
                      className="ml-2 h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderRadiologyResults = (results: RadiologyResult[]) => {
    const grouped = groupRadiologyResultsByCategory(results);

    return (
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, categoryResults]) => (
          <Card key={category} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-blue-600" />
                {category}
                <Badge variant="secondary" className="text-xs">
                  {categoryResults.length} result{categoryResults.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categoryResults.map((result) => (
                <div key={result.id} className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-gray-900">
                          {result.radiology?.name || 'Unknown Study'}
                        </p>
                        <Badge variant={result.result_status === 'signed' ? 'default' : 'secondary'} className="text-xs">
                          {result.result_status}
                        </Badge>
                      </div>

                      {result.findings && (
                        <p className="text-sm text-gray-700 mb-1">
                          <span className="font-medium">Findings:</span> {result.findings.substring(0, 100)}
                          {result.findings.length > 100 && '...'}
                        </p>
                      )}

                      {(result.impression || result.image_impression) && (
                        <p className="text-sm text-gray-700 mb-1">
                          <span className="font-medium">Impression:</span> {(result.impression || result.image_impression)?.substring(0, 100)}
                          {(result.impression || result.image_impression)?.length > 100 && '...'}
                        </p>
                      )}

                      {result.advice && (
                        <p className="text-xs text-gray-600 mb-2">
                          <span className="font-medium">Advice:</span> {result.advice.substring(0, 80)}
                          {result.advice.length > 80 && '...'}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(result.created_at).toLocaleDateString()}
                        </span>
                        {result.selected_doctor && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {result.selected_doctor}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyRadiologyResult(result)}
                      className="ml-2 h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading patient reports...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-red-600">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasRecentResults = recentLabResults.length > 0 || recentRadiologyResults.length > 0;
  const hasAllResults = labResults.length > 0 || radiologyResults.length > 0;

  if (!hasAllResults) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No reports available for this patient</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Patient Reports</CardTitle>
          {hasRecentResults && (
            <Button
              size="sm"
              onClick={handleCopyAllRecent}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Add All Recent
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Recent (30 days)
              {hasRecentResults && (
                <Badge variant="secondary" className="text-xs">
                  {recentLabResults.length + recentRadiologyResults.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              All Reports
              <Badge variant="secondary" className="text-xs">
                {labResults.length + radiologyResults.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-6">
                {recentLabResults.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-red-600" />
                      Recent Lab Results
                    </h4>
                    {renderLabResults(recentLabResults)}
                  </div>
                )}

                {recentRadiologyResults.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                      Recent Radiology Results
                    </h4>
                    {renderRadiologyResults(recentRadiologyResults)}
                  </div>
                )}

                {!hasRecentResults && (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No reports in the last 30 days</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-6">
                {labResults.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-red-600" />
                      All Lab Results
                    </h4>
                    {renderLabResults(labResults)}
                  </div>
                )}

                {radiologyResults.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                      All Radiology Results
                    </h4>
                    {renderRadiologyResults(radiologyResults)}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PatientReportsDisplay;