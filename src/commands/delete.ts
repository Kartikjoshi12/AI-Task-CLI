import { Command } from "commander";
import { createInterface } from "node:readline";
import { ConfigService } from "../services/config.js";
import { TaskService } from "../services/task.js";
import { Renderer } from "../renderer.js";

function promptYesNo(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

export const deleteCommand = new Command("delete")
  .argument("<task-id>", "task ID to delete")
  .option("-f, --force", "Skip confirmation prompt")
  .description("Delete a task")
  .action(async (taskId: string, options: { force?: boolean }) => {
    try {
      const config = new ConfigService(process.cwd());
      const provider = config.createProvider();
      const service = new TaskService(provider);
      const renderer = new Renderer();

      await service.getTask(taskId); // ensure exists

      if (!options.force) {
        const ok = await promptYesNo("Are you sure? (y/N) ");
        if (!ok) {
          renderer.message("Cancelled.");
          return;
        }
      }

      await service.deleteTask(taskId);
      renderer.success(`Deleted task ${taskId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      new Renderer().error(message);
      process.exit(1);
    }
  });
