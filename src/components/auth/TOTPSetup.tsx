/**
 * TOTPSetup Component - Guides users through TOTP 2FA setup
 * Displays QR code, secret key, and backup codes
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { TOTPService } from '@/services/totpService';
import { supabase } from '@/integrations/supabase/client';

interface TOTPSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const TOTPSetup: React.FC<TOTPSetupProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'qr' | 'verify' | 'backup' | 'complete'>('qr');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);

  useEffect(() => {
    initializeSetup();
  }, []);

  const initializeSetup = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const setupData = await TOTPService.setupTOTP(user.id, user.email || '');
      setSecret(setupData.secret);
      setQrCodeUrl(setupData.qrCodeUrl);
      setBackupCodes(setupData.backupCodes);
      setLoading(false);
    } catch (err) {
      console.error('Error initializing TOTP setup:', err);
      setError('Failed to initialize 2FA setup. Please try again.');
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const isValid = await TOTPService.enableTOTP(user.id, verificationToken);

      if (isValid) {
        setStep('backup');
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    alert('Secret key copied to clipboard!');
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    alert('Backup codes copied to clipboard!');
  };

  const handleDownloadBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aisurgeonpilot-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFinish = () => {
    if (!backupCodesSaved) {
      if (!confirm('Have you saved your backup codes? You will not be able to see them again.')) {
        return;
      }
    }
    setStep('complete');
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing 2FA setup...</p>
        </div>
      </div>
    );
  }

  if (error && step === 'qr' && !secret) {
    return (
      <div className="text-center p-6">
        <span className="material-icons text-red-600 text-6xl mb-4">error</span>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${step === 'qr' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'qr' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Scan QR</span>
          </div>
          <div className="flex-1 h-1 bg-gray-300 mx-2"></div>
          <div className={`flex items-center ${step === 'verify' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'verify' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Verify</span>
          </div>
          <div className="flex-1 h-1 bg-gray-300 mx-2"></div>
          <div className={`flex items-center ${step === 'backup' || step === 'complete' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'backup' || step === 'complete' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">Backup</span>
          </div>
        </div>
      </div>

      {/* Step 1: QR Code */}
      {step === 'qr' && (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Set Up Two-Factor Authentication</h2>
          <p className="text-gray-600 mb-6">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>

          <div className="bg-white p-6 rounded-lg shadow-md inline-block mb-6">
            <QRCode value={qrCodeUrl} size={256} level="H" />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600 mb-2">Can't scan? Enter this code manually:</p>
            <div className="flex items-center justify-center gap-2">
              <code className="bg-white px-4 py-2 rounded border text-sm font-mono">
                {secret}
              </code>
              <button
                onClick={handleCopySecret}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                title="Copy secret"
              >
                <span className="material-icons text-sm">content_copy</span>
              </button>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep('verify')}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Next: Verify
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Verify Token */}
      {step === 'verify' && (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Verify Your Setup</h2>
          <p className="text-gray-600 mb-6">
            Enter the 6-digit code from your authenticator app to confirm setup
          </p>

          <div className="max-w-md mx-auto mb-6">
            <input
              type="text"
              value={verificationToken}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationToken(value);
              }}
              placeholder="000000"
              maxLength={6}
              className="w-full text-center text-3xl font-mono tracking-widest px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center text-red-700">
              <span className="material-icons text-sm mr-2">error</span>
              {error}
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setStep('qr')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              disabled={verifying}
            >
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={verificationToken.length !== 6 || verifying}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {verifying ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Backup Codes */}
      {step === 'backup' && (
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <span className="material-icons text-green-600 text-6xl">check_circle</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">2FA Enabled Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2 mb-2">
              <span className="material-icons text-yellow-600">warning</span>
              <p className="text-sm text-yellow-800 text-left">
                <strong>Important:</strong> Each code can only be used once. Store them securely and do not share them with anyone.
              </p>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 max-w-md mx-auto">
            <div className="grid grid-cols-2 gap-3">
              {backupCodes.map((code, index) => (
                <div key={index} className="bg-gray-50 px-3 py-2 rounded font-mono text-sm">
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

          <div className="mb-6">
            <label className="flex items-center justify-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={backupCodesSaved}
                onChange={(e) => setBackupCodesSaved(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">I have saved my backup codes in a safe place</span>
            </label>
          </div>

          <button
            onClick={handleFinish}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Finish Setup
          </button>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 'complete' && (
        <div className="text-center py-12">
          <div className="animate-bounce mb-4">
            <span className="material-icons text-green-600 text-8xl">check_circle</span>
          </div>
          <h2 className="text-3xl font-bold text-green-600 mb-4">All Set!</h2>
          <p className="text-gray-600">Two-factor authentication is now enabled for your account.</p>
        </div>
      )}
    </div>
  );
};

export default TOTPSetup;
