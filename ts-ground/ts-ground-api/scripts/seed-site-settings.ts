import { db } from "../src/config/database.ts";
import { siteSettings } from "../src/entities/site_settings/site-setting.model.ts";
import { eq } from "drizzle-orm";

/**
 * Seed site settings with default data
 * This creates default site configuration settings for new projects
 */

const defaultSettings = [
  // Site Info
  {
    key: "site_info",
    category: "general",
    value: {
      siteName: "My Application",
      tagline: "Building amazing things",
      description: "A modern web application built with TonyStack",
      logo: "/assets/logo.svg",
      favicon: "/assets/favicon.ico",
    },
    isSystem: true,
    isPublic: true,
    description: "Basic site information displayed in header and meta tags",
  },

  // Contact Info
  {
    key: "contact_info",
    category: "general",
    value: {
      email: "hello@example.com",
      phone: "+1 (555) 123-4567",
      address: "123 Main Street, City, State 12345",
      socialMedia: {
        twitter: "https://twitter.com/yourhandle",
        linkedin: "https://linkedin.com/company/yourcompany",
        github: "https://github.com/yourorg",
      },
    },
    isSystem: true,
    isPublic: true,
    description: "Contact information and social media links",
  },

  // Theme Configuration
  {
    key: "theme_config",
    category: "appearance",
    value: {
      primaryColor: "#3b82f6",
      secondaryColor: "#10b981",
      darkMode: false,
      fontFamily: "Inter, system-ui, sans-serif",
    },
    isSystem: true,
    isPublic: true,
    description: "UI theme and appearance settings",
  },

  // Feature Flags
  {
    key: "feature_flags",
    category: "features",
    value: {
      enableContactForm: true,
      enableNewsletter: true,
      enableBlog: true,
      enableComments: false,
      maintenanceMode: false,
    },
    isSystem: true,
    isPublic: true,
    description: "Feature toggle flags for the application",
  },

  // Email Settings (Private)
  {
    key: "email_settings",
    category: "email",
    value: {
      smtp_host: "smtp.example.com",
      smtp_port: 587,
      from_email: "noreply@example.com",
      from_name: "My Application",
    },
    isSystem: true,
    isPublic: false,
    description: "Email/SMTP configuration (private - backend only)",
  },

  // API Configuration (Private)
  {
    key: "api_config",
    category: "general",
    value: {
      rateLimit: {
        enabled: true,
        maxRequests: 100,
        windowMs: 60000, // 1 minute
      },
      cors: {
        allowedOrigins: ["http://localhost:3000"],
      },
    },
    isSystem: true,
    isPublic: false,
    description: "API configuration settings (private - backend only)",
  },
];

async function seedSiteSettings() {
  console.log("[SEED] Seeding site settings...");
  console.log(`[INFO] Processing ${defaultSettings.length} settings...\n`);

  let created = 0;
  let skipped = 0;

  for (const setting of defaultSettings) {
    // Check if setting already exists
    const existing = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, setting.key))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[SKIP] Setting already exists: ${setting.key}`);
      skipped++;
      continue;
    }

    // Create new setting
    await db.insert(siteSettings).values(setting);
    console.log(`[OK] Created: ${setting.key} (${setting.category})`);
    created++;
  }

  console.log(`\n[SUMMARY]`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Total:   ${defaultSettings.length}`);
}

// Run seed
if (import.meta.main) {
  try {
    await seedSiteSettings();
    console.log("\n[SUCCESS] Site settings seeding completed successfully");
    await db.$client.end();
    Deno.exit(0);
  } catch (error) {
    console.error("\n[ERROR] Seeding failed:", error);
    await db.$client.end();
    Deno.exit(1);
  }
}
