import { Button } from '@/components/ui/button';
import { Video, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  appointment: {
    mode: string;
    start_at: string;
    doctors?: {
      zoom_meeting_link?: string;
      zoom_password?: string;
    };
  };
}

export function MeetingLinkButton({ appointment }: Props) {
  // Check if doctor has a permanent Zoom link configured
  if (!appointment.doctors?.zoom_meeting_link || appointment.mode !== 'video') {
    if (appointment.mode === 'phone') {
      return (
        <Badge variant="outline" className="w-full justify-center">
          <Phone className="h-3 w-3 mr-1" />
          Doctor will call you
        </Badge>
      );
    }
    return null;
  }

  const appointmentTime = new Date(appointment.start_at);
  const now = new Date();
  const minutesUntil = (appointmentTime.getTime() - now.getTime()) / 1000 / 60;

  // Show join button 15 minutes before appointment
  const canJoin = minutesUntil <= 15 && minutesUntil >= -60;

  const handleJoin = () => {
    window.open(appointment.doctors?.zoom_meeting_link, '_blank', 'width=1200,height=800');
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleJoin}
        disabled={!canJoin}
        className="w-full"
        variant={canJoin ? 'default' : 'secondary'}
      >
        <Video className="h-4 w-4 mr-2" />
        {canJoin ? 'Join Zoom Meeting' : 'Link Available 15 Min Before'}
      </Button>
      {appointment.doctors.zoom_password && (
        <div className="text-xs text-center text-muted-foreground">
          Password: <code className="font-mono">{appointment.doctors.zoom_password}</code>
        </div>
      )}
    </div>
  );
}
