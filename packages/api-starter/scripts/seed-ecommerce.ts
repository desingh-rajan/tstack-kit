/**
 * Seed E-commerce Demo Data
 *
 * Creates sample data for testing the complete e-commerce flow:
 * - Categories
 * - Brands
 * - Products with images
 * - Variant options (sizes, colors)
 *
 * Run: deno task seed:ecommerce
 */

import { db } from "../src/config/database.ts";
import { categories } from "../src/entities/categories/category.model.ts";
import { brands } from "../src/entities/brands/brand.model.ts";
import { products } from "../src/entities/products/product.model.ts";
import { productImages } from "../src/entities/product_images/product-image.model.ts";
import { variantOptions } from "../src/entities/variant_options/variant-option.model.ts";
import { eq } from "drizzle-orm";

// Sample placeholder images (using placeholder services)
const PLACEHOLDER_IMAGES = {
  tshirt: "https://placehold.co/600x600/3b82f6/white?text=T-Shirt",
  jeans: "https://placehold.co/600x600/1e3a5f/white?text=Jeans",
  sneakers: "https://placehold.co/600x600/10b981/white?text=Sneakers",
  watch: "https://placehold.co/600x600/f59e0b/white?text=Watch",
  bag: "https://placehold.co/600x600/8b5cf6/white?text=Bag",
  headphones: "https://placehold.co/600x600/ef4444/white?text=Headphones",
};

