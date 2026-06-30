import { Command } from "commander";
import { createProvider } from "../config.js";
import { printTaskTable, formatDate } from "../display.js";

export const todayCommand = new Command("today")
  .description("Show tasks created today")
  .action(async () => {
    const provider = createProvider(process.cwd());

    try {
      const all = await provider.listTasks();
      const today = formatDate(new Date().toISOString());
      const tasks = all.filter((t) => formatDate(t.createdAt) === today);

      if (tasks.length === 0) {
        console.log("No tasks created today.");
        return;
      }

      printTaskTable(tasks);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });
