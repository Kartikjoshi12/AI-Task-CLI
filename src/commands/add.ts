import { Command } from "commander";
import { createProvider } from "../config.js";

export const addCommand = new Command("add")
  .argument("<description>", "task description")
  .option("-w, --workspace <workspace>", "Override the active workspace")
  .description("Create a new task")
  .action(async (description: string, options: { workspace?: string }) => {
    const trimmed = description.trim();
    if (!trimmed) {
      console.error("Error: Task description cannot be empty");
      process.exit(1);
    }

    try {
      const provider = createProvider(process.cwd(), options.workspace);
      const task = await provider.createTask({ description: trimmed });
      console.log(`Created task ${task.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });
