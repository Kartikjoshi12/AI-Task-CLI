import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Task, TaskStatus } from "../types/task.js";
import type { StorageProvider, TaskFilter } from "./storage.js";

const STATUS_MARKER: Record<TaskStatus, string> = {
  todo: " ",
  doing: "/",
  done: "x",
};

const MARKER_STATUS: Record<string, TaskStatus> = {
  " ": "todo",
  "/": "doing",
  x: "done",
};

const LINE_REGEX = /^- \[([ /x])\] (.+) #(task-\d+)$/;

export class MarkdownProvider implements StorageProvider {
  private filePath: string;

  constructor(vaultPath: string) {
    this.filePath = join(vaultPath, "tasks.md");
  }

  async createTask(input: { description: string }): Promise<Task> {
    const tasks = await this.readTasks();
    const id = this.nextId(tasks);
    const task: Task = { id, description: input.description, status: "todo" };
    tasks.push(task);
    await this.writeTasks(tasks);
    return task;
  }

  async getTaskById(id: string): Promise<Task | null> {
    const tasks = await this.readTasks();
    return tasks.find((t) => t.id === id) ?? null;
  }

  async updateTask(
    id: string,
    input: { description?: string; status?: TaskStatus },
  ): Promise<Task> {
    const tasks = await this.readTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Task not found: ${id}`);
    }
    const updated: Task = {
      ...tasks[index],
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status }),
    };
    tasks[index] = updated;
    await this.writeTasks(tasks);
    return updated;
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = await this.readTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Task not found: ${id}`);
    }
    tasks.splice(index, 1);
    await this.writeTasks(tasks);
  }

  async listTasks(filter?: TaskFilter): Promise<Task[]> {
    let tasks = await this.readTasks();
    if (filter?.status) {
      tasks = tasks.filter((t) => t.status === filter.status);
    }
    if (filter?.keyword) {
      const lower = filter.keyword.toLowerCase();
      tasks = tasks.filter((t) => t.description.toLowerCase().includes(lower));
    }
    return tasks;
  }

  private async readTasks(): Promise<Task[]> {
    try {
      const content = await readFile(this.filePath, "utf-8");
      return content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => this.parseLine(line))
        .filter((t): t is Task => t !== null);
    } catch (err: unknown) {
      if (isNotFoundError(err)) {
        return [];
      }
      throw err;
    }
  }

  private async writeTasks(tasks: Task[]): Promise<void> {
    const lines = tasks.map((t) => this.formatLine(t));
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, lines.join("\n") + "\n", "utf-8");
  }

  private parseLine(line: string): Task | null {
    const match = line.match(LINE_REGEX);
    if (!match) return null;
    const [, marker, description, id] = match;
    const status = MARKER_STATUS[marker];
    if (!status) return null;
    return { id, description, status };
  }

  private formatLine(task: Task): string {
    const marker = STATUS_MARKER[task.status];
    return `- [${marker}] ${task.description} #${task.id}`;
  }

  private nextId(tasks: Task[]): string {
    let max = 0;
    for (const t of tasks) {
      const num = parseInt(t.id.replace("task-", ""), 10);
      if (num > max) max = num;
    }
    return `task-${max + 1}`;
  }
}

function isNotFoundError(err: unknown): err is NodeJS.ErrnoException {
  return (
    typeof err === "object" && err !== null && (err as NodeJS.ErrnoException).code === "ENOENT"
  );
}
