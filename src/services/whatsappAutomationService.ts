/**
 * WhatsApp Automation Service
 * Version: 1.3
 *
 * Service for sending WhatsApp messages using DoubleTick API
 * Handles educational content delivery, reminders, and patient follow-up
 */

import { supabase } from '@/integrations/supabase/client';

const DOUBLETICK_API_KEY = import.meta.env.VITE_DOUBLETICK_API_KEY || 'key_8sc9MP6JpQ';
const DOUBLETICK_API_URL = 'https://api.doubletick.io/whatsapp/message/sendMessage';
const DOUBLETICK_TEMPLATE_NAME = import.meta.env.VITE_DOUBLETICK_TEMPLATE_NAME || 'emergency_location_alert';

export interface WhatsAppMessage {
  to: string; // Phone number with country code (e.g., +919876543210)
  templateName?: string;
  bodyValues?: string[];
  filename?: string;
  caption?: string;
  text?: string;
  fileUrl?: string;
}

export interface SendContentParams {
  patientId: string;
  visitId?: string;
  contentId: string;
  phoneNumber: string;
  patientName: string;
}

export interface SendReminderParams {
  patientId: string;
  visitId?: string;
  phoneNumber: string;
  patientName: string;
  reminderText: string;
}

/**
 * Send a WhatsApp message using DoubleTick API
 */
