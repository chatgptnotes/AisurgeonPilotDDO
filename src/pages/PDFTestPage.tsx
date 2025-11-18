import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateReceiptPDF, generatePrescriptionPDF, downloadPDF } from '@/services/pdfService';
import { Loader2 } from 'lucide-react';

export default function PDFTestPage() {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [error, setError] = useState('');

  // Sample receipt data
  const [receiptData, setReceiptData] = useState({
    receipt_id: 'RCT-2024-001',
    patient_name: 'Rajesh Kumar',
    patient_phone: '+91-9876543210',
    patient_email: 'rajesh.kumar@email.com',
    amount: 500,
    payment_date: new Date().toISOString(),
    payment_method: 'UPI',
    appointment_date: new Date().toISOString(),
    doctor_name: 'Dr. Amit Verma',
    service_type: 'Consultation',
    tenant_name: 'HealthCare Plus Clinic',
    tenant_address: '123 Medical Street, Mumbai, Maharashtra - 400001',
    tenant_phone: '+91-9876543210',
    tenant_email: 'contact@healthcareplus.com'
  });

  // Sample prescription data
  const [prescriptionData, setPrescriptionData] = useState({
    prescription_id: 'PRX-2024-001',
    patient_name: 'Priya Sharma',
    patient_age: 32,
    patient_gender: 'Female',
    doctor_name: 'Amit Verma',
    doctor_qualification: 'MBBS, MD (General Medicine)',
    doctor_license: 'MH/12345/2015',
    prescription_date: new Date().toISOString(),
    diagnosis: 'Seasonal Allergic Rhinitis',
    medications: [
      {
        name: 'Cetirizine 10mg',
        dosage: '1 tablet',
        frequency: 'Once daily',
        duration: '7 days',
        instructions: 'Take at bedtime'
      },
      {
        name: 'Montelukast 10mg',
        dosage: '1 tablet',
        frequency: 'Once daily',
        duration: '14 days',
        instructions: 'Take after dinner'
      },
      {
        name: 'Nasal Saline Spray',
        dosage: '2 sprays each nostril',
        frequency: 'Twice daily',
        duration: '10 days',
        instructions: 'Morning and evening'
      }
    ],
    advice: 'Avoid exposure to dust and pollen. Drink plenty of water. Use a humidifier in bedroom. Avoid cold drinks and ice cream.',
    follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tenant_name: 'HealthCare Plus Clinic',
    tenant_address: '123 Medical Street, Mumbai, Maharashtra - 400001'
  });

  const handleGenerateReceipt = async () => {
    setLoading(true);
    setError('');
    setPdfUrl('');

    try {
      const result = await generateReceiptPDF(receiptData);
      setPdfUrl(result.url);
      console.log('Receipt generated:', result);
    } catch (err: any) {
      setError(`Error generating receipt: ${err.message}`);
      console.error('Receipt generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePrescription = async () => {
    setLoading(true);
    setError('');
    setPdfUrl('');

    try {
      const result = await generatePrescriptionPDF(prescriptionData);
      setPdfUrl(result.url);
      console.log('Prescription generated:', result);
    } catch (err: any) {
      setError(`Error generating prescription: ${err.message}`);
      console.error('Prescription generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const filename = pdfUrl.includes('receipt') ? 'receipt.pdf' : 'prescription.pdf';
      downloadPDF(pdfUrl, filename);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">PDF Generation Test Page</h1>
        <p className="text-gray-600">
          Test PDF generation for receipts and prescriptions with Supabase Storage integration
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Receipt Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Receipt Generator</CardTitle>
            <CardDescription>
              Generate a professional payment receipt PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="receipt_id">Receipt ID</Label>
              <Input
                id="receipt_id"
                value={receiptData.receipt_id}
                onChange={(e) => setReceiptData({ ...receiptData, receipt_id: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="patient_name">Patient Name</Label>
              <Input
                id="patient_name"
                value={receiptData.patient_name}
                onChange={(e) => setReceiptData({ ...receiptData, patient_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="patient_phone">Patient Phone</Label>
              <Input
                id="patient_phone"
                value={receiptData.patient_phone}
                onChange={(e) => setReceiptData({ ...receiptData, patient_phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="patient_email">Patient Email</Label>
              <Input
                id="patient_email"
                type="email"
                value={receiptData.patient_email}
                onChange={(e) => setReceiptData({ ...receiptData, patient_email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={receiptData.amount}
                onChange={(e) => setReceiptData({ ...receiptData, amount: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Input
                id="payment_method"
                value={receiptData.payment_method}
                onChange={(e) => setReceiptData({ ...receiptData, payment_method: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="service_type">Service Type</Label>
              <Input
                id="service_type"
                value={receiptData.service_type}
                onChange={(e) => setReceiptData({ ...receiptData, service_type: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="doctor_name">Doctor Name</Label>
              <Input
                id="doctor_name"
                value={receiptData.doctor_name}
                onChange={(e) => setReceiptData({ ...receiptData, doctor_name: e.target.value })}
              />
            </div>

            <Button
              onClick={handleGenerateReceipt}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Receipt PDF'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Prescription Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Prescription Generator</CardTitle>
            <CardDescription>
              Generate a medical prescription PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="prescription_id">Prescription ID</Label>
              <Input
                id="prescription_id"
                value={prescriptionData.prescription_id}
                onChange={(e) => setPrescriptionData({ ...prescriptionData, prescription_id: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="prx_patient_name">Patient Name</Label>
              <Input
                id="prx_patient_name"
                value={prescriptionData.patient_name}
                onChange={(e) => setPrescriptionData({ ...prescriptionData, patient_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patient_age">Age</Label>
                <Input
                  id="patient_age"
                  type="number"
                  value={prescriptionData.patient_age}
                  onChange={(e) => setPrescriptionData({ ...prescriptionData, patient_age: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="patient_gender">Gender</Label>
                <Input
                  id="patient_gender"
                  value={prescriptionData.patient_gender}
                  onChange={(e) => setPrescriptionData({ ...prescriptionData, patient_gender: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="prx_doctor_name">Doctor Name</Label>
              <Input
                id="prx_doctor_name"
                value={prescriptionData.doctor_name}
                onChange={(e) => setPrescriptionData({ ...prescriptionData, doctor_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="doctor_qualification">Qualification</Label>
              <Input
                id="doctor_qualification"
                value={prescriptionData.doctor_qualification}
                onChange={(e) => setPrescriptionData({ ...prescriptionData, doctor_qualification: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="doctor_license">License No</Label>
              <Input
                id="doctor_license"
                value={prescriptionData.doctor_license}
                onChange={(e) => setPrescriptionData({ ...prescriptionData, doctor_license: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Input
                id="diagnosis"
                value={prescriptionData.diagnosis}
                onChange={(e) => setPrescriptionData({ ...prescriptionData, diagnosis: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="advice">Doctor's Advice</Label>
              <Textarea
                id="advice"
                value={prescriptionData.advice}
                onChange={(e) => setPrescriptionData({ ...prescriptionData, advice: e.target.value })}
                rows={3}
              />
            </div>

            <Button
              onClick={handleGeneratePrescription}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Prescription PDF'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {pdfUrl && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Generated PDF</CardTitle>
            <CardDescription>
              Your PDF has been generated and uploaded to Supabase Storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-2">Success!</p>
              <p className="text-sm text-green-700 break-all">{pdfUrl}</p>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleDownload} className="flex-1">
                Download PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(pdfUrl, '_blank')}
                className="flex-1"
              >
                Open in New Tab
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <iframe
                src={pdfUrl}
                className="w-full h-[600px]"
                title="PDF Preview"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Before Testing:</h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Run the SQL script: <code className="bg-blue-100 px-1 rounded">database/setup_pdf_storage.sql</code></li>
              <li>This creates 'receipts' and 'prescriptions' storage buckets in Supabase</li>
              <li>Both buckets are set to PUBLIC for easy sharing via links</li>
              <li>Authenticated users can upload PDFs</li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">PDF URLs Format:</h3>
            <code className="text-xs text-yellow-800 block">
              https://qfneoowktsirwpzehgxp.supabase.co/storage/v1/object/public/receipts/[filename]
            </code>
          </div>

          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">WhatsApp Integration:</h3>
            <p className="text-purple-800">
              Use the generated PDF URLs in WhatsApp templates. See <code className="bg-purple-100 px-1 rounded">WHATSAPP_TEMPLATES_UPDATED_PDF.md</code> for complete examples.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
