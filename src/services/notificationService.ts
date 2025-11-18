/**
 * Unified Notification Service
 * Handles both Email and WhatsApp notifications
 * Sends to appropriate channels based on notification type
 */

import { emailService } from './emailService';
import { whatsappService, AppointmentDetails } from './whatsappService';

export interface DualNotificationResult {
  email: {
    sent: boolean;
    messageId?: string;
    error?: string;
  };
  whatsapp: {
    sent: boolean;
    messageId?: string;
    error?: string;
  };
}

class NotificationService {
  /**
   * Send appointment confirmation via both Email and WhatsApp
   */
  async sendAppointmentConfirmation(data: {
    // Common fields
    tenant_id: string;
    patient_id: string;
    appointment_id: string;
    patient_name: string;
    patient_email: string;
    patient_phone: string;
    patient_age?: number;
    patient_gender?: string;
    doctor_name: string;
    doctor_phone?: string;
    appointment_date: string; // Formatted: "15 Nov 2025"
    appointment_time: string; // Formatted: "10:30 AM"
    consultation_type: 'in-person' | 'tele-consult' | 'home-visit';
    appointment_date_raw?: string; // ISO format for email

    // Clinic/Hospital info
    hospital_name: string;
    hospital_address?: string;
    hospital_city?: string;
    hospital_state?: string;
    hospital_pincode?: string;
    hospital_phone?: string;
    hospital_latitude?: number;
    hospital_longitude?: number;

    // Additional info
    meeting_link?: string; // For video consultations
    chief_complaint?: string;
    is_new_patient?: boolean;
    amount?: number;
    instructions?: string;
    parking_info?: string;
  }): Promise<DualNotificationResult> {
    console.log('[Notification Service] Sending appointment confirmation to:', data.patient_name);

    // Prepare WhatsApp appointment details
    const whatsappAppointment: AppointmentDetails = {
      appointmentId: data.appointment_id,
      patientName: data.patient_name,
      patientPhone: data.patient_phone,
      patientAge: data.patient_age,
      patientGender: data.patient_gender,
      doctorName: data.doctor_name,
      doctorPhone: data.doctor_phone,
      appointmentDate: data.appointment_date,
      appointmentTime: data.appointment_time,
      consultationType: data.consultation_type,
      clinic: {
        name: data.hospital_name,
        address: data.hospital_address,
        city: data.hospital_city,
        state: data.hospital_state,
        pinCode: data.hospital_pincode,
        phone: data.hospital_phone,
        latitude: data.hospital_latitude,
        longitude: data.hospital_longitude
      },
      teleConsultLink: data.meeting_link,
      amount: data.amount,
      instructions: data.instructions,
      parkingInfo: data.parking_info,
      chiefComplaint: data.chief_complaint,
      isNewPatient: data.is_new_patient
    };

    // Send WhatsApp notification to PATIENT
    const whatsappPatient = await whatsappService.sendAppointmentConfirmationEnhanced(whatsappAppointment);

    // Send WhatsApp notification to DOCTOR (if doctor phone provided)
    if (data.doctor_phone) {
      await whatsappService.notifyDoctorNewAppointment(whatsappAppointment);
    }

    // Send Email notification
    const email = await emailService.sendAppointmentConfirmation({
      tenant_id: data.tenant_id,
      patient_id: data.patient_id,
      appointment_id: data.appointment_id,
      patient_name: data.patient_name,
      patient_email: data.patient_email,
      appointment_date: data.appointment_date,
      appointment_time: data.appointment_time,
      doctor_name: data.doctor_name,
      hospital_name: data.hospital_name,
      hospital_address: data.hospital_address
        ? `${data.hospital_address}, ${data.hospital_city || ''}, ${data.hospital_state || ''} ${data.hospital_pincode || ''}`.trim()
        : undefined,
      consultation_mode: data.consultation_type === 'in-person' ? 'in_person' : data.consultation_type === 'tele-consult' ? 'video' : 'phone',
      meeting_link: data.meeting_link
    });

    return {
      email: {
        sent: email,
        error: email ? undefined : 'Email sending failed'
      },
      whatsapp: {
        sent: whatsappPatient.success,
        messageId: whatsappPatient.messageId,
        error: whatsappPatient.error
      }
    };
  }

