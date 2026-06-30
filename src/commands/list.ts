import { Command } from "commander";
import { MarkdownProvider } from "../providers/markdown.js";
import { printTaskTable } from "../display.js";
import type { TaskStatus } from "../types/task.js";

export const listCommand = new Command("list")
  .description("List all tasks")
  .option("-s, --status <status>", "Filter by status: todo, doing, done")
  .action(async (options: { status?: string }) => {
    const provider = new MarkdownProvider(process.cwd());

    try {
      const validStatus = isValidStatus(options.status) ? options.status : undefined;
      const tasks = await provider.listTasks(validStatus ? { status: validStatus } : undefined);

      if (tasks.length === 0) {
        console.log("No tasks found.");
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
