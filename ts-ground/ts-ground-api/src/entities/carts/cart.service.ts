import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "../../config/database.ts";
import { type Cart, carts } from "./cart.model.ts";
import { type CartItem, cartItems } from "./cart-item.model.ts";
import { products } from "../products/product.model.ts";
import { productVariants } from "../product_variants/product-variant.model.ts";
import { productImages } from "../product_images/product-image.model.ts";
import { BadRequestError, NotFoundError } from "../../shared/utils/errors.ts";
import type {
  AddCartItemDTO,
  CartItemResponseDTO,
  CartResponseDTO,
  StockValidationResult,
} from "./cart.dto.ts";

// Guest cart expiry: 7 days
const GUEST_CART_EXPIRY_DAYS = 7;

// Low stock threshold
const LOW_STOCK_THRESHOLD = 5;

/**
 * Cart Service
 *
 * Handles cart operations including:
 * - Guest and authenticated user carts
 * - Item management with stock validation
 * - Price snapshots and change detection
 * - Cart merging on login
 * - Totals calculation
 */
export class CartService {
  /**
   * Get or create an active cart for a user or guest
   */
  async getOrCreateCart(
    userId?: number,
    guestId?: string,
  ): Promise<CartResponseDTO> {
    // Try to find existing active cart
    let cart = await this.findActiveCart(userId, guestId);

    // Create new cart if none exists
    if (!cart) {
      cart = await this.createCart(userId, guestId);
    }

    // Return cart with items and totals
    return this.getCartWithDetails(cart.id);
  }

  /**
   * Find an existing active cart
   */
  private async findActiveCart(
    userId?: number,
    guestId?: string,
  ): Promise<Cart | null> {
    if (!userId && !guestId) {
      return null;
    }

    const conditions = [eq(carts.status, "active")];

    if (userId) {
      conditions.push(eq(carts.userId, userId));
    } else if (guestId) {
      conditions.push(eq(carts.guestId, guestId));
      // Check expiry for guest carts
      conditions.push(
        or(
          isNull(carts.expiresAt),
          sql`${carts.expiresAt} > NOW()`,
        )!,
      );
    }

    const result = await db
      .select()
      .from(carts)
      .where(and(...conditions))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Create a new cart
   */
  private async createCart(
    userId?: number,
    guestId?: string,
  ): Promise<Cart> {
    const expiresAt = guestId
      ? new Date(Date.now() + GUEST_CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      : null;

    const result = await db
      .insert(carts)
      .values({
        userId: userId ?? null,
        guestId: guestId ?? null,
        status: "active",
        expiresAt,
      })
      .returning();

    return result[0];
  }

  /**
   * Get cart with full details (items, products, totals)
   */
  async getCartWithDetails(cartId: string): Promise<CartResponseDTO> {
    // Get cart
    const cart = await db
      .select()
      .from(carts)
      .where(eq(carts.id, cartId))
      .limit(1);

    if (cart.length === 0) {
      throw new NotFoundError("Cart not found");
    }

    // Get cart items with product and variant details
    const items = await this.getCartItems(cartId);

    // Calculate totals
    let subtotal = 0;
    let itemCount = 0;
    let hasPriceChanges = false;
    let hasStockIssues = false;

    const itemResponses: CartItemResponseDTO[] = items.map((item) => {
      const currentPrice = item.variant?.price ?? item.product.price;
      const priceChanged = item.priceAtAdd !== currentPrice;
      const lineTotal = parseFloat(currentPrice) * item.quantity;
      const availableStock = item.variant?.stockQuantity ??
        item.product.stockQuantity;

      subtotal += lineTotal;
      itemCount += item.quantity;
      if (priceChanged) hasPriceChanges = true;

      let stockStatus: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
      if (availableStock === 0 || !item.product.isActive) {
        stockStatus = "out_of_stock";
        hasStockIssues = true;
      } else if (availableStock < item.quantity) {
        stockStatus = "low_stock";
        hasStockIssues = true;
      } else if (availableStock <= LOW_STOCK_THRESHOLD) {
        stockStatus = "low_stock";
      }

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        priceAtAdd: item.priceAtAdd,
        currentPrice,
        priceChanged,
        lineTotal: lineTotal.toFixed(2),
        product: item.product,
        variant: item.variant,
        stockStatus,
        availableQuantity: availableStock,
      };
    });

    return {
      id: cart[0].id,
      userId: cart[0].userId,
      guestId: cart[0].guestId,
      status: cart[0].status,
      expiresAt: cart[0].expiresAt,
      items: itemResponses,
      itemCount,
      uniqueItemCount: items.length,
      subtotal: subtotal.toFixed(2),
      hasPriceChanges,
      hasStockIssues,
      createdAt: cart[0].createdAt,
      updatedAt: cart[0].updatedAt,
    };
  }

  /**
   * Get cart items with product details
   */
  private async getCartItems(cartId: string) {
    // Get cart items
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cartId));

