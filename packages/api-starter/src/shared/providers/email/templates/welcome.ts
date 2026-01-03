/**
 * Welcome Email Template
 */

export interface WelcomeEmailData {
  userName: string;
  appName: string;
  appUrl: string;
  supportEmail?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function welcomeEmailTemplate(data: WelcomeEmailData): EmailTemplate {
  const { userName, appName, appUrl, supportEmail } = data;

  const subject = `Welcome to ${appName}!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${appName}!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">You're all set!</h2>
    
    <p>Hi ${userName},</p>
    
    <p>Thank you for joining ${appName}! We're excited to have you on board.</p>
    
    <p>Your account has been successfully created and verified. Here's what you can do next:</p>
    
    <ul style="color: #555; padding-left: 20px;">
      <li>Browse our collection of products</li>
      <li>Add items to your cart</li>
      <li>Save your favorite items</li>
      <li>Enjoy a seamless shopping experience</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${appUrl}" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        Start Shopping
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="color: #666; font-size: 14px;">
      If you have any questions or need assistance, we're here to help!
    </p>
    
    ${
    supportEmail
      ? `<p style="color: #999; font-size: 12px;">Contact us at <a href="mailto:${supportEmail}" style="color: #11998e;">${supportEmail}</a></p>`
      : ""
  }
  </div>
</body>
</html>
`.trim();

  const text = `
Welcome to ${appName}!

Hi ${userName},

Thank you for joining ${appName}! We're excited to have you on board.

Your account has been successfully created and verified. Here's what you can do next:

- Browse our collection of products
- Add items to your cart
- Save your favorite items
- Enjoy a seamless shopping experience

Start shopping at: ${appUrl}

If you have any questions or need assistance, we're here to help!

${supportEmail ? `Contact us at ${supportEmail}` : ""}
`.trim();

  return { subject, html, text };
}
