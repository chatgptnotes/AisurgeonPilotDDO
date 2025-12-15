import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, Check, Share2, Link2, MessageSquare, Mail } from 'lucide-react';

interface ShareBookingLinkCardProps {
  doctorId: string;
  doctorSlug: string | null;
  doctorName: string;
}

export function ShareBookingLinkCard({ doctorId, doctorSlug, doctorName }: ShareBookingLinkCardProps) {
  const [copied, setCopied] = useState(false);

  // Generate the shareable URL (prefer slug over UUID for cleaner URLs)
  const getBookingUrl = () => {
    const baseUrl = window.location.origin;
    if (doctorSlug) {
      return `${baseUrl}/book/${doctorSlug}`;
    }
    // Fallback to UUID if no slug exists
    return `${baseUrl}/book/${doctorId}`;
  };

  const bookingUrl = getBookingUrl();

  // Copy to clipboard handler
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      toast.success('Booking link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  // Share via WhatsApp
  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `Book an appointment with Dr. ${doctorName}:\n${bookingUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // Share via Email
  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Book an appointment with Dr. ${doctorName}`);
    const body = encodeURIComponent(
      `Dear Patient,\n\nYou can book an appointment with Dr. ${doctorName} using this link:\n${bookingUrl}\n\nBest regards,\nDr. ${doctorName}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Share2 className="h-5 w-5 text-blue-600" />
          Share My Booking Link
          <Badge className="ml-2 bg-blue-500 text-white text-xs">NEW</Badge>
        </CardTitle>
        <CardDescription>
          Share this link with patients to let them book appointments directly with you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Display */}
        <div className="bg-white p-3 rounded-lg border flex items-center gap-2">
          <Link2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <code className="flex-1 text-sm text-blue-600 break-all truncate">
            {bookingUrl}
          </code>
          <Button
            size="sm"
            variant="outline"
            onClick={copyToClipboard}
            className="flex-shrink-0"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        {/* Share Options */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={shareViaWhatsApp}
          >
            <MessageSquare className="h-4 w-4 text-green-600" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={shareViaEmail}
          >
            <Mail className="h-4 w-4 text-blue-600" />
            Email
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500">
          Patients who click this link will go directly to your booking page
        </p>
      </CardContent>
    </Card>
  );
}
