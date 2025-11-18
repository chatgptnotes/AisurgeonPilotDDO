import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  FileText,
  X,
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
  Activity,
  Stethoscope,
  Brain
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { extractTextFromPDF } from '@/utils/pdfExtractor';
import { extractTextFromImage } from '@/utils/ocrExtractor';
import { parseMedicalText } from '@/utils/medicalTextParser';

export type DocumentCategory = 'blood' | 'radiology' | 'previous';

interface UploadedDocument {
  id: string;
  file: File;
  category: DocumentCategory;
  extractedText: string;
  parsedData: Record<string, string>;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface DocumentUploadProps {
  onTextExtracted: (category: DocumentCategory, extractedData: Record<string, string>) => void;
  className?: string;
}

const categoryConfig = {
  blood: {
    title: 'Blood Investigation Reports',
    description: 'CBC, RBS, HbA1c, Lipid Profile, etc.',
    icon: Activity,
    color: 'bg-red-50 border-red-200 text-red-700',
    acceptedFiles: '.pdf,.jpg,.jpeg,.png'
  },
  radiology: {
    title: 'Radiology Reports',
    description: 'X-Ray, CT, MRI, USG reports',
    icon: Stethoscope,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    acceptedFiles: '.pdf,.jpg,.jpeg,.png'
  },
  previous: {
    title: 'Previous Consultation Reports',
    description: 'OPD history, Discharge summaries',
    icon: Brain,
    color: 'bg-green-50 border-green-200 text-green-700',
    acceptedFiles: '.pdf,.jpg,.jpeg,.png'
  }
};

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onTextExtracted,
  className = ''
}) => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('blood');
  const { toast } = useToast();

  const processDocument = async (document: UploadedDocument) => {
    try {
      // Update status to processing
      setDocuments(prev => prev.map(doc =>
        doc.id === document.id
          ? { ...doc, status: 'processing', progress: 20 }
          : doc
      ));

      let extractedText = '';

      // Extract text based on file type
      if (document.file.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(document.file);
        setDocuments(prev => prev.map(doc =>
          doc.id === document.id ? { ...doc, progress: 60 } : doc
        ));
      } else if (document.file.type.startsWith('image/')) {
        extractedText = await extractTextFromImage(document.file);
        setDocuments(prev => prev.map(doc =>
          doc.id === document.id ? { ...doc, progress: 60 } : doc
        ));
      } else {
        throw new Error('Unsupported file type');
      }

      // Parse the extracted text based on category
      const parsedData = await parseMedicalText(extractedText, document.category);

      // Update document with results
      setDocuments(prev => prev.map(doc =>
        doc.id === document.id
          ? {
              ...doc,
              extractedText,
              parsedData,
              status: 'completed',
              progress: 100
            }
          : doc
      ));

      // Notify parent component
      onTextExtracted(document.category, parsedData);

      toast({
        title: "Document Processed",
        description: `Successfully extracted text from ${document.file.name}`,
      });

    } catch (error) {
      console.error('Error processing document:', error);

      setDocuments(prev => prev.map(doc =>
        doc.id === document.id
          ? {
              ...doc,
              status: 'error',
              error: error instanceof Error ? error.message : 'Processing failed'
            }
          : doc
      ));

      toast({
        title: "Processing Error",
        description: `Failed to process ${document.file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newDocuments: UploadedDocument[] = acceptedFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      category: selectedCategory,
      extractedText: '',
      parsedData: {},
      status: 'uploading' as const,
      progress: 0
    }));

    setDocuments(prev => [...prev, ...newDocuments]);

    // Process each document
    for (const doc of newDocuments) {
      await processDocument(doc);
    }
  }, [selectedCategory]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const viewDocument = (document: UploadedDocument) => {
    const url = URL.createObjectURL(document.file);
    window.open(url, '_blank');
  };

  const downloadExtractedText = (document: UploadedDocument) => {
    const blob = new Blob([document.extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${document.file.name}_extracted.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: UploadedDocument['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Category Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(categoryConfig).map(([key, config]) => {
          const Icon = config.icon;
          const isSelected = selectedCategory === key;

          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? `${config.color} border-2`
                  : 'hover:bg-gray-50 border'
              }`}
              onClick={() => setSelectedCategory(key as DocumentCategory)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Icon className={`h-6 w-6 mt-1 ${
                    isSelected ? '' : 'text-gray-500'
                  }`} />
                  <div className="flex-1">
                    <h3 className={`font-semibold text-sm ${
                      isSelected ? '' : 'text-gray-700'
                    }`}>
                      {config.title}
                    </h3>
                    <p className={`text-xs mt-1 ${
                      isSelected ? 'opacity-80' : 'text-gray-500'
                    }`}>
                      {config.description}
                    </p>
                    {isSelected && (
                      <Badge variant="secondary" className="mt-2">
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upload Area */}
      <Card className="border-dashed border-2">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-dashed border-2 rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />

            {isDragActive ? (
              <p className="text-blue-600 font-medium">
                Drop the files here for {categoryConfig[selectedCategory].title}
              </p>
            ) : (
              <div>
                <p className="text-gray-600 font-medium mb-2">
                  Upload {categoryConfig[selectedCategory].title}
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-gray-400 text-xs">
                  Supports PDF, JPG, PNG • Max 10MB per file
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {documents.map((document) => {
              const config = categoryConfig[document.category];
              const Icon = config.icon;

              return (
                <div key={document.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Icon className="h-5 w-5 text-gray-500 mt-1" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-sm truncate">
                            {document.file.name}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {config.title}
                          </Badge>
                          {getStatusIcon(document.status)}
                        </div>

                        <p className="text-xs text-gray-500 mb-2">
                          {(document.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>

                        {/* Progress Bar */}
                        {(document.status === 'uploading' || document.status === 'processing') && (
                          <div className="space-y-1">
                            <Progress value={document.progress} className="h-2" />
                            <p className="text-xs text-gray-500">
                              {document.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                            </p>
                          </div>
                        )}

                        {/* Error Message */}
                        {document.status === 'error' && document.error && (
                          <p className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                            {document.error}
                          </p>
                        )}

                        {/* Extracted Text Preview */}
                        {document.status === 'completed' && document.extractedText && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <p className="text-gray-700 line-clamp-3">
                              {document.extractedText.substring(0, 200)}...
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewDocument(document)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {document.status === 'completed' && document.extractedText && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadExtractedText(document)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(document.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentUpload;