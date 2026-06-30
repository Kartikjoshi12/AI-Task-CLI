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

describe("task project", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "task-project-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("current shows 'default' when no config exists", () => {
    const { stdout } = runCli("project current", dir);
    expect(stdout).toBe("default");
  });

  it("create creates project and sets config", () => {
    const { stdout } = runCli("project create Booking", dir);

    expect(stdout).toContain('Created and switched to project "Booking".');

    const config = JSON.parse(readFileSync(configFile(dir), "utf-8"));
    expect(config.project).toBe("Booking");
    expect(config.projects).toContain("Booking");
  });

  it("create switches the active project", () => {
    runCli("project create Booking", dir);
    runCli("project create Auth", dir);

    const { stdout } = runCli("project current", dir);
    expect(stdout).toBe("Auth");
  });

  it("list shows all projects", () => {
    runCli("project create Booking", dir);
    runCli("project create Auth", dir);

    const { stdout } = runCli("project list", dir);
    expect(stdout).toContain("Booking");
    expect(stdout).toContain("Auth");
  });

  it("list marks the active project with *", () => {
    runCli("project create Booking", dir);
    runCli("project create Auth", dir);

    const { stdout } = runCli("project list", dir);
    expect(stdout).toContain("* Auth");
  });

  it("use switches to an existing project", () => {
    runCli("project create Booking", dir);
    runCli("project create Auth", dir);
    runCli("project use Booking", dir);

    const { stdout } = runCli("project current", dir);
    expect(stdout).toBe("Booking");
  });

  it("use fails for non-existent project", () => {
    const { stderr } = runCli("project use NonExistent", dir);
    expect(stderr).toContain("Error");
    expect(stderr).toContain("Project not found: NonExistent");
  });

  it("list shows no projects when none exist", () => {
    const { stdout } = runCli("project list", dir);
    expect(stdout).toContain("No projects found.");
  });

  it("creates a task with the active project", () => {
    runCli("project create Booking", dir);
    runCli('add "Fix OTP"', dir);

    const taskFile = join(dir, "workspaces", "default", "tasks", "task-1.md");
    const content = readFileSync(taskFile, "utf-8");
    expect(content).toContain("project: Booking");
  });

  it("creates a task in the default project when no project is active", () => {
    runCli('add "Default task"', dir);

    const taskFile = join(dir, "workspaces", "default", "tasks", "task-1.md");
    const content = readFileSync(taskFile, "utf-8");
    expect(content).toContain("project: default");
  });

  it("add --project overrides the active project", () => {
    runCli("project create Booking", dir);
    runCli('add "Override task" --project Auth', dir);

    const taskFile = join(dir, "workspaces", "default", "tasks", "task-1.md");
    const content = readFileSync(taskFile, "utf-8");
    expect(content).toContain("project: Auth");
  });

  it("add --project creates the project in config if not exists", () => {
    runCli('add "New project task" --project NewProj', dir);

    const config = JSON.parse(readFileSync(configFile(dir), "utf-8"));
    expect(config.projects).toContain("NewProj");
    expect(config.project).toBe("default");
  });

  it("list --project filters by project", () => {
    runCli("project create Booking", dir);
    runCli('add "Booking task"', dir);
    runCli("project create Auth", dir);
    runCli('add "Auth task"', dir);

    const { stdout } = runCli("list --project Booking", dir);
    expect(stdout).toContain("Booking task");
    expect(stdout).not.toContain("Auth task");
  });

  it("list --project shows nothing for non-existent project", () => {
    runCli("project create Booking", dir);
    runCli('add "Booking task"', dir);

    const { stdout } = runCli("list --project NonExistent", dir);
    expect(stdout).toContain("No tasks found.");
  });

  it("search finds tasks by project", () => {
    runCli("project create Booking", dir);
    runCli('add "Booking OTP"', dir);
    runCli("project create Auth", dir);
    runCli('add "Auth login"', dir);

    const { stdout } = runCli("search OTP", dir);
    expect(stdout).toContain("Booking OTP");
    expect(stdout).not.toContain("Auth login");
  });
});