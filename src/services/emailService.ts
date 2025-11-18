/**
 * Email Service
 * Handles all email notifications using Resend API
 *
 * Setup:
 * 1. Sign up at https://resend.com
 * 2. Get API key
 * 3. Add VITE_RESEND_API_KEY to .env
 */

import { supabase } from '@/integrations/supabase/client';

interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  reply_to?: string;
  cc?: string[];
  bcc?: string[];
}

interface NotificationData {
  tenant_id: string;
  patient_id?: string;
  user_id?: string;
  appointment_id?: string;
  visit_id?: string;
  type: 'email';
  channel: 'appointment' | 'prescription' | 'billing' | 'general' | 'emergency';
  subject: string;
  message: string;
  html_content: string;
  recipient_email: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private apiUrl: string;

  constructor() {
    // Resend API configuration via proxy server (to avoid CORS)
    this.apiKey = import.meta.env.VITE_RESEND_API_KEY || '';
    // Use Resend's test domain for development (onboarding@resend.dev)
    // Switch to your verified domain in production: noreply@aisurgeonpilot.com
    this.fromEmail = import.meta.env.VITE_FROM_EMAIL || 'onboarding@resend.dev';
    // Use local proxy server to bypass CORS
    this.apiUrl = 'http://localhost:3001/api/send-email';
  }

