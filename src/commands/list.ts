import { Command } from "commander";
import { ConfigService } from "../services/config.js";
import { TaskService } from "../services/task.js";
import { Renderer } from "../renderer.js";
import type { TaskStatus } from "../types/task.js";

export const listCommand = new Command("list")
  .description("List all tasks")
  .option("-s, --status <status>", "Filter by status: todo, doing, done")
  .option("-p, --project <project>", "Filter by project")
  .action(async (options: { status?: string; project?: string }) => {
    try {
      const config = new ConfigService(process.cwd());
      const provider = config.createProvider();
      const service = new TaskService(provider);
      const renderer = new Renderer();

      const validStatus = isValidStatus(options.status) ? options.status : undefined;
      const tasks = await service.listTasks({
        ...(validStatus ? { status: validStatus } : {}),
        ...(options.project ? { project: options.project } : {}),
      });

      if (tasks.length === 0) {
        renderer.message("No tasks found.");
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
