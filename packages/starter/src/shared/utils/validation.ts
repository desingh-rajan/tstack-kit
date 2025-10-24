import { z } from "zod";
import { ValidationError } from "./errors.ts";

export class ValidationUtil {
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError("Validation failed", error.errors);
      }
      throw error;
    }
  }

  static validateSync<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError("Validation failed", error.errors);
      }
      throw error;
    }
  }

  static safeValidate<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
  ): { success: boolean; data?: T; errors?: unknown } {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, errors: result.error.errors };
  }
}

// Common validation schemas
export const commonSchemas = {
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  id: z.number().int().positive("ID must be a positive integer"),
  uuid: z.string().uuid("Invalid UUID format"),
  url: z.string().url("Invalid URL format"),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number"),
};
