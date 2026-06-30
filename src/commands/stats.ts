import { Command } from "commander";
import { ConfigService } from "../services/config.js";
import { TaskService } from "../services/task.js";
import { Renderer } from "../renderer.js";

export const statsCommand = new Command("stats")
  .description("Display task statistics")
  .action(async () => {
    try {
      const config = new ConfigService(process.cwd());
      const provider = config.createProvider();
      const service = new TaskService(provider);
      const renderer = new Renderer();

      const all = await service.listTasks();
      const total = all.length;
      const pending = all.filter((t) => t.status === "todo").length;
      const completed = all.filter((t) => t.status === "done").length;

      renderer.stats(total, pending, completed);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      new Renderer().error(message);
      process.exit(1);
    }
  });
