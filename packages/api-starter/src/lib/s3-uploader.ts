/**
 * S3 Upload Service
 *
 * Simple S3 upload for product images without image processing
 * Bucket structure: {bucket}/{prefix}/products/{product-id}/{filename}
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
   * Upload a product image to S3
   *
   * @param productId - UUID of the product
   * @param imageId - UUID for this image
   * @param body - Image data as Uint8Array or Buffer
   * @param contentType - MIME type (e.g., "image/jpeg", "image/png", "image/webp")
   * @returns Upload result with URL and key
   */
  async uploadProductImage(
    productId: string,
    imageId: string,
    body: Uint8Array,
    contentType: string,
  ): Promise<UploadResult> {
    const extension = this.getExtensionFromContentType(contentType);
    const key = `${this.prefix}/products/${productId}/${imageId}.${extension}`;

    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    };

    await this.client.send(new PutObjectCommand(params));

    const url = `https://${this.bucket}.s3.amazonaws.com/${key}`;

    return { url, key };
  }

  /**
   * Delete a product image from S3
   *
   * @param productId - UUID of the product
   * @param imageId - UUID of the image
   * @param extension - File extension (jpg, png, webp)
   */
  async deleteProductImage(
    productId: string,
    imageId: string,
    extension: string = "jpg",
  ): Promise<void> {
    const key = `${this.prefix}/products/${productId}/${imageId}.${extension}`;

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
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
