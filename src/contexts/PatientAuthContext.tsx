import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
}

interface PatientAuthContextType {
  patient: Patient | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithOTP: (identifier: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshPatient: () => Promise<void>;
}

const PatientAuthContext = createContext<PatientAuthContextType | undefined>(undefined);

export const usePatientAuth = () => {
  const context = useContext(PatientAuthContext);
  if (context === undefined) {
    throw new Error('usePatientAuth must be used within a PatientAuthProvider');
  }
  return context;
};

interface PatientAuthProviderProps {
  children: ReactNode;
}

export const PatientAuthProvider = ({ children }: PatientAuthProviderProps) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadPatientProfile(session.user.id, session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        setPatient(null);
        setIsAuthenticated(false);
        localStorage.removeItem('patient_id');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      // Check if we have a Supabase session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        await loadPatientProfile(session.user.id, session.user.email || '');
      } else {
        // Check localStorage for patient_id (OTP login)
        const patientId = localStorage.getItem('patient_id');
        if (patientId) {
          await loadPatientById(patientId);
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  };

  const loadPatientProfile = async (userId: string, email: string) => {
    try {
      // Try to find patient by email
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('email', email)
        .single();

      if (data && !error) {
        setPatient(data);
        setIsAuthenticated(true);
        localStorage.setItem('patient_id', data.id);
      } else {
        console.error('Patient profile not found:', error);
      }
    } catch (error) {
      console.error('Error loading patient profile:', error);
    }
  };

  const loadPatientById = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (data && !error) {
        setPatient(data);
        setIsAuthenticated(true);
      } else {
        console.error('Patient not found:', error);
        localStorage.removeItem('patient_id');
      }
    } catch (error) {
      console.error('Error loading patient:', error);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      });

      if (error || !data.user) {
        return { success: false, error: error?.message || 'Login failed' };
      }

      // Load patient profile
      await loadPatientProfile(data.user.id, data.user.email || '');

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const loginWithOTP = async (identifier: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // This is handled by otpService.verifyOTP
      // After OTP verification, patient_id is stored in localStorage
      // We just need to load the patient
      const patientId = localStorage.getItem('patient_id');
      if (!patientId) {
        return { success: false, error: 'Patient ID not found' };
      }

      await loadPatientById(patientId);
      return { success: true };
    } catch (error) {
      console.error('OTP login error:', error);
      return { success: false, error: 'An error occurred during OTP login' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setPatient(null);
      setIsAuthenticated(false);
      localStorage.removeItem('patient_id');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshPatient = async () => {
    if (patient?.id) {
      await loadPatientById(patient.id);
    }
  };

  const value: PatientAuthContextType = {
    patient,
    isAuthenticated,
    login,
    loginWithOTP,
    logout,
    refreshPatient
  };

  return (
    <PatientAuthContext.Provider value={value}>
      {children}
    </PatientAuthContext.Provider>
  );
};
