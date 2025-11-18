# PDF Generation - Quick Start Guide

## 1. Start Development Server

```bash
npm run dev
```

Server will start at: **http://localhost:8085/** (or next available port)

---

## 2. Test PDF Generation

Navigate to: **http://localhost:8085/pdf-test**

### Test Receipt
1. Default sample data is pre-filled
2. Click "Generate Receipt PDF"
3. View PDF preview
4. Test download

### Test Prescription
1. Default sample data is pre-filled
2. Click "Generate Prescription PDF"
3. View PDF preview with medications
4. Test download

---

## 3. Setup Supabase Storage (Before Production)

**IMPORTANT**: Run this SQL in Supabase Dashboard before using in production:

1. Go to: Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy contents from: `database/setup_pdf_storage.sql`
4. Click "Run"

This creates:
- `receipts` storage bucket
- `prescriptions` storage bucket
- Security policies for both

---

## 4. Use in Your Code

### Generate Receipt

```typescript
import { generateReceiptPDF } from '@/services/pdfService';

const { url, filename } = await generateReceiptPDF({
  receipt_id: 'RCT-2024-001',
  patient_name: 'Rajesh Kumar',
  patient_phone: '+91-9876543210',
  patient_email: 'rajesh@email.com',
  amount: 500,
  payment_date: new Date().toISOString(),
  payment_method: 'UPI',
  service_type: 'Consultation',
  tenant_name: 'HealthCare Plus Clinic',
  tenant_address: '123 Medical Street, Mumbai',
  tenant_phone: '+91-9876543210',
  tenant_email: 'contact@healthcareplus.com'
});

console.log('PDF URL:', url);
```

### Generate Prescription

```typescript
import { generatePrescriptionPDF } from '@/services/pdfService';

const { url, filename } = await generatePrescriptionPDF({
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
    }
  ],
  advice: 'Avoid dust and pollen',
  tenant_name: 'HealthCare Plus Clinic',
  tenant_address: '123 Medical Street, Mumbai'
});

console.log('PDF URL:', url);
```

---

## 5. Share via WhatsApp

```typescript
import { sendWhatsAppTemplate } from '@/services/whatsappService';

await sendWhatsAppTemplate({
  to: '919876543210',
  template: 'payment_receipt_pdf',
  variables: {
    patient_name: 'Rajesh Kumar',
    receipt_pdf_url: url, // <-- PDF URL from step 4
    amount: '500',
    // ... other variables
  }
});
```

---

## Files Location

- **PDF Service**: `src/services/pdfService.ts`
- **Storage Setup**: `database/setup_pdf_storage.sql`
- **Test Page**: `src/pages/PDFTestPage.tsx`
- **Full Documentation**: `PDF_GENERATION_GUIDE.md`

---

## Quick Troubleshooting

**PDF not generating?**
- Check browser console for errors
- Verify Supabase connection
- Run storage setup SQL

**Upload fails?**
- Check you're authenticated
- Verify storage buckets exist
- Check file size limits

**Need help?**
- See: `PDF_GENERATION_GUIDE.md` (850+ lines)
- See: `PDF_GENERATION_IMPLEMENTATION_SUMMARY.md`
- Test at: http://localhost:8085/pdf-test

---

**Status**: ✅ Ready to Use
**Test URL**: http://localhost:8085/pdf-test
**Version**: 1.0
