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

function seedTask(dir: string, id: string, status: string, description: string, created: string) {
  const d = join(dir, "workspaces", "default", "tasks");
  mkdirSync(d, { recursive: true });
  const content = `---\nid: ${id}\nstatus: ${status}\ncreated: ${created}\n---\n- [${status === "done" ? "x" : status === "doing" ? "/" : " "}] ${description}\n`;
  writeFileSync(join(d, `${id}.md`), content, "utf-8");
}

describe("task list (CLI)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "task-list-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("shows a table with all tasks", () => {
    seedTask(dir, "task-1", "todo", "Buy milk", "2024-06-01T10:00:00.000Z");
    seedTask(dir, "task-2", "done", "Pay bills", "2024-06-02T14:00:00.000Z");

    const { stdout, stderr } = runCli("list", dir);

    expect(stderr).toBe("");
    expect(stdout).toContain("ID");
    expect(stdout).toContain("Title");
    expect(stdout).toContain("Status");
    expect(stdout).toContain("Created");
    expect(stdout).toContain("task-1");
    expect(stdout).toContain("Buy milk");
    expect(stdout).toContain("todo");
    expect(stdout).toContain("task-2");
    expect(stdout).toContain("Pay bills");
  });

  it("sorts tasks by created date newest first", () => {
    seedTask(dir, "task-1", "todo", "Older", "2024-01-01T00:00:00.000Z");
    seedTask(dir, "task-2", "todo", "Newer", "2024-06-01T00:00:00.000Z");

    const { stdout } = runCli("list", dir);
    const newerIndex = stdout.indexOf("Newer");
    const olderIndex = stdout.indexOf("Older");
    expect(newerIndex).toBeLessThan(olderIndex);
  });

  it("filters by --status todo", () => {
    seedTask(dir, "task-1", "todo", "Todo task", "2024-01-01T00:00:00.000Z");
    seedTask(dir, "task-2", "done", "Done task", "2024-01-02T00:00:00.000Z");

    const { stdout } = runCli("list --status todo", dir);
    expect(stdout).toContain("Todo task");
    expect(stdout).not.toContain("Done task");
  });

  it("filters by --status done", () => {
    seedTask(dir, "task-1", "todo", "Todo task", "2024-01-01T00:00:00.000Z");
    seedTask(dir, "task-2", "done", "Done task", "2024-01-02T00:00:00.000Z");

    const { stdout } = runCli("list --status done", dir);
    expect(stdout).toContain("Done task");
    expect(stdout).not.toContain("Todo task");
  });

  it("shows a message when no tasks exist", () => {
    const { stdout } = runCli("list", dir);
    expect(stdout).toContain("No tasks found.");
  });

  it("shows a message when no tasks match the filter", () => {
    seedTask(dir, "task-1", "todo", "Todo task", "2024-01-01T00:00:00.000Z");

    const { stdout } = runCli("list --status done", dir);
    expect(stdout).toContain("No tasks found.");
  });
});
