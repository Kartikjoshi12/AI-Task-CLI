import type { Task, TaskStatus, TaskPriority } from "../types/task.js";

export interface TaskFilter {
  status?: TaskStatus;
  keyword?: string;
  project?: string;
}

export interface CreateTaskInput {
  title: string;
  project?: string;
  assignee?: string;
  due?: string;
  priority?: TaskPriority;
  tags?: string;
  content?: string;
  dependsOn?: string;
  recurring?: string;
}

export interface UpdateTaskInput {
  title?: string;
  content?: string;
  status?: TaskStatus;
  tags?: string;
  project?: string;
}

export interface StorageProvider {
  createTask(input: CreateTaskInput): Promise<Task>;
  getTaskById(id: string): Promise<Task | null>;
  updateTask(id: string, input: UpdateTaskInput): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  listTasks(filter?: TaskFilter): Promise<Task[]>;
}
