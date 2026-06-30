import { Command } from "commander";
import { ConfigService } from "../services/config.js";
import { TaskService } from "../services/task.js";
import { Renderer } from "../renderer.js";

export const updateCommand = new Command("update")
  .argument("<task-id>", "task ID to update")
  .option("-t, --title <title>", "Update the task title")
  .option("-c, --content <content>", "Update the task content/notes")
  .option("--tags <tags>", 'Update tags (comma-separated, e.g. "bug,backend")')
  .description("Update a task's title, content, or tags")
  .action(async (taskId: string, options: { title?: string; content?: string; tags?: string }) => {
    try {
      const config = new ConfigService(process.cwd());
      const provider = config.createProvider();
      const service = new TaskService(provider);
      const renderer = new Renderer();

      const updates: { title?: string; content?: string; tags?: string } = {};
      if (options.title !== undefined) updates.title = options.title;
      if (options.content !== undefined) updates.content = options.content;
      if (options.tags !== undefined) updates.tags = options.tags;

      if (Object.keys(updates).length === 0) {
        renderer.error("Nothing to update. Use --title, --content, or --tags.");
        process.exit(1);
      }

      const updated = await service.updateTask(taskId, updates);
      renderer.success(`Updated task ${updated.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      new Renderer().error(message);
      process.exit(1);
    }
  });
