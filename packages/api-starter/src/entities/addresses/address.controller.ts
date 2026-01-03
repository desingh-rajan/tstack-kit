import { Context } from "hono";
import { addressService } from "./address.service.ts";
import { ValidationUtil } from "../../shared/utils/validation.ts";
import { ApiResponse } from "../../shared/utils/response.ts";
import {
  CreateAddressSchema,
  SetDefaultAddressSchema,
  UpdateAddressSchema,
} from "./address.dto.ts";

/**
 * Address Controller
 *
 * User endpoints: Full CRUD with ownership enforcement
 * All endpoints require authentication
 */
export class AddressController {
  /**
   * GET /addresses - List all addresses for the current user
   */
  static async list(c: Context) {
    const userId = c.get("userId") as number;
    const addresses = await addressService.listByUser(userId);

    return c.json(ApiResponse.success(addresses));
  }

  /**
   * GET /addresses/:id - Get address by ID
   */
  static async getById(c: Context) {
    const userId = c.get("userId") as number;
    const id = c.req.param("id");

    const address = await addressService.getById(id, userId);

    if (!address) {
      return c.json(ApiResponse.error("Address not found"), 404);
    }

    return c.json(ApiResponse.success(address));
  }

  /**
   * POST /addresses - Create a new address
   */
  static async create(c: Context) {
    const userId = c.get("userId") as number;
    const body = await c.req.json();
    const validatedData = ValidationUtil.validateSync(
      CreateAddressSchema,
      body,
    );

    const address = await addressService.create(userId, validatedData);

    return c.json(
      ApiResponse.success(address, "Address created successfully"),
      201,
    );
  }

  /**
   * PUT /addresses/:id - Update an address
   */
  static async update(c: Context) {
    const userId = c.get("userId") as number;
    const id = c.req.param("id");
    const body = await c.req.json();
    const validatedData = ValidationUtil.validateSync(
      UpdateAddressSchema,
      body,
    );

    const address = await addressService.update(id, userId, validatedData);

    if (!address) {
      return c.json(ApiResponse.error("Address not found"), 404);
    }

    return c.json(ApiResponse.success(address, "Address updated successfully"));
  }

  /**
   * DELETE /addresses/:id - Delete an address
   */
  static async delete(c: Context) {
    const userId = c.get("userId") as number;
    const id = c.req.param("id");

    const deleted = await addressService.delete(id, userId);

    if (!deleted) {
      return c.json(ApiResponse.error("Address not found"), 404);
    }

    return c.json(ApiResponse.success(null, "Address deleted successfully"));
  }

  /**
   * PUT /addresses/:id/default - Set address as default
   */
  static async setDefault(c: Context) {
    const userId = c.get("userId") as number;
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const { type } = ValidationUtil.validateSync(SetDefaultAddressSchema, body);

    const address = await addressService.setDefault(id, userId, type);

    if (!address) {
      return c.json(ApiResponse.error("Address not found"), 404);
    }

    return c.json(
      ApiResponse.success(address, "Default address updated successfully"),
    );
  }

  /**
   * GET /addresses/default/:type - Get default address by type
   */
  static async getDefault(c: Context) {
    const userId = c.get("userId") as number;
    const type = c.req.param("type") as "shipping" | "billing";

    if (type !== "shipping" && type !== "billing") {
      return c.json(
        ApiResponse.error("Invalid address type. Use 'shipping' or 'billing'"),
        400,
      );
    }

    const address = await addressService.getDefault(userId, type);

    if (!address) {
      return c.json(
        ApiResponse.error(`No default ${type} address found`),
        404,
      );
    }

    return c.json(ApiResponse.success(address));
  }
}
