/**
 * WhatsApp Service - DoubleTick API Integration
 * Production-ready WhatsApp messaging service with retry logic
 *
 * Setup:
 * 1. Sign up at https://doubletick.io
 * 2. Set VITE_DOUBLETICK_API_KEY in .env
 * 3. Set VITE_DOUBLETICK_PHONE_NUMBER in .env
 * 4. Configure templates in DoubleTick dashboard
 *
 * API Documentation: https://api.doubletick.io/whatsapp/v1/messages/template
 */

import axios, { AxiosError, AxiosInstance } from 'axios';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * WhatsApp template message parameters
 */
export interface WhatsAppTemplateParams {
  to: string; // Phone number with country code (e.g., +919876543210)
  template: string; // Template name from DoubleTick dashboard
  variables: string[]; // Array of template variables in order
}

/**
 * DoubleTick API response
 */
interface DoubleTickResponse {
  messages?: Array<{
    status: string;
    recipient: string;
    messageId: string;
  }>;
  success?: boolean;
  message?: string;
  data?: {
    message_id?: string;
    status?: string;
  };
  error?: string;
  code?: string;
}

/**
 * Service response type
 */
export interface WhatsAppServiceResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  retryCount?: number;
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
}

/**
 * Clinic/Hospital information for multi-tenant branding
 */
export interface ClinicInfo {
  name: string; // Clinic/Hospital name (e.g., "Gaikwad Skin Clinic")
  address?: string; // Full address
  city?: string;
  state?: string;
  pinCode?: string;
  phone?: string;
  latitude?: number; // For Google Maps link
  longitude?: number;
}

/**
 * Appointment details for WhatsApp messages
 */
export interface AppointmentDetails {
  appointmentId: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number; // Patient age
  patientGender?: string; // Patient gender
  doctorName: string;
  doctorPhone?: string; // Doctor's WhatsApp number for notifications
  appointmentDate: string; // Formatted date (e.g., "15 Nov 2025")
  appointmentTime: string; // Formatted time (e.g., "10:30 AM")
  consultationType: 'in-person' | 'tele-consult' | 'home-visit';
  clinic: ClinicInfo;
  teleConsultLink?: string; // For virtual appointments
  amount?: number; // For payment messages
  instructions?: string; // Pre-appointment instructions
  parkingInfo?: string; // Parking instructions for in-person visits
  chiefComplaint?: string; // Patient's main concern/reason for visit
  isNewPatient?: boolean; // New vs returning patient
}

// ============================================================================
// WHATSAPP SERVICE CLASS
// ============================================================================

class WhatsAppService {
  private apiKey: string;
  private phoneNumber: string;
  private apiUrl: string;
  private axiosInstance: AxiosInstance;
  private retryConfig: RetryConfig;

  constructor() {
    // Load configuration from environment
    this.apiKey = import.meta.env.VITE_DOUBLETICK_API_KEY || 'key_8sc9MP6JpQ';
    this.phoneNumber = import.meta.env.VITE_DOUBLETICK_PHONE_NUMBER || '';
    this.apiUrl = 'https://public.doubletick.io/whatsapp/message/template';

    // Configure retry settings
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 10000, // 10 seconds
      backoffMultiplier: 2
    };

