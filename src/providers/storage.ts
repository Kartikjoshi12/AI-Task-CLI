import type { Task, TaskStatus } from "../types/task.js";

export interface TaskFilter {
  status?: TaskStatus;
  keyword?: string;
  project?: string;
}

export interface StorageProvider {
  createTask(input: { description: string }): Promise<Task>;
  getTaskById(id: string): Promise<Task | null>;
  updateTask(
    id: string,
    input: {
      description?: string;
      status?: TaskStatus;
      tags?: string;
      content?: string;
      project?: string;
    },
  ): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  listTasks(filter?: TaskFilter): Promise<Task[]>;
}
