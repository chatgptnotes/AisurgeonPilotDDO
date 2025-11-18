import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Plus,
  UserCheck,
  Stethoscope,
  Heart,
  Eye,
  Bone,
  Brain,
  Mic,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ConsultantNotesForm from './ConsultantNotesForm';

export interface Consultant {
  id: string;
  name: string;
  specialty: string;
  department: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export interface ConsultantVisit {
  id: string;
  consultantId: string;
  consultant: Consultant;
  notes: any; // Will contain the notes data structure
  voiceSessionId?: string;
  status: 'pending' | 'in_progress' | 'completed';
  startTime?: Date;
  endTime?: Date;
}

interface MultiConsultantNotesProps {
  visitId: string;
  patientId: string;
  onNotesUpdate?: (consultantVisits: ConsultantVisit[]) => void;
  className?: string;
}

// Predefined consultant specialties with icons and colors
const CONSULTANT_SPECIALTIES: Record<string, Consultant> = {
  orthopedic: {
    id: 'orthopedic',
    name: 'Orthopedic Surgeon',
    specialty: 'Orthopedics',
    department: 'Orthopedic Surgery',
    icon: Bone,
    color: 'blue'
  },
  cardiology: {
    id: 'cardiology',
    name: 'Cardiologist',
    specialty: 'Cardiology',
    department: 'Cardiology',
    icon: Heart,
    color: 'red'
  },
  ophthalmology: {
    id: 'ophthalmology',
    name: 'Ophthalmologist',
    specialty: 'Ophthalmology',
    department: 'Eye Care',
    icon: Eye,
    color: 'green'
  },
  neurology: {
    id: 'neurology',
    name: 'Neurologist',
    specialty: 'Neurology',
    department: 'Neurology',
    icon: Brain,
    color: 'purple'
  },
  general: {
    id: 'general',
    name: 'General Physician',
    specialty: 'General Medicine',
    department: 'General Medicine',
    icon: Stethoscope,
    color: 'gray'
  }
};

export const MultiConsultantNotes: React.FC<MultiConsultantNotesProps> = ({
  visitId,
  patientId,
  onNotesUpdate,
  className = ''
}) => {
  const [consultantVisits, setConsultantVisits] = useState<ConsultantVisit[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [showAddConsultant, setShowAddConsultant] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [customConsultantName, setCustomConsultantName] = useState('');
  const { toast } = useToast();

  // Load existing consultant visits from database
  useEffect(() => {
    loadConsultantVisits();
  }, [visitId]);

  // Initialize with at least one general consultant if none exist
  useEffect(() => {
    if (consultantVisits.length === 0) {
      addConsultant('general');
    }
  }, [consultantVisits.length]);

  const loadConsultantVisits = async () => {
    try {
      // TODO: Implement database loading
      // For now, we'll start with an empty array
      const visits: ConsultantVisit[] = [];
      setConsultantVisits(visits);
    } catch (error) {
      console.error('Error loading consultant visits:', error);
      toast({
        title: "Error",
        description: "Failed to load consultant visits",
        variant: "destructive",
      });
    }
  };

  const addConsultant = (specialtyId: string, customName?: string) => {
    const specialty = CONSULTANT_SPECIALTIES[specialtyId];
    if (!specialty) return;

    const consultant: Consultant = {
      ...specialty,
      name: customName || specialty.name
    };

    const newVisit: ConsultantVisit = {
      id: `visit-${Date.now()}-${Math.random()}`,
      consultantId: consultant.id,
      consultant,
      notes: {},
      status: 'pending',
      startTime: new Date()
    };

    const updatedVisits = [...consultantVisits, newVisit];
    setConsultantVisits(updatedVisits);
    setActiveTab(newVisit.id);

    // Reset form
    setSelectedSpecialty('');
    setCustomConsultantName('');
    setShowAddConsultant(false);

    onNotesUpdate?.(updatedVisits);

    toast({
      title: "Consultant Added",
      description: `${consultant.name} has been added to this visit`,
    });
  };

  const removeConsultant = (visitId: string) => {
    const updatedVisits = consultantVisits.filter(visit => visit.id !== visitId);
    setConsultantVisits(updatedVisits);

    // If the active tab was removed, switch to the first available tab
    if (activeTab === visitId && updatedVisits.length > 0) {
      setActiveTab(updatedVisits[0].id);
    }

    onNotesUpdate?.(updatedVisits);

    toast({
      title: "Consultant Removed",
      description: "Consultant has been removed from this visit",
    });
  };

  const updateConsultantNotes = (visitId: string, notes: any) => {
    const updatedVisits = consultantVisits.map(visit =>
      visit.id === visitId
        ? { ...visit, notes, status: 'in_progress' as const }
        : visit
    );
    setConsultantVisits(updatedVisits);
    onNotesUpdate?.(updatedVisits);
  };

  const markConsultantComplete = (visitId: string) => {
    const updatedVisits = consultantVisits.map(visit =>
      visit.id === visitId
        ? { ...visit, status: 'completed' as const, endTime: new Date() }
        : visit
    );
    setConsultantVisits(updatedVisits);
    onNotesUpdate?.(updatedVisits);

    toast({
      title: "Consultation Completed",
      description: "Consultant notes have been marked as complete",
    });
  };

  const handleAddConsultant = () => {
    if (!selectedSpecialty) {
      toast({
        title: "Selection Required",
        description: "Please select a consultant specialty",
        variant: "destructive",
      });
      return;
    }

    addConsultant(selectedSpecialty, customConsultantName || undefined);
  };

  const getTabColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700',
      red: 'data-[state=active]:bg-red-100 data-[state=active]:text-red-700',
      green: 'data-[state=active]:bg-green-100 data-[state=active]:text-green-700',
      purple: 'data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700',
      gray: 'data-[state=active]:bg-gray-100 data-[state=active]:text-gray-700'
    };
    return colorMap[color] || colorMap.gray;
  };

