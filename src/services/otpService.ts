import { supabase } from '@/integrations/supabase/client';
import { emailService } from './emailService';
import { whatsappService } from './whatsappService';

interface OTPStorage {
  identifier: string; // phone or email
  otp: string;
  expiresAt: number;
  attempts: number;
}

class OTPService {
  private otpStore: Map<string, OTPStorage> = new Map();
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_ATTEMPTS = 3;

  /**
   * Generate a random 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP to email
   */
  async sendEmailOTP(email: string, tenantId?: string): Promise<boolean> {
    try {
      const otp = this.generateOTP();
      const expiresAt = Date.now() + this.OTP_EXPIRY_MS;

      // Store OTP
      this.otpStore.set(email, {
        identifier: email,
        otp,
        expiresAt,
        attempts: 0
      });

      // Send email
      await emailService.sendOTP({
        tenant_id: tenantId || '',
        patient_email: email,
        patient_name: '',
        otp
      });

      console.log(`OTP sent to email ${email}: ${otp}`); // For development
      return true;
    } catch (error) {
      console.error('Error sending email OTP:', error);
      return false;
    }
  }

  /**
   * Send OTP to phone via WhatsApp (DoubleTick)
   */
  async sendPhoneOTP(phone: string, tenantId?: string): Promise<boolean> {
    try {
      const otp = this.generateOTP();
      const expiresAt = Date.now() + this.OTP_EXPIRY_MS;

      // Store OTP
      this.otpStore.set(phone, {
        identifier: phone,
        otp,
        expiresAt,
        attempts: 0
      });

      // Send via WhatsApp using DoubleTick API
      await whatsappService.sendOTP({
        tenant_id: tenantId || '',
        patient_phone: phone,
        otp
      });

      console.log(`OTP sent to phone ${phone}: ${otp}`); // For development
      return true;
    } catch (error) {
      console.error('Error sending phone OTP:', error);
      return false;
    }
  }

  /**
   * Verify OTP for email or phone
   */
  async verifyOTP(identifier: string, otp: string): Promise<{
    success: boolean;
    message: string;
    userId?: string;
  }> {
    const stored = this.otpStore.get(identifier);

    if (!stored) {
      return {
        success: false,
        message: 'OTP not found. Please request a new one.'
      };
    }

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      this.otpStore.delete(identifier);
      return {
        success: false,
        message: 'OTP has expired. Please request a new one.'
      };
    }

    // Check attempts
    if (stored.attempts >= this.MAX_ATTEMPTS) {
      this.otpStore.delete(identifier);
      return {
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      };
    }

    // Verify OTP
    if (stored.otp !== otp) {
      stored.attempts++;
      return {
        success: false,
        message: `Invalid OTP. ${this.MAX_ATTEMPTS - stored.attempts} attempts remaining.`
      };
    }

    // OTP is valid - clean up
    this.otpStore.delete(identifier);

    // Check if patient exists
    const isEmail = identifier.includes('@');
    const { data: patient, error } = await supabase
      .from('patients')
      .select('id, email, phone_number')
      .or(isEmail ? `email.eq.${identifier}` : `phone_number.eq.${identifier}`)
      .single();

    if (error || !patient) {
      return {
        success: false,
        message: 'Patient not found. Please register first.'
      };
    }

    return {
      success: true,
      message: 'OTP verified successfully',
      userId: patient.id
    };
  }

  /**
   * Create or update patient profile after OTP verification
   */
  async createPatientProfile(
    identifier: string,
    additionalData?: {
      name?: string;
      email?: string;
      phone?: string;
    }
  ): Promise<{ success: boolean; patientId?: string; message: string }> {
    try {
      const isEmail = identifier.includes('@');

      // Check if patient already exists
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .or(isEmail ? `email.eq.${identifier}` : `phone_number.eq.${identifier}`)
        .single();

      if (existingPatient) {
        return {
          success: true,
          patientId: existingPatient.id,
          message: 'Patient profile found'
        };
      }

      // Create new patient profile
      const { data: newPatient, error } = await supabase
        .from('patients')
        .insert({
          email: isEmail ? identifier : additionalData?.email,
          phone_number: isEmail ? additionalData?.phone : identifier,
          name: additionalData?.name || 'Patient',
          is_verified: true
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating patient profile:', error);
        return {
          success: false,
          message: 'Failed to create patient profile'
        };
      }

      return {
        success: true,
        patientId: newPatient.id,
        message: 'Patient profile created successfully'
      };
    } catch (error) {
      console.error('Error in createPatientProfile:', error);
      return {
        success: false,
        message: 'An error occurred while creating patient profile'
      };
    }
  }

  /**
   * Clean up expired OTPs (run periodically)
   */
  cleanupExpiredOTPs(): void {
    const now = Date.now();
    for (const [key, value] of this.otpStore.entries()) {
      if (now > value.expiresAt) {
        this.otpStore.delete(key);
      }
    }
  }
}

export const otpService = new OTPService();

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  otpService.cleanupExpiredOTPs();
}, 5 * 60 * 1000);
