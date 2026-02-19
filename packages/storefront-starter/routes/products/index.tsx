/**
 * Products Listing Page
 */

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { api, type Category, type Product } from "@/lib/api.ts";
import Navbar from "@/components/Navbar.tsx";
import Footer from "@/components/Footer.tsx";

export const handler = define.handlers({
  async GET(ctx) {
    const url = ctx.url;
    const page = parseInt(url.searchParams.get("page") || "1");
    const search = url.searchParams.get("search") || undefined;
    const category = url.searchParams.get("category") || undefined;
    const sortBy = url.searchParams.get("sort") || "createdAt";
    const sortOrder = (url.searchParams.get("order") || "desc") as
      | "asc"
      | "desc";

    const [productsResponse, categoriesResponse] = await Promise.all([
      api.getProducts({
        page,
        limit: 12,
        search,
        category,
        sortBy,
        sortOrder,
      }),
      api.getCategories(),
    ]);

    const productsData = productsResponse.data;
    const products = productsData?.items || productsData || [];
    const total = productsData?.total || 0;

    return {
      data: {
        products: Array.isArray(products) ? products : [],
        categories: categoriesResponse.data || [],
        total,
        page,
        search: search || "",
        category: category || "",
        sortBy,
        sortOrder,
        user: ctx.state.user,
        cart: ctx.state.cart,
      },
    };
  },
});

