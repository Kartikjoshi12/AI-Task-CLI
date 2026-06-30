import { Command } from "commander";
import { MarkdownProvider } from "../providers/markdown.js";

function formatDate(iso: string): string {
  if (!iso) return "-";
  return iso.slice(0, 10);
}

function formatTags(tags: string): string {
  if (!tags) return "";
  return tags
    .split(",")
    .map((t) => `#${t.trim()}`)
    .join(" ");
}

export const showCommand = new Command("show")
  .argument("<task-id>", "task ID to display")
  .description("Show detailed information about a task")
  .action(async (taskId: string) => {
    const trimmed = taskId.trim();
    if (!trimmed) {
      console.error("Error: Task ID is required");
      process.exit(1);
    }

    const provider = new MarkdownProvider(process.cwd());

    try {
      const task = await provider.getTaskById(trimmed);
      if (!task) {
        console.error(`Error: Task not found: ${trimmed}`);
        process.exit(1);
      }

      console.log(`ID:      ${task.id}`);
      console.log(`Title:   ${task.description}`);
      console.log(`Status:  ${task.status}`);
      console.log(`Created: ${formatDate(task.createdAt)}`);
      console.log(`Updated: ${formatDate(task.updatedAt)}`);

      const tags = formatTags(task.tags);
      if (tags) {
        console.log(`Tags:    ${tags}`);
      }

      if (task.content) {
        console.log("");
        console.log(task.content);
      }

      console.log("");
      console.log(
        `- [${task.status === "done" ? "x" : task.status === "doing" ? "/" : " "}] ${task.description}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });
