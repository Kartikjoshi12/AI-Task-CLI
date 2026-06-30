import { Command } from "commander";
import { createProvider, getConfig, setConfig } from "../config.js";

export const addCommand = new Command("add")
  .argument("<description>", "task description")
  .option("-w, --workspace <workspace>", "Override the active workspace")
  .option("-p, --project <project>", "Override the active project")
  .description("Create a new task")
  .action(async (description: string, options: { workspace?: string; project?: string }) => {
    const trimmed = description.trim();
    if (!trimmed) {
      console.error("Error: Task description cannot be empty");
      process.exit(1);
    }

    try {
      if (options.project) {
        const config = await getConfig(process.cwd());
        if (!config.projects.includes(options.project)) {
          config.projects.push(options.project);
        }
        await setConfig(process.cwd(), config);
      }
      const provider = createProvider(process.cwd(), options.workspace, options.project);
      const task = await provider.createTask({ description: trimmed });
      console.log(`Created task ${task.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });
