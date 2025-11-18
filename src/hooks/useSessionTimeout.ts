import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sessionManager } from '../services/sessionManager';
import { useToast } from './use-toast';
import { supabase } from '../integrations/supabase/client';

interface UseSessionTimeoutOptions {
  /**
   * Whether to show warning toast before session expires
   * @default true
   */
  showWarning?: boolean;

  /**
   * Whether to redirect to login on expiration
   * @default true
   */
  redirectOnExpire?: boolean;

  /**
   * Custom callback when session expires
   */
  onExpire?: () => void;

  /**
   * Custom callback when warning is shown
   */
  onWarning?: (minutesRemaining: number) => void;

  /**
   * Whether to only monitor for authenticated users
   * @default true
   */
  requireAuth?: boolean;
}

interface UseSessionTimeoutReturn {
  /**
   * Whether session is still valid
   */
  isSessionValid: boolean;

  /**
   * Minutes until session expires
   */
  minutesRemaining: number;

  /**
   * Whether warning has been shown
   */
  warningShown: boolean;

  /**
   * Manually refresh the session
   */
  refreshSession: () => Promise<void>;

  /**
   * Get time until expiration in milliseconds
   */
  getTimeUntilExpiration: () => number;
}

/**
 * Hook to manage session timeout with auto-save and warnings
 */
export function useSessionTimeout(options: UseSessionTimeoutOptions = {}): UseSessionTimeoutReturn {
  const {
    showWarning = true,
    redirectOnExpire = true,
    onExpire,
    onWarning,
    requireAuth = true
  } = options;

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [isSessionValid, setIsSessionValid] = useState(true);
  const [minutesRemaining, setMinutesRemaining] = useState(240); // 4 hours in minutes
  const [warningShown, setWarningShown] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Handle session expiration
   */
  const handleExpiration = useCallback(() => {
    setIsSessionValid(false);

    if (onExpire) {
      onExpire();
    }

    if (showWarning) {
      toast({
        title: 'Session Expired',
        description: 'Your session has expired. Please log in again. Your work has been saved.',
        variant: 'destructive',
      });
    }

    if (redirectOnExpire) {
      // Save current path to redirect back after login
      const returnUrl = location.pathname + location.search;
      localStorage.setItem('returnUrl', returnUrl);

      // Redirect to login
      navigate('/login');
    }
  }, [onExpire, showWarning, redirectOnExpire, navigate, location, toast]);

  /**
   * Handle session warning
   */
  const handleWarning = useCallback((minutes: number) => {
    setMinutesRemaining(minutes);
    setWarningShown(true);

    if (onWarning) {
      onWarning(minutes);
    }

    if (showWarning && !warningShown) {
      toast({
        title: 'Session Expiring Soon',
        description: `Your session will expire in ${minutes} minute${minutes !== 1 ? 's' : ''}. Please save your work or continue using the app to stay logged in.`,
        variant: 'default',
        duration: 10000,
      });
    }
  }, [onWarning, showWarning, warningShown, toast]);

  /**
   * Manually refresh session
   */
  const refreshSession = useCallback(async () => {
    try {
      await sessionManager.refreshSession();
      setIsSessionValid(true);
      setWarningShown(false);
      setMinutesRemaining(240);

      if (showWarning) {
        toast({
          title: 'Session Refreshed',
          description: 'Your session has been extended.',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Could not refresh your session. Please log in again.',
        variant: 'destructive',
      });
    }
  }, [showWarning, toast]);

  /**
   * Get time until expiration
   */
  const getTimeUntilExpiration = useCallback(() => {
    return sessionManager.getTimeUntilExpiration();
  }, []);

  /**
   * Check if user is authenticated
   */
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Setup session monitoring (only for authenticated users if requireAuth is true)
   */
  useEffect(() => {
    // Skip monitoring if requireAuth is true and user is not authenticated
    if (requireAuth && !isAuthenticated) {
      return;
    }

    // Check initial session validity
    sessionManager.isSessionValid().then(valid => {
      setIsSessionValid(valid);
      if (!valid && isAuthenticated) {
        handleExpiration();
      }
    });

    // Subscribe to warnings
    const unsubscribeWarning = sessionManager.onWarning(handleWarning);

    // Subscribe to expiration
    const unsubscribeExpiration = sessionManager.onExpiration(handleExpiration);

    // Update minutes remaining every minute
    const interval = setInterval(() => {
      const timeRemaining = sessionManager.getTimeUntilExpiration();
      const minutes = Math.ceil(timeRemaining / (60 * 1000));
      setMinutesRemaining(minutes);
    }, 60 * 1000);

    return () => {
      unsubscribeWarning();
      unsubscribeExpiration();
      clearInterval(interval);
    };
  }, [handleWarning, handleExpiration, requireAuth, isAuthenticated]);

  /**
   * Check session on page visibility change
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sessionManager.isSessionValid().then(valid => {
          if (!valid && isSessionValid) {
            handleExpiration();
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSessionValid, handleExpiration]);

  /**
   * Check session on navigation (back/forward button)
   */
  useEffect(() => {
    const checkSession = () => {
      sessionManager.isSessionValid().then(valid => {
        if (!valid && isSessionValid) {
          handleExpiration();
        }
      });
    };

    window.addEventListener('popstate', checkSession);

    return () => {
      window.removeEventListener('popstate', checkSession);
    };
  }, [isSessionValid, handleExpiration]);

  return {
    isSessionValid,
    minutesRemaining,
    warningShown,
    refreshSession,
    getTimeUntilExpiration,
  };
}
