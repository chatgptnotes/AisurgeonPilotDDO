import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  Image,
  X,
  Check,
  Loader2,
  Eye,
  Trash2,
  AlertCircle,
  FolderOpen
} from 'lucide-react';

interface PatientDocumentUploadProps {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  onUploadComplete?: () => void;
}

interface UploadedDocument {
  id: string;
  file_name: string;
  document_type: string;
  file_size: number;
  file_url: string;
  storage_path: string;
  created_at: string;
}

const DOCUMENT_TYPES = [
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'blood_test', label: 'Blood Test Report' },
  { value: 'xray', label: 'X-Ray / Scan' },
  { value: 'mri_ct', label: 'MRI / CT Scan' },
  { value: 'prescription', label: 'Previous Prescription' },
  { value: 'discharge_summary', label: 'Discharge Summary' },
  { value: 'medical_history', label: 'Medical History' },
  { value: 'insurance', label: 'Insurance Document' },
  { value: 'id_proof', label: 'ID Proof' },
  { value: 'other', label: 'Other Document' }
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const PatientDocumentUpload: React.FC<PatientDocumentUploadProps> = ({
  appointmentId,
  patientId,
  doctorId,
  onUploadComplete
}) => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  // Load existing documents
  useEffect(() => {
    loadDocuments();
  }, [appointmentId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointment_documents')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, JPG, PNG, or WebP files.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      toast.error('Please select a file and document type');
      return;
    }

    setUploading(true);
    try {
      // Generate unique file path
      const timestamp = Date.now();
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${timestamp}_${selectedFile.name}`;
      const storagePath = `appointments/${appointmentId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('patient_documents')
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get signed URL
      const { data: urlData } = await supabase.storage
        .from('patient_documents')
        .createSignedUrl(storagePath, 86400 * 7); // 7 days

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('appointment_documents')
        .insert({
          appointment_id: appointmentId,
          patient_id: patientId,
          doctor_id: doctorId,
          file_name: selectedFile.name,
          document_type: documentType,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          storage_path: storagePath,
          file_url: urlData?.signedUrl || '',
          uploaded_by: 'patient'
        });

      if (dbError) {
        // Cleanup uploaded file on db error
        await supabase.storage.from('patient_documents').remove([storagePath]);
        throw new Error(`Failed to save document: ${dbError.message}`);
      }

      toast.success('Document uploaded successfully');
      setSelectedFile(null);
      setDocumentType('');
      loadDocuments();
      onUploadComplete?.();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: UploadedDocument) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      // Delete from storage
      await supabase.storage.from('patient_documents').remove([doc.storage_path]);

      // Delete from database
      const { error } = await supabase
        .from('appointment_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      toast.success('Document deleted');
      loadDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleView = async (doc: UploadedDocument) => {
    try {
      const { data } = await supabase.storage
        .from('patient_documents')
        .createSignedUrl(doc.storage_path, 3600);

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      toast.error('Failed to open document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentTypeLabel = (value: string) => {
    return DOCUMENT_TYPES.find(t => t.value === value)?.label || value;
  };

  return (
    <Card className="border-2 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-orange-600" />
          Upload Medical Documents
        </CardTitle>
        <CardDescription>
          Share your medical reports, prescriptions, or test results with your doctor before the consultation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="space-y-4">
          {/* Document Type Selection */}
          <div>
            <Label className="text-sm font-medium">Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="mt-1 bg-white">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-orange-500 bg-orange-100'
                : selectedFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-white hover:border-orange-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />

            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                {selectedFile.type.startsWith('image/') ? (
                  <Image className="h-8 w-8 text-green-600" />
                ) : (
                  <FileText className="h-8 w-8 text-green-600" />
                )}
                <div className="text-left">
                  <p className="font-medium text-green-800">{selectedFile.name}</p>
                  <p className="text-sm text-green-600">{formatFileSize(selectedFile.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-orange-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, JPG, PNG or WebP (max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <Button
            className="w-full bg-orange-600 hover:bg-orange-700"
            onClick={handleUpload}
            disabled={!selectedFile || !documentType || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </div>

        {/* Uploaded Documents List */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          </div>
        ) : documents.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Uploaded Documents ({documents.length})
            </h4>
            <div className="space-y-2">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {doc.file_type?.startsWith('image/') ? (
                      <Image className="h-5 w-5 text-blue-600" />
                    ) : (
                      <FileText className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {doc.file_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getDocumentTypeLabel(doc.document_type)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(doc.file_size)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(doc)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No documents uploaded yet</p>
            <p className="text-xs mt-1">Upload your medical reports to share with your doctor</p>
          </div>
        )}

        {/* Info Note */}
        <div className="bg-white rounded-lg p-3 border text-sm">
          <p className="font-medium text-orange-800 mb-1">Why upload documents?</p>
          <ul className="text-gray-600 space-y-1 text-xs">
            <li>- Your doctor can review reports before the consultation</li>
            <li>- Helps in better diagnosis and treatment planning</li>
            <li>- All documents are securely stored and accessible only to your doctor</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientDocumentUpload;
