import { Command } from "commander";
import { createProvider } from "../config.js";

export const updateCommand = new Command("update")
  .argument("<task-id>", "task ID to update")
  .option("-t, --title <title>", "Update the task title")
  .option("-c, --content <content>", "Update the task content/notes")
  .option("--tags <tags>", 'Update tags (comma-separated, e.g. "bug,backend")')
  .description("Update a task's title, content, or tags")
  .action(async (taskId: string, options: { title?: string; content?: string; tags?: string }) => {
    const trimmed = taskId.trim();
    if (!trimmed) {
      console.error("Error: Task ID is required");
      process.exit(1);
    }

    const provider = createProvider(process.cwd());

    try {
      const existing = await provider.getTaskById(trimmed);
      if (!existing) {
        console.error(`Error: Task not found: ${trimmed}`);
        process.exit(1);
      }

      const updates: { description?: string; tags?: string; content?: string } = {};

      if (options.title !== undefined) {
        const val = options.title.trim();
        if (!val) {
          console.error("Error: Title cannot be empty");
          process.exit(1);
        }
        updates.description = val;
      }

      if (options.content !== undefined) {
        updates.content = options.content;
      }

      if (options.tags !== undefined) {
        const val = options.tags.trim();
        if (!val) {
          console.error("Error: Tags cannot be empty");
          process.exit(1);
        }
        updates.tags = val.replace(/\s*,\s*/g, ", ");
      }

      if (Object.keys(updates).length === 0) {
        console.error("Error: Nothing to update. Use --title, --content, or --tags.");
        process.exit(1);
      }

      const updated = await provider.updateTask(trimmed, updates);
      console.log(`Updated task ${updated.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });
