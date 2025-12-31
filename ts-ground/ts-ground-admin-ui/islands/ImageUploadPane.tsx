/**
 * ImageUploadPane Island
 * Reusable image upload component with drag-drop, preview, and S3 integration
 * Can be used on any entity page (products, categories, etc.)
 *
 * Usage:
 * - On create page: Queue files locally, upload after entity save
 * - On edit page: Upload immediately to entity's image collection
 */

import { useEffect, useRef, useState } from "preact/hooks";

export interface UploadedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface ImageUploadPaneProps {
  /** Entity type for S3 path (e.g., "products", "categories") */
  entityType: string;
  /** Entity ID - if provided, uploads immediately; if not, queues locally */
  entityId?: string;
  /** Custom API endpoint for upload (uses proxy by default) */
  uploadEndpoint?: string;
  /** Custom API endpoint to fetch existing images (uses proxy by default) */
  listEndpoint?: string;
  /** Allow multiple file uploads */
  multiple?: boolean;
  /** Accepted file types */
  accept?: string;
  /** Max file size in bytes (default: 5MB) */
  maxSize?: number;
  /** Max number of files (default: 10) */
  maxFiles?: number;
  /** Callback when upload completes */
  onUploadComplete?: (images: UploadedImage[]) => void;
  /** Callback when image is deleted */
  onDelete?: (imageId: string) => void;
  /** Show as compact inline or full pane */
  variant?: "inline" | "pane";
  /** Label for the upload area */
  label?: string;
  /** Help text */
  helpText?: string;
  /** Read-only mode - only displays images, no upload/delete */
  readOnly?: boolean;
}

