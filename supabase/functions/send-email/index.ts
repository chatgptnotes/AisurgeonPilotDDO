import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Edge Function: Send Email via Resend API
 *
 * This function handles all email sending requests from the frontend.
 * No proxy server needed - calls Resend API directly from server-side.
 */

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 're_cfLQWv8y_2CaKP26okdNq2pdHtQKGmFF4'
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev'

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()

    // Validate required fields
    if (!body.to || !body.subject || !body.html) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Sending email to:', body.to)

    // Prepare email payload
    const emailPayload = {
      from: body.from || `AI Surgeon Pilot <${FROM_EMAIL}>`,
      to: Array.isArray(body.to) ? body.to : [body.to],
      subject: body.subject,
      html: body.html,
      text: body.text,
      reply_to: body.reply_to,
      cc: body.cc,
      bcc: body.bcc
    }

    // Send via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })

    const data = await response.json()

    if (response.ok) {
      console.log('Email sent successfully:', data.id)
      return new Response(
        JSON.stringify({ success: true, id: data.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      console.error('Resend API error:', data)
      return new Response(
        JSON.stringify({ success: false, error: data.message || 'Failed to send email', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Email sending error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
