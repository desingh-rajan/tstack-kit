import { z } from "zod";

/**
 * Address DTOs
 *
 * Validation schemas for address CRUD operations
 */

// Indian phone number regex (10 digits, optionally with +91)
const phoneRegex = /^(\+91)?[6-9]\d{9}$/;

// Indian postal code regex (6 digits)
const postalCodeRegex = /^\d{6}$/;

// Create Address DTO
export const CreateAddressSchema = z.object({
  label: z.string().max(50, "Label too long").optional().nullable(),
  fullName: z.string().min(1, "Full name is required").max(
    100,
    "Name too long",
  ),
  phone: z.string()
    .min(10, "Phone number is required")
    .max(15, "Phone number too long")
    .regex(phoneRegex, "Invalid Indian phone number"),
  addressLine1: z.string()
    .min(1, "Address line 1 is required")
    .max(255, "Address too long"),
  addressLine2: z.string().max(255, "Address too long").optional().nullable(),
  city: z.string().min(1, "City is required").max(100, "City name too long"),
  state: z.string().min(1, "State is required").max(100, "State name too long"),
  postalCode: z.string()
    .min(1, "Postal code is required")
    .regex(postalCodeRegex, "Invalid Indian postal code (6 digits)"),
  country: z.string().max(100).optional().default("India"),
  type: z.enum(["shipping", "billing"]).optional().default("shipping"),
  isDefault: z.boolean().optional().default(false),
});

export type CreateAddressDTO = z.infer<typeof CreateAddressSchema>;

// Update Address DTO
export const UpdateAddressSchema = z.object({
  label: z.string().max(50).optional().nullable(),
  fullName: z.string().min(1).max(100).optional(),
  phone: z.string()
    .min(10)
    .max(15)
    .regex(phoneRegex, "Invalid Indian phone number")
    .optional(),
  addressLine1: z.string().min(1).max(255).optional(),
  addressLine2: z.string().max(255).optional().nullable(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  postalCode: z.string()
    .regex(postalCodeRegex, "Invalid Indian postal code (6 digits)")
    .optional(),
  country: z.string().max(100).optional(),
  type: z.enum(["shipping", "billing"]).optional(),
  isDefault: z.boolean().optional(),
});

export type UpdateAddressDTO = z.infer<typeof UpdateAddressSchema>;

// Address Response DTO
export interface AddressResponseDTO {
  id: string;
  userId: number;
  label: string | null;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  type: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Set Default Address DTO
export const SetDefaultAddressSchema = z.object({
  type: z.enum(["shipping", "billing"]).optional(),
});

export type SetDefaultAddressDTO = z.infer<typeof SetDefaultAddressSchema>;
