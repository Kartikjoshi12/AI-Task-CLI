import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { MarkdownProvider } from "./providers/markdown.js";

export interface TaskConfig {
  workspace: string;
}

const CONFIG_FILE = ".taskrc";

export async function getConfig(cwd: string): Promise<TaskConfig> {
  try {
    const content = await readFile(join(cwd, CONFIG_FILE), "utf-8");
    return JSON.parse(content);
  } catch {
    return { workspace: "default" };
  }
}

export async function setConfig(cwd: string, config: TaskConfig): Promise<void> {
  await writeFile(join(cwd, CONFIG_FILE), JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export function createProvider(cwd: string, workspaceOverride?: string): MarkdownProvider {
  let workspace = "default";
  try {
    const content = readFileSync(join(cwd, CONFIG_FILE), "utf-8");
    const config: TaskConfig = JSON.parse(content);
    workspace = config.workspace;
  } catch {
    // use default
  }
  return new MarkdownProvider(cwd, workspaceOverride ?? workspace);
}
