
import { useQuery } from '@tanstack/react-query';

/**
 * useCounts hook - Hospital Management System queries
 *
 * NOTE: These queries are for the old hospital management system (ESIC, Hope, Ayushman).
 * They are DISABLED for DDO (Digital Doctor Office) to prevent 404 errors.
 * All queries are disabled and return 0 to maintain compatibility with existing components.
 *
 * If you need to re-enable these for hospital system, set ENABLED_FOR_HOSPITAL = true
 */
export const useCounts = () => {
  // Set to false to disable all hospital system queries (prevents 404 errors)
  const ENABLED_FOR_HOSPITAL = false;

  // All queries disabled - return 0 for compatibility
  const { data: diagnosesCount = 0 } = useQuery({
    queryKey: ['diagnoses-count'],
    queryFn: async () => 0,
    enabled: ENABLED_FOR_HOSPITAL,
  });

  const { data: patientsCount = 0 } = useQuery({
    queryKey: ['patients-count'],
    queryFn: async () => 0,
    enabled: ENABLED_FOR_HOSPITAL,
  });

  const { data: usersCount = 0 } = useQuery({
    queryKey: ['users-count'],
    queryFn: async () => 0,
    enabled: ENABLED_FOR_HOSPITAL,
  });

  const { data: complicationsCount = 0 } = useQuery({
    queryKey: ['complications-count'],
    queryFn: async () => 0,
    enabled: ENABLED_FOR_HOSPITAL,
  });

  const { data: cghsSurgeryCount = 0 } = useQuery({
    queryKey: ['cghs-surgery-count'],
    queryFn: async () => 0,
    enabled: ENABLED_FOR_HOSPITAL,
  });

  const { data: labCount = 0 } = useQuery({
    queryKey: ['lab-count'],
    queryFn: async () => 0,
    enabled: ENABLED_FOR_HOSPITAL,
  });

  const { data: radiologyCount = 0 } = useQuery({
    queryKey: ['radiology-count'],
    queryFn: async () => 0,
    enabled: ENABLED_FOR_HOSPITAL,
  });

  const { data: medicationsCount = 0 } = useQuery({
    queryKey: ['medications-count'],
    queryFn: async () => 0,
    enabled: ENABLED_FOR_HOSPITAL,
  });

  const { data: esicSurgeonsCount = 0 } = useQuery({
    queryKey: ['esic-surgeons-count'],
    queryFn: async () => 0,
    enabled: ENABLED_FOR_HOSPITAL,
  });

  const { data: refereesCount = 0 } = useQuery({
    queryKey: ['referees-count'],
    queryFn: async () => 0,
    enabled: ENABLED_FOR_HOSPITAL,
  });

  const { data: hopeSurgeonsCount = 0 } = useQuery({
    queryKey: ['hope-surgeons-count'],
    queryFn: async () => 0,
    enabled: ENABLED_FOR_HOSPITAL,
  });

  const { data: hopeConsultantsCount = 0 } = useQuery({
    queryKey: ['hope-consultants-count'],
    queryFn: async () => 0,
    enabled: ENABLED_FOR_HOSPITAL,
  });

  const { data: hopeAnaesthetistsCount = 0 } = useQuery({
    queryKey: ['hope-anaesthetists-count'],
    queryFn: async () => 0,
    enabled: ENABLED_FOR_HOSPITAL,
  });

  const { data: ayushmanSurgeonsCount = 0 } = useQuery({
    queryKey: ['ayushman-surgeons-count'],
    queryFn: async () => 0,
    enabled: ENABLED_FOR_HOSPITAL,
  });

  const { data: ayushmanConsultantsCount = 0 } = useQuery({
    queryKey: ['ayushman-consultants-count'],
    queryFn: async () => 0,
    enabled: ENABLED_FOR_HOSPITAL,
  });

  const { data: ayushmanAnaesthetistsCount = 0 } = useQuery({
    queryKey: ['ayushman-anaesthetists-count'],
    queryFn: async () => 0,
    enabled: ENABLED_FOR_HOSPITAL,
  });

  return {
    diagnosesCount,
    patientsCount,
    usersCount,
    complicationsCount,
    cghsSurgeryCount,
    labCount,
    radiologyCount,
    medicationsCount,
    esicSurgeonsCount,
    refereesCount,
    hopeSurgeonsCount,
    hopeConsultantsCount,
    hopeAnaesthetistsCount,
    ayushmanSurgeonsCount,
    ayushmanConsultantsCount,
    ayushmanAnaesthetistsCount,
  };
};
