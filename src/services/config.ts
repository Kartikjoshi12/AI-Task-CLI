import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { MarkdownProvider } from "../providers/markdown.js";

export interface TaskConfig {
  workspace: string;
  project: string;
  projects: string[];
  aiProvider: string;
  geminiApiKey?: string;
  geminiModel?: string;
  openrouterApiKey?: string;
  openrouterModel?: string;
}

const CONFIG_FILE = ".taskrc";

const DEFAULT_CONFIG: TaskConfig = {
  workspace: "default",
  project: "default",
  projects: ["default"],
  aiProvider: "dummy",
};

export class ConfigService {
  constructor(private cwd: string) {}

  async getConfig(): Promise<TaskConfig> {
    try {
      const content = await readFile(join(this.cwd, CONFIG_FILE), "utf-8");
      const config = JSON.parse(content);
      return {
        workspace: config.workspace ?? "default",
        project: config.project ?? "default",
        projects: Array.isArray(config.projects) ? config.projects : ["default"],
        aiProvider: config.aiProvider ?? "dummy",
      };
    } catch {
      return { ...DEFAULT_CONFIG, projects: [] };
    }
  }

  async setConfig(config: TaskConfig): Promise<void> {
    await writeFile(join(this.cwd, CONFIG_FILE), JSON.stringify(config, null, 2) + "\n", "utf-8");
  }

  async getWorkspace(): Promise<string> {
    const config = await this.getConfig();
    return config.workspace;
  }

  async setWorkspace(name: string): Promise<void> {
    const config = await this.getConfig();
    config.workspace = name;
    await this.setConfig(config);
  }

  async getProject(): Promise<string> {
    const config = await this.getConfig();
    return config.project;
  }

  async setProject(name: string): Promise<void> {
    const config = await this.getConfig();
    config.project = name;
    await this.setConfig(config);
  }

  async getProjects(): Promise<string[]> {
    const config = await this.getConfig();
    return [...config.projects];
  }

  async addProject(name: string): Promise<void> {
    const config = await this.getConfig();
    if (!config.projects.includes(name)) {
      config.projects.push(name);
    }
    await this.setConfig(config);
  }

  async getAIProvider(): Promise<string> {
    const config = await this.getConfig();
    return config.aiProvider;
  }

  async setAIProvider(name: string): Promise<void> {
    const config = await this.getConfig();
    config.aiProvider = name;
    await this.setConfig(config);
  }

  createProvider(workspaceOverride?: string, projectOverride?: string): MarkdownProvider {
    let workspace = "default";
    let project = "default";
    try {
      const content = readFileSync(join(this.cwd, CONFIG_FILE), "utf-8");
      const config: TaskConfig = JSON.parse(content);
      workspace = config.workspace ?? "default";
      project = config.project ?? "default";
    } catch {
      // use defaults
    }
    const provider = new MarkdownProvider(this.cwd, workspaceOverride ?? workspace);
    provider.setDefaultProject(projectOverride ?? project);
    return provider;
  }
}
