import type { Task } from "./types/task.js";

export function formatDate(iso: string): string {
  if (!iso) return "-";
  return iso.slice(0, 10);
}

export function padEnd(s: string, n: number): string {
  return s + " ".repeat(Math.max(0, n - s.length));
}

export function printTaskTable(tasks: Task[]): void {
  if (tasks.length === 0) return;

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
}
