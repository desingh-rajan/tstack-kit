import { Context } from "hono";
import { categoryService } from "./category.service.ts";
import { BaseController } from "../../shared/controllers/base.controller.ts";
import { ApiResponse } from "../../shared/utils/response.ts";

/**
 * Category Controller
 *
 * Public: GET /categories (tree), GET /categories/:id, GET /categories/slug/:slug
 * Admin: Full CRUD at /ts-admin/categories
 */
export class CategoryController extends BaseController<typeof categoryService> {
  constructor() {
    super(categoryService, "Category", {});
  }

  /**
   * Get category by slug (public endpoint)
   */
  getBySlug = async (c: Context) => {
    const slug = c.req.param("slug");
    const category = await categoryService.getBySlug(slug);

    if (!category) {
      return c.json(ApiResponse.error("Category not found"), 404);
    }

    return c.json(ApiResponse.success(category));
  };

  /**
   * Get category tree (hierarchical, public endpoint)
   */
  getCategoryTree = async (c: Context) => {
    const tree = await categoryService.getCategoryTree(true);
    return c.json(ApiResponse.success(tree));
  };

  /**
   * Get root categories (no parent)
   */
  getRootCategories = async (c: Context) => {
    const roots = await categoryService.getRootCategories();
    return c.json(ApiResponse.success(roots));
  };

  /**
   * Get children of a category
   */
  getChildren = async (c: Context) => {
    const parentId = c.req.param("id");
    const children = await categoryService.getChildren(parentId);
    return c.json(ApiResponse.success(children));
  };

  /**
   * Reorder categories (admin only)
   */
  reorder = async (c: Context) => {
    const body = await c.req.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds)) {
      return c.json(ApiResponse.error("orderedIds must be an array"), 400);
    }

    await categoryService.reorder(orderedIds);
    return c.json(
      ApiResponse.success(null, "Categories reordered successfully"),
    );
  };
}

const controller = new CategoryController();
export const CategoryControllerStatic = {
  ...controller.toStatic(),
  getBySlug: controller.getBySlug,
  getCategoryTree: controller.getCategoryTree,
  getRootCategories: controller.getRootCategories,
  getChildren: controller.getChildren,
  reorder: controller.reorder,
};
