import type { EntityNames } from "../utils/stringUtils.ts";

export function generateServiceTemplate(names: EntityNames): string {
  return `import { eq } from "drizzle-orm";
import { db } from "../../config/database.ts";
import { ${names.plural}, type ${names.pascalSingular}, type New${names.pascalSingular} } from "./${names.singular}.model.ts";
import { NotFoundError } from "../../shared/utils/errors.ts";
import type {
 Create${names.pascalSingular}DTO,
 Update${names.pascalSingular}DTO,
 ${names.pascalSingular}ResponseDTO,
} from "./${names.singular}.dto.ts";

export class ${names.pascalSingular}Service {
 // Get all ${names.plural}
 static async getAll(): Promise<${names.pascalSingular}ResponseDTO[]> {
 const result = await db.select().from(${names.plural});
 return result;
 }

 // Get ${names.singular} by ID
 static async getById(id: number): Promise<${names.pascalSingular}ResponseDTO | null> {
 const result = await db
 .select()
 .from(${names.plural})
 .where(eq(${names.plural}.id, id))
 .limit(1);

 if (result.length === 0) {
 return null;
 }

 return result[0];
 }

 // Create new ${names.singular}
 static async create(data: Create${names.pascalSingular}DTO): Promise<${names.pascalSingular}ResponseDTO> {
 const now = Date.now();
 const newRecord = await db
 .insert(${names.plural})
 .values({
 ...data,
 createdAt: now,
 updatedAt: now,
 })
 .returning();

 return newRecord[0];
 }

 // Update ${names.singular}
 static async update(
 id: number,
 data: Update${names.pascalSingular}DTO
 ): Promise<${names.pascalSingular}ResponseDTO | null> {
 const updated = await db
 .update(${names.plural})
 .set({
 ...data,
 updatedAt: Date.now(),
 })
 .where(eq(${names.plural}.id, id))
 .returning();

 if (updated.length === 0) {
 return null;
 }

 return updated[0];
 }

 // Delete ${names.singular}
 static async delete(id: number): Promise<boolean> {
 const deleted = await db
 .delete(${names.plural})
 .where(eq(${names.plural}.id, id))
 .returning();

 return deleted.length > 0;
 }

 // Soft delete ${names.singular} (deactivate)
 static async softDelete(id: number): Promise<boolean> {
 const updated = await db
 .update(${names.plural})
 .set({
 isActive: false,
 updatedAt: Date.now(),
 })
 .where(eq(${names.plural}.id, id))
 .returning();

 return updated.length > 0;
 }
}
`;
}
