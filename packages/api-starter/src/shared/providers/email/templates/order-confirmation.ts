/**
 * Order Confirmation Email Template
 */

export interface OrderItem {
  name: string;
  variant?: string;
  quantity: number;
  price: number;
}

export interface OrderConfirmationEmailData {
  userName: string;
  orderNumber: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  appName: string;
  appUrl: string;
  supportEmail?: string;
  orderUrl?: string;
  currency?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amount);
}

export function orderConfirmationEmailTemplate(
  data: OrderConfirmationEmailData,
): EmailTemplate {
  const {
    userName,
    orderNumber,
    orderDate,
    items,
    subtotal,
    shipping,
    tax,
    total,
    shippingAddress,
    appName,
    appUrl: _appUrl,
    supportEmail,
    orderUrl,
    currency = "INR",
  } = data;

  const subject = `Order Confirmed - ${orderNumber} | ${appName}`;

  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
        <strong>${item.name}</strong>
        ${
        item.variant
          ? `<br><span style="color: #666; font-size: 14px;">${item.variant}</span>`
          : ""
      }
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">${
        formatCurrency(item.price, currency)
      }</td>
    </tr>
  `,
    )
    .join("");

  const itemsText = items
    .map(
      (item) =>
        `- ${item.name}${
          item.variant ? ` (${item.variant})` : ""
        } x${item.quantity} - ${formatCurrency(item.price, currency)}`,
    )
    .join("\n");

  const addressText = [
    shippingAddress.fullName,
    shippingAddress.addressLine1,
    shippingAddress.addressLine2,
    `${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}`,
    shippingAddress.country,
  ]
    .filter(Boolean)
    .join("\n");

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
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; display: inline-block;">
        <span style="font-size: 24px;">&#10003;</span>
        <strong style="font-size: 18px; margin-left: 10px;">Order Confirmed!</strong>
      </div>
    </div>
    
    <p>Hi ${userName},</p>
    
    <p>Thank you for your order! We've received your order and will begin processing it right away.</p>
    
    <div style="background: #f8f9fa; border-radius: 5px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%;">
        <tr>
          <td><strong>Order Number:</strong></td>
          <td style="text-align: right;">${orderNumber}</td>
        </tr>
        <tr>
          <td><strong>Order Date:</strong></td>
          <td style="text-align: right;">${orderDate}</td>
        </tr>
      </table>
    </div>
    
    <h3 style="border-bottom: 2px solid #667eea; padding-bottom: 10px;">Order Details</h3>
    
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f8f9fa;">
          <th style="padding: 10px; text-align: left;">Item</th>
          <th style="padding: 10px; text-align: center;">Qty</th>
          <th style="padding: 10px; text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    
    <table style="width: 100%; margin-top: 20px;">
      <tr>
        <td style="padding: 5px 0;">Subtotal:</td>
        <td style="text-align: right; padding: 5px 0;">${
    formatCurrency(subtotal, currency)
  }</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;">Shipping:</td>
        <td style="text-align: right; padding: 5px 0;">${
    shipping === 0 ? "FREE" : formatCurrency(shipping, currency)
  }</td>
      </tr>
      ${
    tax > 0
      ? `
      <tr>
        <td style="padding: 5px 0;">Tax:</td>
        <td style="text-align: right; padding: 5px 0;">${
        formatCurrency(tax, currency)
      }</td>
      </tr>
      `
      : ""
  }
      <tr style="font-size: 18px; font-weight: bold; border-top: 2px solid #333;">
        <td style="padding: 15px 0;">Total:</td>
        <td style="text-align: right; padding: 15px 0;">${
    formatCurrency(total, currency)
  }</td>
      </tr>
    </table>
    
    <h3 style="border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 30px;">Shipping Address</h3>
    
    <p style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
      ${shippingAddress.fullName}<br>
      ${shippingAddress.addressLine1}<br>
      ${
    shippingAddress.addressLine2 ? `${shippingAddress.addressLine2}<br>` : ""
  }
      ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}<br>
      ${shippingAddress.country}
    </p>
    
    ${
    orderUrl
      ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${orderUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        View Order Status
      </a>
    </div>
    `
      : ""
  }
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="color: #666; font-size: 14px;">
      We'll send you another email when your order ships with tracking information.
    </p>
    
    ${
    supportEmail
      ? `<p style="color: #999; font-size: 12px;">Questions? Contact us at <a href="mailto:${supportEmail}" style="color: #667eea;">${supportEmail}</a></p>`
      : ""
  }
  </div>
</body>
</html>
`.trim();

  const text = `
Order Confirmed - ${orderNumber}

Hi ${userName},

Thank you for your order! We've received your order and will begin processing it right away.

Order Number: ${orderNumber}
Order Date: ${orderDate}

ORDER DETAILS
${itemsText}

Subtotal: ${formatCurrency(subtotal, currency)}
Shipping: ${shipping === 0 ? "FREE" : formatCurrency(shipping, currency)}
${tax > 0 ? `Tax: ${formatCurrency(tax, currency)}\n` : ""}Total: ${
    formatCurrency(total, currency)
  }

SHIPPING ADDRESS
${addressText}

${orderUrl ? `View your order: ${orderUrl}` : ""}

We'll send you another email when your order ships with tracking information.

${supportEmail ? `Questions? Contact us at ${supportEmail}` : ""}
`.trim();

  return { subject, html, text };
}
