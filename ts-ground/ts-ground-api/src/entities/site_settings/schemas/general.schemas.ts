import { z } from "zod";

/**
 * Site Info Schema
 * Basic site information displayed in header and meta tags
 */
export const SiteInfoSchema = z.object({
  siteName: z.string().min(1).max(100),
  tagline: z.string().max(200),
  description: z.string().max(500),
  logo: z.string(),
  favicon: z.string(),
});

export type SiteInfo = z.infer<typeof SiteInfoSchema>;

export const DEFAULT_SITE_INFO: SiteInfo = {
  siteName: "My Application",
  tagline: "Building amazing things",
  description: "A modern web application built with TonyStack",
  logo: "/assets/logo.svg",
  favicon: "/assets/favicon.ico",
};

/**
 * Contact Info Schema
 * Contact information and social media links
 */
export const ContactInfoSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  socialMedia: z.object({
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
  }).optional(),
});

export type ContactInfo = z.infer<typeof ContactInfoSchema>;

export const DEFAULT_CONTACT_INFO: ContactInfo = {
  email: "hello@example.com",
  phone: "+1 (555) 123-4567",
  address: "123 Main Street, City, State 12345",
  socialMedia: {
    twitter: "https://twitter.com/yourhandle",
    linkedin: "https://linkedin.com/company/yourcompany",
    github: "https://github.com/yourorg",
  },
};

/**
 * API Config Schema
 * API configuration settings (private - backend only)
 */
export const ApiConfigSchema = z.object({
  rateLimit: z.object({
    enabled: z.boolean(),
    maxRequests: z.number().int().positive(),
    windowMs: z.number().int().positive(),
  }),
  cors: z.object({
    allowedOrigins: z.array(z.string()),
  }),
});

export type ApiConfig = z.infer<typeof ApiConfigSchema>;

export const DEFAULT_API_CONFIG: ApiConfig = {
  rateLimit: {
    enabled: true,
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  },
  cors: {
    allowedOrigins: ["http://localhost:3000"],
  },
};
