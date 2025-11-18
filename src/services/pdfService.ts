import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

/**
 * Generate payment receipt PDF
 */
export async function generateReceiptPDF(receiptData: {
  receipt_id: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  appointment_date?: string;
  doctor_name?: string;
  service_type: string;
  tenant_name: string;
  tenant_address?: string;
  tenant_phone?: string;
  tenant_email?: string;
}): Promise<{ url: string; filename: string }> {

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header with logo/branding
  doc.setFontSize(24);
  doc.setTextColor(37, 99, 235); // Blue
  doc.text('AI Surgeon Pilot', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(receiptData.tenant_name || 'Healthcare Services', pageWidth / 2, 28, { align: 'center' });

  if (receiptData.tenant_address) {
    doc.text(receiptData.tenant_address, pageWidth / 2, 34, { align: 'center' });
  }

  // Receipt title
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('PAYMENT RECEIPT', pageWidth / 2, 50, { align: 'center' });

  // Receipt details
  doc.setFontSize(11);
  const startY = 65;

  doc.text(`Receipt No: ${receiptData.receipt_id}`, 20, startY);
  doc.text(`Date: ${format(new Date(receiptData.payment_date), 'dd MMM yyyy, hh:mm a')}`, 20, startY + 7);

  // Patient details section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Details', 20, startY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.text(`Name: ${receiptData.patient_name}`, 20, startY + 28);
  doc.text(`Phone: ${receiptData.patient_phone}`, 20, startY + 35);
  doc.text(`Email: ${receiptData.patient_email}`, 20, startY + 42);

  // Service details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Service Details', 20, startY + 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.text(`Service: ${receiptData.service_type}`, 20, startY + 63);
  if (receiptData.doctor_name) {
    doc.text(`Doctor: ${receiptData.doctor_name}`, 20, startY + 70);
  }
  if (receiptData.appointment_date) {
    doc.text(`Appointment: ${format(new Date(receiptData.appointment_date), 'dd MMM yyyy, hh:mm a')}`, 20, startY + 77);
  }

  // Payment table
  autoTable(doc, {
    startY: startY + 90,
    head: [['Description', 'Amount']],
    body: [
      [receiptData.service_type, `₹${receiptData.amount.toFixed(2)}`],
      ['Payment Method', receiptData.payment_method],
      ['Status', 'PAID'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
  });

  // Total
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Paid: ₹${receiptData.amount.toFixed(2)}`, pageWidth - 20, finalY, { align: 'right' });

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for choosing AI Surgeon Pilot!', pageWidth / 2, doc.internal.pageSize.height - 30, { align: 'center' });
  doc.text('For queries, contact: support@aisurgeonpilot.com | +91-9876543210', pageWidth / 2, doc.internal.pageSize.height - 23, { align: 'center' });
  doc.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, doc.internal.pageSize.height - 16, { align: 'center' });

  // Generate blob and upload
  const pdfBlob = doc.output('blob');
  const filename = `receipt_${receiptData.receipt_id}_${Date.now()}.pdf`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(filename, pdfBlob, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Failed to upload receipt: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('receipts')
    .getPublicUrl(filename);

  return { url: publicUrl, filename };
}

/**
 * Generate prescription PDF
 */
export async function generatePrescriptionPDF(prescriptionData: {
  prescription_id: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  doctor_name: string;
  doctor_qualification: string;
  doctor_license: string;
  prescription_date: string;
  diagnosis: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  advice?: string;
  follow_up_date?: string;
  tenant_name: string;
  tenant_address?: string;
}): Promise<{ url: string; filename: string }> {

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('AI Surgeon Pilot', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text(prescriptionData.tenant_name || 'Healthcare Services', pageWidth / 2, 24, { align: 'center' });

  // Prescription title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESCRIPTION', pageWidth / 2, 50, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${format(new Date(prescriptionData.prescription_date), 'dd MMM yyyy')}`, 20, 60);
  doc.text(`Prescription ID: ${prescriptionData.prescription_id}`, pageWidth - 20, 60, { align: 'right' });

  // Patient details
  let yPos = 75;
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Details:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 7;
  doc.text(`Name: ${prescriptionData.patient_name}`, 25, yPos);
  yPos += 6;
  doc.text(`Age: ${prescriptionData.patient_age} years | Gender: ${prescriptionData.patient_gender}`, 25, yPos);

  // Doctor details
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('Prescribed By:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 7;
  doc.text(`Dr. ${prescriptionData.doctor_name}`, 25, yPos);
  yPos += 6;
  doc.text(`${prescriptionData.doctor_qualification} | License: ${prescriptionData.doctor_license}`, 25, yPos);

  // Diagnosis
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('Diagnosis:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 7;
  doc.text(prescriptionData.diagnosis, 25, yPos);

  // Medications table
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('Rx (Medications):', 20, yPos);

  const medicationRows = prescriptionData.medications.map((med, index) => [
    index + 1,
    med.name,
    med.dosage,
    med.frequency,
    med.duration,
    med.instructions || '-'
  ]);

  autoTable(doc, {
    startY: yPos + 5,
    head: [['#', 'Medicine Name', 'Dosage', 'Frequency', 'Duration', 'Instructions']],
    body: medicationRows,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 45 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { cellWidth: 45 }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Advice
  if (prescriptionData.advice) {
    doc.setFont('helvetica', 'bold');
    doc.text('Advice:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 7;
    const adviceLines = doc.splitTextToSize(prescriptionData.advice, pageWidth - 50);
    doc.text(adviceLines, 25, yPos);
    yPos += adviceLines.length * 6;
  }

  // Follow-up
  if (prescriptionData.follow_up_date) {
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text(`Follow-up Date: ${format(new Date(prescriptionData.follow_up_date), 'dd MMM yyyy')}`, 20, yPos);
  }

  // Doctor signature area
  yPos += 20;
  doc.text('_____________________', pageWidth - 60, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Dr. ${prescriptionData.doctor_name}`, pageWidth - 60, yPos);
  doc.text(prescriptionData.doctor_qualification, pageWidth - 60, yPos + 5);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('This is a digitally generated prescription.', pageWidth / 2, doc.internal.pageSize.height - 20, { align: 'center' });
  doc.text('For queries: support@aisurgeonpilot.com | +91-9876543210', pageWidth / 2, doc.internal.pageSize.height - 15, { align: 'center' });

  // Generate and upload
  const pdfBlob = doc.output('blob');
  const filename = `prescription_${prescriptionData.prescription_id}_${Date.now()}.pdf`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('prescriptions')
    .upload(filename, pdfBlob, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Failed to upload prescription: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('prescriptions')
    .getPublicUrl(filename);

  return { url: publicUrl, filename };
}

/**
 * Download PDF from URL
 */
export function downloadPDF(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
