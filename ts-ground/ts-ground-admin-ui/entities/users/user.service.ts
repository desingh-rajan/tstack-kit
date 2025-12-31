/**
 * User Service
 * Extends BaseService for standard CRUD
 */

import { BaseService } from "@/lib/base-service.ts";
import type { User } from "./user.types.ts";

export class UserService extends BaseService<User> {
  constructor() {
    super("/ts-admin/users");
  }
}

export const userService = new UserService();
