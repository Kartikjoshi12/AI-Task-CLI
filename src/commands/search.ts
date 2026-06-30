import { Command } from "commander";
import { createProvider } from "../config.js";
import { printTaskTable } from "../display.js";
import type { TaskStatus } from "../types/task.js";

export const searchCommand = new Command("search")
  .argument("<query>", "Search keyword")
  .option("-s, --status <status>", "Filter by status: todo, doing, done")
  .description("Search tasks by title, content, or tags")
  .action(async (query: string, options: { status?: string }) => {
    const trimmed = query.trim();
    if (!trimmed) {
      console.error("Error: Search query is required");
      process.exit(1);
    }

    const provider = createProvider(process.cwd());

    try {
      const validStatus = isValidStatus(options.status) ? options.status : undefined;
      const tasks = await provider.listTasks({
        keyword: trimmed,
        ...(validStatus ? { status: validStatus } : {}),
      });

      if (tasks.length === 0) {
        console.log("No matching tasks found.");
        return;
      }

      printTaskTable(tasks);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

function isValidStatus(s?: string): s is TaskStatus {
  return s === "todo" || s === "doing" || s === "done";
}
