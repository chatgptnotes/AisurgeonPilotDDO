import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Edge Function: Send Video Consultation Reminders
 *
 * This function runs every 5 minutes (via cron) and:
 * 1. Finds appointments starting in 10-20 minutes
 * 2. Filters for video consultations with meeting links
 * 3. Sends WhatsApp + Email reminders to patients
 * 4. Marks appointments as reminder_15min_sent = true
 */

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Starting video consultation reminder job...')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Double Tick configuration
    const DOUBLETICK_API_KEY = Deno.env.get('DOUBLETICK_API_KEY') || 'key_8sc9MP6JpQ'
    const TEMPLATE_NAME = 'video_consultation_15min_reminder'
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    console.log('✅ Configuration loaded:', {
      templateName: TEMPLATE_NAME,
      apiKeyPresent: !!DOUBLETICK_API_KEY,
      resendKeyPresent: !!RESEND_API_KEY
    })

    // Calculate time window: appointments starting in 10-20 minutes from now
    const now = new Date()
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000)
    const twentyMinutesFromNow = new Date(now.getTime() + 20 * 60 * 1000)

    console.log(`📅 Looking for appointments between:`)
    console.log(`   ${tenMinutesFromNow.toISOString()} and ${twentyMinutesFromNow.toISOString()}`)

    // Query appointments that need reminders
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        start_at,
        meeting_link,
        mode,
        status,
        reminder_15min_sent,
        patient_id,
        doctor_id,
        patients (
          id,
          name,
          phone,
          email
        ),
        doctors (
          id,
          full_name,
          email
        )
      `)
      .gte('start_at', tenMinutesFromNow.toISOString())
      .lte('start_at', twentyMinutesFromNow.toISOString())
      .not('meeting_link', 'is', null)
      .eq('reminder_15min_sent', false)
      .in('status', ['scheduled', 'confirmed'])

    if (appointmentsError) {
      console.error('❌ Error fetching appointments:', appointmentsError)
      throw appointmentsError
    }

    console.log(`📊 Found ${appointments?.length || 0} appointments needing reminders`)

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No appointments found needing reminders',
          count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let successCount = 0
    let failCount = 0
    const results = []

    // Process each appointment
    for (const appointment of appointments) {
      try {
        const patient = appointment.patients as any
        const doctor = appointment.doctors as any

        if (!patient) {
          console.warn(`⚠️ No patient data for appointment ${appointment.id}`)
          continue
        }

        console.log(`📱 Processing appointment for patient ${patient.name}`)

        // Format date and time
        const appointmentDate = new Date(appointment.start_at)
        const formattedDate = appointmentDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
        const formattedTime = appointmentDate.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })

        // Prepare message parameters
        const messageParams = {
          patientName: patient.name || 'Patient',
          doctorName: doctor?.full_name || 'Doctor',
          date: formattedDate,
          time: formattedTime,
          meetingLink: appointment.meeting_link,
          clinicName: 'AI Surgeon Pilot'
        }

        let whatsappSuccess = false
        let emailSuccess = false

        // Send WhatsApp message if phone number exists
        if (patient.phone) {
          const whatsappResponse = await sendWhatsAppReminder(
            DOUBLETICK_API_KEY,
            patient.phone,
            TEMPLATE_NAME,
            messageParams
          )
          whatsappSuccess = whatsappResponse.success

          if (whatsappSuccess) {
            console.log(`✅ WhatsApp sent to ${patient.phone}`)
          } else {
            console.error(`❌ WhatsApp failed for ${patient.phone}:`, whatsappResponse.error)
          }
        } else {
          console.warn(`⚠️ No phone number for patient ${patient.name}`)
        }

        // Send Email if email exists and Resend is configured
        if (patient.email && RESEND_API_KEY) {
          const emailResponse = await sendEmailReminder(
            RESEND_API_KEY,
            patient.email,
            messageParams
          )
          emailSuccess = emailResponse.success

          if (emailSuccess) {
            console.log(`✅ Email sent to ${patient.email}`)
          } else {
            console.error(`❌ Email failed for ${patient.email}:`, emailResponse.error)
          }
        } else if (!patient.email) {
          console.warn(`⚠️ No email for patient ${patient.name}`)
        }

        // Mark appointment as reminder sent if at least one channel succeeded
        if (whatsappSuccess || emailSuccess) {
          const { error: updateError } = await supabase
            .from('appointments')
            .update({ reminder_15min_sent: true })
            .eq('id', appointment.id)

          if (updateError) {
            console.error('❌ Error updating appointment:', updateError)
          }

          successCount++
        } else {
          failCount++
        }

        results.push({
          appointmentId: appointment.id,
          patientName: patient.name,
          patientPhone: patient.phone,
          patientEmail: patient.email,
          whatsappSent: whatsappSuccess,
          emailSent: emailSuccess
        })

      } catch (error) {
        console.error(`❌ Error processing appointment ${appointment.id}:`, error)
        failCount++
        results.push({
          appointmentId: appointment.id,
          success: false,
          error: error.message
        })
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   Total: ${appointments.length}`)
    console.log(`   Success: ${successCount}`)
    console.log(`   Failed: ${failCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${appointments.length} appointments`,
        summary: {
          total: appointments.length,
          success: successCount,
          failed: failCount
        },
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Fatal error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Function to send WhatsApp message via Double Tick API
async function sendWhatsAppReminder(
  apiKey: string,
  phoneNumber: string,
  templateName: string,
  params: {
    patientName: string
    doctorName: string
    date: string
    time: string
    meetingLink: string
    clinicName: string
  }
) {
  try {
    const apiUrl = 'https://public.doubletick.io/whatsapp/message/template'

    // Format phone number (ensure +91 prefix for India)
    let formattedPhone = phoneNumber.replace(/\D/g, '') // Remove non-digits
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone
    }
    formattedPhone = '+' + formattedPhone

    const payload = {
      messages: [
        {
          to: formattedPhone,
          content: {
            templateName: templateName,
            language: 'en',
            templateData: {
              body: {
                placeholders: [
                  params.patientName,
                  params.doctorName,
                  params.date,
                  params.time,
                  params.meetingLink,
                  params.clinicName
                ]
              }
            }
          }
        }
      ]
    }

    console.log('📤 Sending WhatsApp to:', formattedPhone)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
        'accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const responseData = await response.json()

    const isSuccess = responseData.messages &&
                     responseData.messages[0] &&
                     responseData.messages[0].status === 'ENQUEUED'

    if (!isSuccess) {
      return {
        success: false,
        error: `API Error: ${response.status} - ${JSON.stringify(responseData)}`,
        response: responseData
      }
    }

    return { success: true, response: responseData }

  } catch (error) {
    console.error('❌ WhatsApp API error:', error)
    return { success: false, error: error.message, response: null }
  }
}

