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

export interface EntityNames {
  singular: string;
  plural: string;
  pascalSingular: string;
  pascalPlural: string;
  kebab: string;
  snake: string;
  tableName: string;
}

export function getEntityNames(input: string): EntityNames {
  const singularCamel = camelCase(singularize(input));
  const pluralCamel = camelCase(pluralize(input));
  const singularPascal = pascalCase(singularize(input));
  const pluralPascal = pascalCase(pluralize(input));
  const kebabName = kebabCase(input);

  return {
    singular: singularCamel,
    plural: pluralCamel,
    pascalSingular: singularPascal,
    pascalPlural: pluralPascal,
    kebab: kebabName,
    snake: snakeCase(input),
    tableName: snakeCase(pluralize(input)),
  };
}
