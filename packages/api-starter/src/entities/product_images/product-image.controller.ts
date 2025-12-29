import { Context } from "hono";
import { productImageService } from "./product-image.service.ts";
import { BaseController } from "../../shared/controllers/base.controller.ts";
import { ApiResponse } from "../../shared/utils/response.ts";
import { s3Uploader } from "../../lib/s3-uploader.ts";

/**
 * Product Image Controller
 *
 * Handles image CRUD and S3 uploads
 */
export class ProductImageController
  extends BaseController<typeof productImageService> {
  constructor() {
    super(productImageService, "ProductImage", {});
  }

  /**
   * Get images for a product
   */
  getByProductId = async (c: Context) => {
    const productId = c.req.param("productId");
    const images = await productImageService.getByProductId(productId);
    return c.json(ApiResponse.success(images));
  };

  /**
   * Upload image for a product (multipart/form-data)
   */
  uploadImage = async (c: Context) => {
    const productId = c.req.param("productId");

    // Check if S3 is configured
    if (!s3Uploader.isConfigured()) {
      const status = s3Uploader.getConfigStatus();
      return c.json(
        ApiResponse.error(
          `S3 storage not configured. Missing environment variables: ${
            status.missing.join(", ")
          }. ` +
            "Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME in your .env file.",
        ),
        503,
      );
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const altText = formData.get("altText") as string | null;
    const isPrimary = formData.get("isPrimary") === "true";

    if (!file) {
      return c.json(ApiResponse.error("No file provided"), 400);
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      return c.json(
        ApiResponse.error("Invalid file type. Allowed: jpeg, png, webp, gif"),
        400,
      );
    }

    // Upload to S3
    const imageId = crypto.randomUUID();
    const buffer = new Uint8Array(await file.arrayBuffer());

    try {
      const uploadResult = await s3Uploader.uploadProductImage(
        productId,
        imageId,
        buffer,
        file.type,
      );

      // Save to database
      const image = await productImageService.create({
        productId,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.url, // Same URL for now (no processing)
        altText,
        isPrimary,
        displayOrder: 0, // Will be updated by afterCreate hook based on existing images
      });

      return c.json(
        ApiResponse.success(image, "Image uploaded successfully"),
        201,
      );
    } catch (error) {
      console.error("S3 upload error:", error);
      const message = error instanceof Error ? error.message : "Upload failed";
      return c.json(
        ApiResponse.error(`Failed to upload image: ${message}`),
        500,
      );
    }
  };

  /**
   * Set image as primary
   */
  setPrimary = async (c: Context) => {
    const imageId = c.req.param("id");
    await productImageService.setPrimary(imageId);
    return c.json(ApiResponse.success(null, "Image set as primary"));
  };

  /**
   * Reorder images for a product
   */
  reorder = async (c: Context) => {
    const productId = c.req.param("productId");
    const body = await c.req.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds)) {
      return c.json(ApiResponse.error("orderedIds must be an array"), 400);
    }

    await productImageService.reorder(productId, orderedIds);
    return c.json(ApiResponse.success(null, "Images reordered successfully"));
  };

  /**
   * Delete image (also removes from S3)
   */
  deleteImage = async (c: Context) => {
    const imageId = c.req.param("id");

    const image = await productImageService.getById(imageId);
    if (!image) {
      return c.json(ApiResponse.error("Image not found"), 404);
    }

    // Delete from database first
    await productImageService.delete(imageId);

    // Delete from S3 using the actual URL stored in DB
    try {
      await s3Uploader.deleteByUrl(image.url);
    } catch (_error) {
      // Log but don't fail - image might not exist in S3 or config might be missing
      console.warn(`Failed to delete image from S3: ${image.url}`);
    }

    return c.json(ApiResponse.success(null, "Image deleted successfully"));
  };
}

const controller = new ProductImageController();
export const ProductImageControllerStatic = {
  ...controller.toStatic(),
  uploadImage: controller.uploadImage,
  setPrimary: controller.setPrimary,
  reorder: controller.reorder,
  deleteImage: controller.deleteImage,
  getByProductId: controller.getByProductId,
};
