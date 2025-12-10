import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  FileText,
  Image,
  Eye,
  Download,
  Check,
  Loader2,
  FolderOpen,
  AlertCircle
} from 'lucide-react';

interface PatientDocumentsViewProps {
  appointmentId?: string;
  patientId?: string;
  compact?: boolean;
}

interface Document {
  id: string;
  file_name: string;
  document_type: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  is_reviewed: boolean;
  created_at: string;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  lab_report: 'Lab Report',
  blood_test: 'Blood Test',
  xray: 'X-Ray / Scan',
  mri_ct: 'MRI / CT Scan',
  prescription: 'Prescription',
  discharge_summary: 'Discharge Summary',
  medical_history: 'Medical History',
  insurance: 'Insurance',
  id_proof: 'ID Proof',
  other: 'Other'
};

export const PatientDocumentsView: React.FC<PatientDocumentsViewProps> = ({
  appointmentId,
  patientId,
  compact = false
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appointmentId || patientId) {
      loadDocuments();
    }
  }, [appointmentId, patientId]);

  const loadDocuments = async () => {
    try {
      let query = supabase
        .from('appointment_documents')
        .select('*')
        .order('created_at', { ascending: false });

      // Query by appointment_id if provided, otherwise by patient_id
      if (appointmentId) {
        query = query.eq('appointment_id', appointmentId);
      } else if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (doc: Document) => {
    try {
      const { data } = await supabase.storage
        .from('patient_documents')
        .createSignedUrl(doc.storage_path, 3600);

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }

      // Mark as reviewed
      if (!doc.is_reviewed) {
        await supabase
          .from('appointment_documents')
          .update({ is_reviewed: true, reviewed_at: new Date().toISOString() })
          .eq('id', doc.id);

        setDocuments(prev => prev.map(d =>
          d.id === doc.id ? { ...d, is_reviewed: true } : d
        ));
      }
    } catch (error) {
      toast.error('Failed to open document');
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data } = await supabase.storage
        .from('patient_documents')
        .download(doc.storage_path);

      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const unreviewed = documents.filter(d => !d.is_reviewed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (documents.length === 0) {
    if (compact) {
      return (
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          No documents uploaded
        </div>
      );
    }
    return null;
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-orange-600" />
            Patient Documents ({documents.length})
          </span>
          {unreviewed > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreviewed} new
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          {documents.slice(0, 3).map(doc => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-2 bg-orange-50 rounded text-sm"
            >
              <div className="flex items-center gap-2">
                {doc.file_type?.startsWith('image/') ? (
                  <Image className="h-4 w-4 text-blue-600" />
                ) : (
                  <FileText className="h-4 w-4 text-red-600" />
                )}
                <span className="truncate max-w-[150px]">{doc.file_name}</span>
                {!doc.is_reviewed && (
                  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                    New
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleView(doc)}>
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {documents.length > 3 && (
            <p className="text-xs text-gray-500 text-center">
              +{documents.length - 3} more documents
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="border-orange-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-orange-600" />
            Patient Uploaded Documents
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{documents.length} files</Badge>
            {unreviewed > 0 && (
              <Badge variant="destructive">{unreviewed} unreviewed</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {documents.map(doc => (
          <div
            key={doc.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              doc.is_reviewed ? 'bg-gray-50' : 'bg-orange-50 border-orange-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {doc.file_type?.startsWith('image/') ? (
                <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center">
                  <Image className="h-5 w-5 text-blue-600" />
                </div>
              ) : (
                <div className="h-10 w-10 bg-red-100 rounded flex items-center justify-center">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium truncate max-w-[200px]">
                  {doc.file_name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Badge variant="secondary" className="text-xs">
                    {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                  </Badge>
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>{format(new Date(doc.created_at), 'MMM d, h:mm a')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {doc.is_reviewed && (
                <Check className="h-4 w-4 text-green-600" />
              )}
              <Button variant="outline" size="sm" onClick={() => handleView(doc)}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PatientDocumentsView;
