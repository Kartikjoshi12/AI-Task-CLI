import { describe, it, expect } from "vitest";
import { createProgram } from "../src/main.js";

describe("CLI scaffold", () => {
  const program = createProgram();

  it("has the correct name", () => {
    expect(program.name()).toBe("task");
  });

  it("has a description", () => {
    expect(program.description()).toBeTruthy();
  });

  it("has the correct version", () => {
    expect(program.version()).toBe("1.0.0");
  });

  it("registers the init command", () => {
    const cmd = program.commands.find((c) => c.name() === "init");
    expect(cmd).toBeDefined();
  });

  it("init command has a description", () => {
    const cmd = program.commands.find((c) => c.name() === "init");
    expect(cmd?.description()).toBeTruthy();
  });

  it("registers the add command", () => {
    const cmd = program.commands.find((c) => c.name() === "add");
    expect(cmd).toBeDefined();
  });

  it("add command has a description", () => {
    const cmd = program.commands.find((c) => c.name() === "add");
    expect(cmd?.description()).toBeTruthy();
  });

  it("registers the list command", () => {
    const cmd = program.commands.find((c) => c.name() === "list");
    expect(cmd).toBeDefined();
  });

  it("list command has a description", () => {
    const cmd = program.commands.find((c) => c.name() === "list");
    expect(cmd?.description()).toBeTruthy();
  });

  it("list command has a --status option", () => {
    const cmd = program.commands.find((c) => c.name() === "list");
    const opt = cmd?.options.find((o) => o.long === "--status");
    expect(opt).toBeDefined();
  });

  it("registers the show command", () => {
    const cmd = program.commands.find((c) => c.name() === "show");
    expect(cmd).toBeDefined();
  });

  it("show command has a description", () => {
    const cmd = program.commands.find((c) => c.name() === "show");
    expect(cmd?.description()).toBeTruthy();
  });

  it("show command help mentions the task-id argument", () => {
    const cmd = program.commands.find((c) => c.name() === "show");
    const help = cmd?.helpInformation() ?? "";
    expect(help).toContain("task-id");
  });

  it("registers the update command", () => {
    const cmd = program.commands.find((c) => c.name() === "update");
    expect(cmd).toBeDefined();
  });

  it("update command has a description", () => {
    const cmd = program.commands.find((c) => c.name() === "update");
    expect(cmd?.description()).toBeTruthy();
  });

  it("update command has a --title option", () => {
    const cmd = program.commands.find((c) => c.name() === "update");
    const opt = cmd?.options.find((o) => o.long === "--title");
    expect(opt).toBeDefined();
  });

  it("update command has a --content option", () => {
    const cmd = program.commands.find((c) => c.name() === "update");
    const opt = cmd?.options.find((o) => o.long === "--content");
    expect(opt).toBeDefined();
  });

  it("update command has a --tags option", () => {
    const cmd = program.commands.find((c) => c.name() === "update");
    const opt = cmd?.options.find((o) => o.long === "--tags");
    expect(opt).toBeDefined();
  });

  it("registers the done command", () => {
    const cmd = program.commands.find((c) => c.name() === "done");
    expect(cmd).toBeDefined();
  });

  it("done command has a description", () => {
    const cmd = program.commands.find((c) => c.name() === "done");
    expect(cmd?.description()).toBeTruthy();
  });

  it("done command help mentions the task-id argument", () => {
    const cmd = program.commands.find((c) => c.name() === "done");
    const help = cmd?.helpInformation() ?? "";
    expect(help).toContain("task-id");
  });

  it("registers the delete command", () => {
    const cmd = program.commands.find((c) => c.name() === "delete");
    expect(cmd).toBeDefined();
  });

  it("delete command has a description", () => {
    const cmd = program.commands.find((c) => c.name() === "delete");
    expect(cmd?.description()).toBeTruthy();
  });

  it("delete command has a --force option", () => {
    const cmd = program.commands.find((c) => c.name() === "delete");
    const opt = cmd?.options.find((o) => o.long === "--force");
    expect(opt).toBeDefined();
  });

  it("delete command help mentions the task-id argument", () => {
    const cmd = program.commands.find((c) => c.name() === "delete");
    const help = cmd?.helpInformation() ?? "";
    expect(help).toContain("task-id");
  });

  it("registers the search command", () => {
    const cmd = program.commands.find((c) => c.name() === "search");
    expect(cmd).toBeDefined();
  });

  it("search command has a description", () => {
    const cmd = program.commands.find((c) => c.name() === "search");
    expect(cmd?.description()).toBeTruthy();
  });

  it("search command has a --status option", () => {
    const cmd = program.commands.find((c) => c.name() === "search");
    const opt = cmd?.options.find((o) => o.long === "--status");
    expect(opt).toBeDefined();
  });

  it("search command help mentions the query argument", () => {
    const cmd = program.commands.find((c) => c.name() === "search");
    const help = cmd?.helpInformation() ?? "";
    expect(help).toContain("query");
  });

  it("registers the pending command", () => {
    const cmd = program.commands.find((c) => c.name() === "pending");
    expect(cmd).toBeDefined();
  });

  it("pending command has a description", () => {
    const cmd = program.commands.find((c) => c.name() === "pending");
    expect(cmd?.description()).toBeTruthy();
  });

  it("registers the completed command", () => {
    const cmd = program.commands.find((c) => c.name() === "completed");
    expect(cmd).toBeDefined();
  });

  it("completed command has a description", () => {
    const cmd = program.commands.find((c) => c.name() === "completed");
    expect(cmd?.description()).toBeTruthy();
  });

  it("registers the today command", () => {
    const cmd = program.commands.find((c) => c.name() === "today");
    expect(cmd).toBeDefined();
  });

  it("today command has a description", () => {
    const cmd = program.commands.find((c) => c.name() === "today");
    expect(cmd?.description()).toBeTruthy();
  });

  it("registers the stats command", () => {
    const cmd = program.commands.find((c) => c.name() === "stats");
    expect(cmd).toBeDefined();
  });

  it("stats command has a description", () => {
    const cmd = program.commands.find((c) => c.name() === "stats");
    expect(cmd?.description()).toBeTruthy();
  });
});