  /**
   * Send payment receipt via both Email and WhatsApp
   */
  async sendPaymentReceipt(data: {
    tenant_id: string;
    patient_id: string;
    appointment_id: string;
    patient_name: string;
    patient_email: string;
    patient_phone: string;
    doctor_name: string;
    hospital_name: string;
    amount: number;
    transaction_id: string;
    payment_date: string;
    payment_method: string;
    appointment_date: string;
    appointment_time: string;
    consultation_type: 'in-person' | 'tele-consult' | 'home-visit';
    hospital_phone?: string;
    receipt_url?: string;
  }): Promise<DualNotificationResult> {
    console.log('[Notification Service] Sending payment receipt to:', data.patient_name);

    // Prepare WhatsApp appointment details
    const whatsappAppointment: AppointmentDetails = {
      appointmentId: data.appointment_id,
      patientName: data.patient_name,
      patientPhone: data.patient_phone,
      doctorName: data.doctor_name,
      appointmentDate: data.appointment_date,
      appointmentTime: data.appointment_time,
      consultationType: data.consultation_type,
      clinic: {
        name: data.hospital_name,
        phone: data.hospital_phone
      },
      amount: data.amount
    };

    // Send WhatsApp notification
    const whatsapp = await whatsappService.sendPaymentReceiptEnhanced(whatsappAppointment);

    // Send Email notification
    const email = await emailService.sendPaymentConfirmation({
      tenant_id: data.tenant_id,
      patient_id: data.patient_id,
      appointment_id: data.appointment_id,
      patient_name: data.patient_name,
      patient_email: data.patient_email,
      hospital_name: data.hospital_name,
      amount: data.amount,
      transaction_id: data.transaction_id,
      payment_date: data.payment_date,
      payment_method: data.payment_method,
      receipt_url: data.receipt_url
    });

    return {
      email: {
        sent: email,
        error: email ? undefined : 'Email sending failed'
      },
      whatsapp: {
        sent: whatsapp.success,
        messageId: whatsapp.messageId,
        error: whatsapp.error
      }
    };
  }

  /**
   * Send cancellation notice via both Email and WhatsApp
   */
  async sendCancellationNotice(data: {
    tenant_id: string;
    patient_id: string;
    appointment_id: string;
    patient_name: string;
    patient_email: string;
    patient_phone: string;
    doctor_name: string;
    doctor_phone?: string;
    hospital_name: string;
    hospital_phone?: string;
    appointment_date: string;
    appointment_time: string;
    consultation_type: 'in-person' | 'tele-consult' | 'home-visit';
    cancellation_reason: string;
    cancelled_by: 'patient' | 'doctor' | 'admin';
    refund_amount?: number;
  }): Promise<DualNotificationResult> {
    console.log('[Notification Service] Sending cancellation notice to:', data.patient_name);

    // Prepare WhatsApp appointment details
    const whatsappAppointment: AppointmentDetails = {
      appointmentId: data.appointment_id,
      patientName: data.patient_name,
      patientPhone: data.patient_phone,
      doctorName: data.doctor_name,
      doctorPhone: data.doctor_phone,
      appointmentDate: data.appointment_date,
      appointmentTime: data.appointment_time,
      consultationType: data.consultation_type,
      clinic: {
        name: data.hospital_name,
        phone: data.hospital_phone
      }
    };

    // Send WhatsApp to PATIENT
    const whatsappPatient = await whatsappService.sendAppointmentCancelledEnhanced(
      whatsappAppointment,
      data.cancellation_reason
    );

    // Send WhatsApp to DOCTOR (if doctor phone provided)
    if (data.doctor_phone) {
      await whatsappService.notifyDoctorCancellation(whatsappAppointment, data.cancelled_by);
    }

    // Send Email notification
    const email = await emailService.sendAppointmentCancellation({
      tenant_id: data.tenant_id,
      patient_id: data.patient_id,
      appointment_id: data.appointment_id,
      patient_name: data.patient_name,
      patient_email: data.patient_email,
      appointment_date: data.appointment_date,
      appointment_time: data.appointment_time,
      doctor_name: data.doctor_name,
      hospital_name: data.hospital_name,
      cancellation_reason: data.cancellation_reason,
      cancelled_by: data.cancelled_by,
      refund_amount: data.refund_amount
    });

    return {
      email: {
        sent: email,
        error: email ? undefined : 'Email sending failed'
      },
      whatsapp: {
        sent: whatsappPatient.success,
        messageId: whatsappPatient.messageId,
        error: whatsappPatient.error
      }
    };
  }

