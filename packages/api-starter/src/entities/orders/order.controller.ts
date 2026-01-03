import { Context } from "hono";
import { orderService } from "./order.service.ts";
import { BadRequestError } from "../../shared/utils/errors.ts";
import {
  CheckoutValidateSchema,
  CreateOrderSchema,
  OrderListQuerySchema,
  UpdateOrderStatusSchema,
} from "./order.dto.ts";

/**
 * Order Controller
 *
 * Handles HTTP requests for order operations
 */
export class OrderController {
  /**
   * POST /checkout/validate - Validate cart before checkout
   */
  async validateCheckout(c: Context) {
    const user = c.get("user");
    if (!user?.id) {
      throw new BadRequestError("Authentication required");
    }

    // Check email verification
    if (!user.isEmailVerified) {
      throw new BadRequestError("Please verify your email before checkout");
    }

    const body = await c.req.json();
    const parseResult = CheckoutValidateSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestError(
        parseResult.error.errors.map((e: { message: string }) => e.message)
          .join(", "),
      );
    }

    const validation = await orderService.validateCheckout(
      user.id,
      parseResult.data.shippingAddressId,
      parseResult.data.billingAddressId,
      parseResult.data.useSameAddress,
    );

    return c.json({
      success: true,
      data: validation,
    });
  }

  /**
   * POST /checkout/create - Create order from cart
   */
  async createOrder(c: Context) {
    const user = c.get("user");
    if (!user?.id) {
      throw new BadRequestError("Authentication required");
    }

    // Check email verification
    if (!user.isEmailVerified) {
      throw new BadRequestError("Please verify your email before checkout");
    }

    const body = await c.req.json();
    const parseResult = CreateOrderSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestError(
        parseResult.error.errors.map((e: { message: string }) => e.message)
          .join(", "),
      );
    }

    const order = await orderService.createOrder(user.id, parseResult.data);

    // TODO: If payment method is razorpay, create Razorpay order
    // and include Razorpay details in response

    return c.json({
      success: true,
      message: "Order created successfully",
      data: order,
    }, 201);
  }

  /**
   * GET /orders - Get user's order history
   */
  async listOrders(c: Context) {
    const user = c.get("user");
    if (!user?.id) {
      throw new BadRequestError("Authentication required");
    }

    const query = c.req.query();
    const parseResult = OrderListQuerySchema.safeParse(query);
    if (!parseResult.success) {
      throw new BadRequestError(
        parseResult.error.errors.map((e: { message: string }) => e.message)
          .join(", "),
      );
    }

    const orders = await orderService.getUserOrders(user.id, parseResult.data);

    return c.json({
      success: true,
      data: orders,
    });
  }

  /**
   * GET /orders/:id - Get order details
   */
  async getOrder(c: Context) {
    const user = c.get("user");
    if (!user?.id) {
      throw new BadRequestError("Authentication required");
    }

    const orderId = c.req.param("id");
    if (!orderId) {
      throw new BadRequestError("Order ID is required");
    }

    const order = await orderService.getOrderById(orderId, user.id);

    return c.json({
      success: true,
      data: order,
    });
  }

  /**
   * POST /orders/:id/cancel - Cancel order
   */
  async cancelOrder(c: Context) {
    const user = c.get("user");
    if (!user?.id) {
      throw new BadRequestError("Authentication required");
    }

    const orderId = c.req.param("id");
    if (!orderId) {
      throw new BadRequestError("Order ID is required");
    }

    const order = await orderService.cancelOrder(orderId, user.id);

    return c.json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  }
}

/**
 * Admin Order Controller
 */
export class AdminOrderController {
  /**
   * GET /ts-admin/orders - List all orders
   */
  async listOrders(c: Context) {
    const query = c.req.query();
    const parseResult = OrderListQuerySchema.safeParse(query);
    if (!parseResult.success) {
      throw new BadRequestError(
        parseResult.error.errors.map((e: { message: string }) => e.message)
          .join(", "),
      );
    }

    const orders = await orderService.getAllOrders(parseResult.data);

    return c.json({
      success: true,
      data: orders,
    });
  }

  /**
   * GET /ts-admin/orders/:id - Get order details
   */
  async getOrder(c: Context) {
    const orderId = c.req.param("id");
    if (!orderId) {
      throw new BadRequestError("Order ID is required");
    }

    const order = await orderService.getOrderById(orderId);

    return c.json({
      success: true,
      data: order,
    });
  }

  /**
   * PUT /ts-admin/orders/:id/status - Update order status
   */
  async updateOrderStatus(c: Context) {
    const orderId = c.req.param("id");
    if (!orderId) {
      throw new BadRequestError("Order ID is required");
    }

    const body = await c.req.json();
    const parseResult = UpdateOrderStatusSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestError(
        parseResult.error.errors.map((e: { message: string }) => e.message)
          .join(", "),
      );
    }

    const order = await orderService.updateOrderStatus(
      orderId,
      parseResult.data.status,
      parseResult.data.adminNotes,
    );

    return c.json({
      success: true,
      message: "Order status updated",
      data: order,
    });
  }
}

// Singleton instances
export const orderController = new OrderController();
export const adminOrderController = new AdminOrderController();
