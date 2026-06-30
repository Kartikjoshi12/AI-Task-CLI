import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
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

function seedTask(
  dir: string,
  id: string,
  status: string,
  created: string,
) {
  const d = join(dir, "tasks");
  mkdirSync(d, { recursive: true });
  const marker = status === "done" ? "x" : status === "doing" ? "/" : " ";
  writeFileSync(
    join(d, `${id}.md`),
    [
      "---",
      `id: ${id}`,
      `status: ${status}`,
      `created: ${created}`,
      "updated: 2024-06-01T10:00:00.000Z",
      "---",
      `- [${marker}] ${id}`,
      "",
    ].join("\n"),
    "utf-8",
  );
}

describe("task pending", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "task-pending-test-"));
    seedTask(dir, "task-1", "todo", "2024-06-01T10:00:00.000Z");
    seedTask(dir, "task-2", "done", "2024-06-02T10:00:00.000Z");
    seedTask(dir, "task-3", "doing", "2024-06-03T10:00:00.000Z");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("shows only pending tasks", () => {
    const { stdout } = runCli("pending", dir);
    expect(stdout).toContain("task-1");
    expect(stdout).not.toContain("task-2");
    expect(stdout).not.toContain("task-3");
  });

  it("shows a message when no pending tasks", () => {
    const emptyDir = mkdtempSync(join(tmpdir(), "task-pending-empty-"));
    const { stdout } = runCli("pending", emptyDir);
    expect(stdout).toContain("No pending tasks.");
    rmSync(emptyDir, { recursive: true, force: true });
  });
});

describe("task completed", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "task-completed-test-"));
    seedTask(dir, "task-1", "todo", "2024-06-01T10:00:00.000Z");
    seedTask(dir, "task-2", "done", "2024-06-02T10:00:00.000Z");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("shows only completed tasks", () => {
    const { stdout } = runCli("completed", dir);
    expect(stdout).toContain("task-2");
    expect(stdout).not.toContain("task-1");
  });

  it("shows a message when no completed tasks", () => {
    const emptyDir = mkdtempSync(join(tmpdir(), "task-completed-empty-"));
    const { stdout } = runCli("completed", emptyDir);
    expect(stdout).toContain("No completed tasks.");
    rmSync(emptyDir, { recursive: true, force: true });
  });
});

describe("task today", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "task-today-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("shows tasks created today", () => {
    const today = new Date().toISOString();
    seedTask(dir, "task-1", "todo", today);
    seedTask(dir, "task-2", "done", "2024-06-01T10:00:00.000Z");

    const { stdout } = runCli("today", dir);
    expect(stdout).toContain("task-1");
    expect(stdout).not.toContain("task-2");
  });

  it("shows a message when no tasks created today", () => {
    seedTask(dir, "task-1", "todo", "2024-06-01T10:00:00.000Z");

    const { stdout } = runCli("today", dir);
    expect(stdout).toContain("No tasks created today.");
  });
});

describe("task stats", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "task-stats-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("displays correct statistics", () => {
    seedTask(dir, "task-1", "todo", "2024-06-01T10:00:00.000Z");
    seedTask(dir, "task-2", "todo", "2024-06-02T10:00:00.000Z");
    seedTask(dir, "task-3", "done", "2024-06-03T10:00:00.000Z");

    const { stdout } = runCli("stats", dir);
    expect(stdout).toContain("Total:       3");
    expect(stdout).toContain("Pending:     2");
    expect(stdout).toContain("Completed:   1");
    expect(stdout).toContain("Completion:  33%");
  });

  it("shows 0 completion when no tasks exist", () => {
    const emptyDir = mkdtempSync(join(tmpdir(), "task-stats-empty-"));
    const { stdout } = runCli("stats", emptyDir);
    expect(stdout).toContain("Total:       0");
    expect(stdout).toContain("Pending:     0");
    expect(stdout).toContain("Completed:   0");
    expect(stdout).toContain("Completion:  0%");
    rmSync(emptyDir, { recursive: true, force: true });
  });

  it("shows 100% completion when all tasks are done", () => {
    seedTask(dir, "task-1", "done", "2024-06-01T10:00:00.000Z");
    seedTask(dir, "task-2", "done", "2024-06-02T10:00:00.000Z");

    const { stdout } = runCli("stats", dir);
    expect(stdout).toContain("Total:       2");
    expect(stdout).toContain("Completed:   2");
    expect(stdout).toContain("Completion:  100%");
  });
});
