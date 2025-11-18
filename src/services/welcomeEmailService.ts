import { emailService } from './emailService';

interface WelcomeEmailData {
  email: string;
  firstName: string;
  lastName: string;
  patientId: string;
}

/**
 * Send welcome email to new patient
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const { email, firstName, lastName, patientId } = data;

  const subject = 'Welcome to AI Surgeon Pilot! 🏥';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to AI Surgeon Pilot</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2563eb 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Welcome to AI Surgeon Pilot</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your Digital Healthcare Platform</p>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hello ${firstName} ${lastName}! 👋</h2>

        <p style="font-size: 16px; color: #4b5563;">
          Thank you for joining AI Surgeon Pilot. Your account has been successfully created!
        </p>

        <div style="background: white; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">Your Patient ID</p>
          <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #2563eb;">${patientId}</p>
        </div>

        <h3 style="color: #1f2937; margin-top: 30px;">What's Next?</h3>
        <ul style="color: #4b5563; padding-left: 20px;">
          <li style="margin-bottom: 10px;">Browse our directory of experienced doctors</li>
          <li style="margin-bottom: 10px;">Book appointments at your convenience</li>
          <li style="margin-bottom: 10px;">Access your medical records anytime</li>
          <li style="margin-bottom: 10px;">Get AI-powered health insights</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${window.location.origin}/patient-dashboard"
             style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #10b981 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Go to Dashboard
          </a>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>Important:</strong> Keep your Patient ID (${patientId}) safe. You may need it for future reference.
          </p>
        </div>

        <h3 style="color: #1f2937; margin-top: 30px;">Need Help?</h3>
        <p style="color: #4b5563;">
          Our support team is here to help! If you have any questions, please don't hesitate to contact us.
        </p>

        <div style="background: white; padding: 15px; margin: 20px 0; border-radius: 5px; border: 1px solid #e5e7eb;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #1f2937;">Contact Information:</p>
          <p style="margin: 5px 0; color: #4b5563; font-size: 14px;">
            📧 Email: support@aisurgeonpilot.com<br>
            📱 Phone: +91-XXX-XXX-XXXX<br>
            🌐 Website: ${window.location.origin}
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
          This email was sent to ${email} because you created an account with AI Surgeon Pilot.
          <br><br>
          © ${new Date().getFullYear()} AI Surgeon Pilot. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to AI Surgeon Pilot!

Hello ${firstName} ${lastName},

Thank you for joining AI Surgeon Pilot. Your account has been successfully created!

Your Patient ID: ${patientId}

What's Next?
- Browse our directory of experienced doctors
- Book appointments at your convenience
- Access your medical records anytime
- Get AI-powered health insights

Visit your dashboard: ${window.location.origin}/patient-dashboard

Important: Keep your Patient ID (${patientId}) safe. You may need it for future reference.

Need Help?
Our support team is here to help! If you have any questions, please don't hesitate to contact us.

Contact Information:
Email: support@aisurgeonpilot.com
Phone: +91-XXX-XXX-XXXX
Website: ${window.location.origin}

This email was sent to ${email} because you created an account with AI Surgeon Pilot.

© ${new Date().getFullYear()} AI Surgeon Pilot. All rights reserved.
  `;

  try {
    await emailService.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
    console.log('✓ Welcome email sent to:', email);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't throw error - email failure shouldn't block signup
  }
}

export const welcomeEmailService = {
  sendWelcomeEmail,
};
