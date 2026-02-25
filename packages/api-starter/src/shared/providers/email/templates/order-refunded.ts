/**
 * Order Refunded Email Template
 *
 * Sent to the customer when their order refund has been processed.
 */

import {
  bodyStyles,
  containerStyles,
  type EmailTemplate,
  getHeader,
} from "./shared.ts";

export interface OrderRefundedEmailData {
  userName: string;
  orderNumber: string;
  refundAmount: string;
  reason?: string;
  refundId?: string;
  paymentMethod?: string;
  transactionRef?: string;
  appName: string;
  storeUrl: string;
  supportEmail?: string;
}

export function orderRefundedEmailTemplate(
  data: OrderRefundedEmailData,
): EmailTemplate {
  const {
    userName,
    orderNumber,
    refundAmount,
    reason,
    refundId,
    paymentMethod,
    transactionRef,
    appName,
    storeUrl,
    supportEmail,
  } = data;

  const isManualRefund = paymentMethod && paymentMethod !== "razorpay";

  const subject = `Refund Processed - ${orderNumber} | ${appName}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${bodyStyles}">
  ${getHeader(storeUrl, appName)}

  <div style="${containerStyles}">
    <h2 style="color: #333; margin-bottom: 20px;">Refund Processed</h2>

    <p>Hi ${userName},</p>
    <p>Your refund for order <strong>${orderNumber}</strong> has been processed.</p>

    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #166534;">
        Refund Amount: ${refundAmount}
      </p>
    </div>

    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
    ${refundId ? `<p><strong>Refund ID:</strong> ${refundId}</p>` : ""}
    ${
    transactionRef
      ? `<p><strong>Transaction Reference:</strong> ${transactionRef}</p>`
      : ""
  }

    <p style="color: #666; font-size: 14px; margin-top: 20px;">
      ${
    isManualRefund
      ? "The refund has been processed via your original payment method."
      : "The refund will reflect in your account within 3-5 business days."
  }
    </p>

    ${
    supportEmail
      ? `<p style="color: #666; font-size: 14px;">If you have any questions, contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>`
      : ""
  }

    <div style="text-align: center; margin-top: 30px;">
      <a href="${storeUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Continue Shopping
      </a>
    </div>
  </div>
</body>
</html>`;

  const text = `
Refund Processed - ${orderNumber}

Hi ${userName},

Your refund for order ${orderNumber} has been processed.

Refund Amount: ${refundAmount}
${reason ? `Reason: ${reason}` : ""}
${refundId ? `Refund ID: ${refundId}` : ""}
${transactionRef ? `Transaction Reference: ${transactionRef}` : ""}

${
    isManualRefund
      ? "The refund has been processed via your original payment method."
      : "The refund will reflect in your account within 3-5 business days."
  }

${supportEmail ? `Questions? Contact us at ${supportEmail}` : ""}

Visit ${storeUrl} to continue shopping.
`.trim();

  return { subject, html, text };
}
