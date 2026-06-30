import { Command } from "commander";
import { ConfigService } from "../services/config.js";
import { TaskService } from "../services/task.js";
import { Renderer } from "../renderer.js";

export const completedCommand = new Command("completed")
  .description("Show all completed tasks")
  .action(async () => {
    try {
      const config = new ConfigService(process.cwd());
      const provider = config.createProvider();
      const service = new TaskService(provider);
      const renderer = new Renderer();

      const tasks = await service.listTasks({ status: "done" });

      if (tasks.length === 0) {
        renderer.message("No completed tasks.");
        return;
      }

      renderer.taskTable(tasks);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      new Renderer().error(message);
      process.exit(1);
    }
  });