// Function to send Email via Resend API
async function sendEmailReminder(
  apiKey: string,
  email: string,
  params: {
    patientName: string
    doctorName: string
    date: string
    time: string
    meetingLink: string
    clinicName: string
  }
) {
  try {
    const apiUrl = 'https://api.resend.com/emails'

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .highlight { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Video Consultation Reminder</h1>
    </div>
    <div class="content">
      <p>Dear ${params.patientName},</p>

      <p>Your video consultation with <strong>Dr. ${params.doctorName}</strong> starts in 15 minutes!</p>

      <div class="highlight">
        <p><strong>Date:</strong> ${params.date}</p>
        <p><strong>Time:</strong> ${params.time}</p>
      </div>

      <p>Please click the button below to join your consultation:</p>

      <a href="${params.meetingLink}" class="button">Join Video Consultation</a>

      <p>Or copy this link: <a href="${params.meetingLink}">${params.meetingLink}</a></p>

      <p><strong>Tips for a smooth consultation:</strong></p>
      <ul>
        <li>Ensure you have a stable internet connection</li>
        <li>Test your camera and microphone beforehand</li>
        <li>Find a quiet, well-lit space</li>
        <li>Have your medical records ready if needed</li>
      </ul>

      <div class="footer">
        <p>Best regards,<br>${params.clinicName}</p>
        <p>This is an automated reminder. Please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
`

    const payload = {
      from: 'AI Surgeon Pilot <noreply@aisurgeonpilot.com>',
      to: [email],
      subject: `Reminder: Your Video Consultation with Dr. ${params.doctorName} starts in 15 minutes`,
      html: htmlContent
    }

    console.log('📤 Sending Email to:', email)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    })

    const responseData = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: `Email API Error: ${response.status} - ${JSON.stringify(responseData)}`,
        response: responseData
      }
    }

    return { success: true, response: responseData }

  } catch (error) {
    console.error('❌ Email API error:', error)
    return { success: false, error: error.message, response: null }
  }
}
