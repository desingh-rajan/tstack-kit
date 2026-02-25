/**
 * API Client for Storefront
 * Handles all API communication with the backend
 */

// Guard against browser-side access (islands run in client where Deno is unavailable)
const isDeno = typeof Deno !== "undefined";

const API_BASE_URL = isDeno
  ? Deno.env.get("API_BASE_URL") || "http://localhost:8000"
  : "http://localhost:8000";

// For SSR, prefer internal Docker network to avoid public URL roundtrip
// This prevents timeout issues when frontend containers call API via external URL
const API_INTERNAL_URL = isDeno ? Deno.env.get("API_INTERNAL_URL") : undefined;
const SSR_API_URL = API_INTERNAL_URL || API_BASE_URL;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ path?: string[]; message?: string }>;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
}

export class ApiClient {
  private baseUrl: string;
  private token?: string;
  private guestId?: string;

  constructor(baseUrl?: string, token?: string) {
    this.baseUrl = baseUrl || SSR_API_URL;
    this.token = token;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = undefined;
  }

  setGuestId(id: string) {
    this.guestId = id;
  }

  clearGuestId() {
    this.guestId = undefined;
  }

  /**
   * Create a new client instance with the specified token
   */
  withToken(token: string): ApiClient {
    return new ApiClient(this.baseUrl, token);
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { method = "GET", body, token, headers = {} } = options;

    const authToken = token || this.token;
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    if (this.guestId) {
      headers["X-Guest-Id"] = this.guestId;
    }

    if (body && method !== "GET") {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30_000),
      });

      const data = await response.json();

      if (!response.ok) {
        // Format validation errors if present
        let errorMessage = data.message || data.error ||
          `HTTP ${response.status}`;
        if (
          data.errors && Array.isArray(data.errors) && data.errors.length > 0
        ) {
          const fieldErrors = data.errors
            .map((e: { path?: string[]; message?: string }) => {
              const field = e.path?.join(".") || "field";
              return `${field}: ${e.message || "invalid"}`;
            })
            .join(", ");
          errorMessage = fieldErrors || errorMessage;
        }
        return {
          success: false,
          error: errorMessage,
          message: data.message,
          errors: data.errors,
        };
      }

      return {
        success: true,
        data: data.data !== undefined ? data.data : data,
        message: data.message,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") {
        return {
          success: false,
          error:
            "Request timed out. The server may be busy -- please try again.",
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  // Auth endpoints
  login(email: string, password: string) {
    return this.request<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  }

  register(data: RegisterData) {
    return this.request<{ user: User; message: string }>("/auth/register", {
      method: "POST",
      body: data,
    });
  }

  verifyEmail(token: string) {
    return this.request<{ message: string }>(
      `/auth/verify-email?token=${encodeURIComponent(token)}`,
    );
  }

  forgotPassword(email: string) {
    return this.request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
  }

  resetPassword(token: string, password: string) {
    return this.request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: { token, password },
    });
  }

  resendVerification() {
    return this.request<{ message: string }>("/auth/resend-verification", {
      method: "POST",
    });
  }

  getProfile() {
    return this.request<User>("/users/me/profile");
  }

  updateProfile(data: UpdateProfileData) {
    return this.request<User>("/users/me/profile", {
      method: "PUT",
      body: data,
    });
  }

  // Addresses
  getAddresses() {
    return this.request<Address[]>("/addresses");
  }

  createAddress(data: CreateAddressData) {
    return this.request<Address>("/addresses", {
      method: "POST",
      body: data,
    });
  }

  updateAddress(id: string, data: Partial<CreateAddressData>) {
    return this.request<Address>(`/addresses/${id}`, {
      method: "PATCH",
      body: data,
    });
  }

  deleteAddress(id: string) {
    return this.request<void>(`/addresses/${id}`, {
      method: "DELETE",
    });
  }

  setDefaultAddress(id: string) {
    return this.request<Address>(`/addresses/${id}/default`, {
      method: "POST",
    });
  }

  // Cart
  getCart() {
    return this.request<Cart>("/cart");
  }

  addToCart(productId: string, quantity: number, variantId?: string) {
    return this.request<Cart>("/cart/items", {
      method: "POST",
      body: { productId, quantity, variantId },
    });
  }

  updateCartItem(itemId: string, quantity: number) {
    return this.request<Cart>(`/cart/items/${itemId}`, {
      method: "PUT",
      body: { quantity },
    });
  }

  removeCartItem(itemId: string) {
    return this.request<Cart>(`/cart/items/${itemId}`, {
      method: "DELETE",
    });
  }

  clearCart() {
    return this.request<void>("/cart", {
      method: "DELETE",
    });
  }

  // Orders
  createOrder(data: CreateOrderData) {
    return this.request<Order>("/checkout/create", {
      method: "POST",
      body: data,
    });
  }

  getOrders() {
    return this.request<Order[]>("/orders");
  }

  getOrder(id: string) {
    return this.request<Order>(`/orders/${id}`);
  }

  cancelOrder(id: string) {
    return this.request<Order>(`/orders/${id}/cancel`, {
      method: "POST",
    });
  }

  // Guest checkout
  validateGuestCheckout(data: { guestEmail: string }) {
    return this.request<{ valid: boolean }>("/checkout/guest/validate", {
      method: "POST",
      body: data,
    });
  }

  createGuestOrder(data: CreateGuestOrderData) {
    return this.request<Order>("/checkout/guest/create", {
      method: "POST",
      body: data,
    });
  }

  trackOrder(orderNumber: string, email: string) {
    return this.request<TrackOrderResponse>("/orders/track", {
      method: "POST",
      body: { orderNumber, email },
    });
  }

  getGuestOrderForPayment(orderId: string, email: string) {
    return this.request<Order>(
      `/checkout/guest/order/${orderId}?email=${encodeURIComponent(email)}`,
    );
  }

  // Guest payments
  createGuestPaymentOrder(orderId: string, email: string) {
    return this.request<PaymentOrderResponse>("/payments/guest/create-order", {
      method: "POST",
      body: { orderId, email },
    });
  }

  verifyGuestPayment(data: VerifyPaymentData & { email: string }) {
    return this.request<{ success: boolean; message: string }>(
      "/payments/guest/verify",
      {
        method: "POST",
        body: data,
      },
    );
  }

  // Payments
  createPaymentOrder(orderId: string) {
    return this.request<PaymentOrderResponse>("/payments/create-order", {
      method: "POST",
      body: { orderId },
    });
  }

  verifyPayment(data: VerifyPaymentData) {
    return this.request<{ success: boolean; message: string }>(
      "/payments/verify",
      {
        method: "POST",
        body: data,
      },
    );
  }

  // Products
  getProducts(params?: ProductQueryParams) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<{ items: Product[]; total: number }>(
      `/products${query ? `?${query}` : ""}`,
    );
  }

  getProduct(id: string) {
    return this.request<Product>(`/products/${id}`);
  }

  getProductBySlug(slug: string) {
    return this.request<Product>(`/products/slug/${slug}`);
  }

  // Categories
  getCategories() {
    return this.request<Category[]>("/categories");
  }
}

