import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { MarkdownProvider } from "../../src/providers/markdown.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "task-test-"));
}

describe("MarkdownProvider", () => {
  let dir: string;
  let provider: MarkdownProvider;

  beforeEach(() => {
    dir = tempDir();
    provider = new MarkdownProvider(dir);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  describe("createTask", () => {
    it("creates a task and writes it to a file", async () => {
      const task = await provider.createTask({ description: "Buy groceries" });

      expect(task.id).toBe("task-1");
      expect(task.description).toBe("Buy groceries");
      expect(task.status).toBe("todo");

      const content = readFileSync(join(dir, "tasks.md"), "utf-8");
      expect(content).toContain("- [ ] Buy groceries #task-1");
    });

    it("auto-increments task IDs", async () => {
      const t1 = await provider.createTask({ description: "First" });
      const t2 = await provider.createTask({ description: "Second" });

      expect(t1.id).toBe("task-1");
      expect(t2.id).toBe("task-2");
    });
  });

  describe("getTaskById", () => {
    it("returns a task by its ID", async () => {
      const created = await provider.createTask({ description: "Find task" });
      const found = await provider.getTaskById(created.id);

      expect(found).toEqual(created);
    });

    it("returns null for a non-existent task", async () => {
      const found = await provider.getTaskById("task-999");
      expect(found).toBeNull();
    });
  });

  describe("updateTask", () => {
    it("updates the task status", async () => {
      const task = await provider.createTask({ description: "Do something" });
      const updated = await provider.updateTask(task.id, { status: "done" });

      expect(updated.status).toBe("done");
      expect(updated.description).toBe("Do something");

      const content = readFileSync(join(dir, "tasks.md"), "utf-8");
      expect(content).toContain("- [x] Do something #task-1");
    });

    it("updates the task description", async () => {
      const task = await provider.createTask({ description: "Old" });
      const updated = await provider.updateTask(task.id, { description: "New" });

      expect(updated.description).toBe("New");
      expect(updated.status).toBe("todo");

      const content = readFileSync(join(dir, "tasks.md"), "utf-8");
      expect(content).toContain("- [ ] New #task-1");
    });

    it("throws for a non-existent task", async () => {
      await expect(provider.updateTask("task-999", { status: "done" })).rejects.toThrow(
        "Task not found: task-999",
      );
    });
  });

  describe("deleteTask", () => {
    it("deletes a task from the file", async () => {
      const task = await provider.createTask({ description: "Delete me" });
      await provider.deleteTask(task.id);

      const found = await provider.getTaskById(task.id);
      expect(found).toBeNull();
    });

    it("throws for a non-existent task", async () => {
      await expect(provider.deleteTask("task-999")).rejects.toThrow("Task not found: task-999");
    });
  });

  describe("listTasks", () => {
    it("returns all tasks when no filter is given", async () => {
      await provider.createTask({ description: "A" });
      await provider.createTask({ description: "B" });

      const tasks = await provider.listTasks();
      expect(tasks).toHaveLength(2);
    });

    it("filters by status", async () => {
      const t1 = await provider.createTask({ description: "Todo task" });
      await provider.updateTask(t1.id, { status: "done" });
      await provider.createTask({ description: "Another todo" });

      const todos = await provider.listTasks({ status: "todo" });
      expect(todos).toHaveLength(1);
      expect(todos[0].description).toBe("Another todo");

      const dones = await provider.listTasks({ status: "done" });
      expect(dones).toHaveLength(1);
      expect(dones[0].description).toBe("Todo task");
    });

    it("filters by keyword", async () => {
      await provider.createTask({ description: "Fix login bug" });
      await provider.createTask({ description: "Add tests" });

      const results = await provider.listTasks({ keyword: "login" });
      expect(results).toHaveLength(1);
      expect(results[0].description).toBe("Fix login bug");
    });

    it("combines status and keyword filters", async () => {
      const t1 = await provider.createTask({ description: "Fix login bug" });
      await provider.updateTask(t1.id, { status: "done" });
      await provider.createTask({ description: "Fix logout bug" });

      const results = await provider.listTasks({ status: "done", keyword: "login" });
      expect(results).toHaveLength(1);
    });
  });

  describe("file format", () => {
    it("reads existing tasks from a pre-populated file", async () => {
      writeFileSync(
        join(dir, "tasks.md"),
        "- [ ] Buy milk #task-1\n- [x] Pay bills #task-2\n- [/] Write docs #task-3\n",
      );

      const tasks = await provider.listTasks();
      expect(tasks).toHaveLength(3);

      expect(tasks[0]).toMatchObject({ id: "task-1", description: "Buy milk", status: "todo" });
      expect(tasks[1]).toMatchObject({ id: "task-2", description: "Pay bills", status: "done" });
      expect(tasks[2]).toMatchObject({ id: "task-3", description: "Write docs", status: "doing" });
    });

    it("ignores malformed lines", async () => {
      writeFileSync(
        join(dir, "tasks.md"),
        "- [ ] Valid task #task-1\nThis is not a task\n- [invalid] Broken #task-2\n- [ ] #task-3\n",
      );

      const tasks = await provider.listTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe("task-1");
    });

    it("returns an empty list when the file does not exist", async () => {
      const tasks = await provider.listTasks();
      expect(tasks).toHaveLength(0);
    });
  });
});
