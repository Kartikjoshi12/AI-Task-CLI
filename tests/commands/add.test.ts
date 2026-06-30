import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";

const projectRoot = resolve(import.meta.dirname, "..", "..");
const cliPath = resolve(projectRoot, "src", "cli.ts");
const tsxPath = resolve(projectRoot, "node_modules", ".bin", "tsx");

function runCli(args: string, cwd: string): { stdout: string; stderr: string } {
  try {
    const stdout = execSync(`"${tsxPath}" "${cliPath}" ${args}`, {
      cwd,
      encoding: "utf-8",
      timeout: 10000,
    });
    return { stdout: stdout.trim(), stderr: "" };
  } catch (err: unknown) {
    const error = err as { stdout: string; stderr: string };
    return {
      stdout: (error.stdout ?? "").trim(),
      stderr: (error.stderr ?? "").trim(),
    };
  }
}

describe("task add (CLI)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "task-cli-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("creates a task and prints the ID", () => {
    const { stdout, stderr } = runCli(`add "Buy groceries"`, dir);

    expect(stderr).toBe("");
    expect(stdout).toContain("Created task task-1");

    const taskFile = join(dir, "tasks", "task-1.md");
    expect(existsSync(taskFile)).toBe(true);
    const content = readFileSync(taskFile, "utf-8");
    expect(content).toContain("- [ ] Buy groceries");
    expect(content).toContain("id: task-1");
  });

  it("creates multiple tasks with incrementing IDs", () => {
    runCli(`add "First task"`, dir);
    const { stdout } = runCli(`add "Second task"`, dir);

    expect(stdout).toContain("Created task task-2");
  });

  it("fails with empty description", () => {
    const { stderr } = runCli(`add ""`, dir);

    expect(stderr).toContain("Error");
  });
});
