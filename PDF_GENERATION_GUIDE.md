# PDF Generation System - Complete Guide

Complete PDF generation system for receipts and prescriptions with Supabase Storage integration for AI Surgeon Pilot.

---

## Overview

This system generates professional PDF documents for:
1. **Payment Receipts** - After successful payment transactions
2. **Prescriptions** - Medical prescriptions with medications and advice
3. **Lab Reports** - (Future enhancement)
4. **Surgery Instructions** - (Future enhancement)

All PDFs are:
- Generated client-side using jsPDF
- Uploaded to Supabase Storage
- Accessible via public URLs
- Shareable via WhatsApp/Email
- Downloadable by patients

---

## Installation

### 1. Install Dependencies

```bash
npm install jspdf jspdf-autotable
```

### 2. Setup Supabase Storage

Run this SQL in your Supabase SQL Editor:

```sql
-- File: database/setup_pdf_storage.sql

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('prescriptions', 'prescriptions', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for receipts
CREATE POLICY "Public read access for receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- Storage policies for prescriptions
CREATE POLICY "Public read access for prescriptions"
ON storage.objects FOR SELECT
USING (bucket_id = 'prescriptions');

CREATE POLICY "Authenticated users can upload prescriptions"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'prescriptions' AND auth.role() = 'authenticated');
```

---

## Usage

### Generate Payment Receipt

```typescript
import { generateReceiptPDF } from '@/services/pdfService';

const receiptData = {
  receipt_id: 'RCT-2024-001',
  patient_name: 'Rajesh Kumar',
  patient_phone: '+91-9876543210',
  patient_email: 'rajesh@email.com',
  amount: 500,
  payment_date: new Date().toISOString(),
  payment_method: 'UPI',
  appointment_date: new Date().toISOString(),
  doctor_name: 'Dr. Amit Verma',
  service_type: 'Consultation',
  tenant_name: 'HealthCare Plus',
  tenant_address: '123 Medical Street, Mumbai',
  tenant_phone: '+91-9876543210',
  tenant_email: 'contact@healthcareplus.com'
};

try {
  const { url, filename } = await generateReceiptPDF(receiptData);
  console.log('Receipt PDF URL:', url);
  console.log('Filename:', filename);

  // Save URL to database
  await supabase
    .from('payments')
    .update({ receipt_pdf_url: url })
    .eq('id', paymentId);

} catch (error) {
  console.error('Error generating receipt:', error);
}
```

### Generate Prescription

```typescript
import { generatePrescriptionPDF } from '@/services/pdfService';

const prescriptionData = {
  prescription_id: 'PRX-2024-001',
  patient_name: 'Priya Sharma',
  patient_age: 32,
  patient_gender: 'Female',
  doctor_name: 'Amit Verma',
  doctor_qualification: 'MBBS, MD',
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
    }
  ],
  advice: 'Avoid dust and pollen. Drink plenty of water.',
  follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  tenant_name: 'HealthCare Plus',
  tenant_address: '123 Medical Street, Mumbai'
};

try {
  const { url, filename } = await generatePrescriptionPDF(prescriptionData);
  console.log('Prescription PDF URL:', url);

  // Save URL to database
  await supabase
    .from('prescriptions')
    .update({ pdf_url: url })
    .eq('id', prescriptionId);

} catch (error) {
  console.error('Error generating prescription:', error);
}
```

### Download PDF

```typescript
import { downloadPDF } from '@/services/pdfService';

// Trigger download in browser
downloadPDF(pdfUrl, 'receipt.pdf');
```

---

## Complete Workflow Examples

### Workflow 1: Payment Processing with Receipt

