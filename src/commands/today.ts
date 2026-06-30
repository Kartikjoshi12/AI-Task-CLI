import { Command } from "commander";
import { ConfigService } from "../services/config.js";
import { TaskService } from "../services/task.js";
import { Renderer } from "../renderer.js";

function formatDate(iso: string): string {
  if (!iso) return "-";
  return iso.slice(0, 10);
}

export const todayCommand = new Command("today")
  .description("Show tasks created today")
  .action(async () => {
    try {
      const config = new ConfigService(process.cwd());
      const provider = config.createProvider();
      const service = new TaskService(provider);
      const renderer = new Renderer();

      const all = await service.listTasks();
      const today = formatDate(new Date().toISOString());
      const tasks = all.filter((t) => formatDate(t.createdAt) === today);

      if (tasks.length === 0) {
        renderer.message("No tasks created today.");
        return;
      }

      renderer.taskTable(tasks);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      new Renderer().error(message);
      process.exit(1);
    }
  });
