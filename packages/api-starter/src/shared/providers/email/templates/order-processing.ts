/**
 * Order Processing Email Template
 *
 * Sent when an order is being processed/prepared for shipment.
 */

import {
  bodyStyles,
  containerStyles,
  type EmailTemplate,
  formatAddressHtml,
  formatAddressText,
  formatCurrency,
  generateItemsTableHtml,
  generateItemsText,
  getHeader,
  type OrderItemData,
  type ShippingAddressData,
} from "./shared.ts";

export interface OrderProcessingEmailData {
  userName: string;
  orderNumber: string;
  orderUrl?: string;
  shippingAddress: ShippingAddressData;
  appName: string;
  storeUrl: string;
  supportEmail?: string;
  items?: OrderItemData[];
  total?: number;
  currency?: string;
}

export function orderProcessingEmailTemplate(
  data: OrderProcessingEmailData,
): EmailTemplate {
  const {
    userName,
    orderNumber,
    orderUrl,
    shippingAddress,
    appName,
    storeUrl,
    supportEmail,
    items,
    total,
    currency = "INR",
  } = data;

  const subject = `Your order ${orderNumber} is being prepared! | ${appName}`;

  const itemsHtml = items ? generateItemsTableHtml(items, currency) : "";
  const itemsText = items ? generateItemsText(items, currency) : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="${bodyStyles}">
  ${getHeader(storeUrl, appName)}
  
  <div style="${containerStyles}">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; display: inline-block;">
        <span style="font-size: 24px;">&#128230;</span>
        <strong style="font-size: 18px; margin-left: 10px;">Preparing Your Order</strong>
      </div>
    </div>

    <p>Hi ${userName},</p>
    
    <p>Great news! Your order <strong>${orderNumber}</strong> is now being prepared and will be shipped soon.</p>

    ${itemsHtml}

    ${
    total !== undefined
      ? `
    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
        <span>Total</span>
        <span>${formatCurrency(total, currency)}</span>
      </div>
    </div>
    `
      : ""
  }
    
    <h3 style="border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 30px;">Shipping To</h3>
    
    ${formatAddressHtml(shippingAddress)}

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
Your order ${orderNumber} is being prepared!

Hi ${userName},

Great news! Your order ${orderNumber} is now being prepared and will be shipped soon.

${itemsText}

${total !== undefined ? `Total: ${formatCurrency(total, currency)}` : ""}

SHIPPING TO
${formatAddressText(shippingAddress)}

${orderUrl ? `View your order status: ${orderUrl}` : ""}

${supportEmail ? `Questions? Contact us at ${supportEmail}` : ""}
`.trim();

  return { subject, html, text };
}