  /**
   * Send doctor daily summary via Email and WhatsApp
   */
  async sendDoctorDailySummary(data: {
    tenant_id: string;
    doctor_name: string;
    doctor_email: string;
    doctor_phone: string;
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
  }): Promise<DualNotificationResult> {
    console.log('[Notification Service] Sending daily summary to:', data.doctor_name);

    // Send WhatsApp summary
    const whatsappAppointments = data.appointments.map(apt => ({
      time: apt.time,
      patientName: apt.patient_name,
      type: apt.consultation_type === 'in-person' ? 'In-Person' :
            apt.consultation_type === 'tele-consult' ? 'Tele-Consult' : 'Home Visit',
      isNew: apt.is_new_patient
    }));

    const whatsapp = await whatsappService.sendDoctorDailySummary(
      data.doctor_name.replace('Dr. ', ''),
      data.doctor_phone,
      data.hospital_name,
      data.summary_date,
      whatsappAppointments,
      data.total_appointments
    );

    // Send Email summary
    const email = await emailService.sendDoctorDailySummary({
      tenant_id: data.tenant_id,
      doctor_email: data.doctor_email,
      doctor_name: data.doctor_name.replace('Dr. ', ''),
      hospital_name: data.hospital_name,
      summary_date: data.summary_date,
      appointments: data.appointments,
      total_appointments: data.total_appointments
    });

    return {
      email: {
        sent: email,
        error: email ? undefined : 'Email sending failed'
      },
      whatsapp: {
        sent: whatsapp.success,
        messageId: whatsapp.messageId,
        error: whatsapp.error
      }
    };
  }

  /**
   * Send prescription (Email only with PDF attachment)
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
  }): Promise<{ email: { sent: boolean; error?: string } }> {
    console.log('[Notification Service] Sending prescription to:', data.patient_name);

    const email = await emailService.sendPrescription(data);

    return {
      email: {
        sent: email,
        error: email ? undefined : 'Email sending failed'
      }
    };
  }

  // ============================================================================
  // PDF-ENHANCED NOTIFICATION METHODS
  // ============================================================================

  /**
   * Send payment receipt with PDF link via WhatsApp
   */
  async sendPaymentReceiptWithPDF(data: {
    patient_name: string;
    patient_phone: string;
    amount: number;
    receipt_id: string;
    payment_date: string;
    payment_method: string;
    service_type: string;
    receipt_pdf_url: string;
    clinic_name: string;
  }): Promise<{ whatsapp: { sent: boolean; messageId?: string; error?: string } }> {
    console.log('[Notification Service] Sending payment receipt with PDF to:', data.patient_name);

    const whatsapp = await whatsappService.sendPaymentReceiptWithPDF({
      patientName: data.patient_name,
      patientPhone: data.patient_phone,
      amount: data.amount,
      receiptId: data.receipt_id,
      paymentDate: data.payment_date,
      paymentMethod: data.payment_method,
      serviceType: data.service_type,
      receiptPdfUrl: data.receipt_pdf_url,
      clinicName: data.clinic_name
    });

    return {
      whatsapp: {
        sent: whatsapp.success,
        messageId: whatsapp.messageId,
        error: whatsapp.error
      }
    };
  }

  /**
   * Send prescription with PDF link via WhatsApp
   */
  async sendPrescriptionWithPDF(data: {
    patient_name: string;
    patient_phone: string;
    doctor_name: string;
    prescription_date: string;
    diagnosis: string;
    prescription_id: string;
    prescription_pdf_url: string;
    advice: string;
    follow_up_date: string;
    clinic_name: string;
  }): Promise<{ whatsapp: { sent: boolean; messageId?: string; error?: string } }> {
    console.log('[Notification Service] Sending prescription with PDF to:', data.patient_name);

    const whatsapp = await whatsappService.sendPrescriptionReadyWithPDF({
      patientName: data.patient_name,
      patientPhone: data.patient_phone,
      doctorName: data.doctor_name,
      prescriptionDate: data.prescription_date,
      diagnosis: data.diagnosis,
      prescriptionId: data.prescription_id,
      prescriptionPdfUrl: data.prescription_pdf_url,
      advice: data.advice,
      followUpDate: data.follow_up_date,
      clinicName: data.clinic_name
    });

    return {
      whatsapp: {
        sent: whatsapp.success,
        messageId: whatsapp.messageId,
        error: whatsapp.error
      }
    };
  }

