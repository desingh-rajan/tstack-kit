/**
 * S3 Upload Service
 *
 * Simple S3 upload for entity images without image processing
 * Bucket structure: {bucket}/{prefix}/{entityType}/{entity-id}/{filename}
 *
 * NOTE: For public ACL to work, the S3 bucket must have:
 * - "Block public access" settings disabled (or ACLs enabled)
 * - Bucket policy allowing public read (optional, ACL can handle it)
 *
 * TODO: Add presigned URL support for secure assets (invoices, personal images)
 */

import {
  DeleteObjectCommand,
  PutObjectCommand,
  type PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  prefix: string; // e.g., "client-name/production"
}

export interface UploadResult {
  url: string;
  key: string;
}

/**
 * S3 Uploader for product images
 *
 * @example
 * const uploader = new S3Uploader({
 *   accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID"),
 *   secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY"),
 *   region: "ap-south-1",
 *   bucket: "my-bucket",
 *   prefix: "suryas-cookware/production"
 * });
 *
 * const result = await uploader.uploadProductImage(
 *   "product-uuid",
 *   "image-uuid",
 *   imageBuffer,
 *   "image/jpeg"
 * );
 */
export class S3Uploader {
  private client: S3Client;
  private bucket: string;
  private prefix: string;
  private accessKeyId: string;
  private secretAccessKey: string;

  constructor(s3Config?: Partial<S3Config>) {
    const finalConfig: S3Config = {
      accessKeyId: s3Config?.accessKeyId || Deno.env.get("AWS_ACCESS_KEY_ID") ||
        "",
      secretAccessKey: s3Config?.secretAccessKey ||
        Deno.env.get("AWS_SECRET_ACCESS_KEY") || "",
      region: s3Config?.region || Deno.env.get("AWS_REGION") || "ap-south-1",
      bucket: s3Config?.bucket || Deno.env.get("S3_BUCKET_NAME") || "",
      prefix: s3Config?.prefix || Deno.env.get("S3_PREFIX") ||
        "default/development",
    };

    this.accessKeyId = finalConfig.accessKeyId;
    this.secretAccessKey = finalConfig.secretAccessKey;
    this.client = new S3Client({
      region: finalConfig.region,
      credentials: {
        accessKeyId: finalConfig.accessKeyId,
        secretAccessKey: finalConfig.secretAccessKey,
      },
    });
    this.bucket = finalConfig.bucket;
    this.prefix = finalConfig.prefix;
  }

  /**
   * Check if S3 is properly configured
   * Returns false if credentials or bucket are missing
   */
  isConfigured(): boolean {
    return !!(
      this.accessKeyId &&
      this.secretAccessKey &&
      this.bucket
    );
  }

  /**
   * Get configuration status for debugging
   */
  getConfigStatus(): { configured: boolean; missing: string[] } {
    const missing: string[] = [];
    if (!this.accessKeyId) missing.push("AWS_ACCESS_KEY_ID");
    if (!this.secretAccessKey) missing.push("AWS_SECRET_ACCESS_KEY");
    if (!this.bucket) missing.push("S3_BUCKET_NAME");
    return { configured: missing.length === 0, missing };
  }

  /**
   * Upload an image to S3 for any entity type (generic method)
   *
   * @param entityType - Type of entity (e.g., "products", "categories", "brands")
   * @param entityId - UUID of the entity
   * @param imageId - UUID for this image
   * @param body - Image data as Uint8Array or Buffer
   * @param contentType - MIME type (e.g., "image/jpeg", "image/png", "image/webp")
   * @param isPublic - Whether to set public-read ACL (default: true)
   * @returns Upload result with URL and key
   */
  async uploadEntityImage(
    entityType: string,
    entityId: string,
    imageId: string,
    body: Uint8Array,
    contentType: string,
    isPublic: boolean = true,
  ): Promise<UploadResult> {
    if (!this.isConfigured()) {
      const status = this.getConfigStatus();
      throw new Error(
        `S3 not configured. Missing: ${status.missing.join(", ")}`,
      );
    }

    const extension = this.getExtensionFromContentType(contentType);
    const key =
      `${this.prefix}/${entityType}/${entityId}/${imageId}.${extension}`;

    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
      ...(isPublic && { ACL: "public-read" }),
    };

