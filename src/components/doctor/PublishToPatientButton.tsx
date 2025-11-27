import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export type PublishableType = 'document' | 'opd_summary' | 'bill' | 'prescription';

interface Props {
  type: PublishableType;
  documentId: string;
  patientId: string;
  isPublished: boolean;
  onPublished?: (published: boolean) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

const typeLabels: Record<PublishableType, string> = {
  document: 'document',
  opd_summary: 'OPD summary',
  bill: 'bill',
  prescription: 'prescription',
};

const tableMapping: Record<PublishableType, string> = {
  document: 'patient_documents',
  opd_summary: 'visits',
  bill: 'bills',
  prescription: 'prescriptions',
};

const fieldMapping: Record<PublishableType, { published: string; publishedAt: string; publishedBy?: string }> = {
  document: { published: 'is_published', publishedAt: 'published_at', publishedBy: 'published_by' },
  opd_summary: { published: 'opd_summary_published', publishedAt: 'opd_summary_published_at' },
  bill: { published: 'is_published', publishedAt: 'published_at' },
  prescription: { published: 'is_published', publishedAt: 'published_at' },
};

export function PublishToPatientButton({
  type,
  documentId,
  patientId,
  isPublished,
  onPublished,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
}: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(isPublished);

  const handleTogglePublish = async () => {
    setLoading(true);

    try {
      const table = tableMapping[type];
      const fields = fieldMapping[type];
      const newPublishedState = !published;

      const { data: { user } } = await supabase.auth.getUser();

      const updateData: Record<string, any> = {
        [fields.published]: newPublishedState,
        [fields.publishedAt]: newPublishedState ? new Date().toISOString() : null,
      };

      if (fields.publishedBy) {
        updateData[fields.publishedBy] = newPublishedState ? user?.id : null;
      }

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', documentId);

      if (error) {
        throw new Error(error.message);
      }

      setPublished(newPublishedState);
      onPublished?.(newPublishedState);

      toast.success(
        newPublishedState
          ? `${typeLabels[type].charAt(0).toUpperCase() + typeLabels[type].slice(1)} published to patient`
          : `${typeLabels[type].charAt(0).toUpperCase() + typeLabels[type].slice(1)} unpublished`
      );

    } catch (error) {
      console.error('Error updating publish status:', error);
      toast.error(`Failed to ${published ? 'unpublish' : 'publish'} ${typeLabels[type]}`);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className={published ? 'text-green-600 border-green-300 hover:bg-green-50' : ''}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : published ? (
          <>
            <CheckCircle className="h-4 w-4" />
            {showLabel && <span className="ml-2">Published</span>}
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            {showLabel && <span className="ml-2">Publish to Patient</span>}
          </>
        )}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {published ? 'Unpublish' : 'Publish'} {typeLabels[type]}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {published ? (
                <>
                  The patient will no longer be able to view this {typeLabels[type]} in their portal.
                </>
              ) : (
                <>
                  This {typeLabels[type]} will be visible to the patient in their portal.
                  They will be able to view and download it.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTogglePublish}
              disabled={loading}
              className={published ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : published ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {published ? 'Unpublish' : 'Publish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
