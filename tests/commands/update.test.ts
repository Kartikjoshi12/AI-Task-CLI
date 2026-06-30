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

function seedTask(dir: string, id: string, description: string) {
  const d = join(dir, "tasks");
  mkdirSync(d, { recursive: true });
  const content = [
    "---",
    `id: ${id}`,
    "status: todo",
    "created: 2024-06-01T10:00:00.000Z",
    "updated: 2024-06-01T10:00:00.000Z",
    "---",
    `- [ ] ${description}`,
    "",
  ].join("\n");
  writeFileSync(join(d, `${id}.md`), content, "utf-8");
}

describe("task update (CLI)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "task-update-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("updates the title", () => {
    seedTask(dir, "task-1", "Old title");

    const { stdout, stderr } = runCli(`update task-1 --title "New title"`, dir);

    expect(stderr).toBe("");
    expect(stdout).toContain("Updated task task-1");

    const content = readFileSync(join(dir, "tasks", "task-1.md"), "utf-8");
    expect(content).toContain("- [ ] New title");
    expect(content).not.toContain("Old title");
  });

  it("updates the content", () => {
    seedTask(dir, "task-1", "Task");

    const { stdout } = runCli(`update task-1 --content "Some detailed notes."`, dir);

    expect(stdout).toContain("Updated task task-1");

    const content = readFileSync(join(dir, "tasks", "task-1.md"), "utf-8");
    expect(content).toContain("Some detailed notes.");
  });

  it("updates tags", () => {
    seedTask(dir, "task-1", "Task with tags");

    const { stdout } = runCli(`update task-1 --tags "bug,backend"`, dir);

    expect(stdout).toContain("Updated task task-1");

    const content = readFileSync(join(dir, "tasks", "task-1.md"), "utf-8");
    expect(content).toContain("tags: bug, backend");
  });

  it("shows an error for a non-existent task", () => {
    const { stderr } = runCli("update task-999 --title New", dir);
    expect(stderr).toContain("Error");
    expect(stderr).toContain("task-999");
  });

  it("shows an error for an empty title", () => {
    seedTask(dir, "task-1", "Task");

    const { stderr } = runCli(`update task-1 --title ""`, dir);
    expect(stderr).toContain("Error");
    expect(stderr).toContain("empty");
  });

  it("shows an error for empty tags", () => {
    seedTask(dir, "task-1", "Task");

    const { stderr } = runCli(`update task-1 --tags ""`, dir);
    expect(stderr).toContain("Error");
    expect(stderr).toContain("empty");
  });

  it("shows an error when nothing to update", () => {
    seedTask(dir, "task-1", "Task");

    const { stderr } = runCli("update task-1", dir);
    expect(stderr).toContain("Error");
    expect(stderr).toContain("Nothing to update");
  });
});
