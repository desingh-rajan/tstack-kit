/**
 * Order Shipped Email Template
 *
 * Sent when an order has been shipped with tracking information.
 */

import {
  bodyStyles,
  containerStyles,
  type EmailTemplate,
  formatAddressHtml,
  formatAddressText,
  generateItemsTableHtml,
  generateItemsText,
  getHeader,
  type OrderItemData,
  type ShippingAddressData,
} from "./shared.ts";

export interface OrderShippedEmailData {
  userName: string;
  orderNumber: string;
  orderUrl?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  shippingAddress: ShippingAddressData;
  appName: string;
  storeUrl: string;
  supportEmail?: string;
  items?: OrderItemData[];
  currency?: string;
}

export function orderShippedEmailTemplate(
  data: OrderShippedEmailData,
): EmailTemplate {
  const {
    userName,
    orderNumber,
    orderUrl,
    trackingNumber,
    trackingUrl,
    carrier,
    shippingAddress,
    appName,
    storeUrl,
    supportEmail,
    items,
    currency = "INR",
  } = data;

  const subject = `Your order ${orderNumber} has been shipped! | ${appName}`;

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
      <div style="background: #e2e6ea; color: #495057; padding: 15px; border-radius: 5px; display: inline-block;">
        <span style="font-size: 24px;">&#128666;</span>
        <strong style="font-size: 18px; margin-left: 10px;">On its way!</strong>
      </div>
    </div>

    <p>Hi ${userName},</p>
    
    <p>Great news! Your order <strong>${orderNumber}</strong> has been shipped and is on its way to you.</p>

    ${itemsHtml}
    
    ${
    (trackingNumber || carrier)
      ? `
    <div style="background: #f8f9fa; border-radius: 5px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Tracking Information</h3>
      ${
        carrier
          ? `<p style="margin: 5px 0;"><strong>Carrier:</strong> ${carrier}</p>`
          : ""
      }
      ${
        trackingNumber
          ? `<p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>`
          : ""
      }
      ${
        trackingUrl
          ? `<div style="margin-top: 15px;"><a href="${trackingUrl}" style="color: #667eea; text-decoration: underline;">Track your package</a></div>`
          : ""
      }
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
Your order ${orderNumber} has been shipped!

Hi ${userName},

Great news! Your order ${orderNumber} has been shipped and is on its way to you.

${itemsText}

${
    (trackingNumber || carrier)
      ? `
TRACKING INFORMATION
${carrier ? `Carrier: ${carrier}` : ""}
${trackingNumber ? `Tracking Number: ${trackingNumber}` : ""}
${trackingUrl ? `Track package: ${trackingUrl}` : ""}
`
      : ""
  }

SHIPPING TO
${formatAddressText(shippingAddress)}

${orderUrl ? `View your order status: ${orderUrl}` : ""}

${supportEmail ? `Questions? Contact us at ${supportEmail}` : ""}
`.trim();

  return { subject, html, text };
}
