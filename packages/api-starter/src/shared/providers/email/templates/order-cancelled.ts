/**
 * Order Cancelled Email Template
 *
 * Sent when an order has been cancelled.
 */

import {
  bodyStyles,
  containerStyles,
  type EmailTemplate,
  getHeader,
} from "./shared.ts";

export interface OrderCancelledEmailData {
  userName: string;
  orderNumber: string;
  orderUrl?: string;
  reason?: string;
  cancelledBy: "user" | "admin";
  refundStatus?: string;
  appName: string;
  storeUrl: string;
  supportEmail?: string;
}

export function orderCancelledEmailTemplate(
  data: OrderCancelledEmailData,
): EmailTemplate {
  const {
    userName,
    orderNumber,
    orderUrl,
    reason,
    cancelledBy,
    refundStatus,
    appName,
    storeUrl,
    supportEmail,
  } = data;

  const subject = `Order Cancelled - ${orderNumber} | ${appName}`;

  const message = cancelledBy === "user"
    ? `As requested, your order <strong>${orderNumber}</strong> has been cancelled.`
    : `Your order <strong>${orderNumber}</strong> has been cancelled.`;

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
      <div style="background: #fff5f5; color: #c53030; padding: 15px; border-radius: 5px; display: inline-block;">
        <span style="font-size: 24px;">&#10007;</span>
        <strong style="font-size: 18px; margin-left: 10px;">Order Cancelled</strong>
      </div>
    </div>

    <p>Hi ${userName},</p>
    
    <p>${message}</p>
    
    ${
    reason
      ? `
    <div style="background: #f8f9fa; border-left: 4px solid #c53030; padding: 15px; margin: 20px 0;">
      <strong>Reason:</strong> ${reason}
    </div>
    `
      : ""
  }

    ${
    refundStatus
      ? `
    <p><strong>Refund Status:</strong> ${refundStatus}</p>
    `
      : ""
  }

    ${
    orderUrl
      ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${orderUrl}" style="background: #718096; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        View Order Details
      </a>
    </div>
    `
      : ""
  }
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    ${
    supportEmail
      ? `<p style="color: #666; font-size: 14px;">If you have any questions or did not authorize this cancellation, please contact us immediately at <a href="mailto:${supportEmail}" style="color: #c53030;">${supportEmail}</a></p>`
      : ""
  }
  </div>
</body>
</html>
`.trim();

  const text = `
Order Cancelled - ${orderNumber}

Hi ${userName},

${
    cancelledBy === "user"
      ? `As requested, your order ${orderNumber} has been cancelled.`
      : `Your order ${orderNumber} has been cancelled.`
  }

${reason ? `Reason: ${reason}` : ""}

${refundStatus ? `Refund Status: ${refundStatus}` : ""}

${orderUrl ? `View order details: ${orderUrl}` : ""}

${
    supportEmail
      ? `If you have any questions, please contact us at ${supportEmail}`
      : ""
  }
`.trim();

  return { subject, html, text };
}
