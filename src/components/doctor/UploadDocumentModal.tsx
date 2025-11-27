import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, X, CheckCircle, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  doctorId: string;
  onUploadComplete?: () => void;
}

const documentTypes = [
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'medical_report', label: 'Medical Report' },
  { value: 'xray_scan', label: 'X-Ray / Scan Report' },
  { value: 'discharge_summary', label: 'Discharge Summary' },
  { value: 'referral_letter', label: 'Referral Letter' },
  { value: 'insurance_doc', label: 'Insurance Document' },
  { value: 'other', label: 'Other Document' },
];

export function UploadDocumentModal({
  open,
  onClose,
  patientId,
  patientName,
  doctorId,
  onUploadComplete
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      // Auto-fill document name from file name
      if (!documentName) {
        setDocumentName(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [documentName]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const resetForm = () => {
    setFile(null);
    setDocumentType('');
    setDocumentName('');
    setRemarks('');
    setUploadProgress(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleUpload = async () => {
    if (!file || !documentType) {
      toast.error('Please select a file and document type');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Generate unique file path
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}_${documentName || 'document'}.${fileExt}`;
      const filePath = `patients/${patientId}/${documentType}/${fileName}`;

      setUploadProgress(30);

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        // If bucket doesn't exist, try with medical-documents bucket
        const { data: altUploadData, error: altError } = await supabase.storage
          .from('medical-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (altError) {
          throw new Error(`Upload failed: ${altError.message}`);
        }
      }

      setUploadProgress(60);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(uploadData ? 'patient-documents' : 'medical-documents')
        .getPublicUrl(filePath);

      setUploadProgress(80);

      // Save document metadata to database - always published so patient can see it
      const { error: dbError } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: patientId,
          document_type_id: documentTypes.findIndex(d => d.value === documentType) + 1,
          document_name: documentName || file.name,
          file_name: file.name,
          file_path: filePath,
          file_url: urlData?.publicUrl || '',
          file_size: file.size,
          file_type: file.type,
          storage_bucket: uploadData ? 'patient-documents' : 'medical-documents',
          is_uploaded: true,
          uploaded_at: new Date().toISOString(),
          uploaded_by: doctorId,
          remarks: remarks || null,
          is_published: true,
          published_at: new Date().toISOString(),
          published_by: doctorId,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        // Continue anyway - file is uploaded
        toast.warning('Document uploaded but metadata save failed');
      }

      setUploadProgress(100);

      toast.success('Document uploaded! Patient can now view it in their portal.');

      onUploadComplete?.();
      handleClose();

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Document for {patientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : file
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-green-800">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">
                  {isDragActive
                    ? 'Drop the file here...'
                    : 'Drag & drop a file here, or click to select'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  PDF, JPG, PNG (max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="document-type">Document Type *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="document-name">Document Name</Label>
            <Input
              id="document-name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Enter document name"
            />
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (optional)</Label>
            <Input
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any notes about this document"
            />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Uploading...</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || !documentType || uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