export default define.page<typeof handler>(function ProductsPage({ data }) {
  const {
    products,
    categories,
    total,
    page,
    search,
    category,
    sortBy,
    sortOrder,
    user,
    cart,
  } = data;
  const cartCount = cart?.items?.length || 0;
  const totalPages = Math.ceil(total / 12);

  const formatPrice = (price: string | number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(typeof price === "string" ? parseFloat(price) : price);

  return (
    <div class="min-h-screen bg-gray-50">
      <Head>
        <title>Products - TStack Store</title>
        <meta name="description" content="Browse our collection of products" />
      </Head>

      <Navbar user={user} cartCount={cartCount} />

      {/* Spacer for fixed navbar */}
      <div class="h-16"></div>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Products</h1>
          <p class="mt-2 text-gray-600">
            {total > 0
              ? `Showing ${products.length} of ${total} products`
              : "No products found"}
          </p>
        </div>

        <div class="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside class="w-full lg:w-64 flex-shrink-0">
            <div class="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Filters</h2>

              {/* Search */}
              <form method="GET" class="mb-6">
                <input type="hidden" name="category" value={category} />
                <input type="hidden" name="sort" value={sortBy} />
                <input type="hidden" name="order" value={sortOrder} />
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div class="flex gap-2">
                  <input
                    type="text"
                    name="search"
                    value={search}
                    placeholder="Search products..."
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    class="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </div>
              </form>

              {/* Categories */}
              {categories.length > 0 && (
                <div class="mb-6">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <div class="space-y-2">
                    <a
                      href={`/products?search=${search}&sort=${sortBy}&order=${sortOrder}`}
                      class={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        !category
                          ? "bg-indigo-100 text-indigo-700 font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      All Categories
                    </a>
                    {categories.map((cat: Category) => (
                      <a
                        key={cat.id}
                        href={`/products?category=${cat.slug}&search=${search}&sort=${sortBy}&order=${sortOrder}`}
                        class={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          category === cat.slug
                            ? "bg-indigo-100 text-indigo-700 font-medium"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {cat.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Sort */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  onchange="window.location.href = this.value"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option
                    value={`/products?category=${category}&search=${search}&sort=createdAt&order=desc`}
                    selected={sortBy === "createdAt" && sortOrder === "desc"}
                  >
                    Newest First
                  </option>
                  <option
                    value={`/products?category=${category}&search=${search}&sort=price&order=asc`}
                    selected={sortBy === "price" && sortOrder === "asc"}
                  >
                    Price: Low to High
                  </option>
                  <option
                    value={`/products?category=${category}&search=${search}&sort=price&order=desc`}
                    selected={sortBy === "price" && sortOrder === "desc"}
                  >
                    Price: High to Low
                  </option>
                  <option
                    value={`/products?category=${category}&search=${search}&sort=name&order=asc`}
                    selected={sortBy === "name" && sortOrder === "asc"}
                  >
                    Name: A to Z
                  </option>
                </select>
              </div>

              {/* Clear filters */}
              {(search || category) && (
                <a
                  href="/products"
                  class="mt-4 block text-center text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Clear all filters
                </a>
              )}
            </div>
          </aside>

          {/* Products Grid */}
          <div class="flex-1">
            {products.length === 0
              ? (
                <div class="bg-white rounded-lg shadow-sm p-12 text-center">
                  <svg
                    class="mx-auto h-16 w-16 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <h2 class="mt-4 text-xl font-medium text-gray-900">
                    No products found
                  </h2>
                  <p class="mt-2 text-gray-600">
                    {search
                      ? "Try adjusting your search or filters"
                      : "Check back later for new products"}
                  </p>
                  {search && (
                    <a
                      href="/products"
                      class="mt-4 inline-block text-indigo-600 hover:text-indigo-500"
                    >
                      Clear search
                    </a>
                  )}
                </div>
              )
              : (
                <>
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product: Product) => (
                      <a
                        key={product.id}
                        href={`/products/${product.slug}`}
                        class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
                      >
                        {/* Product Image */}
                        <div class="aspect-square bg-gray-100 relative overflow-hidden">
                          {product.images && product.images.length > 0
                            ? (
                              <img
                                src={product.images[0].url}
                                alt={product.images[0].alt || product.name}
                                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )
                            : (
                              <div class="w-full h-full flex items-center justify-center text-gray-400">
                                <svg
                                  class="w-16 h-16"
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
                          {product.compareAtPrice &&
                            parseFloat(product.compareAtPrice) >
                              parseFloat(product.price) &&
                            (
                              <span class="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                SALE
                              </span>
                            )}
                          {product.stockQuantity <= 0 && (
                            <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span class="bg-white text-gray-900 px-4 py-2 rounded-full font-medium">
                                Out of Stock
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div class="p-4">
                          {product.category && (
                            <p class="text-xs text-indigo-600 font-medium mb-1">
                              {product.category.name}
                            </p>
                          )}
                          <h3 class="text-gray-900 font-medium line-clamp-2 group-hover:text-indigo-600 transition-colors">
                            {product.name}
                          </h3>
                          <div class="mt-2 flex items-center gap-2">
                            <span class="text-lg font-bold text-gray-900">
                              {formatPrice(product.price)}
                            </span>
                            {product.compareAtPrice &&
                              parseFloat(product.compareAtPrice) >
                                parseFloat(product.price) &&
                              (
                                <span class="text-sm text-gray-500 line-through">
                                  {formatPrice(product.compareAtPrice)}
                                </span>
                              )}
                          </div>
                          {product.variants && product.variants.length > 0 && (
                            <p class="mt-1 text-xs text-gray-500">
                              {product.variants.length} variants available
                            </p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div class="mt-8 flex justify-center">
                      <nav class="flex items-center gap-2">
                        {page > 1 && (
                          <a
                            href={`/products?page=${
                              page - 1
                            }&category=${category}&search=${search}&sort=${sortBy}&order=${sortOrder}`}
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Previous
                          </a>
                        )}

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((p) =>
                            p === 1 || p === totalPages ||
                            (p >= page - 2 && p <= page + 2)
                          )
                          .map((p, i, arr) => (
                            <>
                              {i > 0 && arr[i - 1] !== p - 1 && (
                                <span class="px-2 text-gray-400">...</span>
                              )}
                              <a
                                key={p}
                                href={`/products?page=${p}&category=${category}&search=${search}&sort=${sortBy}&order=${sortOrder}`}
                                class={`px-4 py-2 text-sm font-medium rounded-lg ${
                                  p === page
                                    ? "bg-indigo-600 text-white"
                                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {p}
                              </a>
                            </>
                          ))}

                        {page < totalPages && (
                          <a
                            href={`/products?page=${
                              page + 1
                            }&category=${category}&search=${search}&sort=${sortBy}&order=${sortOrder}`}
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Next
                          </a>
                        )}
                      </nav>
                    </div>
                  )}
                </>
              )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
});
