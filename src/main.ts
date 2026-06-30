import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { addCommand } from "./commands/add.js";
import { listCommand } from "./commands/list.js";
import { showCommand } from "./commands/show.js";
import { updateCommand } from "./commands/update.js";
import { doneCommand } from "./commands/done.js";
import { deleteCommand } from "./commands/delete.js";
import { searchCommand } from "./commands/search.js";
import { pendingCommand } from "./commands/pending.js";
import { completedCommand } from "./commands/completed.js";
import { todayCommand } from "./commands/today.js";
import { statsCommand } from "./commands/stats.js";
import { workspaceCommand } from "./commands/workspace.js";
import { projectCommand } from "./commands/project.js";

export function createProgram(): Command {
  const program = new Command();

  program.name("task").description("AI-first task management from the terminal").version("1.0.0");

  program.addCommand(initCommand);
  program.addCommand(addCommand);
  program.addCommand(listCommand);
  program.addCommand(showCommand);
  program.addCommand(updateCommand);
  program.addCommand(doneCommand);
  program.addCommand(deleteCommand);
  program.addCommand(searchCommand);
  program.addCommand(pendingCommand);
  program.addCommand(completedCommand);
  program.addCommand(todayCommand);
  program.addCommand(statsCommand);
  program.addCommand(workspaceCommand);
  program.addCommand(projectCommand);

  return program;
}