    // Get product and variant details for each item
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        // Get product
        const productResult = await db
          .select({
            id: products.id,
            name: products.name,
            slug: products.slug,
            price: products.price,
            stockQuantity: products.stockQuantity,
            isActive: products.isActive,
          })
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        // Get primary image
        const imageResult = await db
          .select({
            url: productImages.url,
            thumbnailUrl: productImages.thumbnailUrl,
          })
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
            .select({
              id: productVariants.id,
              sku: productVariants.sku,
              price: productVariants.price,
              stockQuantity: productVariants.stockQuantity,
              options: productVariants.options,
              isActive: productVariants.isActive,
            })
            .from(productVariants)
            .where(eq(productVariants.id, item.variantId))
            .limit(1);

          if (variantResult.length > 0) {
            variant = {
              ...variantResult[0],
              options: variantResult[0].options as Record<string, string>,
            };
          }
        }

        return {
          id: item.id,
          cartId: item.cartId,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          priceAtAdd: item.priceAtAdd,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          product: {
            ...productResult[0],
            primaryImage: imageResult.length > 0 ? imageResult[0] : null,
          },
          variant,
        };
      }),
    );

    return itemsWithDetails;
  }

  /**
   * Add item to cart
   */
  async addItem(
    cartId: string,
    data: AddCartItemDTO,
  ): Promise<CartItemResponseDTO> {
    const { productId, variantId, quantity } = data;

    // Validate product exists and is active
    const product = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          eq(products.isActive, true),
          isNull(products.deletedAt),
        ),
      )
      .limit(1);

    if (product.length === 0) {
      throw new BadRequestError("Product not found or unavailable");
    }

    // Validate variant if provided
    let variant = null;
    if (variantId) {
      const variantResult = await db
        .select()
        .from(productVariants)
        .where(
          and(
            eq(productVariants.id, variantId),
            eq(productVariants.productId, productId),
            eq(productVariants.isActive, true),
          ),
        )
        .limit(1);

      if (variantResult.length === 0) {
        throw new BadRequestError("Variant not found or unavailable");
      }
      variant = variantResult[0];
    }

    // Check stock
    const availableStock = variant?.stockQuantity ?? product[0].stockQuantity;
    if (availableStock < quantity) {
      throw new BadRequestError(
        `Insufficient stock. Only ${availableStock} available.`,
      );
    }

    // Get price (variant price or product price)
    const price = variant?.price ?? product[0].price;

    // Check if item already exists in cart
    const existingItem = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.productId, productId),
          variantId
            ? eq(cartItems.variantId, variantId)
            : isNull(cartItems.variantId),
        ),
      )
      .limit(1);

    let cartItem: CartItem;

    if (existingItem.length > 0) {
      // Update quantity
      const newQuantity = existingItem[0].quantity + quantity;

      // Recheck stock with new quantity
      if (availableStock < newQuantity) {
        throw new BadRequestError(
          `Cannot add ${quantity} more. Only ${
            availableStock - existingItem[0].quantity
          } more available.`,
        );
      }

      const result = await db
        .update(cartItems)
        .set({
          quantity: newQuantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem[0].id))
        .returning();

      cartItem = result[0];
    } else {
      // Create new cart item
      const result = await db
        .insert(cartItems)
        .values({
          cartId,
          productId,
          variantId: variantId ?? null,
          quantity,
          priceAtAdd: price,
        })
        .returning();

      cartItem = result[0];
    }

    // Update cart timestamp
    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cartId));

    // Get primary image
    const imageResult = await db
      .select({
        url: productImages.url,
        thumbnailUrl: productImages.thumbnailUrl,
      })
      .from(productImages)
      .where(
        and(
          eq(productImages.productId, productId),
          eq(productImages.isPrimary, true),
        ),
      )
      .limit(1);

    // Build response
    const currentPrice = variant?.price ?? product[0].price;
    const priceChanged = cartItem.priceAtAdd !== currentPrice;
    const lineTotal = parseFloat(currentPrice) * cartItem.quantity;

    let stockStatus: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
    if (availableStock === 0) {
      stockStatus = "out_of_stock";
    } else if (availableStock <= LOW_STOCK_THRESHOLD) {
      stockStatus = "low_stock";
    }

    return {
      id: cartItem.id,
      productId: cartItem.productId,
      variantId: cartItem.variantId,
      quantity: cartItem.quantity,
      priceAtAdd: cartItem.priceAtAdd,
      currentPrice,
      priceChanged,
      lineTotal: lineTotal.toFixed(2),
      product: {
        id: product[0].id,
        name: product[0].name,
        slug: product[0].slug,
        price: product[0].price,
        stockQuantity: product[0].stockQuantity,
        isActive: product[0].isActive,
        primaryImage: imageResult.length > 0 ? imageResult[0] : null,
      },
      variant: variant
        ? {
          id: variant.id,
          sku: variant.sku,
          price: variant.price,
          stockQuantity: variant.stockQuantity,
          options: variant.options as Record<string, string>,
          isActive: variant.isActive,
        }
        : null,
      stockStatus,
      availableQuantity: availableStock,
    };
  }

  /**
   * Update cart item quantity
   */
  async updateItemQuantity(
    cartId: string,
    itemId: string,
    quantity: number,
  ): Promise<CartItemResponseDTO> {
    // Get existing item
    const item = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.id, itemId),
          eq(cartItems.cartId, cartId),
        ),
      )
      .limit(1);

    if (item.length === 0) {
      throw new NotFoundError("Cart item not found");
    }

    // Get product and variant to check stock
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, item[0].productId))
      .limit(1);

    let variant = null;
    if (item[0].variantId) {
      const variantResult = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, item[0].variantId))
        .limit(1);
      if (variantResult.length > 0) {
        variant = variantResult[0];
      }
    }

    // Check stock
    const availableStock = variant?.stockQuantity ?? product[0].stockQuantity;
    if (availableStock < quantity) {
      throw new BadRequestError(
        `Insufficient stock. Only ${availableStock} available.`,
      );
    }

    // Update quantity
    const result = await db
      .update(cartItems)
      .set({
        quantity,
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, itemId))
      .returning();

    // Update cart timestamp
    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cartId));

    // Get primary image
    const imageResult = await db
      .select({
        url: productImages.url,
        thumbnailUrl: productImages.thumbnailUrl,
      })
      .from(productImages)
      .where(
        and(
          eq(productImages.productId, item[0].productId),
          eq(productImages.isPrimary, true),
        ),
      )
      .limit(1);

    // Build response
    const currentPrice = variant?.price ?? product[0].price;
    const priceChanged = result[0].priceAtAdd !== currentPrice;
    const lineTotal = parseFloat(currentPrice) * result[0].quantity;

    let stockStatus: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
    if (availableStock === 0) {
      stockStatus = "out_of_stock";
    } else if (availableStock <= LOW_STOCK_THRESHOLD) {
      stockStatus = "low_stock";
    }

    return {
      id: result[0].id,
      productId: result[0].productId,
      variantId: result[0].variantId,
      quantity: result[0].quantity,
      priceAtAdd: result[0].priceAtAdd,
      currentPrice,
      priceChanged,
      lineTotal: lineTotal.toFixed(2),
      product: {
        id: product[0].id,
        name: product[0].name,
        slug: product[0].slug,
        price: product[0].price,
        stockQuantity: product[0].stockQuantity,
        isActive: product[0].isActive,
        primaryImage: imageResult.length > 0 ? imageResult[0] : null,
      },
      variant: variant
        ? {
          id: variant.id,
          sku: variant.sku,
          price: variant.price,
          stockQuantity: variant.stockQuantity,
          options: variant.options as Record<string, string>,
          isActive: variant.isActive,
        }
        : null,
      stockStatus,
      availableQuantity: availableStock,
    };
  }

  /**
   * Remove item from cart
   */
  async removeItem(cartId: string, itemId: string): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(
        and(
          eq(cartItems.id, itemId),
          eq(cartItems.cartId, cartId),
        ),
      )
      .returning();

    if (result.length > 0) {
      // Update cart timestamp
      await db
        .update(carts)
        .set({ updatedAt: new Date() })
        .where(eq(carts.id, cartId));
    }

    return result.length > 0;
  }

  /**
   * Clear all items from cart
   */
  async clearCart(cartId: string): Promise<boolean> {
    await db
      .delete(cartItems)
      .where(eq(cartItems.cartId, cartId));

    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cartId));

    return true;
  }

  /**
   * Get cart item count (for header badge)
   */
  async getCartCount(
    userId?: number,
    guestId?: string,
  ): Promise<{ itemCount: number; uniqueItemCount: number }> {
    const cart = await this.findActiveCart(userId, guestId);

    if (!cart) {
      return { itemCount: 0, uniqueItemCount: 0 };
    }

    const items = await db
      .select({
        quantity: cartItems.quantity,
      })
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueItemCount = items.length;

    return { itemCount, uniqueItemCount };
  }

  /**
   * Merge guest cart into user cart on login
   */
  async mergeCarts(guestId: string, userId: number): Promise<CartResponseDTO> {
    // Find guest cart
    const guestCart = await this.findActiveCart(undefined, guestId);
    if (!guestCart) {
      // No guest cart, just return/create user cart
      return this.getOrCreateCart(userId);
    }

    // Find or create user cart
    let userCart = await this.findActiveCart(userId);
    if (!userCart) {
      userCart = await this.createCart(userId);
    }

    // Get guest cart items
    const guestItems = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, guestCart.id));

    // Merge items
    for (const guestItem of guestItems) {
      // Check if same product/variant exists in user cart
      const existingItem = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.cartId, userCart.id),
            eq(cartItems.productId, guestItem.productId),
            guestItem.variantId
              ? eq(cartItems.variantId, guestItem.variantId)
              : isNull(cartItems.variantId),
          ),
        )
        .limit(1);

      if (existingItem.length > 0) {
        // Update quantity (add guest quantity to existing)
        await db
          .update(cartItems)
          .set({
            quantity: existingItem[0].quantity + guestItem.quantity,
            updatedAt: new Date(),
          })
          .where(eq(cartItems.id, existingItem[0].id));
      } else {
        // Move item to user cart
        await db
          .update(cartItems)
          .set({
            cartId: userCart.id,
            updatedAt: new Date(),
          })
          .where(eq(cartItems.id, guestItem.id));
      }
    }

    // Mark guest cart as abandoned
    await db
      .update(carts)
      .set({
        status: "abandoned",
        updatedAt: new Date(),
      })
      .where(eq(carts.id, guestCart.id));

    // Update user cart timestamp
    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, userCart.id));

    // Return merged cart
    return this.getCartWithDetails(userCart.id);
  }

  /**
   * Validate stock for all items in cart
   */
  async validateStock(cartId: string): Promise<StockValidationResult> {
    const items = await this.getCartItems(cartId);
    const issues: StockValidationResult["issues"] = [];

    for (const item of items) {
      const availableStock = item.variant?.stockQuantity ??
        item.product.stockQuantity;

      if (!item.product.isActive || item.variant && !item.variant.isActive) {
        issues.push({
          itemId: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.product.name,
          requested: item.quantity,
          available: 0,
          issue: "product_unavailable",
        });
      } else if (availableStock === 0) {
        issues.push({
          itemId: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.product.name,
          requested: item.quantity,
          available: 0,
          issue: "out_of_stock",
        });
      } else if (availableStock < item.quantity) {
        issues.push({
          itemId: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.product.name,
          requested: item.quantity,
          available: availableStock,
          issue: "insufficient_stock",
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Mark cart as converted (used when order is placed)
   */
  async markCartConverted(cartId: string): Promise<void> {
    await db
      .update(carts)
      .set({
        status: "converted",
        updatedAt: new Date(),
      })
      .where(eq(carts.id, cartId));
  }

  /**
   * Clean up expired guest carts (run as background job)
   */
  async cleanupExpiredCarts(): Promise<number> {
    const result = await db
      .update(carts)
      .set({
        status: "abandoned",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(carts.status, "active"),
          sql`${carts.expiresAt} < NOW()`,
        ),
      )
      .returning();

    return result.length;
  }
}

// Singleton instance
export const cartService = new CartService();
