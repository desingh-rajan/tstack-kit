import { and, eq } from "drizzle-orm";
import { db } from "../../config/database.ts";
import { addresses, type AddressType } from "./address.model.ts";
import type {
  AddressResponseDTO,
  CreateAddressDTO,
  UpdateAddressDTO,
} from "./address.dto.ts";

/**
 * Address Service
 *
 * Handles address CRUD with user ownership enforcement
 * and default address management
 */
export class AddressService {
  /**
   * List all addresses for a user
   */
  async listByUser(userId: number): Promise<AddressResponseDTO[]> {
    const result = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(addresses.createdAt);

    return result as AddressResponseDTO[];
  }

  /**
   * Get address by ID with ownership check
   */
  async getById(
    id: string,
    userId: number,
  ): Promise<AddressResponseDTO | null> {
    const result = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .limit(1);

    return result.length === 0 ? null : (result[0] as AddressResponseDTO);
  }

  /**
   * Get address by ID without ownership check (for admin)
   */
  async getByIdAdmin(id: string): Promise<AddressResponseDTO | null> {
    const result = await db
      .select()
      .from(addresses)
      .where(eq(addresses.id, id))
      .limit(1);

    return result.length === 0 ? null : (result[0] as AddressResponseDTO);
  }

  /**
   * Create a new address for a user
   */
  async create(
    userId: number,
    data: CreateAddressDTO,
  ): Promise<AddressResponseDTO> {
    // If this is the first address or isDefault is true, handle default logic
    if (data.isDefault) {
      await this.unsetDefaultAddresses(userId, data.type || "shipping");
    } else {
      // Check if user has any addresses of this type
      const existingAddresses = await db
        .select()
        .from(addresses)
        .where(
          and(
            eq(addresses.userId, userId),
            eq(addresses.type, data.type || "shipping"),
          ),
        )
        .limit(1);

      // If no addresses exist, make this one the default
      if (existingAddresses.length === 0) {
        data.isDefault = true;
      }
    }

    const result = await db
      .insert(addresses)
      .values({
        ...data,
        userId,
      })
      .returning();

    return result[0] as AddressResponseDTO;
  }

  /**
   * Update an address with ownership check
   */
  async update(
    id: string,
    userId: number,
    data: UpdateAddressDTO,
  ): Promise<AddressResponseDTO | null> {
    // Check ownership
    const existing = await this.getById(id, userId);
    if (!existing) {
      return null;
    }

    // Handle default address logic
    if (data.isDefault === true) {
      const type = (data.type || existing.type) as AddressType;
      await this.unsetDefaultAddresses(userId, type, id);
    }

    const result = await db
      .update(addresses)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning();

    return result.length === 0 ? null : (result[0] as AddressResponseDTO);
  }

  /**
   * Delete an address with ownership check
   */
  async delete(id: string, userId: number): Promise<boolean> {
    const existing = await this.getById(id, userId);
    if (!existing) {
      return false;
    }

    // If deleting default address, set another one as default
    if (existing.isDefault) {
      // Delete and get the deleted row
      const result = await db
        .delete(addresses)
        .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
        .returning();

      // Find another address of the same type and make it default
      const remaining = await db
        .select()
        .from(addresses)
        .where(
          and(
            eq(addresses.userId, userId),
            eq(addresses.type, existing.type),
          ),
        )
        .limit(1);

      if (remaining.length > 0) {
        await db
          .update(addresses)
          .set({ isDefault: true, updatedAt: new Date() })
          .where(eq(addresses.id, remaining[0].id));
      }

      return result.length > 0;
    }

    // Delete non-default address
    const result = await db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning();

    return result.length > 0;
  }

  /**
   * Set an address as default
   */
  async setDefault(
    id: string,
    userId: number,
    type?: AddressType,
  ): Promise<AddressResponseDTO | null> {
    const existing = await this.getById(id, userId);
    if (!existing) {
      return null;
    }

    const addressType = type || (existing.type as AddressType);

    // Unset all other defaults of this type
    await this.unsetDefaultAddresses(userId, addressType, id);

    // Set this address as default
    const result = await db
      .update(addresses)
      .set({ isDefault: true, type: addressType, updatedAt: new Date() })
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning();

    return result.length === 0 ? null : (result[0] as AddressResponseDTO);
  }

  /**
   * Get default address for a user by type
   */
  async getDefault(
    userId: number,
    type: AddressType = "shipping",
  ): Promise<AddressResponseDTO | null> {
    const result = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.userId, userId),
          eq(addresses.type, type),
          eq(addresses.isDefault, true),
        ),
      )
      .limit(1);

    return result.length === 0 ? null : (result[0] as AddressResponseDTO);
  }

  /**
   * Unset default flag on all addresses of a type for a user
   * Optionally exclude a specific address ID
   */
  private async unsetDefaultAddresses(
    userId: number,
    type: AddressType,
    _excludeId?: string,
  ): Promise<void> {
    const conditions = [
      eq(addresses.userId, userId),
      eq(addresses.type, type),
      eq(addresses.isDefault, true),
    ];

    await db
      .update(addresses)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(and(...conditions));
  }

  /**
   * Check if user owns address (for validation)
   */
  async verifyOwnership(id: string, userId: number): Promise<boolean> {
    const address = await this.getById(id, userId);
    return address !== null;
  }
}

// Singleton instance
export const addressService = new AddressService();
