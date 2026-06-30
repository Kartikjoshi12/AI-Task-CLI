import { Command } from "commander";
import { createInterface } from "node:readline";
import { MarkdownProvider } from "../providers/markdown.js";

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
    const trimmed = taskId.trim();
    if (!trimmed) {
      console.error("Error: Task ID is required");
      process.exit(1);
    }

    const provider = new MarkdownProvider(process.cwd());

    try {
      const existing = await provider.getTaskById(trimmed);
      if (!existing) {
        console.error(`Error: Task not found: ${trimmed}`);
        process.exit(1);
      }

      if (!options.force) {
        const ok = await promptYesNo("Are you sure? (y/N) ");
        if (!ok) {
          console.log("Cancelled.");
          return;
        }
      }

      await provider.deleteTask(trimmed);
      console.log(`Deleted task ${trimmed}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });
