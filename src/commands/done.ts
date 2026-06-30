import { Command } from "commander";
import { createProvider } from "../config.js";

export const doneCommand = new Command("done")
  .argument("<task-id>", "task ID to mark as done")
  .description("Mark a task as completed")
  .action(async (taskId: string) => {
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

      if (existing.status === "done") {
        console.log(`Task ${trimmed} is already done.`);
        return;
      }

      await provider.updateTask(trimmed, { status: "done" });
      console.log(`Marked task ${trimmed} as done.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });
