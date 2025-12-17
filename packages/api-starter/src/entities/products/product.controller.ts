import { Context } from "hono";
import { productService } from "./product.service.ts";
import { BaseController } from "../../shared/controllers/base.controller.ts";
import { ApiResponse } from "../../shared/utils/response.ts";
import { ProductQuerySchema } from "./product.dto.ts";

/**
 * Product Controller
 *
 * Public: GET /products (list with filters), GET /products/:slug
 * Admin: Full CRUD at /ts-admin/products
 */
export class ProductController extends BaseController<typeof productService> {
  constructor() {
    super(productService, "Product", {});
  }

  /**
   * List products with filtering and pagination (public endpoint)
   */
  listProducts = async (c: Context) => {
    const queryParams = Object.fromEntries(new URL(c.req.url).searchParams);
    const parsed = ProductQuerySchema.safeParse(queryParams);

    if (!parsed.success) {
      return c.json(
        ApiResponse.error("Invalid query parameters", parsed.error.errors),
        400,
      );
    }

    const result = await productService.getProducts(parsed.data);
    return c.json({
      ...ApiResponse.success(result.data),
      meta: result.meta,
    });
  };

  /**
   * Get product by slug (public endpoint)
   */
  getBySlug = async (c: Context) => {
    const slug = c.req.param("slug");
    const product = await productService.getBySlug(slug);

    if (!product) {
      return c.json(ApiResponse.error("Product not found"), 404);
    }

    return c.json(ApiResponse.success(product));
  };

  /**
   * Soft delete product (admin only)
   */
  softDelete = async (c: Context) => {
    const id = c.req.param("id");
    await productService.softDelete(id);
    return c.json(ApiResponse.success(null, "Product deleted successfully"));
  };

  /**
   * Restore soft-deleted product (admin only)
   */
  restore = async (c: Context) => {
    const id = c.req.param("id");
    await productService.restore(id);
    return c.json(ApiResponse.success(null, "Product restored successfully"));
  };
}

const controller = new ProductController();
export const ProductControllerStatic = {
  ...controller.toStatic(),
  listProducts: controller.listProducts,
  getBySlug: controller.getBySlug,
  softDelete: controller.softDelete,
  restore: controller.restore,
};
