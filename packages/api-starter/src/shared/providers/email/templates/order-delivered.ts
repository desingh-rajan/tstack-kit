/**
 * Order Delivered Email Template
 *
 * Sent when an order has been delivered.
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

export interface OrderDeliveredEmailData {
  userName: string;
  orderNumber: string;
  orderUrl?: string;
  shippingAddress: ShippingAddressData;
  appName: string;
  storeUrl: string;
  supportEmail?: string;
  items?: OrderItemData[];
  currency?: string;
}

export function orderDeliveredEmailTemplate(
  data: OrderDeliveredEmailData,
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
    currency = "INR",
  } = data;

  const subject = `Your order ${orderNumber} has been delivered! | ${appName}`;

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
      <div style="background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; display: inline-block;">
        <span style="font-size: 24px;">&#127873;</span>
        <strong style="font-size: 18px; margin-left: 10px;">Delivered!</strong>
      </div>
    </div>

    <p>Hi ${userName},</p>
    
    <p>Your order <strong>${orderNumber}</strong> has been delivered. We hope you enjoy your purchase!</p>

    ${itemsHtml}
    
    <h3 style="border-bottom: 2px solid #11998e; padding-bottom: 10px; margin-top: 30px;">Delivered To</h3>
    
    ${formatAddressHtml(shippingAddress)}

    <div style="text-align: center; margin: 30px 0;">
      <p>How did we do? We'd love to hear your feedback!</p>
      ${
    orderUrl
      ? `
      <a href="${orderUrl}" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        View Order & Leave Review
      </a>
      `
      : ""
  }
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    ${
    supportEmail
      ? `<p style="color: #999; font-size: 12px;">Questions or issues? Contact us at <a href="mailto:${supportEmail}" style="color: #11998e;">${supportEmail}</a></p>`
      : ""
  }
  </div>
</body>
</html>
`.trim();

  const text = `
Your order ${orderNumber} has been delivered!

Hi ${userName},

Your order ${orderNumber} has been delivered. We hope you enjoy your purchase!

${itemsText}

DELIVERED TO
${formatAddressText(shippingAddress)}

How did we do? We'd love to hear your feedback!

${orderUrl ? `View your order and leave a review: ${orderUrl}` : ""}

${supportEmail ? `Questions? Contact us at ${supportEmail}` : ""}
`.trim();

  return { subject, html, text };
}
