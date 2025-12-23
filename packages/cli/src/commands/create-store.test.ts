import { assert, assertEquals } from "@std/assert";
import { join } from "@std/path";
import { fileExists } from "../../tests/helpers/tempDir.ts";

const TEST_DIR = Deno.makeTempDirSync({ prefix: "tstack-test-" });

Deno.test({
  name: "create store - creates a standalone storefront project",
  async fn() {
    const projectName = "test-store";
    const projectPath = join(TEST_DIR, projectName);
    const modTsPath = join(Deno.cwd(), "mod.ts");
    
    // Run the create command
    const command = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "-A",
        "--unstable-kv",
        modTsPath,
        "create",
        "store",
        projectName,
        "--dir",
        TEST_DIR,
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const output = await command.output();
    const stdout = new TextDecoder().decode(output.stdout);
    const stderr = new TextDecoder().decode(output.stderr);

    if (!output.success) {
      console.log("STDOUT:", stdout);
      console.error("STDERR:", stderr);
    }
    
    assert(output.success, "Command failed");
    assert(stdout.includes("Storefront project created successfully!"), "Missing success message");

    // Check directory structure
    assert(await fileExists(projectPath, "deno.json"), "deno.json not created");
    assert(await fileExists(projectPath, "routes/index.tsx"), "routes/index.tsx not created");
    
    // Verify destroy command
    const destroyCommand = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "-A",
        "--unstable-kv",
        modTsPath,
        "destroy",
        "store",
        projectName,
        "--force",
      ],
      stdout: "piped",
      stderr: "piped",
      cwd: TEST_DIR, // Run from temp dir to ensure it finds the project
    });

    const destroyOutput = await destroyCommand.output();
    const destroyStdout = new TextDecoder().decode(destroyOutput.stdout);
    
    assert(destroyOutput.success, "Destroy command failed");
    assert(destroyStdout.includes("Project destroyed successfully"), "Missing destroy success message");
    
    // Check directory removed
    try {
        await Deno.stat(projectPath);
        assert(false, "Project directory should have been removed");
    } catch {
        assert(true, "Project directory removed");
    }
  }
});
