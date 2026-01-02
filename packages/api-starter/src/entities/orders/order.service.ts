import { and, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import { db } from "../../config/database.ts";
import {
  type AddressSnapshot,
  type Order,
  orders,
  type OrderStatus,
  type PaymentStatus,
} from "./order.model.ts";
import { type NewOrderItem, orderItems } from "./order-item.model.ts";
import { carts } from "../carts/cart.model.ts";
import { cartItems } from "../carts/cart-item.model.ts";
import { products } from "../products/product.model.ts";
import { productVariants } from "../product_variants/product-variant.model.ts";
import { productImages } from "../product_images/product-image.model.ts";
import { addresses } from "../addresses/address.model.ts";
import { BadRequestError, NotFoundError } from "../../shared/utils/errors.ts";
import type {
  CheckoutValidationResponse,
  CreateOrderDTO,
  OrderListQueryDTO,
  OrderListResponseDTO,
  OrderResponseDTO,
  OrderSummaryDTO,
  StockIssue,
} from "./order.dto.ts";

// Constants
const FREE_SHIPPING_THRESHOLD = 999; // Free shipping above 999 INR
const SHIPPING_COST = 49; // Flat shipping cost in INR
const TAX_RATE = 0.18; // 18% GST

/**
 * Order Service
 *
 * Handles order operations including:
 * - Checkout validation
 * - Order creation from cart
 * - Order number generation
 * - Address snapshots
 * - Order history
 * - Status management
 */
export class OrderService {
  /**
   * Generate unique order number
   * Format: SC-YYYYMMDD-XXXXX (e.g., SC-20260107-00001)
   */
  async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, "");

    // Get today's order count
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const todayOrders = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startOfDay),
          lte(orders.createdAt, endOfDay),
        ),
      );

    const sequence = String((todayOrders[0]?.count || 0) + 1).padStart(5, "0");
    return `SC-${date}-${sequence}`;
  }

  /**
   * Validate checkout before creating order
   */
  async validateCheckout(
    userId: number,
    shippingAddressId: string,
    billingAddressId?: string,
    useSameAddress = true,
  ): Promise<CheckoutValidationResponse> {
    // Get user's active cart
    const cart = await db
      .select()
      .from(carts)
      .where(
        and(
          eq(carts.userId, userId),
          eq(carts.status, "active"),
        ),
      )
      .limit(1);

    if (cart.length === 0) {
      throw new BadRequestError("No active cart found");
    }

    // Get cart items
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart[0].id));

    if (items.length === 0) {
      throw new BadRequestError("Cart is empty");
    }

    // Validate shipping address
    const shippingAddress = await this.getAddressSnapshot(
      shippingAddressId,
      userId,
    );
    if (!shippingAddress) {
      throw new BadRequestError("Shipping address not found");
    }

    // Validate billing address
    let billingAddress: AddressSnapshot | null = null;
    if (!useSameAddress && billingAddressId) {
      billingAddress = await this.getAddressSnapshot(billingAddressId, userId);
      if (!billingAddress) {
        throw new BadRequestError("Billing address not found");
      }
    } else {
      billingAddress = shippingAddress;
    }

    // Validate stock and calculate totals
    const stockIssues: StockIssue[] = [];
    let subtotal = 0;
    let itemCount = 0;

    for (const item of items) {
      // Get product
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (
        product.length === 0 || !product[0].isActive || product[0].deletedAt
      ) {
        stockIssues.push({
          itemId: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: "Unknown product",
          requested: item.quantity,
          available: 0,
          issue: "product_unavailable",
        });
        continue;
      }

      // Get variant if exists
      let variant = null;
      if (item.variantId) {
        const variantResult = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.id, item.variantId))
          .limit(1);

        if (variantResult.length > 0 && variantResult[0].isActive) {
          variant = variantResult[0];
        }
      }

      const availableStock = variant?.stockQuantity ?? product[0].stockQuantity;
      const currentPrice = parseFloat(variant?.price ?? product[0].price);

      if (availableStock === 0) {
        stockIssues.push({
          itemId: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: product[0].name,
          requested: item.quantity,
          available: 0,
          issue: "out_of_stock",
        });
      } else if (availableStock < item.quantity) {
        stockIssues.push({
          itemId: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: product[0].name,
          requested: item.quantity,
          available: availableStock,
          issue: "insufficient_stock",
        });
      }

      subtotal += currentPrice * item.quantity;
      itemCount += item.quantity;
    }

    // Calculate shipping
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingAmount = isFreeShipping ? 0 : SHIPPING_COST;

    // Calculate tax (on subtotal)
    const taxAmount = subtotal * TAX_RATE;

    // Calculate total
    const totalAmount = subtotal + shippingAmount + taxAmount;

    return {
      valid: stockIssues.length === 0,
      cart: {
        id: cart[0].id,
        itemCount,
        uniqueItemCount: items.length,
        subtotal: subtotal.toFixed(2),
      },
      shipping: {
        amount: shippingAmount.toFixed(2),
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD.toFixed(2),
        isFreeShipping,
      },
      tax: {
        rate: (TAX_RATE * 100).toFixed(0) + "%",
        amount: taxAmount.toFixed(2),
      },
      discount: {
        amount: "0.00", // Discount codes to be implemented later
        code: undefined,
      },
      totals: {
        subtotal: subtotal.toFixed(2),
        shipping: shippingAmount.toFixed(2),
        tax: taxAmount.toFixed(2),
        discount: "0.00",
        total: totalAmount.toFixed(2),
      },
      issues: stockIssues,
      shippingAddress,
      billingAddress,
    };
  }

  /**
   * Create order from cart
   */
  async createOrder(
    userId: number,
    data: CreateOrderDTO,
  ): Promise<OrderResponseDTO> {
    const billingAddressId = data.useSameAddress
      ? data.shippingAddressId
      : (data.billingAddressId ?? data.shippingAddressId);

    // Validate checkout first
    const validation = await this.validateCheckout(
      userId,
      data.shippingAddressId,
      billingAddressId,
      data.useSameAddress,
    );

    if (!validation.valid) {
      throw new BadRequestError(
        `Cannot create order: ${
          validation.issues.map((i) => i.productName + " - " + i.issue).join(
            ", ",
          )
        }`,
      );
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Get cart with items for creating order items
    const cart = await db
      .select()
      .from(carts)
      .where(
        and(
          eq(carts.userId, userId),
          eq(carts.status, "active"),
        ),
      )
      .limit(1);

    const cartItemsList = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart[0].id));

    // Create order
    const orderResult = await db
      .insert(orders)
      .values({
        orderNumber,
        userId,
        subtotal: validation.totals.subtotal,
        taxAmount: validation.totals.tax,
        shippingAmount: validation.totals.shipping,
        discountAmount: validation.totals.discount,
        totalAmount: validation.totals.total,
        status: "pending",
        paymentStatus: "pending",
        shippingAddressId: data.shippingAddressId,
        billingAddressId,
        shippingAddressSnapshot: validation.shippingAddress,
        billingAddressSnapshot: validation.billingAddress,
        paymentMethod: data.paymentMethod,
        customerNotes: data.customerNotes,
      })
      .returning();

    const order = orderResult[0];

    // Create order items with product snapshots
    const orderItemsData: NewOrderItem[] = [];

    for (const item of cartItemsList) {
      // Get product details
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      // Get primary image
      const image = await db
        .select()
        .from(productImages)
        .where(
          and(
            eq(productImages.productId, item.productId),
            eq(productImages.isPrimary, true),
          ),
        )
        .limit(1);

      // Get variant if exists
      let variant = null;
      if (item.variantId) {
        const variantResult = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.id, item.variantId))
          .limit(1);
        if (variantResult.length > 0) {
          variant = variantResult[0];
        }
      }

      const price = variant?.price ?? product[0].price;
      const totalPrice = (parseFloat(price) * item.quantity).toFixed(2);

      // Build variant name from options
      let variantName = null;
      if (variant?.options) {
        const options = variant.options as Record<string, string>;
        variantName = Object.entries(options)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");
      }

      orderItemsData.push({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: product[0].name,
        variantName,
        sku: variant?.sku ?? product[0].sku,
        productImage: image.length > 0 ? image[0].url : null,
        price,
        quantity: item.quantity,
        totalPrice,
      });

      // Reduce stock
      if (variant) {
        await db
          .update(productVariants)
          .set({
            stockQuantity:
              sql`${productVariants.stockQuantity} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(productVariants.id, variant.id));
      } else {
        await db
          .update(products)
          .set({
            stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }
    }

    // Insert order items
    await db.insert(orderItems).values(orderItemsData);

    // Mark cart as converted
    await db
      .update(carts)
      .set({
        status: "converted",
        updatedAt: new Date(),
      })
      .where(eq(carts.id, cart[0].id));

    // Return order details
    return this.getOrderById(order.id, userId);
  }

  /**
   * Get order by ID
   */
  async getOrderById(
    orderId: string,
    userId?: number,
  ): Promise<OrderResponseDTO> {
    const conditions = [eq(orders.id, orderId)];
    if (userId) {
      conditions.push(eq(orders.userId, userId));
    }

    const order = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .limit(1);

    if (order.length === 0) {
      throw new NotFoundError("Order not found");
    }

    // Get order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    return {
      id: order[0].id,
      orderNumber: order[0].orderNumber,
      userId: order[0].userId,
      status: order[0].status as OrderStatus,
      paymentStatus: order[0].paymentStatus as PaymentStatus,
      subtotal: order[0].subtotal,
      taxAmount: order[0].taxAmount,
      shippingAmount: order[0].shippingAmount,
      discountAmount: order[0].discountAmount,
      totalAmount: order[0].totalAmount,
      paymentMethod: order[0].paymentMethod,
      razorpayOrderId: order[0].razorpayOrderId,
      customerNotes: order[0].customerNotes,
      shippingAddress: order[0].shippingAddressSnapshot as
        | AddressSnapshot
        | null,
      billingAddress: order[0].billingAddressSnapshot as AddressSnapshot | null,
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        productImage: item.productImage,
      })),
      createdAt: order[0].createdAt,
      updatedAt: order[0].updatedAt,
    };
  }

  /**
   * Get user's order history
   */
  async getUserOrders(
    userId: number,
    query: OrderListQueryDTO,
  ): Promise<OrderListResponseDTO> {
    const { page, limit, status, paymentStatus, startDate, endDate, search } =
      query;
    const offset = (page - 1) * limit;

    const conditions = [eq(orders.userId, userId)];

    if (status) {
      conditions.push(eq(orders.status, status));
    }
    if (paymentStatus) {
      conditions.push(eq(orders.paymentStatus, paymentStatus));
    }
    if (startDate) {
      conditions.push(gte(orders.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(orders.createdAt, new Date(endDate)));
    }
    if (search) {
      conditions.push(ilike(orders.orderNumber, `%${search}%`));
    }

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(...conditions));

    const total = Number(totalResult[0]?.count || 0);

    // Get orders
    const ordersList = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    // Get item counts for each order
    const orderSummaries: OrderSummaryDTO[] = await Promise.all(
      ordersList.map(async (order) => {
        const itemsResult = await db
          .select({ count: sql<number>`sum(quantity)` })
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status as OrderStatus,
          paymentStatus: order.paymentStatus as PaymentStatus,
          totalAmount: order.totalAmount,
          itemCount: Number(itemsResult[0]?.count || 0),
          createdAt: order.createdAt,
        };
      }),
    );

    return {
      orders: orderSummaries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cancel order (user or admin)
   */
  async cancelOrder(
    orderId: string,
    userId?: number,
  ): Promise<OrderResponseDTO> {
    const conditions = [eq(orders.id, orderId)];
    if (userId) {
      conditions.push(eq(orders.userId, userId));
    }

    const order = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .limit(1);

    if (order.length === 0) {
      throw new NotFoundError("Order not found");
    }

    // Only allow cancellation of pending or confirmed orders
    if (!["pending", "confirmed"].includes(order[0].status)) {
      throw new BadRequestError(
        `Cannot cancel order with status "${order[0].status}"`,
      );
    }

    // Restore stock
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      if (item.variantId) {
        await db
          .update(productVariants)
          .set({
            stockQuantity:
              sql`${productVariants.stockQuantity} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(productVariants.id, item.variantId));
      } else {
        await db
          .update(products)
          .set({
            stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }
    }

    // Update order status
    await db
      .update(orders)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    return this.getOrderById(orderId);
  }

  /**
   * Update order status (admin only)
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    adminNotes?: string,
  ): Promise<OrderResponseDTO> {
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      throw new NotFoundError("Order not found");
    }

    // Validate status transition
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: ["refunded"],
      cancelled: [],
      refunded: [],
    };

    const currentStatus = order[0].status as OrderStatus;
    if (!validTransitions[currentStatus].includes(status)) {
      throw new BadRequestError(
        `Cannot transition from "${currentStatus}" to "${status}"`,
      );
    }

    // If cancelling, restore stock
    if (status === "cancelled") {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      for (const item of items) {
        if (item.variantId) {
          await db
            .update(productVariants)
            .set({
              stockQuantity:
                sql`${productVariants.stockQuantity} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(productVariants.id, item.variantId));
        } else {
          await db
            .update(products)
            .set({
              stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));
        }
      }
    }

    // Update order
    const updateData: Partial<Order> = {
      status,
      updatedAt: new Date(),
    };

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId));

    return this.getOrderById(orderId);
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    razorpayPaymentId?: string,
  ): Promise<void> {
    const updateData: Partial<Order> = {
      paymentStatus,
      updatedAt: new Date(),
    };

    if (razorpayPaymentId) {
      updateData.razorpayPaymentId = razorpayPaymentId;
    }

    // If payment successful, update order status to confirmed
    if (paymentStatus === "paid") {
      updateData.status = "confirmed";
    }

    await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId));
  }

  /**
   * Set Razorpay order ID
   */
  async setRazorpayOrderId(
    orderId: string,
    razorpayOrderId: string,
  ): Promise<void> {
    await db
      .update(orders)
      .set({
        razorpayOrderId,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
  }

  /**
   * Get all orders (admin)
   */
  async getAllOrders(query: OrderListQueryDTO): Promise<OrderListResponseDTO> {
    const { page, limit, status, paymentStatus, startDate, endDate, search } =
      query;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (status) {
      conditions.push(eq(orders.status, status));
    }
    if (paymentStatus) {
      conditions.push(eq(orders.paymentStatus, paymentStatus));
    }
    if (startDate) {
      conditions.push(gte(orders.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(orders.createdAt, new Date(endDate)));
    }
    if (search) {
      conditions.push(ilike(orders.orderNumber, `%${search}%`));
    }

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(totalResult[0]?.count || 0);

    // Get orders
    const ordersList = await db
      .select()
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    // Get item counts for each order
    const orderSummaries: OrderSummaryDTO[] = await Promise.all(
      ordersList.map(async (order) => {
        const itemsResult = await db
          .select({ count: sql<number>`sum(quantity)` })
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status as OrderStatus,
          paymentStatus: order.paymentStatus as PaymentStatus,
          totalAmount: order.totalAmount,
          itemCount: Number(itemsResult[0]?.count || 0),
          createdAt: order.createdAt,
        };
      }),
    );

    return {
      orders: orderSummaries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get address snapshot
   */
  private async getAddressSnapshot(
    addressId: string,
    userId: number,
  ): Promise<AddressSnapshot | null> {
    const address = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.id, addressId),
          eq(addresses.userId, userId),
        ),
      )
      .limit(1);

    if (address.length === 0) {
      return null;
    }

    return {
      id: address[0].id,
      label: address[0].label ?? undefined,
      fullName: address[0].fullName,
      phone: address[0].phone,
      addressLine1: address[0].addressLine1,
      addressLine2: address[0].addressLine2 ?? undefined,
      city: address[0].city,
      state: address[0].state,
      postalCode: address[0].postalCode,
      country: address[0].country,
    };
  }
}

// Singleton instance
export const orderService = new OrderService();
