import { Command } from "commander";
import { MarkdownProvider } from "../providers/markdown.js";

function formatDate(iso: string): string {
  if (!iso) return "-";
  return iso.slice(0, 10);
}

function extractTags(description: string): string[] {
  const tags: string[] = [];
  const re = /#([a-zA-Z0-9_/-]+)/g;
  let match;
  while ((match = re.exec(description)) !== null) {
    if (!match[1].startsWith("task-")) {
      tags.push(`#${match[1]}`);
    }
  }
  return tags;
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

      const tags = extractTags(task.description);

      console.log(`ID:      ${task.id}`);
      console.log(`Title:   ${task.description}`);
      console.log(`Status:  ${task.status}`);
      console.log(`Created: ${formatDate(task.createdAt)}`);
      console.log(`Updated: ${formatDate(task.updatedAt)}`);
      if (tags.length > 0) {
        console.log(`Tags:    ${tags.join(" ")}`);
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
