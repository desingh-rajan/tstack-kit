import type { EntityNames } from "../utils/stringUtils.ts";

export function generateControllerTemplate(
  names: EntityNames,
  withValidation = true,
): string {
  if (withValidation) {
    return `import { Context } from "hono";
import { ${names.pascalSingular}Service } from "./${names.kebabSingular}.service.ts";
import { ValidationUtil } from "../../shared/utils/validation.ts";
import { ApiResponse } from "../../shared/utils/response.ts";
import { NotFoundError } from "../../shared/utils/errors.ts";
import {
 Create${names.pascalSingular}Schema,
 Update${names.pascalSingular}Schema,
} from "./${names.kebabSingular}.dto.ts";

export class ${names.pascalSingular}Controller {
 // GET /${names.kebabPlural}
 static async getAll(c: Context) {
 const ${names.plural} = await ${names.pascalSingular}Service.getAll();
 return c.json(
 ApiResponse.success(${names.plural}, "${names.pascalPlural} retrieved successfully"),
 200
 );
 }

 // GET /${names.kebabPlural}/:id
 static async getById(c: Context) {
 const id = parseInt(c.req.param("id"));
 const ${names.singular} = await ${names.pascalSingular}Service.getById(id);

 if (!${names.singular}) {
 throw new NotFoundError("${names.pascalSingular} not found");
 }

 return c.json(
 ApiResponse.success(${names.singular}, "${names.pascalSingular} retrieved successfully"),
 200
 );
 }

 // POST /${names.kebabPlural}
 static async create(c: Context) {
 const body = await c.req.json();
 const validatedData = ValidationUtil.validateSync(Create${names.pascalSingular}Schema, body);

 const ${names.singular} = await ${names.pascalSingular}Service.create(validatedData);

 return c.json(
 ApiResponse.success(${names.singular}, "${names.pascalSingular} created successfully"),
 201
 );
 }

 // PUT /${names.kebabPlural}/:id
 static async update(c: Context) {
 const id = parseInt(c.req.param("id"));
 const body = await c.req.json();
 const validatedData = ValidationUtil.validateSync(Update${names.pascalSingular}Schema, body);

 const ${names.singular} = await ${names.pascalSingular}Service.update(id, validatedData);

 if (!${names.singular}) {
 throw new NotFoundError("${names.pascalSingular} not found");
 }

 return c.json(
 ApiResponse.success(${names.singular}, "${names.pascalSingular} updated successfully"),
 200
 );
 }

 // DELETE /${names.kebabPlural}/:id
 static async delete(c: Context) {
 const id = parseInt(c.req.param("id"));
 const success = await ${names.pascalSingular}Service.delete(id);

 if (!success) {
 throw new NotFoundError("${names.pascalSingular} not found");
 }

 return c.json(
 ApiResponse.success(null, "${names.pascalSingular} deleted successfully"),
 200
 );
 }
}
`;
  } else {
    return `import { Context } from "hono";
import { ${names.pascalSingular}Service } from "./${names.kebabSingular}.service.ts";
import { ApiResponse } from "../../shared/utils/response.ts";
import { NotFoundError } from "../../shared/utils/errors.ts";
import type {
 Create${names.pascalSingular}DTO,
 Update${names.pascalSingular}DTO,
} from "./${names.kebabSingular}.dto.ts";

export class ${names.pascalSingular}Controller {
 // GET /${names.kebabPlural}
 static async getAll(c: Context) {
 const ${names.plural} = await ${names.pascalSingular}Service.getAll();
 return c.json(
 ApiResponse.success(${names.plural}, "${names.pascalPlural} retrieved successfully"),
 200
 );
 }

 // GET /${names.kebabPlural}/:id
 static async getById(c: Context) {
 const id = parseInt(c.req.param("id"));
 const ${names.singular} = await ${names.pascalSingular}Service.getById(id);

 if (!${names.singular}) {
 throw new NotFoundError("${names.pascalSingular} not found");
 }

 return c.json(
 ApiResponse.success(${names.singular}, "${names.pascalSingular} retrieved successfully"),
 200
 );
 }

 // POST /${names.kebabPlural}
 static async create(c: Context) {
 const body: Create${names.pascalSingular}DTO = await c.req.json();
 // No validation - add validation later by implementing Zod schemas

 const ${names.singular} = await ${names.pascalSingular}Service.create(body);

 return c.json(
 ApiResponse.success(${names.singular}, "${names.pascalSingular} created successfully"),
 201
 );
 }

 // PUT /${names.kebabPlural}/:id
 static async update(c: Context) {
 const id = parseInt(c.req.param("id"));
 const body: Update${names.pascalSingular}DTO = await c.req.json();
 // No validation - add validation later by implementing Zod schemas

 const ${names.singular} = await ${names.pascalSingular}Service.update(id, body);

 if (!${names.singular}) {
 throw new NotFoundError("${names.pascalSingular} not found");
 }

 return c.json(
 ApiResponse.success(${names.singular}, "${names.pascalSingular} updated successfully"),
 200
 );
 }

 // DELETE /${names.kebabPlural}/:id
 static async delete(c: Context) {
 const id = parseInt(c.req.param("id"));
 const success = await ${names.pascalSingular}Service.delete(id);

 if (!success) {
 throw new NotFoundError("${names.pascalSingular} not found");
 }

 return c.json(
 ApiResponse.success(null, "${names.pascalSingular} deleted successfully"),
 200
 );
 }
}
`;
  }
}
