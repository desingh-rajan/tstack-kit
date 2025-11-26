import { Context, Next } from "hono";
import { ZodSchema } from "zod";

/**
 * Validates request body against Zod schema
 * Sets c.get('validatedData') on success
 */
export function validate(schema: ZodSchema) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validatedData = schema.parse(body);
      c.set("validatedData", validatedData);
      await next();
    } catch (error) {
      throw error;
    }
  };
}

/**
 * Validates query parameters against Zod schema
 * Sets c.get('validatedQuery') on success
 */
export function validateQuery(schema: ZodSchema) {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      const validatedQuery = schema.parse(query);
      c.set("validatedQuery", validatedQuery);
      await next();
    } catch (error) {
      throw error;
    }
  };
}

/**
 * Validates route parameters against Zod schema
 * Sets c.get('validatedParams') on success
 */
export function validateParams(schema: ZodSchema) {
  return async (c: Context, next: Next) => {
    try {
      const params = c.req.param();
      const validatedParams = schema.parse(params);
      c.set("validatedParams", validatedParams);
      await next();
    } catch (error) {
      throw error;
    }
  };
}
