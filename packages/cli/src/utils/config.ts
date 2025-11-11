import { join } from "@std/path";
import { ensureDir, exists } from "@std/fs";

export interface TonyStackConfig {
  sudoPassword?: string; // System sudo password for database operations
  defaultDbUser?: string; // Default database user (default: postgres)
  defaultDbPassword?: string; // Default database password (default: password)
}

/**
 * Get TonyStack config directory path (~/.tonystack)
 */
function getConfigDir(): string {
  const home = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || "";
  return join(home, ".tonystack");
}

/**
 * Get config file path (~/.tonystack/config.json)
 */
function getConfigPath(): string {
  return join(getConfigDir(), "config.json");
}

/**
 * Load TonyStack configuration from ~/.tonystack/config.json
 * Returns empty config if file doesn't exist
 */
export async function loadConfig(): Promise<TonyStackConfig> {
  const configPath = getConfigPath();

  try {
    if (await exists(configPath)) {
      const content = await Deno.readTextFile(configPath);
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn(`Warning: Could not load config from ${configPath}:`, error);
  }

  return {};
}

/**
 * Save TonyStack configuration to ~/.tonystack/config.json
 */
export async function saveConfig(config: TonyStackConfig): Promise<void> {
  const configDir = getConfigDir();
  const configPath = getConfigPath();

  await ensureDir(configDir);
  await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2) + "\n");
}

/**
 * Create default config file with instructions if it doesn't exist
 */
export async function ensureConfig(): Promise<void> {
  const configPath = getConfigPath();

  if (!await exists(configPath)) {
    const defaultConfig: TonyStackConfig = {
      // sudoPassword: "your-sudo-password-here", // Uncomment and set to avoid password prompts
      // defaultDbUser: "postgres",
      // defaultDbPassword: "password",
    };

    await saveConfig(defaultConfig);
    console.log(`Created config file at: ${configPath}`);
    console.log(
      "Tip: Set 'sudoPassword' in config to avoid repeated password prompts",
    );
  }
}
