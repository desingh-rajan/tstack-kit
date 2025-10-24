import { blue, bold, cyan, gray, green, red, yellow } from "@std/fmt/colors";

/**
 * Helper to safely write to console and ignore broken pipe errors
 */
function safeLog(fn: () => void) {
  try {
    fn();
  } catch (error) {
    if (error instanceof Deno.errors.BrokenPipe) {
      return;
    }
    throw error;
  }
}

/**
 * CLI Logger with colored output
 */
export class Logger {
  static success(message: string) {
    safeLog(() => console.log(green("[SUCCESS] " + message)));
  }

  static error(message: string) {
    safeLog(() => console.error(red("[ERROR] " + message)));
  }

  static warning(message: string) {
    safeLog(() => console.warn(yellow("[WARNING] " + message)));
  }

  static info(message: string) {
    safeLog(() => console.log(blue("[INFO] " + message)));
  }

  static step(message: string) {
    safeLog(() => console.log(cyan("[STEP] " + message)));
  }

  static title(message: string) {
    safeLog(() => console.log("\n" + bold(cyan(message))));
  }

  static subtitle(message: string) {
    safeLog(() => console.log(bold(message)));
  }

  static plain(message: string) {
    safeLog(() => console.log(message));
  }

  static code(message: string) {
    safeLog(() => console.log(" " + message));
  }

  static newLine() {
    safeLog(() => console.log());
  }

  static banner() {
    safeLog(() =>
      console.log(
        bold(
          cyan(`
╔═══════════════════════════════════════╗
║ ║
║ TonyStack CLI v0.1.0 ║
║ ║
║ Rails-like DX for Deno Developers ║
║ ║
╚═══════════════════════════════════════╝
`),
        ),
      )
    );
  }

  static divider() {
    safeLog(() => console.log(gray("─".repeat(50))));
  }
}
