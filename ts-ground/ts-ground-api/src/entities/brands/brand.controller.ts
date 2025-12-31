import { Context } from "hono";
import { brandService } from "./brand.service.ts";
import { BaseController } from "../../shared/controllers/base.controller.ts";
import { ApiResponse } from "../../shared/utils/response.ts";

/**
 * Brand Controller
 *
 * Public: GET /brands, GET /brands/:id, GET /brands/slug/:slug
 * Admin: Full CRUD at /ts-admin/brands
 */
export class BrandController extends BaseController<typeof brandService> {
  constructor() {
    super(brandService, "Brand", {
      // All mutations require admin role (handled by admin routes)
      // Public routes only expose read operations
    });
  }

  /**
   * Get brand by slug (public endpoint)
   */
  getBySlug = async (c: Context) => {
    const slug = c.req.param("slug");
    const brand = await brandService.getBySlug(slug);

    if (!brand) {
      return c.json(ApiResponse.error("Brand not found"), 404);
    }

    return c.json(ApiResponse.success(brand));
  };

  /**
   * Get all active brands (public endpoint)
   */
  getActiveBrands = async (c: Context) => {
    const brands = await brandService.getActiveBrands();
    return c.json(ApiResponse.success(brands));
  };
}

const controller = new BrandController();
export const BrandControllerStatic = {
  ...controller.toStatic(),
  getBySlug: controller.getBySlug,
  getActiveBrands: controller.getActiveBrands,
};
