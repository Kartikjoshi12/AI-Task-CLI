import { Command } from "commander";
import { createProvider } from "../config.js";
import { printTaskTable } from "../display.js";

export const completedCommand = new Command("completed")
  .description("Show all completed tasks")
  .action(async () => {
    const provider = createProvider(process.cwd());

    try {
      const tasks = await provider.listTasks({ status: "done" });

      if (tasks.length === 0) {
        console.log("No completed tasks.");
        return;
      }

      printTaskTable(tasks);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });
