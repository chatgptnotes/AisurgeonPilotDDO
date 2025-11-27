import { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Copy, Share2, Video, Link, Calendar, Clock, Mail, MessageSquare, Check } from 'lucide-react';

interface MeetingDetails {
  title: string;
  date: string;
  time: string;
  duration: string;
  platform: string;
  meetingLink: string;
  meetingId?: string;
  passcode?: string;
  description: string;
  agenda: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  doctorName?: string;
}

export function MeetingSetupModal({ open, onClose, doctorName }: Props) {
  const [activeTab, setActiveTab] = useState('setup');
  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails>({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    duration: '30',
    platform: 'google-meet',
    meetingLink: '',
    meetingId: '',
    passcode: '',
    description: '',
    agenda: '',
  });
  const [copied, setCopied] = useState<string | null>(null);

  // Generate a meeting link based on platform
  const generateMeetingLink = () => {
    const { platform } = meetingDetails;
    let link = '';

    switch (platform) {
      case 'google-meet':
        // Generate a Google Meet style link (mock)
        const meetCode = Math.random().toString(36).substring(2, 14);
        link = `https://meet.google.com/${meetCode.slice(0, 3)}-${meetCode.slice(3, 7)}-${meetCode.slice(7, 10)}`;
        break;
      case 'zoom':
        // Generate a Zoom style link (mock)
        const zoomId = Math.floor(100000000 + Math.random() * 900000000);
        link = `https://zoom.us/j/${zoomId}`;
        setMeetingDetails(prev => ({ ...prev, meetingId: zoomId.toString(), passcode: Math.random().toString(36).substring(2, 8) }));
        break;
      case 'teams':
        // Generate a Teams style link (mock)
        const teamsId = Math.random().toString(36).substring(2, 20);
        link = `https://teams.microsoft.com/l/meetup-join/${teamsId}`;
        break;
      case 'custom':
        // User will provide their own link
        link = meetingDetails.meetingLink;
        break;
      default:
        link = '';
    }

    setGeneratedLink(link);
    setMeetingDetails(prev => ({ ...prev, meetingLink: link }));
    toast.success('Meeting link generated!');
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getFormattedMeetingText = () => {
    const { title, date, time, duration, platform, meetingLink, meetingId, passcode, description, agenda } = meetingDetails;
    const formattedDate = format(new Date(date), 'EEEE, MMMM d, yyyy');
    const formattedTime = format(new Date(`${date}T${time}`), 'h:mm a');

    let text = `Meeting: ${title || 'Medical Consultation'}\n`;
    text += `Date: ${formattedDate}\n`;
    text += `Time: ${formattedTime}\n`;
    text += `Duration: ${duration} minutes\n`;
    text += `Platform: ${getPlatformName(platform)}\n`;
    text += `\nJoin Link: ${meetingLink}\n`;

    if (meetingId) {
      text += `Meeting ID: ${meetingId}\n`;
    }
    if (passcode) {
      text += `Passcode: ${passcode}\n`;
    }
    if (description) {
      text += `\nDescription:\n${description}\n`;
    }
    if (agenda) {
      text += `\nAgenda:\n${agenda}\n`;
    }

    text += `\n---\nSent by Dr. ${doctorName || 'Doctor'} via AI Surgeon Pilot`;

    return text;
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'google-meet': return 'Google Meet';
      case 'zoom': return 'Zoom';
      case 'teams': return 'Microsoft Teams';
      case 'custom': return 'Custom Link';
      default: return platform;
    }
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(getFormattedMeetingText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
    toast.success('Opening WhatsApp...');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Meeting Invitation: ${meetingDetails.title || 'Medical Consultation'}`);
    const body = encodeURIComponent(getFormattedMeetingText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    toast.success('Opening email client...');
  };

  const shareViaSMS = () => {
    const text = encodeURIComponent(getFormattedMeetingText());
    window.open(`sms:?body=${text}`, '_blank');
    toast.success('Opening SMS...');
  };

  const handleSave = () => {
    if (!meetingDetails.title) {
      toast.error('Please enter a meeting title');
      return;
    }
    if (!meetingDetails.meetingLink) {
      toast.error('Please generate or enter a meeting link');
      return;
    }

    // Save to localStorage for future reference
    const savedMeetings = JSON.parse(localStorage.getItem('doctor_meetings') || '[]');
    savedMeetings.push({
      ...meetingDetails,
      createdAt: new Date().toISOString(),
      id: Date.now().toString(),
    });
    localStorage.setItem('doctor_meetings', JSON.stringify(savedMeetings.slice(-10))); // Keep last 10

    toast.success('Meeting details saved!');
    setActiveTab('share');
  };

  const resetForm = () => {
    setMeetingDetails({
      title: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      duration: '30',
      platform: 'google-meet',
      meetingLink: '',
      meetingId: '',
      passcode: '',
      description: '',
      agenda: '',
    });
    setGeneratedLink('');
    setActiveTab('setup');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-600" />
            Meeting Setup
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Setup Meeting
            </TabsTrigger>
            <TabsTrigger value="share" className="flex items-center gap-2" disabled={!meetingDetails.meetingLink}>
              <Share2 className="h-4 w-4" />
              Share
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4 mt-4">
            {/* Meeting Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Follow-up Consultation, Post-Surgery Review"
                value={meetingDetails.title}
                onChange={(e) => setMeetingDetails(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={meetingDetails.date}
                  onChange={(e) => setMeetingDetails(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={meetingDetails.time}
                  onChange={(e) => setMeetingDetails(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>

            {/* Duration and Platform */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select
                  value={meetingDetails.duration}
                  onValueChange={(value) => setMeetingDetails(prev => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={meetingDetails.platform}
                  onValueChange={(value) => setMeetingDetails(prev => ({ ...prev, platform: value, meetingLink: '', meetingId: '', passcode: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google-meet">Google Meet</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                    <SelectItem value="custom">Custom Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Meeting Link */}
            <div className="space-y-2">
              <Label htmlFor="meetingLink">Meeting Link *</Label>
              <div className="flex gap-2">
                <Input
                  id="meetingLink"
                  placeholder={meetingDetails.platform === 'custom' ? 'Paste your meeting link' : 'Click Generate to create link'}
                  value={meetingDetails.meetingLink}
                  onChange={(e) => setMeetingDetails(prev => ({ ...prev, meetingLink: e.target.value }))}
                  readOnly={meetingDetails.platform !== 'custom'}
                />
                {meetingDetails.platform !== 'custom' && (
                  <Button onClick={generateMeetingLink} variant="outline">
                    <Link className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                )}
              </div>
              {meetingDetails.platform === 'custom' && (
                <p className="text-xs text-gray-500">
                  Paste your own meeting link from any video conferencing platform
                </p>
              )}
            </div>

            {/* Zoom specific fields */}
            {meetingDetails.platform === 'zoom' && meetingDetails.meetingId && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meeting ID</Label>
                  <div className="flex gap-2">
                    <Input value={meetingDetails.meetingId} readOnly />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(meetingDetails.meetingId || '', 'Meeting ID')}
                    >
                      {copied === 'Meeting ID' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Passcode</Label>
                  <div className="flex gap-2">
                    <Input value={meetingDetails.passcode} readOnly />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(meetingDetails.passcode || '', 'Passcode')}
                    >
                      {copied === 'Passcode' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the meeting purpose..."
                value={meetingDetails.description}
                onChange={(e) => setMeetingDetails(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Agenda */}
            <div className="space-y-2">
              <Label htmlFor="agenda">Agenda (Optional)</Label>
              <Textarea
                id="agenda"
                placeholder="Meeting agenda items..."
                value={meetingDetails.agenda}
                onChange={(e) => setMeetingDetails(prev => ({ ...prev, agenda: e.target.value }))}
                rows={3}
              />
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
              <Button onClick={handleSave} disabled={!meetingDetails.meetingLink}>
                <Check className="h-4 w-4 mr-2" />
                Save & Continue to Share
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="share" className="space-y-4 mt-4">
            {/* Meeting Summary Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-600" />
                  {meetingDetails.title || 'Medical Consultation'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{format(new Date(meetingDetails.date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{format(new Date(`${meetingDetails.date}T${meetingDetails.time}`), 'h:mm a')} ({meetingDetails.duration} min)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    {getPlatformName(meetingDetails.platform)}
                  </Badge>
                </div>

                <div className="bg-white p-3 rounded-lg border">
                  <Label className="text-xs text-gray-500">Meeting Link</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-sm text-blue-600 break-all">{meetingDetails.meetingLink}</code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(meetingDetails.meetingLink, 'Link')}
                    >
                      {copied === 'Link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {meetingDetails.platform === 'zoom' && meetingDetails.meetingId && (
                  <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border">
                    <div>
                      <Label className="text-xs text-gray-500">Meeting ID</Label>
                      <p className="font-mono">{meetingDetails.meetingId}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Passcode</Label>
                      <p className="font-mono">{meetingDetails.passcode}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Share Options */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Share Meeting Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={shareViaWhatsApp}
                  >
                    <MessageSquare className="h-5 w-5 mr-3 text-green-600" />
                    <div className="text-left">
                      <div className="font-medium">WhatsApp</div>
                      <div className="text-xs text-gray-500">Share via WhatsApp</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={shareViaEmail}
                  >
                    <Mail className="h-5 w-5 mr-3 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium">Email</div>
                      <div className="text-xs text-gray-500">Send via Email</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={shareViaSMS}
                  >
                    <MessageSquare className="h-5 w-5 mr-3 text-purple-600" />
                    <div className="text-left">
                      <div className="font-medium">SMS</div>
                      <div className="text-xs text-gray-500">Send via Text</div>
                    </div>
                  </Button>
                </div>

                <div className="border-t pt-3">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => copyToClipboard(getFormattedMeetingText(), 'Meeting details')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Full Meeting Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Message Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-lg border font-sans">
                  {getFormattedMeetingText()}
                </pre>
              </CardContent>
            </Card>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveTab('setup')}>
                Edit Meeting
              </Button>
              <Button onClick={onClose}>
                Done
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