  /**
   * Send lab report with PDF link via WhatsApp
   */
  async sendLabReportWithPDF(data: {
    patient_name: string;
    patient_phone: string;
    test_name: string;
    test_date: string;
    report_id: string;
    report_pdf_url: string;
    doctor_name: string;
    clinic_name: string;
  }): Promise<{ whatsapp: { sent: boolean; messageId?: string; error?: string } }> {
    console.log('[Notification Service] Sending lab report with PDF to:', data.patient_name);

    const whatsapp = await whatsappService.sendLabReportReadyWithPDF({
      patientName: data.patient_name,
      patientPhone: data.patient_phone,
      testName: data.test_name,
      testDate: data.test_date,
      reportId: data.report_id,
      reportPdfUrl: data.report_pdf_url,
      doctorName: data.doctor_name,
      clinicName: data.clinic_name
    });

    return {
      whatsapp: {
        sent: whatsapp.success,
        messageId: whatsapp.messageId,
        error: whatsapp.error
      }
    };
  }

  /**
   * Send surgery pre-op instructions with PDF link via WhatsApp
   */
  async sendSurgeryPreOpInstructions(data: {
    patient_name: string;
    patient_phone: string;
    surgery_type: string;
    surgery_date: string;
    surgery_time: string;
    doctor_name: string;
    pre_op_instructions: string;
    checklist_items: string;
    instructions_pdf_url: string;
    clinic_name: string;
  }): Promise<{ whatsapp: { sent: boolean; messageId?: string; error?: string } }> {
    console.log('[Notification Service] Sending surgery pre-op instructions with PDF to:', data.patient_name);

    const whatsapp = await whatsappService.sendSurgeryPreOpInstructions({
      patientName: data.patient_name,
      patientPhone: data.patient_phone,
      surgeryType: data.surgery_type,
      surgeryDate: data.surgery_date,
      surgeryTime: data.surgery_time,
      doctorName: data.doctor_name,
      preOpInstructions: data.pre_op_instructions,
      checklistItems: data.checklist_items,
      instructionsPdfUrl: data.instructions_pdf_url,
      clinicName: data.clinic_name
    });

    return {
      whatsapp: {
        sent: whatsapp.success,
        messageId: whatsapp.messageId,
        error: whatsapp.error
      }
    };
  }

  /**
   * Send 24h reminder (WhatsApp only)
   */
  async send24hReminder(appointment: AppointmentDetails): Promise<{ whatsapp: { sent: boolean; messageId?: string; error?: string } }> {
    console.log('[Notification Service] Sending 24h reminder to:', appointment.patientName);

    const whatsapp = await whatsappService.sendAppointmentReminder24hEnhanced(appointment);

    return {
      whatsapp: {
        sent: whatsapp.success,
        messageId: whatsapp.messageId,
        error: whatsapp.error
      }
    };
  }

  /**
   * Send 3h reminder (WhatsApp only)
   */
  async send3hReminder(appointment: AppointmentDetails): Promise<{ whatsapp: { sent: boolean; messageId?: string; error?: string } }> {
    console.log('[Notification Service] Sending 3h reminder to:', appointment.patientName);

    const whatsapp = await whatsappService.sendAppointmentReminder3hEnhanced(appointment);

    return {
      whatsapp: {
        sent: whatsapp.success,
        messageId: whatsapp.messageId,
        error: whatsapp.error
      }
    };
  }

  /**
   * Notify doctor of patient arrival (WhatsApp only)
   */
  async notifyDoctorPatientArrived(appointment: AppointmentDetails): Promise<{ whatsapp: { sent: boolean; messageId?: string; error?: string } }> {
    console.log('[Notification Service] Notifying doctor of patient arrival');

    const whatsapp = await whatsappService.notifyDoctorPatientArrived(appointment);

    return {
      whatsapp: {
        sent: whatsapp.success,
        messageId: whatsapp.messageId,
        error: whatsapp.error
      }
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
