/**
 * TOTPVerify Component - Verification screen during login
 * Shown after successful password authentication for 2FA-enabled users
 */

import React, { useState, useEffect, useRef } from 'react';
import { TOTPService } from '@/services/totpService';

interface TOTPVerifyProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
  deviceFingerprint?: string; // For trusted device functionality
}

export const TOTPVerify: React.FC<TOTPVerifyProps> = ({
  userId,
  onSuccess,
  onCancel,
  deviceFingerprint,
}) => {
  const [token, setToken] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string>('');
  const [attempts, setAttempts] = useState(0);
  const [showBackupInput, setShowBackupInput] = useState(false);
  const [backupCode, setBackupCode] = useState<string>('');
  const [trustDevice, setTrustDevice] = useState(false);
  const maxAttempts = 5;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, [showBackupInput]);

  const handleVerify = async () => {
    const codeToVerify = showBackupInput ? backupCode : token;

    if (!codeToVerify) {
      setError('Please enter a code');
      return;
    }

    if (!showBackupInput && codeToVerify.length !== 6) {
      setError('Code must be 6 digits');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const isValid = await TOTPService.verifyTOTPLogin(userId, codeToVerify);

      if (isValid) {
        // If user wants to trust this device, add it
        if (trustDevice && deviceFingerprint) {
          const deviceName = `${navigator.userAgent.substring(0, 50)}... (${new Date().toLocaleDateString()})`;
          await TOTPService.addTrustedDevice(userId, deviceFingerprint, deviceName);
        }

        onSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= maxAttempts) {
          setError('Too many failed attempts. Please try again later or contact support.');
        } else {
          setError(
            `Invalid code. ${maxAttempts - newAttempts} attempt${maxAttempts - newAttempts > 1 ? 's' : ''} remaining.`
          );
        }

        // Clear inputs
        setToken('');
        setBackupCode('');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handleTokenChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setToken(digits);
    setError('');

    // Auto-submit when 6 digits entered
    if (digits.length === 6) {
      setTimeout(() => {
        handleVerify();
      }, 100);
    }
  };

  const handleBackupCodeChange = (value: string) => {
    // Format backup code as XXXX-XXXX
    let formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (formatted.length > 4) {
      formatted = formatted.slice(0, 4) + '-' + formatted.slice(4, 8);
    }
    setBackupCode(formatted);
    setError('');
  };

  const toggleBackupInput = () => {
    setShowBackupInput(!showBackupInput);
    setToken('');
    setBackupCode('');
    setError('');
  };

  if (attempts >= maxAttempts) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <span className="material-icons text-red-600 text-6xl mb-4">block</span>
        <h2 className="text-2xl font-bold text-red-600 mb-4">Too Many Failed Attempts</h2>
        <p className="text-gray-600 mb-6">
          For security reasons, you've been temporarily locked out. Please try again later or contact support.
        </p>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-icons text-blue-600 text-4xl">security</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Two-Factor Authentication</h2>
        <p className="text-gray-600">
          {showBackupInput
            ? 'Enter one of your backup codes'
            : 'Enter the 6-digit code from your authenticator app'}
        </p>
      </div>

      {/* TOTP Input */}
      {!showBackupInput && (
        <div className="mb-6">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={token}
            onChange={(e) => handleTokenChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="000000"
            maxLength={6}
            disabled={verifying}
            className="w-full text-center text-4xl font-mono tracking-widest px-4 py-4 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none disabled:bg-gray-100"
            autoFocus
          />
          <p className="text-xs text-gray-500 text-center mt-2">
            Enter the code shown in your authenticator app
          </p>
        </div>
      )}

      {/* Backup Code Input */}
      {showBackupInput && (
        <div className="mb-6">
          <input
            ref={inputRef}
            type="text"
            value={backupCode}
            onChange={(e) => handleBackupCodeChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="XXXX-XXXX"
            maxLength={9}
            disabled={verifying}
            className="w-full text-center text-3xl font-mono tracking-wider px-4 py-4 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none disabled:bg-gray-100"
            autoFocus
          />
          <p className="text-xs text-gray-500 text-center mt-2">
            Backup codes are one-time use only
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <span className="material-icons text-sm mr-2">error</span>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Trust Device Option */}
      {deviceFingerprint && !showBackupInput && (
        <div className="mb-6">
          <label className="flex items-start gap-2 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="mt-1"
            />
            <div className="text-sm">
              <div className="font-medium">Trust this device for 30 days</div>
              <div className="text-gray-600 text-xs">
                Don't ask for codes on this device for 30 days. Only enable on devices you own.
              </div>
            </div>
          </label>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleVerify}
          disabled={
            verifying ||
            (!showBackupInput && token.length !== 6) ||
            (showBackupInput && backupCode.length < 8)
          }
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {verifying ? (
            <>
              <span className="animate-spin material-icons text-sm">refresh</span>
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </button>

        <button
          onClick={toggleBackupInput}
          className="w-full px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          disabled={verifying}
        >
          <span className="material-icons text-sm">
            {showBackupInput ? 'smartphone' : 'vpn_key'}
          </span>
          {showBackupInput ? 'Use Authenticator App' : 'Use Backup Code'}
        </button>

        <button
          onClick={onCancel}
          className="w-full px-6 py-2 text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2"
          disabled={verifying}
        >
          <span className="material-icons text-sm">arrow_back</span>
          Back to Login
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="material-icons text-blue-600 text-sm">info</span>
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Lost access to your authenticator?</p>
            <p className="text-xs text-blue-700">
              Use a backup code to sign in, then set up 2FA again with a new device. Each backup
              code can only be used once.
            </p>
          </div>
        </div>
      </div>

      {/* Remaining Attempts */}
      {attempts > 0 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            {maxAttempts - attempts} attempt{maxAttempts - attempts > 1 ? 's' : ''} remaining
          </p>
        </div>
      )}
    </div>
  );
};

export default TOTPVerify;