async function seedEcommerce() {
  console.log("\n[SEED] Starting e-commerce demo data seed...\n");

  // 1. Seed Categories
  console.log("[SEED] Creating categories...");
  const categoryData = [
    { name: "Clothing", slug: "clothing", description: "Apparel and fashion" },
    { name: "Footwear", slug: "footwear", description: "Shoes and sneakers" },
    {
      name: "Accessories",
      slug: "accessories",
      description: "Watches, bags, and more",
    },
    {
      name: "Electronics",
      slug: "electronics",
      description: "Gadgets and devices",
    },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categoryData) {
    const existing = await db.select().from(categories).where(
      eq(categories.slug, cat.slug),
    ).limit(1);
    if (existing.length === 0) {
      const [created] = await db.insert(categories).values(cat).returning();
      createdCategories[cat.slug] = created.id;
      console.log(`  + Category: ${cat.name}`);
    } else {
      createdCategories[cat.slug] = existing[0].id;
      console.log(`  = Category exists: ${cat.name}`);
    }
  }

  // 2. Seed Brands
  console.log("\n[SEED] Creating brands...");
  const brandData = [
    {
      name: "UrbanStyle",
      slug: "urbanstyle",
      description: "Modern urban fashion",
    },
    {
      name: "SportMax",
      slug: "sportmax",
      description: "Athletic and sports gear",
    },
    {
      name: "TechGear",
      slug: "techgear",
      description: "Premium tech accessories",
    },
    {
      name: "ClassicWear",
      slug: "classicwear",
      description: "Timeless classics",
    },
  ];

  const createdBrands: Record<string, string> = {};
  for (const brand of brandData) {
    const existing = await db.select().from(brands).where(
      eq(brands.slug, brand.slug),
    ).limit(1);
    if (existing.length === 0) {
      const [created] = await db.insert(brands).values(brand).returning();
      createdBrands[brand.slug] = created.id;
      console.log(`  + Brand: ${brand.name}`);
    } else {
      createdBrands[brand.slug] = existing[0].id;
      console.log(`  = Brand exists: ${brand.name}`);
    }
  }

  // 3. Seed Variant Options
  console.log("\n[SEED] Creating variant options...");
  const variantData = [
    // Sizes
    { type: "size", name: "S", displayOrder: 1 },
    { type: "size", name: "M", displayOrder: 2 },
    { type: "size", name: "L", displayOrder: 3 },
    { type: "size", name: "XL", displayOrder: 4 },
    // Shoe sizes
    { type: "shoe_size", name: "US 8", displayOrder: 1 },
    { type: "shoe_size", name: "US 9", displayOrder: 2 },
    { type: "shoe_size", name: "US 10", displayOrder: 3 },
    { type: "shoe_size", name: "US 11", displayOrder: 4 },
    // Colors
    { type: "color", name: "Black", displayOrder: 1 },
    { type: "color", name: "White", displayOrder: 2 },
    { type: "color", name: "Navy Blue", displayOrder: 3 },
    { type: "color", name: "Red", displayOrder: 4 },
  ];

  for (const variant of variantData) {
    const existing = await db.select().from(variantOptions)
      .where(eq(variantOptions.name, variant.name))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(variantOptions).values(variant);
      console.log(`  + Variant: ${variant.type}/${variant.name}`);
    }
  }

  // 4. Seed Products
  console.log("\n[SEED] Creating products...");
  const productData = [
    {
      name: "Classic Cotton T-Shirt",
      slug: "classic-cotton-tshirt",
      description:
        "Premium 100% cotton t-shirt with a comfortable fit. Perfect for everyday wear.",
      price: "599.00",
      compareAtPrice: "799.00",
      sku: "TSH-001",
      stockQuantity: 100,
      categorySlug: "clothing",
      brandSlug: "urbanstyle",
      image: PLACEHOLDER_IMAGES.tshirt,
      specifications: {
        material: "100% Cotton",
        fit: "Regular",
        care: "Machine washable",
      },
    },
    {
      name: "Slim Fit Denim Jeans",
      slug: "slim-fit-denim-jeans",
      description:
        "Modern slim fit jeans with stretch comfort. Versatile style for any occasion.",
      price: "1499.00",
      compareAtPrice: "1999.00",
      sku: "JNS-001",
      stockQuantity: 50,
      categorySlug: "clothing",
      brandSlug: "classicwear",
      image: PLACEHOLDER_IMAGES.jeans,
      specifications: {
        material: "98% Cotton, 2% Elastane",
        fit: "Slim",
        rise: "Mid-rise",
      },
    },
    {
      name: "Running Sneakers Pro",
      slug: "running-sneakers-pro",
      description:
        "Lightweight running shoes with advanced cushioning technology.",
      price: "2999.00",
      compareAtPrice: "3999.00",
      sku: "SNK-001",
      stockQuantity: 30,
      categorySlug: "footwear",
      brandSlug: "sportmax",
      image: PLACEHOLDER_IMAGES.sneakers,
      specifications: {
        material: "Mesh upper",
        sole: "Rubber",
        weight: "280g",
      },
    },
    {
      name: "Minimalist Watch",
      slug: "minimalist-watch",
      description:
        "Elegant minimalist watch with Japanese movement. Water resistant to 30m.",
      price: "4999.00",
      compareAtPrice: "6999.00",
      sku: "WCH-001",
      stockQuantity: 20,
      categorySlug: "accessories",
      brandSlug: "classicwear",
      image: PLACEHOLDER_IMAGES.watch,
      specifications: {
        movement: "Japanese Quartz",
        water_resistance: "30m",
        band: "Leather",
      },
    },
    {
      name: "Leather Messenger Bag",
      slug: "leather-messenger-bag",
      description:
        "Handcrafted genuine leather messenger bag. Perfect for work or travel.",
      price: "3499.00",
      compareAtPrice: null,
      sku: "BAG-001",
      stockQuantity: 15,
      categorySlug: "accessories",
      brandSlug: "urbanstyle",
      image: PLACEHOLDER_IMAGES.bag,
      specifications: {
        material: "Genuine Leather",
        dimensions: "38x28x10cm",
        laptop: "Fits 15 inch",
      },
    },
    {
      name: "Wireless Headphones X1",
      slug: "wireless-headphones-x1",
      description:
        "Premium wireless headphones with active noise cancellation. 30-hour battery life.",
      price: "7999.00",
      compareAtPrice: "9999.00",
      sku: "HPH-001",
      stockQuantity: 25,
      categorySlug: "electronics",
      brandSlug: "techgear",
      image: PLACEHOLDER_IMAGES.headphones,
      specifications: {
        driver: "40mm",
        battery: "30 hours",
        anc: "Yes",
        bluetooth: "5.2",
      },
    },
  ];

  for (const prod of productData) {
    const existing = await db.select().from(products).where(
      eq(products.slug, prod.slug),
    ).limit(1);

    if (existing.length === 0) {
      const [created] = await db.insert(products).values({
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        price: prod.price,
        compareAtPrice: prod.compareAtPrice,
        sku: prod.sku,
        stockQuantity: prod.stockQuantity,
        categoryId: createdCategories[prod.categorySlug],
        brandId: createdBrands[prod.brandSlug],
        specifications: prod.specifications,
        isActive: true,
      }).returning();

      // Add product image
      await db.insert(productImages).values({
        productId: created.id,
        url: prod.image,
        thumbnailUrl: prod.image.replace("600x600", "200x200"),
        altText: prod.name,
        isPrimary: true,
        sortOrder: 0,
      });

      console.log(`  + Product: ${prod.name} (${prod.sku}) - Rs.${prod.price}`);
    } else {
      console.log(`  = Product exists: ${prod.name}`);
    }
  }

  console.log("\n[SEED] E-commerce seed completed!");
  console.log("\n--------------------------------------------");
  console.log("Test the flow:");
  console.log("1. Visit storefront: http://localhost:5174/products");
  console.log("2. Add items to cart");
  console.log("3. Checkout and pay with Razorpay (test mode)");
  console.log("--------------------------------------------\n");
}

// Run
seedEcommerce()
  .then(() => Deno.exit(0))
  .catch((err) => {
    console.error("[SEED] Error:", err);
    Deno.exit(1);
  });
