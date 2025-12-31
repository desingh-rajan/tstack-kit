# Site Settings Type-Safe Configuration Guide

**Status**: Reference documentation for using backend schemas in frontend\
**Last Updated**: November 20, 2025

---

## Overview

The backend defines site settings schemas using Zod
(`blog-v1/src/entities/site_settings/schemas/`). The frontend should leverage
these schemas to:

1. **Auto-generate field configurations** - No manual field definition needed
2. **Ensure type safety** - Match backend Zod types exactly
3. **Provide smart UI** - Detect field types and render appropriate inputs
4. **Validate JSON** - Ensure submitted JSON matches schema

---

## Backend Schema Structure

### Schemas Location

```
blog-v1/src/entities/site_settings/schemas/
├── index.ts              # Main registry
├── general.schemas.ts    # SiteInfo, ContactInfo, ApiConfig
├── appearance.schemas.ts # ThemeConfig
├── features.schemas.ts   # FeatureFlags
└── email.schemas.ts      # EmailSettings
```

### Example: General Schemas

```typescript
// general.schemas.ts
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
```

### Registry

```typescript
// index.ts - All schemas in one place
export const SITE_SETTING_SCHEMAS = {
  site_info: SiteInfoSchema,
  contact_info: ContactInfoSchema,
  api_config: ApiConfigSchema,
  theme_config: ThemeConfigSchema,
  feature_flags: FeatureFlagsSchema,
  email_settings: EmailSettingsSchema,
};

export const DEFAULT_SETTINGS = {
  site_info: DEFAULT_SITE_INFO,
  contact_info: DEFAULT_CONTACT_INFO,
  api_config: DEFAULT_API_CONFIG,
  theme_config: DEFAULT_THEME_CONFIG,
  feature_flags: DEFAULT_FEATURE_FLAGS,
  email_settings: DEFAULT_EMAIL_SETTINGS,
};

export const CATEGORY_MAP: Record<SystemSettingKey, string> = {
  site_info: "general",
  contact_info: "general",
  api_config: "general",
  theme_config: "appearance",
  feature_flags: "features",
  email_settings: "email",
};
```

---

## Frontend Implementation Strategy

### Current Approach (What We're Using)

**File**: `blog-v1-ui/config/entities/site-settings.config.tsx`

```typescript
// Current: Manual field definition
const siteSettingConfig: EntityConfig<SiteSetting> = {
  fields: [
    {
      name: "key",
      label: "Key",
      type: "string",
      // ... manually defined
    },
    {
      name: "value",
      label: "Value",
      type: "json", // ← Works for any JSON object!
      rows: 6,
    },
  ],
};
```

**Pros**: ✅ Works perfectly for any backend schema\
**Cons**: ❌ Manual field mapping needed for each schema

---

## Future Approach: Auto-Generated Configs (Phase 2)

### Concept: Schema-Aware Field Generator

Create a utility that reads Zod schema and generates frontend field configs:

```typescript
// lib/admin/schema-generator.ts (TO BE CREATED)

import { z } from "zod";
import type { FieldConfig } from "@/lib/admin/types.ts";

/**
 * Convert Zod schema field to frontend FieldConfig
 */
export function zodToFieldConfig(
  fieldName: string,
  zodType: z.ZodType<any>,
): FieldConfig {
  // Detect Zod type and map to frontend type
  if (zodType instanceof z.ZodString) {
    if (zodType._def.checks?.some((c) => c.kind === "email")) {
      return {
        name: fieldName,
        label: toTitleCase(fieldName),
        type: "email",
        required: !zodType.isOptional(),
      };
    }
    return {
      name: fieldName,
      label: toTitleCase(fieldName),
      type: "string",
      required: !zodType.isOptional(),
    };
  }

  if (zodType instanceof z.ZodBoolean) {
    return {
      name: fieldName,
      label: toTitleCase(fieldName),
      type: "boolean",
      required: !zodType.isOptional(),
    };
  }

  if (zodType instanceof z.ZodNumber) {
    return {
      name: fieldName,
      label: toTitleCase(fieldName),
      type: "number",
      required: !zodType.isOptional(),
    };
  }

  if (zodType instanceof z.ZodObject) {
    return {
      name: fieldName,
      label: toTitleCase(fieldName),
      type: "json",
      required: !zodType.isOptional(),
      rows: 6,
    };
  }

  // Fallback
  return {
    name: fieldName,
    label: toTitleCase(fieldName),
    type: "string",
  };
}

function toTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
```

### Example Usage (Future)

