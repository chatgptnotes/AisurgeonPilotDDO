/**
 * TOTP Service - Handles all Time-based One-Time Password operations
 * Used for 2FA authentication for doctors, admins, and superadmins
 */

import { authenticator } from 'otplib';
import { supabase } from '@/integrations/supabase/client';

// Configure TOTP settings
authenticator.options = {
  step: 30, // 30 second time step
  window: 1, // Allow 1 time step before/after for clock skew
};

// Helper function to hash strings using Web Crypto API (browser-native)
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface TOTPSetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TrustedDevice {
  fingerprint: string;
  name: string;
  added_at: string;
}

export class TOTPService {
  private static readonly APP_NAME = 'AI Surgeon Pilot';
  private static readonly BACKUP_CODE_COUNT = 10;
  private static readonly BACKUP_CODE_LENGTH = 8;

  /**
   * Generate a new TOTP secret for a user
   * @returns Base32 encoded secret
   */
  static generateSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * Generate a QR code URL for TOTP setup
   * @param email User's email
   * @param secret TOTP secret
   * @returns otpauth:// URL for QR code generation
   */
  static generateQRCodeUrl(email: string, secret: string): string {
    return authenticator.keyuri(email, this.APP_NAME, secret);
  }

  /**
   * Generate backup codes for emergency access
   * @param count Number of backup codes to generate
   * @returns Array of backup codes
   */
  static generateBackupCodes(count: number = this.BACKUP_CODE_COUNT): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = this.generateRandomCode(this.BACKUP_CODE_LENGTH);
      codes.push(code);
    }
    return codes;
  }

  /**
   * Hash a backup code for secure storage
   * @param code Plain text backup code
   * @returns Hashed code
   */
  static async hashBackupCode(code: string): Promise<string> {
    return hashString(code.toLowerCase().trim());
  }

  /**
   * Verify a TOTP token against a secret
   * @param secret TOTP secret
   * @param token 6-digit token from user
   * @returns True if token is valid
   */
  static verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }

  /**
   * Generate a TOTP token (for testing purposes)
   * @param secret TOTP secret
   * @returns 6-digit token
   */
  static generateToken(secret: string): string {
    return authenticator.generate(secret);
  }

  /**
   * Setup TOTP for a user (complete flow)
   * @param userId User ID
   * @param email User email
   * @returns Setup data including secret, QR URL, and backup codes
   */
  static async setupTOTP(userId: string, email: string): Promise<TOTPSetupData> {
    // Generate secret and backup codes
    const secret = this.generateSecret();
    const qrCodeUrl = this.generateQRCodeUrl(email, secret);
    const backupCodes = this.generateBackupCodes();

    // Hash backup codes for storage
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => this.hashBackupCode(code))
    );

    // Store secret and backup codes in database (but don't enable yet)
    const { error } = await supabase
      .from('users')
      .update({
        totp_secret: secret,
        backup_codes: hashedBackupCodes,
        totp_enabled: false, // User must verify before enabling
      })
      .eq('id', userId);

    if (error) {
      console.error('Error storing TOTP secret:', error);
      throw new Error('Failed to setup TOTP');
    }

    // Log setup event
    await this.logTOTPEvent(userId, 'setup', true);

    return {
      secret,
      qrCodeUrl,
      backupCodes, // Return plain text codes for user to save
    };
  }

  /**
   * Enable TOTP after user verification
   * @param userId User ID
   * @param token Token to verify
   * @returns True if enabled successfully
   */
  static async enableTOTP(userId: string, token: string): Promise<boolean> {
    // Get user's secret
    const { data: user, error } = await supabase
      .from('users')
      .select('totp_secret')
      .eq('id', userId)
      .single();

    if (error || !user?.totp_secret) {
      console.error('User or secret not found:', error);
      return false;
    }

    // Verify the token
    const isValid = this.verifyToken(user.totp_secret, token);

    if (!isValid) {
      await this.logTOTPEvent(userId, 'enabled', false);
      return false;
    }

    // Enable TOTP
    const { error: updateError } = await supabase
      .from('users')
      .update({
        totp_enabled: true,
        totp_enabled_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error enabling TOTP:', updateError);
      return false;
    }

    // Log successful enablement
    await this.logTOTPEvent(userId, 'enabled', true);

    return true;
  }

  /**
   * Disable TOTP for a user
   * @param userId User ID
   * @param password User's password for verification
   * @returns True if disabled successfully
   */
  static async disableTOTP(userId: string, password: string): Promise<boolean> {
    // Verify password before disabling (handled by Supabase Auth)
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error('Password verification failed:', error);
      return false;
    }

    // Disable TOTP and clear secrets
    const { error: updateError } = await supabase
      .from('users')
      .update({
        totp_enabled: false,
        totp_secret: null,
        backup_codes: null,
        trusted_devices: [],
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error disabling TOTP:', updateError);
      return false;
    }

    // Log disablement
    await this.logTOTPEvent(userId, 'disabled', true);

    return true;
  }

  /**
   * Verify TOTP token during login
   * @param userId User ID
   * @param token 6-digit token or backup code
   * @returns True if verification succeeds
   */
  static async verifyTOTPLogin(userId: string, token: string): Promise<boolean> {
    // Get user's TOTP data
    const { data: user, error } = await supabase
      .from('users')
      .select('totp_secret, totp_enabled, backup_codes')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('User not found:', error);
      return false;
    }

    if (!user.totp_enabled) {
      console.warn('TOTP not enabled for user');
      return false;
    }

    // Try verifying as TOTP token first
    if (user.totp_secret && this.verifyToken(user.totp_secret, token)) {
      await this.logTOTPEvent(userId, 'verified', true);
      return true;
    }

    // Try verifying as backup code
    if (user.backup_codes && user.backup_codes.length > 0) {
      const hashedToken = await this.hashBackupCode(token);
      const codeIndex = user.backup_codes.indexOf(hashedToken);

      if (codeIndex !== -1) {
        // Remove used backup code
        const updatedCodes = [...user.backup_codes];
        updatedCodes.splice(codeIndex, 1);

        await supabase
          .from('users')
          .update({ backup_codes: updatedCodes })
          .eq('id', userId);

        await this.logTOTPEvent(userId, 'backup_used', true);
        return true;
      }
    }

    // Log failed attempt
    await this.logTOTPEvent(userId, 'failed', false);
    return false;
  }

  /**
   * Check if user requires 2FA
   * @param userId User ID
   * @returns True if 2FA is required
   */
  static async requiresTOTP(userId: string): Promise<boolean> {
    const { data: user, error } = await supabase
      .from('users')
      .select('role, totp_enabled')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return false;
    }

    // Doctors, admins, and superadmins should have 2FA
    // OR if user has explicitly enabled it
    return (
      user.role === 'doctor' ||
      user.role === 'admin' ||
      user.role === 'superadmin' ||
      user.totp_enabled === true
    );
  }

  /**
   * Check if device is trusted (skips 2FA)
   * @param userId User ID
   * @param deviceFingerprint Unique device identifier
   * @returns True if device is trusted
   */
  static async isTrustedDevice(
    userId: string,
    deviceFingerprint: string
  ): Promise<boolean> {
    const { data: user, error } = await supabase
      .from('users')
      .select('trusted_devices')
      .eq('id', userId)
      .single();

    if (error || !user || !user.trusted_devices) {
      return false;
    }

    const devices = user.trusted_devices as TrustedDevice[];
    const now = new Date();

    for (const device of devices) {
      if (device.fingerprint === deviceFingerprint) {
        // Check if device hasn't expired (30 days)
        const addedAt = new Date(device.added_at);
        const daysSinceAdded = (now.getTime() - addedAt.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceAdded <= 30) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Add a device to trusted devices list
   * @param userId User ID
   * @param deviceFingerprint Unique device identifier
   * @param deviceName Friendly device name
   * @returns True if added successfully
   */
  static async addTrustedDevice(
    userId: string,
    deviceFingerprint: string,
    deviceName: string = 'Unknown Device'
  ): Promise<boolean> {
    const { data: user, error } = await supabase
      .from('users')
      .select('trusted_devices')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return false;
    }

    const devices = (user.trusted_devices as TrustedDevice[]) || [];
    const newDevice: TrustedDevice = {
      fingerprint: deviceFingerprint,
      name: deviceName,
      added_at: new Date().toISOString(),
    };

    // Add new device
    devices.push(newDevice);

    const { error: updateError } = await supabase
      .from('users')
      .update({ trusted_devices: devices })
      .eq('id', userId);

    if (updateError) {
      console.error('Error adding trusted device:', updateError);
      return false;
    }

    await this.logTOTPEvent(userId, 'device_trusted', true);
    return true;
  }

  /**
   * Remove a trusted device
   * @param userId User ID
   * @param deviceFingerprint Device fingerprint to remove
   * @returns True if removed successfully
   */
  static async removeTrustedDevice(userId: string, deviceFingerprint: string): Promise<boolean> {
    const { data: user, error } = await supabase
      .from('users')
      .select('trusted_devices')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return false;
    }

    const devices = (user.trusted_devices as TrustedDevice[]) || [];
    const filteredDevices = devices.filter(d => d.fingerprint !== deviceFingerprint);

    const { error: updateError } = await supabase
      .from('users')
      .update({ trusted_devices: filteredDevices })
      .eq('id', userId);

    return !updateError;
  }

  /**
   * Get remaining backup codes count
   * @param userId User ID
   * @returns Number of remaining backup codes
   */
  static async getRemainingBackupCodes(userId: string): Promise<number> {
    const { data: user, error } = await supabase
      .from('users')
      .select('backup_codes')
      .eq('id', userId)
      .single();

    if (error || !user || !user.backup_codes) {
      return 0;
    }

    return user.backup_codes.length;
  }

  /**
   * Regenerate backup codes
   * @param userId User ID
   * @returns New backup codes
   */
  static async regenerateBackupCodes(userId: string): Promise<string[]> {
    const newCodes = this.generateBackupCodes();
    const hashedCodes = await Promise.all(
      newCodes.map(code => this.hashBackupCode(code))
    );

    const { error } = await supabase
      .from('users')
      .update({ backup_codes: hashedCodes })
      .eq('id', userId);

    if (error) {
      throw new Error('Failed to regenerate backup codes');
    }

    return newCodes;
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Generate a random alphanumeric code
   * @param length Code length
   * @returns Random code
   */
  private static generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Format as XXXX-XXXX for readability
    return code.substring(0, 4) + '-' + code.substring(4);
  }

  /**
   * Log TOTP event to audit log
   * @param userId User ID
   * @param eventType Event type
   * @param success Whether event succeeded
   */
  private static async logTOTPEvent(
    userId: string,
    eventType: string,
    success: boolean
  ): Promise<void> {
    try {
      await supabase.from('totp_audit_logs').insert({
        user_id: userId,
        event_type: eventType,
        success,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error logging TOTP event:', error);
    }
  }
}

export default TOTPService;
