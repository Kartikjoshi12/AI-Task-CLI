import { Command } from "commander";
import { ConfigService } from "../services/config.js";
import { TaskService } from "../services/task.js";
import { Renderer } from "../renderer.js";

export const showCommand = new Command("show")
  .argument("<task-id>", "task ID to display")
  .description("Show detailed information about a task")
  .action(async (taskId: string) => {
    try {
      const config = new ConfigService(process.cwd());
      const provider = config.createProvider();
      const service = new TaskService(provider);
      const renderer = new Renderer();
      const task = await service.getTask(taskId);
      renderer.taskDetail(task);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      new Renderer().error(message);
      process.exit(1);
    }
  });
