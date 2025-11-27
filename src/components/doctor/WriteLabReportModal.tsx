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
import { FlaskConical, Plus, Trash2, Save, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  doctorId: string;
  onReportSaved?: () => void;
}

interface LabTest {
  id: string;
  testName: string;
  result: string;
  unit: string;
  normalRange: string;
  status: 'normal' | 'abnormal' | 'critical' | '';
}

const labCategories = [
  { value: 'blood', label: 'Blood Tests' },
  { value: 'urine', label: 'Urine Tests' },
  { value: 'biochemistry', label: 'Biochemistry' },
  { value: 'hematology', label: 'Hematology' },
  { value: 'imaging', label: 'Imaging/Radiology' },
  { value: 'microbiology', label: 'Microbiology' },
  { value: 'pathology', label: 'Pathology' },
  { value: 'other', label: 'Other' },
];

const commonTests = [
  { name: 'Hemoglobin (Hb)', unit: 'g/dL', normalRange: '12-16 (F), 14-18 (M)' },
  { name: 'Blood Sugar (Fasting)', unit: 'mg/dL', normalRange: '70-100' },
  { name: 'Blood Sugar (PP)', unit: 'mg/dL', normalRange: '<140' },
  { name: 'HbA1c', unit: '%', normalRange: '<5.7' },
  { name: 'Total Cholesterol', unit: 'mg/dL', normalRange: '<200' },
  { name: 'HDL Cholesterol', unit: 'mg/dL', normalRange: '>40' },
  { name: 'LDL Cholesterol', unit: 'mg/dL', normalRange: '<100' },
  { name: 'Triglycerides', unit: 'mg/dL', normalRange: '<150' },
  { name: 'Creatinine', unit: 'mg/dL', normalRange: '0.7-1.3' },
  { name: 'Blood Urea', unit: 'mg/dL', normalRange: '7-20' },
  { name: 'SGOT/AST', unit: 'U/L', normalRange: '8-33' },
  { name: 'SGPT/ALT', unit: 'U/L', normalRange: '7-56' },
  { name: 'TSH', unit: 'mIU/L', normalRange: '0.4-4.0' },
  { name: 'T3', unit: 'ng/dL', normalRange: '80-200' },
  { name: 'T4', unit: 'mcg/dL', normalRange: '5.1-14.1' },
  { name: 'Vitamin D', unit: 'ng/mL', normalRange: '30-100' },
  { name: 'Vitamin B12', unit: 'pg/mL', normalRange: '200-900' },
  { name: 'WBC Count', unit: 'cells/mcL', normalRange: '4500-11000' },
  { name: 'Platelet Count', unit: 'cells/mcL', normalRange: '150000-400000' },
];

export function WriteLabReportModal({
  open,
  onClose,
  patientId,
  patientName,
  doctorId,
  onReportSaved
}: Props) {
  const [tests, setTests] = useState<LabTest[]>([
    { id: '1', testName: '', result: '', unit: '', normalRange: '', status: '' }
  ]);
  const [reportName, setReportName] = useState('');
  const [category, setCategory] = useState('');
  const [labName, setLabName] = useState('');
  const [sampleDate, setSampleDate] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const addTest = () => {
    setTests([
      ...tests,
      { id: Date.now().toString(), testName: '', result: '', unit: '', normalRange: '', status: '' }
    ]);
  };

  const removeTest = (id: string) => {
    if (tests.length > 1) {
      setTests(tests.filter(t => t.id !== id));
    }
  };

  const updateTest = (id: string, field: keyof LabTest, value: string) => {
    setTests(tests.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const selectCommonTest = (testId: string, testInfo: typeof commonTests[0]) => {
    setTests(tests.map(t =>
      t.id === testId ? {
        ...t,
        testName: testInfo.name,
        unit: testInfo.unit,
        normalRange: testInfo.normalRange
      } : t
    ));
  };

  const resetForm = () => {
    setTests([{ id: '1', testName: '', result: '', unit: '', normalRange: '', status: '' }]);
    setReportName('');
    setCategory('');
    setLabName('');
    setSampleDate('');
    setReportDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    const validTests = tests.filter(t => t.testName.trim() && t.result.trim());
    if (validTests.length === 0) {
      toast.error('Please add at least one test with result');
      return;
    }

    setSaving(true);

    try {
      const doctorName = localStorage.getItem('doctor_name') || 'Doctor';

      // Generate unique report ID
      const reportId = `LR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Create tests array as JSONB
      const testsData = validTests.map(t => ({
        test_name: t.testName,
        result: t.result,
        unit: t.unit,
        normal_range: t.normalRange,
        status: t.status,
      }));

      // Save to lab_reports table - always published so patient can see it
      const { error } = await supabase
        .from('lab_reports')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          doctor_name: doctorName,
          visit_id: reportId,
          report_date: new Date().toISOString(),
          report_name: reportName || `Lab Report - ${new Date().toLocaleDateString()}`,
          category: category || null,
          lab_name: labName || null,
          tests: testsData,
          notes: notes || null,
          is_published: true,
          published_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving lab report:', error);
        throw new Error(error.message);
      }

      toast.success('Lab report saved! Patient can now view it in their portal.');

      onReportSaved?.();
      handleClose();

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save lab report');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-purple-600" />
            Add Lab Report for {patientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <Label htmlFor="report-name">Report Name</Label>
              <Input
                id="report-name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="e.g., Complete Blood Count"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {labCategories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lab-name">Lab Name</Label>
              <Input
                id="lab-name"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                placeholder="Lab name"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sample-date">Sample Collection Date</Label>
              <Input
                id="sample-date"
                type="date"
                value={sampleDate}
                onChange={(e) => setSampleDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="report-date">Report Date</Label>
              <Input
                id="report-date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Test Results</Label>
              <Button variant="outline" size="sm" onClick={addTest}>
                <Plus className="h-4 w-4 mr-1" />
                Add Test
              </Button>
            </div>

            {tests.map((test, index) => (
              <Card key={test.id} className="p-4">
                <div className="flex items-start gap-2 mb-3">
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex gap-2">
                      <Input
                        value={test.testName}
                        onChange={(e) => updateTest(test.id, 'testName', e.target.value)}
                        placeholder="Test name"
                        className="flex-1"
                      />
                      <Select
                        onValueChange={(value) => {
                          const selected = commonTests.find(t => t.name === value);
                          if (selected) selectCommonTest(test.id, selected);
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Quick select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {commonTests.map(ct => (
                            <SelectItem key={ct.name} value={ct.name}>
                              {ct.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {tests.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTest(test.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Result *</Label>
                    <Input
                      value={test.result}
                      onChange={(e) => updateTest(test.id, 'result', e.target.value)}
                      placeholder="Value"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Unit</Label>
                    <Input
                      value={test.unit}
                      onChange={(e) => updateTest(test.id, 'unit', e.target.value)}
                      placeholder="e.g., mg/dL"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Normal Range</Label>
                    <Input
                      value={test.normalRange}
                      onChange={(e) => updateTest(test.id, 'normalRange', e.target.value)}
                      placeholder="e.g., 70-100"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <Select
                      value={test.status}
                      onValueChange={(value) => updateTest(test.id, 'status', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="abnormal">Abnormal</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Interpretation / Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Doctor's interpretation or additional notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Lab Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
