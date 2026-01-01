/**
 * Product Detail Page
 */

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { api } from "@/lib/api.ts";
import Navbar from "@/components/Navbar.tsx";
import Footer from "@/components/Footer.tsx";
import AddToCart from "@/islands/AddToCart.tsx";

export const handler = define.handlers({
  async GET(ctx) {
    const slug = ctx.params.slug;

    const response = await api.getProductBySlug(slug);

    if (!response.success || !response.data) {
      return {
        data: {
          product: null,
          error: "Product not found",
          user: ctx.state.user,
          cart: ctx.state.cart,
        },
      };
    }

    return {
      data: {
        product: response.data,
        error: null,
        user: ctx.state.user,
        cart: ctx.state.cart,
      },
    };
  },
});

export default define.page<typeof handler>(
  function ProductDetailPage({ data }) {
    const { product, error, user, cart } = data;
    const cartCount = cart?.items?.length || 0;

    const formatPrice = (price: string | number) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(typeof price === "string" ? parseFloat(price) : price);

    if (error || !product) {
      return (
        <div class="min-h-screen bg-gray-50">
          <Head>
            <title>Product Not Found - TStack Store</title>
          </Head>
          <Navbar user={user} cartCount={cartCount} />
          <div class="h-16"></div>
          <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div class="text-center">
              <h1 class="text-4xl font-bold text-gray-900 mb-4">
                Product Not Found
              </h1>
              <p class="text-gray-600 mb-8">
                The product you're looking for doesn't exist or has been
                removed.
              </p>
              <a
                href="/products"
                class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
              >
                Browse Products
              </a>
            </div>
          </main>
          <Footer />
        </div>
      );
    }

    const mainImage = product.images?.[0];
    const hasDiscount = product.compareAtPrice &&
      parseFloat(product.compareAtPrice) > parseFloat(product.price);
    const discountPercent = hasDiscount
      ? Math.round(
        (1 - parseFloat(product.price) / parseFloat(product.compareAtPrice!)) *
          100,
      )
      : 0;

    return (
      <div class="min-h-screen bg-gray-50">
        <Head>
          <title>{product.name} - TStack Store</title>
          <meta
            name="description"
            content={product.description ||
              `Buy ${product.name} at TStack Store`}
          />
        </Head>

        <Navbar user={user} cartCount={cartCount} />
        <div class="h-16"></div>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav class="mb-8">
            <ol class="flex items-center space-x-2 text-sm">
              <li>
                <a href="/" class="text-gray-500 hover:text-indigo-600">Home</a>
              </li>
              <li class="text-gray-400">/</li>
              <li>
                <a href="/products" class="text-gray-500 hover:text-indigo-600">
                  Products
                </a>
              </li>
              {product.category && (
                <>
                  <li class="text-gray-400">/</li>
                  <li>
                    <a
                      href={`/products?category=${product.categoryId}`}
                      class="text-gray-500 hover:text-indigo-600"
                    >
                      {product.category.name}
                    </a>
                  </li>
                </>
              )}
              <li class="text-gray-400">/</li>
              <li class="text-gray-900 font-medium truncate max-w-[200px]">
                {product.name}
              </li>
            </ol>
          </nav>

          <div class="bg-white rounded-xl shadow-sm overflow-hidden">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
              {/* Image Gallery */}
              <div class="space-y-4">
                {/* Main Image */}
                <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                  {mainImage
                    ? (
                      <img
                        src={mainImage.url}
                        alt={mainImage.alt || product.name}
                        class="w-full h-full object-cover"
                      />
                    )
                    : (
                      <div class="w-full h-full flex items-center justify-center text-gray-400">
                        <svg
                          class="w-24 h-24"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  {hasDiscount && (
                    <span class="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {product.images && product.images.length > 1 && (
                  <div class="flex gap-2 overflow-x-auto pb-2">
                    {product.images.map((img, i) => (
                      <button
                        type="button"
                        key={img.id}
                        class={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                          i === 0
                            ? "border-indigo-500"
                            : "border-transparent hover:border-gray-300"
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.alt || `${product.name} ${i + 1}`}
                          class="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div class="flex flex-col">
                {/* Category & Brand */}
                <div class="flex items-center gap-2 mb-2">
                  {product.category && (
                    <a
                      href={`/products?category=${product.categoryId}`}
                      class="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      {product.category.name}
                    </a>
                  )}
                  {product.category && product.brand && (
                    <span class="text-gray-300">|</span>
                  )}
                  {product.brand && (
                    <span class="text-sm text-gray-500">
                      {product.brand.name}
                    </span>
                  )}
                </div>

                {/* Name */}
                <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>

                {/* Price */}
                <div class="flex items-center gap-3 mb-6">
                  <span class="text-3xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span class="text-xl text-gray-500 line-through">
                        {formatPrice(product.compareAtPrice!)}
                      </span>
                      <span class="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                        Save {formatPrice(
                          parseFloat(product.compareAtPrice!) -
                            parseFloat(product.price),
                        )}
                      </span>
                    </>
                  )}
                </div>

                {/* Stock Status */}
                <div class="mb-6">
                  {product.stockQuantity > 0
                    ? (
                      <div class="flex items-center gap-2 text-green-600">
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span class="font-medium">
                          {product.stockQuantity > 10
                            ? "In Stock"
                            : `Only ${product.stockQuantity} left`}
                        </span>
                      </div>
                    )
                    : (
                      <div class="flex items-center gap-2 text-red-600">
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        <span class="font-medium">Out of Stock</span>
                      </div>
                    )}
                </div>

                {/* Variants */}
                {product.variants && product.variants.length > 0 && (
                  <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Variants
                    </label>
                    <div class="flex flex-wrap gap-2">
                      {product.variants.map((variant) => (
                        <button
                          type="button"
                          key={variant.id}
                          class="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {variant.name}
                          {variant.price && variant.price !== product.price && (
                            <span class="ml-1 text-gray-500">
                              ({formatPrice(variant.price)})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add to Cart */}
                <div class="mb-6">
                  <AddToCart
                    productId={product.id}
                    productName={product.name}
                    maxQuantity={product.stockQuantity}
                    price={product.price}
                  />
                </div>

                {/* Description */}
                {product.description && (
                  <div class="border-t border-gray-200 pt-6">
                    <h2 class="text-lg font-semibold text-gray-900 mb-3">
                      Description
                    </h2>
                    <div class="prose prose-sm text-gray-600">
                      {product.description}
                    </div>
                  </div>
                )}

                {/* SKU */}
                {product.sku && (
                  <div class="mt-6 text-sm text-gray-500">
                    SKU: {product.sku}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  },
);
