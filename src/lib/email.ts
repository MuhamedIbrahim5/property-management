import crypto from 'crypto'

/**
 * Email service using Resend
 * Configured via environment variables
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourdomain.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

/**
 * Send email via Resend API
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error('[Email] RESEND_API_KEY not configured')
    return false
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[Email] Send failed:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[Email] Exception:', error)
    return false
  }
}

/**
 * Generate password reset email HTML
 */
export function generatePasswordResetEmail(
  userName: string,
  resetLink: string,
  language: 'ar' | 'en' = 'ar'
): string {
  if (language === 'ar') {
    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; direction: rtl; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2C5D7A 0%, #3E7859 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
    .message { color: #666; line-height: 1.8; margin-bottom: 30px; font-size: 15px; }
    .button-container { text-align: center; margin: 35px 0; }
    .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #2C5D7A 0%, #3E7859 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 8px rgba(44,93,122,0.3); }
    .button:hover { box-shadow: 0 6px 12px rgba(44,93,122,0.4); }
    .link-box { background: #f8f9fa; border: 1px solid #e0e0e0; padding: 15px; border-radius: 8px; margin: 25px 0; word-break: break-all; }
    .link-box p { margin: 0 0 8px; color: #666; font-size: 13px; }
    .link-box a { color: #2C5D7A; font-size: 13px; }
    .warning { background: #fff3cd; border-right: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px; }
    .warning p { margin: 0; color: #856404; font-size: 14px; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; color: #999; font-size: 13px; line-height: 1.6; }
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>نظام إدارة الأملاك والصيانة</h1>
      <p>شركة المساعدية النموذجية للعقارات</p>
    </div>
    <div class="content">
      <div class="greeting">مرحباً ${userName || ''},</div>
      
      <div class="message">
        <p>تلقينا طلباً لاستعادة كلمة المرور الخاصة بحسابك في نظام إدارة الأملاك والصيانة.</p>
        <p>لتعيين كلمة مرور جديدة، يرجى الضغط على الزر أدناه:</p>
      </div>

      <div class="button-container">
        <a href="${resetLink}" class="button">إعادة تعيين كلمة المرور</a>
      </div>

      <div class="link-box">
        <p>أو انسخ الرابط التالي في متصفحك:</p>
        <a href="${resetLink}">${resetLink}</a>
      </div>

      <div class="warning">
        <p><strong>تنبيه:</strong> هذا الرابط صالح لمدة 30 دقيقة فقط ويمكن استخدامه مرة واحدة.</p>
      </div>

      <div class="message">
        <p>إذا لم تطلب استعادة كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني. حسابك آمن ولن يتم إجراء أي تغييرات.</p>
      </div>
    </div>
    <div class="footer">
      <p><strong>شركة المساعدية النموذجية للعقارات</strong></p>
      <p>AL-MUSAADIYA MODEL REAL ESTATE CO.</p>
      <p>نظام إدارة الأملاك والصيانة</p>
      <p style="margin-top: 15px; color: #bbb; font-size: 12px;">
        هذه رسالة تلقائية، يرجى عدم الرد عليها
      </p>
    </div>
  </div>
</body>
</html>
`
  } else {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2C5D7A 0%, #3E7859 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
    .message { color: #666; line-height: 1.8; margin-bottom: 30px; font-size: 15px; }
    .button-container { text-align: center; margin: 35px 0; }
    .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #2C5D7A 0%, #3E7859 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 8px rgba(44,93,122,0.3); }
    .button:hover { box-shadow: 0 6px 12px rgba(44,93,122,0.4); }
    .link-box { background: #f8f9fa; border: 1px solid #e0e0e0; padding: 15px; border-radius: 8px; margin: 25px 0; word-break: break-all; }
    .link-box p { margin: 0 0 8px; color: #666; font-size: 13px; }
    .link-box a { color: #2C5D7A; font-size: 13px; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px; }
    .warning p { margin: 0; color: #856404; font-size: 14px; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; color: #999; font-size: 13px; line-height: 1.6; }
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Property Management System</h1>
      <p>AL-MUSAADIYA MODEL REAL ESTATE CO.</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${userName || ''},</div>
      
      <div class="message">
        <p>We received a request to reset your password for the Property Management System.</p>
        <p>To set a new password, please click the button below:</p>
      </div>

      <div class="button-container">
        <a href="${resetLink}" class="button">Reset Password</a>
      </div>

      <div class="link-box">
        <p>Or copy this link into your browser:</p>
        <a href="${resetLink}">${resetLink}</a>
      </div>

      <div class="warning">
        <p><strong>Notice:</strong> This link is valid for 30 minutes only and can be used once.</p>
      </div>

      <div class="message">
        <p>If you didn't request a password reset, please ignore this email. Your account is secure and no changes will be made.</p>
      </div>
    </div>
    <div class="footer">
      <p><strong>AL-MUSAADIYA MODEL REAL ESTATE CO.</strong></p>
      <p>شركة المساعدية النموذجية للعقارات</p>
      <p>Property Management System</p>
      <p style="margin-top: 15px; color: #bbb; font-size: 12px;">
        This is an automated message, please do not reply
      </p>
    </div>
  </div>
</body>
</html>
`
  }
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hash a token using SHA-256 for storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
