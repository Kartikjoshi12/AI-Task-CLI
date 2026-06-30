import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";

const projectRoot = resolve(import.meta.dirname, "..", "..");
const cliPath = resolve(projectRoot, "src", "cli.ts");
const tsxPath = resolve(projectRoot, "node_modules", ".bin", "tsx");

function runCli(args: string, cwd: string, input?: string): { stdout: string; stderr: string } {
  try {
    const cmd = input
      ? `echo ${input} | "${tsxPath}" "${cliPath}" ${args}`
      : `"${tsxPath}" "${cliPath}" ${args}`;
    const stdout = execSync(cmd, {
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

function seedTask(dir: string, id: string) {
  const d = join(dir, "tasks");
  mkdirSync(d, { recursive: true });
  writeFileSync(
    join(d, `${id}.md`),
    [
      "---",
      `id: ${id}`,
      "status: todo",
      "created: 2024-06-01T10:00:00.000Z",
      "updated: 2024-06-01T10:00:00.000Z",
      "---",
      `- [ ] ${id}`,
      "",
    ].join("\n"),
    "utf-8",
  );
}

describe("task delete (CLI)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "task-delete-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("deletes a task with --force", () => {
    seedTask(dir, "task-1");

    const { stdout, stderr } = runCli("delete task-1 --force", dir);

    expect(stderr).toBe("");
    expect(stdout).toContain("Deleted task task-1");
    expect(existsSync(join(dir, "tasks", "task-1.md"))).toBe(false);
  });

  it("deletes a task with confirmation (y)", () => {
    seedTask(dir, "task-1");

    const { stdout, stderr } = runCli("delete task-1", dir, "y");

    expect(stderr).toBe("");
    expect(stdout).toContain("Deleted task task-1");
    expect(existsSync(join(dir, "tasks", "task-1.md"))).toBe(false);
  });

  it("cancels deletion when response is n", () => {
    seedTask(dir, "task-1");

    const { stdout, stderr } = runCli("delete task-1", dir, "n");

    expect(stderr).toBe("");
    expect(stdout).toContain("Cancelled.");
    expect(existsSync(join(dir, "tasks", "task-1.md"))).toBe(true);
  });

  it("shows an error for a non-existent task", () => {
    const { stderr } = runCli("delete task-999 --force", dir);
    expect(stderr).toContain("Error");
    expect(stderr).toContain("task-999");
  });

  it("shows an error for an empty task ID", () => {
    const { stderr } = runCli('delete "" --force', dir);
    expect(stderr).toContain("Error");
  });
});
