
/**
 * Express.js Email Server
 * Handles email sending via Resend API (bypasses CORS)
 *
 * Run: node server/email-server.js
 * Or: npm run server
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { initCronJobs } from './cron-jobs.js';

initCronJobs();

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5080',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // In production, allow any origin
    if (process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for now
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Configuration
const RESEND_API_KEY = process.env.VITE_RESEND_API_KEY || 're_cfLQWv8y_2CaKP26okdNq2pdHtQKGmFF4';
const FROM_EMAIL = process.env.VITE_FROM_EMAIL || 'onboarding@resend.dev';
const PORT = process.env.EMAIL_SERVER_PORT || process.env.PORT || 3001;

/**
 * POST /api/send-email
 * Send email via Resend API
 */
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, text, from, reply_to, cc, bcc } = req.body;

    // Validate required fields
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, html'
      });
    }

    console.log(`[EMAIL] Sending to: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`[EMAIL] Subject: ${subject}`);

    // Prepare payload
    const emailPayload = {
      from: from || `AI Surgeon Pilot <${FROM_EMAIL}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      reply_to,
      cc,
      bcc
    };

    // Remove undefined fields
    Object.keys(emailPayload).forEach(key => {
      if (emailPayload[key] === undefined) {
        delete emailPayload[key];
      }
    });

    // Send via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`[EMAIL] Sent successfully! ID: ${data.id}`);
      res.json({ success: true, id: data.id, message: 'Email sent successfully' });
    } else {
      console.error(`[EMAIL] Failed:`, data);
      res.status(response.status).json({
        success: false,
        error: data.message || 'Failed to send email',
        details: data
      });
    }

  } catch (error) {
    console.error(`[EMAIL] Server error:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Email Server',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /
 * Root endpoint
 */
app.get('/', (_req, res) => {
  res.json({
    service: 'AI Surgeon Pilot - Email Server',
    version: '1.0.0',
    endpoints: {
      'POST /api/send-email': 'Send email via Resend API',
      'GET /health': 'Health check'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n========================================');
  console.log('  AI Surgeon Pilot - Email Server');
  console.log('========================================');
  console.log(`  Status:  Running`);
  console.log(`  Port:    ${PORT}`);
  console.log(`  URL:     http://localhost:${PORT}`);
  console.log(`  From:    ${FROM_EMAIL}`);
  console.log('========================================\n');
});
