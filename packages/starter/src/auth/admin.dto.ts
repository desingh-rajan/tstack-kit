import { z } from "zod";

export const CreateAdminSchema = z.object({
  email: z.string().email("Invalid email format"),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const UpdateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
});

export const GetUsersQuerySchema = z.object({
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("20").transform(Number),
});

export type CreateAdminDTO = z.infer<typeof CreateAdminSchema>;
export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;
export type GetUsersQueryDTO = z.infer<typeof GetUsersQuerySchema>;
