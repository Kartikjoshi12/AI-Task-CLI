import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { MarkdownProvider } from "./providers/markdown.js";

export interface TaskConfig {
  workspace: string;
  project: string;
  projects: string[];
}

const CONFIG_FILE = ".taskrc";

const DEFAULT_CONFIG: TaskConfig = {
  workspace: "default",
  project: "default",
  projects: ["default"],
};

export async function getConfig(cwd: string): Promise<TaskConfig> {
  try {
    const content = await readFile(join(cwd, CONFIG_FILE), "utf-8");
    const config = JSON.parse(content);
    return {
      workspace: config.workspace ?? "default",
      project: config.project ?? "default",
      projects: Array.isArray(config.projects) ? config.projects : ["default"],
    };
  } catch {
    return { ...DEFAULT_CONFIG, projects: [] };
  }
}

export async function setConfig(cwd: string, config: TaskConfig): Promise<void> {
  await writeFile(join(cwd, CONFIG_FILE), JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export function createProvider(
  cwd: string,
  workspaceOverride?: string,
  projectOverride?: string,
): MarkdownProvider {
  let workspace = "default";
  let project = "default";
  try {
    const content = readFileSync(join(cwd, CONFIG_FILE), "utf-8");
    const config: TaskConfig = JSON.parse(content);
    workspace = config.workspace ?? "default";
    project = config.project ?? "default";
  } catch {
    // use defaults
  }
  const provider = new MarkdownProvider(cwd, workspaceOverride ?? workspace);
  // Set default project filter on the provider
  provider.setDefaultProject(projectOverride ?? project);
  return provider;
}
