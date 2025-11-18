import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SlotGenerationService, TimeSlot, generateSessionId } from '@/services/slotGenerationService';
import { format, addDays, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DrillingCalendarProps {
  doctorId: string;
  consultationTypeId: string;
  onSlotSelected: (slot: TimeSlot, lockId: string | null) => void;
  selectedDate?: Date;
  selectedSlot?: TimeSlot;
}

const DrillingCalendar: React.FC<DrillingCalendarProps> = ({
  doctorId,
  consultationTypeId,
  onSlotSelected,
  selectedDate: initialDate,
  selectedSlot: initialSlot
}) => {
  const [step, setStep] = useState<'date' | 'time'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | undefined>(initialSlot);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(generateSessionId());
  const [currentLockId, setCurrentLockId] = useState<string | null>(null);

  const slotService = new SlotGenerationService(doctorId);

  // When date is selected, move to time selection step
  useEffect(() => {
    if (selectedDate && step === 'date') {
      setStep('time');
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  // Cleanup: Release lock when component unmounts or date changes
  useEffect(() => {
    return () => {
      if (currentLockId) {
        slotService.unlockSlot(currentLockId);
      }
    };
  }, []);

  const loadAvailableSlots = async (date: Date) => {
    setLoading(true);
    try {
      const slots = await slotService.getAvailableSlots(date, consultationTypeId);
      setAvailableSlots(slots);

      if (slots.length === 0) {
        toast.info('No available slots for this date', {
          description: 'Please try another date.'
        });
      }
    } catch (error) {
      console.error('Error loading slots:', error);
      toast.error('Failed to load available slots');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // Release previous lock if any
    if (currentLockId) {
      slotService.unlockSlot(currentLockId);
      setCurrentLockId(null);
    }

    setSelectedDate(date);
    setSelectedSlot(undefined);
  };

  const handleSlotSelect = async (slot: TimeSlot) => {
    if (!slot.available) return;

    // Release previous lock
    if (currentLockId) {
      await slotService.unlockSlot(currentLockId);
      setCurrentLockId(null);
    }

    // Lock the selected slot
    const lock = await slotService.lockSlot(slot.start, slot.end, sessionId);

    if (!lock) {
      toast.error('Failed to reserve slot', {
        description: 'This slot may have been booked by someone else. Please try another slot.'
      });
      // Refresh slots
      if (selectedDate) {
        loadAvailableSlots(selectedDate);
      }
      return;
    }

    setCurrentLockId(lock.id);
    setSelectedSlot(slot);

    // Notify parent component
    onSlotSelected(slot, lock.id);

    toast.success('Time slot reserved for 10 minutes', {
      description: `${slot.startTime} - ${slot.endTime}`
    });
  };

  const handleBackToDateSelection = () => {
    // Release lock when going back
    if (currentLockId) {
      slotService.unlockSlot(currentLockId);
      setCurrentLockId(null);
    }

    setStep('date');
    setSelectedSlot(undefined);
  };

  const handleChangeDateFromTime = () => {
    handleBackToDateSelection();
  };

  // Filter dates: Only allow future dates
  const disabledDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Group slots by time period (morning, afternoon, evening)
  const groupSlotsByPeriod = (slots: TimeSlot[]) => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    slots.forEach(slot => {
      const hour = slot.start.getHours();
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  };

  const renderSlotButton = (slot: TimeSlot) => {
    const isSelected = selectedSlot &&
      slot.start.getTime() === selectedSlot.start.getTime();

    return (
      <Button
        key={slot.startTime}
        variant={isSelected ? 'default' : 'outline'}
        className={cn(
          'w-full justify-between',
          !slot.available && 'opacity-50 cursor-not-allowed',
          slot.locked && 'bg-yellow-50 border-yellow-300',
          isSelected && 'bg-gradient-to-r from-blue-600 to-green-600'
        )}
        disabled={!slot.available}
        onClick={() => handleSlotSelect(slot)}
      >
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {slot.startTime}
        </span>
        {slot.locked && <Lock className="h-3 w-3" />}
      </Button>
    );
  };

  const renderTimeSlots = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (availableSlots.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600">No available slots for this date</p>
          <Button
            variant="link"
            onClick={handleBackToDateSelection}
            className="mt-2"
          >
            Choose another date
          </Button>
        </div>
      );
    }

    const { morning, afternoon, evening } = groupSlotsByPeriod(availableSlots);

    return (
      <ScrollArea className="h-[400px]">
        <div className="space-y-6 pr-4">
          {morning.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Morning (Before 12 PM)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {morning.map(renderSlotButton)}
              </div>
            </div>
          )}

          {afternoon.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                Afternoon (12 PM - 5 PM)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {afternoon.map(renderSlotButton)}
              </div>
            </div>
          )}

          {evening.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                Evening (After 5 PM)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {evening.map(renderSlotButton)}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {step === 'date' ? 'Select Date' : 'Select Time'}
            </CardTitle>
            <CardDescription>
              {step === 'date'
                ? 'Choose a date for your appointment'
                : `Available slots for ${selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : ''}`}
            </CardDescription>
          </div>
          {step === 'time' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToDateSelection}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {step === 'date' ? (
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={disabledDates}
              className="rounded-md border"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected date display */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {selectedDate ? format(selectedDate, 'EEEE, MMMM dd, yyyy') : ''}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleChangeDateFromTime}
              >
                Change
              </Button>
            </div>

            {/* Slot selection */}
            {renderTimeSlots()}

            {/* Selected slot confirmation */}
            {selectedSlot && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Selected Time
                    </p>
                    <p className="text-lg font-bold text-green-700">
                      {selectedSlot.startTime} - {selectedSlot.endTime}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Reserved
                  </Badge>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  This slot is reserved for 10 minutes. Please complete your booking.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DrillingCalendar;