  const getStatusBadge = (status: ConsultantVisit['status']) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800' }
    };

    const config = statusConfig[status];
    return (
      <Badge className={`text-xs ${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  // Set the first tab as active if none is selected
  useEffect(() => {
    if (!activeTab && consultantVisits.length > 0) {
      setActiveTab(consultantVisits[0].id);
    }
  }, [consultantVisits, activeTab]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Multi-Consultant Notes
          </CardTitle>

          <Dialog open={showAddConsultant} onOpenChange={setShowAddConsultant}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Consultant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Consultant to Visit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="specialty">Consultant Specialty</Label>
                  <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONSULTANT_SPECIALTIES).map(([key, specialty]) => {
                        const Icon = specialty.icon;
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {specialty.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="consultantName">Consultant Name (Optional)</Label>
                  <Input
                    id="consultantName"
                    value={customConsultantName}
                    onChange={(e) => setCustomConsultantName(e.target.value)}
                    placeholder="Enter specific doctor name"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddConsultant(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddConsultant}>
                    Add Consultant
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {consultantVisits.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserCheck className="h-8 w-8 mx-auto mb-2" />
            <p>No consultants added to this visit</p>
            <Button
              className="mt-2"
              variant="outline"
              onClick={() => setShowAddConsultant(true)}
            >
              Add First Consultant
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-auto gap-1 mb-4" style={{ gridTemplateColumns: `repeat(${consultantVisits.length}, 1fr)` }}>
              {consultantVisits.map((visit) => {
                const Icon = visit.consultant.icon;
                return (
                  <TabsTrigger
                    key={visit.id}
                    value={visit.id}
                    className={`flex items-center gap-2 relative ${getTabColor(visit.consultant.color)}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{visit.consultant.specialty}</span>
                    {getStatusBadge(visit.status)}

                    {/* Remove button - only show if more than 1 consultant */}
                    {consultantVisits.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 ml-1 hover:bg-red-100 text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeConsultant(visit.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {consultantVisits.map((visit) => (
              <TabsContent key={visit.id} value={visit.id} className="space-y-4">
                <div className="border-l-4 pl-4 mb-4" style={{ borderColor: `var(--${visit.consultant.color}-500)` }}>
                  <h3 className="font-semibold text-lg">{visit.consultant.name}</h3>
                  <p className="text-sm text-gray-600">{visit.consultant.department}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Started: {visit.startTime?.toLocaleTimeString()}</span>
                    {visit.endTime && (
                      <span>Completed: {visit.endTime.toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>

                <ConsultantNotesForm
                  visitId={visitId}
                  consultantVisit={visit}
                  patientId={patientId}
                  onNotesChange={(notes) => updateConsultantNotes(visit.id, notes)}
                  onMarkComplete={() => markConsultantComplete(visit.id)}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiConsultantNotes;