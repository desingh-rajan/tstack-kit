/**
 * Order Types for Admin UI
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface AddressSnapshot {
  id: string;
  label?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string | null;
  price: string;
  quantity: number;
  totalPrice: string;
  productImage?: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: number;
  subtotal: string;
  taxAmount: string;
  shippingAmount: string;
  discountAmount: string;
  totalAmount: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  shippingAddressId: string | null;
  billingAddressId: string | null;
  shippingAddressSnapshot: AddressSnapshot | null;
  billingAddressSnapshot: AddressSnapshot | null;
  customerNotes: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  items?: OrderItem[];
  itemCount?: number;
  user?: {
    id: number;
    email: string;
  };
}

export interface OrderListResponse {
  success: boolean;
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  adminNotes?: string;
}
