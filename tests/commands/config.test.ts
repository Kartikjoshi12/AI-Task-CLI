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

describe("task config (CLI)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "task-config-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("shows configuration with defaults when no config exists", () => {
    const { stdout } = runCli("config", dir);

    expect(stdout).toContain("Workspace:");
    expect(stdout).toContain("Project:");
    expect(stdout).toContain("AI Provider:");
  });

  it("displays the current AI provider setting", () => {
    const { stdout } = runCli("config", dir);
    expect(stdout).toContain("dummy");
  });

  it("sets ai.provider to gemini", () => {
    const { stdout } = runCli("config ai.provider gemini", dir);

    expect(stdout).toContain("AI provider set to 'gemini'.");

    const config = JSON.parse(readFileSync(configFile(dir), "utf-8"));
    expect(config.aiProvider).toBe("gemini");
  });

  it("sets ai.provider to openai", () => {
    runCli("config ai.provider openai", dir);

    const config = JSON.parse(readFileSync(configFile(dir), "utf-8"));
    expect(config.aiProvider).toBe("openai");
  });

  it("sets ai.provider to claude", () => {
    runCli("config ai.provider claude", dir);

    const config = JSON.parse(readFileSync(configFile(dir), "utf-8"));
    expect(config.aiProvider).toBe("claude");
  });

  it("sets ai.provider to ollama", () => {
    runCli("config ai.provider ollama", dir);

    const config = JSON.parse(readFileSync(configFile(dir), "utf-8"));
    expect(config.aiProvider).toBe("ollama");
  });

  it("sets ai.provider to openrouter", () => {
    runCli("config ai.provider openrouter", dir);

    const config = JSON.parse(readFileSync(configFile(dir), "utf-8"));
    expect(config.aiProvider).toBe("openrouter");
  });

  it("sets ai.provider back to dummy", () => {
    runCli("config ai.provider gemini", dir);
    runCli("config ai.provider dummy", dir);

    const config = JSON.parse(readFileSync(configFile(dir), "utf-8"));
    expect(config.aiProvider).toBe("dummy");
  });

  it("shows error for unknown provider", () => {
    const { stderr } = runCli("config ai.provider unknown", dir);

    expect(stderr).toContain("Error");
    expect(stderr).toContain("unknown");
  });

  it("persists aiProvider across commands", () => {
    runCli("config ai.provider gemini", dir);

    const { stdout } = runCli("config", dir);
    expect(stdout).toContain("gemini");
  });
});

describe("AI provider switching end-to-end", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "task-provider-e2e-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("uses dummy provider by default for task creation", () => {
    const { stdout } = runCli(`"Buy groceries tomorrow"`, dir);
    expect(stdout).toContain("Task Created");
  });

  it("shows error when using gemini without API key", () => {
    runCli("config ai.provider gemini", dir);

    const { stderr } = runCli(`"Test task"`, dir);
    expect(stderr).toContain("Gemini API key not found");
  });

  it("switches back to dummy and works again", () => {
    runCli("config ai.provider gemini", dir);
    runCli("config ai.provider dummy", dir);

    const { stdout } = runCli(`"Test task"`, dir);
    expect(stdout).toContain("Task Created");
  });
});
