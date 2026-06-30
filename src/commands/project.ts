import { Command } from "commander";
import { getConfig, setConfig } from "../config.js";

export const projectCommand = new Command("project").description("Manage projects");

projectCommand
  .command("create")
  .argument("<name>", "project name")
  .description("Create a new project and switch to it")
  .action(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      console.error("Error: Project name is required");
      process.exit(1);
    }

    try {
      const config = await getConfig(process.cwd());
      if (!config.projects.includes(trimmed)) {
        config.projects.push(trimmed);
      }
      config.project = trimmed;
      await setConfig(process.cwd(), config);
      console.log(`Created and switched to project "${trimmed}".`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

projectCommand
  .command("list")
  .description("List all projects")
  .action(async () => {
    try {
      const config = await getConfig(process.cwd());
      if (config.projects.length === 0) {
        console.log("No projects found.");
        return;
      }

      for (const proj of config.projects) {
        const marker = proj === config.project ? " *" : "  ";
        console.log(`${marker} ${proj}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
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
      console.error("Error: Project name is required");
      process.exit(1);
    }

    try {
      const config = await getConfig(process.cwd());
      if (!config.projects.includes(trimmed)) {
        console.error(`Error: Project not found: ${trimmed}`);
        process.exit(1);
      }
      config.project = trimmed;
      await setConfig(process.cwd(), config);
      console.log(`Switched to project "${trimmed}".`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

projectCommand
  .command("current")
  .description("Show the active project")
  .action(async () => {
    try {
      const config = await getConfig(process.cwd());
      console.log(config.project);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });
