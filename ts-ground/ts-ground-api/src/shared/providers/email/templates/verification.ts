/**
 * Email Verification Template
 */

export interface VerificationEmailData {
  userName: string;
  verificationUrl: string;
  expiresInHours: number;
  appName: string;
  supportEmail?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function verificationEmailTemplate(
  data: VerificationEmailData,
): EmailTemplate {
  const { userName, verificationUrl, expiresInHours, appName, supportEmail } =
    data;

  const subject = `Verify your email - ${appName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${appName}</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
    
    <p>Hi ${userName},</p>
    
    <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        Verify Email Address
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      This link will expire in ${expiresInHours} hour${
    expiresInHours > 1 ? "s" : ""
  }.
    </p>
    
    <p style="color: #666; font-size: 14px;">
      If you didn't create an account with ${appName}, you can safely ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
    </p>
    
    ${
    supportEmail
      ? `<p style="color: #999; font-size: 12px;">Need help? Contact us at <a href="mailto:${supportEmail}" style="color: #667eea;">${supportEmail}</a></p>`
      : ""
  }
  </div>
</body>
</html>
`.trim();

  const text = `
Verify Your Email Address

Hi ${userName},

Thank you for signing up for ${appName}! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in ${expiresInHours} hour${expiresInHours > 1 ? "s" : ""}.

If you didn't create an account with ${appName}, you can safely ignore this email.

${supportEmail ? `Need help? Contact us at ${supportEmail}` : ""}
`.trim();

  return { subject, html, text };
}