  /**
   * Send email via Resend API
   */
  private async sendViaResend(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.apiKey) {
      console.warn('Resend API key not configured. Email sending disabled.');
      return { success: false, error: 'API key not configured' };
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: emailData.from || this.fromEmail,
          to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
          subject: emailData.subject,
          html: emailData.html,
          reply_to: emailData.reply_to,
          cc: emailData.cc,
          bcc: emailData.bcc
        })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, messageId: data.id };
      } else {
        return { success: false, error: data.message || 'Email sending failed' };
      }
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Log notification to database
   */
  private async logNotification(notificationData: NotificationData, status: string, externalId?: string, errorMessage?: string) {
    try {
      await supabase.from('notifications').insert([
        {
          ...notificationData,
          status,
          external_id: externalId,
          error_message: errorMessage,
          sent_at: status === 'sent' ? new Date().toISOString() : null
        }
      ]);
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmation(data: {
    tenant_id: string;
    patient_id: string;
    appointment_id: string;
    patient_name: string;
    patient_email: string;
    appointment_date: string;
    appointment_time: string;
    doctor_name: string;
    hospital_name: string;
    hospital_address?: string;
    consultation_mode: 'in_person' | 'video' | 'phone';
    meeting_link?: string;
  }): Promise<boolean> {
    const subject = `Appointment Confirmation - ${data.hospital_name}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #666; }
          .detail-value { color: #333; }
          .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Confirmed</h1>
          </div>
          <div class="content">
            <p>Dear ${data.patient_name},</p>
            <p>Your appointment has been confirmed. Here are the details:</p>

            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Hospital:</span>
                <span class="detail-value">${data.hospital_name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Doctor:</span>
                <span class="detail-value">${data.doctor_name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${data.appointment_date}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${data.appointment_time}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Consultation Mode:</span>
                <span class="detail-value">${data.consultation_mode === 'in_person' ? 'In-Person' : data.consultation_mode === 'video' ? 'Video Call' : 'Phone Call'}</span>
              </div>
              ${data.hospital_address ? `
              <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span class="detail-value">${data.hospital_address}</span>
              </div>
              ` : ''}
            </div>

            ${data.consultation_mode === 'video' && data.meeting_link ? `
              <p><strong>Video Consultation Link:</strong></p>
              <a href="${data.meeting_link}" class="button">Join Video Call</a>
              <p style="font-size: 12px; color: #666;">Click the button above at your appointment time to join the video consultation.</p>
            ` : data.consultation_mode === 'in_person' ? `
              <p><strong>Important:</strong> Please arrive 15 minutes before your scheduled appointment time.</p>
            ` : ''}

            <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>

            <p>Thank you for choosing ${data.hospital_name}.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ${data.hospital_name}. Please do not reply to this email.</p>
            <p>&copy; 2025 AI Surgeon Pilot. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await this.sendViaResend({
      to: data.patient_email,
      subject,
      html
    });

    await this.logNotification(
      {
        tenant_id: data.tenant_id,
        patient_id: data.patient_id,
        appointment_id: data.appointment_id,
        type: 'email',
        channel: 'appointment',
        subject,
        message: `Appointment confirmation for ${data.appointment_date} at ${data.appointment_time}`,
        html_content: html,
        recipient_email: data.patient_email,
        priority: 'normal'
      },
      result.success ? 'sent' : 'failed',
      result.messageId,
      result.error
    );

    return result.success;
  }

  /**
   * Send prescription email
   */
  async sendPrescription(data: {
    tenant_id: string;
    patient_id: string;
    visit_id: string;
    patient_name: string;
    patient_email: string;
    doctor_name: string;
    hospital_name: string;
    prescription_date: string;
    medications: Array<{
      medicine_name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
    general_instructions?: string;
    pdf_url?: string;
  }): Promise<boolean> {
    const subject = `Your Prescription - ${data.hospital_name}`;

    const medicationsList = data.medications.map(med => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${med.medicine_name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${med.dosage}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${med.frequency}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${med.duration}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
          th { background: #f0f0f0; padding: 12px; text-align: left; font-weight: bold; }
          td { padding: 10px; }
          .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Prescription</h1>
          </div>
          <div class="content">
            <p>Dear ${data.patient_name},</p>
            <p>Here is your prescription from Dr. ${data.doctor_name} dated ${data.prescription_date}.</p>

            <h3>Medications:</h3>
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                ${medicationsList}
              </tbody>
            </table>

            ${data.general_instructions ? `
              <h3>General Instructions:</h3>
              <p>${data.general_instructions}</p>
            ` : ''}

            ${data.pdf_url ? `
              <p><a href="${data.pdf_url}" class="button">Download Prescription PDF</a></p>
            ` : ''}

            <div class="warning">
              <strong>Important:</strong>
              <ul>
                <li>Take medications as prescribed</li>
                <li>Do not stop medications without consulting your doctor</li>
                <li>Contact your doctor if you experience any side effects</li>
                <li>Keep this prescription for your records</li>
              </ul>
            </div>

            <p>If you have any questions, please contact ${data.hospital_name}.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ${data.hospital_name}. Please do not reply to this email.</p>
            <p>&copy; 2025 AI Surgeon Pilot. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await this.sendViaResend({
      to: data.patient_email,
      subject,
      html
    });

    await this.logNotification(
      {
        tenant_id: data.tenant_id,
        patient_id: data.patient_id,
        visit_id: data.visit_id,
        type: 'email',
        channel: 'prescription',
        subject,
        message: `Prescription from Dr. ${data.doctor_name}`,
        html_content: html,
        recipient_email: data.patient_email,
        priority: 'high'
      },
      result.success ? 'sent' : 'failed',
      result.messageId,
      result.error
    );

    return result.success;
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(data: {
    tenant_id: string;
    patient_id: string;
    appointment_id?: string;
    patient_name: string;
    patient_email: string;
    hospital_name: string;
    amount: number;
    transaction_id: string;
    payment_date: string;
    payment_method: string;
    receipt_url?: string;
  }): Promise<boolean> {
    const subject = `Payment Confirmation - ${data.hospital_name}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .amount { font-size: 36px; font-weight: bold; color: #059669; text-align: center; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Payment Successful</h1>
          </div>
          <div class="content">
            <div class="success">
              <strong>Your payment has been received successfully!</strong>
            </div>

            <p>Dear ${data.patient_name},</p>
            <p>Thank you for your payment. Here are the transaction details:</p>

            <div class="amount">₹${data.amount.toFixed(2)}</div>

            <div class="details">
              <div class="detail-row">
                <span style="font-weight: bold; color: #666;">Transaction ID:</span>
                <span>${data.transaction_id}</span>
              </div>
              <div class="detail-row">
                <span style="font-weight: bold; color: #666;">Payment Date:</span>
                <span>${data.payment_date}</span>
              </div>
              <div class="detail-row">
                <span style="font-weight: bold; color: #666;">Payment Method:</span>
                <span>${data.payment_method}</span>
              </div>
              <div class="detail-row">
                <span style="font-weight: bold; color: #666;">Hospital:</span>
                <span>${data.hospital_name}</span>
              </div>
            </div>

            ${data.receipt_url ? `
              <p style="text-align: center;"><a href="${data.receipt_url}" class="button">Download Receipt</a></p>
            ` : ''}

            <p>This payment receipt has been generated electronically and is valid without signature.</p>
            <p>If you have any questions regarding this payment, please contact us.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ${data.hospital_name}. Please do not reply to this email.</p>
            <p>&copy; 2025 AI Surgeon Pilot. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await this.sendViaResend({
      to: data.patient_email,
      subject,
      html
    });

    await this.logNotification(
      {
        tenant_id: data.tenant_id,
        patient_id: data.patient_id,
        appointment_id: data.appointment_id,
        type: 'email',
        channel: 'billing',
        subject,
        message: `Payment confirmation for ₹${data.amount}`,
        html_content: html,
        recipient_email: data.patient_email,
        priority: 'high'
      },
      result.success ? 'sent' : 'failed',
      result.messageId,
      result.error
    );

    return result.success;
  }

  /**
   * Send appointment cancellation email
   */
  async sendAppointmentCancellation(data: {
    tenant_id: string;
    patient_id: string;
    appointment_id: string;
    patient_name: string;
    patient_email: string;
    appointment_date: string;
    appointment_time: string;
    doctor_name: string;
    hospital_name: string;
    cancellation_reason: string;
    cancelled_by: 'patient' | 'doctor' | 'admin';
    refund_amount?: number;
  }): Promise<boolean> {
    const subject = `Appointment Cancelled - ${data.hospital_name}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
          .info-box { background: #e0f2fe; border: 1px solid #0ea5e9; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Appointment Cancelled</h1>
          </div>
          <div class="content">
            <p>Dear ${data.patient_name},</p>
            <p>Your appointment has been cancelled. Here are the details:</p>

            <div class="details">
              <div class="detail-row">
                <span style="font-weight: bold; color: #666;">Hospital:</span>
                <span>${data.hospital_name}</span>
              </div>
              <div class="detail-row">
                <span style="font-weight: bold; color: #666;">Doctor:</span>
                <span>${data.doctor_name}</span>
              </div>
              <div class="detail-row">
                <span style="font-weight: bold; color: #666;">Date:</span>
                <span>${data.appointment_date}</span>
              </div>
              <div class="detail-row">
                <span style="font-weight: bold; color: #666;">Time:</span>
                <span>${data.appointment_time}</span>
              </div>
              <div class="detail-row">
                <span style="font-weight: bold; color: #666;">Cancelled By:</span>
                <span>${data.cancelled_by === 'patient' ? 'You' : data.cancelled_by === 'doctor' ? 'Doctor' : 'Hospital'}</span>
              </div>
              <div class="detail-row">
                <span style="font-weight: bold; color: #666;">Reason:</span>
                <span>${data.cancellation_reason}</span>
              </div>
            </div>

            ${data.refund_amount && data.refund_amount > 0 ? `
              <div class="info-box">
                <strong>Refund Information:</strong>
                <p>A refund of ₹${data.refund_amount} will be processed to your original payment method within 5-7 business days.</p>
              </div>
            ` : ''}

            <p>To book a new appointment, please visit our website or contact us.</p>

            <p style="text-align: center;">
              <a href="https://aisurgeonpilot.com/book-appointment" class="button">Book New Appointment</a>
            </p>

            <p>We apologize for any inconvenience caused.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ${data.hospital_name}. Please do not reply to this email.</p>
            <p>&copy; 2025 AI Surgeon Pilot. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await this.sendViaResend({
      to: data.patient_email,
      subject,
      html
    });

    await this.logNotification(
      {
        tenant_id: data.tenant_id,
        patient_id: data.patient_id,
        appointment_id: data.appointment_id,
        type: 'email',
        channel: 'appointment',
        subject,
        message: `Appointment cancelled for ${data.appointment_date} at ${data.appointment_time}`,
        html_content: html,
        recipient_email: data.patient_email,
        priority: 'high'
      },
      result.success ? 'sent' : 'failed',
      result.messageId,
      result.error
    );

    return result.success;
  }

  /**
   * Send doctor daily summary email
   */
  async sendDoctorDailySummary(data: {
    tenant_id: string;
    doctor_email: string;
    doctor_name: string;
    hospital_name: string;
    summary_date: string;
    appointments: Array<{
      time: string;
      patient_name: string;
      patient_age?: number;
      consultation_type: string;
      chief_complaint?: string;
      is_new_patient: boolean;
      appointment_id: string;
    }>;
    total_appointments: number;
  }): Promise<boolean> {
    const subject = `Your Schedule for ${data.summary_date} - ${data.hospital_name}`;

    const appointmentRows = data.appointments.map(apt => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${apt.time}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          ${apt.patient_name}${apt.patient_age ? `, ${apt.patient_age}Y` : ''}
          ${apt.is_new_patient ? ' <span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">NEW</span>' : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${apt.consultation_type}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${apt.chief_complaint || '-'}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .summary { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .count { font-size: 48px; font-weight: bold; color: #059669; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
          th { background: #f0f0f0; padding: 12px; text-align: left; font-weight: bold; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☀️ Good Morning, Dr. ${data.doctor_name}!</h1>
          </div>
          <div class="content">
            <p>Here's your schedule for <strong>${data.summary_date}</strong> at ${data.hospital_name}:</p>

            <div class="summary">
              <div class="count">${data.total_appointments}</div>
              <p style="font-size: 18px; color: #666;">Total Appointments</p>
            </div>

            ${data.appointments.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Patient</th>
                    <th>Type</th>
                    <th>Chief Complaint</th>
                  </tr>
                </thead>
                <tbody>
                  ${appointmentRows}
                </tbody>
              </table>
            ` : `
              <p style="text-align: center; color: #666; padding: 40px 0;">
                No appointments scheduled for today. Enjoy your day!
              </p>
            `}

            <p style="margin-top: 30px;">Have a productive day!</p>
          </div>
          <div class="footer">
            <p>This is an automated daily summary from ${data.hospital_name}.</p>
            <p>&copy; 2025 AI Surgeon Pilot. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await this.sendViaResend({
      to: data.doctor_email,
      subject,
      html
    });

    await this.logNotification(
      {
        tenant_id: data.tenant_id,
        type: 'email',
        channel: 'general',
        subject,
        message: `Daily summary for ${data.summary_date} - ${data.total_appointments} appointments`,
        html_content: html,
        recipient_email: data.doctor_email,
        priority: 'normal'
      },
      result.success ? 'sent' : 'failed',
      result.messageId,
      result.error
    );

    return result.success;
  }

  /**
   * Send welcome email to new patient
   */
  async sendPatientWelcomeEmail(data: {
    tenant_id: string;
    patient_id: string;
    patient_name: string;
    patient_email: string;
    hospital_name: string;
  }): Promise<boolean> {
    const subject = `Welcome to ${data.hospital_name}!`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .welcome-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
          .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .feature-item { padding: 15px 0; border-bottom: 1px solid #eee; }
          .feature-item:last-child { border-bottom: none; }
          .feature-icon { color: #059669; font-weight: bold; margin-right: 10px; }
          .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome Aboard!</h1>
            <p style="font-size: 18px; margin: 10px 0;">We're excited to have you with us</p>
          </div>
          <div class="content">
            <div class="welcome-box">
              <h2 style="color: #059669; margin-top: 0;">Dear ${data.patient_name},</h2>
              <p>Thank you for registering with ${data.hospital_name}. Your profile has been created successfully!</p>
              <p>We're committed to providing you with the best healthcare experience through our AI-powered platform.</p>
            </div>

            <div class="features">
              <h3 style="margin-top: 0; color: #333;">What You Can Do:</h3>

              <div class="feature-item">
                <span class="feature-icon">📅</span>
                <strong>Book Appointments</strong> - Schedule consultations with our expert doctors
              </div>

              <div class="feature-item">
                <span class="feature-icon">💻</span>
                <strong>Video Consultations</strong> - Connect with doctors from anywhere
              </div>

              <div class="feature-item">
                <span class="feature-icon">📋</span>
                <strong>Medical Records</strong> - Access your prescriptions and reports anytime
              </div>

              <div class="feature-item">
                <span class="feature-icon">🔔</span>
                <strong>Instant Notifications</strong> - Get updates via email and WhatsApp
              </div>

              <div class="feature-item">
                <span class="feature-icon">💊</span>
                <strong>Digital Prescriptions</strong> - Receive and download prescriptions as PDFs
              </div>
            </div>

            <p style="text-align: center; margin: 30px 0;">
              <a href="https://aisurgeonpilot.com/patient-dashboard" class="button">Go to Dashboard</a>
            </p>

            <p><strong>Need Help?</strong></p>
            <p>Our support team is here for you 24/7. Contact us anytime at ${data.hospital_name}.</p>

            <p>Thank you for choosing ${data.hospital_name}!</p>
          </div>
          <div class="footer">
            <p>This is an automated welcome message from ${data.hospital_name}.</p>
            <p>&copy; 2025 AI Surgeon Pilot. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await this.sendViaResend({
      to: data.patient_email,
      subject,
      html
    });

    await this.logNotification(
      {
        tenant_id: data.tenant_id,
        patient_id: data.patient_id,
        type: 'email',
        channel: 'general',
        subject,
        message: `Welcome email for new patient registration`,
        html_content: html,
        recipient_email: data.patient_email,
        priority: 'normal'
      },
      result.success ? 'sent' : 'failed',
      result.messageId,
      result.error
    );

    return result.success;
  }

  /**
   * Send welcome email to new doctor
   */
  async sendDoctorWelcomeEmail(data: {
    tenant_id: string;
    doctor_id: string;
    doctor_name: string;
    doctor_email: string;
    hospital_name: string;
    specialties?: string[];
  }): Promise<boolean> {
    const subject = `Welcome to ${data.hospital_name} - Doctor Portal`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .welcome-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
          .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .feature-item { padding: 15px 0; border-bottom: 1px solid #eee; }
          .feature-item:last-child { border-bottom: none; }
          .feature-icon { color: #059669; font-weight: bold; margin-right: 10px; }
          .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info-box { background: #e0f2fe; border: 1px solid #0ea5e9; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to the Team!</h1>
            <p style="font-size: 18px; margin: 10px 0;">Your doctor profile is ready</p>
          </div>
          <div class="content">
            <div class="welcome-box">
              <h2 style="color: #059669; margin-top: 0;">Dear ${data.doctor_name},</h2>
              <p>Welcome to ${data.hospital_name}! Your doctor profile has been successfully created and is now active on our platform.</p>
              ${data.specialties && data.specialties.length > 0 ? `
                <p><strong>Your Specialties:</strong> ${data.specialties.join(', ')}</p>
              ` : ''}
              <p>You can now start managing your appointments and consultations through our AI-powered platform.</p>
            </div>

            <div class="features">
              <h3 style="margin-top: 0; color: #333;">Platform Features:</h3>

              <div class="feature-item">
                <span class="feature-icon">📅</span>
                <strong>Appointment Management</strong> - View and manage all your appointments in one place
              </div>

              <div class="feature-item">
                <span class="feature-icon">💻</span>
                <strong>Video Consultation Setup</strong> - Configure your Zoom/Google Meet links
              </div>

              <div class="feature-item">
                <span class="feature-icon">📋</span>
                <strong>Digital Prescriptions</strong> - Create and send prescriptions as PDFs
              </div>

              <div class="feature-item">
                <span class="feature-icon">📊</span>
                <strong>Patient Records</strong> - Access comprehensive patient histories
              </div>

              <div class="feature-item">
                <span class="feature-icon">🔔</span>
                <strong>Real-Time Notifications</strong> - Get instant updates on new bookings
              </div>

              <div class="feature-item">
                <span class="feature-icon">⚙️</span>
                <strong>Profile Customization</strong> - Set your availability and consultation fees
              </div>
            </div>

            <div class="info-box">
              <strong>Next Steps:</strong>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li>Complete your profile with bio and qualifications</li>
                <li>Set up your video consultation meeting link</li>
                <li>Configure your availability schedule</li>
                <li>Start accepting patient appointments</li>
              </ol>
            </div>

            <p style="text-align: center; margin: 30px 0;">
              <a href="https://aisurgeonpilot.com/doctor/dashboard" class="button">Access Dashboard</a>
            </p>

            <p><strong>Need Assistance?</strong></p>
            <p>Our admin team is here to help you get started. If you have any questions or need technical support, please don't hesitate to reach out.</p>

            <p>We're thrilled to have you on board and look forward to supporting your practice!</p>
          </div>
          <div class="footer">
            <p>This is an automated welcome message from ${data.hospital_name}.</p>
            <p>&copy; 2025 AI Surgeon Pilot. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await this.sendViaResend({
      to: data.doctor_email,
      subject,
      html
    });

    await this.logNotification(
      {
        tenant_id: data.tenant_id,
        type: 'email',
        channel: 'general',
        subject,
        message: `Welcome email for new doctor profile`,
        html_content: html,
        recipient_email: data.doctor_email,
        priority: 'normal'
      },
      result.success ? 'sent' : 'failed',
      result.messageId,
      result.error
    );

    return result.success;
  }

  /**
   * Send OTP email for patient login
   */
  async sendOTP(data: {
    tenant_id: string;
    patient_email: string;
    otp: string;
    patient_name?: string;
  }): Promise<boolean> {
    const subject = 'Your Login OTP - AI Surgeon Pilot';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; text-align: center; }
          .otp { font-size: 48px; font-weight: bold; color: #059669; letter-spacing: 10px; margin: 30px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: left; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Login Verification</h1>
          </div>
          <div class="content">
            ${data.patient_name ? `<p>Dear ${data.patient_name},</p>` : '<p>Hello,</p>'}
            <p>Your One-Time Password (OTP) for login is:</p>

            <div class="otp">${data.otp}</div>

            <p>This OTP is valid for 10 minutes.</p>

            <div class="warning">
              <strong>Security Notice:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Do not share this OTP with anyone</li>
                <li>Our staff will never ask for your OTP</li>
                <li>If you didn't request this OTP, please ignore this email</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message from AI Surgeon Pilot. Please do not reply to this email.</p>
            <p>&copy; 2025 AI Surgeon Pilot. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await this.sendViaResend({
      to: data.patient_email,
      subject,
      html
    });

    await this.logNotification(
      {
        tenant_id: data.tenant_id,
        type: 'email',
        channel: 'general',
        subject,
        message: `OTP for login: ${data.otp}`,
        html_content: html,
        recipient_email: data.patient_email,
        priority: 'high'
      },
      result.success ? 'sent' : 'failed',
      result.messageId,
      result.error
    );

    return result.success;
  }

  /**
   * Send consultation summary email with SOAP notes and prescription
   */
  async sendConsultationSummary(data: {
    tenant_id: string;
    patient_id: string;
    appointment_id: string;
    patient_name: string;
    patient_email: string;
    doctor_name: string;
    hospital_name: string;
    consultation_date: string;
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
    follow_up: string;
    additional_notes: string;
  }): Promise<boolean> {
    const subject = `Consultation Summary - ${data.hospital_name}`;

    const medicationsList = data.medications.length > 0 ? data.medications.map(med => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${med.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${med.dosage}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${med.frequency}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${med.duration}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${med.instructions || '-'}</td>
      </tr>
    `).join('') : '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #999;">No medications prescribed</td></tr>';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .section { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #059669; }
          .section-title { font-size: 18px; font-weight: bold; color: #059669; margin-bottom: 10px; }
          .section-content { color: #555; line-height: 1.8; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
          th { background: #059669; color: white; padding: 12px; text-align: left; font-weight: bold; }
          td { padding: 10px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
          .info-box { background: #e8f5e9; border: 1px solid #4caf50; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Consultation Summary</h1>
            <p style="margin: 5px 0; opacity: 0.9;">${data.doctor_name}</p>
            <p style="margin: 5px 0; font-size: 14px; opacity: 0.9;">${data.consultation_date}</p>
          </div>
          <div class="content">
            <p>Dear ${data.patient_name},</p>
            <p>Thank you for your consultation. Here is a detailed summary of your visit:</p>

            <div class="section">
              <div class="section-title">📋 Subjective (Your Account)</div>
              <div class="section-content">${data.subjective}</div>
            </div>

            <div class="section">
              <div class="section-title">🔬 Objective (Clinical Findings)</div>
              <div class="section-content">${data.objective}</div>
            </div>

            <div class="section">
              <div class="section-title">🩺 Assessment (Diagnosis)</div>
              <div class="section-content">${data.assessment}</div>
            </div>

            <div class="section">
              <div class="section-title">✅ Plan (Treatment)</div>
              <div class="section-content">${data.plan}</div>
            </div>

            <h3 style="color: #059669; margin-top: 30px;">💊 Prescription</h3>
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Instructions</th>
                </tr>
              </thead>
              <tbody>
                ${medicationsList}
              </tbody>
            </table>

            <div class="info-box">
              <strong>📅 Follow-up Instructions:</strong>
              <p style="margin: 10px 0;">${data.follow_up}</p>
            </div>

            ${data.additional_notes !== 'N/A' ? `
              <div class="section">
                <div class="section-title">📝 Additional Notes</div>
                <div class="section-content">${data.additional_notes}</div>
              </div>
            ` : ''}

            <div class="info-box" style="background: #fff3cd; border-color: #ffc107;">
              <strong>⚠️ Important Reminders:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Take all medications as prescribed</li>
                <li>Contact us immediately if you experience any concerning symptoms</li>
                <li>Keep this summary for your medical records</li>
                <li>Follow the prescribed follow-up schedule</li>
              </ul>
            </div>

            <p>If you have any questions or concerns, please don't hesitate to contact ${data.hospital_name}.</p>

            <p style="margin-top: 30px;">Best wishes for your health,<br><strong>${data.doctor_name}</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message from ${data.hospital_name}. Please do not reply to this email.</p>
            <p>&copy; 2025 AI Surgeon Pilot. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await this.sendViaResend({
      to: data.patient_email,
      subject,
      html
    });

    await this.logNotification(
      {
        tenant_id: data.tenant_id,
        patient_id: data.patient_id,
        appointment_id: data.appointment_id,
        type: 'email',
        channel: 'prescription',
        subject,
        message: `Consultation summary from ${data.doctor_name}`,
        html_content: html,
        recipient_email: data.patient_email,
        priority: 'high'
      },
      result.success ? 'sent' : 'failed',
      result.messageId,
      result.error
    );

    return result.success;
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