export const sendWhatsAppMessage = async (message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const response = await fetch(DOUBLETICK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOUBLETICK_API_KEY}`,
      },
      body: JSON.stringify({
        to: message.to,
        template_name: message.templateName || DOUBLETICK_TEMPLATE_NAME,
        body_values: message.bodyValues || [],
        filename: message.filename,
        caption: message.caption,
        text: message.text,
        file_url: message.fileUrl,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        messageId: data.message_id || data.messageId,
      };
    } else {
      return {
        success: false,
        error: data.error || data.message || 'Failed to send WhatsApp message',
      };
    }
  } catch (error: any) {
    console.error('WhatsApp API Error:', error);
    return {
      success: false,
      error: error.message || 'Network error while sending WhatsApp message',
    };
  }
};

/**
 * Send educational content to patient via WhatsApp
 */
export const sendEducationalContent = async (params: SendContentParams): Promise<{ success: boolean; logId?: string; error?: string }> => {
  try {
    // Fetch content details
    const { data: content, error: contentError } = await supabase
      .from('patient_education_content')
      .select('*')
      .eq('id', params.contentId)
      .single();

    if (contentError) throw contentError;
    if (!content) throw new Error('Content not found');

    // Prepare message
    const messageText = `Hi ${params.patientName},\n\n${content.title}\n\n${content.description || ''}\n\n${content.content_url || content.content_text || ''}`;

    // Send WhatsApp message
    const result = await sendWhatsAppMessage({
      to: params.phoneNumber,
      text: messageText,
      fileUrl: content.content_url || undefined,
      caption: content.title,
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    // Log to database
    const { data: log, error: logError } = await supabase
      .from('whatsapp_automation_log')
      .insert([{
        patient_id: params.patientId,
        visit_id: params.visitId || null,
        content_id: params.contentId,
        message_type: 'educational_content',
        phone_number: params.phoneNumber,
        message_text: messageText,
        media_url: content.content_url,
        delivery_status: 'sent',
        doubletick_message_id: result.messageId,
        triggered_by: 'manual',
      }])
      .select()
      .single();

    if (logError) throw logError;

    // Update tracking
    await supabase
      .from('patient_education_tracking')
      .insert([{
        patient_id: params.patientId,
        content_id: params.contentId,
        sent_via: 'whatsapp',
        sent_by: 'system',
      }]);

    // Update decision journey
    await updateDecisionJourneyMetrics(params.patientId, params.visitId);

    return {
      success: true,
      logId: log.id,
    };
  } catch (error: any) {
    console.error('Send Educational Content Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send educational content',
    };
  }
};

/**
 * Send reminder to patient via WhatsApp
 */
export const sendReminder = async (params: SendReminderParams): Promise<{ success: boolean; logId?: string; error?: string }> => {
  try {
    const messageText = `Hi ${params.patientName},\n\n${params.reminderText}`;

    // Send WhatsApp message
    const result = await sendWhatsAppMessage({
      to: params.phoneNumber,
      text: messageText,
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    // Log to database
    const { data: log, error: logError } = await supabase
      .from('whatsapp_automation_log')
      .insert([{
        patient_id: params.patientId,
        visit_id: params.visitId || null,
        message_type: 'reminder',
        phone_number: params.phoneNumber,
        message_text: messageText,
        delivery_status: 'sent',
        doubletick_message_id: result.messageId,
        triggered_by: 'manual',
      }])
      .select()
      .single();

    if (logError) throw logError;

    // Update decision journey
    await updateDecisionJourneyMetrics(params.patientId, params.visitId);

    return {
      success: true,
      logId: log.id,
    };
  } catch (error: any) {
    console.error('Send Reminder Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send reminder',
    };
  }
};

/**
 * Update decision journey metrics after sending a message
 */
const updateDecisionJourneyMetrics = async (patientId: string, visitId?: string): Promise<void> => {
  try {
    if (!visitId) return;

    const { data: journey } = await supabase
      .from('patient_decision_journey')
      .select('*')
      .eq('patient_id', patientId)
      .eq('visit_id', visitId)
      .single();

    if (journey) {
      await supabase
        .from('patient_decision_journey')
        .update({
          total_whatsapp_messages: journey.total_whatsapp_messages + 1,
          last_contact_date: new Date().toISOString(),
          last_contact_method: 'whatsapp',
        })
        .eq('id', journey.id);
    }
  } catch (error) {
    console.error('Update Decision Journey Error:', error);
  }
};

/**
 * Send bulk WhatsApp messages to multiple patients
 */
export const sendBulkMessages = async (
  patients: Array<{ id: string; phone: string; name: string }>,
  messageText: string
): Promise<{ success: number; failed: number; results: Array<{ patientId: string; success: boolean; error?: string }> }> => {
  const results = [];
  let successCount = 0;
  let failedCount = 0;

  for (const patient of patients) {
    const result = await sendWhatsAppMessage({
      to: patient.phone,
      text: messageText.replace('{patient_name}', patient.name),
    });

    if (result.success) {
      successCount++;
      // Log to database
      await supabase
        .from('whatsapp_automation_log')
        .insert([{
          patient_id: patient.id,
          message_type: 'follow_up',
          phone_number: patient.phone,
          message_text: messageText.replace('{patient_name}', patient.name),
          delivery_status: 'sent',
          doubletick_message_id: result.messageId,
          triggered_by: 'manual',
        }]);
    } else {
      failedCount++;
    }

    results.push({
      patientId: patient.id,
      success: result.success,
      error: result.error,
    });
  }

  return {
    success: successCount,
    failed: failedCount,
    results,
  };
};

/**
 * Get WhatsApp message logs for a patient
 */
export const getPatientWhatsAppLogs = async (patientId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('whatsapp_automation_log')
      .select('*')
      .eq('patient_id', patientId)
      .order('sent_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get WhatsApp Logs Error:', error);
    return [];
  }
};

/**
 * Update message delivery status (webhook handler)
 */
export const updateMessageStatus = async (
  messageId: string,
  status: 'delivered' | 'read' | 'failed',
  timestamp: string
): Promise<void> => {
  try {
    const updateData: any = { delivery_status: status };

    if (status === 'delivered') {
      updateData.delivery_timestamp = timestamp;
    } else if (status === 'read') {
      updateData.read_timestamp = timestamp;
      updateData.delivery_status = 'read';
    } else if (status === 'failed') {
      updateData.failed_reason = 'Message delivery failed';
    }

    await supabase
      .from('whatsapp_automation_log')
      .update(updateData)
      .eq('doubletick_message_id', messageId);
  } catch (error) {
    console.error('Update Message Status Error:', error);
  }
};

export default {
  sendWhatsAppMessage,
  sendEducationalContent,
  sendReminder,
  sendBulkMessages,
  getPatientWhatsAppLogs,
  updateMessageStatus,
};
