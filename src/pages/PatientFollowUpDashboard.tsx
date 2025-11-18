/**
 * Patient Follow-Up Dashboard
 * Version: 1.3
 *
 * Dashboard for tracking indecisive surgery patients
 * Shows decision journey status, engagement metrics, and quick actions
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { PatientDecisionJourney } from '@/types/ai-followup-types';

interface PatientJourneyWithDetails extends PatientDecisionJourney {
  patient?: {
    name: string;
    phone: string | null;
    email: string | null;
  };
  diagnosis?: {
    name: string;
  };
}

const PatientFollowUpDashboard = () => {
  const [journeys, setJourneys] = useState<PatientJourneyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [selectedJourney, setSelectedJourney] = useState<PatientJourneyWithDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchJourneys();
  }, []);

  const fetchJourneys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patient_decision_journey')
        .select(`
          *,
          patient:patients(name, phone, email),
          diagnosis:diagnoses(name)
        `)
        .in('current_stage', ['initial_consultation', 'education_phase', 'options_review', 'decision_making'])
        .order('last_contact_date', { ascending: true, nullsFirst: true });

      if (error) throw error;
      setJourneys(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendContent = async (journeyId: string, patientName: string) => {
    toast({
      title: 'Content Sent',
      description: `Educational content sent to ${patientName}`,
    });
    // TODO: Implement actual content sending logic
  };

  const handleScheduleCall = async (journeyId: string, patientName: string) => {
    toast({
      title: 'Call Scheduled',
      description: `Voice call scheduled for ${patientName}`,
    });
    // TODO: Implement actual call scheduling logic
  };

  const viewDetails = (journey: PatientJourneyWithDetails) => {
    setSelectedJourney(journey);
    setIsDetailsOpen(true);
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      initial_consultation: 'bg-gray-100 text-gray-800',
      education_phase: 'bg-blue-100 text-blue-800',
      options_review: 'bg-yellow-100 text-yellow-800',
      decision_making: 'bg-orange-100 text-orange-800',
      surgery_scheduled: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getStageLabel = (stage: string) => {
    return stage.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getEngagementColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDaysOverdue = (lastContact: string | null, deadlineDate: string | null) => {
    if (!lastContact && !deadlineDate) return null;

    const now = new Date();
    if (deadlineDate) {
      const deadline = new Date(deadlineDate);
      const diffTime = now.getTime() - deadline.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) return diffDays;
    }

    if (lastContact) {
      const lastContactDate = new Date(lastContact);
      const diffTime = now.getTime() - lastContactDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 7) return diffDays - 7; // More than 7 days since last contact
    }

    return null;
  };

  const filteredJourneys = journeys.filter(journey => {
    const patientName = journey.patient?.name || '';
    const diagnosisName = journey.diagnosis?.name || '';
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         diagnosisName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = filterStage === 'all' || journey.current_stage === filterStage;
    return matchesSearch && matchesStage;
  });

  // Calculate statistics
  const stats = {
    total: filteredJourneys.length,
    highEngagement: filteredJourneys.filter(j => j.engagement_score >= 70).length,
    needsAttention: filteredJourneys.filter(j => getDaysOverdue(j.last_contact_date, j.decision_deadline) !== null && getDaysOverdue(j.last_contact_date, j.decision_deadline)! > 0).length,
    avgEngagement: filteredJourneys.length > 0
      ? Math.round(filteredJourneys.reduce((sum, j) => sum + j.engagement_score, 0) / filteredJourneys.length)
      : 0,
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Patient Follow-Up Dashboard</h1>
        <p className="text-gray-600 mt-1">Track patients pending surgery decisions and engagement</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Pending Decisions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.highEngagement}</div>
            <div className="text-sm text-gray-600">High Engagement</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.needsAttention}</div>
            <div className="text-sm text-gray-600">Needs Attention</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.avgEngagement}%</div>
            <div className="text-sm text-gray-600">Avg Engagement</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <Input
          placeholder="Search patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="initial_consultation">Initial Consultation</SelectItem>
            <SelectItem value="education_phase">Education Phase</SelectItem>
            <SelectItem value="options_review">Options Review</SelectItem>
            <SelectItem value="decision_making">Decision Making</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchJourneys}>
          Refresh
        </Button>
      </div>

      {/* Patient List */}
      {loading ? (
        <div className="text-center py-12">Loading patients...</div>
      ) : filteredJourneys.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No patients found matching criteria
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJourneys.map((journey) => {
            const daysOverdue = getDaysOverdue(journey.last_contact_date, journey.decision_deadline);

            return (
              <Card key={journey.id} className={`hover:shadow-md transition-shadow ${daysOverdue && daysOverdue > 0 ? 'border-orange-300 border-2' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {journey.patient?.name || 'Unknown Patient'}
                        </h3>
                        <Badge className={getStageColor(journey.current_stage)}>
                          {getStageLabel(journey.current_stage)}
                        </Badge>
                        {daysOverdue && daysOverdue > 0 && (
                          <Badge variant="destructive">
                            {daysOverdue} days overdue
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        {journey.diagnosis?.name && (
                          <div>
                            <span className="font-medium">Diagnosis:</span> {journey.diagnosis.name}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Consultation Date:</span>{' '}
                          {new Date(journey.initial_consultation_date).toLocaleDateString()}
                        </div>
                        {journey.last_contact_date && (
                          <div>
                            <span className="font-medium">Last Contact:</span>{' '}
                            {new Date(journey.last_contact_date).toLocaleDateString()}
                            {journey.last_contact_method && ` (${journey.last_contact_method})`}
                          </div>
                        )}
                        {journey.decision_deadline && (
                          <div>
                            <span className="font-medium">Decision Deadline:</span>{' '}
                            {new Date(journey.decision_deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {/* Engagement Metrics */}
                      <div className="mt-3 flex space-x-6 text-sm">
                        <div>
                          <span className="text-gray-500">Engagement:</span>{' '}
                          <span className={`font-semibold ${getEngagementColor(journey.engagement_score)}`}>
                            {journey.engagement_score}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Content Sent:</span>{' '}
                          <span className="font-semibold">{journey.total_education_content_sent}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Content Viewed:</span>{' '}
                          <span className="font-semibold">{journey.total_education_content_viewed}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Voice Calls:</span>{' '}
                          <span className="font-semibold">{journey.total_voice_calls}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">WhatsApp:</span>{' '}
                          <span className="font-semibold">{journey.total_whatsapp_messages}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendContent(journey.id, journey.patient?.name || 'Patient')}
                      >
                        Send Content
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleScheduleCall(journey.id, journey.patient?.name || 'Patient')}
                      >
                        Schedule Call
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => viewDetails(journey)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Journey Details</DialogTitle>
            <DialogDescription>
              {selectedJourney?.patient?.name} - Complete decision journey timeline
            </DialogDescription>
          </DialogHeader>

          {selectedJourney && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div>
                <h3 className="font-semibold mb-2">Patient Information</h3>
                <div className="text-sm space-y-1">
                  <div><span className="font-medium">Name:</span> {selectedJourney.patient?.name}</div>
                  {selectedJourney.patient?.phone && (
                    <div><span className="font-medium">Phone:</span> {selectedJourney.patient.phone}</div>
                  )}
                  {selectedJourney.patient?.email && (
                    <div><span className="font-medium">Email:</span> {selectedJourney.patient.email}</div>
                  )}
                  {selectedJourney.diagnosis?.name && (
                    <div><span className="font-medium">Diagnosis:</span> {selectedJourney.diagnosis.name}</div>
                  )}
                </div>
              </div>

              {/* Journey Status */}
              <div>
                <h3 className="font-semibold mb-2">Journey Status</h3>
                <div className="space-y-2">
                  <Badge className={getStageColor(selectedJourney.current_stage)}>
                    {getStageLabel(selectedJourney.current_stage)}
                  </Badge>
                  {selectedJourney.decision_confidence_level && (
                    <div className="text-sm">
                      <span className="font-medium">Confidence Level:</span>{' '}
                      {selectedJourney.decision_confidence_level.replace('_', ' ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Concerns & Questions */}
              {selectedJourney.concerns && selectedJourney.concerns.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Patient Concerns</h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {selectedJourney.concerns.map((concern, idx) => (
                      <li key={idx}>{concern}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedJourney.patient_questions && selectedJourney.patient_questions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Patient Questions</h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {selectedJourney.patient_questions.map((question, idx) => (
                      <li key={idx}>{question}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Engagement Summary */}
              <div>
                <h3 className="font-semibold mb-2">Engagement Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Content Sent</div>
                    <div className="text-2xl font-bold">{selectedJourney.total_education_content_sent}</div>
                  </div>
                  <div>
                    <div className="font-medium">Content Viewed</div>
                    <div className="text-2xl font-bold">{selectedJourney.total_education_content_viewed}</div>
                  </div>
                  <div>
                    <div className="font-medium">Voice Calls</div>
                    <div className="text-2xl font-bold">{selectedJourney.total_voice_calls}</div>
                  </div>
                  <div>
                    <div className="font-medium">WhatsApp Messages</div>
                    <div className="text-2xl font-bold">{selectedJourney.total_whatsapp_messages}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientFollowUpDashboard;
