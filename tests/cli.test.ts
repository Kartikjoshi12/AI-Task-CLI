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
});
