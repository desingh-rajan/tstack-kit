import { Context } from "hono";
import { productService } from "./product.service.ts";
import { BaseController } from "../../shared/controllers/base.controller.ts";
import { ApiResponse } from "../../shared/utils/response.ts";
import { ProductQuerySchema } from "./product.dto.ts";
import { ForbiddenError } from "../../shared/utils/errors.ts";
import type { UserRole } from "../../auth/user.model.ts";

/**
 * Product Controller
 *
 * Public: GET /products (list with filters), GET /products/:slug
 * Admin: Full CRUD at /ts-admin/products
 */
export class ProductController extends BaseController<typeof productService> {
  private readonly adminRoles: UserRole[] = ["superadmin", "admin"];

  constructor() {
    super(productService, "Product", {});
  }

  /**
   * Check if user has admin role
   */
  private checkAdminRole(c: Context): void {
    const user = c.get("user");
    if (!user || !this.adminRoles.includes(user.role as UserRole)) {
      throw new ForbiddenError(
        `Forbidden: Requires one of: ${this.adminRoles.join(", ")}`,
      );
    }
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

  /**
   * Get product by ID with relations (admin only)
   * Returns brand and category objects for display
   */
  getByIdWithRelations = async (c: Context) => {
    this.checkAdminRole(c);

    const id = c.req.param("id");
    const product = await productService.getById(id);

    if (!product) {
      return c.json(ApiResponse.error("Product not found"), 404);
    }

    return c.json(product);
  };

  /**
   * Admin list with primary images (admin only)
   * Returns all products (including inactive) with brand, category, and primaryImage
   *
   * TODO: This endpoint is designed to support multiple frontends (Web, Flutter)
   * Ensure any changes maintain backwards compatibility
   */
  adminListWithImages = async (c: Context) => {
    this.checkAdminRole(c);
    const url = new URL(c.req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20");
    const search = url.searchParams.get("search") || undefined;
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = (url.searchParams.get("sortOrder") || "desc") as
      | "asc"
      | "desc";

    const result = await productService.getProductsForAdmin({
      page,
      pageSize,
      search,
      sortBy,
      sortOrder,
    });

    return c.json({
      status: "success",
      data: result.data,
      pagination: result.pagination,
    });
  };
}

const controller = new ProductController();
export const ProductControllerStatic = {
  ...controller.toStatic(),
  listProducts: controller.listProducts,
  getBySlug: controller.getBySlug,
  softDelete: controller.softDelete,
  restore: controller.restore,
  getByIdWithRelations: controller.getByIdWithRelations,
  adminListWithImages: controller.adminListWithImages,
};
