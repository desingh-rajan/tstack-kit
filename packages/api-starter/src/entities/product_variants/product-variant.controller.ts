import { Context } from "hono";
import { productVariantService } from "./product-variant.service.ts";
import { BaseController } from "../../shared/controllers/base.controller.ts";
import { ApiResponse } from "../../shared/utils/response.ts";
import { BulkCreateVariantsSchema } from "./product-variant.dto.ts";

/**
 * Product Variant Controller
 *
 * Handles variant CRUD operations
 */
export class ProductVariantController
  extends BaseController<typeof productVariantService> {
  constructor() {
    super(productVariantService, "ProductVariant", {});
  }

  /**
   * Get variants for a product
   */
  getByProductId = async (c: Context) => {
    const productId = c.req.param("productId");
    const variants = await productVariantService.getByProductId(productId);
    return c.json(ApiResponse.success(variants));
  };

  /**
   * Get variant by SKU
   */
  getBySku = async (c: Context) => {
    const sku = c.req.param("sku");
    const variant = await productVariantService.getBySku(sku);

    if (!variant) {
      return c.json(ApiResponse.error("Variant not found"), 404);
    }

    return c.json(ApiResponse.success(variant));
  };

  /**
   * Bulk create variants for a product (admin only)
   */
  bulkCreate = async (c: Context) => {
    const body = await c.req.json();
    const parsed = BulkCreateVariantsSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        ApiResponse.error("Invalid data", parsed.error.errors),
        400,
      );
    }

    const variants = await productVariantService.bulkCreate(parsed.data);
    return c.json(
      ApiResponse.success(variants, "Variants created successfully"),
      201,
    );
  };

  /**
   * Update stock quantity (admin only)
   */
  updateStock = async (c: Context) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { quantity } = body;

    if (typeof quantity !== "number" || quantity < 0) {
      return c.json(ApiResponse.error("Invalid quantity"), 400);
    }

    await productVariantService.updateStock(id, quantity);
    return c.json(ApiResponse.success(null, "Stock updated successfully"));
  };

  /**
   * Adjust stock quantity (admin only)
   */
  adjustStock = async (c: Context) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { adjustment } = body;

    if (typeof adjustment !== "number") {
      return c.json(ApiResponse.error("Invalid adjustment"), 400);
    }

    await productVariantService.adjustStock(id, adjustment);
    return c.json(ApiResponse.success(null, "Stock adjusted successfully"));
  };
}

const controller = new ProductVariantController();
export const ProductVariantControllerStatic = {
  ...controller.toStatic(),
  getByProductId: controller.getByProductId,
  getBySku: controller.getBySku,
  bulkCreate: controller.bulkCreate,
  updateStock: controller.updateStock,
  adjustStock: controller.adjustStock,
};