```typescript
async function handlePaymentSuccess(paymentData: {
  payment_id: string;
  patient_id: string;
  amount: number;
  payment_method: string;
  service_type: string;
}) {
  try {
    // 1. Get patient details
    const { data: patient } = await supabase
      .from('patients')
      .select('name, phone, email')
      .eq('id', paymentData.patient_id)
      .single();

    // 2. Generate receipt PDF
    const receiptId = `RCT-${Date.now()}`;
    const { url: receiptPdfUrl } = await generateReceiptPDF({
      receipt_id: receiptId,
      patient_name: patient.name,
      patient_phone: patient.phone,
      patient_email: patient.email,
      amount: paymentData.amount,
      payment_date: new Date().toISOString(),
      payment_method: paymentData.payment_method,
      service_type: paymentData.service_type,
      tenant_name: 'HealthCare Plus',
      tenant_address: '123 Medical Street, Mumbai',
    });

    // 3. Save PDF URL to database
    await supabase
      .from('payments')
      .update({
        receipt_id: receiptId,
        receipt_pdf_url: receiptPdfUrl,
        status: 'completed'
      })
      .eq('id', paymentData.payment_id);

    // 4. Send WhatsApp notification
    await sendWhatsAppTemplate({
      to: `91${patient.phone}`,
      template: 'payment_receipt_pdf',
      variables: {
        patient_name: patient.name,
        amount: paymentData.amount.toString(),
        receipt_id: receiptId,
        payment_date: format(new Date(), 'dd MMM yyyy, hh:mm a'),
        payment_method: paymentData.payment_method,
        service_type: paymentData.service_type,
        receipt_pdf_url: receiptPdfUrl,
        clinic_name: 'HealthCare Plus'
      }
    });

    // 5. Send email notification
    await sendEmail({
      to: patient.email,
      subject: 'Payment Receipt - HealthCare Plus',
      template: 'payment-receipt',
      data: {
        patient_name: patient.name,
        receipt_pdf_url: receiptPdfUrl,
        amount: paymentData.amount
      }
    });

    return { success: true, receiptPdfUrl };
  } catch (error) {
    console.error('Payment workflow error:', error);
    throw error;
  }
}
```

### Workflow 2: Prescription Creation

```typescript
async function createPrescription(prescriptionData: {
  patient_id: string;
  doctor_id: string;
  diagnosis: string;
  medications: Array<any>;
  advice: string;
  follow_up_days: number;
}) {
  try {
    // 1. Get patient and doctor details
    const [patientResult, doctorResult] = await Promise.all([
      supabase.from('patients').select('*').eq('id', prescriptionData.patient_id).single(),
      supabase.from('doctors').select('*').eq('id', prescriptionData.doctor_id).single()
    ]);

    const patient = patientResult.data;
    const doctor = doctorResult.data;

    // 2. Create prescription record
    const prescriptionId = `PRX-${Date.now()}`;
    const { data: prescription } = await supabase
      .from('prescriptions')
      .insert({
        id: prescriptionId,
        patient_id: prescriptionData.patient_id,
        doctor_id: prescriptionData.doctor_id,
        diagnosis: prescriptionData.diagnosis,
        medications: prescriptionData.medications,
        advice: prescriptionData.advice,
        prescribed_at: new Date().toISOString()
      })
      .select()
      .single();

    // 3. Generate PDF
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + prescriptionData.follow_up_days);

    const { url: prescriptionPdfUrl } = await generatePrescriptionPDF({
      prescription_id: prescriptionId,
      patient_name: patient.name,
      patient_age: patient.age,
      patient_gender: patient.gender,
      doctor_name: doctor.name,
      doctor_qualification: doctor.qualification,
      doctor_license: doctor.license_number,
      prescription_date: new Date().toISOString(),
      diagnosis: prescriptionData.diagnosis,
      medications: prescriptionData.medications,
      advice: prescriptionData.advice,
      follow_up_date: followUpDate.toISOString(),
      tenant_name: 'HealthCare Plus',
      tenant_address: '123 Medical Street, Mumbai'
    });

    // 4. Update prescription with PDF URL
    await supabase
      .from('prescriptions')
      .update({ pdf_url: prescriptionPdfUrl })
      .eq('id', prescriptionId);

    // 5. Send WhatsApp notification
    await sendWhatsAppTemplate({
      to: `91${patient.phone}`,
      template: 'prescription_ready_pdf',
      variables: {
        patient_name: patient.name,
        doctor_name: doctor.name,
        prescription_date: format(new Date(), 'dd MMM yyyy'),
        diagnosis: prescriptionData.diagnosis,
        prescription_id: prescriptionId,
        prescription_pdf_url: prescriptionPdfUrl,
        advice: prescriptionData.advice,
        follow_up_date: format(followUpDate, 'dd MMM yyyy'),
        clinic_name: 'HealthCare Plus'
      }
    });

    return { success: true, prescription, prescriptionPdfUrl };
  } catch (error) {
    console.error('Prescription creation error:', error);
    throw error;
  }
}
```