// Types
export interface User {
  id: number;
  email: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName?: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressData {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    compareAtPrice?: string;
    images?: { url: string }[];
  };
  variant?: {
    id: string;
    name: string;
    price?: string;
    sku?: string;
  };
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  shippingAddressId: string;
  billingAddressId?: string;
  paymentMethod: "razorpay" | "cod";
  customerNotes?: string;
}

export interface GuestAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

export interface CreateGuestOrderData {
  guestEmail: string;
  shippingAddress: GuestAddress;
  billingAddress?: GuestAddress;
  useSameAddress?: boolean;
  paymentMethod: "razorpay" | "cod";
  customerNotes?: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  sku?: string;
  quantity: number;
  price: string;
  totalPrice: string;
  productImage?: string;
}

export interface Order {
  id: string;
  userId: string | null;
  orderNumber: string;
  isGuest?: boolean;
  guestEmail?: string | null;
  guestPhone?: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  subtotal: string;
  taxAmount: string;
  shippingAmount: string;
  discountAmount: string;
  totalAmount: string;
  items: OrderItem[];
  shippingAddressSnapshot: Address;
  billingAddressSnapshot?: Address;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackOrderResponse {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: string;
  paymentMethod: string | null;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  } | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentOrderResponse {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
  orderNumber?: string;
  prefill?: {
    email?: string;
    contact?: string;
  };
}

export interface VerifyPaymentData {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: string;
  compareAtPrice?: string;
  sku?: string;
  stockQuantity: number;
  isActive: boolean;
  categoryId?: string;
  brandId?: string;
  images?: { id: string; url: string; alt?: string; position: number }[];
  variants?: {
    id: string;
    name: string;
    sku?: string;
    price?: string;
    stock: number;
  }[];
  category?: Category;
  brand?: { id: string; name: string; slug: string };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  children?: Category[];
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Factory function to create per-request API client instances.
// This prevents auth token leakage between concurrent SSR requests
// that would occur with a shared singleton.
export function createApiClient(token?: string, guestId?: string): ApiClient {
  const client = new ApiClient(SSR_API_URL, token);
  if (guestId) client.setGuestId(guestId);
  return client;
}

// Singleton instance for backward compatibility in islands/client-side code.
// WARNING: Do not use this singleton in SSR route handlers -- use createApiClient()
// or ctx.state.api instead to prevent auth leakage between requests.
export const api = new ApiClient(SSR_API_URL);

// Export URLs for use in other modules
export { API_BASE_URL, SSR_API_URL };
