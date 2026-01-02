/**
 * Password Reset Email Template
 */

export interface PasswordResetEmailData {
  userName: string;
  resetUrl: string;
  expiresInHours: number;
  appName: string;
  supportEmail?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function passwordResetEmailTemplate(
  data: PasswordResetEmailData,
): EmailTemplate {
  const { userName, resetUrl, expiresInHours, appName, supportEmail } = data;

  const subject = `Reset your password - ${appName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${appName}</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
    
    <p>Hi ${userName},</p>
    
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      This link will expire in ${expiresInHours} hour${
    expiresInHours > 1 ? "s" : ""
  }.
    </p>
    
    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0;">
      <p style="color: #856404; margin: 0; font-size: 14px;">
        <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${resetUrl}" style="color: #f5576c; word-break: break-all;">${resetUrl}</a>
    </p>
    
    ${
    supportEmail
      ? `<p style="color: #999; font-size: 12px;">Need help? Contact us at <a href="mailto:${supportEmail}" style="color: #f5576c;">${supportEmail}</a></p>`
      : ""
  }
  </div>
</body>
</html>
`.trim();

  const text = `
Reset Your Password

Hi ${userName},

We received a request to reset your password for ${appName}. Click the link below to create a new password:

${resetUrl}

This link will expire in ${expiresInHours} hour${expiresInHours > 1 ? "s" : ""}.

SECURITY NOTICE: If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

${supportEmail ? `Need help? Contact us at ${supportEmail}` : ""}
`.trim();

  return { subject, html, text };
}
