import { Command } from "commander";
import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { statSync } from "node:fs";
import { getConfig, setConfig } from "../config.js";

export const workspaceCommand = new Command("workspace").description("Manage workspaces");

workspaceCommand
  .command("list")
  .description("List all workspaces")
  .action(async () => {
    try {
      const workspacesDir = join(process.cwd(), "workspaces");
      let entries: string[];
      try {
        entries = await readdir(workspacesDir);
      } catch {
        console.log("No workspaces found.");
        return;
      }

      const config = await getConfig(process.cwd());
      const dirs = entries.filter((e) => {
        try {
          return statSync(join(workspacesDir, e)).isDirectory();
        } catch {
          return false;
        }
      });

      if (dirs.length === 0) {
        console.log("No workspaces found.");
        return;
      }

      for (const dir of dirs) {
        const marker = dir === config.workspace ? " *" : "  ";
        console.log(`${marker} ${dir}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
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
      console.error("Error: Workspace name is required");
      process.exit(1);
    }

    try {
      const dir = join(process.cwd(), "workspaces", trimmed, "tasks");
      await mkdir(dir, { recursive: true });
      await setConfig(process.cwd(), { workspace: trimmed });
      console.log(`Created and switched to workspace "${trimmed}".`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
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
      console.error("Error: Workspace name is required");
      process.exit(1);
    }

    try {
      const dir = join(process.cwd(), "workspaces", trimmed, "tasks");
      try {
        await mkdir(dir, { recursive: true });
      } catch {
        // directory will be created if it doesn't exist
      }
      await setConfig(process.cwd(), { workspace: trimmed });
      console.log(`Switched to workspace "${trimmed}".`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

workspaceCommand
  .command("current")
  .description("Show the active workspace")
  .action(async () => {
    try {
      const config = await getConfig(process.cwd());
      console.log(config.workspace);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });
