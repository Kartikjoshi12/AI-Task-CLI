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
  description: string,
  created: string,
  updated?: string,
) {
  const d = join(dir, "tasks");
  mkdirSync(d, { recursive: true });
  const marker = status === "done" ? "x" : status === "doing" ? "/" : " ";
  const updatedLine = updated ?? created;
  const content = [
    "---",
    `id: ${id}`,
    `status: ${status}`,
    `created: ${created}`,
    `updated: ${updatedLine}`,
    "---",
    `- [${marker}] ${description}`,
    "",
  ].join("\n");
  writeFileSync(join(d, `${id}.md`), content, "utf-8");
}

describe("task show (CLI)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "task-show-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("displays detailed task information", () => {
    seedTask(dir, "task-1", "todo", "Buy groceries", "2024-06-01T10:00:00.000Z");

    const { stdout, stderr } = runCli("show task-1", dir);

    expect(stderr).toBe("");
    expect(stdout).toContain("ID:      task-1");
    expect(stdout).toContain("Title:   Buy groceries");
    expect(stdout).toContain("Status:  todo");
    expect(stdout).toContain("Created: 2024-06-01");
    expect(stdout).toContain("Updated: 2024-06-01");
    expect(stdout).toContain("- [ ] Buy groceries");
  });

  it("shows the correct checkbox marker for done tasks", () => {
    seedTask(dir, "task-1", "done", "Pay bills", "2024-06-01T10:00:00.000Z");

    const { stdout } = runCli("show task-1", dir);
    expect(stdout).toContain("- [x] Pay bills");
  });

  it("shows the correct checkbox marker for doing tasks", () => {
    seedTask(dir, "task-1", "doing", "Write docs", "2024-06-01T10:00:00.000Z");

    const { stdout } = runCli("show task-1", dir);
    expect(stdout).toContain("- [/] Write docs");
  });

  it("shows tags when present in the description", () => {
    seedTask(
      dir,
      "task-1",
      "todo",
      "Fix login bug #bug #auth",
      "2024-06-01T10:00:00.000Z",
    );

    const { stdout } = runCli("show task-1", dir);
    expect(stdout).toContain("#bug");
    expect(stdout).toContain("#auth");
  });

  it("shows updated date when different from created", () => {
    seedTask(
      dir,
      "task-1",
      "done",
      "Fixed task",
      "2024-06-01T10:00:00.000Z",
      "2024-06-05T14:00:00.000Z",
    );

    const { stdout } = runCli("show task-1", dir);
    expect(stdout).toContain("Created: 2024-06-01");
    expect(stdout).toContain("Updated: 2024-06-05");
  });

  it("shows an error for a non-existent task", () => {
    const { stderr } = runCli("show task-999", dir);
    expect(stderr).toContain("Error");
    expect(stderr).toContain("task-999");
  });

  it("shows an error for an empty task ID", () => {
    const { stderr } = runCli('show ""', dir);
    expect(stderr).toContain("Error");
  });
});
