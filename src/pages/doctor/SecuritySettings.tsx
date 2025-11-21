/**
 * SecuritySettings Page - Manage 2FA and security settings
 * Accessible by doctors, admins, and superadmins
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TOTPService, TrustedDevice } from '@/services/totpService';
import { TOTPSetup } from '@/components/auth/TOTPSetup';

interface SecurityStatus {
  totpEnabled: boolean;
  totpEnabledAt: string | null;
  backupCodesRemaining: number;
  trustedDevices: TrustedDevice[];
}

interface AuditLog {
  id: string;
  event_type: string;
  success: boolean;
  created_at: string;
  metadata: Record<string, any>;
}

export const SecuritySettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<SecurityStatus>({
    totpEnabled: false,
    totpEnabledAt: null,
    backupCodesRemaining: 0,
    trustedDevices: [],
  });
  const [showSetup, setShowSetup] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  useEffect(() => {
    loadSecurityStatus();
  }, []);

  const loadSecurityStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      // Get user security settings
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('totp_enabled, totp_enabled_at, trusted_devices')
        .eq('id', user.id)
        .single();

      if (userError) {
        throw userError;
      }

      // Get remaining backup codes count
      const backupCodesCount = await TOTPService.getRemainingBackupCodes(user.id);

      setStatus({
        totpEnabled: userData?.totp_enabled || false,
        totpEnabledAt: userData?.totp_enabled_at || null,
        backupCodesRemaining: backupCodesCount,
        trustedDevices: (userData?.trusted_devices as TrustedDevice[]) || [],
      });
    } catch (err) {
      console.error('Error loading security status:', err);
      setError('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableTOTP = () => {
    setShowSetup(true);
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    loadSecurityStatus();
  };

  const handleDisableTOTP = async () => {
    if (!confirm('Are you sure you want to disable Two-Factor Authentication? This will make your account less secure.')) {
      return;
    }

    const password = prompt('Please enter your password to confirm:');
    if (!password) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const success = await TOTPService.disableTOTP(user.id, password);
      if (success) {
        alert('Two-Factor Authentication has been disabled');
        loadSecurityStatus();
      } else {
        alert('Failed to disable 2FA. Please check your password.');
      }
    } catch (err) {
      console.error('Error disabling TOTP:', err);
      alert('An error occurred while disabling 2FA');
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!confirm('Regenerating backup codes will invalidate all existing codes. Continue?')) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const codes = await TOTPService.regenerateBackupCodes(user.id);
      setNewBackupCodes(codes);
      setShowBackupCodes(true);
      loadSecurityStatus();
    } catch (err) {
      console.error('Error regenerating backup codes:', err);
      alert('Failed to regenerate backup codes');
    }
  };

  const handleRemoveTrustedDevice = async (fingerprint: string) => {
    if (!confirm('Remove this trusted device? You will need to verify with 2FA next time you sign in from this device.')) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const success = await TOTPService.removeTrustedDevice(user.id, fingerprint);
      if (success) {
        alert('Device removed successfully');
        loadSecurityStatus();
      } else {
        alert('Failed to remove device');
      }
    } catch (err) {
      console.error('Error removing trusted device:', err);
      alert('An error occurred');
    }
  };

  const loadAuditLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('totp_audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setAuditLogs(data || []);
      setShowAuditLogs(true);
    } catch (err) {
      console.error('Error loading audit logs:', err);
      alert('Failed to load audit logs');
    }
  };

  const handleCopyBackupCodes = () => {
    const codesText = newBackupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    alert('Backup codes copied to clipboard!');
  };

  const handleDownloadBackupCodes = () => {
    const codesText = newBackupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aisurgeonpilot-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading security settings...</p>
        </div>
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="container mx-auto p-6">
        <TOTPSetup
          onComplete={handleSetupComplete}
          onCancel={() => setShowSetup(false)}
        />
      </div>
    );
  }

  if (showBackupCodes && newBackupCodes.length > 0) {
    return (
      <div className="container mx-auto max-w-2xl p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <span className="material-icons text-green-600 text-6xl mb-4">check_circle</span>
            <h2 className="text-2xl font-bold mb-2">New Backup Codes Generated</h2>
            <p className="text-gray-600">
              Save these codes in a safe place. You can use them to access your account if you lose your authenticator device.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <span className="material-icons text-yellow-600">warning</span>
              <p className="text-sm text-yellow-800">
                Each code can only be used once. The old backup codes have been invalidated.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-3">
              {newBackupCodes.map((code, index) => (
                <div key={index} className="bg-white px-3 py-2 rounded font-mono text-sm border">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-center mb-6">
            <button
              onClick={handleCopyBackupCodes}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="material-icons text-sm">content_copy</span>
              Copy Codes
            </button>
            <button
              onClick={handleDownloadBackupCodes}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="material-icons text-sm">download</span>
              Download
            </button>
          </div>

          <button
            onClick={() => {
              setShowBackupCodes(false);
              setNewBackupCodes([]);
            }}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Security Settings</h1>
        <p className="text-gray-600">Manage your account security and two-factor authentication</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <span className="material-icons mr-2">error</span>
          {error}
        </div>
      )}

      {/* Two-Factor Authentication Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status.totpEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
              <span className={`material-icons ${status.totpEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                {status.totpEnabled ? 'verified_user' : 'security'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-600">
                {status.totpEnabled
                  ? `Enabled on ${new Date(status.totpEnabledAt!).toLocaleDateString()}`
                  : 'Not enabled'}
              </p>
            </div>
          </div>
          <div>
            {status.totpEnabled ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Active
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                Inactive
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-600 mb-6">
          Two-factor authentication adds an extra layer of security to your account by requiring a verification code in addition to your password.
        </p>

        {status.totpEnabled ? (
          <div className="flex gap-3">
            <button
              onClick={handleDisableTOTP}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
            >
              <span className="material-icons text-sm">block</span>
              Disable 2FA
            </button>
          </div>
        ) : (
          <button
            onClick={handleEnableTOTP}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <span className="material-icons text-sm">add</span>
            Enable 2FA
          </button>
        )}
      </div>

      {/* Backup Codes */}
      {status.totpEnabled && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="material-icons text-blue-600">vpn_key</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Backup Codes</h2>
                <p className="text-sm text-gray-600">
                  {status.backupCodesRemaining} code{status.backupCodesRemaining !== 1 ? 's' : ''} remaining
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-600 mb-4">
            Backup codes can be used to access your account if you lose access to your authenticator app.
            Each code can only be used once.
          </p>

          {status.backupCodesRemaining < 3 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <span className="material-icons text-yellow-600 text-sm">warning</span>
              <p className="text-sm text-yellow-800">
                You're running low on backup codes. Consider regenerating them.
              </p>
            </div>
          )}

          <button
            onClick={handleRegenerateBackupCodes}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <span className="material-icons text-sm">refresh</span>
            Regenerate Backup Codes
          </button>
        </div>
      )}

      {/* Trusted Devices */}
      {status.totpEnabled && status.trustedDevices.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="material-icons text-purple-600">devices</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Trusted Devices</h2>
              <p className="text-sm text-gray-600">
                {status.trustedDevices.length} device{status.trustedDevices.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <p className="text-gray-600 mb-4">
            These devices won't require 2FA verification for 30 days.
          </p>

          <div className="space-y-3">
            {status.trustedDevices.map((device, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-icons text-gray-400">computer</span>
                  <div>
                    <p className="font-medium text-sm">{device.name}</p>
                    <p className="text-xs text-gray-500">
                      Added {new Date(device.added_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveTrustedDevice(device.fingerprint)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Remove device"
                >
                  <span className="material-icons text-sm">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Activity */}
      {status.totpEnabled && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="material-icons text-orange-600">history</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Security Activity</h2>
              <p className="text-sm text-gray-600">View your 2FA authentication history</p>
            </div>
          </div>

          <button
            onClick={loadAuditLogs}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center gap-2"
          >
            <span className="material-icons text-sm">visibility</span>
            View Activity Log
          </button>

          {showAuditLogs && auditLogs.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                    <span className={`material-icons text-sm ${log.success ? 'text-green-600' : 'text-red-600'}`}>
                      {log.success ? 'check_circle' : 'error'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">
                        {log.event_type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <span className="material-icons text-blue-600">info</span>
          <div>
            <h3 className="font-bold text-blue-900 mb-2">Security Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Use a strong, unique password for your account</li>
              <li>Enable two-factor authentication for maximum security</li>
              <li>Store your backup codes in a secure location</li>
              <li>Don't trust devices on shared or public computers</li>
              <li>Regularly review your security activity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