```typescript
// Pseudo-code for Phase 2
import { SITE_SETTING_SCHEMAS, CATEGORY_MAP } from "@/lib/backend-schemas.ts";
import { zodToFieldConfig } from "@/lib/admin/schema-generator.ts";

export const siteSettingConfigByKey = {
  site_info: {
    key: "site_info",
    schema: SITE_SETTING_SCHEMAS.site_info,
    category: CATEGORY_MAP.site_info,
    fields: [
      zodToFieldConfig("siteName", SITE_SETTING_SCHEMAS.site_info.shape.siteName),
      zodToFieldConfig("tagline", SITE_SETTING_SCHEMAS.site_info.shape.tagline),
      zodToFieldConfig("description", SITE_SETTING_SCHEMAS.site_info.shape.description),
      zodToFieldConfig("logo", SITE_SETTING_SCHEMAS.site_info.shape.logo),
      zodToFieldConfig("favicon", SITE_SETTING_SCHEMAS.site_info.shape.favicon),
    ],
  },
  feature_flags: {
    key: "feature_flags",
    schema: SITE_SETTING_SCHEMAS.feature_flags,
    category: CATEGORY_MAP.feature_flags,
    fields: [
      zodToFieldConfig("enableContactForm", ...),
      zodToFieldConfig("enableNewsletter", ...),
      zodToFieldConfig("enableBlog", ...),
      zodToFieldConfig("enableComments", ...),
      zodToFieldConfig("maintenanceMode", ...),
    ],
  },
};
```

---

## How It Works Today (Nov 20, 2025)

### Why Generic JSON Works

The current solution is actually **superior** for the current use case:

1. **Backend sends JSON value** - Site settings are stored as JSON in the
   database
2. **Frontend shows JSON editor** - `type: "json"` renders a textarea with
   formatted JSON
3. **Form validates JSON** - `handleSubmit()` validates before sending to
   backend
4. **Backend validates against schema** - Backend Zod schema validates the JSON
5. **Error feedback** - If backend validation fails, frontend shows detailed
   errors

**Flow**:

```
Frontend (GenericForm)
  ↓ [JSON Editor]
  ↓ [Validate JSON syntax]
  ↓ [Send as JSON string]
  ↓
Backend (Zod Schema)
  ↓ [Parse JSON]
  ↓ [Validate against schema]
  ↓ [Accept or reject with detailed errors]
  ↓
Frontend (Error Display)
  ↓ [Show field-specific validation errors]
```

### Why This is Better (For Now)

- ✅ **Flexible**: Works with ANY backend schema without frontend changes
- ✅ **Type-safe at backend**: Zod ensures data integrity
- ✅ **Simple UI**: One `type: "json"` handles all object types
- ✅ **Clear errors**: Backend validation shows exact field failures
- ✅ **No duplication**: No need to redefine schemas in frontend

---

## When to Move to Phase 2 (Auto-Generated)

Move to schema-aware generation when:

1. **UX requirement**: Need specialized UI per field (date picker, color picker,
   etc.)
2. **Validation preview**: Show validation errors before backend (client-side)
3. **Nested forms**: Complex nested objects need individual field editors
4. **Performance**: Many settings to load/render (current approach is fine for
   ~10-20)

---

## Reference: Site Settings in Database

```sql
-- Current schema
CREATE TABLE site_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,              -- Stored as JSON
  description TEXT,
  category VARCHAR(50),
  isPublic BOOLEAN DEFAULT FALSE,
  isSystem BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

-- Example rows
INSERT INTO site_settings VALUES
  (1, 'site_info', '{"siteName":"TStack","tagline":"..."}', '...', 'general', true, true, ...),
  (2, 'feature_flags', '{"enableBlog":true,"enableComments":false}', '...', 'features', true, true, ...),
  (3, 'email_settings', '{"smtp":{"host":"...","port":587}}', '...', 'email', false, true, ...);
```

---

## Backend Schemas Reference

### General Category

**site_info**: Site name, tagline, logo, favicon\
**contact_info**: Email, phone, address, social media\
**api_config**: Rate limits, CORS settings (private)

### Appearance Category

**theme_config**: Primary color, secondary color, dark mode settings

### Features Category

**feature_flags**: Boolean toggles for features (blog, newsletter, comments,
etc.)

### Email Category

**email_settings**: SMTP configuration, from email, templates

---

## Notes for tstack Copilot

### When Adding New Site Settings

1. **Define in backend** (`blog-v1/src/entities/site_settings/schemas/`)
   - Create Zod schema
   - Define TypeScript type
   - Create DEFAULT value
   - Add to `SITE_SETTING_SCHEMAS` registry

2. **Frontend automatically works**
   - No frontend changes needed!
   - Generic JSON editor handles it
   - Backend validation ensures correctness

3. **If specialized UI needed** (Phase 2)
   - Add field config generator
   - Override default `type: "json"` with custom types
   - Example: `type: "color"` for theme config

---

## Future Enhancements

### Phase 2: Schema-Aware UI

- [ ] Field type detection from Zod
- [ ] Inline validation preview
- [ ] Custom renderers (color picker, date picker, URL input)
- [ ] Nested object editing UI

### Phase 3: Admin Setting Groups

- [ ] Group settings by category
- [ ] Custom edit pages per category
- [ ] Bulk operations on related settings
- [ ] Setting dependencies and conditionals

### Phase 4: Permission-Based Settings

- [ ] Role-based read/write permissions
- [ ] Audit trail for setting changes
- [ ] Feature flag admin dashboard
- [ ] A/B testing integration

---

## Summary

**Current Status**: ✅ Perfect for dynamic JSON editing\
**Why It Works**: Backend schemas provide validation layer\
**Future Direction**: Phase 2 for specialized UIs when needed

The generic JSON approach is actually a feature, not a limitation—it allows
admin users to edit any site setting without frontend deployment!
