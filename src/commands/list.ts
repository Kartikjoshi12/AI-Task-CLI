import { Command } from "commander";
import { createProvider } from "../config.js";
import { printTaskTable } from "../display.js";
import type { TaskStatus } from "../types/task.js";

export const listCommand = new Command("list")
  .description("List all tasks")
  .option("-s, --status <status>", "Filter by status: todo, doing, done")
  .option("-p, --project <project>", "Filter by project")
  .action(async (options: { status?: string; project?: string }) => {
    const provider = createProvider(process.cwd());

    try {
      const validStatus = isValidStatus(options.status) ? options.status : undefined;
      const tasks = await provider.listTasks({
        ...(validStatus ? { status: validStatus } : {}),
        ...(options.project ? { project: options.project } : {}),
      });

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
