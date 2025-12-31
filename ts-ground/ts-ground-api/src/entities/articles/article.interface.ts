// Base interface for Article entity
export interface Article {
  id: number;
  createdAt: Date;
  updatedAt: Date;

  // TODO: Add your custom fields here
  // Example:
  // name: string;
  // description?: string | null;
  // isActive: boolean;
}

// Interface for creating new Article (without auto-generated fields)
// deno-lint-ignore no-empty-interface
export interface CreateArticle {
  // TODO: Add your required fields for creation
  // Example:
  // name: string;
  // description?: string;
}

// Interface for updating Article (all fields optional except constraints)
// deno-lint-ignore no-empty-interface
export interface UpdateArticle {
  // TODO: Add your updatable fields
  // Example:
  // name?: string;
  // description?: string;
  // isActive?: boolean;
}

// Interface for Article with relations (if needed)
export interface ArticleWithRelations extends Article {
  // TODO: Add related entities here when you have relations
  // Example:
  // author?: User;
  // comments?: Comment[];
}
