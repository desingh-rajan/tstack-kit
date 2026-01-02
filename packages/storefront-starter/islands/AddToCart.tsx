/**
 * Add to Cart Island
 * Interactive component for quantity selection and adding to cart
 */

import { useState } from "preact/hooks";

interface AddToCartProps {
  productId: string;
  productName: string;
  maxQuantity: number;
  price: string;
}

export default function AddToCart(
  { productId, productName, maxQuantity, price: _price }: AddToCartProps,
) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<
    {
      type: "success" | "error";
      text: string;
    } | null
  >(null);

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const addToCart = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity: quantity,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: "success",
          text: `Added ${quantity} ${productName} to cart!`,
        });
        // Refresh page to update cart count in navbar
        setTimeout(() => {
          globalThis.location.reload();
        }, 1000);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to add to cart",
        });
      }
    } catch (_error) {
      setMessage({
        type: "error",
        text: "Failed to add to cart. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inStock = maxQuantity > 0;

  return (
    <div class="space-y-4">
      <div class="flex gap-4">
        {/* Quantity Selector */}
        <div class="flex items-center border border-gray-300 rounded-lg">
          <button
            type="button"
            onClick={decreaseQuantity}
            disabled={quantity <= 1 || !inStock}
            class="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            -
          </button>
          <span class="px-4 py-2 border-x border-gray-300 min-w-[3rem] text-center">
            {quantity}
          </span>
          <button
            type="button"
            onClick={increaseQuantity}
            disabled={quantity >= maxQuantity || !inStock}
            class="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            +
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          type="button"
          onClick={addToCart}
          disabled={!inStock || isLoading}
          class={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
            inStock && !isLoading
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isLoading
            ? (
              <span class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                    fill="none"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Adding...
              </span>
            )
            : inStock
            ? (
              "Add to Cart"
            )
            : (
              "Out of Stock"
            )}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          class={`p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
