import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
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

describe("AI-powered natural language task creation", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "task-ai-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("parses Hindi input and creates a task", () => {
    const { stdout, stderr } = runCli(`"Rahul ko kal tak OTP banana hai"`, dir);

    expect(stderr).toBe("");
    expect(stdout).toContain("Task Created");
    expect(stdout).toContain("OTP");
    expect(stdout).toContain("Rahul");
    expect(stdout).toContain("tomorrow");

    const taskFile = join(dir, "workspaces", "default", "tasks", "task-1.md");
    expect(existsSync(taskFile)).toBe(true);
    const content = readFileSync(taskFile, "utf-8");
    expect(content).toContain("- [ ] OTP");
    expect(content).toContain("assignee: Rahul");
    expect(content).toContain("due: tomorrow");
  });

  it("parses English input with due date", () => {
    const { stdout, stderr } = runCli(`"Buy groceries tomorrow"`, dir);

    expect(stderr).toBe("");
    expect(stdout).toContain("Task Created");
    expect(stdout).toContain("Buy groceries");
    expect(stdout).toContain("tomorrow");

    const taskFile = join(dir, "workspaces", "default", "tasks", "task-1.md");
    const content = readFileSync(taskFile, "utf-8");
    expect(content).toContain("- [ ] Buy groceries");
    expect(content).toContain("due: tomorrow");
  });

  it("parses priority keywords", () => {
    const { stdout } = runCli(`"urgent: fix login bug"`, dir);

    expect(stdout).toContain("Task Created");
    expect(stdout).toContain("urgent");
    expect(stdout).toContain("fix login bug");

    const taskFile = join(dir, "workspaces", "default", "tasks", "task-1.md");
    const content = readFileSync(taskFile, "utf-8");
    expect(content).toContain("priority: urgent");
    expect(content).toContain("tags: bug");
  });

  it("existing subcommands continue to work after AI feature added", () => {
    const { stdout } = runCli('add "Normal task"', dir);
    expect(stdout).toContain("Created task task-1");
  });

  it("shows help for empty input", () => {
    const { stdout } = runCli("", dir);
    expect(stdout).toContain("Usage:");
    expect(stdout).toContain("task");
  });

  it("displays all extracted fields in output", () => {
    const { stdout } = runCli(`"Finish LDA report by Friday"`, dir);

    expect(stdout).toContain("Task Created");
    expect(stdout).toContain("Title:");
    expect(stdout).toContain("Workspace:");
    expect(stdout).toContain("Project:");
  });

  it("stores parsed fields in frontmatter", () => {
    const { stdout } = runCli(`"Finish LDA report by Friday"`, dir);

    const taskFile = join(dir, "workspaces", "default", "tasks", "task-1.md");
    const content = readFileSync(taskFile, "utf-8");

    expect(content).toContain("- [ ] Finish LDA report");
    expect(content).toContain("status: todo");
  });

  it("shows id in file path", () => {
    const { stdout } = runCli(`"Test task creation"`, dir);

    const taskFile = join(dir, "workspaces", "default", "tasks", "task-1.md");
    expect(existsSync(taskFile)).toBe(true);
  });
});
