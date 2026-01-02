import { z } from "zod";

/**
 * Cart DTOs
 *
 * Validation schemas for cart operations
 */

// Add Item to Cart DTO
export const AddCartItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  variantId: z.string().uuid("Invalid variant ID").optional().nullable(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
});

export type AddCartItemDTO = z.infer<typeof AddCartItemSchema>;

// Update Cart Item DTO
export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export type UpdateCartItemDTO = z.infer<typeof UpdateCartItemSchema>;

// Merge Carts DTO (for login)
export const MergeCartsSchema = z.object({
  guestId: z.string().uuid("Invalid guest ID"),
});

export type MergeCartsDTO = z.infer<typeof MergeCartsSchema>;

// Cart Response DTOs
export interface CartItemResponseDTO {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  priceAtAdd: string;
  currentPrice: string;
  priceChanged: boolean;
  lineTotal: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    stockQuantity: number;
    isActive: boolean;
    primaryImage?: {
      url: string;
      thumbnailUrl: string | null;
    } | null;
  };
  variant?: {
    id: string;
    sku: string | null;
    price: string | null;
    stockQuantity: number;
    options: Record<string, string>;
    isActive: boolean;
  } | null;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  availableQuantity: number;
}

export interface CartResponseDTO {
  id: string;
  userId: number | null;
  guestId: string | null;
  status: string;
  expiresAt: Date | null;
  items: CartItemResponseDTO[];
  itemCount: number;
  uniqueItemCount: number;
  subtotal: string;
  hasPriceChanges: boolean;
  hasStockIssues: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Cart Count Response (for header badge)
export interface CartCountResponseDTO {
  itemCount: number;
  uniqueItemCount: number;
}

// Stock Validation Result
export interface StockValidationResult {
  valid: boolean;
  issues: Array<{
    itemId: string;
    productId: string;
    variantId: string | null;
    productName: string;
    requested: number;
    available: number;
    issue: "out_of_stock" | "insufficient_stock" | "product_unavailable";
  }>;
}
