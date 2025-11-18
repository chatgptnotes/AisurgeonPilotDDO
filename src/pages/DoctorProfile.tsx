import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Star,
  Calendar,
  DollarSign,
  Languages,
  Clock,
  Award,
  Video,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

interface Doctor {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  specialties: string[];
  languages: string[];
  bio: string;
  qualifications: any[];
  experience_years: number;
  consultation_fee_standard: number;
  consultation_fee_followup: number;
  followup_window_days: number;
  profile_photo_url: string;
  rating_avg: number;
  rating_count: number;
  currency: string;
  cancellation_policy: string;
}

interface Availability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

const DoctorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (id) {
      loadDoctorProfile();
    }
  }, [id]);

  const loadDoctorProfile = async () => {
    try {
      // Load doctor details
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single();

      if (doctorError) throw doctorError;
      setDoctor(doctorData);

      // Load availability
      const { data: availData, error: availError } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', id)
        .eq('is_active', true)
        .order('day_of_week');

      if (availError) throw availError;
      setAvailability(availData || []);
    } catch (error) {
      console.error('Error loading doctor profile:', error);
      toast.error('Failed to load doctor profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Doctor not found</p>
          <Button onClick={() => navigate('/doctors')}>
            Back to Directory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/doctors')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Directory
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-6">
                  <img
                    src={doctor.profile_photo_url || 'https://via.placeholder.com/120'}
                    alt={doctor.full_name}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-2">{doctor.full_name}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {doctor.specialties?.map(specialty => (
                        <Badge key={specialty} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>

                    {doctor.rating_count > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${
                                star <= doctor.rating_avg
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-lg font-medium">{doctor.rating_avg.toFixed(1)}</span>
                        <span className="text-gray-500">({doctor.rating_count} reviews)</span>
                      </div>
                    )}

                    {doctor.experience_years && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Award className="h-5 w-5" />
                        <span>{doctor.experience_years} years of experience</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* About */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">About</h3>
                  <p className="text-gray-700">{doctor.bio}</p>
                </div>

                {/* Languages */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    Languages
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {doctor.languages?.map(language => (
                      <Badge key={language} variant="outline">
                        {language}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Qualifications */}
                {doctor.qualifications && doctor.qualifications.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Qualifications
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {doctor.qualifications.map((qual, idx) => (
                        <li key={idx}>{typeof qual === 'string' ? qual : JSON.stringify(qual)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Contact */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
                  <div className="space-y-2 text-gray-700">
                    {doctor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{doctor.phone}</span>
                      </div>
                    )}
                    {doctor.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{doctor.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availability.length === 0 ? (
                  <p className="text-gray-600">No availability set</p>
                ) : (
                  <div className="space-y-2">
                    {availability.map((slot, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <span className="font-medium">{dayNames[slot.day_of_week]}</span>
                        <span className="text-gray-600">
                          {slot.start_time} - {slot.end_time}
                        </span>
                        <Badge variant="outline">
                          {slot.slot_duration_minutes} min slots
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Policies */}
            {doctor.cancellation_policy && (
              <Card>
                <CardHeader>
                  <CardTitle>Cancellation Policy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{doctor.cancellation_policy}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Book Appointment</CardTitle>
                <CardDescription>Choose a consultation type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Standard Consultation */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Standard Consultation</h4>
                    <Video className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-1 text-2xl font-bold text-blue-600 mb-2">
                    <DollarSign className="h-6 w-6" />
                    {doctor.currency} {doctor.consultation_fee_standard}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    First-time consultation or new medical issue
                  </p>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => navigate(`/book/${doctor.id}?type=standard`)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Standard
                  </Button>
                </div>

                {/* Follow-up Consultation */}
                {doctor.consultation_fee_followup && (
                  <div className="p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Follow-up Consultation</h4>
                      <Video className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex items-center gap-1 text-2xl font-bold text-green-600 mb-2">
                      <DollarSign className="h-6 w-6" />
                      {doctor.currency} {doctor.consultation_fee_followup}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Within {doctor.followup_window_days} days of previous visit
                    </p>
                    <p className="text-xs text-green-700 mb-3">
                      Save {doctor.currency}{' '}
                      {doctor.consultation_fee_standard - doctor.consultation_fee_followup}!
                    </p>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => navigate(`/book/${doctor.id}?type=followup`)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Follow-up
                    </Button>
                  </div>
                )}

                <div className="text-xs text-gray-500 text-center pt-2 border-t">
                  All consultations are conducted via secure video call
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
