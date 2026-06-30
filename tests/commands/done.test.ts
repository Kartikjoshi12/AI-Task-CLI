import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
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
  description: string,
) {
  const d = join(dir, "tasks");
  mkdirSync(d, { recursive: true });
  const marker = status === "done" ? "x" : status === "doing" ? "/" : " ";
  const content = [
    "---",
    `id: ${id}`,
    `status: ${status}`,
    "created: 2024-06-01T10:00:00.000Z",
    "updated: 2024-06-01T10:00:00.000Z",
    "---",
    `- [${marker}] ${description}`,
    "",
  ].join("\n");
  writeFileSync(join(d, `${id}.md`), content, "utf-8");
}

describe("task done (CLI)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "task-done-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("marks a todo task as done", () => {
    seedTask(dir, "task-1", "todo", "Fix OTP validation");

    const { stdout, stderr } = runCli("done task-1", dir);

    expect(stderr).toBe("");
    expect(stdout).toContain("Marked task task-1 as done.");

    const content = readFileSync(join(dir, "tasks", "task-1.md"), "utf-8");
    expect(content).toContain("- [x] Fix OTP validation");
    expect(content).toContain("status: done");
  });

  it("marks a doing task as done", () => {
    seedTask(dir, "task-1", "doing", "Work in progress");

    const { stdout } = runCli("done task-1", dir);
    expect(stdout).toContain("Marked task task-1 as done.");

    const content = readFileSync(join(dir, "tasks", "task-1.md"), "utf-8");
    expect(content).toContain("- [x] Work in progress");
    expect(content).toContain("status: done");
  });

  it("shows a friendly message when the task is already done", () => {
    seedTask(dir, "task-1", "done", "Already done");

    const { stdout, stderr } = runCli("done task-1", dir);

    expect(stderr).toBe("");
    expect(stdout).toContain("Task task-1 is already done.");
  });

  it("preserves title, tags, and content when marking done", () => {
    const d = join(dir, "tasks");
    mkdirSync(d, { recursive: true });
    const content = [
      "---",
      "id: task-1",
      "status: todo",
      "created: 2024-06-01T10:00:00.000Z",
      "updated: 2024-06-01T10:00:00.000Z",
      "tags: bug, backend",
      "---",
      "- [ ] Fix login bug",
      "",
      "Some detailed notes about this bug.",
    ].join("\n");
    writeFileSync(join(d, "task-1.md"), content, "utf-8");

    runCli("done task-1", dir);

    const fileContent = readFileSync(join(dir, "tasks", "task-1.md"), "utf-8");
    expect(fileContent).toContain("tags: bug, backend");
    expect(fileContent).toContain("Fix login bug");
    expect(fileContent).toContain("Some detailed notes about this bug.");
  });

  it("sets completedAt in the frontmatter", () => {
    seedTask(dir, "task-1", "todo", "Complete me");

    runCli("done task-1", dir);

    const content = readFileSync(join(dir, "tasks", "task-1.md"), "utf-8");
    expect(content).toContain("completed:");
  });

  it("shows an error for a non-existent task", () => {
    const { stderr } = runCli("done task-999", dir);
    expect(stderr).toContain("Error");
    expect(stderr).toContain("task-999");
  });

  it("shows an error for an empty task ID", () => {
    const { stderr } = runCli('done ""', dir);
    expect(stderr).toContain("Error");
  });
});
