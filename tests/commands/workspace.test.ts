import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
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

function configFile(dir: string): string {
  return join(dir, ".taskrc");
}

describe("task workspace", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "task-workspace-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("current shows 'default' when no config exists", () => {
    const { stdout } = runCli("workspace current", dir);
    expect(stdout).toBe("default");
  });

  it("create creates workspace directory and sets config", () => {
    const { stdout } = runCli("workspace create Work", dir);

    expect(stdout).toContain('Created and switched to workspace "Work".');
    expect(existsSync(join(dir, "workspaces", "Work", "tasks"))).toBe(true);

    const config = JSON.parse(readFileSync(configFile(dir), "utf-8"));
    expect(config.workspace).toBe("Work");
  });

  it("create switches the active workspace", () => {
    runCli("workspace create Work", dir);
    runCli("workspace create Dev", dir);

    const { stdout } = runCli("workspace current", dir);
    expect(stdout).toBe("Dev");
  });

  it("list shows all workspaces", () => {
    runCli("workspace create Personal", dir);
    runCli("workspace create Work", dir);

    const { stdout } = runCli("workspace list", dir);
    expect(stdout).toContain("Personal");
    expect(stdout).toContain("Work");
  });

  it("list marks the active workspace with *", () => {
    runCli("workspace create Work", dir);
    runCli("workspace create Personal", dir);

    const { stdout } = runCli("workspace list", dir);
    expect(stdout).toContain("* Personal");
  });

  it("use switches to an existing workspace", () => {
    runCli("workspace create One", dir);
    runCli("workspace create Two", dir);
    runCli("workspace use One", dir);

    const { stdout } = runCli("workspace current", dir);
    expect(stdout).toBe("One");
  });

  it("use creates the workspace if it does not exist", () => {
    runCli("workspace use NewWorkspace", dir);

    expect(existsSync(join(dir, "workspaces", "NewWorkspace", "tasks"))).toBe(true);

    const { stdout } = runCli("workspace current", dir);
    expect(stdout).toBe("NewWorkspace");
  });

  it("list shows no workspaces when none exist", () => {
    const { stdout } = runCli("workspace list", dir);
    expect(stdout).toContain("No workspaces found.");
  });

  it("creates a task in the active workspace", () => {
    runCli("workspace create Work", dir);
    runCli('add "Task in Work"', dir);

    expect(existsSync(join(dir, "workspaces", "Work", "tasks", "task-1.md"))).toBe(true);
    expect(existsSync(join(dir, "workspaces", "default", "tasks", "task-1.md"))).toBe(false);
  });

  it("creates a task in the default workspace", () => {
    runCli('add "Default task"', dir);

    expect(existsSync(join(dir, "workspaces", "default", "tasks", "task-1.md"))).toBe(true);
  });

  it("add --workspace overrides the active workspace", () => {
    runCli("workspace create Work", dir);
    runCli('add "Override task" --workspace Other', dir);

    expect(existsSync(join(dir, "workspaces", "Other", "tasks", "task-1.md"))).toBe(true);
  });

  it("add --workspace creates the workspace directory", () => {
    runCli('add "Dynamic workspace" --workspace Dynamic', dir);

    expect(existsSync(join(dir, "workspaces", "Dynamic", "tasks", "task-1.md"))).toBe(true);
  });
});
