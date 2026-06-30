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
  content?: string,
  tags?: string,
) {
  const d = join(dir, "workspaces", "default", "tasks");
  mkdirSync(d, { recursive: true });
  const marker = status === "done" ? "x" : status === "doing" ? "/" : " ";
  const front = [
    "---",
    `id: ${id}`,
    `status: ${status}`,
    "created: 2024-06-01T10:00:00.000Z",
    "updated: 2024-06-01T10:00:00.000Z",
  ];
  if (tags) front.push(`tags: ${tags}`);
  front.push("---");

  const lines = [`- [${marker}] ${description}`];
  if (content) {
    lines.push("");
    lines.push(content);
  }
  lines.push("");

  writeFileSync(join(d, `${id}.md`), [...front, ...lines].join("\n"), "utf-8");
}

describe("task search (CLI)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "task-search-test-"));
    seedTask(dir, "task-1", "todo", "Fix OTP validation", "", "bug, auth");
    seedTask(dir, "task-2", "todo", "Add booking flow", "Implement the booking page", "feature");
    seedTask(dir, "task-3", "done", "Setup CI", "Configure GitHub Actions", "devops");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("finds tasks by keyword in title (case-insensitive)", () => {
    const { stdout } = runCli("search otp", dir);
    expect(stdout).toContain("task-1");
    expect(stdout).not.toContain("task-2");
  });

  it("finds tasks by keyword in content", () => {
    const { stdout } = runCli("search booking", dir);
    expect(stdout).toContain("task-2");
  });

  it("finds tasks by keyword in tags", () => {
    const { stdout } = runCli("search bug", dir);
    expect(stdout).toContain("task-1");
  });

  it("performs case-insensitive search", () => {
    const { stdout } = runCli("search OTP", dir);
    expect(stdout).toContain("task-1");
  });

  it("performs partial match search", () => {
    const { stdout } = runCli("search auth", dir);
    expect(stdout).toContain("task-1");
  });

  it("shows no matching tasks when nothing found", () => {
    const { stdout } = runCli("search nonexistent", dir);
    expect(stdout).toContain("No matching tasks found.");
  });

  it("displays results in table format", () => {
    const { stdout } = runCli("search otp", dir);
    expect(stdout).toContain("ID");
    expect(stdout).toContain("Title");
    expect(stdout).toContain("Status");
    expect(stdout).toContain("Created");
  });

  it("supports --status filter", () => {
    const { stdout } = runCli("search CI --status done", dir);
    expect(stdout).toContain("task-3");
  });

  it("filters out tasks not matching status", () => {
    const { stdout } = runCli("search otp --status done", dir);
    expect(stdout).toContain("No matching tasks found.");
  });

  it("shows an error for empty query", () => {
    const { stderr } = runCli('search ""', dir);
    expect(stderr).toContain("Error");
  });
});