---

## Testing

### Test Page

A complete test page is available at: `/pdf-test`

**File**: `src/pages/PDFTestPage.tsx`

Features:
- Test receipt generation with sample data
- Test prescription generation with sample data
- Live PDF preview
- Download and open in new tab options
- Editable form fields

### Manual Testing Steps

1. **Setup Storage**:
   ```bash
   # Run in Supabase SQL Editor
   # Copy contents from: database/setup_pdf_storage.sql
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Navigate to Test Page**:
   ```
   http://localhost:5173/pdf-test
   ```

4. **Test Receipt**:
   - Fill in receipt details
   - Click "Generate Receipt PDF"
   - Verify PDF appears in preview
   - Check PDF content is correct
   - Test download functionality

5. **Test Prescription**:
   - Fill in prescription details
   - Click "Generate Prescription PDF"
   - Verify PDF appears in preview
   - Check medication table renders correctly
   - Test download functionality

6. **Verify Storage**:
   - Go to Supabase Dashboard → Storage
   - Check `receipts` bucket has new files
   - Check `prescriptions` bucket has new files
   - Test public URL access

---

## Database Schema Updates

Add PDF URL columns to relevant tables:

```sql
-- Add receipt PDF URL to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS receipt_id TEXT,
ADD COLUMN IF NOT EXISTS receipt_pdf_url TEXT;

-- Add prescription PDF URL to prescriptions table
ALTER TABLE prescriptions
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Add lab report PDF URL (future)
ALTER TABLE lab_reports
ADD COLUMN IF NOT EXISTS report_pdf_url TEXT;
```

---

## WhatsApp Integration

### Payment Receipt Message

```typescript
import { sendWhatsAppTemplate } from '@/services/whatsappService';

await sendWhatsAppTemplate({
  to: '919876543210',
  template: 'payment_receipt_pdf',
  variables: {
    patient_name: 'Rajesh Kumar',
    amount: '500',
    receipt_id: 'RCT-2024-001',
    payment_date: '15 Nov 2024, 2:30 PM',
    payment_method: 'UPI',
    service_type: 'Consultation',
    receipt_pdf_url: 'https://qfneoowktsirwpzehgxp.supabase.co/storage/v1/object/public/receipts/receipt_RCT-2024-001.pdf',
    clinic_name: 'HealthCare Plus'
  }
});
```

### Prescription Ready Message

```typescript
await sendWhatsAppTemplate({
  to: '919876543210',
  template: 'prescription_ready_pdf',
  variables: {
    patient_name: 'Priya Sharma',
    doctor_name: 'Dr. Amit Verma',
    prescription_date: '15 Nov 2024',
    diagnosis: 'Common Cold',
    prescription_id: 'PRX-2024-001',
    prescription_pdf_url: 'https://qfneoowktsirwpzehgxp.supabase.co/storage/v1/object/public/prescriptions/prescription_PRX-2024-001.pdf',
    advice: 'Take medicines after meals',
    follow_up_date: '22 Nov 2024',
    clinic_name: 'HealthCare Plus'
  }
});
```

See `WHATSAPP_TEMPLATES_UPDATED_PDF.md` for all 10 templates.

---

## Email Integration

### Using emailService.ts

```typescript
import { sendEmail } from '@/services/emailService';

// Send receipt via email
await sendEmail({
  to: 'patient@email.com',
  subject: 'Your Payment Receipt - HealthCare Plus',
  html: `
    <h2>Payment Receipt</h2>
    <p>Dear ${patient_name},</p>
    <p>Thank you for your payment of ₹${amount}.</p>
    <p><a href="${receipt_pdf_url}">Download Receipt PDF</a></p>
    <p>Receipt Number: ${receipt_id}</p>
  `
});

