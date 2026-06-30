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
});
