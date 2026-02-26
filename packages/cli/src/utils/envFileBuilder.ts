/**
 * EnvFileBuilder - Structured .env file manipulation
 *
 * Replaces fragile regex-based .env file editing with a parsed
 * key-value representation that preserves comments, blank lines,
 * and ordering.
 */

interface EnvLine {
  /** "kv" for KEY=VALUE lines, "other" for comments/blanks */
  type: "kv" | "other";
  /** The raw line text (for "other" lines) */
  raw?: string;
  /** The key (for "kv" lines) */
  key?: string;
  /** The value (for "kv" lines) */
  value?: string;
}

/**
 * Parses, modifies, and rebuilds .env file content while
 * preserving comments, blank lines, and key ordering.
 */
export class EnvFileBuilder {
  private lines: EnvLine[] = [];

  /**
   * Parse raw .env file content into structured lines.
   */
  parse(content: string): this {
    this.lines = content.split("\n").map((raw) => {
      const trimmed = raw.trim();

      // Blank line or comment
      if (trimmed === "" || trimmed.startsWith("#")) {
        return { type: "other" as const, raw };
      }

      // KEY=VALUE (split on first '=')
      const eqIndex = raw.indexOf("=");
      if (eqIndex !== -1) {
        const key = raw.substring(0, eqIndex).trim();
        const value = raw.substring(eqIndex + 1);
        return { type: "kv" as const, key, value };
      }

      // Anything else (malformed) - preserve as-is
      return { type: "other" as const, raw };
    });

    return this;
  }

  /**
   * Set a key's value. If the key exists, overwrite in place.
   * If new, append to the end.
   */
  set(key: string, value: string): this {
    const existing = this.lines.find(
      (l) => l.type === "kv" && l.key === key,
    );

    if (existing) {
      existing.value = value;
    } else {
      this.lines.push({ type: "kv", key, value });
    }

    return this;
  }

  /**
   * Get the current value of a key, or undefined if not set.
   */
  get(key: string): string | undefined {
    const line = this.lines.find(
      (l) => l.type === "kv" && l.key === key,
    );
    return line?.value;
  }

  /**
   * Build the .env file content back into a string.
   */
  build(): string {
    return this.lines.map((line) => {
      if (line.type === "kv") {
        return `${line.key}=${line.value}`;
      }
      return line.raw ?? "";
    }).join("\n");
  }
}

/**
 * Convenience function: read a .env file, apply overrides, and return
 * the updated content string.
 *
 * @param content - Raw .env file content
 * @param overrides - Map of key-value pairs to set
 * @returns Updated .env file content
 */
export function transformEnvContent(
  content: string,
  overrides: Record<string, string>,
): string {
  const builder = new EnvFileBuilder().parse(content);
  for (const [key, value] of Object.entries(overrides)) {
    builder.set(key, value);
  }
  return builder.build();
}
