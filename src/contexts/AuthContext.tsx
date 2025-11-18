import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HospitalType, getHospitalConfig } from '@/types/hospital';
import { supabase } from '@/integrations/supabase/client';
import { hashPassword, comparePassword, validateEmail, sanitizeInput, signupRateLimiter } from '@/utils/auth';

interface User {
  id?: string;
  email: string;
  username: string;
  role: 'admin' | 'doctor' | 'nurse' | 'user';
  hospitalType: HospitalType;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  signup: (userData: { email: string; password: string; role: 'admin' | 'doctor' | 'nurse' | 'user'; hospitalType: HospitalType }) => Promise<{ success: boolean; error?: string }>;
  loginWithCredentials: (credentials: { username: string; password: string; hospitalType: HospitalType }) => boolean; // Keep for backward compatibility
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hospitalType: HospitalType | null;
  hospitalConfig: ReturnType<typeof getHospitalConfig>;
  showLanding: boolean;
  setShowLanding: (show: boolean) => void;
  showHospitalSelection: boolean;
  setShowHospitalSelection: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [showHospitalSelection, setShowHospitalSelection] = useState<boolean>(false);

  // Hospital-specific credentials - Simple login credentials
  const getValidCredentials = (hospitalType: HospitalType) => [
    { username: 'admin', password: 'admin', role: 'admin' as const },
    { username: 'doctor', password: 'doctor', role: 'doctor' as const },
    { username: 'user', password: 'user', role: 'user' as const },
    { username: hospitalType, password: hospitalType, role: 'user' as const }, // hope/hope, ayushman/ayushman
  ];

  // Check for saved session on load
  useEffect(() => {
    const checkSession = async () => {
      // Check Supabase Auth session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch user profile from public.users (if table exists)
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (userData && !error) {
          const user: User = {
            id: userData.id,
            email: userData.email,
            username: userData.email.split('@')[0],
            role: userData.role,
            hospitalType: 'hope'
          };
          setUser(user);
          localStorage.setItem('hmis_user', JSON.stringify(user));
        } else {
          // Users table doesn't exist or user not found - check if it's a doctor/patient
          console.log('Users table query failed (expected for doctors/patients):', error);
        }
      } else {
        // Fallback to old localStorage method for backward compatibility
        const savedUser = localStorage.getItem('hmis_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          // Add hospitalType if missing (for backward compatibility)
          if (!parsedUser.hospitalType) {
            if (parsedUser.username === 'ayushman') {
              parsedUser.hospitalType = 'ayushman';
              parsedUser.hospitalName = 'ayushman';
            } else {
              parsedUser.hospitalType = 'hope';
              parsedUser.hospitalName = 'hope';
            }
          }
          if (!parsedUser.role) {
            parsedUser.role = parsedUser.username === 'admin' ? 'admin' : 'user';
          }
          setUser(parsedUser);
        }
      }

      // Show landing page only for first-time visitors
      const hasVisitedBefore = localStorage.getItem('hmis_visited');
      if (hasVisitedBefore) {
        setShowLanding(false);
      }
    };

    checkSession();
  }, []);

  // Database authentication using Supabase Auth
  const login = async (credentials: { email: string; password: string }): Promise<boolean> => {
    try {
      // First, authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email.toLowerCase(),
        password: credentials.password,
      });

      if (authError || !authData.user) {
        console.error('Auth login error:', authError);
        return false;
      }

      // Then fetch user profile from public.users table (if exists)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (userError || !userData) {
        console.error('User profile error:', userError);
        // Sign out if we can't get the user profile
        await supabase.auth.signOut();
        return false;
      }

      const user: User = {
        id: userData.id,
        email: userData.email,
        username: userData.email.split('@')[0], // Use email prefix as username
        role: userData.role,
        hospitalType: 'hope' // Default for now
      };

      setUser(user);
      localStorage.setItem('hmis_user', JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  // Signup functionality
  const signup = async (userData: { email: string; password: string; role: 'admin' | 'doctor' | 'nurse' | 'user'; hospitalType: HospitalType }): Promise<{ success: boolean; error?: string }> => {
    try {
      // Rate limiting check
      const clientIP = 'default'; // In production, get actual client IP
      if (!signupRateLimiter.isAllowed(clientIP)) {
        const remainingTime = Math.ceil(signupRateLimiter.getRemainingTime(clientIP) / 1000 / 60);
        return { success: false, error: `Too many signup attempts. Please try again in ${remainingTime} minutes.` };
      }

      // Validate email
      const emailValidation = validateEmail(userData.email);
      if (!emailValidation.isValid) {
        return { success: false, error: emailValidation.error };
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(userData.email.toLowerCase());
      const sanitizedRole = sanitizeInput(userData.role);

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('email', sanitizedEmail)
        .single();

      if (existingUser) {
        return { success: false, error: 'Email already exists. Please use a different email.' };
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Insert new user
      const { error } = await supabase
        .from('User')
        .insert([
          {
            email: sanitizedEmail,
            password: hashedPassword,
            role: sanitizedRole,
            hospital_type: userData.hospitalType
          }
        ]);

      if (error) {
        console.error('Signup error:', error);
        if (error.code === '23505') { // Unique constraint violation
          return { success: false, error: 'Email already exists. Please use a different email.' };
        }
        return { success: false, error: error.message || 'Failed to create account' };
      }

      return { success: true };
    } catch (error) {
      console.error('Signup failed:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  // Keep old login method for backward compatibility
  const loginWithCredentials = (credentials: { username: string; password: string; hospitalType: HospitalType }): boolean => {
    const validCredentials = getValidCredentials(credentials.hospitalType);
    const isValid = validCredentials.some(
      cred => cred.username === credentials.username && cred.password === credentials.password
    );

    if (isValid) {
      const found = validCredentials.find(
        cred => cred.username === credentials.username && cred.password === credentials.password
      )!;
      const user: User = { 
        email: `${found.username}@mock.com`, // Add mock email for compatibility
        username: found.username, 
        role: found.role,
        hospitalType: credentials.hospitalType
      };
      setUser(user);
      localStorage.setItem('hmis_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = async () => {
    // Sign out from Supabase Auth
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('hmis_user');
    setShowHospitalSelection(false);
  };

  // 🚨 DEBUG: Check hospital config creation
  console.log('🔍 AUTH DEBUG: user =', user);
  console.log('🔍 AUTH DEBUG: user?.hospitalType =', user?.hospitalType);
  const hospitalConfig = getHospitalConfig(user?.hospitalType);
  console.log('🔍 AUTH DEBUG: hospitalConfig =', hospitalConfig);

  const value: AuthContextType = {
    user,
    login,
    signup,
    loginWithCredentials,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    hospitalType: user?.hospitalType || null,
    hospitalConfig,
    showLanding,
    setShowLanding,
    showHospitalSelection,
    setShowHospitalSelection
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};