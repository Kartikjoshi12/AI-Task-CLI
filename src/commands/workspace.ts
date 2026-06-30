import { Command } from "commander";
import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { statSync } from "node:fs";
import { ConfigService } from "../services/config.js";
import { Renderer } from "../renderer.js";

export const workspaceCommand = new Command("workspace").description("Manage workspaces");

workspaceCommand
  .command("list")
  .description("List all workspaces")
  .action(async () => {
    try {
      const renderer = new Renderer();
      const config = new ConfigService(process.cwd());
      const workspacesDir = join(process.cwd(), "workspaces");
      let entries: string[];
      try {
        entries = await readdir(workspacesDir);
      } catch {
        renderer.message("No workspaces found.");
        return;
      }

      const cfg = await config.getConfig();
      const dirs = entries.filter((e) => {
        try {
          return statSync(join(workspacesDir, e)).isDirectory();
        } catch {
          return false;
        }
      });

      if (dirs.length === 0) {
        renderer.message("No workspaces found.");
        return;
      }

      for (const dir of dirs) {
        const marker = dir === cfg.workspace ? " *" : "  ";
        renderer.message(`${marker} ${dir}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      new Renderer().error(message);
      process.exit(1);
    }
  });

workspaceCommand
  .command("create")
  .argument("<name>", "workspace name")
  .description("Create a new workspace and switch to it")
  .action(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      new Renderer().error("Workspace name is required");
      process.exit(1);
    }

    try {
      const renderer = new Renderer();
      const config = new ConfigService(process.cwd());
      const dir = join(process.cwd(), "workspaces", trimmed, "tasks");
      await mkdir(dir, { recursive: true });
      await config.setWorkspace(trimmed);
      renderer.success(`Created and switched to workspace "${trimmed}".`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      new Renderer().error(message);
      process.exit(1);
    }
  });

workspaceCommand
  .command("use")
  .argument("<name>", "workspace name")
  .description("Switch to an existing workspace")
  .action(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      new Renderer().error("Workspace name is required");
      process.exit(1);
    }

    try {
      const renderer = new Renderer();
      const config = new ConfigService(process.cwd());
      const dir = join(process.cwd(), "workspaces", trimmed, "tasks");
      await mkdir(dir, { recursive: true });
      await config.setWorkspace(trimmed);
      renderer.success(`Switched to workspace "${trimmed}".`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      new Renderer().error(message);
      process.exit(1);
    }
  });

workspaceCommand
  .command("current")
  .description("Show the active workspace")
  .action(async () => {
    try {
      const renderer = new Renderer();
      const config = new ConfigService(process.cwd());
      const name = await config.getWorkspace();
      renderer.message(name);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      new Renderer().error(message);
      process.exit(1);
    }
  });
