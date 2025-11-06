export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function pascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => capitalize(word.toLowerCase()))
    .join("");
}

export function camelCase(str: string): string {
  const pascal = pascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

export function snakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

export function pluralize(str: string): string {
  const irregulars: Record<string, string> = {
    person: "people",
    child: "children",
    man: "men",
    woman: "women",
    tooth: "teeth",
    foot: "feet",
    mouse: "mice",
    goose: "geese",
  };

  const lower = str.toLowerCase();
  if (irregulars[lower]) return irregulars[lower];
  if (/s$/i.test(str) && !/ss$/i.test(str)) return str;
  if (/[^aeiou]y$/i.test(str)) return str.slice(0, -1) + "ies";
  if (/(?:ss|sh|ch|x|z)$/i.test(str)) return str + "es";
  if (/f$/i.test(str)) return str.slice(0, -1) + "ves";
  if (/fe$/i.test(str)) return str.slice(0, -2) + "ves";
  return str + "s";
}

export function singularize(str: string): string {
  const irregulars: Record<string, string> = {
    people: "person",
    children: "child",
    men: "man",
    women: "woman",
    teeth: "tooth",
    feet: "foot",
    mice: "mouse",
    geese: "goose",
  };

  const lower = str.toLowerCase();
  if (irregulars[lower]) return irregulars[lower];
  if (/ies$/i.test(str)) return str.slice(0, -3) + "y";
  if (/ves$/i.test(str)) return str.slice(0, -3) + "f";
  if (/(?:ses|shes|ches|xes|zes)$/i.test(str)) return str.slice(0, -2);
  if (/s$/i.test(str)) return str.slice(0, -1);
  return str;
}

export function isValidEntityName(name: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name);
}

/**
 * Entity naming variations for consistent code generation
 *
 * Example: input "site_settings" or "SiteSettings" generates:
 * - Folder: site_settings/ (snake_case, matches database table)
 * - Files: site-setting.*.ts (kebab-case singular, modern TS convention)
 * - Routes: /site-settings (kebab-case plural, RESTful standard)
 * - Classes: SiteSetting, SiteSettings (PascalCase, TS standard)
 * - Variables: siteSetting, siteSettings (camelCase, TS standard)
 * - Table: site_settings (snake_case, SQL standard)
 */
export interface EntityNames {
  singular: string; // camelCase: siteSetting (for variables)
  plural: string; // camelCase: siteSettings (for variables)
  pascalSingular: string; // PascalCase: SiteSetting (for class names)
  pascalPlural: string; // PascalCase: SiteSettings (for class names)
  kebabSingular: string; // kebab-case: site-setting (for file names)
  kebabPlural: string; // kebab-case: site-settings (for routes)
  snakeSingular: string; // snake_case: site_setting (for database columns)
  snakePlural: string; // snake_case: site_settings (for folders & tables)
  tableName: string; // snake_case: site_settings (alias for snakePlural)
}

/**
 * Generate all naming variations for an entity
 *
 * Handles any input format (camelCase, PascalCase, snake_case, kebab-case)
 * and generates consistent naming across all conventions.
 *
 * @param input - Entity name in any case format
 * @returns EntityNames object with all naming variations
 *
 * @example
 * ```ts
 * getEntityNames("site_settings")
 * // Returns:
 * // {
 * //   singular: "siteSetting",
 * //   plural: "siteSettings",
 * //   pascalSingular: "SiteSetting",
 * //   pascalPlural: "SiteSettings",
 * //   kebabSingular: "site-setting",
 * //   kebabPlural: "site-settings",
 * //   snakeSingular: "site_setting",
 * //   snakePlural: "site_settings",
 * //   tableName: "site_settings"
 * // }
 * ```
 */
export function getEntityNames(input: string): EntityNames {
  // First normalize the input to get clean base forms
  // This preserves word boundaries: site_settings → site_settings
  const normalizedInput = input.replace(/[-\s]+/g, "_").toLowerCase();

  // Apply singularize/pluralize to the normalized form
  const singularBase = singularize(normalizedInput);
  const pluralBase = pluralize(normalizedInput);

  // Generate camelCase versions (for variables)
  const singularCamel = camelCase(singularBase);
  const pluralCamel = camelCase(pluralBase);

  // Generate PascalCase versions (for classes) - from the base forms to preserve word boundaries
  const singularPascal = pascalCase(singularBase);
  const pluralPascal = pascalCase(pluralBase);

  // Generate kebab-case versions - from the ORIGINAL input to preserve user intent
  const kebabSingular = kebabCase(singularBase);
  const kebabPlural = kebabCase(pluralBase);

  // Generate snake_case versions - from the base forms
  const snakeSingular = snakeCase(singularBase);
  const snakePlural = snakeCase(pluralBase);

  return {
    singular: singularCamel,
    plural: pluralCamel,
    pascalSingular: singularPascal,
    pascalPlural: pluralPascal,
    kebabSingular,
    kebabPlural,
    snakeSingular,
    snakePlural,
    tableName: snakePlural,
  };
}
