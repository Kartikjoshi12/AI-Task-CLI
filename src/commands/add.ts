import { Command } from "commander";
import { MarkdownProvider } from "../providers/markdown.js";

export const addCommand = new Command("add")
  .argument("<description>", "task description")
  .description("Create a new task")
  .action(async (description: string) => {
    const trimmed = description.trim();
    if (!trimmed) {
      console.error("Error: Task description cannot be empty");
      process.exit(1);
    }

    try {
      const provider = new MarkdownProvider(process.cwd());
      const task = await provider.createTask({ description: trimmed });
      console.log(`Created task ${task.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });
