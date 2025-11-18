import { supabase } from '@/integrations/supabase/client';
import { DocumentCategory } from '@/components/DocumentUpload';

export interface DocumentUploadData {
  visitId: string;
  patientId: string;
  hospitalId: string;
  category: DocumentCategory;
  file: File;
  extractedText: string;
  parsedData: Record<string, string>;
}

/**
 * Upload a document to Supabase Storage and save metadata to database
 */
export const uploadDocument = async (data: DocumentUploadData): Promise<string> => {
  try {
    const {
      visitId,
      patientId,
      hospitalId,
      category,
      file,
      extractedText,
      parsedData
    } = data;

    // Generate unique file path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `${hospitalId}/${category}/${visitId}/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('medical-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Save document metadata to database
    const { data: documentData, error: dbError } = await supabase
      .from('document_uploads')
      .insert([
        {
          visit_id: visitId,
          patient_id: patientId,
          hospital_id: hospitalId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          category: category,
          storage_path: filePath,
          extracted_text: extractedText,
          parsed_data: parsedData,
          processing_status: 'completed',
          uploaded_by: user?.id
        }
      ])
      .select()
      .single();

    if (dbError) {
      // If database insert fails, try to clean up the uploaded file
      await supabase.storage
        .from('medical-documents')
        .remove([filePath]);

      throw new Error(`Failed to save document metadata: ${dbError.message}`);
    }

    return documentData.id;

  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

/**
 * Get signed URL for downloading a document
 */
export const getDocumentUrl = async (storagePath: string): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from('medical-documents')
      .createSignedUrl(storagePath, 3600); // URL valid for 1 hour

    if (error) {
      throw new Error(`Failed to get document URL: ${error.message}`);
    }

    return data.signedUrl;

  } catch (error) {
    console.error('Error getting document URL:', error);
    throw error;
  }
};

/**
 * List all documents for a visit
 */
export const getVisitDocuments = async (visitId: string) => {
  try {
    const { data, error } = await supabase
      .from('document_uploads')
      .select('*')
      .eq('visit_id', visitId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch visit documents: ${error.message}`);
    }

    return data;

  } catch (error) {
    console.error('Error fetching visit documents:', error);
    throw error;
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (documentId: string): Promise<void> => {
  try {
    // First get the document to find its storage path
    const { data: document, error: fetchError } = await supabase
      .from('document_uploads')
      .select('storage_path')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch document: ${fetchError.message}`);
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('medical-documents')
      .remove([document.storage_path]);

    if (storageError) {
      console.warn('Failed to delete file from storage:', storageError.message);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('document_uploads')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      throw new Error(`Failed to delete document record: ${dbError.message}`);
    }

  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

/**
 * Update document processing status
 */
export const updateDocumentStatus = async (
  documentId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  error?: string
): Promise<void> => {
  try {
    const updateData: any = {
      processing_status: status,
      updated_at: new Date().toISOString()
    };

    if (error) {
      updateData.processing_error = error;
    }

    const { error: dbError } = await supabase
      .from('document_uploads')
      .update(updateData)
      .eq('id', documentId);

    if (dbError) {
      throw new Error(`Failed to update document status: ${dbError.message}`);
    }

  } catch (error) {
    console.error('Error updating document status:', error);
    throw error;
  }
};

/**
 * Search documents by text content
 */
export const searchDocuments = async (
  searchQuery: string,
  visitId?: string,
  category?: DocumentCategory
) => {
  try {
    let query = supabase
      .from('document_uploads')
      .select('*')
      .ilike('extracted_text', `%${searchQuery}%`);

    if (visitId) {
      query = query.eq('visit_id', visitId);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search documents: ${error.message}`);
    }

    return data;

  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};

/**
 * Create storage bucket if it doesn't exist
 */
export const initializeStorage = async (): Promise<void> => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'medical-documents');

    if (!bucketExists) {
      // Create the bucket
      const { error: createError } = await supabase.storage.createBucket('medical-documents', {
        public: false,
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/tiff',
          'image/bmp',
          'image/webp'
        ],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB
      });

      if (createError) {
        throw new Error(`Failed to create storage bucket: ${createError.message}`);
      }
    }

  } catch (error) {
    console.error('Error initializing storage:', error);
    throw error;
  }
};