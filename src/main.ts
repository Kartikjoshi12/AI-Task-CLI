import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { addCommand } from "./commands/add.js";
import { listCommand } from "./commands/list.js";
import { showCommand } from "./commands/show.js";

export function createProgram(): Command {
  const program = new Command();

  program.name("task").description("AI-first task management from the terminal").version("1.0.0");

  program.addCommand(initCommand);
  program.addCommand(addCommand);
  program.addCommand(listCommand);
  program.addCommand(showCommand);

  return program;
}