    await this.client.send(new PutObjectCommand(params));

    const url = `https://${this.bucket}.s3.amazonaws.com/${key}`;

    return { url, key };
  }

  /**
   * Upload a product image to S3 (convenience method)
   *
   * @param productId - UUID of the product
   * @param imageId - UUID for this image
   * @param body - Image data as Uint8Array or Buffer
   * @param contentType - MIME type (e.g., "image/jpeg", "image/png", "image/webp")
   * @returns Upload result with URL and key
   */
  uploadProductImage(
    productId: string,
    imageId: string,
    body: Uint8Array,
    contentType: string,
  ): Promise<UploadResult> {
    return this.uploadEntityImage(
      "products",
      productId,
      imageId,
      body,
      contentType,
    );
  }

  /**
   * Delete an entity image from S3 (generic method)
   *
   * @param entityType - Type of entity (e.g., "products", "categories")
   * @param entityId - UUID of the entity
   * @param imageId - UUID of the image
   * @param extension - File extension (jpg, png, webp)
   */
  async deleteEntityImage(
    entityType: string,
    entityId: string,
    imageId: string,
    extension: string = "jpg",
  ): Promise<void> {
    const key =
      `${this.prefix}/${entityType}/${entityId}/${imageId}.${extension}`;

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  /**
   * Delete an image from S3 using its full URL
   * Extracts the S3 key from the URL and deletes the object
   *
   * @param imageUrl - Full S3 URL (e.g., https://bucket.s3.amazonaws.com/prefix/products/uuid/uuid.jpg)
   */
  async deleteByUrl(imageUrl: string): Promise<void> {
    if (!imageUrl) return;

    try {
      // Extract key from URL
      // URL format: https://bucket.s3.amazonaws.com/key or https://s3.region.amazonaws.com/bucket/key
      const url = new URL(imageUrl);
      let key = url.pathname;

      // Remove leading slash
      if (key.startsWith("/")) {
        key = key.substring(1);
      }

      // If bucket is in path (s3.region.amazonaws.com/bucket/key), remove bucket prefix
      if (url.hostname.startsWith("s3.") && key.startsWith(this.bucket + "/")) {
        key = key.substring(this.bucket.length + 1);
      }

      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (error) {
      console.warn(`Failed to delete from S3: ${imageUrl}`, error);
      throw error;
    }
  }

  /**
   * Delete a product image from S3 (convenience method)
   *
   * @param productId - UUID of the product
   * @param imageId - UUID of the image
   * @param extension - File extension (jpg, png, webp)
   */
  deleteProductImage(
    productId: string,
    imageId: string,
    extension: string = "jpg",
  ): Promise<void> {
    return this.deleteEntityImage("products", productId, imageId, extension);
  }

  /**
   * Delete all images for a product
   * Note: This is a simple implementation that deletes known images
   * For production, consider using ListObjectsV2 + DeleteObjects for batch deletion
   */
  async deleteAllProductImages(
    productId: string,
    imageIds: string[],
  ): Promise<void> {
    const deletePromises = imageIds.map((imageId) =>
      this.deleteProductImage(productId, imageId).catch(() => {
        // Ignore errors for individual deletions
      })
    );

    await Promise.all(deletePromises);
  }

  /**
   * Get file extension from content type
   */
  private getExtensionFromContentType(contentType: string): string {
    const map: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/svg+xml": "svg",
    };
    return map[contentType] || "jpg";
  }

  /**
   * Get content type from file extension
   */
  static getContentTypeFromExtension(extension: string): string {
    const map: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      svg: "image/svg+xml",
    };
    return map[extension.toLowerCase()] || "application/octet-stream";
  }
}

// Default instance (uses environment variables)
export const s3Uploader = new S3Uploader();