interface QueuedFile {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

export default function ImageUploadPane({
  entityType,
  entityId,
  uploadEndpoint,
  listEndpoint,
  multiple = true,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  maxSize = 5 * 1024 * 1024, // 5MB
  maxFiles = 10,
  onUploadComplete,
  onDelete,
  variant = "pane",
  label = "Upload Images",
  helpText,
  readOnly = false,
}: ImageUploadPaneProps) {
  const [existingImages, setExistingImages] = useState<UploadedImage[]>([]);
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Use proxy endpoints (relative URLs that go through admin-ui server)
  // The proxy handles auth via HttpOnly cookies
  const resolvedUploadEndpoint = uploadEndpoint
    ? uploadEndpoint
    : entityId
    ? `/api/admin/${entityType}/${entityId}/images`
    : null;
  const resolvedListEndpoint = listEndpoint
    ? listEndpoint
    : entityId
    ? `/api/admin/${entityType}/${entityId}/images`
    : null;

  // Fetch existing images on mount (only if entityId exists)
  useEffect(() => {
    if (!entityId || !resolvedListEndpoint) return;

    const fetchImages = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(resolvedListEndpoint, {
          credentials: "include",
        });
        if (response.ok) {
          const result = await response.json();
          const images = Array.isArray(result) ? result : (result.data || []);
          setExistingImages(images);
        }
      } catch (err) {
        console.error("Failed to fetch existing images:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [entityId, resolvedListEndpoint]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      queuedFiles.forEach((qf) => URL.revokeObjectURL(qf.preview));
    };
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file type
    const acceptedTypes = accept.split(",").map((t) => t.trim());
    if (!acceptedTypes.some((t) => file.type.match(t.replace("*", ".*")))) {
      return `Invalid file type: ${file.type}. Accepted: ${accept}`;
    }

    // Check file size
    if (file.size > maxSize) {
      const maxMB = (maxSize / 1024 / 1024).toFixed(1);
      return `File too large: ${
        (file.size / 1024 / 1024).toFixed(1)
      }MB. Max: ${maxMB}MB`;
    }

    return null;
  };

  const addFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const totalFiles = existingImages.length + queuedFiles.length +
      fileArray.length;

    if (totalFiles > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`);
      return;
    }

    const newQueuedFiles: QueuedFile[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      newQueuedFiles.push({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        status: "pending",
        progress: 0,
      });
    }

    if (newQueuedFiles.length > 0) {
      setError(null);
      setQueuedFiles((prev) => [...prev, ...newQueuedFiles]);

      // If entityId exists, upload immediately
      if (entityId && resolvedUploadEndpoint) {
        uploadFiles(newQueuedFiles);
      }
    }
  };

  const uploadFiles = async (files: QueuedFile[]) => {
    if (!resolvedUploadEndpoint) return;

    for (const queuedFile of files) {
      setQueuedFiles((prev) =>
        prev.map((qf) =>
          qf.id === queuedFile.id ? { ...qf, status: "uploading" } : qf
        )
      );

      try {
        const formData = new FormData();
        formData.append("file", queuedFile.file);

        const response = await fetch(resolvedUploadEndpoint, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Upload failed: ${response.status}`,
          );
        }

        const result = await response.json();
        const uploadedImage: UploadedImage = result.data || result;

        // Update queued file status
        setQueuedFiles((prev) =>
          prev.map((qf) =>
            qf.id === queuedFile.id
              ? { ...qf, status: "success", progress: 100 }
              : qf
          )
        );

        // Add to existing images
        setExistingImages((prev) => [...prev, uploadedImage]);

        // Callback
        onUploadComplete?.([uploadedImage]);

        // Remove from queue after short delay
        setTimeout(() => {
          setQueuedFiles((prev) =>
            prev.filter((qf) => qf.id !== queuedFile.id)
          );
          URL.revokeObjectURL(queuedFile.preview);
        }, 1000);
      } catch (err) {
        const errorMessage = err instanceof Error
          ? err.message
          : "Upload failed";
        setQueuedFiles((prev) =>
          prev.map((qf) =>
            qf.id === queuedFile.id
              ? { ...qf, status: "error", error: errorMessage }
              : qf
          )
        );
      }
    }
  };

  const removeQueuedFile = (fileId: string) => {
    const file = queuedFiles.find((qf) => qf.id === fileId);
    if (file) {
      URL.revokeObjectURL(file.preview);
    }
    setQueuedFiles((prev) => prev.filter((qf) => qf.id !== fileId));
  };

  const deleteExistingImage = async (imageId: string) => {
    if (!confirm("Delete this image?")) return;

    try {
      // Use proxy endpoint for delete
      const deleteEndpoint = `/api/admin/product-images/${imageId}`;
      const response = await fetch(deleteEndpoint, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
        onDelete?.(imageId);
      } else {
        setError("Failed to delete image");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete image");
    }
  };

  const setAsPrimary = async (imageId: string) => {
    try {
      // Use proxy endpoint for set-primary
      const endpoint = `/api/admin/product-images/${imageId}/set-primary`;
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // Update local state - set this image as primary, unset others
        setExistingImages((prev) =>
          prev.map((img) => ({
            ...img,
            isPrimary: img.id === imageId,
          }))
        );
      } else {
        setError("Failed to set primary image");
      }
    } catch (err) {
      console.error("Set primary error:", err);
      setError("Failed to set primary image");
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      addFiles(multiple ? files : [files[0]]);
    }
  };

  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      addFiles(multiple ? input.files : [input.files[0]]);
    }
    // Reset input to allow selecting same file again
    input.value = "";
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Get queued files for parent form (used in create flow)
  const getQueuedFiles = (): File[] => {
    return queuedFiles
      .filter((qf) => qf.status === "pending")
      .map((qf) => qf.file);
  };

  // Expose method to trigger upload from parent (for create flow)
  // Parent can call this after entity is created
  const triggerUpload = async (newEntityId: string) => {
    const pendingFiles = queuedFiles.filter((qf) => qf.status === "pending");
    if (pendingFiles.length === 0) return;

    // Use proxy endpoint
    const endpoint = uploadEndpoint
      ? uploadEndpoint
      : `/api/admin/${entityType}/${newEntityId}/images`;

    // Update endpoint and upload
    for (const queuedFile of pendingFiles) {
      setQueuedFiles((prev) =>
        prev.map((qf) =>
          qf.id === queuedFile.id ? { ...qf, status: "uploading" } : qf
        )
      );

      try {
        const formData = new FormData();
        formData.append("file", queuedFile.file);

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        const result = await response.json();
        setQueuedFiles((prev) =>
          prev.map((qf) =>
            qf.id === queuedFile.id
              ? { ...qf, status: "success", progress: 100 }
              : qf
          )
        );

        onUploadComplete?.([result.data || result]);
      } catch (_err) {
        setQueuedFiles((prev) =>
          prev.map((qf) =>
            qf.id === queuedFile.id
              ? { ...qf, status: "error", error: "Upload failed" }
              : qf
          )
        );
      }
    }
  };

  // Store methods on ref for parent access
  useEffect(() => {
    // Store on window for form integration (temporary solution)
    // Better approach: use context or callback props
    (globalThis as unknown as Record<string, unknown>).__imageUploadPane = {
      getQueuedFiles,
      triggerUpload,
    };
  }, [queuedFiles]);

  const isCompact = variant === "inline";

  return (
    <div
      class={`${
        isCompact ? "" : "bg-white rounded-lg border border-gray-200 p-4"
      }`}
    >
      {/* Header */}
      {!isCompact && (
        <div class="mb-4">
          <h3 class="text-sm font-semibold text-gray-700">{label}</h3>
          {helpText && <p class="text-xs text-gray-500 mt-1">{helpText}</p>}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            class="ml-2 text-red-400 hover:text-red-600"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Drop zone - hidden in readOnly mode */}
      {!readOnly && (
        <div
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={openFilePicker}
          class={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${
            isDragging
              ? "border-violet-500 bg-violet-50"
              : "border-gray-300 hover:border-violet-400 hover:bg-gray-50"
          }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            class="hidden"
          />

          <div class="space-y-2">
            <div class="text-gray-400">
              <svg
                class="mx-auto h-10 w-10"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="text-sm text-gray-600">
              <span class="font-medium text-violet-600">Click to upload</span>
              {" or drag and drop"}
            </div>
            <p class="text-xs text-gray-500">
              PNG, JPG, WebP, GIF up to {(maxSize / 1024 / 1024).toFixed(0)}MB
            </p>
          </div>
        </div>
      )}

      {/* Queued files (pending upload) */}
      {queuedFiles.length > 0 && (
        <div class="mt-4">
          <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            {entityId ? "Uploading" : "Ready to upload"} ({queuedFiles.length})
          </h4>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {queuedFiles.map((qf) => (
              <div
                key={qf.id}
                class="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
              >
                <img
                  src={qf.preview}
                  alt="Preview"
                  class="w-full h-24 object-cover"
                />

                {/* Status overlay */}
                {qf.status === "uploading" && (
                  <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {qf.status === "success" && (
                  <div class="absolute inset-0 bg-green-500/50 flex items-center justify-center">
                    <svg
                      class="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}

                {qf.status === "error" && (
                  <div class="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                    <svg
                      class="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                )}

                {/* Remove button */}
                {qf.status !== "uploading" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeQueuedFile(qf.id);
                    }}
                    class="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}

                {/* Error message */}
                {qf.error && (
                  <div class="absolute bottom-0 left-0 right-0 p-1 bg-red-600 text-white text-xs truncate">
                    {qf.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing images */}
      {existingImages.length > 0 && (
        <div class="mt-4">
          <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Uploaded ({existingImages.length})
          </h4>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {existingImages.map((img) => (
              <div
                key={img.id}
                class="relative group rounded-lg overflow-hidden border border-gray-200"
              >
                <img
                  src={img.thumbnailUrl || img.url}
                  alt={img.altText || "Product image"}
                  class="w-full h-24 object-cover"
                />

                {/* Primary badge */}
                {img.isPrimary && (
                  <div class="absolute top-1 left-1 px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded flex items-center gap-1">
                    <svg
                      class="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Primary
                  </div>
                )}

                {/* Actions overlay - hidden in readOnly mode */}
                {!readOnly && (
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {/* Set as Primary button */}
                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAsPrimary(img.id);
                        }}
                        class="p-1.5 bg-white rounded-full text-yellow-600 hover:bg-yellow-50"
                        title="Set as primary"
                      >
                        <svg
                          class="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      </button>
                    )}
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="p-1.5 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                      title="View full size"
                    >
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteExistingImage(img.id);
                      }}
                      class="p-1.5 bg-white rounded-full text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div class="mt-4 text-center text-sm text-gray-500">
          Loading images...
        </div>
      )}

      {/* Empty state for edit mode */}
      {entityId &&
        !isLoading &&
        existingImages.length === 0 &&
        queuedFiles.length === 0 && (
        <div class="mt-4 text-center text-sm text-gray-500">
          No images uploaded yet
        </div>
      )}

      {/* Create mode hint */}
      {!entityId && queuedFiles.length > 0 && (
        <p class="mt-3 text-xs text-amber-600">
          Images will be uploaded after saving the form
        </p>
      )}
    </div>
  );
}
