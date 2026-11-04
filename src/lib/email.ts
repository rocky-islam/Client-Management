import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Rocky Business Manager <onboarding@resend.dev>';

interface SendOtpParams {
  to: string;
  otp: string;
  name?: string;
}

export async function sendOtpEmail({ to, otp, name }: SendOtpParams): Promise<{
  success: boolean;
  error?: string;
  devMode?: boolean;
}> {
  // If no API key is provided yet, handle gracefully for development/testing
  if (!resend) {
    console.warn(`\n========================================`);
    console.warn(`[EMAIL SERVICE] RESEND_API_KEY is not configured.`);
    console.warn(`[DEV OTP SIMULATION] Verification OTP for ${to}: ${otp}`);
    console.warn(`========================================\n`);
    return {
      success: true,
      devMode: true,
    };
  }

  const displayName = name ? name.trim() : 'Valued User';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification Code</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
        .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .otp-box { background: #f1f5f9; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4338ca; font-family: monospace; }
        .expiry { font-size: 13px; color: #64748b; margin-top: 8px; }
        .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5; }
        .badge { display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="badge">Rocky Business Manager</span>
          <h1>Email Verification Code</h1>
          <p>Use this security code to complete your registration</p>
        </div>
        <div class="content">
          <div class="greeting">Hello, ${displayName}!</div>
          <div class="message">
            Thank you for registering on Rocky Business Manager. To verify your email address and activate your account, please enter the following 6-digit verification code:
          </div>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="expiry">⏰ This code will expire in <strong>10 minutes</strong></div>
          </div>
          <div class="message" style="margin-bottom: 0; font-size: 13px; color: #64748b;">
            If you did not request this verification code, please ignore this email. Your account will not be created without this code.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Rocky Business Manager. All rights reserved.<br>
          Secure Client & Project Management Studio.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: `Your Verification Code: ${otp} - Rocky Business Manager`,
      html: htmlContent,
    });

    if (error) {
      console.error('[RESEND ERROR]', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[RESEND EXCEPTION]', err);
    return {
      success: false,
      error: err.message || 'Failed to send verification email. Please try again.',
    };
  }
}
