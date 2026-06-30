import { Command } from "commander";
import { MarkdownProvider } from "../providers/markdown.js";
import type { TaskStatus } from "../types/task.js";

function formatDate(iso: string): string {
  if (!iso) return "-";
  return iso.slice(0, 10);
}

function padEnd(s: string, n: number): string {
  return s + " ".repeat(Math.max(0, n - s.length));
}

export const searchCommand = new Command("search")
  .argument("<query>", "Search keyword")
  .option("-s, --status <status>", "Filter by status: todo, doing, done")
  .description("Search tasks by title, content, or tags")
  .action(async (query: string, options: { status?: string }) => {
    const trimmed = query.trim();
    if (!trimmed) {
      console.error("Error: Search query is required");
      process.exit(1);
    }

    const provider = new MarkdownProvider(process.cwd());

    try {
      const validStatus = isValidStatus(options.status) ? options.status : undefined;
      const tasks = await provider.listTasks({
        keyword: trimmed,
        ...(validStatus ? { status: validStatus } : {}),
      });

      if (tasks.length === 0) {
        console.log("No matching tasks found.");
        return;
      }

      const sorted = [...tasks].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const idWidth = Math.max(4, ...sorted.map((t) => t.id.length));
      const titleWidth = Math.max(5, ...sorted.map((t) => t.description.length));
      const statusWidth = 6;
      const dateWidth = 10;

      const header = `${padEnd("ID", idWidth)}  ${padEnd("Title", titleWidth)}  ${padEnd("Status", statusWidth)}  ${padEnd("Created", dateWidth)}`;
      const sep = `${"-".repeat(idWidth)}  ${"-".repeat(titleWidth)}  ${"-".repeat(statusWidth)}  ${"-".repeat(dateWidth)}`;

      console.log(header);
      console.log(sep);

      for (const task of sorted) {
        console.log(
          `${padEnd(task.id, idWidth)}  ${padEnd(task.description, titleWidth)}  ${padEnd(task.status, statusWidth)}  ${padEnd(formatDate(task.createdAt), dateWidth)}`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

function isValidStatus(s?: string): s is TaskStatus {
  return s === "todo" || s === "doing" || s === "done";
}
