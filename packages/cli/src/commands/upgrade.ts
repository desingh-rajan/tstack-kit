/**
 * TStack Upgrade Command
 *
 * Downloads the latest version of TStack Kit from GitHub releases.
 * Usage: tstack upgrade [version]
 */

import { blue, bold, green, red, yellow } from "@std/fmt/colors";
import { join } from "@std/path";

const HOME = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || "~";
const TSTACK_INSTALL_DIR = join(HOME, ".tstack");
const GITHUB_API = "https://api.github.com/repos/desingh-rajan/tstack-kit";

interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  tarball_url: string;
}

/**
 * Get the currently installed version
 */
async function getCurrentVersion(): Promise<string | null> {
  try {
    const denoJsonPath = join(TSTACK_INSTALL_DIR, "deno.json");
    const content = await Deno.readTextFile(denoJsonPath);
    const config = JSON.parse(content);
    return config.version || null;
  } catch (error) {
    // File not found is expected on installations that predate the upgrade
    // command — return null silently so the upgrade can proceed normally.
    if (error instanceof Deno.errors.NotFound) {
      return null;
    }
    // Unexpected error (permission denied, malformed JSON, etc.) — log it.
    console.error(
      yellow("[warn]"),
      "Could not read current version:",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

/**
 * Fetch latest release info from GitHub
 */
async function getLatestRelease(): Promise<GitHubRelease | null> {
  try {
    const response = await fetch(`${GITHUB_API}/releases/latest`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(
      "[upgrade] Failed to fetch latest release:",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

/**
 * Fetch a specific release by tag
 */
async function getReleaseByTag(tag: string): Promise<GitHubRelease | null> {
  try {
    const normalizedTag = tag.startsWith("v") ? tag : `v${tag}`;
    const response = await fetch(
      `${GITHUB_API}/releases/tags/${normalizedTag}`,
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(
      "[upgrade] Failed to fetch release:",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

/**
 * Download and extract a release
 */
async function downloadAndExtract(version: string): Promise<boolean> {
  const normalizedVersion = version.startsWith("v")
    ? version.slice(1)
    : version;
  const tarballUrl =
    `https://github.com/desingh-rajan/tstack-kit/archive/refs/tags/v${normalizedVersion}.tar.gz`;

  console.log(blue(`[info]`), `Downloading v${normalizedVersion}...`);

  try {
    // Download tarball
    const response = await fetch(tarballUrl);
    if (!response.ok) {
      console.log(red(`[error]`), `Failed to download: ${response.statusText}`);
      return false;
    }

    const tarball = await response.arrayBuffer();

    // Create temp file
    const tempFile = await Deno.makeTempFile({ suffix: ".tar.gz" });
    await Deno.writeFile(tempFile, new Uint8Array(tarball));

    // Backup current installation
    const backupDir = `${TSTACK_INSTALL_DIR}.backup`;
    try {
      await Deno.remove(backupDir, { recursive: true });
    } catch {
      // Ignore if doesn't exist
    }

    if (await exists(TSTACK_INSTALL_DIR)) {
      await Deno.rename(TSTACK_INSTALL_DIR, backupDir);
    }

    // Create new install directory
    await Deno.mkdir(TSTACK_INSTALL_DIR, { recursive: true });

    // Extract tarball
    const extractProcess = new Deno.Command("tar", {
      args: [
        "-xzf",
        tempFile,
        "-C",
        TSTACK_INSTALL_DIR,
        "--strip-components=1",
      ],
    });

    const result = await extractProcess.output();
    if (!result.success) {
      // Restore backup on failure
      console.log(red(`[error]`), "Extraction failed, restoring backup...");
      await Deno.remove(TSTACK_INSTALL_DIR, { recursive: true });
      await Deno.rename(backupDir, TSTACK_INSTALL_DIR);
      return false;
    }

    // Clean up
    await Deno.remove(tempFile);
    try {
      await Deno.remove(backupDir, { recursive: true });
    } catch {
      // Ignore
    }

    console.log(green(`[ok]`), `Downloaded v${normalizedVersion}`);
    return true;
  } catch (error) {
    console.log(red(`[error]`), `Download failed: ${error}`);
    return false;
  }
}

/**
 * Reinstall the CLI from the updated files
 */
async function reinstallCli(): Promise<boolean> {
  console.log(blue(`[info]`), "Reinstalling CLI...");

  const cliDir = join(TSTACK_INSTALL_DIR, "packages", "cli");

  const installProcess = new Deno.Command("deno", {
    args: [
      "install",
      "--global",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "--allow-run",
      "--allow-net",
      "--unstable-kv",
      "--name",
      "tstack",
      "--force",
      "mod.ts",
    ],
    cwd: cliDir,
  });

  const result = await installProcess.output();
  if (!result.success) {
    console.log(red(`[error]`), "Failed to reinstall CLI");
    return false;
  }

  console.log(green(`[ok]`), "CLI reinstalled");
  return true;
}

/**
 * Check if a path exists
 */
async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Main upgrade command
 */
export async function upgradeCommand(targetVersion?: string): Promise<void> {
  console.log("");
  console.log(bold("TStack Upgrade"));
  console.log("================");
  console.log("");

  // Get current version
  const currentVersion = await getCurrentVersion();
  if (currentVersion) {
    console.log(blue(`[info]`), `Current version: v${currentVersion}`);
  } else {
    console.log(blue(`[info]`), "No previous version detected");
  }

  // Determine target version
  let release: GitHubRelease | null = null;

  if (targetVersion) {
    console.log(blue(`[info]`), `Looking for version: ${targetVersion}`);
    release = await getReleaseByTag(targetVersion);
    if (!release) {
      console.log(red(`[error]`), `Version ${targetVersion} not found`);
      return;
    }
  } else {
    console.log(blue(`[info]`), "Checking for latest version...");
    release = await getLatestRelease();
    if (!release) {
      console.log(red(`[error]`), "Could not fetch latest release");
      return;
    }
  }

  const targetVersionClean = release.tag_name.replace(/^v/, "");
  console.log(blue(`[info]`), `Target version: v${targetVersionClean}`);

  // Check if already on target version
  if (currentVersion === targetVersionClean) {
    console.log(green(`[ok]`), "Already on the target version");
    return;
  }

  // Download and extract
  const downloaded = await downloadAndExtract(targetVersionClean);
  if (!downloaded) {
    return;
  }

  // Reinstall CLI
  const reinstalled = await reinstallCli();
  if (!reinstalled) {
    return;
  }

  console.log("");
  console.log("================");
  console.log(green(bold(`Upgraded to v${targetVersionClean}`)));
  console.log("");
  console.log("Run 'tstack --version' to verify");
  console.log("");
}

/**
 * Show available versions
 */
export async function listVersionsCommand(): Promise<void> {
  console.log("");
  console.log(bold("Available Versions"));
  console.log("==================");
  console.log("");

  try {
    const response = await fetch(`${GITHUB_API}/releases`);
    if (!response.ok) {
      console.log(red(`[error]`), "Could not fetch releases");
      return;
    }

    const releases: GitHubRelease[] = await response.json();
    const currentVersion = await getCurrentVersion();

    for (const release of releases.slice(0, 10)) {
      const version = release.tag_name;
      const isCurrent = currentVersion === version.replace(/^v/, "");
      const marker = isCurrent ? green(" (installed)") : "";
      console.log(`  ${version}${marker}`);
    }

    console.log("");
    console.log(`Showing latest 10 releases. View all at:`);
    console.log(`https://github.com/desingh-rajan/tstack-kit/releases`);
    console.log("");
  } catch (error) {
    console.log(red(`[error]`), `Failed: ${error}`);
  }
}
