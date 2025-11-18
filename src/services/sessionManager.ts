import { supabase } from '../integrations/supabase/client';

interface SavedFormData {
  formId: string;
  data: Record<string, unknown>;
  timestamp: number;
  path: string;
}

class SessionManager {
  private static instance: SessionManager;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private activityTimeout: NodeJS.Timeout | null = null;
  private lastActivityTime: number = Date.now();
  private readonly INACTIVITY_WARNING_MS = 3.5 * 60 * 60 * 1000; // 3.5 hours
  private readonly SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 hours
  private readonly CHECK_INTERVAL_MS = 60 * 1000; // Check every minute
  private warningCallbacks: Array<(minutesRemaining: number) => void> = [];
  private expirationCallbacks: Array<() => void> = [];

  private constructor() {
    this.initializeSessionMonitoring();
    this.setupActivityListeners();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initialize session monitoring
   */
  private initializeSessionMonitoring(): void {
    // Check session status every minute
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionStatus();
    }, this.CHECK_INTERVAL_MS);

    // Initial check
    this.checkSessionStatus();
  }

  /**
   * Setup activity listeners to track user interactions
   */
  private setupActivityListeners(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, () => {
        this.updateActivity();
      }, { passive: true });
    });
  }

  /**
   * Update last activity timestamp
   */
  private updateActivity(): void {
    this.lastActivityTime = Date.now();
  }

  /**
   * Check current session status
   */
  private async checkSessionStatus(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const timeSinceActivity = Date.now() - this.lastActivityTime;

    if (!session) {
      // Session expired - trigger callbacks
      this.handleSessionExpiration();
      return;
    }

    // Check for inactivity warning (3.5 hours)
    if (timeSinceActivity >= this.INACTIVITY_WARNING_MS && timeSinceActivity < this.SESSION_TIMEOUT_MS) {
      const minutesRemaining = Math.ceil((this.SESSION_TIMEOUT_MS - timeSinceActivity) / (60 * 1000));
      this.triggerWarning(minutesRemaining);
    }

    // Check for session timeout (4 hours)
    if (timeSinceActivity >= this.SESSION_TIMEOUT_MS) {
      await this.handleInactivityTimeout();
    }

    // Check if Supabase session is about to expire
    if (session.expires_at) {
      const expiresIn = session.expires_at * 1000 - Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (expiresIn <= fiveMinutes && expiresIn > 0) {
        // Auto-refresh session if user is still active
        if (timeSinceActivity < this.INACTIVITY_WARNING_MS) {
          await supabase.auth.refreshSession();
        }
      }
    }
  }

  /**
   * Handle session expiration
   */
  private handleSessionExpiration(): void {
    this.expirationCallbacks.forEach(callback => callback());
  }

  /**
   * Handle inactivity timeout
   */
  private async handleInactivityTimeout(): Promise<void> {
    // Save any pending form data
    this.saveAllPendingData();

    // Sign out user
    await supabase.auth.signOut();

    // Trigger expiration callbacks
    this.handleSessionExpiration();
  }

  /**
   * Trigger warning callbacks
   */
  private triggerWarning(minutesRemaining: number): void {
    this.warningCallbacks.forEach(callback => callback(minutesRemaining));
  }

  /**
   * Save form data to localStorage
   */
  saveFormData(formId: string, data: Record<string, unknown>): void {
    try {
      const savedData: SavedFormData = {
        formId,
        data,
        timestamp: Date.now(),
        path: window.location.pathname
      };

      const key = `form_autosave_${formId}`;
      localStorage.setItem(key, JSON.stringify(savedData));
    } catch (error) {
      console.error('Failed to save form data:', error);
    }
  }

  /**
   * Retrieve saved form data from localStorage
   */
  getSavedFormData(formId: string): SavedFormData | null {
    try {
      const key = `form_autosave_${formId}`;
      const saved = localStorage.getItem(key);

      if (!saved) return null;

      const data = JSON.parse(saved) as SavedFormData;

      // Check if data is older than 24 hours
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (Date.now() - data.timestamp > twentyFourHours) {
        this.clearSavedFormData(formId);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to retrieve form data:', error);
      return null;
    }
  }

  /**
   * Clear saved form data
   */
  clearSavedFormData(formId: string): void {
    try {
      const key = `form_autosave_${formId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear form data:', error);
    }
  }

  /**
   * Save all pending form data (called before logout)
   */
  private saveAllPendingData(): void {
    // Trigger a custom event that forms can listen to
    window.dispatchEvent(new CustomEvent('session-expiring'));
  }

  /**
   * Register callback for session expiration warning
   */
  onWarning(callback: (minutesRemaining: number) => void): () => void {
    this.warningCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.warningCallbacks = this.warningCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Register callback for session expiration
   */
  onExpiration(callback: () => void): () => void {
    this.expirationCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.expirationCallbacks = this.expirationCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Check if session is still valid
   */
  async isSessionValid(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return session !== null;
  }

  /**
   * Get time until session expires (in milliseconds)
   */
  getTimeUntilExpiration(): number {
    const timeSinceActivity = Date.now() - this.lastActivityTime;
    return Math.max(0, this.SESSION_TIMEOUT_MS - timeSinceActivity);
  }

  /**
   * Manually refresh session
   */
  async refreshSession(): Promise<void> {
    await supabase.auth.refreshSession();
    this.updateActivity(); // Reset activity timer
  }

  /**
   * Cleanup on unmount
   */
  cleanup(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
      this.activityTimeout = null;
    }
    this.warningCallbacks = [];
    this.expirationCallbacks = [];
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