// Send prescription via email
await sendEmail({
  to: 'patient@email.com',
  subject: 'Your Prescription - HealthCare Plus',
  html: `
    <h2>Prescription Ready</h2>
    <p>Dear ${patient_name},</p>
    <p>Your prescription from Dr. ${doctor_name} is ready.</p>
    <p><a href="${prescription_pdf_url}">Download Prescription PDF</a></p>
    <p>Diagnosis: ${diagnosis}</p>
  `
});
```

---

## PDF Customization

### Receipt PDF Customization

Edit `src/services/pdfService.ts` → `generateReceiptPDF()`:

```typescript
// Change header color
doc.setTextColor(37, 99, 235); // Blue (RGB)

// Change table style
autoTable(doc, {
  theme: 'grid',          // 'striped' | 'grid' | 'plain'
  headStyles: {
    fillColor: [37, 99, 235],  // Header background color
    textColor: [255, 255, 255], // Header text color
    fontSize: 11
  },
  bodyStyles: {
    fontSize: 10
  }
});

// Add logo (if you have image URL)
doc.addImage(logoUrl, 'PNG', 10, 10, 30, 30);
```

### Prescription PDF Customization

```typescript
// Change header background
doc.setFillColor(37, 99, 235);
doc.rect(0, 0, pageWidth, 35, 'F');

// Add watermark
doc.setTextColor(200, 200, 200);
doc.setFontSize(50);
doc.text('COPY', pageWidth / 2, 150, {
  align: 'center',
  angle: 45
});

