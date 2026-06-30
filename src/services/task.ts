import type { Task, TaskStatus, TaskPriority } from "../types/task.js";
import type { StorageProvider } from "../providers/storage.js";

export class TaskServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskServiceError";
  }
}

export class TaskService {
  constructor(private storage: StorageProvider) {}

  async createTask(input: {
    title: string;
    project?: string;
    assignee?: string;
    due?: string;
    priority?: TaskPriority;
    tags?: string;
    content?: string;
    dependsOn?: string;
    recurring?: string;
  }): Promise<Task> {
    const title = input.title.trim();
    if (!title) {
      throw new TaskServiceError("Task description cannot be empty");
    }
    const fields: Record<string, unknown> = {};
    if (input.project !== undefined) fields.project = input.project;
    if (input.assignee !== undefined) fields.assignee = input.assignee;
    if (input.due !== undefined) fields.due = input.due;
    if (input.priority !== undefined) fields.priority = input.priority;
    if (input.tags !== undefined) fields.tags = input.tags;
    if (input.content !== undefined) fields.content = input.content;
    if (input.dependsOn !== undefined) fields.dependsOn = input.dependsOn;
    if (input.recurring !== undefined) fields.recurring = input.recurring;
    return this.storage.createTask({ title, ...fields });
  }

  async getTask(id: string): Promise<Task> {
    const trimmed = id.trim();
    if (!trimmed) {
      throw new TaskServiceError("Task ID is required");
    }
    const task = await this.storage.getTaskById(trimmed);
    if (!task) {
      throw new TaskServiceError(`Task not found: ${trimmed}`);
    }
    return task;
  }

  async markDone(id: string): Promise<{ task: Task; alreadyDone: boolean }> {
    const task = await this.getTask(id);
    if (task.status === "done") {
      return { task, alreadyDone: true };
    }
    const updated = await this.storage.updateTask(id, { status: "done" });
    return { task: updated, alreadyDone: false };
  }

  async updateTask(
    id: string,
    input: {
      title?: string;
      content?: string;
      tags?: string;
      status?: TaskStatus;
      project?: string;
    },
  ): Promise<Task> {
    const trimmed = id.trim();
    if (!trimmed) {
      throw new TaskServiceError("Task ID is required");
    }
    await this.getTask(trimmed); // ensure exists

    if (input.title !== undefined) {
      const val = input.title.trim();
      if (!val) {
        throw new TaskServiceError("Title cannot be empty");
      }
      input = { ...input, title: val };
    }

    if (input.tags !== undefined) {
      const val = input.tags.trim();
      if (!val) {
        throw new TaskServiceError("Tags cannot be empty");
      }
      input = { ...input, tags: val.replace(/\s*,\s*/g, ", ") };
    }

    const updates: Record<string, unknown> = {};
    if (input.title !== undefined) updates.title = input.title;
    if (input.content !== undefined) updates.content = input.content;
    if (input.tags !== undefined) updates.tags = input.tags;
    if (input.status !== undefined) updates.status = input.status;
    if (input.project !== undefined) updates.project = input.project;

    return this.storage.updateTask(trimmed, updates);
  }

  async deleteTask(id: string): Promise<void> {
    const trimmed = id.trim();
    if (!trimmed) {
      throw new TaskServiceError("Task ID is required");
    }
    await this.getTask(trimmed); // ensure exists before deleting
    await this.storage.deleteTask(trimmed);
  }

  async listTasks(filter?: {
    status?: TaskStatus;
    keyword?: string;
    project?: string;
  }): Promise<Task[]> {
    return this.storage.listTasks(filter);
  }
}