    // Initialize axios instance with defaults
    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'Authorization': this.apiKey
      }
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log('[WhatsApp Service] Request:', {
          method: config.method,
          url: config.url,
          data: config.data
        });
        return config;
      },
      (error) => {
        console.error('[WhatsApp Service] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log('[WhatsApp Service] Response:', {
          status: response.status,
          data: response.data
        });
        return response;
      },
      (error) => {
        console.error('[WhatsApp Service] Response error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Validate phone number format
   */
  private validatePhoneNumber(phone: string): boolean {
    // Remove all non-numeric characters for validation
    const cleaned = phone.replace(/\D/g, '');
    // Should have country code + number (10-15 digits total)
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Add country code if not present (assuming India +91)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }

    // Add + prefix if not present
    return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    const delay = this.retryConfig.baseDelay *
                  Math.pow(this.retryConfig.backoffMultiplier, retryCount);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: AxiosError): boolean {
    // Retry on network errors
    if (!error.response) {
      return true;
    }

    // Retry on specific HTTP status codes
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    return retryableStatusCodes.includes(error.response.status);
  }

  /**
   * Send WhatsApp template message with retry logic
   *
   * @param params - Template message parameters
   * @returns Promise with success status and message ID
   */
  public async sendWhatsAppTemplate(
    params: WhatsAppTemplateParams
  ): Promise<WhatsAppServiceResponse> {
    // Validate API key
    if (!this.apiKey) {
      const errorMsg = 'DoubleTick API key not configured. Set VITE_DOUBLETICK_API_KEY in .env';
      console.error('[WhatsApp Service]', errorMsg);
      return { success: false, error: errorMsg };
    }

    // Validate and format phone number
    if (!this.validatePhoneNumber(params.to)) {
      const errorMsg = `Invalid phone number format: ${params.to}`;
      console.error('[WhatsApp Service]', errorMsg);
      return { success: false, error: errorMsg };
    }

    const formattedPhone = this.formatPhoneNumber(params.to);

    // Prepare request payload for DoubleTick API
    // Format matches: https://public.doubletick.io/whatsapp/message/template
    const payload = {
      messages: [
        {
          to: formattedPhone,
          content: {
            templateName: params.template,
            language: 'en',
            templateData: {
              body: {
                placeholders: params.variables
              }
            }
          }
        }
      ]
    };

    let lastError: Error | null = null;
    let retryCount = 0;

    // Retry loop
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        console.log(`[WhatsApp Service] Sending template (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}):`, {
          to: formattedPhone,
          template: params.template,
          variables: params.variables,
          payload
        });

        const response = await this.axiosInstance.post<DoubleTickResponse>(
          '',
          payload
        );

        // Log full response for debugging
        console.log('[WhatsApp Service] Full API Response:', JSON.stringify(response.data, null, 2));

        // DoubleTick returns array of messages directly
        if (response.data.messages && response.data.messages.length > 0) {
          const message = response.data.messages[0];
          const messageId = message.messageId;
          const status = message.status;

          console.log('[WhatsApp Service] ✅ Message sent successfully:', {
            messageId,
            status,
            recipient: message.recipient
          });

          return {
            success: true,
            messageId,
            retryCount: attempt
          };
        }

        // Check old format for backward compatibility
        if (response.data.success) {
          const messageId = response.data.data?.message_id || response.data.data?.status || 'unknown';
          console.log('[WhatsApp Service] Message sent successfully:', messageId);

          return {
            success: true,
            messageId,
            retryCount: attempt
          };
        }

        // API returned failure
        console.error('[WhatsApp Service] ❌ API returned failure:', {
          fullResponse: response.data,
          error: response.data.error,
          message: response.data.message,
          data: response.data.data
        });

        const errorMsg = response.data.error || response.data.message || 'WhatsApp sending failed';

        return {
          success: false,
          error: errorMsg,
          retryCount: attempt
        };
      } catch (error) {
        lastError = error as Error;
        retryCount = attempt;

        // Check if we should retry
        if (error instanceof AxiosError) {
          console.error(`[WhatsApp Service] Request failed (attempt ${attempt + 1}):`, {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
          });

          // If this is the last attempt or error is not retryable, throw
          if (attempt === this.retryConfig.maxRetries || !this.isRetryableError(error)) {
            break;
          }

          // Calculate delay and wait before retry
          const delay = this.calculateRetryDelay(attempt);
          console.log(`[WhatsApp Service] Retrying in ${delay}ms...`);
          await this.sleep(delay);
        } else {
          // Non-axios error, don't retry
          console.error('[WhatsApp Service] Non-retryable error:', error);
          break;
        }
      }
    }

    // All retries failed
    const errorMsg = lastError instanceof AxiosError
      ? lastError.response?.data?.error || lastError.response?.data?.message || lastError.message
      : lastError?.message || 'Unknown error occurred';

    console.error('[WhatsApp Service] All retry attempts failed:', errorMsg);

    return {
      success: false,
      error: errorMsg,
      retryCount
    };
  }

  // ============================================================================
  // UTILITY HELPER FUNCTIONS
  // ============================================================================

  /**
   * Generate Google Maps link from coordinates or address
   */
  private generateGoogleMapsLink(clinic: ClinicInfo): string {
    if (clinic.latitude && clinic.longitude) {
      // Use coordinates for precise location
      return `https://maps.google.com/?q=${clinic.latitude},${clinic.longitude}`;
    } else if (clinic.address) {
      // Use address search
      const addressQuery = encodeURIComponent(
        `${clinic.address}, ${clinic.city || ''}, ${clinic.state || ''} ${clinic.pinCode || ''}`.trim()
      );
      return `https://maps.google.com/?q=${addressQuery}`;
    } else {
      // Use clinic name as fallback
      const nameQuery = encodeURIComponent(clinic.name);
      return `https://maps.google.com/?q=${nameQuery}`;
    }
  }

  /**
   * Format clinic address for display
   */
  private formatClinicAddress(clinic: ClinicInfo): string {
    const parts: string[] = [];

    if (clinic.address) parts.push(clinic.address);
    if (clinic.city) parts.push(clinic.city);
    if (clinic.state) parts.push(clinic.state);
    if (clinic.pinCode) parts.push(clinic.pinCode);

    return parts.join(', ');
  }

  /**
   * Get location information based on consultation type
   */
  private getLocationInfo(appointment: AppointmentDetails): string {
    if (appointment.consultationType === 'tele-consult') {
      return appointment.teleConsultLink || 'Link will be shared before appointment';
    } else if (appointment.consultationType === 'in-person') {
      const address = this.formatClinicAddress(appointment.clinic);
      const mapsLink = this.generateGoogleMapsLink(appointment.clinic);
      return `${address}\n\nGoogle Maps: ${mapsLink}`;
    } else if (appointment.consultationType === 'home-visit') {
      return 'Doctor will visit your home';
    }
    return '';
  }

  // ============================================================================
  // TEMPLATE HELPER FUNCTIONS (ENHANCED FOR MULTI-TENANT)
  // ============================================================================

  /**
   * Send appointment confirmation with full clinic branding and location
   */
  public async sendAppointmentConfirmationEnhanced(
    appointment: AppointmentDetails
  ): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending enhanced appointment confirmation:', appointment);

    const locationInfo = this.getLocationInfo(appointment);
    const mapsLink = appointment.consultationType === 'in-person'
      ? this.generateGoogleMapsLink(appointment.clinic)
      : '';

    // Template variables for DoubleTick
    // Expected template format:
    // "Greetings from {{1}}! Dear {{2}}, your appointment is confirmed with Dr. {{3}} on {{4}} at {{5}}. Location: {{6}}. {{7}}"
    const variables = [
      appointment.clinic.name, // {{1}} - Clinic name
      appointment.patientName, // {{2}} - Patient name
      appointment.doctorName, // {{3}} - Doctor name
      appointment.appointmentDate, // {{4}} - Date
      appointment.appointmentTime, // {{5}} - Time
      appointment.consultationType === 'in-person' ? this.formatClinicAddress(appointment.clinic) : 'Tele-consult', // {{6}} - Location
      mapsLink || appointment.teleConsultLink || '', // {{7}} - Maps link or tele-consult link
      appointment.clinic.phone || '', // {{8}} - Clinic phone (optional)
    ];

    return this.sendWhatsAppTemplate({
      to: appointment.patientPhone,
      template: 'appointment_confirmation_ddo', // DoubleTick template
      variables: variables.filter(v => v !== '') // Remove empty variables
    });
  }

  /**
   * Send appointment reminder (24 hours) with location and instructions
   */
  public async sendAppointmentReminder24hEnhanced(
    appointment: AppointmentDetails
  ): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending enhanced 24h reminder:', appointment);

    const mapsLink = appointment.consultationType === 'in-person'
      ? this.generateGoogleMapsLink(appointment.clinic)
      : '';

    // Template variables
    // "Greetings from {{1}}! Reminder: Your appointment with Dr. {{2}} is tomorrow at {{3}}. {{4}}. Location: {{5}}. {{6}}"
    const variables = [
      appointment.clinic.name, // {{1}} - Clinic name
      appointment.doctorName, // {{2}} - Doctor name
      appointment.appointmentTime, // {{3}} - Time
      appointment.instructions || 'Please arrive 10 minutes early', // {{4}} - Instructions
      appointment.consultationType === 'in-person' ? this.formatClinicAddress(appointment.clinic) : 'Tele-consult', // {{5}} - Location
      mapsLink || appointment.teleConsultLink || '', // {{6}} - Link
      appointment.parkingInfo || '', // {{7}} - Parking info (optional)
      appointment.clinic.phone || '', // {{8}} - Clinic phone
    ];

    return this.sendWhatsAppTemplate({
      to: appointment.patientPhone,
      template: '24hour_reminder_ddo',
      variables: variables.filter(v => v !== '')
    });
  }

  /**
   * Send appointment reminder (3 hours) with urgent location info
   */
  public async sendAppointmentReminder3hEnhanced(
    appointment: AppointmentDetails
  ): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending enhanced 3h reminder:', appointment);

    const mapsLink = appointment.consultationType === 'in-person'
      ? this.generateGoogleMapsLink(appointment.clinic)
      : '';

    // Template variables
    // "Greetings from {{1}}! Your appointment with Dr. {{2}} is in 3 hours at {{3}}. {{4}}"
    const variables = [
      appointment.clinic.name, // {{1}} - Clinic name
      appointment.doctorName, // {{2}} - Doctor name
      appointment.appointmentTime, // {{3}} - Time
      mapsLink || appointment.teleConsultLink || 'See you soon!', // {{4}} - Link
      appointment.clinic.phone || '', // {{5}} - Clinic phone
    ];

    return this.sendWhatsAppTemplate({
      to: appointment.patientPhone,
      template: '3hour_reminder_ddo',
      variables: variables.filter(v => v !== '')
    });
  }

  /**
   * Send payment receipt with clinic branding
   */
  public async sendPaymentReceiptEnhanced(
    appointment: AppointmentDetails
  ): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending enhanced payment receipt:', appointment);

    const amount = appointment.amount ? `₹${appointment.amount}` : '₹0';

    // Template variables
    // "Greetings from {{1}}! Dear {{2}}, payment of {{3}} received for appointment with Dr. {{4}} on {{5}}. Thank you!"
    const variables = [
      appointment.clinic.name, // {{1}} - Clinic name
      appointment.patientName, // {{2}} - Patient name
      amount, // {{3}} - Amount
      appointment.doctorName, // {{4}} - Doctor name
      `${appointment.appointmentDate} at ${appointment.appointmentTime}`, // {{5}} - Date & time
      appointment.appointmentId, // {{6}} - Receipt/Appointment ID
      appointment.clinic.phone || '', // {{7}} - Clinic phone
    ];

    return this.sendWhatsAppTemplate({
      to: appointment.patientPhone,
      template: 'payment_receipt_v2',
      variables: variables.filter(v => v !== '')
    });
  }

  /**
   * Send appointment cancellation with clinic branding
   */
  public async sendAppointmentCancelledEnhanced(
    appointment: AppointmentDetails,
    reason: string
  ): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending enhanced cancellation:', appointment);

    // Template variables
    // "Greetings from {{1}}! Dear {{2}}, your appointment with Dr. {{3}} on {{4}} has been cancelled. Reason: {{5}}. Call {{6}} to reschedule."
    const variables = [
      appointment.clinic.name, // {{1}} - Clinic name
      appointment.patientName, // {{2}} - Patient name
      appointment.doctorName, // {{3}} - Doctor name
      `${appointment.appointmentDate} at ${appointment.appointmentTime}`, // {{4}} - Date & time
      reason, // {{5}} - Cancellation reason
      appointment.clinic.phone || 'us', // {{6}} - Clinic phone
    ];

    return this.sendWhatsAppTemplate({
      to: appointment.patientPhone,
      template: 'appointment_cancelled_ddo',
      variables: variables.filter(v => v !== '')
    });
  }

  // ============================================================================
  // DOCTOR NOTIFICATION FUNCTIONS (STAFF ALERTS)
  // ============================================================================

  /**
   * Notify doctor of new appointment booking
   */
  public async notifyDoctorNewAppointment(
    appointment: AppointmentDetails
  ): Promise<WhatsAppServiceResponse> {
    if (!appointment.doctorPhone) {
      return {
        success: false,
        error: 'Doctor phone number not provided'
      };
    }

    console.log('[WhatsApp Service] Notifying doctor of new appointment:', appointment);

    const patientInfo = [
      appointment.patientName,
      appointment.patientAge ? `${appointment.patientAge}Y` : '',
      appointment.patientGender ? appointment.patientGender.charAt(0).toUpperCase() : ''
    ].filter(Boolean).join(', ');

    const amount = appointment.amount ? `₹${appointment.amount}` : 'Pending';

    // Template variables
    // "🔔 New Appointment at {{1}}! Patient: {{2}} | Date: {{3}} at {{4}} | Type: {{5}} | Complaint: {{6}} | Payment: {{7}} | ID: {{8}}"
    const variables = [
      appointment.clinic.name, // {{1}} - Clinic name
      patientInfo, // {{2}} - Patient info (Name, Age, Gender)
      appointment.appointmentDate, // {{3}} - Date
      appointment.appointmentTime, // {{4}} - Time
      appointment.consultationType === 'in-person' ? 'In-Person' :
        appointment.consultationType === 'tele-consult' ? 'Tele-Consult' : 'Home Visit', // {{5}} - Type
      appointment.chiefComplaint || 'Not specified', // {{6}} - Chief complaint
      amount, // {{7}} - Payment status
      appointment.appointmentId, // {{8}} - Appointment ID
      appointment.isNewPatient ? '(New Patient)' : '(Follow-up)', // {{9}} - Patient type
    ];

    return this.sendWhatsAppTemplate({
      to: appointment.doctorPhone,
      template: 'doctor_new_appointment',
      variables: variables.filter(v => v !== '')
    });
  }

  /**
   * Notify doctor of appointment cancellation by patient
   */
  public async notifyDoctorCancellation(
    appointment: AppointmentDetails,
    cancelledBy: 'patient' | 'admin' = 'patient'
  ): Promise<WhatsAppServiceResponse> {
    if (!appointment.doctorPhone) {
      return {
        success: false,
        error: 'Doctor phone number not provided'
      };
    }

    console.log('[WhatsApp Service] Notifying doctor of cancellation:', appointment);

    // Template variables
    // "❌ Appointment Cancelled at {{1}} | Patient: {{2}} | Date: {{3}} at {{4}} | Cancelled by: {{5}} | ID: {{6}}"
    const variables = [
      appointment.clinic.name, // {{1}} - Clinic name
      appointment.patientName, // {{2}} - Patient name
      appointment.appointmentDate, // {{3}} - Date
      appointment.appointmentTime, // {{4}} - Time
      cancelledBy === 'patient' ? 'Patient' : 'Admin', // {{5}} - Cancelled by
      appointment.appointmentId, // {{6}} - Appointment ID
      appointment.patientPhone, // {{7}} - Patient phone (for callback)
    ];

    return this.sendWhatsAppTemplate({
      to: appointment.doctorPhone,
      template: 'doctor_appointment_cancelled',
      variables: variables.filter(v => v !== '')
    });
  }

  /**
   * Notify doctor of appointment reschedule
   */
  public async notifyDoctorReschedule(
    appointment: AppointmentDetails,
    oldDate: string,
    oldTime: string
  ): Promise<WhatsAppServiceResponse> {
    if (!appointment.doctorPhone) {
      return {
        success: false,
        error: 'Doctor phone number not provided'
      };
    }

    console.log('[WhatsApp Service] Notifying doctor of reschedule:', appointment);

    // Template variables
    // "🔄 Appointment Rescheduled at {{1}} | Patient: {{2}} | From: {{3}} at {{4}} | To: {{5}} at {{6}} | ID: {{7}}"
    const variables = [
      appointment.clinic.name, // {{1}} - Clinic name
      appointment.patientName, // {{2}} - Patient name
      oldDate, // {{3}} - Old date
      oldTime, // {{4}} - Old time
      appointment.appointmentDate, // {{5}} - New date
      appointment.appointmentTime, // {{6}} - New time
      appointment.appointmentId, // {{7}} - Appointment ID
    ];

    return this.sendWhatsAppTemplate({
      to: appointment.doctorPhone,
      template: 'doctor_appointment_rescheduled',
      variables: variables.filter(v => v !== '')
    });
  }

  /**
   * Send daily appointment summary to doctor (morning digest)
   */
  public async sendDoctorDailySummary(
    doctorName: string,
    doctorPhone: string,
    clinicName: string,
    todayDate: string,
    appointments: Array<{
      time: string;
      patientName: string;
      type: string;
      isNew: boolean;
    }>,
    totalAppointments: number
  ): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending daily summary to doctor');

    // Create appointment list text
    const appointmentList = appointments.slice(0, 5).map((apt, idx) =>
      `${idx + 1}. ${apt.time} - ${apt.patientName} (${apt.type})${apt.isNew ? ' *New*' : ''}`
    ).join('\n');

    const moreText = totalAppointments > 5 ? `\n...and ${totalAppointments - 5} more` : '';

    // Template variables
    // "☀️ Good Morning Dr. {{1}}! Your schedule at {{2}} for {{3}}: {{4}} appointments. {{5}}"
    const variables = [
      doctorName, // {{1}} - Doctor name
      clinicName, // {{2}} - Clinic name
      todayDate, // {{3}} - Today's date
      totalAppointments.toString(), // {{4}} - Total count
      appointmentList + moreText, // {{5}} - Appointment list
    ];

    return this.sendWhatsAppTemplate({
      to: doctorPhone,
      template: 'doctor_daily_summary',
      variables: variables.filter(v => v !== '')
    });
  }

  /**
   * Notify doctor when patient arrives/checks in
   */
  public async notifyDoctorPatientArrived(
    appointment: AppointmentDetails
  ): Promise<WhatsAppServiceResponse> {
    if (!appointment.doctorPhone) {
      return {
        success: false,
        error: 'Doctor phone number not provided'
      };
    }

    console.log('[WhatsApp Service] Notifying doctor of patient arrival');

    // Template variables
    // "✅ Patient Arrived at {{1}} | {{2}} is here for {{3}} appointment | Time: {{4}}"
    const variables = [
      appointment.clinic.name, // {{1}} - Clinic name
      appointment.patientName, // {{2}} - Patient name
      appointment.appointmentTime, // {{3}} - Scheduled time
      new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), // {{4}} - Current time
    ];

    return this.sendWhatsAppTemplate({
      to: appointment.doctorPhone,
      template: 'doctor_patient_arrived',
      variables: variables.filter(v => v !== '')
    });
  }

  // ============================================================================
  // LEGACY TEMPLATE FUNCTIONS (BACKWARD COMPATIBILITY)
  // ============================================================================

  /**
   * Send appointment confirmation (LEGACY - kept for backward compatibility)
   *
   * Template format (8 placeholders):
   * Greetings from {{1}}! Dear {{2}}, your appointment with Dr. {{3}} is confirmed on {{4}} at {{5}}.
   * 📍 Location: {{6}}
   * 🔗 {{7}}
   * For queries, call {{8}}.
   */
  public async sendAppointmentConfirmation(
    patientName: string,
    phone: string,
    date: string,
    time: string,
    doctorName: string,
    clinicName: string = 'AI Surgeon Pilot',
    location: string = 'Visit our clinic for in-person appointments',
    meetingLink: string = 'N/A',
    contactPhone: string = '+91-XXX-XXX-XXXX'
  ): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending appointment confirmation:', {
      patientName,
      phone,
      date,
      time,
      doctorName,
      clinicName,
      location,
      meetingLink,
      contactPhone
    });

    // Template requires 8 variables in this order:
    // 1. Clinic name, 2. Patient name, 3. Doctor name, 4. Date,
    // 5. Time, 6. Location, 7. Meeting link, 8. Contact phone
    return this.sendWhatsAppTemplate({
      to: phone,
      template: 'appointment_confirmation_ddo',
      variables: [
        clinicName,      // {{1}}
        patientName,     // {{2}}
        doctorName,      // {{3}}
        date,            // {{4}}
        time,            // {{5}}
        location,        // {{6}}
        meetingLink,     // {{7}}
        contactPhone     // {{8}}
      ]
    });
  }

  /**
   * Send appointment reminder (24 hours before)
   *
   * Template: 24 hr reminder (8 variables)
   * Greetings from {{1}}! Reminder: Your appointment with Dr. {{2}} is tomorrow at {{3}}.
   * 📝 Instructions: {{4}}
   * 📍 Location: {{5}}
   * 🔗 {{6}}
   * {{7}}
   * For queries, call {{8}}.
   */
  public async sendAppointmentReminder24h(
    patientName: string,
    phone: string,
    doctorName: string,
    time: string,
    instructions: string = 'Please arrive 10 minutes early',
    location: string = 'Visit our clinic',
    link: string = 'N/A',
    additionalInfo: string = 'Bring any previous medical records',
    clinicName: string = 'AI Surgeon Pilot',
    contactPhone: string = '+91-XXX-XXX-XXXX'
  ): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending 24h appointment reminder');

    return this.sendWhatsAppTemplate({
      to: phone,
      template: '24hour_reminder_ddo',
      variables: [
        clinicName,      // {{1}}
        doctorName,      // {{2}}
        time,            // {{3}}
        instructions,    // {{4}}
        location,        // {{5}}
        link,            // {{6}}
        additionalInfo,  // {{7}}
        contactPhone     // {{8}}
      ]
    });
  }

  /**
   * Send appointment reminder (3 hours before)
   *
   * Template: 3hr reminder (5 variables)
   * Greetings from {{1}}! Your appointment with Dr. {{2}} is in 3 hours at {{3}}.
   * 📍 {{4}}
   * For queries, call {{5}}.
   */
  public async sendAppointmentReminder3h(
    phone: string,
    doctorName: string,
    time: string,
    location: string = 'Visit our clinic',
    clinicName: string = 'AI Surgeon Pilot',
    contactPhone: string = '+91-XXX-XXX-XXXX'
  ): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending 3h appointment reminder');

    return this.sendWhatsAppTemplate({
      to: phone,
      template: '3hour_reminder_ddo',
      variables: [
        clinicName,     // {{1}}
        doctorName,     // {{2}}
        time,           // {{3}}
        location,       // {{4}}
        contactPhone    // {{5}}
      ]
    });
  }

  /**
   * Send prescription ready notification
   *
   * Template: prescription (9 variables)
   * Hello {{1}}, Your prescription from Dr. {{2}} is ready!
   * 📋 Date: {{3}}, Diagnosis: {{4}}, ID: {{5}}
   * 📥 Download: {{6}}
   * ⚕️ Instructions: {{7}}
   * Follow-up: {{8}}
   * Regards, {{9}}
   */
  public async sendPrescriptionReady(
    patientName: string,
    phone: string,
    doctorName: string,
    date: string,
    diagnosis: string,
    prescriptionId: string,
    downloadLink: string,
    instructions: string,
    followupDate: string,
    clinicName: string = 'AI Surgeon Pilot'
  ): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending prescription ready notification (DDO template)');
    console.log('[WhatsApp Service] Using template: prescription_ready_ddo with 9 variables');

    return this.sendWhatsAppTemplate({
      to: phone,
      template: 'prescription_ready_ddo', // Changed to use DDO template
      variables: [
        patientName,      // {{1}}
        doctorName,       // {{2}}
        date,             // {{3}}
        diagnosis,        // {{4}}
        prescriptionId,   // {{5}}
        downloadLink,     // {{6}}
        instructions,     // {{7}}
        followupDate,     // {{8}}
        clinicName        // {{9}}
      ]
    });
  }

  /**
   * Send follow-up reminder
   *
   * Template: followup reminder (6 variables)
   * Hello {{1}}, Dr. {{2}} recommends a follow-up visit.
   * Reason: {{3}}
   * Recommended Date: {{4}}
   * 📱 Book: {{5}}
   * {{6}}
   */
  public async sendFollowupReminder(
    patientName: string,
    phone: string,
    doctorName: string,
    reason: string,
    recommendedDate: string,
    bookingLink: string = 'Call +91-9876543210',
    clinicName: string = 'AI Surgeon Pilot'
  ): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending follow-up reminder');

    return this.sendWhatsAppTemplate({
      to: phone,
      template: 'followup_reminder_ddo',
      variables: [
        patientName,       // {{1}}
        doctorName,        // {{2}}
        reason,            // {{3}}
        recommendedDate,   // {{4}}
        bookingLink,       // {{5}}
        clinicName         // {{6}}
      ]
    });
  }

  /**
   * Send appointment cancelled notification
   *
   * Template: cancelled (6 variables)
   * Greetings from {{1}}! Dear {{2}}, your appointment with Dr. {{3}} on {{4}} has been cancelled.
   * Reason: {{5}}
   * To reschedule, call {{6}}.
   */
  public async sendAppointmentCancelled(
    patientName: string,
    phone: string,
    doctorName: string,
    date: string,
    reason: string,
    clinicName: string = 'AI Surgeon Pilot',
    contactPhone: string = '+91-XXX-XXX-XXXX'
  ): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending appointment cancellation');

    return this.sendWhatsAppTemplate({
      to: phone,
      template: 'appointment_cancelled_ddo',
      variables: [
        clinicName,     // {{1}}
        patientName,    // {{2}}
        doctorName,     // {{3}}
        date,           // {{4}}
        reason,         // {{5}}
        contactPhone    // {{6}}
      ]
    });
  }

  /**
   * Send welcome message for new patient
   */
  public async sendWelcomeMessage(
    patientName: string,
    phone: string,
    email: string,
    patientId: string
  ): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending welcome message:', {
      patientName,
      phone,
      email,
      patientId
    });

    return this.sendWhatsAppTemplate({
      to: phone,
      template: 'welcome_message',
      variables: [patientName, email, patientId]
    });
  }

  /**
   * Send payment receipt
   *
   * Template: payment (8 variables)
   * Hello {{1}}, Thank you for your payment of ₹{{2}}!
   * Receipt No: {{3}}, Date: {{4}}, Method: {{5}}, Service: {{6}}
   * 📥 Download: {{7}}
   * Regards, {{8}}
   */
  public async sendPaymentReceipt(
    patientName: string,
    phone: string,
    amount: string,
    receiptNo: string,
    date: string,
    paymentMethod: string,
    service: string,
    downloadLink: string,
    clinicName: string = 'AI Surgeon Pilot'
  ): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending payment receipt');

    return this.sendWhatsAppTemplate({
      to: phone,
      template: 'payment_receipt',
      variables: [
        patientName,     // {{1}}
        amount,          // {{2}}
        receiptNo,       // {{3}}
        date,            // {{4}}
        paymentMethod,   // {{5}}
        service,         // {{6}}
        downloadLink,    // {{7}}
        clinicName       // {{8}}
      ]
    });
  }

  /**
   * Send lab report notification
   *
   * Template: lab report (7 variables)
   * Hello {{1}}, Your lab reports are ready! 🔬
   * Test: {{2}}, Date: {{3}}, ID: {{4}}
   * 📥 Download: {{5}}
   * Dr. {{6}} will review.
   * {{7}}
   */
  public async sendLabReportReady(
    patientName: string,
    phone: string,
    testName: string,
    date: string,
    reportId: string,
    downloadLink: string,
    doctorName: string,
    clinicName: string = 'AI Surgeon Pilot'
  ): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending lab report notification');

    return this.sendWhatsAppTemplate({
      to: phone,
      template: 'lab_report_ready',
      variables: [
        patientName,    // {{1}}
        testName,       // {{2}}
        date,           // {{3}}
        reportId,       // {{4}}
        downloadLink,   // {{5}}
        doctorName,     // {{6}}
        clinicName      // {{7}}
      ]
    });
  }

  // ============================================================================
  // PDF-ENHANCED TEMPLATE FUNCTIONS (NEW)
  // ============================================================================

  /**
   * Send payment receipt with PDF download link
   * Template: payment_receipt_pdf
   * Variables: {{1}}=patient_name, {{2}}=receipt_number, {{3}}=amount, {{4}}=date, {{5}}=pdf_url
   */
  public async sendPaymentReceiptWithPDF(params: {
    patientName: string;
    patientPhone: string;
    receiptNumber: string;
    amount: number;
    pdfUrl: string;
    date: string;
  }): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending payment receipt with PDF:', params);

    // Template: payment_receipt_pdf (5 variables)
    const variables = [
      params.patientName,           // {{1}}
      params.receiptNumber,         // {{2}}
      params.amount.toFixed(2),     // {{3}}
      params.date,                  // {{4}}
      params.pdfUrl                 // {{5}}
    ];

    return this.sendWhatsAppTemplate({
      to: params.patientPhone,
      template: 'payment_receipt_pdf_ddo',
      variables
    });
  }

  /**
   * Send prescription ready notification with PDF download link
   * Template: prescription_ready_pdf
   * Variables: {{1}}=patient_name, {{2}}=doctor_name, {{3}}=prescription_number, {{4}}=pdf_url
   */
  public async sendPrescriptionReadyWithPDF(params: {
    patientName: string;
    patientPhone: string;
    doctorName: string;
    prescriptionNumber: string;
    pdfUrl: string;
  }): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending prescription with PDF:', params);

    // Template: prescription_ready_pdf (4 variables)
    const variables = [
      params.patientName,           // {{1}}
      params.doctorName,            // {{2}}
      params.prescriptionNumber,    // {{3}}
      params.pdfUrl                 // {{4}}
    ];

    return this.sendWhatsAppTemplate({
      to: params.patientPhone,
      template: 'prescription_ready_ddo',
      variables
    });
  }

  /**
   * Send lab report ready notification with PDF download link
   * Template: lab_report_ready_pdf
   * Variables: {{1}}=patient_name, {{2}}=report_type, {{3}}=report_number, {{4}}=pdf_url
   */
  public async sendLabReportReadyWithPDF(params: {
    patientName: string;
    patientPhone: string;
    reportType: string;
    reportNumber: string;
    pdfUrl: string;
  }): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending lab report with PDF:', params);

    // Template: lab_report_ready_pdf (4 variables)
    const variables = [
      params.patientName,           // {{1}}
      params.reportType,            // {{2}}
      params.reportNumber,          // {{3}}
      params.pdfUrl                 // {{4}}
    ];

    return this.sendWhatsAppTemplate({
      to: params.patientPhone,
      template: 'lab_report_ready_ddo',
      variables
    });
  }

  /**
   * Send surgery pre-op instructions with PDF download link
   * Template: surgery_pre_op_instructions_pdf
   * Variables: {{1}}=patient_name, {{2}}=surgery_type, {{3}}=surgery_date, {{4}}=surgeon_name, {{5}}=pdf_url
   */
  public async sendSurgeryPreOpInstructions(params: {
    patientName: string;
    patientPhone: string;
    surgeryType: string;
    surgeryDate: string;
    surgeonName: string;
    pdfUrl: string;
  }): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending surgery pre-op instructions with PDF:', params);

    // Template: surgery_pre_op_instructions_pdf (5 variables)
    const variables = [
      params.patientName,           // {{1}}
      params.surgeryType,           // {{2}}
      params.surgeryDate,           // {{3}}
      params.surgeonName,           // {{4}}
      params.pdfUrl                 // {{5}}
    ];

    return this.sendWhatsAppTemplate({
      to: params.patientPhone,
      template: 'surgery_pre_op_instructions_pdf',
      variables
    });
  }

  /**
   * Send emergency location alert (using provided template)
   */
  public async sendEmergencyLocationAlert(
    phone: string,
    victimLocation: string,
    nearbyHospital: string,
    contactPhone: string
  ): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending emergency location alert:', {
      phone,
      victimLocation,
      nearbyHospital,
      contactPhone
    });

    return this.sendWhatsAppTemplate({
      to: phone,
      template: 'emergency_location_alert',
      variables: [victimLocation, nearbyHospital, contactPhone]
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Test API connection
   */
  public async testConnection(): Promise<WhatsAppServiceResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key not configured'
      };
    }

    try {
      // Send a test request to verify API connectivity
      const response = await this.axiosInstance.get('/health', {
        timeout: 5000
      });

      return {
        success: true,
        messageId: 'connection_test_passed'
      };
    } catch (error) {
      const errorMsg = error instanceof AxiosError
        ? error.response?.data?.message || error.message
        : 'Connection test failed';

      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Send consultation summary with SOAP notes and prescription
   * Template: consultation_summary_ddo
   * Variables: [patient_name, doctor_name, consultation_date, diagnosis, medications, follow_up, hospital_name, phone]
   */
  public async sendConsultationSummary(
    patientName: string,
    patientPhone: string,
    doctorName: string,
    consultationDate: string,
    diagnosis: string,
    medications: string,
    followUp: string,
    hospitalName: string,
    hospitalPhone: string
  ): Promise<WhatsAppServiceResponse> {
    return this.sendWhatsAppTemplate({
      to: patientPhone,
      template: 'consultation_summary_ddo',
      variables: [
        patientName,
        doctorName,
        consultationDate,
        diagnosis,
        medications,
        followUp,
        hospitalName,
        hospitalPhone
      ]
    });
  }

  /**
   * Send video consultation reminder 15 minutes before appointment
   * Includes meeting link for patient to join
   */
  public async sendVideoConsultationReminder15min(
    phoneNumber: string,
    patientName: string,
    doctorName: string,
    date: string,
    time: string,
    meetingLink: string,
    clinicName: string = 'AI Surgeon Pilot'
  ): Promise<WhatsAppServiceResponse> {
    console.log('[WhatsApp Service] Sending 15-min video consultation reminder:', {
      phoneNumber,
      patientName,
      doctorName,
      date,
      time,
      meetingLink,
      clinicName
    });

    // Template variables for video_consultation_15min_reminder
    // "Hi {{1}}, Your video consultation with Dr. {{2}} starts in 15 minutes!
    // Date: {{3}} Time: {{4}} Click here to join: {{5}} - {{6}}"
    const variables = [
      patientName,    // {{1}} - Patient name
      doctorName,     // {{2}} - Doctor name
      date,           // {{3}} - Date
      time,           // {{4}} - Time
      meetingLink,    // {{5}} - Meeting link
      clinicName      // {{6}} - Clinic name
    ];

    return this.sendWhatsAppTemplate({
      to: phoneNumber,
      template: 'video_consultation_15min_reminder',
      variables: variables.filter(v => v !== '')
    });
  }

  /**
   * Get service configuration status
   */
  public getConfigStatus(): {
    apiKeyConfigured: boolean;
    phoneNumberConfigured: boolean;
    apiUrl: string;
  } {
    return {
      apiKeyConfigured: !!this.apiKey,
      phoneNumberConfigured: !!this.phoneNumber,
      apiUrl: this.apiUrl
    };
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const whatsappService = new WhatsAppService();
export default whatsappService;
