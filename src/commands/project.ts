import { Command } from "commander";
import { ConfigService } from "../services/config.js";
import { Renderer } from "../renderer.js";

export const projectCommand = new Command("project").description("Manage projects");

projectCommand
  .command("create")
  .argument("<name>", "project name")
  .description("Create a new project and switch to it")
  .action(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      new Renderer().error("Project name is required");
      process.exit(1);
    }

    try {
      const renderer = new Renderer();
      const config = new ConfigService(process.cwd());
      await config.addProject(trimmed);
      await config.setProject(trimmed);
      renderer.success(`Created and switched to project "${trimmed}".`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      new Renderer().error(message);
      process.exit(1);
    }
  });

projectCommand
  .command("list")
  .description("List all projects")
  .action(async () => {
    try {
      const renderer = new Renderer();
      const config = new ConfigService(process.cwd());
      const cfg = await config.getConfig();

      if (cfg.projects.length === 0) {
        renderer.message("No projects found.");
        return;
      }

      for (const proj of cfg.projects) {
        const marker = proj === cfg.project ? " *" : "  ";
        renderer.message(`${marker} ${proj}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      new Renderer().error(message);
      process.exit(1);
    }
  });

projectCommand
  .command("use")
  .argument("<name>", "project name")
  .description("Switch to an existing project")
  .action(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      new Renderer().error("Project name is required");
      process.exit(1);
    }

    try {
      const renderer = new Renderer();
      const config = new ConfigService(process.cwd());
      const cfg = await config.getConfig();
      if (!cfg.projects.includes(trimmed)) {
        renderer.error(`Project not found: ${trimmed}`);
        process.exit(1);
      }
      await config.setProject(trimmed);
      renderer.success(`Switched to project "${trimmed}".`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      new Renderer().error(message);
      process.exit(1);
    }
  });

projectCommand
  .command("current")
  .description("Show the active project")
  .action(async () => {
    try {
      const renderer = new Renderer();
      const config = new ConfigService(process.cwd());
      const name = await config.getProject();
      renderer.message(name);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      new Renderer().error(message);
      process.exit(1);
    }
  });
