import { Command } from "commander";
import { createProvider } from "../config.js";
import { printTaskTable } from "../display.js";

export const pendingCommand = new Command("pending")
  .description("Show all pending tasks")
  .action(async () => {
    const provider = createProvider(process.cwd());

    try {
      const tasks = await provider.listTasks({ status: "todo" });

      if (tasks.length === 0) {
        console.log("No pending tasks.");
        return;
      }

      printTaskTable(tasks);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });
