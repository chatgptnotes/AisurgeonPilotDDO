
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const DOUBLETICK_API_KEY = process.env.VITE_DOUBLETICK_API_KEY;
const DOUBLETICK_API_URL = 'https://api.doubletick.io/whatsapp/message/sendMessage';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[CRON] Missing Supabase credentials. Cron jobs disabled.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Send WhatsApp via DoubleTick (Backend Version)
 */
async function sendWhatsAppTemplate(to, template, variables) {
    if (!DOUBLETICK_API_KEY) {
        console.error('[CRON] Missing DoubleTick API Key');
        return false;
    }

    try {
        const response = await fetch(DOUBLETICK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DOUBLETICK_API_KEY}`
            },
            body: JSON.stringify({
                to: to,
                template_name: template,
                body_values: variables
            })
        });

        const data = await response.json();
        return response.ok;
    } catch (error) {
        console.error('[CRON] WhatsApp Send Error:', error);
        return false;
    }
}

/**
 * Check for video appointments starting in 15 minutes
 */
async function checkVideoConsultationReminders() {
    console.log('[CRON] Checking for upcoming video consultations...');

    const now = new Date();
    const targetTimeStart = new Date(now.getTime() + 14 * 60000); // Now + 14 mins
    const targetTimeEnd = new Date(now.getTime() + 16 * 60000);   // Now + 16 mins

    try {
        // 1. Get confirmed video appointments starting in the target window
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select(`
        id,
        start_at,
        patient_id,
        doctor_id,
        patients (first_name, last_name, phone),
        doctors (full_name)
      `)
            .eq('mode', 'video')
            .eq('status', 'confirmed')
            .gte('start_at', targetTimeStart.toISOString())
            .lte('start_at', targetTimeEnd.toISOString());

        if (error) throw error;

        if (!appointments || appointments.length === 0) {
            // No matching appointments
            return;
        }

        console.log(`[CRON] Found ${appointments.length} appointments starting in ~15 mins.`);

        for (const apt of appointments) {
            // 2. Check if we already sent a reminder
            const { data: existingLog } = await supabase
                .from('whatsapp_automation_log')
                .select('id')
                .eq('appointment_id', apt.id)
                .eq('message_type', 'video_15min_reminder')
                .single();

            if (existingLog) {
                console.log(`[CRON] Reminder already sent for appointment ${apt.id}`);
                continue;
            }

            const patient = apt.patients;
            const doctor = apt.doctors;
            if (!patient || !patient.phone) {
                console.log(`[CRON] No phone for patient in appointment ${apt.id}`);
                continue;
            }

            // 3. Send WhatsApp
            // Template: video_consultation_15min_reminder
            // Variables:
            // {{1}} Patient Name
            // {{2}} Doctor Name
            // {{3}} Time
            // {{4}} Link

            const timeStr = new Date(apt.start_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            const meetingLink = `https://meet.jit.si/AisurgeonPilot-${apt.id}`;

            const variables = [
                `${patient.first_name} ${patient.last_name}`,
                doctor.full_name,
                timeStr,
                meetingLink
            ];

            const sent = await sendWhatsAppTemplate(
                patient.phone,
                'video_consultation_15min_reminder',
                variables
            );

            if (sent) {
                console.log(`[CRON] ✓ Sent 15-min reminder to ${patient.first_name} (${patient.phone})`);

                // 4. Log success
                await supabase.from('whatsapp_automation_log').insert({
                    tenant_id: '00000000-0000-0000-0000-000000000001', // Default tenant
                    patient_id: apt.patient_id,
                    appointment_id: apt.id,
                    message_type: 'video_15min_reminder',
                    phone_number: patient.phone,
                    delivery_status: 'sent',
                    triggered_by: 'system_cron',
                    message_text: `Video reminder sent for ${timeStr}`
                });
            }
        }

    } catch (err) {
        console.error('[CRON] Error sending reminders:', err);
    }
}

export const initCronJobs = () => {
    // Run every minute
    cron.schedule('* * * * *', () => {
        checkVideoConsultationReminders();
    });
    console.log('[CRON] 15-min video reminder job scheduled (every minute).');
};
