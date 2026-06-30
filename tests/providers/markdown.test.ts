import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { MarkdownProvider } from "../../src/providers/markdown.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "task-test-"));
}

function taskFile(dir: string, id: string): string {
  return join(dir, "tasks", `${id}.md`);
}

function writeTask(dir: string, id: string, content: string): void {
  const d = join(dir, "tasks");
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, `${id}.md`), content, "utf-8");
}

function readTask(dir: string, id: string): string {
  return readFileSync(taskFile(dir, id), "utf-8");
}

function makeTask(
  id: string,
  status: string,
  desc: string,
  created?: string,
  updated?: string,
  tags?: string,
  completed?: string,
): string {
  let front = `id: ${id}\nstatus: ${status}\ncreated: ${created ?? ""}\nupdated: ${updated ?? created ?? ""}`;
  if (tags) front += `\ntags: ${tags}`;
  if (completed) front += `\ncompleted: ${completed}`;
  return `---\n${front}\n---\n${desc}\n`;
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
    it("creates a task and writes it to a file in tasks/", async () => {
      const task = await provider.createTask({ description: "Buy groceries" });

      expect(task.id).toBe("task-1");
      expect(task.description).toBe("Buy groceries");
      expect(task.status).toBe("todo");
      expect(task.tags).toBe("");
      expect(task.content).toBe("");
      expect(task.completedAt).toBe("");

      const file = taskFile(dir, "task-1");
      expect(existsSync(file)).toBe(true);
      const content = readFileSync(file, "utf-8");
      expect(content).toContain("- [ ] Buy groceries");
      expect(content).toContain("id: task-1");
      expect(content).toContain("status: todo");
    });

    it("assigns created and updated timestamps on creation", async () => {
      const task = await provider.createTask({ description: "Timed task" });

      expect(task.createdAt).toBeTruthy();
      expect(() => new Date(task.createdAt)).not.toThrow();
      expect(new Date(task.createdAt).getTime()).not.toBeNaN();

      expect(task.updatedAt).toBe(task.createdAt);
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
      expect(updated.updatedAt).not.toBe(task.updatedAt);
      expect(updated.completedAt).toBeTruthy();

      const content = readFileSync(taskFile(dir, "task-1"), "utf-8");
      expect(content).toContain("- [x] Do something");
      expect(content).toContain("status: done");
      expect(content).toContain(`completed: ${updated.completedAt}`);
    });

    it("sets completedAt when marking a task done", async () => {
      const task = await provider.createTask({ description: "Finish me" });
      const updated = await provider.updateTask(task.id, { status: "done" });

      expect(updated.completedAt).toBeTruthy();
      expect(() => new Date(updated.completedAt)).not.toThrow();
      expect(new Date(updated.completedAt).getTime()).not.toBeNaN();
    });

    it("clears completedAt when moving a done task back to todo", async () => {
      const task = await provider.createTask({ description: "Reopen me" });
      await provider.updateTask(task.id, { status: "done" });

      const reopened = await provider.updateTask(task.id, { status: "todo" });

      expect(reopened.completedAt).toBe("");
    });

    it("preserves completedAt when updating description of a done task", async () => {
      const task = await provider.createTask({ description: "Old desc" });
      const done = await provider.updateTask(task.id, { status: "done" });
      const completedAt = done.completedAt;

      const updated = await provider.updateTask(task.id, { description: "New desc" });

      expect(updated.completedAt).toBe(completedAt);
    });

    it("updates the task description", async () => {
      const task = await provider.createTask({ description: "Old" });
      const updated = await provider.updateTask(task.id, { description: "New" });

      expect(updated.description).toBe("New");
      expect(updated.status).toBe("todo");

      const content = readFileSync(taskFile(dir, "task-1"), "utf-8");
      expect(content).toContain("- [ ] New");
    });

    it("updates tags", async () => {
      const task = await provider.createTask({ description: "Task with tags" });
      const updated = await provider.updateTask(task.id, {
        tags: "bug, backend",
      });

      expect(updated.tags).toBe("bug, backend");

      const content = readFileSync(taskFile(dir, "task-1"), "utf-8");
      expect(content).toContain("tags: bug, backend");
    });

    it("updates content", async () => {
      const task = await provider.createTask({ description: "Task with content" });
      const updated = await provider.updateTask(task.id, {
        content: "Some notes here.",
      });

      expect(updated.content).toBe("Some notes here.");

      const content = readFileSync(taskFile(dir, "task-1"), "utf-8");
      expect(content).toContain("Some notes here.");
    });

    it("throws for a non-existent task", async () => {
      await expect(provider.updateTask("task-999", { status: "done" })).rejects.toThrow(
        "Task not found: task-999",
      );
    });
  });

  describe("deleteTask", () => {
    it("deletes a task file from the tasks directory", async () => {
      const task = await provider.createTask({ description: "Delete me" });
      await provider.deleteTask(task.id);

      const found = await provider.getTaskById(task.id);
      expect(found).toBeNull();
      expect(existsSync(taskFile(dir, task.id))).toBe(false);
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
    it("reads existing tasks from pre-populated files", async () => {
      writeTask(dir, "task-1", makeTask("task-1", "todo", "- [ ] Buy milk", "2024-01-01T00:00:00Z"));
      writeTask(dir, "task-2", makeTask("task-2", "done", "- [x] Pay bills", "2024-01-02T00:00:00Z", "2024-01-03T00:00:00Z", undefined, "2024-01-03T00:00:00Z"));
      writeTask(dir, "task-3", makeTask("task-3", "doing", "- [/] Write docs", "2024-01-03T00:00:00Z"));

      const tasks = await provider.listTasks();
      expect(tasks).toHaveLength(3);

      expect(tasks[0]).toMatchObject({ id: "task-1", description: "Buy milk", status: "todo" });
      expect(tasks[1]).toMatchObject({ id: "task-2", description: "Pay bills", status: "done", completedAt: "2024-01-03T00:00:00Z" });
      expect(tasks[2]).toMatchObject({ id: "task-3", description: "Write docs", status: "doing" });
    });

    it("parses created timestamp from file frontmatter", async () => {
      writeTask(
        dir,
        "task-1",
        makeTask("task-1", "todo", "- [ ] Buy milk", "2024-06-01T10:00:00.000Z"),
      );
      writeTask(
        dir,
        "task-2",
        makeTask("task-2", "done", "- [x] Pay bills", "2024-06-02T14:30:00.000Z"),
      );

      const tasks = await provider.listTasks();
      expect(tasks[0].createdAt).toBe("2024-06-01T10:00:00.000Z");
      expect(tasks[1].createdAt).toBe("2024-06-02T14:30:00.000Z");
    });

    it("sets createdAt to empty string when no frontmatter created field", async () => {
      writeTask(dir, "task-5", makeTask("task-5", "todo", "- [ ] Legacy task"));
      const tasks = await provider.listTasks();
      expect(tasks[0].createdAt).toBe("");
    });

    it("parses completedAt from frontmatter", async () => {
      writeTask(
        dir,
        "task-1",
        makeTask(
          "task-1",
          "done",
          "- [x] Done task",
          "2024-01-01T00:00:00Z",
          "2024-01-02T00:00:00Z",
          undefined,
          "2024-01-02T00:00:00Z",
        ),
      );

      const tasks = await provider.listTasks();
      expect(tasks[0].completedAt).toBe("2024-01-02T00:00:00Z");
    });

    it("sets completedAt to empty string when no frontmatter completed field", async () => {
      writeTask(dir, "task-1", makeTask("task-1", "todo", "- [ ] No completed"));
      const tasks = await provider.listTasks();
      expect(tasks[0].completedAt).toBe("");
    });

    it("ignores malformed files", async () => {
      writeTask(dir, "task-1", makeTask("task-1", "todo", "- [ ] Valid task", "2024-01-01T00:00:00Z"));
      writeTask(dir, "bad-file", "this is not a valid task file");
      writeTask(dir, "task-3", "no frontmatter here");

      const tasks = await provider.listTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe("task-1");
    });

    it("returns an empty list when the tasks directory does not exist", async () => {
      const tasks = await provider.listTasks();
      expect(tasks).toHaveLength(0);
    });
  });
});
