import { Command } from "commander";
import { ConfigService } from "../services/config.js";
import { TaskService } from "../services/task.js";
import { Renderer } from "../renderer.js";
import type { TaskStatus } from "../types/task.js";

export const searchCommand = new Command("search")
  .argument("<query>", "Search keyword")
  .option("-s, --status <status>", "Filter by status: todo, doing, done")
  .description("Search tasks by title, content, or tags")
  .action(async (query: string, options: { status?: string }) => {
    const trimmed = query.trim();
    if (!trimmed) {
      new Renderer().error("Search query is required");
      process.exit(1);
    }

    try {
      const config = new ConfigService(process.cwd());
      const provider = config.createProvider();
      const service = new TaskService(provider);
      const renderer = new Renderer();

      const validStatus = isValidStatus(options.status) ? options.status : undefined;
      const tasks = await service.listTasks({
        keyword: trimmed,
        ...(validStatus ? { status: validStatus } : {}),
      });

      if (tasks.length === 0) {
        renderer.message("No matching tasks found.");
        return;
      }

      renderer.taskTable(tasks);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      new Renderer().error(message);
      process.exit(1);
    }
  });

function isValidStatus(s?: string): s is TaskStatus {
  return s === "todo" || s === "doing" || s === "done";
}
