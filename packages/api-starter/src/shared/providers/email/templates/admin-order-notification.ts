/**
 * Admin Order Notification Email Template
 *
 * Sent to admin(s) when order events occur (new order, refund, cancellation).
 */

import {
  bodyStyles,
  containerStyles,
  type EmailTemplate,
  formatCurrency,
  getHeader,
} from "./shared.ts";

export interface AdminOrderNotificationEmailData {
  eventType: "new_order" | "refund" | "cancellation";
  orderNumber: string;
  customerEmail: string;
  customerName?: string;
  totalAmount: string;
  reason?: string;
  refundId?: string;
  transactionRef?: string;
  paymentMethod?: string;
  items?: Array<{
    name: string;
    variant?: string;
    quantity: number;
    price: number;
  }>;
  appName: string;
  storeUrl: string;
}

function getEventTitle(
  eventType: AdminOrderNotificationEmailData["eventType"],
): {
  title: string;
  color: string;
  icon: string;
} {
  switch (eventType) {
    case "new_order":
      return { title: "New Order Received", color: "#22c55e", icon: "+" };
    case "refund":
      return { title: "Order Refund Processed", color: "#f59e0b", icon: "!" };
    case "cancellation":
      return { title: "Order Cancelled", color: "#ef4444", icon: "x" };
  }
}

export function adminOrderNotificationEmailTemplate(
  data: AdminOrderNotificationEmailData,
): EmailTemplate {
  const {
    eventType,
    orderNumber,
    customerEmail,
    customerName,
    totalAmount,
    reason,
    refundId,
    transactionRef,
    paymentMethod,
    items,
    appName,
    storeUrl,
  } = data;

  const { title, color } = getEventTitle(eventType);

  const subject = `[Admin] ${title} - ${orderNumber} | ${appName}`;

  const itemsHtml = items && items.length > 0
    ? `
    <div style="margin: 20px 0; border: 1px solid #e0e0e0; border-radius: 5px; overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e0e0e0;">Item</th>
            <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e0e0e0;">Qty</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e0e0e0;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${
      items.map((item) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">
                ${item.name}${
        item.variant
          ? ` <span style="color:#666;">(${item.variant})</span>`
          : ""
      }
              </td>
              <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${
        formatCurrency(item.price)
      }</td>
            </tr>
          `).join("")
    }
        </tbody>
      </table>
    </div>
  `
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${bodyStyles}">
  ${getHeader(storeUrl, appName)}

  <div style="${containerStyles}">
    <div style="background: ${color}15; padding: 15px; border-radius: 8px; border-left: 4px solid ${color}; margin-bottom: 20px;">
      <h2 style="color: ${color}; margin: 0;">${title}</h2>
    </div>

    <table style="width: 100%; margin: 20px 0;">
      <tr>
        <td style="padding: 8px 0; color: #666;">Order Number:</td>
        <td style="padding: 8px 0; font-weight: bold;">${orderNumber}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Customer:</td>
        <td style="padding: 8px 0;">${customerName || "-"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Email:</td>
        <td style="padding: 8px 0;">${customerEmail}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Amount:</td>
        <td style="padding: 8px 0; font-weight: bold;">${totalAmount}</td>
      </tr>
      ${
    paymentMethod
      ? `<tr><td style="padding: 8px 0; color: #666;">Payment Method:</td><td style="padding: 8px 0;">${paymentMethod}</td></tr>`
      : ""
  }
    </table>

    ${itemsHtml}

    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
    ${refundId ? `<p><strong>Refund ID:</strong> ${refundId}</p>` : ""}
    ${
    transactionRef
      ? `<p><strong>Transaction Ref:</strong> ${transactionRef}</p>`
      : ""
  }
  </div>
</body>
</html>`;

  const text = `
[Admin] ${title} - ${orderNumber}

Order Number: ${orderNumber}
Customer: ${customerName || "-"}
Email: ${customerEmail}
Amount: ${totalAmount}
${paymentMethod ? `Payment Method: ${paymentMethod}` : ""}
${reason ? `Reason: ${reason}` : ""}
${refundId ? `Refund ID: ${refundId}` : ""}
${transactionRef ? `Transaction Ref: ${transactionRef}` : ""}

${
    items
      ? items.map((i) =>
        `- ${i.name}${i.variant ? ` (${i.variant})` : ""} x${i.quantity} - ${
          formatCurrency(i.price)
        }`
      ).join("\n")
      : ""
  }
`.trim();

  return { subject, html, text };
}
