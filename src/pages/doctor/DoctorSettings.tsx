import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Save,
  ArrowLeft,
  Video,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import {
  validateZoomLink,
  extractZoomMeetingId,
  formatZoomLink,
  getZoomValidationError,
  ZOOM_EXAMPLE,
} from '@/utils/meetingLinkValidator';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialization?: string;
  zoom_meeting_link?: string;
  zoom_password?: string;
  zoom_meeting_id?: string;
  zoom_instructions?: string;
}

export default function DoctorSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [zoomLink, setZoomLink] = useState('');
  const [zoomPassword, setZoomPassword] = useState('');
  const [zoomMeetingId, setZoomMeetingId] = useState('');
  const [instructions, setInstructions] = useState(
    'Please join 5 minutes before your appointment time.'
  );

  // Validation state
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isLinkValid, setIsLinkValid] = useState(false);

  // Load doctor settings
  useEffect(() => {
    loadDoctorSettings();
  }, [user]);

  // Auto-extract meeting ID from link
  useEffect(() => {
    if (zoomLink) {
      const formattedLink = formatZoomLink(zoomLink);
      if (formattedLink !== zoomLink) {
        setZoomLink(formattedLink);
      }

      const extractedId = extractZoomMeetingId(formattedLink);
      if (extractedId) {
        setZoomMeetingId(extractedId);
      }

      // Validate link
      const error = getZoomValidationError(formattedLink);
      setLinkError(error);
      setIsLinkValid(!error);
    } else {
      setLinkError(null);
      setIsLinkValid(false);
    }
  }, [zoomLink]);

  const loadDoctorSettings = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setDoctor(data);
        setZoomLink(data.zoom_meeting_link || '');
        setZoomPassword(data.zoom_password || '');
        setZoomMeetingId(data.zoom_meeting_id || '');
        setInstructions(
          data.zoom_instructions ||
            'Please join 5 minutes before your appointment time.'
        );
      }
    } catch (error) {
      console.error('Error loading doctor settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!doctor?.id) {
      toast.error('Doctor profile not found');
      return;
    }

    if (!isLinkValid && zoomLink) {
      toast.error(linkError || 'Invalid Zoom link');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          zoom_meeting_link: zoomLink || null,
          zoom_password: zoomPassword || null,
          zoom_meeting_id: zoomMeetingId || null,
          zoom_instructions: instructions,
        })
        .eq('id', doctor.id);

      if (error) throw error;

      toast.success('Zoom meeting settings saved successfully!');
      setHasChanges(false);

      // Reload settings to confirm
      await loadDoctorSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    if (zoomLink) {
      navigator.clipboard.writeText(zoomLink);
      toast.success('Zoom link copied to clipboard!');
    }
  };

  const testLink = () => {
    if (zoomLink) {
      window.open(zoomLink, '_blank', 'width=1200,height=800');
    }
  };

  const handleFieldChange = (setter: (value: string) => void, value: string) => {
    setter(value);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/doctor/dashboard')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Zoom Meeting Settings</h1>
              <p className="text-gray-600 mt-1">
                Configure your permanent Zoom room for patient consultations
              </p>
            </div>
          </div>
        </div>

        {/* Alert Banner */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Video className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">
                  One Permanent Zoom Link
                </h3>
                <p className="text-sm text-blue-700">
                  Set up your permanent Zoom meeting room link. Patients will receive this
                  link with all their video appointments, making it easier for them to join
                  consultations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Zoom Meeting Details
            </CardTitle>
            <CardDescription>
              Configure your permanent Zoom meeting room
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Zoom Link */}
            <div className="space-y-2">
              <Label htmlFor="zoomLink">
                Zoom Meeting Link <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="zoomLink"
                    type="url"
                    placeholder={ZOOM_EXAMPLE}
                    value={zoomLink}
                    onChange={(e) => handleFieldChange(setZoomLink, e.target.value)}
                    className={linkError ? 'border-red-500' : isLinkValid ? 'border-green-500' : ''}
                  />
                  {linkError && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {linkError}
                    </div>
                  )}
                  {isLinkValid && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Valid Zoom link
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyLink}
                  disabled={!zoomLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={testLink}
                  disabled={!isLinkValid}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Example: {ZOOM_EXAMPLE}
              </p>
            </div>

            {/* Meeting ID (auto-extracted) */}
            <div className="space-y-2">
              <Label htmlFor="meetingId">Meeting ID</Label>
              <Input
                id="meetingId"
                type="text"
                placeholder="Auto-extracted from link"
                value={zoomMeetingId}
                onChange={(e) => handleFieldChange(setZoomMeetingId, e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Automatically extracted from your Zoom link
              </p>
            </div>

            {/* Meeting Password */}
            <div className="space-y-2">
              <Label htmlFor="zoomPassword">Meeting Password (Optional)</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="zoomPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter Zoom meeting password if required"
                    value={zoomPassword}
                    onChange={(e) =>
                      handleFieldChange(setZoomPassword, e.target.value)
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions for Patients</Label>
              <Textarea
                id="instructions"
                placeholder="Enter any special instructions for patients..."
                value={instructions}
                onChange={(e) => handleFieldChange(setInstructions, e.target.value)}
                rows={4}
              />
              <p className="text-xs text-gray-500">
                These instructions will be shown to patients with their appointment
                details
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        {zoomLink && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Patient View Preview
              </CardTitle>
              <CardDescription className="text-green-700">
                This is how patients will see your Zoom meeting information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold mb-3">Join Zoom Consultation</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Platform:</span>
                    <span>Zoom</span>
                  </div>
                  {zoomMeetingId && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Meeting ID:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {zoomMeetingId}
                      </code>
                    </div>
                  )}
                  {zoomPassword && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Password:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {zoomPassword}
                      </code>
                    </div>
                  )}
                </div>
                <Button className="w-full mt-4" disabled>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Join Zoom Meeting
                </Button>
                {instructions && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-900">{instructions}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warning if no link */}
        {!zoomLink && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-1">
                    No Zoom Link Configured
                  </h3>
                  <p className="text-sm text-yellow-700">
                    Patients won't be able to join video consultations until you set up
                    your Zoom meeting link. Please configure your permanent Zoom room above.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/doctor/dashboard')}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges || (zoomLink && !isLinkValid)}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
