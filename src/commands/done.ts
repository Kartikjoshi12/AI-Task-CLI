import { Command } from "commander";
import { ConfigService } from "../services/config.js";
import { TaskService } from "../services/task.js";
import { Renderer } from "../renderer.js";

export const doneCommand = new Command("done")
  .argument("<task-id>", "task ID to mark as done")
  .description("Mark a task as completed")
  .action(async (taskId: string) => {
    try {
      const config = new ConfigService(process.cwd());
      const provider = config.createProvider();
      const service = new TaskService(provider);
      const renderer = new Renderer();
      const { alreadyDone } = await service.markDone(taskId);
      if (alreadyDone) {
        renderer.message(`Task ${taskId} is already done.`);
        return;
      }
      renderer.success(`Marked task ${taskId} as done.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      new Renderer().error(message);
      process.exit(1);
    }
  });
