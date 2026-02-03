/**
 * Shared Email Template Utilities
 *
 * Common styles and components used across email templates.
 */

/**
 * Get the email header with app branding
 */
export function getHeader(appUrl: string, appName: string): string {
  return `
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <a href="${appUrl}" style="color: white; text-decoration: none;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1px;">${appName}</h1>
    </a>
  </div>
  `.trim();
}

/**
 * Body styles for email wrapper
 */
export const bodyStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f5f5;
`.trim().replace(/\n/g, " ");

/**
 * Container styles for main content area
 */
export const containerStyles = `
  background: #ffffff;
  padding: 30px;
  border: 1px solid #e0e0e0;
  border-top: none;
  border-radius: 0 0 10px 10px;
`.trim().replace(/\n/g, " ");

/**
 * Format currency for emails
 */
export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Email template result type
 */
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Shared order item type
 */
export interface OrderItemData {
  name: string;
  quantity: number;
  price: number;
  variant?: string;
}

/**
 * Shared shipping address type
 */
export interface ShippingAddressData {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Generate items table HTML for order emails
 */
export function generateItemsTableHtml(
  items: OrderItemData[],
  currency = "INR",
): string {
  if (!items || items.length === 0) return "";

  return `
    <div style="margin: 20px 0; border: 1px solid #e0e0e0; border-radius: 5px; overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0;">Item</th>
            <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e0e0e0;">Qty</th>
            <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e0e0e0;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${
    items.map((item) => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
              <div style="font-weight: 500;">${item.name}</div>
              ${
      item.variant
        ? `<div style="font-size: 12px; color: #666;">${item.variant}</div>`
        : ""
    }
            </td>
            <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">${
      formatCurrency(item.price, currency)
    }</td>
          </tr>
          `).join("")
  }
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Generate items text for plain-text emails
 */
export function generateItemsText(
  items: OrderItemData[],
  currency = "INR",
): string {
  if (!items || items.length === 0) return "";

  return `
ORDER ITEMS:
${
    items.map((item) =>
      `- ${item.name}${
        item.variant ? ` (${item.variant})` : ""
      } x ${item.quantity} - ${formatCurrency(item.price, currency)}`
    ).join("\n")
  }
`.trim();
}

/**
 * Format shipping address as HTML
 */
export function formatAddressHtml(address: ShippingAddressData): string {
  return `
    <p style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
      ${address.fullName}<br>
      ${address.addressLine1}<br>
      ${address.addressLine2 ? `${address.addressLine2}<br>` : ""}
      ${address.city}, ${address.state} ${address.postalCode}<br>
      ${address.country}
    </p>
  `;
}

/**
 * Format shipping address as plain text
 */
export function formatAddressText(address: ShippingAddressData): string {
  return [
    address.fullName,
    address.addressLine1,
    address.addressLine2,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country,
  ]
    .filter(Boolean)
    .join("\n");
}