// Add doctor's signature image
doc.addImage(signatureUrl, 'PNG', pageWidth - 70, yPos - 20, 50, 20);
```

---

## Storage Management

### Set File Size Limits

In Supabase Dashboard → Storage → Settings:

```
Max file size: 5 MB (receipts)
Max file size: 10 MB (prescriptions)
```

### Auto-Delete Old Files

Create an Edge Function to clean up old PDFs:

```typescript
// supabase/functions/cleanup-old-pdfs/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Delete receipts older than 90 days
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 90)

  const { data: oldFiles } = await supabase.storage
    .from('receipts')
    .list('', {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'asc' }
    })

  const filesToDelete = oldFiles
    ?.filter(file => new Date(file.created_at) < cutoffDate)
    .map(file => file.name) || []

  if (filesToDelete.length > 0) {
    await supabase.storage.from('receipts').remove(filesToDelete)
  }

  return new Response(
    JSON.stringify({ deleted: filesToDelete.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

Schedule with cron:
```bash
# Run daily at 2 AM
0 2 * * * curl -X POST https://[project-ref].supabase.co/functions/v1/cleanup-old-pdfs
```

---

## Error Handling

### Common Errors

**1. Storage Policy Error**
```
Error: Failed to upload receipt: new row violates row-level security policy
```

**Solution**: Run `database/setup_pdf_storage.sql` to create policies.

**2. File Size Too Large**
```
Error: File size exceeds maximum allowed size
```

**Solution**: Reduce PDF content or increase storage limits.

**3. Invalid Font**
```
Error: Font 'helvetica-bold' not found
```

**Solution**: Use standard fonts: `helvetica`, `times`, `courier`

### Error Handling in Code

```typescript
try {
  const { url, filename } = await generateReceiptPDF(receiptData);
  return { success: true, url };
} catch (error: any) {
  console.error('PDF generation error:', error);

  // Log to error tracking service
  logError('PDF_GENERATION_FAILED', {
    error: error.message,
    receiptData
  });

  // Show user-friendly message
  showToast({
    title: 'PDF Generation Failed',
    description: 'Unable to generate receipt. Please try again or contact support.',
    variant: 'destructive'
  });

  return { success: false, error: error.message };
}
```

---

## Performance Optimization

### 1. Generate PDFs in Background

```typescript
// Use Web Worker for large PDFs
const worker = new Worker('/pdf-worker.js');

worker.postMessage({ type: 'generate-prescription', data: prescriptionData });

worker.onmessage = async (e) => {
  if (e.data.type === 'pdf-ready') {
    const pdfBlob = e.data.blob;
    // Upload to Supabase
    await uploadPDF(pdfBlob);
  }
};
```

### 2. Cache Generated PDFs

```typescript
// Check if PDF already exists before generating
const existingPdf = await supabase
  .from('prescriptions')
  .select('pdf_url')
  .eq('id', prescriptionId)
  .single();

if (existingPdf?.data?.pdf_url) {
  return existingPdf.data.pdf_url;
}

// Generate new PDF only if not exists
const { url } = await generatePrescriptionPDF(data);
return url;
```

### 3. Compress PDFs

```typescript
// Use lower resolution for images
doc.addImage(imageUrl, 'JPEG', x, y, w, h, undefined, 'FAST');

// Reduce font size where possible
doc.setFontSize(8); // Instead of 10
```

---

## Security Considerations

### 1. Validate Input Data

```typescript
function validateReceiptData(data: any): boolean {
  if (!data.patient_name || data.patient_name.length > 100) return false;
  if (!data.amount || data.amount < 0 || data.amount > 1000000) return false;
  if (!data.receipt_id || !/^RCT-\d{4}-\d{3}$/.test(data.receipt_id)) return false;
  return true;
}

if (!validateReceiptData(receiptData)) {
  throw new Error('Invalid receipt data');
}
```

### 2. Sanitize Patient Data

```typescript
function sanitize(text: string): string {
  return text
    .replace(/[<>]/g, '')
    .substring(0, 200);
}

const safeData = {
  ...receiptData,
  patient_name: sanitize(receiptData.patient_name),
  patient_email: sanitize(receiptData.patient_email)
};
```

### 3. Rate Limiting

```typescript
// Limit PDF generation per user
const rateLimiter = new Map();

async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `pdf_gen_${userId}`;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10;

  const requests = rateLimiter.get(key) || [];
  const recentRequests = requests.filter((time: number) => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return false;
  }

  recentRequests.push(now);
  rateLimiter.set(key, recentRequests);
  return true;
}
```

---

## Monitoring & Analytics

### Track PDF Generation

```typescript
// Log PDF generation events
await supabase.from('pdf_generation_logs').insert({
  user_id: userId,
  pdf_type: 'receipt',
  file_size: pdfBlob.size,
  generation_time_ms: endTime - startTime,
  status: 'success',
  created_at: new Date().toISOString()
});
```

### Storage Usage Dashboard

```sql
-- Query to monitor storage usage
SELECT
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_size_bytes,
  SUM(metadata->>'size')::bigint / 1024 / 1024 as total_size_mb
FROM storage.objects
WHERE bucket_id IN ('receipts', 'prescriptions')
GROUP BY bucket_id;
```

---

## Troubleshooting

### PDF Not Generating

1. Check browser console for errors
2. Verify Supabase connection
3. Check storage bucket exists
4. Verify RLS policies are correct
5. Check file size limits

### PDF Upload Fails

1. Check authentication status
2. Verify storage bucket is public
3. Check network connectivity
4. Verify file size is under limit

### PDF Shows Incorrect Data

1. Verify input data format
2. Check date formatting
3. Validate medication array structure
4. Check for null/undefined values

---

## Next Steps

1. **Add Logo**: Upload clinic logo to Supabase Storage and add to PDFs
2. **Digital Signatures**: Implement doctor's digital signature
3. **QR Codes**: Add QR codes for verification
4. **Multiple Languages**: Support Hindi, Tamil, etc.
5. **Custom Templates**: Allow clinics to customize PDF design
6. **Batch Generation**: Generate multiple PDFs at once
7. **Email Attachments**: Attach PDFs directly to emails

---

## Support

- **Documentation**: See all files in this repo
- **Test Page**: http://localhost:5173/pdf-test
- **WhatsApp Templates**: WHATSAPP_TEMPLATES_UPDATED_PDF.md
- **Email**: support@aisurgeonpilot.com

---

**Version**: 1.0
**Last Updated**: November 15, 2024
**Author**: AI Surgeon Pilot Team
