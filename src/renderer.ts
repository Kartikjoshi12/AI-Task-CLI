import type { Task } from "./types/task.js";

function padEnd(s: string, n: number): string {
  return s + " ".repeat(Math.max(0, n - s.length));
}

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

export class Renderer {
  success(message: string): void {
    console.log(message);
  }

  error(message: string): void {
    console.error(`Error: ${message}`);
  }

  message(message: string): void {
    console.log(message);
  }

  taskTable(tasks: Task[]): void {
    if (tasks.length === 0) return;

    const sorted = [...tasks].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const idWidth = Math.max(4, ...sorted.map((t) => t.id.length));
    const titleWidth = Math.max(5, ...sorted.map((t) => t.title.length));
    const statusWidth = 6;
    const dateWidth = 10;

    const header = `${padEnd("ID", idWidth)}  ${padEnd("Title", titleWidth)}  ${padEnd("Status", statusWidth)}  ${padEnd("Created", dateWidth)}`;
    const sep = `${"-".repeat(idWidth)}  ${"-".repeat(titleWidth)}  ${"-".repeat(statusWidth)}  ${"-".repeat(dateWidth)}`;

    console.log(header);
    console.log(sep);

    for (const task of sorted) {
      console.log(
        `${padEnd(task.id, idWidth)}  ${padEnd(task.title, titleWidth)}  ${padEnd(task.status, statusWidth)}  ${padEnd(formatDate(task.createdAt), dateWidth)}`,
      );
    }
  }

  taskDetail(task: Task): void {
    console.log(`ID:      ${task.id}`);
    console.log(`Title:   ${task.title}`);
    console.log(`Status:  ${task.status}`);
    console.log(`Created: ${formatDate(task.createdAt)}`);
    console.log(`Updated: ${formatDate(task.updatedAt)}`);
    if (task.completedAt) {
      console.log(`Completed: ${formatDate(task.completedAt)}`);
    }
    if (task.project) {
      console.log(`Project: ${task.project}`);
    }
    if (task.priority && task.priority !== "none") {
      console.log(`Priority: ${task.priority}`);
    }

    const tags = formatTags(task.tags);
    if (tags) {
      console.log(`Tags:    ${tags}`);
    }

    if (task.content) {
      console.log("");
      console.log(task.content);
    }

    const marker = task.status === "done" ? "x" : task.status === "doing" ? "/" : " ";
    console.log("");
    console.log(`- [${marker}] ${task.title}`);
  }

  stats(total: number, pending: number, completed: number): void {
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    console.log(`Total:       ${total}`);
    console.log(`Pending:     ${pending}`);
    console.log(`Completed:   ${completed}`);
    console.log(`Completion:  ${pct}%`);
  }
}
