import { Context } from "hono";
import { variantOptionService } from "./variant-option.service.ts";
import { BaseController } from "../../shared/controllers/base.controller.ts";
import { ApiResponse } from "../../shared/utils/response.ts";

/**
 * Variant Option Controller
 *
 * Public: GET /variant-options (grouped by type)
 * Admin: Full CRUD at /ts-admin/variant-options
 */
export class VariantOptionController
  extends BaseController<typeof variantOptionService> {
  constructor() {
    super(variantOptionService, "VariantOption", {});
  }

  /**
   * Get all options grouped by type (public endpoint)
   */
  getGroupedByType = async (c: Context) => {
    const grouped = await variantOptionService.getGroupedByType();
    return c.json(ApiResponse.success(grouped));
  };

  /**
   * Get options by type
   */
  getByType = async (c: Context) => {
    const type = c.req.param("type");
    const options = await variantOptionService.getByType(type);
    return c.json(ApiResponse.success(options));
  };

  /**
   * Get all unique types
   */
  getTypes = async (c: Context) => {
    const types = await variantOptionService.getTypes();
    return c.json(ApiResponse.success(types));
  };

  /**
   * Reorder options within a type (admin only)
   */
  reorder = async (c: Context) => {
    const body = await c.req.json();
    const { type, orderedIds } = body;

    if (!type || !Array.isArray(orderedIds)) {
      return c.json(ApiResponse.error("type and orderedIds are required"), 400);
    }

    await variantOptionService.reorderByType(type, orderedIds);
    return c.json(ApiResponse.success(null, "Options reordered successfully"));
  };
}

const controller = new VariantOptionController();
export const VariantOptionControllerStatic = {
  ...controller.toStatic(),
  getGroupedByType: controller.getGroupedByType,
  getByType: controller.getByType,
  getTypes: controller.getTypes,
  reorder: controller.reorder,
};
