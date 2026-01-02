/**
 * Product Gallery Island
 * Interactive image gallery with thumbnail switching
 */

import { useState } from "preact/hooks";

interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  alt?: string | null;
}

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  discountPercent?: number;
}

export default function ProductGallery({
  images,
  productName,
  discountPercent,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div class="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
        <svg
          class="w-24 h-24 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const selectedImage = images[selectedIndex];

  return (
    <div class="space-y-4">
      {/* Main Image */}
      <div class="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
        <img
          src={selectedImage.url}
          alt={selectedImage.alt || productName}
          class="w-full h-full object-cover"
        />
        {discountPercent && discountPercent > 0 && (
          <span class="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">
            {discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div class="flex gap-2 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              type="button"
              key={img.id}
              onClick={() => setSelectedIndex(i)}
              class={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                i === selectedIndex
                  ? "border-indigo-500"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <img
                src={img.thumbnailUrl || img.url}
                alt={img.alt || `${productName} ${i + 1}`}
                class="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
