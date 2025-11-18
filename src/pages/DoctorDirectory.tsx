import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Star, Calendar, DollarSign, Languages, MapPin } from 'lucide-react';

interface Doctor {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  specialties: string[];
  languages: string[];
  bio: string;
  consultation_fee_standard: number;
  consultation_fee_followup: number;
  profile_photo_url: string;
  rating_avg: number;
  rating_count: number;
  currency: string;
}

const DoctorDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_verified', true)
        .eq('is_accepting_patients', true)
        .order('rating_avg', { ascending: false });

      if (error) throw error;

      setDoctors(data || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique specialties for filter
  const allSpecialties = Array.from(
    new Set(doctors.flatMap(d => d.specialties || []))
  ).sort();

  // Filter doctors based on search and specialty
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = searchTerm === '' ||
      doctor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialties?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSpecialty = selectedSpecialty === 'all' ||
      doctor.specialties?.includes(selectedSpecialty);

    return matchesSearch && matchesSpecialty;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Find a Doctor</h1>
              <p className="text-gray-600 mt-1">Book appointments with verified healthcare professionals</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/patient-dashboard')}
            >
              My Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="all">All Specialties</option>
              {allSpecialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredDoctors.length} of {doctors.length} doctors
          </div>
        </div>

        {/* Doctor Grid */}
        {filteredDoctors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No doctors found matching your criteria.</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedSpecialty('all');
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <Card
                key={doctor.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/doctor/${doctor.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <img
                      src={doctor.profile_photo_url || 'https://via.placeholder.com/80'}
                      alt={doctor.full_name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <CardTitle className="text-lg">{doctor.full_name}</CardTitle>
                      <CardDescription>
                        {doctor.specialties?.slice(0, 2).join(', ')}
                      </CardDescription>

                      {doctor.rating_count > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{doctor.rating_avg.toFixed(1)}</span>
                          <span className="text-xs text-gray-500">({doctor.rating_count} reviews)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {doctor.bio}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Languages className="h-4 w-4" />
                    <span>{doctor.languages?.slice(0, 3).join(', ')}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold text-gray-900">
                        {doctor.currency} {doctor.consultation_fee_standard}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/book/${doctor.id}`);
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDirectory;
