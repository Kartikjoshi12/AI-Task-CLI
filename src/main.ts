import { Command } from "commander";
import { initCommand } from "./commands/init.js";

export function createProgram(): Command {
  const program = new Command();

  program.name("task").description("AI-first task management from the terminal").version("1.0.0");

  program.addCommand(initCommand);

  return program;
}
