import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
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

const LINE_REGEX = /^- \[([ /x])\] (.+)$/;

export class MarkdownProvider implements StorageProvider {
  private tasksDir: string;

  constructor(vaultPath: string) {
    this.tasksDir = join(vaultPath, "tasks");
  }

  async createTask(input: { description: string }): Promise<Task> {
    const tasks = await this.readTasks();
    const id = this.nextId(tasks);
    const task: Task = {
      id,
      description: input.description,
      status: "todo",
      createdAt: new Date().toISOString(),
    };
    await this.writeTaskFile(task);
    return task;
  }

  async getTaskById(id: string): Promise<Task | null> {
    const filePath = join(this.tasksDir, `${id}.md`);
    try {
      const content = await readFile(filePath, "utf-8");
      return this.parseFile(content, id);
    } catch (err: unknown) {
      if (isNotFoundError(err)) return null;
      throw err;
    }
  }

  async updateTask(
    id: string,
    input: { description?: string; status?: TaskStatus },
  ): Promise<Task> {
    const existing = await this.getTaskById(id);
    if (!existing) {
      throw new Error(`Task not found: ${id}`);
    }
    const updated: Task = {
      ...existing,
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status }),
    };
    await this.writeTaskFile(updated);
    return updated;
  }

  async deleteTask(id: string): Promise<void> {
    const filePath = join(this.tasksDir, `${id}.md`);
    try {
      await rm(filePath);
    } catch (err: unknown) {
      if (isNotFoundError(err)) {
        throw new Error(`Task not found: ${id}`, { cause: err });
      }
      throw err;
    }
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
      const files = await readdir(this.tasksDir);
      const mdFiles = files.filter((f) => f.endsWith(".md")).sort();
      const tasks: Task[] = [];
      for (const file of mdFiles) {
        const id = file.replace(/\.md$/, "");
        const content = await readFile(join(this.tasksDir, file), "utf-8");
        const task = this.parseFile(content, id);
        if (task) tasks.push(task);
      }
      return tasks;
    } catch (err: unknown) {
      if (isNotFoundError(err)) {
        return [];
      }
      throw err;
    }
  }

  private async writeTaskFile(task: Task): Promise<void> {
    const content = this.formatFile(task);
    await mkdir(this.tasksDir, { recursive: true });
    await writeFile(join(this.tasksDir, `${task.id}.md`), content, "utf-8");
  }

  private parseFile(content: string, id: string): Task | null {
    const frontMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontMatch) return null;

    const frontmatter: Record<string, string> = {};
    for (const line of frontMatch[1].split("\n")) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      frontmatter[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }

    const body = frontMatch[2].trim();
    const taskMatch = body.match(LINE_REGEX);
    if (!taskMatch) return null;

    const [, marker, description] = taskMatch;
    const status = MARKER_STATUS[marker];
    if (!status) return null;

    return {
      id,
      description,
      status,
      createdAt: frontmatter.created ?? "",
    };
  }

  private formatFile(task: Task): string {
    const marker = STATUS_MARKER[task.status];
    return `---\nid: ${task.id}\nstatus: ${task.status}\ncreated: ${task.createdAt}\n---\n- [${marker}] ${task.description}\n`;
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
